-- Queue of accounts the expiry dropped to Free (fix for the phase 5 daily job).
--
-- run_subscription_expiry() used to hand the job every account it dropped in one RPC
-- result. The API caps results at max_rows (1000), and a run can also time out
-- halfway through its emails: any account past that point was already on Free and
-- never got its email or its guide refresh, and later runs could not find it again.
--
-- Now the same statement that drops an account also records it here. The job works
-- through the pending rows in small batches and marks each one processed, so whatever
-- one run leaves behind, the next run picks up.

create table public.subscription_expirations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  previous_plan public.plan_tier not null,
  previous_status public.subscription_status not null,
  -- The trial_ends_at / current_period_end that lapsed.
  period_end timestamptz,
  expired_at timestamptz not null default now(),
  -- Failed email attempts; the job gives up after a few.
  attempts integer not null default 0,
  processed_at timestamptz
);

create index subscription_expirations_pending_idx
  on public.subscription_expirations (id)
  where processed_at is null;

create index subscription_expirations_user_idx
  on public.subscription_expirations (user_id);

-- Only the service role (the daily job) reads or writes it.
alter table public.subscription_expirations enable row level security;
revoke all on public.subscription_expirations from anon, authenticated;
grant all on public.subscription_expirations to service_role;

-- Same conditions and return shape as migration 14, plus the queue insert. The drop
-- and the queue row commit together, so no dropped account can be missed.
create or replace function public.run_subscription_expiry()
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
  ),
  queued as (
    insert into public.subscription_expirations
      (user_id, previous_plan, previous_status, period_end)
    select l.user_id, l.plan, l.status, l.period_end
    from lapsed l
    join updated u on u.user_id = l.user_id
    returning user_id, previous_plan, previous_status, period_end
  )
  select q.user_id, q.previous_plan, q.previous_status, q.period_end
  from queued q;
end;
$$;

-- create or replace keeps the grants of migration 14 (service_role only).
