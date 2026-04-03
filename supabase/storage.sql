-- Create public bucket for product images and policies for admin uploads.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read for product images (needed by customer menu).
create policy "public read product images"
on storage.objects
for select
using (bucket_id = 'product-images');

-- Authenticated users can upload/update/delete files in the bucket.
create policy "admin upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "admin update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "admin delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');
