import { FEATURES } from "@/lib/content/hospitality";

export function FeatureGrid() {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f, index) => (
        <li
          key={f.title}
          className="border-cream-dark space-y-2 rounded-2xl border bg-white p-6"
        >
          <span className="text-sand-dark font-serif text-2xl">
            0{index + 1}
          </span>
          <h3 className="text-xl">{f.title}</h3>
          <p className="text-ink-soft text-sm">{f.text}</p>
        </li>
      ))}
    </ul>
  );
}
