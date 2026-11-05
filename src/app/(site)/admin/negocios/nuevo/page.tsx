import { BusinessForm } from "@/components/admin/BusinessForm";

export const metadata = { title: "Nuevo negocio" };

export default function NewBusinessPage() {
  return (
    <section className="mx-auto max-w-xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl">Nuevo negocio</h1>
      <p className="text-ink-soft">
        Se crea la página en borrador y el QR apunta a su slug. El contenido lo
        completa el cliente.
      </p>
      <BusinessForm />
    </section>
  );
}
