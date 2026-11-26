import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "bronze";

const STYLES: Record<Variant, string> = {
  primary: "bg-sand text-ink hover:bg-sand-hover",
  outline:
    "border border-ink/30 bg-white text-ink hover:border-ink hover:bg-cream-dark",
  bronze: "bg-sand text-ink hover:bg-cream",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[4px] px-6 py-3.5 text-xs font-semibold tracking-[0.08em] uppercase transition-colors";

type Props = ComponentProps<typeof Link> & { variant?: Variant };

/** Botón de 4px de radio para el inicio, el header y el footer. */
export function SquareLink({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <Link {...props} className={`${BASE} ${STYLES[variant]} ${className}`} />
  );
}

/** Same shape as the buttons, but inert: for actions that are not available yet. */
export function SquareDisabled({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-disabled="true"
      className={`${BASE} bg-cream-dark text-ink-soft cursor-default ${className}`}
    >
      {children}
    </span>
  );
}

type ExternalProps = ComponentProps<"a"> & { variant?: Variant };

export function SquareExternalLink({
  variant = "primary",
  className = "",
  ...props
}: ExternalProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={`${BASE} ${STYLES[variant]} ${className}`}
    />
  );
}
