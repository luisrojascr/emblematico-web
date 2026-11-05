export const inputClass =
  "w-full rounded-lg border border-cream-dark bg-white px-3 py-2 outline-none focus:border-sand-dark";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-sand-dark disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-ink/30 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink/5 disabled:opacity-60";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-red-700">
      {message}
    </p>
  );
}

const NOTICES: Record<string, string> = {
  creado: "Listo. El registro quedó creado.",
  guardado: "Cambios guardados.",
  publicada: "La página quedó publicada.",
  despublicada: "La página quedó fuera de línea.",
  estado: "Estado actualizado.",
  inactivo: "Reactiva el negocio antes de publicar.",
  borrador: "El borrador no es válido, así que no se publicó.",
  acceso: "Acceso actualizado.",
  invitada: "Enviamos la invitación.",
  orden: "Orden actualizado.",
  error: "No pudimos completar esa acción.",
};

export function AdminNotice({ code }: { code?: string }) {
  if (!code || !NOTICES[code]) return null;
  const problem =
    code === "error" || code === "inactivo" || code === "borrador";
  return (
    <p
      role="status"
      className={problem ? "text-sm text-red-700" : "text-ink-soft text-sm"}
    >
      {NOTICES[code]}
    </p>
  );
}
