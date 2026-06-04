import { NextResponse } from "next/server";
import { createNowPaymentsPayment } from "@/lib/nowpayments";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { grantUserAgent } from "@/lib/purchases";
import { getAgentPriceUsdt, isAgentFree, isProPlanSlug, PRO_PLANS, type PayCurrency } from "@/lib/products";
import { resolveSubscriptionPlanSlug } from "@/lib/pro-subscription";
import { getInviterForUser, resolveInviteCode } from "@/lib/referral";
import { userOwnsAgent } from "@/lib/trial-quota";
import type { Json } from "@/types/database.types";

const LEGACY_PLANS: Record<string, { priceAmount: number; priceCurrency: string; description: string }> = {
  creator: { priceAmount: 19, priceCurrency: "USD", description: "Creator Plan - AIABW" },
  universe: { priceAmount: 49, priceCurrency: "USD", description: "Universe Plan - AIABW" },
};

const PAY_CURRENCIES = new Set<PayCurrency>(["usdttrc20", "usdterc20", "usdtbep20", "usdcerc20"]);

type CreateBody = {
  planSlug?: string;
  orderType?: "subscription" | "agent";
  agentSlug?: string;
  payCurrency?: string;
  referralCode?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody;
    const orderType = body.orderType === "agent" ? "agent" : "subscription";
    const payCurrency = PAY_CURRENCIES.has(body.payCurrency as PayCurrency)
      ? (body.payCurrency as PayCurrency)
      : "usdttrc20";

    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    let referralCode = body.referralCode?.trim().toLowerCase() || null;
    let inviterUserId: string | null = null;
    if (referralCode) {
      inviterUserId = await resolveInviteCode(admin, referralCode);
    }
    if (!inviterUserId) {
      inviterUserId = await getInviterForUser(admin, user.id);
      if (inviterUserId && !referralCode) referralCode = null;
    }

    if (orderType === "agent") {
      const agentSlug = body.agentSlug?.trim().toLowerCase();
      if (!agentSlug) {
        return NextResponse.json({ ok: false, error: "缺少 agentSlug" }, { status: 400 });
      }

      const { data: agent, error: agentError } = await admin
        .from("agents")
        .select("id, slug, name, metadata, status, visibility")
        .eq("slug", agentSlug)
        .eq("status", "active")
        .eq("visibility", "public")
        .maybeSingle();

      if (agentError || !agent) {
        return NextResponse.json({ ok: false, error: "Agent 不存在或已下架" }, { status: 404 });
      }

      const metadata = (agent.metadata ?? {}) as Record<string, unknown>;
      const alreadyOwns = await userOwnsAgent(admin, user.id, agent.id);
      if (alreadyOwns) {
        return NextResponse.json({ ok: false, error: "你已拥有该 Agent" }, { status: 400 });
      }

      const priceAmount = getAgentPriceUsdt(metadata);
      const free = isAgentFree(metadata);
      const orderId = `ag_${agent.slug}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const description = free
        ? `AIABW · 免费解锁 ${agent.name}`
        : `AIABW · 购买 Agent「${agent.name}」· ${priceAmount} USDT`;

      if (free) {
        const { data: tx, error: insertError } = await admin
          .from("transactions")
          .insert({
            user_id: user.id,
            plan_slug: agent.slug,
            order_type: "agent",
            agent_id: agent.id,
            provider: "nowpayments",
            payment_status: "finished",
            price_amount: 0,
            price_currency: "USD",
            order_id: orderId,
            order_description: description,
            referral_code: referralCode,
            inviter_user_id: inviterUserId,
            raw: { source: "free_unlock", agentSlug } as Json,
          })
          .select("id")
          .single();

        if (insertError || !tx) {
          return NextResponse.json({ ok: false, error: insertError?.message ?? "创建记录失败" }, { status: 500 });
        }

        await grantUserAgent(admin, { userId: user.id, agentId: agent.id, transactionId: tx.id });

        return NextResponse.json({
          ok: true,
          free: true,
          orderId,
          message: `已免费解锁「${agent.name}」`,
        });
      }

      const { data: pendingTx } = await admin
        .from("transactions")
        .select("id, order_id, invoice_url")
        .eq("user_id", user.id)
        .eq("agent_id", agent.id)
        .eq("order_type", "agent")
        .in("payment_status", ["pending", "confirming", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingTx?.invoice_url) {
        return NextResponse.json({
          ok: true,
          orderId: pendingTx.order_id,
          checkoutUrl: pendingTx.invoice_url,
          reused: true,
        });
      }

      const { error: insertError } = await admin.from("transactions").insert({
        user_id: user.id,
        plan_slug: agent.slug,
        order_type: "agent",
        agent_id: agent.id,
        provider: "nowpayments",
        payment_status: "pending",
        price_amount: priceAmount,
        price_currency: "USD",
        order_id: orderId,
        order_description: description,
        referral_code: referralCode,
        inviter_user_id: inviterUserId,
        raw: { source: "api_create", orderType: "agent", agentSlug } as Json,
      });

      if (insertError) {
        return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
      }

      const payment = await createNowPaymentsPayment({
        price_amount: priceAmount,
        price_currency: "USD",
        pay_currency: payCurrency,
        order_id: orderId,
        order_description: description,
        ipn_callback_url: `${appUrl}/api/nowpayments/webhook`,
        success_url: `${appUrl}/account/orders?payment=success&order_id=${orderId}`,
        cancel_url: `${appUrl}/agents/${agent.slug}?payment=cancelled`,
      });

      await admin
        .from("transactions")
        .update({
          provider_payment_id: String(payment.payment_id),
          payment_status: payment.payment_status as never,
          pay_amount: payment.pay_amount,
          pay_currency: payment.pay_currency,
          invoice_url: payment.invoice_url,
          raw: payment as unknown as Json,
        })
        .eq("order_id", orderId);

      return NextResponse.json({ ok: true, orderId, checkoutUrl: payment.invoice_url });
    }

    const resolvedSlug = resolveSubscriptionPlanSlug(body.planSlug);
    const legacySlug = (body.planSlug ?? "").toLowerCase();
    const proPlan = resolvedSlug ? PRO_PLANS[resolvedSlug] : null;
    const legacyPlan = LEGACY_PLANS[legacySlug];

    const plan = proPlan
      ? {
          priceAmount: proPlan.priceAmount,
          priceCurrency: proPlan.priceCurrency,
          description: proPlan.description,
        }
      : legacyPlan;

    const planSlug = proPlan ? resolvedSlug! : legacySlug;

    if (!plan || !planSlug) {
      return NextResponse.json({ ok: false, error: "Invalid planSlug — 请使用 pro_monthly / pro_yearly / plan=pro" }, { status: 400 });
    }

    const orderId = `pa_${planSlug}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error: insertError } = await admin.from("transactions").insert({
      user_id: user.id,
      plan_slug: planSlug,
      order_type: "subscription",
      provider: "nowpayments",
      payment_status: "pending",
      price_amount: plan.priceAmount,
      price_currency: plan.priceCurrency,
      order_id: orderId,
      order_description: plan.description,
      referral_code: referralCode,
      inviter_user_id: inviterUserId,
      raw: { source: "api_create", planSlug } as Json,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    const payment = await createNowPaymentsPayment({
      price_amount: plan.priceAmount,
      price_currency: plan.priceCurrency,
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: plan.description,
      ipn_callback_url: `${appUrl}/api/nowpayments/webhook`,
      success_url: `${appUrl}/account?payment=success&order_id=${orderId}&plan=${planSlug}`,
      cancel_url: `${appUrl}/checkout?plan=${planSlug}&payment=cancelled&order_id=${orderId}`,
    });

    const { error: updateError } = await admin
      .from("transactions")
      .update({
        provider_payment_id: String(payment.payment_id),
        payment_status: payment.payment_status as never,
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency,
        invoice_url: payment.invoice_url,
        raw: payment as unknown as Json,
      })
      .eq("order_id", orderId);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, orderId, checkoutUrl: payment.invoice_url });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
