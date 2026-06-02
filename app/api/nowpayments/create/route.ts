import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createNowPaymentsPayment } from "@/lib/nowpayments";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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
      userId: user.id,
      planSlug,
      provider: "nowpayments",
      paymentStatus: "pending",
      priceAmount: plan.priceAmount,
      priceCurrency: plan.priceCurrency,
      orderId,
      orderDescription: plan.description,
      raw: { source: "api_create", planSlug },
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
        providerPaymentId: String(payment.payment_id),
        paymentStatus: payment.payment_status as never,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency,
        invoiceUrl: payment.invoice_url,
        raw: payment as unknown as Record<string, unknown>,
      })
      .eq("orderId", orderId);

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
