import type { Metadata } from "next";
import Link from "next/link";

import { TRIAL_DAYS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Condiciones para usar las guías digitales de emblemático.",
  alternates: { canonical: "/terminos" },
};

const h2 = "mt-10 mb-3 text-xl";
const p = "text-ink-soft mb-3 leading-relaxed";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-3xl">Términos de uso</h1>
      <p className="text-ink-soft mb-8 text-sm">
        Última actualización: 17 de noviembre de 2026
      </p>

      <h2 className={h2}>1. El servicio</h2>
      <p className={p}>
        emblemático ofrece guías digitales para huéspedes de alojamientos
        turísticos, con un panel donde cada cliente crea y edita su guía, y un
        código QR que la abre. Al crear una cuenta aceptas estos términos.
      </p>

      <h2 className={h2}>2. Tu cuenta</h2>
      <p className={p}>
        Debes dar un correo válido que sea tuyo y mantener segura tu contraseña.
        Cada persona puede tener una sola cuenta de registro propio. Eres
        responsable de lo que ocurra en tu cuenta.
      </p>

      <h2 className={h2}>3. Planes y prueba gratuita</h2>
      <p className={p}>
        Al registrarte empiezas con Hospitality Essential por {TRIAL_DAYS} días,
        sin tarjeta. Si no continúas con un plan de pago, tu cuenta pasa a la
        versión básica: tu guía y tu código QR siguen funcionando, con los
        límites que se indican en la página de planes (por ejemplo, un solo
        alojamiento activo). Los alojamientos que excedan el límite se pausan,
        no se borran, y se reactivan al volver a un plan que los incluya. Los
        precios y las condiciones de cada plan se publican en{" "}
        <Link href="/#planes" className="text-teal-deep underline">
          la página de planes
        </Link>
        .
      </p>

      <h2 className={h2}>4. Contenido de tu guía</h2>
      <p className={p}>
        El contenido que publicas es tuyo y eres responsable de que sea veraz,
        de que tengas derecho a usarlo (textos, fotos, marcas) y de que no
        infrinja la ley ni derechos de terceros. Nos autorizas a alojarlo y
        mostrarlo para prestar el servicio.
      </p>

      <h2 className={h2}>5. Uso aceptable</h2>
      <p className={p}>
        No puedes usar el servicio para engañar o estafar a huéspedes, publicar
        contenido ilegal, ofensivo o engañoso, enviar spam, ni intentar vulnerar
        la seguridad del sitio. Podemos suspender o retirar una guía que
        incumpla estos términos, o que reciba reportes verosímiles de abuso,
        mientras lo revisamos.
      </p>

      <h2 className={h2}>6. Disponibilidad y responsabilidad</h2>
      <p className={p}>
        Hacemos lo posible por mantener el servicio disponible, pero se ofrece
        &ldquo;tal cual&rdquo;, sin garantía de que no tenga interrupciones o
        errores. En la medida que permite la ley, no respondemos por pérdidas
        indirectas derivadas del uso del servicio. Tú eres responsable de la
        información que tus huéspedes consultan en tu guía.
      </p>

      <h2 className={h2}>7. Cambios</h2>
      <p className={p}>
        Podemos actualizar estos términos y los planes. Publicaremos la fecha de
        la última versión en esta página y, si el cambio es importante, te
        avisaremos por correo.
      </p>

      <h2 className={h2}>8. Ley aplicable y contacto</h2>
      <p className={p}>
        Estos términos se rigen por las leyes de Costa Rica. Si tienes dudas,
        escríbenos desde{" "}
        <Link href="/contacto" className="text-teal-deep underline">
          la página de contacto
        </Link>
        .
      </p>
    </section>
  );
}
