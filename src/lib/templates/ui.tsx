import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { mediaUrl } from "@/lib/catalog/media";
import { SITE } from "@/lib/site";

import type { z } from "zod";

import type { themeSchema } from "./common";

type Theme = z.infer<typeof themeSchema>;

const INK = "#1F1F1F";
const WHITE = "#FFFFFF";

/** WCAG relative luminance of a #RRGGBB color. */
function relativeLuminance(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

/** WCAG contrast ratio between two #RRGGBB colors (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick whichever of ink or white has the higher contrast ratio on the accent color. */
export function readableOn(hex: string): typeof INK | typeof WHITE {
  return contrastRatio(hex, INK) >= contrastRatio(hex, WHITE) ? INK : WHITE;
}

export function MediaImage({
  path,
  alt,
  className,
  sizes,
  priority,
}: {
  path: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={mediaUrl(path)}
      alt={alt}
      fill
      sizes={sizes}
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      className={className}
    />
  );
}

/** Page chrome shared by every client template: cover, logo, name, accent theming. */
export function TemplateFrame({
  name,
  tagline,
  theme,
  children,
}: {
  name: string;
  tagline: string;
  theme: Theme;
  children: ReactNode;
}) {
  const style = {
    "--accent": theme.accent,
    "--on-accent": readableOn(theme.accent),
  } as CSSProperties;

  return (
    <div style={style} className="bg-cream text-ink min-h-dvh">
      <header>
        <div className="relative h-44 w-full overflow-hidden bg-[var(--accent)] sm:h-64">
          {theme.cover_path ? (
            <MediaImage
              path={theme.cover_path}
              alt=""
              sizes="100vw"
              priority
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="mx-auto max-w-xl px-4 text-center">
          {theme.logo_path ? (
            <div className="relative mx-auto -mt-12 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-sm">
              <MediaImage
                path={theme.logo_path}
                alt={`Logo de ${name}`}
                sizes="96px"
                className="object-contain p-1"
              />
            </div>
          ) : null}
          <h1
            className={`text-3xl sm:text-4xl ${theme.logo_path ? "mt-4" : "mt-8"}`}
          >
            {name}
          </h1>
          {tagline ? <p className="text-ink-soft mt-2">{tagline}</p> : null}
        </div>
      </header>
      <main className="mx-auto max-w-xl space-y-4 px-4 py-8">{children}</main>
      <footer className="text-ink-soft px-4 pb-10 text-center text-xs">
        <a
          href={SITE.url}
          className="underline-offset-4 hover:underline"
          rel="noopener"
        >
          Página creada con {SITE.name}
        </a>
      </footer>
    </div>
  );
}

export function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      {title ? <h2 className="mb-3 text-xl">{title}</h2> : null}
      {children}
    </section>
  );
}

/** Multi-line plain text. Newlines become line breaks; never interpreted as HTML. */
export function PlainText({ children }: { children: string }) {
  return <p className="whitespace-pre-line">{children}</p>;
}

export function ActionLink({
  href,
  children,
  external = true,
  variant = "accent",
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  variant?: "accent" | "outline";
}) {
  const base =
    "flex w-full items-center justify-center rounded-full px-6 py-3.5 text-center text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2";
  const style: CSSProperties =
    variant === "accent"
      ? { backgroundColor: "var(--accent)", color: "var(--on-accent)" }
      : {};
  return (
    <a
      href={href}
      style={style}
      className={`${base} ${variant === "outline" ? "border-ink/30 border bg-white" : ""}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
