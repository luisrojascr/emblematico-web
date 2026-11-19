import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getPublicPage } from "@/lib/pages/public";

import { ReportForm } from "./ReportForm";

export const metadata: Metadata = {
  title: "Reportar una guía",
  robots: { index: false, follow: false },
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function slugOf(value: string | string[] | undefined): string | null {
  const slug = Array.isArray(value) ? value[0] : value;
  if (!slug || slug.length < 3 || slug.length > 60) return null;
  return SLUG_PATTERN.test(slug) ? slug : null;
}

async function Report({
  searchParams,
}: {
  searchParams: PageProps<"/reportar">["searchParams"];
}) {
  const slug = slugOf((await searchParams).guia);
  const result = slug ? await getPublicPage(slug) : null;

  if (!slug || !result || result.kind === "missing") {
    return (
      <p className="text-ink-soft">
        No encontramos esta guía. Si quieres avisarnos de algo, escríbenos desde{" "}
        <Link
          href="/contacto"
          className="text-teal-deep font-semibold underline"
        >
          contacto
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      {result.kind === "page" ? (
        <p className="text-ink-soft mb-6">
          Guía: <span className="text-ink font-semibold">{result.name}</span>
        </p>
      ) : null}
      <ReportForm slug={slug} />
    </>
  );
}

export default function ReportPage({ searchParams }: PageProps<"/reportar">) {
  return (
    <section className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <h1 className="mb-2 text-3xl">Reportar esta guía</h1>
      <p className="text-ink-soft mb-6 text-sm">
        Si una guía parece una estafa o tiene contenido indebido, avísanos. La
        revisamos y, si hace falta, la suspendemos.
      </p>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Report searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
