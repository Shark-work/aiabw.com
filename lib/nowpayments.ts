export const NOWPAYMENTS_API_BASE = "https://api.nowpayments.io/v1";

export type NowPaymentsCreatePaymentInput = {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  success_url: string;
  cancel_url: string;
};

export type NowPaymentsCreatePaymentResponse = {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  pay_amount: string;
  price_amount: string;
  price_currency: string;
  pay_currency: string;
  order_id: string;
  order_description?: string;
  purchase_id?: string;
  outcome_amount?: string;
  outcome_currency?: string;
  actually_paid?: string;
  invoice_url?: string;
};

export async function createNowPaymentsPayment(input: NowPaymentsCreatePaymentInput) {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("Missing NOWPAYMENTS_API_KEY");

  const res = await fetch(`${NOWPAYMENTS_API_BASE}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`NOWPayments create payment failed: ${res.status} ${JSON.stringify(json)}`);
  }

  return json as NowPaymentsCreatePaymentResponse;
}

export async function verifyNowPaymentsIpnSignature(rawBody: string, signature: string | null) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) throw new Error("Missing NOWPAYMENTS_IPN_SECRET");
  if (!signature) return false;

  const encoder = new TextEncoder();
  const data = encoder.encode(rawBody);
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const hashBuffer = await crypto.subtle.sign("HMAC", key, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.toLowerCase() === signature.toLowerCase();
}
