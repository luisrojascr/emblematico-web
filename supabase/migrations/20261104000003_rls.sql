-- Row Level Security. Anonymous users get NO direct table access except the
-- public catalog. Public pages and quotes go through SECURITY DEFINER RPCs.

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.slug_history enable row level security;
alter table public.business_members enable row level security;
alter table public.pages enable row level security;
alter table public.media enable row level security;
alter table public.qr_codes enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.quote_requests enable row level security;

-- profiles --------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- Inserts come from handle_new_user(); deletes cascade from auth.users.
create policy profiles_admin_delete on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- businesses ------------------------------------------------------------------
create policy businesses_select on public.businesses
  for select to authenticated
  using (public.is_admin() or public.is_member(id));

create policy businesses_admin_write on public.businesses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- slug_history (admin only) -----------------------------------------------------
create policy slug_history_admin on public.slug_history
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- business_members ----------------------------------------------------------------
create policy members_select on public.business_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy members_admin_write on public.business_members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- pages ------------------------------------------------------------------------
create policy pages_select on public.pages
  for select to authenticated
  using (public.is_admin() or public.is_member(business_id));

-- Clients: only while the business is active. Column restriction in pages_guard().
create policy pages_update_member on public.pages
  for update to authenticated
  using (public.is_member(business_id) and public.business_is_active(business_id))
  with check (public.is_member(business_id) and public.business_is_active(business_id));

create policy pages_admin_write on public.pages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- media -------------------------------------------------------------------------
create policy media_select on public.media
  for select to authenticated
  using (public.is_admin() or public.is_member(business_id));

create policy media_member_insert on public.media
  for insert to authenticated
  with check (public.is_member(business_id) and public.business_is_active(business_id));

create policy media_member_delete on public.media
  for delete to authenticated
  using (public.is_member(business_id) and public.business_is_active(business_id));

create policy media_admin_write on public.media
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- qr_codes ------------------------------------------------------------------------
create policy qr_select on public.qr_codes
  for select to authenticated
  using (public.is_admin() or public.is_member(business_id));

create policy qr_admin_write on public.qr_codes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- catalog (public read) ------------------------------------------------------------
create policy categories_public_read on public.product_categories
  for select to anon, authenticated
  using (true);

create policy categories_admin_write on public.product_categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy products_public_read on public.products
  for select to anon, authenticated
  using (is_active or public.is_admin());

create policy products_admin_write on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- quote_requests (admin only; inserts via submit_quote_request) ----------------------
create policy quotes_admin on public.quote_requests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Table privileges (RLS above decides rows). Explicit, least-privilege grants.
revoke all on all tables in schema public from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.businesses, public.slug_history, public.business_members,
  public.pages, public.media, public.qr_codes,
  public.product_categories, public.products, public.quote_requests
  to authenticated;
grant select on public.product_categories, public.products to anon;
