export default function NegocioNotFound() {
  return (
    <main className="bg-cream text-ink flex min-h-dvh items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-3xl">Esta página no está disponible</h1>
        <p className="text-ink-soft">
          Es posible que el negocio haya desactivado su página o que el enlace
          haya cambiado.
        </p>
      </div>
    </main>
  );
}
