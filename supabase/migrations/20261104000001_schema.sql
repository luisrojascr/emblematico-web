-- emblemático: core schema (enums + tables). Security lives in later migrations.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'client');
create type public.business_status as enum ('active', 'suspended', 'archived');
-- 'draft' = never published. 'unpublished' = was published, taken down by admin.
create type public.page_status as enum ('draft', 'published', 'unpublished');
create type public.template_key as enum ('hospitality', 'general');
create type public.member_role as enum ('owner', 'editor');
create type public.media_type as enum ('logo', 'cover', 'gallery');
create type public.quote_status as enum ('new', 'contacted', 'closed');

-- ---------------------------------------------------------------------------
-- Shared trigger fn
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (char_length(full_name) <= 120),
  role public.user_role not null default 'client',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique,
  category text check (char_length(category) <= 60),
  status public.business_status not null default 'active',
  service_plan text check (char_length(service_plan) <= 60),
  service_expires_at timestamptz,
  indexable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(slug) between 3 and 60
  ),
  constraint businesses_slug_not_reserved check (
    slug <> all (array[
      'admin', 'panel', 'api', 'www', 'negocio', 'login', 'ingresar',
      'auth', 'productos', 'contacto', 'nosotros', 'test', 'demo-admin'
    ])
  )
);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- Retired slugs. Old QR/URLs keep working through a 301 and slugs are never reused.
create table public.slug_history (
  slug text primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  retired_at timestamptz not null default now()
);
create index slug_history_business_idx on public.slug_history (business_id);

-- ---------------------------------------------------------------------------
-- business_members
-- ---------------------------------------------------------------------------
create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index business_members_user_idx on public.business_members (user_id);

-- ---------------------------------------------------------------------------
-- pages (one per business in the MVP)
-- ---------------------------------------------------------------------------
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  template_key public.template_key not null,
  draft_content jsonb not null default '{}'::jsonb
    check (pg_column_size(draft_content) <= 100000),
  published_content jsonb
    check (published_content is null or pg_column_size(published_content) <= 100000),
  status public.page_status not null default 'draft',
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  storage_path text not null unique,
  media_type public.media_type not null,
  mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  -- Files must live under their business folder.
  constraint media_path_in_business_folder check (
    storage_path like business_id::text || '/%'
  )
);
create index media_business_idx on public.media (business_id);

-- ---------------------------------------------------------------------------
-- qr_codes (destination_path is what is printed; never rewritten)
-- ---------------------------------------------------------------------------
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  destination_path text not null check (destination_path like '/negocio/%'),
  created_at timestamptz not null default now()
);
create index qr_codes_business_idx on public.qr_codes (business_id);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) <= 120),
  description text check (char_length(description) <= 1000),
  image_path text,
  sort_order integer not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) <= 160),
  summary text check (char_length(summary) <= 300),
  description text check (char_length(description) <= 4000),
  images text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quote_requests (written only through submit_quote_request())
-- ---------------------------------------------------------------------------
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  phone text check (char_length(phone) <= 40),
  email text check (char_length(email) <= 200),
  business_type text check (char_length(business_type) <= 120),
  product_id uuid references public.products (id) on delete set null,
  message text check (char_length(message) <= 2000),
  ip_hash text,
  status public.quote_status not null default 'new',
  created_at timestamptz not null default now()
);
create index quote_requests_created_idx on public.quote_requests (created_at desc);
create index quote_requests_ip_idx on public.quote_requests (ip_hash, created_at);
