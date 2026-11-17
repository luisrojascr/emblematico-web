-- Self-serve signup, phase 1: subscriptions, effective plan, plan limits, plan-based
-- pausing of guides, country, and suspension metadata.
-- REVIEW BEFORE APPLYING: not executed against any database.
--
-- Model
--   * One `subscriptions` row per user. Limits are per person (Essential's 3 properties
--     are counted across all of the person's guides), so the plan lives on the user.
--   * The plan that applies today is computed lazily by effective_plan(): an expired
--     trial, an unpaid period or a canceled subscription resolves to 'free' by itself,
--     even if the daily expire_subscriptions() job has not run yet.
--   * Guides above the owner's property limit are "paused" (computed, never stored,
--     never deleted). Their public URL redirects (temporarily) to the owner's oldest
--     enabled guide, so a printed QR never shows an error.
--
-- Constants that must match src/lib/plans.ts (checked by plans-sql-sync.test.ts):
--   trial_days() = TRIAL_DAYS, property_limit() = plan properties / maxProperties.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.plan_tier as enum ('free', 'essential', 'plus', 'managers');
create type public.billing_period as enum ('monthly', 'annual');
create type public.subscription_status as enum
  ('trialing', 'active', 'past_due', 'canceled', 'expired');

-- ---------------------------------------------------------------------------
-- Constants and helpers
-- ---------------------------------------------------------------------------
-- Trial length for self-serve signups. Keep equal to TRIAL_DAYS in src/lib/plans.ts.
create function public.trial_days()
returns integer
language sql
immutable
set search_path = ''
as $$ select 30 $$;

-- Lowercases, drops "+tag" and, for Gmail, dots. One person = one trial.
create function public.normalize_email(p_email text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_local text;
  v_domain text;
begin
  if p_email is null or position('@' in p_email) = 0 then
    return null;
  end if;
  v_local := split_part(lower(btrim(p_email)), '@', 1);
  v_domain := split_part(lower(btrim(p_email)), '@', 2);
  v_local := split_part(v_local, '+', 1);
  if v_domain in ('gmail.com', 'googlemail.com') then
    v_local := replace(v_local, '.', '');
    v_domain := 'gmail.com';
  end if;
  if v_local = '' or v_domain = '' then
    return null;
  end if;
  return v_local || '@' || v_domain;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: country, normalized email, self-signup flag
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column country text check (country is null or country ~ '^[A-Z]{2}$'),
  add column email_normalized text,
  add column self_signup boolean not null default false;

update public.profiles set email_normalized = public.normalize_email(email);

-- Alias abuse backstop: one self-signup account per normalized email.
create unique index profiles_self_signup_email_key
  on public.profiles (email_normalized)
  where self_signup and email_normalized is not null;

-- Same guard as before, plus the new protected columns. `country` stays editable.
create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.created_at is distinct from old.created_at
       or new.max_properties is distinct from old.max_properties
       or new.email_normalized is distinct from old.email_normalized
       or new.self_signup is distinct from old.self_signup then
      raise exception 'protected field: only admins can change this profile field'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan public.plan_tier not null default 'free',
  status public.subscription_status not null default 'active',
  billing_period public.billing_period,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  -- Paid extra properties on top of the plan's included ones.
  extra_properties integer not null default 0 check (extra_properties between 0 and 1000),
  -- Admin-set cap, only used by the 'managers' plan.
  property_limit_override integer check (property_limit_override between 0 and 100000),
  -- Payment provider link (Whop later). Filled by the webhook, never by clients.
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_trial_has_end check (
    status <> 'trialing' or trial_ends_at is not null
  )
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- No client writes. Admins manage plans by hand; the payment webhook and the daily
-- job use service_role.
create policy subscriptions_admin_write on public.subscriptions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;

-- Payment events, for idempotent webhook processing (used when Whop is integrated).
create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (provider, provider_event_id)
);

alter table public.billing_events enable row level security;

create policy billing_events_admin on public.billing_events
  for select to authenticated
  using (public.is_admin());

grant select on public.billing_events to authenticated;
grant all on public.billing_events to service_role;

-- ---------------------------------------------------------------------------
-- effective_plan(): the plan that applies right now
-- ---------------------------------------------------------------------------
-- Grace after a missed payment: 7 days. Keep equal in expire_subscriptions().
create function public.effective_plan(p_user_id uuid)
returns public.plan_tier
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.subscriptions;
begin
  if exists (
    select 1 from public.profiles where id = p_user_id and role = 'admin'
  ) then
    return 'managers';
  end if;

  select * into s from public.subscriptions where user_id = p_user_id;
  if not found then
    return 'free';
  end if;

  return case s.status
    when 'trialing' then
      case when s.trial_ends_at > now() then s.plan else 'free' end
    when 'active' then
      case when s.current_period_end is null
                or s.current_period_end + interval '7 days' > now()
           then s.plan else 'free' end
    when 'past_due' then
      case when s.current_period_end is not null
                and s.current_period_end + interval '7 days' > now()
           then s.plan else 'free' end
    when 'canceled' then
      case when s.current_period_end is not null
                and s.current_period_end > now()
           then s.plan else 'free' end
    else 'free'
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- property_limit(): how many properties the user may own right now
--   free 1 | essential 3 + extras (max 7) | plus 7 + extras (no cap)
--   managers: admin override, otherwise effectively unlimited
-- ---------------------------------------------------------------------------
create function public.property_limit(p_user_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.subscriptions;
  v_plan public.plan_tier := public.effective_plan(p_user_id);
begin
  select * into s from public.subscriptions where user_id = p_user_id;
  return case v_plan
    when 'free' then 1
    when 'essential' then least(3 + coalesce(s.extra_properties, 0), 7)
    when 'plus' then 7 + coalesce(s.extra_properties, 0)
    else coalesce(s.property_limit_override, 1000)
  end;
end;
$$;

-- Transitional: the panel still reads profiles.max_properties. Keep it in step with the
-- subscription until the app switches to property_limit() / my_entitlements().
create function public.sync_max_properties()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set max_properties = least(public.property_limit(new.user_id), 50)
  where id = new.user_id;
  return new;
end;
$$;

create trigger subscriptions_sync_max_properties
  after insert or update on public.subscriptions
  for each row execute function public.sync_max_properties();

-- ---------------------------------------------------------------------------
-- Pausing: guides above the owner's limit (oldest ones stay enabled)
-- ---------------------------------------------------------------------------
create function public.business_owner(p_business_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select user_id
  from public.business_members
  where business_id = p_business_id and role = 'owner'
  order by created_at, user_id
  limit 1;
$$;

create function public.business_is_paused_by_plan(p_business_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner uuid := public.business_owner(p_business_id);
  v_created timestamptz;
  v_status public.business_status;
  v_rank integer;
begin
  if v_owner is null then
    return false;
  end if;

  select created_at, status into v_created, v_status
  from public.businesses where id = p_business_id;
  if not found or v_status = 'archived' then
    return false;
  end if;

  select count(*) into v_rank
  from public.business_members m
  join public.businesses b on b.id = m.business_id
  where m.user_id = v_owner
    and m.role = 'owner'
    and b.status <> 'archived'
    and (b.created_at, b.id) <= (v_created, p_business_id);

  return v_rank > public.property_limit(v_owner);
end;
$$;

-- A paused guide behaves like an inactive one: clients cannot edit it, publish it or
-- upload media to it (every client write policy goes through this function).
create or replace function public.business_is_active(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses
    where id = p_business_id and status = 'active'
  ) and not public.business_is_paused_by_plan(p_business_id);
$$;

-- ---------------------------------------------------------------------------
-- New user -> profile + subscription
--   * Invited users (admin-created accounts) start on Free; an admin assigns the plan.
--   * Self-signups start an Essential trial, unless the normalized email already
--     belongs to another account (one trial per person).
--   * user_metadata is user-controlled, so it is only used for harmless fields.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_self boolean := new.invited_at is null;
  v_norm text := public.normalize_email(new.email);
  v_country text := upper(nullif(btrim(new.raw_user_meta_data ->> 'country'), ''));
  v_trial boolean;
begin
  if v_country is not null and v_country !~ '^[A-Z]{2}$' then
    v_country := null;
  end if;

  v_trial := v_self
    and v_norm is not null
    and not exists (
      select 1 from public.profiles where email_normalized = v_norm
    );

  insert into public.profiles (id, email, full_name, country, email_normalized, self_signup)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    v_country,
    v_norm,
    v_self
  );

  if v_trial then
    insert into public.subscriptions (user_id, plan, status, trial_ends_at)
    values (new.id, 'essential', 'trialing',
            now() + make_interval(days => public.trial_days()));
  else
    insert into public.subscriptions (user_id, plan, status)
    values (new.id, 'free', 'active');
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Backfill for existing accounts. Only demo accounts exist today, so this is a
-- best-effort mapping from the old free-text plan and max_properties:
-- admins -> managers, plan keywords first, then the property limit.
-- ---------------------------------------------------------------------------
insert into public.subscriptions (user_id, plan, status, current_period_end)
select
  p.id,
  case
    when p.role = 'admin' then 'managers'::public.plan_tier
    when plan_text ~ '(admin|manager)' then 'managers'::public.plan_tier
    when plan_text ~ 'plus' then 'plus'::public.plan_tier
    when plan_text ~ '(essential|esencial)' then 'essential'::public.plan_tier
    when plan_text ~ '(free|grat)' then 'free'::public.plan_tier
    when p.max_properties <= 1 then 'free'::public.plan_tier
    when p.max_properties <= 7 then 'essential'::public.plan_tier
    else 'plus'::public.plan_tier
  end,
  'active',
  expires
from public.profiles p
left join lateral (
  select
    lower(string_agg(b.service_plan, ' ')) as plan_text,
    max(b.service_expires_at) as expires
  from public.business_members m
  join public.businesses b on b.id = m.business_id
  where m.user_id = p.id and m.role = 'owner'
) o on true
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Suspension metadata (status = 'suspended' already hides the guide publicly)
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column suspended_at timestamptz,
  add column suspended_reason text check (char_length(suspended_reason) <= 500);

create function public.businesses_track_suspension()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'suspended' and old.status is distinct from 'suspended' then
    new.suspended_at := now();
  elsif new.status <> 'suspended' then
    new.suspended_at := null;
    new.suspended_reason := null;
  end if;
  return new;
end;
$$;

create trigger businesses_track_suspension_trg
  before update on public.businesses
  for each row execute function public.businesses_track_suspension();

-- ---------------------------------------------------------------------------
-- create_my_business(): same contract as before, with three changes
--   * the limit comes from the subscription (property_limit), not profiles.max_properties
--   * the email must be verified
--   * at most 5 guides created per hour per user
-- ---------------------------------------------------------------------------
create or replace function public.create_my_business(
  p_name text,
  p_slug text,
  p_content jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_limit integer;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.is_admin() then
    if not exists (
      select 1 from auth.users
      where id = v_uid and email_confirmed_at is not null
    ) then
      raise exception 'email not verified' using errcode = '42501';
    end if;

    -- Lock the caller's profile row so concurrent calls from the same user
    -- run one at a time: the counts below always see the previous insert.
    perform 1 from public.profiles where id = v_uid for update;

    v_limit := public.property_limit(v_uid);
    select count(*) into v_count
    from public.business_members m
    join public.businesses b on b.id = m.business_id
    where m.user_id = v_uid and m.role = 'owner' and b.status <> 'archived';
    if v_limit <= v_count then
      raise exception 'property limit reached' using errcode = 'P0001';
    end if;

    if (
      select count(*) from public.business_members
      where user_id = v_uid and role = 'owner'
        and created_at > now() - interval '1 hour'
    ) >= 5 then
      raise exception 'rate limit exceeded' using errcode = 'P0001';
    end if;
  end if;

  insert into public.businesses (name, slug, category)
  values (p_name, p_slug, 'hospedaje')
  returning id into v_id;

  insert into public.pages (business_id, template_key, draft_content)
  values (v_id, 'hospitality', coalesce(p_content, '{}'::jsonb));

  insert into public.qr_codes (business_id, destination_path)
  values (v_id, '/negocio/' || p_slug);

  insert into public.business_members (business_id, user_id, role)
  values (v_id, v_uid, 'owner');

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_public_page(): branding now follows the owner's effective plan, and paused
-- guides redirect (temporarily) to the owner's oldest enabled guide.
--   { "redirect_to": "<slug>", "temporary": true }  -> plan pause (do NOT cache as 301)
--   { "redirect_to": "<slug>" }                     -> retired slug (permanent)
-- Guides without an owner keep the legacy keyword match on service_plan.
-- `create or replace` keeps the existing grants (anon/authenticated execute).
-- ---------------------------------------------------------------------------
create or replace function public.get_public_page(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_b record;
  v_owner uuid;
  v_branding boolean;
  v_target text;
  v_current text;
begin
  select b.id, b.name, b.slug, b.indexable, b.service_plan,
         p.template_key, p.published_content
  into v_b
  from public.businesses b
  join public.pages p on p.business_id = b.id
  where b.slug = p_slug
    and b.status = 'active'
    and p.status = 'published'
    and p.published_content is not null;

  if found then
    v_owner := public.business_owner(v_b.id);

    if v_owner is not null and public.business_is_paused_by_plan(v_b.id) then
      select b2.slug into v_target
      from public.business_members m
      join public.businesses b2 on b2.id = m.business_id
      join public.pages p2 on p2.business_id = b2.id
      where m.user_id = v_owner
        and m.role = 'owner'
        and b2.status = 'active'
        and p2.status = 'published'
        and p2.published_content is not null
        and not public.business_is_paused_by_plan(b2.id)
      order by b2.created_at, b2.id
      limit 1;

      if v_target is null then
        return null;
      end if;
      return jsonb_build_object('redirect_to', v_target, 'temporary', true);
    end if;

    if v_owner is not null then
      v_branding := public.effective_plan(v_owner) = 'free';
    else
      v_branding := not coalesce(
        lower(v_b.service_plan) ~ '(admin|manager|plus|essential|esencial)',
        false
      );
    end if;

    return jsonb_build_object(
      'found', true,
      'business_id', v_b.id,
      'name', v_b.name,
      'slug', v_b.slug,
      'template_key', v_b.template_key,
      'content', v_b.published_content,
      'indexable', v_b.indexable,
      'branding', v_branding
    );
  end if;

  select b.slug
  into v_current
  from public.slug_history h
  join public.businesses b on b.id = h.business_id
  join public.pages p on p.business_id = b.id
  where h.slug = p_slug
    and b.status = 'active'
    and p.status = 'published';

  if v_current is not null then
    return jsonb_build_object('redirect_to', v_current);
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- my_entitlements(): what the panel needs to show plan, trial and limits
-- ---------------------------------------------------------------------------
create function public.my_entitlements()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  s public.subscriptions;
  v_used integer;
begin
  if v_uid is null then
    return null;
  end if;

  select * into s from public.subscriptions where user_id = v_uid;

  select count(*) into v_used
  from public.business_members m
  join public.businesses b on b.id = m.business_id
  where m.user_id = v_uid and m.role = 'owner' and b.status <> 'archived';

  return jsonb_build_object(
    'plan', public.effective_plan(v_uid),
    'subscribed_plan', s.plan,
    'status', s.status,
    'billing_period', s.billing_period,
    'trial_ends_at', s.trial_ends_at,
    'current_period_end', s.current_period_end,
    'property_limit', public.property_limit(v_uid),
    'properties_used', v_used
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- expire_subscriptions(): persists what effective_plan() already computes, so the
-- stored plan/status match reality (the daily job, phase 5, will call this).
-- ---------------------------------------------------------------------------
create function public.expire_subscriptions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.subscriptions
  set plan = 'free', status = 'expired', billing_period = null
  where plan <> 'free'
    and (
      (status = 'trialing' and trial_ends_at <= now())
      or (status = 'active' and current_period_end is not null
          and current_period_end + interval '7 days' <= now())
      or (status = 'past_due'
          and (current_period_end is null
               or current_period_end + interval '7 days' <= now()))
      or (status = 'canceled'
          and (current_period_end is null or current_period_end <= now()))
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Execution grants. Internal helpers are not callable from the API.
-- ---------------------------------------------------------------------------
revoke execute on function
  public.trial_days(),
  public.normalize_email(text),
  public.effective_plan(uuid),
  public.property_limit(uuid),
  public.sync_max_properties(),
  public.business_owner(uuid),
  public.business_is_paused_by_plan(uuid),
  public.my_entitlements(),
  public.expire_subscriptions(),
  public.businesses_track_suspension()
from public, anon, authenticated;

grant execute on function public.my_entitlements() to authenticated;

grant execute on function
  public.trial_days(),
  public.normalize_email(text),
  public.effective_plan(uuid),
  public.property_limit(uuid),
  public.business_owner(uuid),
  public.business_is_paused_by_plan(uuid),
  public.my_entitlements(),
  public.expire_subscriptions()
to service_role;
