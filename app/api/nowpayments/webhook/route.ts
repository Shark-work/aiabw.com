import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { handlePayoutWebhook, isLikelyPayoutWebhook } from "@/lib/payout-webhook";
import { verifyNowPaymentsIpnSignature } from "@/lib/nowpayments";
import { fulfillAgentPurchase, isTerminalPaymentSuccess } from "@/lib/purchases";
import { settleTransactionRevenue } from "@/lib/settlement";
import { isProPlanSlug } from "@/lib/products";
import { activateProSubscription } from "@/lib/pro-subscription";
import type { Json } from "@/types/database.types";

type NowPaymentsWebhookBody = {
  order_id?: string;
  payment_status?: string;
  payment_id?: number;
  pay_amount?: string;
  pay_currency?: string;
  actually_paid?: string;
  price_amount?: string;
  price_currency?: string;
  invoice_url?: string;
  purchase_id?: string;
  order_description?: string;
  [key: string]: unknown;
};

const TERMINAL_FAILURE_STATUSES = new Set(["failed", "expired", "refunded"]);
const IN_PROGRESS_STATUSES = new Set(["sending", "waiting", "confirming", "partially_paid"]);

function mapSubscriptionStatus(paymentStatus: string) {
  if (isTerminalPaymentSuccess(paymentStatus)) return "active" as const;
  if (TERMINAL_FAILURE_STATUSES.has(paymentStatus)) return "canceled" as const;
  return null;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-nowpayments-sig");

    const isValid = await verifyNowPaymentsIpnSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid NOWPayments signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as NowPaymentsWebhookBody;
    const admin = createSupabaseAdminClient();

    if (isLikelyPayoutWebhook(body)) {
      const handled = await handlePayoutWebhook(admin, body);
      return NextResponse.json({ ok: true, payout: handled });
    }

    const orderId = body.order_id;
    const paymentStatus = body.payment_status;

    if (!orderId || !paymentStatus) {
      return NextResponse.json({ ok: false, error: "Missing order_id or payment_status" }, { status: 400 });
    }

    const { data: transaction, error: txError } = await admin
      .from("transactions")
      .select(
        "id, user_id, plan_slug, payment_status, provider_payment_id, order_type, agent_id, price_amount, referral_code, inviter_user_id"
      )
      .eq("order_id", orderId)
      .maybeSingle();

    if (txError) {
      return NextResponse.json({ ok: false, error: txError.message }, { status: 500 });
    }

    if (!transaction) {
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    }

    const alreadyHandledSameState =
      transaction.payment_status === paymentStatus &&
      String(transaction.provider_payment_id ?? "") === String(body.payment_id ?? "");

    if (alreadyHandledSameState) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const subscriptionStatus = mapSubscriptionStatus(paymentStatus);

    const transactionUpdate = {
      payment_status: paymentStatus as
        | "pending"
        | "confirming"
        | "confirmed"
        | "finished"
        | "failed"
        | "refunded"
        | "expired",
      raw: body as Json,
      provider_payment_id: body.payment_id ? String(body.payment_id) : transaction.provider_payment_id,
      pay_amount: body.pay_amount ?? null,
      pay_currency: body.pay_currency ?? null,
      invoice_url: body.invoice_url ?? null,
    };

    const { error: updateError } = await admin.from("transactions").update(transactionUpdate).eq("order_id", orderId);
    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    if (transaction.order_type === "agent") {
      await fulfillAgentPurchase(admin, {
        transaction: {
          id: transaction.id,
          user_id: transaction.user_id,
          agent_id: transaction.agent_id,
          order_type: transaction.order_type,
          payment_status: transaction.payment_status,
          price_amount: Number(transaction.price_amount),
          referral_code: transaction.referral_code,
          inviter_user_id: transaction.inviter_user_id,
        },
        newPaymentStatus: paymentStatus,
      });
    } else if (subscriptionStatus) {
      const planSlug = transaction.plan_slug;

      if (isProPlanSlug(planSlug)) {
        const result = await activateProSubscription(admin, {
          userId: transaction.user_id,
          planSlug,
          subscriptionStatus,
          providerPaymentId: String(body.payment_id ?? orderId),
          webhookPayload: body as Json,
        });

        if (!result.ok) {
          return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
        }
      } else {
        const { data: planRow, error: planError } = await admin
          .from("subscription_plans")
          .select("id")
          .eq("slug", planSlug)
          .maybeSingle();

        if (planError) {
          return NextResponse.json({ ok: false, error: planError.message }, { status: 500 });
        }

        if (planRow?.id) {
          const now = new Date();
          const currentPeriodEnd = new Date(now);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

          const { error: subError } = await admin.from("subscriptions").upsert(
            {
              user_id: transaction.user_id,
              plan_id: planRow.id,
              status: subscriptionStatus,
              provider: "nowpayments",
              provider_subscription_id: String(body.payment_id ?? orderId),
              current_period_start: now.toISOString(),
              current_period_end: subscriptionStatus === "active" ? currentPeriodEnd.toISOString() : null,
              canceled_at: subscriptionStatus === "canceled" ? now.toISOString() : null,
              metadata: body as Json,
            },
            { onConflict: "user_id" }
          );

          if (subError) {
            return NextResponse.json({ ok: false, error: subError.message }, { status: 500 });
          }
        }
      }

      if (subscriptionStatus === "active") {
        await settleTransactionRevenue(admin, transaction, paymentStatus);
      }
    }

    if (IN_PROGRESS_STATUSES.has(paymentStatus)) {
      // Keep transaction as-is; webhook can fire multiple times while the payment is pending.
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Webhook error" },
      { status: 500 }
    );
  }
}
