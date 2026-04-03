create extension if not exists "pgcrypto";

create table if not exists restaurants (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  base_price numeric(10,2) not null default 0,
  image_url text,
  product_type text not null default 'simple',
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table if not exists product_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  group_type text not null default 'single',
  required boolean not null default false,
  min_selected integer not null default 0,
  max_selected integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_group_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references product_groups(id) on delete cascade,
  label text not null,
  price_delta numeric(10,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants(id) on delete cascade,
  customer_name text,
  customer_phone text,
  order_type text not null default 'retirada',
  status text not null default 'novo',
  notes text,
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  printer_text text,
  source text not null default 'cardapio',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by text,
  created_at timestamptz not null default now()
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists storage_assets (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants(id) on delete cascade,
  bucket text not null,
  path text not null,
  public_url text,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_restaurant_sort on categories (restaurant_id, sort_order, name);
create index if not exists idx_products_restaurant_category on products (restaurant_id, category_id, sort_order, name);
create index if not exists idx_products_available on products (restaurant_id, available);
create index if not exists idx_orders_restaurant_status_created on orders (restaurant_id, status, created_at desc);
create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_admin_users_restaurant on admin_users (restaurant_id);

alter table restaurants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_groups enable row level security;
alter table product_group_options enable row level security;
alter table orders enable row level security;
alter table order_status_history enable row level security;
alter table admin_users enable row level security;
alter table storage_assets enable row level security;

create policy "public read active categories" on categories
  for select using (is_active = true);

create policy "public read available products" on products
  for select using (available = true);

create policy "public read product groups" on product_groups
  for select using (true);

create policy "public read product group options" on product_group_options
  for select using (true);

create policy "public insert orders" on orders
  for insert with check (true);

create policy "public read own restaurant orders" on orders
  for select using (true);

create policy "admin manage restaurants" on restaurants
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage categories" on categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage products" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage product groups" on product_groups
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage product group options" on product_group_options
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage orders" on orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage order history" on order_status_history
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage users" on admin_users
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin manage assets" on storage_assets
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
