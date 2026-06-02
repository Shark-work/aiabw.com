import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { verifyNowPaymentsIpnSignature } from "@/lib/nowpayments";

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

const TERMINAL_SUCCESS_STATUSES = new Set([
  "finished",
  "confirmed",
  "confirmed_finished",
]);

const TERMINAL_FAILURE_STATUSES = new Set([
  "failed",
  "expired",
  "refunded",
]);

const IN_PROGRESS_STATUSES = new Set([
  "sending",
  "waiting",
  "confirming",
  "partially_paid",
]);

function mapSubscriptionStatus(paymentStatus: string) {
  if (TERMINAL_SUCCESS_STATUSES.has(paymentStatus)) return "active" as const;
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
    const orderId = body.order_id;
    const paymentStatus = body.payment_status;

    if (!orderId || !paymentStatus) {
      return NextResponse.json({ ok: false, error: "Missing order_id or payment_status" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: transaction, error: txError } = await admin
      .from("transactions")
      .select("id, userId, planSlug, paymentStatus, providerPaymentId")
      .eq("orderId", orderId)
      .maybeSingle();

    if (txError) {
      return NextResponse.json({ ok: false, error: txError.message }, { status: 500 });
    }

    if (!transaction) {
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 });
    }

    const alreadyHandledSameState =
      transaction.paymentStatus === paymentStatus &&
      String(transaction.providerPaymentId ?? "") === String(body.payment_id ?? "");

    if (alreadyHandledSameState) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const subscriptionStatus = mapSubscriptionStatus(paymentStatus);

    const transactionUpdate: Record<string, unknown> = {
      paymentStatus,
      raw: body,
      providerPaymentId: body.payment_id ? String(body.payment_id) : transaction.providerPaymentId,
      payAmount: body.pay_amount ?? undefined,
      payCurrency: body.pay_currency ?? undefined,
      invoiceUrl: body.invoice_url ?? undefined,
    };

    const { error: updateError } = await admin.from("transactions").update(transactionUpdate).eq("orderId", orderId);
    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    if (subscriptionStatus) {
      const { data: planRow, error: planError } = await admin
        .from("subscription_plans")
        .select("id")
        .eq("slug", transaction.planSlug)
        .maybeSingle();

      if (planError) {
        return NextResponse.json({ ok: false, error: planError.message }, { status: 500 });
      }

      if (planRow?.id) {
        const now = new Date();
        const currentPeriodEnd = new Date(now);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

        const upsertPayload = {
          userId: transaction.userId,
          planId: planRow.id,
          status: subscriptionStatus,
          provider: "nowpayments",
          providerSubscriptionId: String(body.payment_id ?? orderId),
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: subscriptionStatus === "active" ? currentPeriodEnd.toISOString() : null,
          canceledAt: subscriptionStatus === "canceled" ? now.toISOString() : null,
          metadata: body,
        };

        const { error: subError } = await admin.from("subscriptions").upsert(upsertPayload, {
          onConflict: "userId",
        });

        if (subError) {
          return NextResponse.json({ ok: false, error: subError.message }, { status: 500 });
        }
      }
    }

    if (IN_PROGRESS_STATUSES.has(paymentStatus)) {
      // Keep transaction as-is; webhook can fire multiple times while the payment is pending.
      // We still store the latest payload above for observability.
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Webhook error" },
      { status: 500 }
    );
  }
}
