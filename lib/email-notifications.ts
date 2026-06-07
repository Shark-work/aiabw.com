import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  creatorNewAgentEmail,
  inactiveRecallEmail,
  sendTransactionalEmail,
  subscriptionExpiringEmail,
} from "@/lib/email";

type Admin = SupabaseClient<Database>;

export const NOTIFICATION_TYPES = {
  subscriptionExpiring3d: "subscription_expiring_3d",
  creatorNewAgent: "creator_new_agent",
  inactiveRecall7d: "inactive_recall_7d",
} as const;

type NotificationPrefKey = "subscription" | "creator" | "recall";

async function getUserEmail(admin: Admin, userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

async function emailPrefEnabled(admin: Admin, userId: string, key: NotificationPrefKey): Promise<boolean> {
  const { data } = await admin.from("profiles").select("metadata").eq("user_id", userId).maybeSingle();
  const meta = (data?.metadata ?? {}) as Record<string, unknown>;
  const prefs = meta.email_notifications;
  if (prefs && typeof prefs === "object" && !Array.isArray(prefs)) {
    const val = (prefs as Record<string, unknown>)[key];
    if (val === false) return false;
  }
  return true;
}

async function alreadySent(admin: Admin, userId: string, type: string, referenceKey: string) {
  const { data } = await admin
    .from("email_notification_log")
    .select("id")
    .eq("user_id", userId)
    .eq("notification_type", type)
    .eq("reference_key", referenceKey)
    .maybeSingle();
  return Boolean(data);
}

async function logEmail(
  admin: Admin,
  input: {
    userId: string;
    type: string;
    referenceKey: string;
    emailTo: string;
    subject: string;
    status: string;
    provider: string;
    providerId?: string;
    errorMessage?: string;
  }
) {
  await admin.from("email_notification_log").insert({
    user_id: input.userId,
    notification_type: input.type,
    reference_key: input.referenceKey,
    email_to: input.emailTo,
    subject: input.subject,
    status: input.status,
    provider: input.provider,
    provider_id: input.providerId ?? null,
    error_message: input.errorMessage ?? null,
  });
}

export type EmailBatchResult = {
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export async function sendSubscriptionExpiringReminders(
  admin: Admin,
  daysBefore = 3
): Promise<EmailBatchResult> {
  const result: EmailBatchResult = { sent: 0, skipped: 0, failed: 0, errors: [] };

  const { data: rows, error } = await admin.rpc("list_subscriptions_expiring_on_day", {
    p_days_from_now: daysBefore,
  });

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  for (const row of rows ?? []) {
    const userId = row.user_id as string;
    const email = row.email as string;
    const periodEnd = row.period_end as string;
    const planId = row.plan_id as string;
    const refKey = `sub_${periodEnd.slice(0, 10)}`;

    if (await alreadySent(admin, userId, NOTIFICATION_TYPES.subscriptionExpiring3d, refKey)) {
      result.skipped += 1;
      continue;
    }

    if (!(await emailPrefEnabled(admin, userId, "subscription"))) {
      result.skipped += 1;
      continue;
    }

    let planName = "Pro 订阅";
    const { data: plan } = await admin.from("subscription_plans").select("name").eq("id", planId).maybeSingle();
    if (plan?.name) planName = plan.name;

    const mail = subscriptionExpiringEmail(planName, periodEnd);
    const send = await sendTransactionalEmail({ to: email, ...mail });

    if (send.ok) {
      await logEmail(admin, {
        userId,
        type: NOTIFICATION_TYPES.subscriptionExpiring3d,
        referenceKey: refKey,
        emailTo: email,
        subject: mail.subject,
        status: "sent",
        provider: send.provider,
        providerId: send.id,
      });
      result.sent += 1;
    } else {
      result.failed += 1;
      result.errors.push(send.error);
    }
  }

  return result;
}

export async function sendInactiveRecallEmails(admin: Admin, inactiveDays = 7): Promise<EmailBatchResult> {
  const result: EmailBatchResult = { sent: 0, skipped: 0, failed: 0, errors: [] };

  const { data: rows, error } = await admin.rpc("list_inactive_recall_users", { p_days: inactiveDays });

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  for (const row of rows ?? []) {
    const userId = row.user_id as string;
    const email = row.email as string;
    const lastSignIn = row.last_sign_in_at as string;
    const refKey = `recall_${lastSignIn.slice(0, 10)}`;

    if (await alreadySent(admin, userId, NOTIFICATION_TYPES.inactiveRecall7d, refKey)) {
      result.skipped += 1;
      continue;
    }

    if (!(await emailPrefEnabled(admin, userId, "recall"))) {
      result.skipped += 1;
      continue;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", userId)
      .maybeSingle();

    const displayName = profile?.display_name ?? profile?.username ?? "探索者";
    const mail = inactiveRecallEmail(displayName);
    const send = await sendTransactionalEmail({ to: email, ...mail });

    if (send.ok) {
      await logEmail(admin, {
        userId,
        type: NOTIFICATION_TYPES.inactiveRecall7d,
        referenceKey: refKey,
        emailTo: email,
        subject: mail.subject,
        status: "sent",
        provider: send.provider,
        providerId: send.id,
      });
      result.sent += 1;
    } else {
      result.failed += 1;
      result.errors.push(send.error);
    }
  }

  return result;
}

/** 关注的创作者发布新 Agent — 即时通知 */
export async function notifyFollowersOfNewAgent(
  admin: Admin,
  input: { agentId: string; agentSlug: string; agentName: string; creatorUserId: string }
): Promise<EmailBatchResult> {
  const result: EmailBatchResult = { sent: 0, skipped: 0, failed: 0, errors: [] };

  const { data: followers } = await admin
    .from("creator_follows")
    .select("follower_user_id")
    .eq("creator_user_id", input.creatorUserId);

  if (!followers?.length) return result;

  const { data: creatorProfile } = await admin
    .from("profiles")
    .select("display_name, username")
    .eq("user_id", input.creatorUserId)
    .maybeSingle();

  const creatorName = creatorProfile?.display_name ?? creatorProfile?.username ?? "创作者";
  const refKey = `agent_${input.agentId}`;

  for (const f of followers) {
    const userId = f.follower_user_id;

    if (await alreadySent(admin, userId, NOTIFICATION_TYPES.creatorNewAgent, refKey)) {
      result.skipped += 1;
      continue;
    }

    if (!(await emailPrefEnabled(admin, userId, "creator"))) {
      result.skipped += 1;
      continue;
    }

    const email = await getUserEmail(admin, userId);
    if (!email) {
      result.skipped += 1;
      continue;
    }

    const mail = creatorNewAgentEmail(creatorName, input.agentName, input.agentSlug);
    const send = await sendTransactionalEmail({ to: email, ...mail });

    if (send.ok) {
      await logEmail(admin, {
        userId,
        type: NOTIFICATION_TYPES.creatorNewAgent,
        referenceKey: refKey,
        emailTo: email,
        subject: mail.subject,
        status: "sent",
        provider: send.provider,
        providerId: send.id,
      });
      result.sent += 1;
    } else {
      result.failed += 1;
      result.errors.push(send.error);
    }
  }

  return result;
}

/** Cron 补发：过去 24h 内发布且可能漏通知的 Agent */
export async function catchUpCreatorNewAgentEmails(admin: Admin): Promise<EmailBatchResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const merged: EmailBatchResult = { sent: 0, skipped: 0, failed: 0, errors: [] };

  const { data: agents } = await admin
    .from("agents")
    .select("id, slug, name, created_by")
    .eq("status", "active")
    .eq("visibility", "public")
    .gte("created_at", since)
    .not("created_by", "is", null);

  for (const agent of agents ?? []) {
    if (!agent.created_by) continue;
    const r = await notifyFollowersOfNewAgent(admin, {
      agentId: agent.id,
      agentSlug: agent.slug,
      agentName: agent.name,
      creatorUserId: agent.created_by,
    });
    merged.sent += r.sent;
    merged.skipped += r.skipped;
    merged.failed += r.failed;
    merged.errors.push(...r.errors);
  }

  return merged;
}

export async function runAllEmailNotifications(admin: Admin) {
  const [subscription, recall, creatorCatchUp] = await Promise.all([
    sendSubscriptionExpiringReminders(admin, 3),
    sendInactiveRecallEmails(admin, 7),
    catchUpCreatorNewAgentEmails(admin),
  ]);

  return {
    subscription,
    recall,
    creatorCatchUp,
    at: new Date().toISOString(),
  };
}
