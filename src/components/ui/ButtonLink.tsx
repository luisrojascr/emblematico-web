import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "light";

const STYLES: Record<Variant, string> = {
  primary: "bg-ink text-cream hover:bg-sand-dark",
  secondary: "border border-ink/30 text-ink hover:border-ink hover:bg-ink/5",
  light: "bg-cream text-ink hover:bg-sand",
};

type Props = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors ${STYLES[variant]} ${className}`}
    />
  );
}

type ExternalProps = ComponentProps<"a"> & { variant?: Variant };

/** External link (WhatsApp, etc.) opened in a new tab. */
export function ExternalButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ExternalProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors ${STYLES[variant]} ${className}`}
    />
  );
}
