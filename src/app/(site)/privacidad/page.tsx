import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos recopila emblemático y cómo los usa.",
  alternates: { canonical: "/privacidad" },
};

const h2 = "mt-10 mb-3 text-xl";
const p = "text-ink-soft mb-3 leading-relaxed";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-3xl">Política de privacidad</h1>
      <p className="text-ink-soft mb-8 text-sm">
        Última actualización: 17 de noviembre de 2026
      </p>

      <h2 className={h2}>1. Qué datos recopilamos</h2>
      <p className={p}>
        Al crear una cuenta: tu nombre, correo electrónico, país y una
        contraseña (que guardamos cifrada, nunca en texto legible). Al usar el
        panel: el contenido y las imágenes de tus guías. Al contactarnos: los
        datos que nos escribas en el formulario. Para proteger el sitio contra
        abuso guardamos de forma temporal datos técnicos como una versión
        cifrada de tu dirección IP.
      </p>

      <h2 className={h2}>2. Para qué los usamos</h2>
      <p className={p}>
        Para crear y operar tu cuenta y tus guías, enviarte correos del servicio
        (confirmación, avisos de tu prueba o de tu plan), responder tus
        consultas, prevenir fraude y abuso, y mejorar el servicio. No vendemos
        tus datos.
      </p>

      <h2 className={h2}>3. Con quién los compartimos</h2>
      <p className={p}>
        Usamos proveedores que procesan datos por nuestra cuenta: Supabase (base
        de datos, autenticación y archivos), Vercel (alojamiento del sitio),
        Resend (envío de correos) y Cloudflare (verificación anti-robots al
        registrarte o ingresar). Cuando existan pagos en línea se sumará el
        proveedor de pagos. Estos proveedores pueden tratar datos fuera de Costa
        Rica.
      </p>

      <h2 className={h2}>4. Las guías son públicas</h2>
      <p className={p}>
        Lo que publicas en una guía lo puede ver cualquier persona que tenga el
        enlace o el código QR. No incluyas en ella datos personales de terceros
        ni información que no quieras compartir con tus huéspedes.
      </p>

      <h2 className={h2}>5. Cuánto tiempo los guardamos</h2>
      <p className={p}>
        Mientras tu cuenta esté activa y el tiempo necesario para cumplir
        obligaciones legales. Puedes pedir que eliminemos tu cuenta y tus guías.
      </p>

      <h2 className={h2}>6. Tus derechos</h2>
      <p className={p}>
        Puedes pedir acceso, rectificación o eliminación de tus datos, y retirar
        tu consentimiento, conforme a la Ley de Protección de la Persona frente
        al tratamiento de sus datos personales (Ley 8968) de Costa Rica.
        Escríbenos desde{" "}
        <Link href="/contacto" className="text-teal-deep underline">
          la página de contacto
        </Link>
        .
      </p>

      <h2 className={h2}>7. Cookies</h2>
      <p className={p}>
        Usamos cookies necesarias para mantener tu sesión iniciada y para
        completar el registro. No usamos cookies de publicidad.
      </p>

      <h2 className={h2}>8. Cambios</h2>
      <p className={p}>
        Si actualizamos esta política, cambiaremos la fecha de arriba y, si el
        cambio es importante, te avisaremos por correo.
      </p>
    </section>
  );
}
