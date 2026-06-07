import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { generateInviteCode } from "@/lib/growth";

type Admin = SupabaseClient<Database>;

export async function ensureInviteCode(admin: Admin, userId: string): Promise<string> {
  const { data: existing } = await admin.from("invite_codes").select("code").eq("user_id", userId).maybeSingle();
  if (existing?.code) return existing.code;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode(userId);
    const { error } = await admin.from("invite_codes").insert({ user_id: userId, code });
    if (!error) return code;
  }

  throw new Error("Failed to generate invite code");
}

export async function resolveInviteCode(admin: Admin, code: string): Promise<string | null> {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;

  const { data } = await admin.from("invite_codes").select("user_id").eq("code", normalized).maybeSingle();
  return data?.user_id ?? null;
}

export async function bindInviteRelationship(admin: Admin, inviteeUserId: string, inviteCode: string) {
  const inviterUserId = await resolveInviteCode(admin, inviteCode);
  if (!inviterUserId || inviterUserId === inviteeUserId) return { ok: false as const, reason: "invalid" };

  const { data: existing } = await admin
    .from("invite_relationships")
    .select("id")
    .eq("invitee_user_id", inviteeUserId)
    .maybeSingle();

  if (existing) return { ok: false as const, reason: "already_bound" };

  const { error } = await admin.from("invite_relationships").insert({
    inviter_user_id: inviterUserId,
    invitee_user_id: inviteeUserId,
    invite_code: inviteCode.trim().toLowerCase(),
  });

  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const, inviterUserId };
}

export async function getInviterForUser(admin: Admin, userId: string): Promise<string | null> {
  const { data } = await admin
    .from("invite_relationships")
    .select("inviter_user_id")
    .eq("invitee_user_id", userId)
    .maybeSingle();
  return data?.inviter_user_id ?? null;
}
