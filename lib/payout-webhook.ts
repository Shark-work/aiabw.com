import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { recomputeCreatorWallets } from "@/lib/revenue-processor";
import { recomputeReferralWalletForUser } from "@/lib/referral-wallet";

type Admin = SupabaseClient<Database>;

type PayoutWebhookBody = {
  id?: string | number;
  payment_status?: string;
  status?: string;
  extra_id?: string;
  withdrawal_id?: string;
  batch_withdrawal_id?: string;
  [key: string]: unknown;
};

function mapPayoutStatus(raw: string | undefined): "processing" | "completed" | "failed" | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (["finished", "confirmed", "completed", "success", "sent"].includes(s)) return "completed";
  if (["failed", "rejected", "expired", "refunded"].includes(s)) return "failed";
  if (["waiting", "processing", "creating", "sending", "confirming"].includes(s)) return "processing";
  return null;
}

function parseExtraId(extraId: string | undefined) {
  if (!extraId) return { kind: "unknown" as const, id: null };
  if (extraId.startsWith("cr_")) return { kind: "creator" as const, id: extraId.slice(3) };
  if (extraId.startsWith("ref_")) return { kind: "referral" as const, id: extraId.slice(4) };
  return { kind: "creator" as const, id: extraId };
}

export async function handlePayoutWebhook(admin: Admin, body: PayoutWebhookBody): Promise<boolean> {
  const extraId = typeof body.extra_id === "string" ? body.extra_id : undefined;
  const parsed = parseExtraId(extraId);
  const status = mapPayoutStatus(
    typeof body.payment_status === "string"
      ? body.payment_status
      : typeof body.status === "string"
        ? body.status
        : undefined
  );

  if (!parsed.id || !status) return false;

  const raw = body as Json;
  const providerId = body.id != null ? String(body.id) : null;

  if (parsed.kind === "referral") {
    const { data: row } = await admin
      .from("referral_withdrawals")
      .select("user_id")
      .eq("id", parsed.id)
      .maybeSingle();

    if (!row) return false;

    await admin
      .from("referral_withdrawals")
      .update({
        status,
        provider_payout_id: providerId,
        raw,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.id);

    await recomputeReferralWalletForUser(admin, row.user_id);
    return true;
  }

  const { data: row } = await admin
    .from("creator_withdrawals")
    .select("user_id")
    .eq("id", parsed.id)
    .maybeSingle();

  if (!row) return false;

  await admin
    .from("creator_withdrawals")
    .update({
      status,
      provider_payout_id: providerId,
      raw,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.id);

  await recomputeCreatorWallets(admin);
  return true;
}

export function isLikelyPayoutWebhook(body: PayoutWebhookBody): boolean {
  if (body.extra_id && typeof body.extra_id === "string") {
    return body.extra_id.startsWith("cr_") || body.extra_id.startsWith("ref_");
  }
  if (body.batch_withdrawal_id) return true;
  if (body.withdrawal_id) return true;
  const status = body.status ?? body.payment_status;
  return typeof status === "string" && !body.order_id;
}
