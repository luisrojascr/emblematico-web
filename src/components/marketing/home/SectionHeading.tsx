export function SectionHeading({
  eyebrow,
  title,
  description,
  dark = false,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  dark?: boolean;
  id?: string;
}) {
  return (
    <header className="mb-12 max-w-2xl space-y-3">
      {eyebrow && (
        <p
          className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${dark ? "text-sand" : "text-sand-dark"}`}
        >
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="text-3xl sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={dark ? "text-cream/75" : "text-ink-soft"}>
          {description}
        </p>
      )}
    </header>
  );
}
