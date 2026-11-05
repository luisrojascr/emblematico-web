-- Dev seed: catalog only. PLACEHOLDER copy and images; replace via /admin before launch.
-- Re-runnable: updates existing rows by slug.

insert into public.product_categories (slug, name, description, image_path, sort_order) values
  ('welcome-station', 'Welcome Station',
   'Punto central de información para tus huéspedes: nombre de tu alojamiento, código QR personalizado y acceso a tu guía digital.',
   '/images/catalog/welcome-station.webp', 1),
  ('room-essentials', 'Room Essentials',
   'Identificadores para áreas y servicios clave: Wi-Fi, aire acondicionado, reciclaje, check-out y más, con código QR opcional.',
   '/images/catalog/room-essentials.webp', 2),
  ('business-qr-displays', 'Business QR Displays',
   'Displays de mesa y mostrador con QR hacia tu menú, tus reseñas de Google o tus redes, listos para tu negocio.',
   '/images/catalog/business-qr-displays.webp', 3),
  ('hospitality-kits', 'Hospitality Kits',
   'La solución completa para tu alojamiento turístico: Welcome Station, identificadores, portallaves y guía digital con diseño coherente.',
   '/images/catalog/hospitality-kits.webp', 4)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_path = excluded.image_path,
  sort_order = excluded.sort_order;

insert into public.products (category_id, slug, name, summary, description, images, sort_order)
select c.id, v.slug, v.name, v.summary, v.description, array[v.image], v.sort_order
from (values
  ('welcome-station', 'welcome-station-clasica', 'Welcome Station clásica',
   'Soporte de bienvenida con el nombre de tu alojamiento y QR a tu guía digital.',
   E'Punto central de información para tus huéspedes.\n\nIncluye el nombre de tu alojamiento, un mensaje de bienvenida bilingüe, código QR personalizado y base estable. Diseño elegante, impreso en 3D con los colores y el logo de tu marca.\n\nEl QR apunta a tu página digital, que tú mismo puedes actualizar sin reimprimir.',
   '/images/catalog/welcome-station.webp', 1),
  ('room-essentials', 'placas-de-servicios', 'Placas de servicios',
   'Set de identificadores para Wi-Fi, A/C, reciclaje, check-out y más.',
   E'Conjunto de identificadores para áreas y servicios clave de tu alojamiento.\n\nWi-Fi, aire acondicionado, reciclaje, reglas de la casa, check-out y otros. Diseño uniforme, con código QR opcional hacia información detallada.\n\nIdeal para habitaciones y áreas comunes.',
   '/images/catalog/room-essentials.webp', 1),
  ('business-qr-displays', 'display-qr-mesa', 'Display QR de mesa',
   'Display compacto para menú, reseñas de Google o redes sociales.',
   E'Display de mesa o mostrador con un código QR claro y tu identidad de marca.\n\nLleva a tus clientes a tu menú, tu catálogo, tus reseñas de Google o tus redes sociales. Si algo cambia, actualizas el destino desde tu panel sin reimprimir el display.',
   '/images/catalog/business-qr-displays.webp', 1),
  ('hospitality-kits', 'kit-de-hospedaje', 'Kit de hospedaje',
   'Welcome Station, identificadores, portallaves y guía digital en un solo diseño.',
   E'La solución completa para tu alojamiento turístico.\n\nWelcome Station personalizada, identificadores de servicios, portallaves y una guía digital con tu información, todo con diseño coherente y profesional.\n\nCotiza el kit según la cantidad de habitaciones y los servicios que necesites identificar.',
   '/images/catalog/hospitality-kits.webp', 1)
) as v(category_slug, slug, name, summary, description, image, sort_order)
join public.product_categories c on c.slug = v.category_slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  summary = excluded.summary,
  description = excluded.description,
  images = excluded.images,
  sort_order = excluded.sort_order;
