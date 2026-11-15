import { STEPS } from "@/lib/content/hospitality";

export function Steps() {
  return (
    <ol className="grid gap-8 md:grid-cols-3">
      {STEPS.map((step, index) => (
        <li key={step.title} className="space-y-3">
          <span className="text-sand-dark font-serif text-4xl">
            0{index + 1}
          </span>
          <h3 className="text-xl">{step.title}</h3>
          <p className="text-ink-soft">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
