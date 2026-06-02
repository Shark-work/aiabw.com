import { NextResponse } from "next/server";
import { createNowPaymentsPayment } from "@/lib/nowpayments";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Json } from "@/types/database.types";

const PLANS: Record<string, { priceAmount: number; priceCurrency: string; description: string }> = {
  creator: { priceAmount: 19, priceCurrency: "USD", description: "Creator Plan - PlayAgent Sphere" },
  universe: { priceAmount: 49, priceCurrency: "USD", description: "Universe Plan - PlayAgent Sphere" },
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { planSlug?: string };
    const planSlug = (body.planSlug ?? "creator").toLowerCase();

    const plan = PLANS[planSlug];
    if (!plan) {
      return NextResponse.json({ ok: false, error: "Invalid planSlug" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const orderId = `pa_${planSlug}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const admin = createSupabaseAdminClient();
    const { error: insertError } = await admin.from("transactions").insert({
      user_id: user.id,
      plan_slug: planSlug,
      provider: "nowpayments",
      payment_status: "pending",
      price_amount: plan.priceAmount,
      price_currency: plan.priceCurrency,
      order_id: orderId,
      order_description: plan.description,
      raw: { source: "api_create", planSlug } as Json,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    const payment = await createNowPaymentsPayment({
      price_amount: plan.priceAmount,
      price_currency: plan.priceCurrency,
      pay_currency: "usdttrc20",
      order_id: orderId,
      order_description: plan.description,
      ipn_callback_url: `${appUrl}/api/nowpayments/webhook`,
      success_url: `${appUrl}/account?payment=success&order_id=${orderId}`,
      cancel_url: `${appUrl}/checkout?payment=cancelled&order_id=${orderId}`,
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

    return NextResponse.json({ ok: true, orderId, payment, checkoutUrl: payment.invoice_url });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
