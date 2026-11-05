import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 py-24 text-center sm:px-6">
      <p className="text-sand-dark text-xs font-medium tracking-[0.2em] uppercase">
        Error 404
      </p>
      <h1 className="text-4xl">No encontramos esta página</h1>
      <p className="text-ink-soft">
        Es posible que el enlace haya cambiado o que la página ya no esté
        disponible.
      </p>
      <div className="flex justify-center gap-3">
        <ButtonLink href="/">Ir al inicio</ButtonLink>
        <ButtonLink href="/productos" variant="secondary">
          Ver productos
        </ButtonLink>
      </div>
    </section>
  );
}
