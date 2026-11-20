import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { getPublicPage } from "@/lib/pages/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";
import { TemplateView, parsePageContent } from "@/lib/templates/registry";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Reject malformed slugs before they reach the DB or become cache keys. */
function isValidSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 60 && SLUG_PATTERN.test(slug);
}

// Cache Components requires at least one prerendered param. Everything else is
// rendered on first visit and cached (ISR). Build-time only; never in the render path.
export async function generateStaticParams() {
  try {
    const { data } = await createAdminClient()
      .from("businesses")
      .select("slug, pages!inner(status)")
      .eq("status", "active")
      .eq("pages.status", "published")
      .order("created_at")
      .limit(5);
    if (data && data.length > 0) return data.map(({ slug }) => ({ slug }));
  } catch {
    // Build without DB access: fall through to the placeholder.
  }
  return [{ slug: "ejemplo" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/negocio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) return { robots: { index: false, follow: false } };

  const result = await getPublicPage(slug);
  if (result.kind !== "page")
    return { robots: { index: false, follow: false } };

  return {
    title: result.name,
    alternates: { canonical: `/negocio/${result.slug}` },
    // Private by default; only indexed when the business has opted in (admin flag).
    robots: result.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: { title: result.name, siteName: SITE.name, locale: "es_CR" },
  };
}

export default async function NegocioPage({
  params,
}: PageProps<"/negocio/[slug]">) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const result = await getPublicPage(slug);
  switch (result.kind) {
    case "missing":
      notFound();
    case "redirect":
      // A guide paused by the owner's plan redirects temporarily (the pause can end
      // when the plan changes). A retired slug redirects permanently: printed QR
      // codes keep working.
      if (result.temporary) redirect(`/negocio/${result.slug}`);
      permanentRedirect(`/negocio/${result.slug}`);
    case "page": {
      const page = parsePageContent(result.templateKey, result.content);
      // Stored content that no longer validates must never render half-broken.
      if (!page) notFound();
      return (
        <TemplateView
          name={result.name}
          page={page}
          branding={result.branding}
          reportHref={`/reportar?guia=${result.slug}`}
        />
      );
    }
    default: {
      const unreachable: never = result;
      throw new Error(`Unhandled result: ${JSON.stringify(unreachable)}`);
    }
  }
}
