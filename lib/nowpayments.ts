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

let payoutJwtCache: { token: string; expiresAt: number } | null = null;

async function getNowPaymentsPayoutJwt(): Promise<string | null> {
  const email = process.env.NOWPAYMENTS_PAYOUT_EMAIL?.trim();
  const password = process.env.NOWPAYMENTS_PAYOUT_PASSWORD?.trim();
  if (!email || !password) return null;

  const now = Date.now();
  if (payoutJwtCache && payoutJwtCache.expiresAt > now + 30_000) {
    return payoutJwtCache.token;
  }

  const res = await fetch(`${NOWPAYMENTS_API_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  let json: { token?: string } = {};
  try {
    json = JSON.parse(text) as { token?: string };
  } catch {
    throw new Error(`NOWPayments auth failed: ${res.status} ${text}`);
  }

  if (!res.ok || !json.token) {
    throw new Error(`NOWPayments auth failed: ${res.status} ${text}`);
  }

  payoutJwtCache = { token: json.token, expiresAt: now + 4 * 60 * 1000 };
  return json.token;
}

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

export type NowPaymentsPayoutInput = {
  address: string;
  currency: string;
  amount: number;
  ipn_callback_url: string;
  extra_id?: string;
  payout_description?: string;
};

export type NowPaymentsPayoutResponse = {
  id?: string;
  withdrawals?: Array<{ id?: string; status?: string; address?: string }>;
};

export async function createNowPaymentsPayout(input: NowPaymentsPayoutInput): Promise<NowPaymentsPayoutResponse> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) throw new Error("Missing NOWPAYMENTS_API_KEY");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };

  const jwt = await getNowPaymentsPayoutJwt();
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  const res = await fetch(`${NOWPAYMENTS_API_BASE}/payout`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ipn_callback_url: input.ipn_callback_url,
      payout_description: input.payout_description ?? "AIABW creator withdrawal",
      withdrawals: [
        {
          address: input.address,
          currency: input.currency,
          amount: input.amount,
          ipn_callback_url: input.ipn_callback_url,
          extra_id: input.extra_id,
        },
      ],
    }),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`NOWPayments payout failed: ${res.status} ${JSON.stringify(json)}`);
  }

  return json as NowPaymentsPayoutResponse;
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
