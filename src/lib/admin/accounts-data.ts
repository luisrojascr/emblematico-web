import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

import { MANUAL_PROVIDER, type SubscriptionRow } from "./accounts";

type Client = SupabaseClient<Database>;

const SUBSCRIPTION_COLUMNS =
  "user_id, plan, status, billing_period, trial_ends_at, current_period_end, extra_properties, property_limit_override";

function isBanned(bannedUntil: string | undefined, now = Date.now()): boolean {
  return Boolean(bannedUntil && new Date(bannedUntil).getTime() > now);
}

/** Ids of accounts whose login is blocked (Supabase Auth ban). */
export async function blockedUserIds(): Promise<Set<string>> {
  const admin = createAdminClient();
  const blocked = new Set<string>();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      console.error("listUsers failed", error.status, error.message);
      break;
    }
    for (const user of data.users) {
      if (isBanned(user.banned_until)) blocked.add(user.id);
    }
    if (data.users.length < 1000) break;
  }
  return blocked;
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  const { data, error } =
    await createAdminClient().auth.admin.getUserById(userId);
  if (error || !data.user) return false;
  return isBanned(data.user.banned_until);
}

export type AdminAccountRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "admin" | "client";
  country: string | null;
  createdAt: string;
  selfSignup: boolean;
  sub: SubscriptionRow | null;
  owned: number;
};

export async function loadAccounts(
  supabase: Client,
): Promise<AdminAccountRow[]> {
  const [{ data: profiles }, { data: subs }, { data: owners }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role, country, created_at, self_signup")
        .order("created_at", { ascending: false }),
      supabase.from("subscriptions").select(SUBSCRIPTION_COLUMNS),
      supabase
        .from("business_members")
        .select("user_id, businesses!inner(status)")
        .eq("role", "owner")
        .neq("businesses.status", "archived"),
    ]);
  const subByUser = new Map((subs ?? []).map((s) => [s.user_id, s]));
  const ownedByUser = new Map<string, number>();
  for (const row of owners ?? []) {
    ownedByUser.set(row.user_id, (ownedByUser.get(row.user_id) ?? 0) + 1);
  }
  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role,
    country: p.country,
    createdAt: p.created_at,
    selfSignup: p.self_signup,
    sub: subByUser.get(p.id) ?? null,
    owned: ownedByUser.get(p.id) ?? 0,
  }));
}

export type AdminAccountGuide = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  suspendedReason: string | null;
  role: "owner" | "editor";
  createdAt: string;
};

export type PlanEvent = {
  id: string;
  type: string;
  receivedAt: string;
  payload: Record<string, unknown>;
};

export async function loadAccount(supabase: Client, userId: string) {
  const [
    { data: profile },
    { data: sub },
    { data: members },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, country, created_at, self_signup")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select(SUBSCRIPTION_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("business_members")
      .select(
        "role, businesses!inner(id, name, slug, status, suspended_reason, created_at)",
      )
      .eq("user_id", userId),
    supabase
      .from("billing_events")
      .select("id, event_type, received_at, payload")
      .eq("provider", MANUAL_PROVIDER)
      .eq("payload->>user_id", userId)
      .order("received_at", { ascending: false })
      .limit(30),
  ]);
  if (!profile) return null;

  const guides: AdminAccountGuide[] = (members ?? [])
    .map((m) => ({
      id: m.businesses.id,
      name: m.businesses.name,
      slug: m.businesses.slug,
      status: m.businesses.status,
      suspendedReason: m.businesses.suspended_reason,
      role: m.role,
      createdAt: m.businesses.created_at,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    profile,
    sub: sub ?? null,
    guides,
    events: (events ?? []).map((e): PlanEvent => ({
      id: e.id,
      type: e.event_type,
      receivedAt: e.received_at,
      payload:
        e.payload && typeof e.payload === "object" && !Array.isArray(e.payload)
          ? (e.payload as Record<string, unknown>)
          : {},
    })),
    blocked: await isUserBlocked(userId),
  };
}

/** Records a manual change so the admin keeps a history (and Whop can coexist later). */
export async function recordPlanEvent(input: {
  userId: string;
  adminEmail: string | null;
  type: string;
  before: Json;
  after: Json;
  note?: string;
}) {
  const { error } = await createAdminClient()
    .from("billing_events")
    .insert({
      provider: MANUAL_PROVIDER,
      provider_event_id: crypto.randomUUID(),
      event_type: input.type,
      payload: {
        user_id: input.userId,
        by: input.adminEmail,
        before: input.before,
        after: input.after,
        note: input.note ?? null,
      },
      processed_at: new Date().toISOString(),
    });
  if (error)
    console.error("billing event insert failed", error.code, error.message);
}
