import { type PlanFeature } from "@/lib/plans";

/**
 * Un punto de la lista de un plan. Si trae `items`, se muestra como desplegable
 * (por ejemplo, los 15 servicios estándar de Essential).
 */
export function PlanFeatureItem({
  feature,
  translate = (text) => text,
  className = "",
  checkClassName = "",
}: {
  feature: PlanFeature;
  translate?: (text: string) => string;
  className?: string;
  checkClassName?: string;
}) {
  const check = (
    <span aria-hidden="true" className={checkClassName}>
      ✓
    </span>
  );
  if (typeof feature === "string") {
    return (
      <li className={`flex gap-2 ${className}`}>
        {check}
        <span>{translate(feature)}</span>
      </li>
    );
  }
  return (
    <li className={className}>
      <details className="group">
        <summary className="flex cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden">
          {check}
          <span>
            {translate(feature.label)}{" "}
            <span
              aria-hidden="true"
              className="text-teal-deep inline-block text-xs transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </span>
        </summary>
        <ul className="border-cream-dark mt-2 ml-1.5 space-y-1 border-l pl-4 text-xs">
          {feature.items.map((item) => (
            <li key={item}>{translate(item)}</li>
          ))}
        </ul>
      </details>
    </li>
  );
}
