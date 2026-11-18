import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AccountPlanForm } from "@/components/admin/AccountPlanForm";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { SuspendAccountForm } from "@/components/admin/SuspendAccountForm";
import { AdminNotice, inputClass } from "@/components/admin/ui";
import { removeMember } from "@/app/(site)/admin/usuarios/actions";
import {
  ACCOUNT_SUSPENSION_PREFIX,
  TRIAL_EXTENSIONS,
  accountState,
  planName,
  propertyLimitFor,
} from "@/lib/admin/accounts";
import { loadAccount } from "@/lib/admin/accounts-data";
import { memberRoleLabel } from "@/lib/admin/labels";
import { countryOptions } from "@/lib/auth/countries";
import { pausedGuideIds } from "@/lib/panel/entitlements-shared";
import { createClient } from "@/lib/supabase/server";

import { dropToFree, extendTrial, reactivateAccount } from "./actions";

const CARD = "border-cream-dark space-y-4 rounded-2xl border bg-white p-5";
const TONE = {
  ok: "bg-teal/15 text-teal-deep",
  trial: "bg-sand/40 text-ink",
  warn: "bg-red-100 text-red-800",
  muted: "bg-cream-dark text-ink-soft",
} as const;

const EVENT_LABELS: Record<string, string> = {
  "admin.plan_set": "Plan cambiado",
  "admin.trial_extended": "Prueba extendida",
  "admin.dropped_to_free": "Bajada a Free",
  "admin.account_suspended": "Cuenta suspendida",
  "admin.account_reactivated": "Cuenta reactivada",
  "admin.invited_with_plan": "Invitada con plan",
};

const dateTime = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Costa_Rica",
});
const date = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "medium",
  timeZone: "America/Costa_Rica",
});

function codeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function eventSummary(payload: Record<string, unknown>): string {
  const after = payload.after;
  const parts: string[] = [];
  if (after && typeof after === "object" && "plan" in after) {
    const plan = (after as { plan?: unknown }).plan;
    if (typeof plan === "string") parts.push(planName(plan as never));
  }
  if (typeof payload.note === "string" && payload.note)
    parts.push(payload.note);
  if (typeof payload.by === "string") parts.push(`por ${payload.by}`);
  return parts.join(" · ");
}

async function Account({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/usuarios/[id]">["params"];
  searchParams: PageProps<"/admin/usuarios/[id]">["searchParams"];
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const account = await loadAccount(supabase, id);
  if (!account) notFound();

  const { profile, sub, guides, events, blocked } = account;
  const state = accountState(sub);
  const isAdmin = profile.role === "admin";
  const country = profile.country
    ? (countryOptions("es").find((c) => c.code === profile.country)?.name ??
      profile.country)
    : null;
  const ownedGuides = guides.filter((g) => g.role === "owner");
  const usedCount = ownedGuides.filter((g) => g.status !== "archived").length;
  const limit = propertyLimitFor(state.effectivePlan, sub);
  const paused = isAdmin
    ? new Set<string>()
    : pausedGuideIds(
        ownedGuides.map((g) => ({
          id: g.id,
          createdAt: g.createdAt,
          status: g.status,
        })),
        limit,
      );
  const onTrialOrFree =
    sub?.status === "trialing" || state.effectivePlan === "free";

  return (
    <>
      <AdminNotice code={codeOf(query.aviso)} />

      <header className="space-y-2">
        <Link
          href="/admin/usuarios"
          className="text-ink-soft text-sm underline"
        >
          ← Usuarios
        </Link>
        <h1 className="text-3xl">{profile.full_name || "Sin nombre"}</h1>
        <p className="text-ink-soft text-sm">
          {profile.email}
          {country ? ` · ${country}` : ""} · Registro{" "}
          {date.format(new Date(profile.created_at))} ·{" "}
          {isAdmin
            ? "Administración"
            : profile.self_signup
              ? "Se registró solo"
              : "Invitada por el admin"}
        </p>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${TONE[state.tone]}`}
          >
            {planName(state.effectivePlan)} · {state.label}
          </span>
          {blocked ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
              Ingreso bloqueado
            </span>
          ) : null}
        </div>
      </header>

      <section className={CARD}>
        <h2 className="text-2xl">Suscripción</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-ink-soft">Plan guardado</dt>
          <dd>{sub ? planName(sub.plan) : "—"}</dd>
          <dt className="text-ink-soft">Estado</dt>
          <dd>{sub?.status ?? "—"}</dd>
          {sub?.trial_ends_at ? (
            <>
              <dt className="text-ink-soft">Fin de la prueba</dt>
              <dd>{date.format(new Date(sub.trial_ends_at))}</dd>
            </>
          ) : null}
          {sub?.current_period_end ? (
            <>
              <dt className="text-ink-soft">Vence</dt>
              <dd>{date.format(new Date(sub.current_period_end))}</dd>
            </>
          ) : null}
          <dt className="text-ink-soft">Hospedajes</dt>
          <dd>
            {usedCount} de {limit >= 1000 ? "sin límite" : limit}
          </dd>
        </dl>
      </section>

      {isAdmin ? null : (
        <>
          <section className={CARD}>
            <h2 className="text-2xl">Cambiar plan</h2>
            <p className="text-ink-soft text-sm">
              Para pagos por SINPE o tarjeta. Queda en el historial.
            </p>
            <AccountPlanForm
              userId={profile.id}
              initial={{
                plan: state.effectivePlan,
                period: sub?.billing_period ?? null,
                periodEnd:
                  sub?.status === "trialing"
                    ? null
                    : (sub?.current_period_end ?? null),
                extraProperties: sub?.extra_properties ?? 0,
                limitOverride: sub?.property_limit_override ?? null,
              }}
            />
          </section>

          {onTrialOrFree ? (
            <section className={CARD}>
              <h2 className="text-2xl">Prueba</h2>
              <p className="text-ink-soft text-sm">
                Suma días a la prueba de Essential. Si ya venció, empieza de
                nuevo desde hoy.
              </p>
              <div className="flex flex-wrap gap-2">
                {TRIAL_EXTENSIONS.map((days) => (
                  <form key={days} action={extendTrial}>
                    <input type="hidden" name="userId" value={profile.id} />
                    <input type="hidden" name="days" value={days} />
                    <SubmitButton variant="secondary">{`+${days} días`}</SubmitButton>
                  </form>
                ))}
              </div>
            </section>
          ) : null}

          {state.effectivePlan !== "free" ? (
            <section className={CARD}>
              <h2 className="text-2xl">Falta de pago</h2>
              <p className="text-ink-soft text-sm">
                Baja la cuenta a Free ahora: su guía más antigua sigue activa,
                las demás quedan en pausa (sus QR abren la activa) y puede
                seguir entrando al panel.
              </p>
              <form action={dropToFree} className="space-y-3">
                <input type="hidden" name="userId" value={profile.id} />
                <input
                  name="reason"
                  maxLength={400}
                  placeholder="Motivo (opcional): falta de pago"
                  className={inputClass}
                />
                <SubmitButton variant="secondary">Bajar a Free</SubmitButton>
              </form>
            </section>
          ) : null}

          <section className={CARD}>
            <h2 className="text-2xl">Mal uso o estafa</h2>
            {blocked ? (
              <>
                <p className="text-ink-soft text-sm">
                  La cuenta no puede ingresar y sus guías están suspendidas.
                  Reactivarla devuelve el ingreso y reactiva solo las guías que
                  se suspendieron con la cuenta.
                </p>
                <form action={reactivateAccount}>
                  <input type="hidden" name="userId" value={profile.id} />
                  <SubmitButton>Reactivar cuenta</SubmitButton>
                </form>
              </>
            ) : (
              <>
                <p className="text-ink-soft text-sm">
                  Bloquea el ingreso al panel y suspende todas sus guías (dejan
                  de verse en público). No borra nada.
                </p>
                <SuspendAccountForm userId={profile.id} />
              </>
            )}
          </section>
        </>
      )}

      <section className={CARD}>
        <h2 className="text-2xl">Guías</h2>
        {guides.length === 0 ? (
          <p className="text-ink-soft text-sm">Sin guías.</p>
        ) : (
          <ul className="divide-cream-dark divide-y text-sm">
            {guides.map((guide) => (
              <li
                key={guide.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="min-w-0">
                  <Link
                    href={`/admin/negocios/${guide.id}`}
                    className="font-medium underline"
                  >
                    {guide.name}
                  </Link>
                  <span className="text-ink-soft block">
                    {memberRoleLabel(guide.role)} ·{" "}
                    {guide.status === "suspended"
                      ? guide.suspendedReason?.startsWith(
                          ACCOUNT_SUSPENSION_PREFIX,
                        )
                        ? "Suspendida con la cuenta"
                        : `Suspendida${guide.suspendedReason ? `: ${guide.suspendedReason}` : ""}`
                      : guide.status === "archived"
                        ? "Archivada"
                        : paused.has(guide.id)
                          ? "En pausa por el plan"
                          : "Activa"}
                  </span>
                </span>
                <form action={removeMember}>
                  <input type="hidden" name="businessId" value={guide.id} />
                  <input type="hidden" name="userId" value={profile.id} />
                  <input
                    type="hidden"
                    name="returnTo"
                    value={`/admin/usuarios/${profile.id}`}
                  />
                  <SubmitButton variant="secondary">Quitar acceso</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={CARD}>
        <h2 className="text-2xl">Historial</h2>
        {events.length === 0 ? (
          <p className="text-ink-soft text-sm">Sin cambios manuales.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((event) => (
              <li key={event.id}>
                <span className="font-medium">
                  {EVENT_LABELS[event.type] ?? event.type}
                </span>{" "}
                <span className="text-ink-soft">
                  · {dateTime.format(new Date(event.receivedAt))}
                  {eventSummary(event.payload)
                    ? ` · ${eventSummary(event.payload)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AccountPage({
  params,
  searchParams,
}: PageProps<"/admin/usuarios/[id]">) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Account params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
