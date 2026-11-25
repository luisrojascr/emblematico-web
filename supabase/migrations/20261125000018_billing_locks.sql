-- Per-user lease lock for payment webhooks (Whop).
--
-- The webhook re-reads the membership from the Whop API and then writes the user's
-- subscription row. Two deliveries for the same user running at once could
-- interleave (A reads "active", B reads and writes "canceled", A writes "active"),
-- and the plan guard that compares the stored row could be bypassed the same way.
-- The read-decide-write cycle can't sit in one database transaction because it
-- calls an external API in the middle, so each delivery takes this lease first.
-- A delivery that finds the lease taken answers 5xx and Whop redelivers it later.
--
-- The lease expires on its own (locked_until), so a crashed function never blocks
-- an account for longer than the lease. The token makes sure a delivery only
-- releases its own lease.

create table public.billing_locks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token uuid not null,
  locked_until timestamptz not null
);

-- Only the service role (the webhook) uses it.
alter table public.billing_locks enable row level security;
revoke all on public.billing_locks from anon, authenticated;
grant all on public.billing_locks to service_role;

-- Takes the lease for p_seconds. Returns false while another unexpired lease holds it.
create function public.acquire_billing_lock(
  p_user_id uuid,
  p_token uuid,
  p_seconds integer default 30
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_seconds is null or p_seconds < 1 or p_seconds > 300 then
    raise exception 'lease must be between 1 and 300 seconds';
  end if;

  insert into public.billing_locks as l (user_id, token, locked_until)
  values (p_user_id, p_token, clock_timestamp() + make_interval(secs => p_seconds))
  on conflict (user_id) do update
    set token = excluded.token,
        locked_until = excluded.locked_until
    where l.locked_until < clock_timestamp();

  return found;
end;
$$;

-- Releases the lease if this token still holds it. Returns whether it did.
create function public.release_billing_lock(p_user_id uuid, p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.billing_locks
  where user_id = p_user_id and token = p_token;
  return found;
end;
$$;

revoke execute on function public.acquire_billing_lock(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.acquire_billing_lock(uuid, uuid, integer)
  to service_role;

revoke execute on function public.release_billing_lock(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.release_billing_lock(uuid, uuid)
  to service_role;
