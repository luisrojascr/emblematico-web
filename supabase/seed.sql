-- Dev seed: catalog only. Placeholder copy; replace via /admin or before launch.
insert into public.product_categories (slug, name, description, sort_order) values
  ('welcome-station', 'Welcome Station', 'Estación de bienvenida personalizada con tu marca y código QR a la información de tu propiedad.', 1),
  ('room-essentials', 'Room Essentials', 'Accesorios de habitación impresos en 3D, con tu identidad y datos clave para el huésped.', 2),
  ('business-qr-displays', 'Business QR Displays', 'Displays de mesa y mostrador con QR hacia tu página digital, menú o reseñas.', 3),
  ('hospitality-kits', 'Hospitality Kits', 'Kits completos para hospedaje: bienvenida, habitación y señalización coordinados.', 4)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, summary, sort_order)
select c.id, v.slug, v.name, v.summary, v.sort_order
from (values
  ('welcome-station',      'welcome-station-clasica',  'Welcome Station clásica',   'Soporte de bienvenida con logo y QR a tu página.', 1),
  ('room-essentials',      'porta-wifi-habitacion',    'Porta Wi-Fi de habitación', 'Placa con red, clave y QR de contacto.', 1),
  ('business-qr-displays', 'display-qr-mesa',          'Display QR de mesa',        'Display compacto para menú, reseñas o redes.', 1),
  ('hospitality-kits',     'kit-hospedaje-esencial',   'Kit de hospedaje esencial', 'Welcome Station, porta Wi-Fi y señalización.', 1)
) as v(category_slug, slug, name, summary, sort_order)
join public.product_categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
