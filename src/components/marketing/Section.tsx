import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: "cream" | "white" | "ink";
  children?: ReactNode;
};

const TONES = {
  cream: "bg-cream text-ink",
  white: "bg-white text-ink",
  ink: "bg-ink text-cream",
} as const;

export function Section({
  id,
  eyebrow,
  title,
  description,
  tone = "cream",
  children,
}: Props) {
  return (
    <section id={id} className={TONES[tone]}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {(eyebrow || title || description) && (
          <header className="mb-10 max-w-2xl space-y-3">
            {eyebrow && (
              <p
                className={`text-xs font-medium tracking-[0.2em] uppercase ${tone === "ink" ? "text-sand" : "text-sand-dark"}`}
              >
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-3xl sm:text-4xl">{title}</h2>}
            {description && (
              <p className={tone === "ink" ? "text-cream/75" : "text-ink-soft"}>
                {description}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
