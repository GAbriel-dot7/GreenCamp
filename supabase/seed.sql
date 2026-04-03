insert into restaurants (id, name, slug)
values ('greencamp', 'Green Camp Restaurante', 'greencamp')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    updated_at = now();

insert into categories (restaurant_id, name, slug, sort_order)
values
  ('greencamp', 'Entradas', 'entradas', 1),
  ('greencamp', 'Saladas', 'saladas', 2),
  ('greencamp', 'Trios', 'trios', 3),
  ('greencamp', 'Porções Frias', 'porcoes-frias', 4),
  ('greencamp', 'Porções Quentes', 'porcoes-quentes', 5),
  ('greencamp', 'Tilápia', 'tilapia', 6),
  ('greencamp', 'Frutos do Mar', 'frutos-do-mar', 7),
  ('greencamp', 'Salmão', 'salmao', 8),
  ('greencamp', 'Robalo', 'robalo', 9),
  ('greencamp', 'Camarão', 'camarao', 10),
  ('greencamp', 'Abadejo', 'abadejo', 11),
  ('greencamp', 'Pacu', 'pacu', 12),
  ('greencamp', 'Frango', 'frango', 13),
  ('greencamp', 'Massas', 'massas', 14),
  ('greencamp', 'Suíno', 'suino', 15),
  ('greencamp', 'Guarnições', 'guarnicoes', 16),
  ('greencamp', 'Carnes Nobres', 'carnes-nobres', 17),
  ('greencamp', 'Bebidas', 'bebidas', 18),
  ('greencamp', 'Cervejas', 'cervejas', 19),
  ('greencamp', 'Drinks', 'drinks', 20),
  ('greencamp', 'Sobremesas', 'sobremesas', 21)
on conflict (restaurant_id, slug) do nothing;
