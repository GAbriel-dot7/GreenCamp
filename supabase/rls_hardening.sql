-- Production hardening for RLS policies.
-- Run this AFTER schema.sql and seed.sql.

-- 1) Replace broad public policies for catalog with restaurant-scoped rules.
drop policy if exists "public read active categories" on categories;
create policy "public read active categories"
on categories
for select
using (
  is_active = true
  and restaurant_id = 'greencamp'
);

drop policy if exists "public read available products" on products;
create policy "public read available products"
on products
for select
using (
  available = true
  and restaurant_id = 'greencamp'
);

drop policy if exists "public read product groups" on product_groups;
create policy "public read product groups"
on product_groups
for select
using (
  exists (
    select 1
    from products p
    where p.id = product_groups.product_id
      and p.restaurant_id = 'greencamp'
      and p.available = true
  )
);

drop policy if exists "public read product group options" on product_group_options;
create policy "public read product group options"
on product_group_options
for select
using (
  exists (
    select 1
    from product_groups pg
    join products p on p.id = pg.product_id
    where pg.id = product_group_options.group_id
      and p.restaurant_id = 'greencamp'
      and p.available = true
  )
);

-- 2) Restrict public order insert and remove public order listing.
drop policy if exists "public read own restaurant orders" on orders;

drop policy if exists "public insert orders" on orders;
create policy "public insert orders"
on orders
for insert
with check (
  restaurant_id = 'greencamp'
  and status = 'novo'
  and order_type in ('retirada', 'entrega')
  and subtotal >= 0
  and total >= 0
  and jsonb_typeof(items) = 'array'
);

-- 3) Restrict admin management to authenticated users and greencamp rows.
drop policy if exists "admin manage categories" on categories;
create policy "admin manage categories"
on categories
for all
using (
  auth.role() = 'authenticated'
  and restaurant_id = 'greencamp'
)
with check (
  auth.role() = 'authenticated'
  and restaurant_id = 'greencamp'
);

drop policy if exists "admin manage products" on products;
create policy "admin manage products"
on products
for all
using (
  auth.role() = 'authenticated'
  and restaurant_id = 'greencamp'
)
with check (
  auth.role() = 'authenticated'
  and restaurant_id = 'greencamp'
);

drop policy if exists "admin manage orders" on orders;
create policy "admin manage orders"
on orders
for all
using (
  auth.role() = 'authenticated'
  and restaurant_id = 'greencamp'
)
with check (
  auth.role() = 'authenticated'
  and restaurant_id = 'greencamp'
);
