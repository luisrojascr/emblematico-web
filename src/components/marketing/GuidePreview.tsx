import {
  FileIcon,
  PanelIcon,
  PinIcon,
  SparkIcon,
} from "@/components/marketing/home/icons";

const LABELS = [
  { label: "Información esencial", icon: <FileIcon /> },
  { label: "Guía de la propiedad", icon: <SparkIcon /> },
  { label: "Explora la zona", icon: <PinIcon /> },
  { label: "Panel del anfitrión", icon: <PanelIcon /> },
] as const;

/** Vista estática de la guía de Casa Nébora dentro de un teléfono. */
export function GuidePreview() {
  return (
    <div
      role="img"
      aria-label="Vista de muestra de la guía de Casa Nébora en un teléfono"
      className="border-cream/20 bg-cream text-ink w-72 rounded-[2.2rem] border-[6px] p-5 shadow-2xl"
    >
      <div className="bg-ink/10 mx-auto mb-5 h-1.5 w-16 rounded-full" />
      <p className="font-serif text-2xl">Casa Nébora</p>
      <p className="text-sand-dark mb-5 text-xs font-semibold tracking-[0.12em] uppercase">
        Propiedad de muestra
      </p>
      <ul className="space-y-3">
        {LABELS.map((l) => (
          <li
            key={l.label}
            className="border-cream-dark flex items-center gap-3 rounded-lg border bg-white px-3 py-3 text-sm"
          >
            <span className="text-sand-dark scale-75">{l.icon}</span>
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
