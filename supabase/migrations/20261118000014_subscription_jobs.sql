-- Daily subscription job (phase 5 of self-serve signup).
--
--   * run_subscription_expiry(): stores what effective_plan() already computes (lapsed
--     trials and paid plans drop to Free) and returns who dropped, so the site can email
--     them and refresh their cached guides. expire_subscriptions() now calls it.
--   * subscription_notices: one row per reminder email sent, so each one goes out once
--     per trial or billing period even if the job runs twice or misses a day.
--   * pg_cron calls the site once a day (POST /api/cron/subscriptions). The site URL and
--     the shared secret live in Supabase Vault (secrets `cron_site_url` and `cron_secret`);
--     without them the call fails harmlessly and nothing else changes.

-- ---------------------------------------------------------------------------
-- Sent reminders
-- ---------------------------------------------------------------------------
create table public.subscription_notices (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- trial_7d | trial_3d | trial_ended | paid_7d | paid_ended | paid_dropped
  kind text not null check (kind ~ '^[a-z0-9_]{1,40}$'),
  -- The trial_ends_at / current_period_end the notice was about.
  period_end timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, period_end)
);

-- Only the service role (the daily job) reads or writes it.
alter table public.subscription_notices enable row level security;
revoke all on public.subscription_notices from anon, authenticated;
grant all on public.subscription_notices to service_role;

-- ---------------------------------------------------------------------------
-- Expiry that reports who dropped to Free
-- ---------------------------------------------------------------------------
create function public.run_subscription_expiry()
returns table (
  user_id uuid,
  previous_plan public.plan_tier,
  previous_status public.subscription_status,
  period_end timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
  with lapsed as (
    select s.user_id, s.plan, s.status,
           case when s.status = 'trialing' then s.trial_ends_at
                else s.current_period_end end as period_end
    from public.subscriptions s
    where s.plan <> 'free'
      and (
        (s.status = 'trialing' and s.trial_ends_at <= now())
        or (s.status = 'active' and s.current_period_end is not null
            and s.current_period_end + interval '7 days' <= now())
        or (s.status = 'past_due'
            and (s.current_period_end is null
                 or s.current_period_end + interval '7 days' <= now()))
        or (s.status = 'canceled'
            and (s.current_period_end is null or s.current_period_end <= now()))
      )
      -- Admins always count as managers (effective_plan); never downgrade them here.
      and not exists (
        select 1 from public.profiles p where p.id = s.user_id and p.role = 'admin'
      )
    for update of s
  ),
  updated as (
    update public.subscriptions s
    set plan = 'free', status = 'expired', billing_period = null
    from lapsed l
    where s.user_id = l.user_id
    returning s.user_id
  )
  select l.user_id, l.plan, l.status, l.period_end
  from lapsed l
  join updated u on u.user_id = l.user_id;
end;
$$;

create or replace function public.expire_subscriptions()
returns integer
language sql
security definer
set search_path = ''
as $$
  select count(*)::integer from public.run_subscription_expiry();
$$;

revoke execute on function public.run_subscription_expiry()
  from public, anon, authenticated;
grant execute on function public.run_subscription_expiry() to service_role;

-- ---------------------------------------------------------------------------
-- Daily schedule: 12:00 UTC (6:00 in Costa Rica)
-- Skipped where pg_cron / pg_net are not available (some local setups).
-- ---------------------------------------------------------------------------
do $do$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron or pg_net not available: daily subscription job not scheduled';
    return;
  end if;

  create extension if not exists pg_cron with schema pg_catalog;
  create extension if not exists pg_net with schema extensions;

  if exists (select 1 from cron.job where jobname = 'subscriptions-daily') then
    perform cron.unschedule('subscriptions-daily');
  end if;

  perform cron.schedule(
    'subscriptions-daily',
    '0 12 * * *',
    $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets
              where name = 'cron_site_url') || '/api/cron/subscriptions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                                       where name = 'cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
    $job$
  );
end;
$do$;
