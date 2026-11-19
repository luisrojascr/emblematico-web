import Link from "next/link";
import { Suspense } from "react";

import { SubmitButton } from "@/components/admin/SubmitButton";
import { AdminNotice } from "@/components/admin/ui";
import { setReportStatus } from "@/app/(site)/admin/reportes/actions";
import { reportReasonLabel } from "@/lib/reports/schema";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 100;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Costa_Rica",
  }).format(new Date(iso));
}

const FILTERS = [
  { id: "abiertos", label: "Por revisar" },
  { id: "todos", label: "Todos" },
] as const;

async function Reports({
  searchParams,
}: {
  searchParams: PageProps<"/admin/reportes">["searchParams"];
}) {
  const query = await searchParams;
  const filter = first(query.estado) === "todos" ? "todos" : "abiertos";
  const supabase = await createClient();
  let request = supabase
    .from("guide_reports")
    .select(
      "id, slug, reason, details, contact_email, status, created_at, reviewed_at, business_id, businesses(name, status)",
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (filter === "abiertos") request = request.eq("status", "open");
  const { data, error } = await request;

  if (error)
    return (
      <p className="text-sm text-red-700">No pudimos cargar los reportes.</p>
    );

  return (
    <>
      <AdminNotice code={first(query.aviso)} />
      <nav aria-label="Filtro" className="flex gap-4 text-sm">
        {FILTERS.map((item) => (
          <Link
            key={item.id}
            href={`/admin/reportes?estado=${item.id}`}
            aria-current={filter === item.id ? "page" : undefined}
            className={
              filter === item.id
                ? "text-ink font-semibold"
                : "text-sand-dark underline"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {data.length === 0 ? (
        <p className="text-ink-soft">
          {filter === "abiertos"
            ? "No hay reportes por revisar."
            : "Todavía no hay reportes."}
        </p>
      ) : (
        <ul className="space-y-4">
          {data.map((report) => {
            const business = report.businesses;
            const open = report.status === "open";
            return (
              <li
                key={report.id}
                className="border-cream-dark space-y-3 rounded-2xl border bg-white p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl">
                    <Link
                      href={`/admin/negocios/${report.business_id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {business?.name ?? report.slug}
                    </Link>
                  </h2>
                  <time
                    dateTime={report.created_at}
                    className="text-ink-soft text-sm"
                  >
                    {formatWhen(report.created_at)}
                  </time>
                </div>
                <p className="text-sm">
                  <span className="font-semibold">
                    {reportReasonLabel(report.reason)}
                  </span>
                  {" · "}
                  <a
                    href={`/negocio/${report.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="text-sand-dark underline"
                  >
                    Ver guía
                  </a>
                  {business?.status === "suspended" ? " · Guía suspendida" : ""}
                </p>
                {report.details ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {report.details}
                  </p>
                ) : null}
                {report.contact_email ? (
                  <p className="text-ink-soft text-sm">
                    Contacto: {report.contact_email}
                  </p>
                ) : null}
                <form
                  action={setReportStatus}
                  className="flex flex-wrap items-center gap-3"
                >
                  <input type="hidden" name="reportId" value={report.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={open ? "reviewed" : "open"}
                  />
                  <SubmitButton variant="secondary">
                    {open ? "Marcar revisado" : "Volver a abrir"}
                  </SubmitButton>
                  {!open && report.reviewed_at ? (
                    <span className="text-ink-soft text-sm">
                      Revisado el {formatWhen(report.reviewed_at)}
                    </span>
                  ) : null}
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-ink-soft text-sm">
        Para suspender una guía, abre su ficha en Negocios. Un reporte nunca la
        oculta por sí solo.
      </p>
    </>
  );
}

export default function ReportsPage({
  searchParams,
}: PageProps<"/admin/reportes">) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl">Reportes de guías</h1>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Reports searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
