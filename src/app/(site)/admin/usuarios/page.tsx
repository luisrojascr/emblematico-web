import Link from "next/link";
import { Suspense } from "react";

import { AssignForm } from "@/components/admin/AssignForm";
import { InviteForm } from "@/components/admin/InviteForm";
import { AdminNotice, inputClass } from "@/components/admin/ui";
import {
  ACCOUNT_FILTERS,
  accountFilter,
  accountState,
  matchesAccount,
  planName,
  propertyLimitFor,
} from "@/lib/admin/accounts";
import { blockedUserIds, loadAccounts } from "@/lib/admin/accounts-data";
import { createClient } from "@/lib/supabase/server";

const TONE = {
  ok: "bg-teal/15 text-teal-deep",
  trial: "bg-sand/40 text-ink",
  warn: "bg-red-100 text-red-800",
  muted: "bg-cream-dark text-ink-soft",
} as const;

const date = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "medium",
  timeZone: "America/Costa_Rica",
});

function codeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Users({
  searchParams,
}: {
  searchParams: PageProps<"/admin/usuarios">["searchParams"];
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const [accounts, blocked, { data: businesses }] = await Promise.all([
    loadAccounts(supabase),
    blockedUserIds(),
    supabase.from("businesses").select("id, name").order("name"),
  ]);
  const filter = accountFilter(codeOf(query.filtro));
  const search = codeOf(query.q) ?? "";
  const now = new Date();
  const rows = accounts
    .map((account) => ({ ...account, blocked: blocked.has(account.id) }))
    .filter((account) => matchesAccount(account, filter, search, now));

  return (
    <>
      <AdminNotice code={codeOf(query.aviso)} />
      <section className="border-cream-dark space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-2xl">Invitar</h2>
        <p className="text-ink-soft text-sm">
          La invitación llega por correo. Si ya pagó, elige su plan aquí; si no,
          entra en Free. Luego le asignas un negocio.
        </p>
        <InviteForm />
      </section>
      <section className="border-cream-dark space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-2xl">Asignar un negocio</h2>
        <AssignForm
          users={accounts.map((account) => ({
            id: account.id,
            label: `${account.fullName || "Sin nombre"} · ${account.email ?? ""}`,
          }))}
          businesses={(businesses ?? []).map((business) => ({
            id: business.id,
            label: business.name,
          }))}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl">Cuentas</h2>
        <form className="flex flex-wrap gap-2" role="search">
          <input
            name="q"
            defaultValue={search}
            placeholder="Buscar por correo o nombre"
            aria-label="Buscar por correo o nombre"
            className={`${inputClass} max-w-xs`}
          />
          {filter !== "todas" ? (
            <input type="hidden" name="filtro" value={filter} />
          ) : null}
        </form>
        <nav
          aria-label="Filtrar cuentas"
          className="flex flex-wrap gap-2 text-sm"
        >
          {Object.entries(ACCOUNT_FILTERS).map(([key, label]) => {
            const params = new URLSearchParams();
            if (key !== "todas") params.set("filtro", key);
            if (search) params.set("q", search);
            const href = `/admin/usuarios${params.size ? `?${params}` : ""}`;
            return (
              <Link
                key={key}
                href={href}
                aria-current={filter === key ? "page" : undefined}
                className={`rounded-full border px-3 py-1 ${
                  filter === key
                    ? "border-ink bg-ink text-cream"
                    : "border-cream-dark hover:border-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="text-ink-soft text-sm">
          {rows.length === 1 ? "1 cuenta" : `${rows.length} cuentas`}
        </p>
        <ul className="space-y-3">
          {rows.map((account) => {
            const state = accountState(account.sub, now);
            const limit = propertyLimitFor(state.effectivePlan, account.sub);
            return (
              <li key={account.id}>
                <Link
                  href={`/admin/usuarios/${account.id}`}
                  className="border-cream-dark hover:border-ink/40 block rounded-2xl border bg-white p-4 transition-colors"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {account.fullName || "Sin nombre"}
                    </span>
                    <span className="flex flex-wrap gap-2">
                      {account.blocked ? (
                        <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-800">
                          Bloqueada
                        </span>
                      ) : null}
                      {account.role === "admin" ? (
                        <span className="bg-cream-dark rounded-full px-3 py-0.5 text-xs font-bold">
                          Administración
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold ${TONE[state.tone]}`}
                        >
                          {planName(state.effectivePlan)} · {state.label}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-ink-soft mt-1 block text-sm">
                    {account.email}
                    {account.country ? ` · ${account.country}` : ""} ·{" "}
                    {account.role === "admin"
                      ? `${account.owned} hospedajes`
                      : `${account.owned} de ${limit >= 1000 ? "sin límite" : limit} hospedajes`}{" "}
                    · {account.selfSignup ? "Registro propio" : "Invitada"} ·{" "}
                    {date.format(new Date(account.createdAt))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

export default function UsersPage({
  searchParams,
}: PageProps<"/admin/usuarios">) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl">Usuarios</h1>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Users searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
