import { Suspense } from "react";

import { SubmitButton } from "@/components/admin/SubmitButton";
import { AdminNotice, inputClass } from "@/components/admin/ui";
import { setQuoteStatus } from "@/app/(site)/admin/cotizaciones/actions";
import { QUOTE_STATUSES, quoteStatusLabel } from "@/lib/admin/labels";
import { createClient } from "@/lib/supabase/server";

function codeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Costa_Rica",
  }).format(new Date(iso));
}

async function Quotes({
  searchParams,
}: {
  searchParams: PageProps<"/admin/cotizaciones">["searchParams"];
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      "id, name, phone, email, business_type, message, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error)
    return (
      <p className="text-sm text-red-700">
        No pudimos cargar las cotizaciones.
      </p>
    );

  return (
    <>
      <AdminNotice code={codeOf(query.aviso)} />
      {data.length === 0 ? (
        <p className="text-ink-soft">Todavía no hay cotizaciones.</p>
      ) : (
        <ul className="space-y-4">
          {data.map((quote) => (
            <li
              key={quote.id}
              className="border-cream-dark space-y-3 rounded-2xl border bg-white p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl">{quote.name}</h2>
                <time
                  dateTime={quote.created_at}
                  className="text-ink-soft text-sm"
                >
                  {formatWhen(quote.created_at)}
                </time>
              </div>
              <p className="text-sm">
                {[quote.phone, quote.email, quote.business_type]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {quote.message && (
                <p className="text-sm whitespace-pre-wrap">{quote.message}</p>
              )}
              <form
                action={setQuoteStatus}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="quoteId" value={quote.id} />
                <div className="space-y-1">
                  <label
                    htmlFor={`status-${quote.id}`}
                    className="text-sm font-medium"
                  >
                    Estado
                  </label>
                  <select
                    id={`status-${quote.id}`}
                    name="status"
                    defaultValue={quote.status}
                    className={inputClass}
                  >
                    {QUOTE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {quoteStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
                <SubmitButton variant="secondary">Actualizar</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function QuotesPage({
  searchParams,
}: PageProps<"/admin/cotizaciones">) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl">Cotizaciones</h1>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Quotes searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
