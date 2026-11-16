-- Productos físicos que un cliente compró para un hospedaje (pieza de
-- bienvenida, letreros…). Los registra un admin; el cliente los ve en
-- /panel/productos. REVISAR ANTES DE APLICAR: no se ha ejecutado.

create table public.business_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  -- Copia del nombre: el pedido sigue legible si el producto se borra o cambia.
  product_name text not null check (char_length(product_name) between 1 and 160),
  quantity integer not null default 1 check (quantity between 1 and 999),
  status text not null default 'solicitado'
    check (status in ('solicitado', 'en_produccion', 'enviado', 'entregado')),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index business_orders_business_idx on public.business_orders (business_id);

create trigger business_orders_set_updated_at
  before update on public.business_orders
  for each row execute function public.set_updated_at();

alter table public.business_orders enable row level security;

-- Miembros del hospedaje leen sus pedidos; solo admins escriben.
create policy business_orders_select on public.business_orders
  for select to authenticated
  using (public.is_admin() or public.is_member(business_id));

create policy business_orders_admin_write on public.business_orders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.business_orders to authenticated;
grant all on public.business_orders to service_role;
