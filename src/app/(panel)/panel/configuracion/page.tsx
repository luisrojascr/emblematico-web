import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelLoading } from "@/components/panel/PanelLanguageProvider";
import { PanelPage } from "@/components/panel/PanelPage";
import { PlanFeatureItem } from "@/components/marketing/PlanFeatureItem";
import { PLANS, featureLabel, formatUsd, getPlan } from "@/lib/plans";
import { PlanChangeList } from "@/components/panel/PlanChangeList";
import { ProfileForm } from "@/components/panel/ProfileForm";
import {
  panelCardClass,
  panelPrimaryButtonClass,
  panelSecondaryButtonClass,
} from "@/components/panel/ui";
import { requireUser } from "@/lib/auth/session";
import { loadEntitlements } from "@/lib/panel/entitlements";
import {
  UNLIMITED_PROPERTIES,
  trialState,
} from "@/lib/panel/entitlements-shared";

import { createClient } from "@/lib/supabase/server";
import { billingMode } from "@/lib/whop/billing";
import { onlinePaymentsEnabled, whopConfig } from "@/lib/whop/config";

import { manageSubscription, startCheckout } from "./billing-actions";

export const metadata: Metadata = { title: "Configuración" };

const SECTION_TITLE = "text-ink-soft mb-3 text-xs font-bold tracking-wider";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?"
  );
}

/** `?pago=` after a checkout or a portal link: the notice shown at the top. */
type PaymentNotice = "ok" | "error" | "portal" | null;

function paymentNotice(value: string | string[] | undefined): PaymentNotice {
  return value === "ok" || value === "error" || value === "portal"
    ? value
    : null;
}

async function Settings({
  searchParams,
}: {
  searchParams: PageProps<"/panel/configuracion">["searchParams"];
}) {
  const { t, locale } = await getPanelI18n();
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: businesses }, entitlements, { data: billingRow }, query] =
    await Promise.all([
      supabase.from("businesses").select("service_expires_at"),
      loadEntitlements(),
      supabase
        .from("subscriptions")
        .select(
          "plan, status, provider, provider_subscription_id, current_period_end",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      searchParams,
    ]);
  const mode = billingMode(billingRow, {
    onlineEnabled: onlinePaymentsEnabled(whopConfig()),
    isAdmin: user.role === "admin",
  });
  const notice = paymentNotice(query.pago);
  const name = user.fullName?.trim() || user.email?.split("@")[0] || "";
  const plan = getPlan(entitlements?.plan) ?? PLANS[0]!;
  const trial = trialState(entitlements);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  // Accounts from before subscriptions existed may only have the per-guide date.
  const legacyExpiry = (businesses ?? [])
    .map((b) => b.service_expires_at)
    .filter((d): d is string => Boolean(d))
    .sort()[0];
  const periodEnd =
    entitlements?.currentPeriodEnd ??
    (legacyExpiry ? new Date(legacyExpiry) : null);
  const renews =
    trial?.kind !== "trial" && plan.id !== "free" && periodEnd
      ? dateFormat.format(periodEnd)
      : null;
  const limit = entitlements?.propertyLimit ?? null;
  const used = entitlements?.propertiesUsed ?? null;
  const pastDue = entitlements?.status === "past_due";
  // A Whop plan the buyer canceled: it runs to the period end and does not renew.
  const endsWithoutRenewal =
    mode === "manage" && billingRow?.status === "canceled";

  return (
    <PanelPage narrow title={t("Configuración")}>
      <div className="-mt-4 mb-8 flex items-center gap-4">
        <span className="bg-teal flex size-14 items-center justify-center rounded-2xl text-lg font-bold text-white">
          {initials(name)}
        </span>
        <div>
          <p className="font-semibold">{name}</p>
          {user.email ? (
            <p className="text-ink-soft text-sm">{user.email}</p>
          ) : null}
        </div>
      </div>

      <section id="cuenta" className="mb-10">
        <h2 className={SECTION_TITLE}>{t("CUENTA")}</h2>
        <div className={`${panelCardClass} divide-cream-dark divide-y`}>
          <div className="p-5">
            <ProfileForm fullName={user.fullName ?? ""} />
            <p className="text-ink-soft mt-3 text-xs">
              {t(
                "Tu correo ({email}) lo cambia el equipo de emblemático: escríbenos si lo necesitas.",
                { email: user.email ?? "" },
              )}
            </p>
          </div>
          <Link
            href="/panel/contrasena"
            className="hover:bg-cream/60 flex items-center justify-between gap-3 p-5 transition-colors"
          >
            <span>
              <span className="block font-semibold">{t("Contraseña")}</span>
              <span className="text-ink-soft text-sm">
                {t("Cambiar contraseña")}
              </span>
            </span>
            <span aria-hidden="true" className="text-ink-soft">
              ›
            </span>
          </Link>
        </div>
      </section>

      <section id="suscripcion" className="mb-10">
        <h2 className={SECTION_TITLE}>{t("SUSCRIPCIÓN")}</h2>
        {notice ? (
          <p
            role="status"
            className={`mb-4 rounded-xl p-4 text-sm ${notice === "ok" ? "bg-teal/15" : "bg-sand/30"}`}
          >
            {notice === "ok"
              ? mode === "manage"
                ? t(
                    "¡Gracias! Tu pago se recibió y tu plan {plan} está activo.",
                    {
                      plan: t(plan.name),
                    },
                  )
                : t(
                    "¡Gracias! Recibimos tu pago. Tu plan se activa en unos segundos: si aún no lo ves, recarga la página.",
                  )
              : notice === "error"
                ? t(
                    "No pudimos abrir el pago. Intenta de nuevo en un momento o escríbenos.",
                  )
                : t(
                    "No pudimos abrir la página de tu suscripción. Intenta de nuevo en un momento o escríbenos.",
                  )}
          </p>
        ) : null}
        <div className={`${panelCardClass} space-y-4 p-5`}>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold">{t(plan.name)}</p>
            <span className="bg-teal/15 text-teal-deep rounded-full px-3 py-1 text-xs font-bold">
              {t(trial?.kind === "trial" ? "Prueba gratis" : "Plan actual")}
            </span>
          </div>
          {trial?.kind === "trial" ? (
            <div className="bg-cream/70 space-y-3 rounded-xl p-4">
              <p className="flex flex-wrap justify-between gap-2">
                <span>{t("Tu prueba termina")}</span>
                <span className="text-ink-soft">
                  {dateFormat.format(trial.endsAt)}
                </span>
              </p>
              <p className="text-ink-soft text-sm">
                {t(
                  "Si no continúas, tu cuenta pasa a la versión básica: tu guía y tu código QR siguen funcionando, con 1 hospedaje y 5 servicios.",
                )}
              </p>
              {mode === "checkout" &&
              (plan.id === "essential" || plan.id === "plus") &&
              plan.price &&
              plan.monthlyPrice ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <form action={startCheckout}>
                      <input type="hidden" name="plan" value={plan.id} />
                      <input type="hidden" name="billing" value="annual" />
                      <button type="submit" className={panelPrimaryButtonClass}>
                        {t("Continuar con {plan}", { plan: t(plan.name) })}
                        {` · ${formatUsd(plan.price)} ${t("al año")}`}
                      </button>
                    </form>
                    <form action={startCheckout}>
                      <input type="hidden" name="plan" value={plan.id} />
                      <input type="hidden" name="billing" value="monthly" />
                      <button
                        type="submit"
                        className={panelSecondaryButtonClass}
                      >
                        {t("o {price} al mes", {
                          price: formatUsd(plan.monthlyPrice),
                        })}
                      </button>
                    </form>
                  </div>
                  <p className="text-ink-soft text-xs">
                    {t(
                      "Pagas con tarjeta en Whop, nuestro procesador de pagos, y puedes cancelar cuando quieras. ¿Prefieres SINPE Móvil?",
                    )}{" "}
                    <Link
                      href={`/contacto?plan=${plan.id}&periodo=anual`}
                      className="text-teal-deep font-semibold underline"
                    >
                      {t("Escríbenos")}
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <Link
                    href={`/contacto?plan=${plan.id}&periodo=anual`}
                    className={panelPrimaryButtonClass}
                  >
                    {t("Continuar con {plan}", { plan: t(plan.name) })}
                  </Link>
                  <p className="text-ink-soft text-xs">
                    {t(
                      "El pago en línea llega pronto. Por ahora te contactamos para el pago (tarjeta o SINPE Móvil).",
                    )}
                  </p>
                </>
              )}
            </div>
          ) : null}
          {trial?.kind === "lapsed" ? (
            <p className="bg-cream/70 rounded-xl p-4 text-sm">
              {t(
                "Tu cuenta está en la versión básica: tu guía y tu código QR siguen funcionando.",
              )}
            </p>
          ) : null}
          {pastDue && mode === "manage" ? (
            <p className="bg-sand/30 rounded-xl p-4 text-sm">
              {t(
                "No pudimos cobrar tu plan. Actualiza tu tarjeta en “Administrar suscripción” para mantenerlo activo.",
              )}
            </p>
          ) : pastDue ? (
            <p className="bg-sand/30 rounded-xl p-4 text-sm">
              {t(
                "Tenemos un pago pendiente de tu plan. Escríbenos para mantenerlo activo.",
              )}{" "}
              <Link
                href="/contacto"
                className="text-teal-deep font-semibold underline"
              >
                {t("Escribir")}
              </Link>
            </p>
          ) : null}
          {endsWithoutRenewal && renews ? (
            <p className="bg-cream/70 rounded-xl p-4 text-sm">
              {t(
                "Cancelaste tu plan: no se renovará y lo mantienes hasta el {date}. Si cambias de opinión, reactívalo antes de esa fecha.",
                { date: renews },
              )}
            </p>
          ) : null}
          {renews ? (
            <p className="flex flex-wrap justify-between gap-2">
              <span>
                {t(
                  mode !== "manage"
                    ? "Se renueva o vence"
                    : endsWithoutRenewal
                      ? "Termina el"
                      : "Se renueva el",
                )}
              </span>
              <span className="text-ink-soft">{renews}</span>
            </p>
          ) : null}
          {limit !== null && used !== null ? (
            <p className="flex flex-wrap justify-between gap-2">
              <span>{t("Hospedajes")}</span>
              <span className="text-ink-soft">
                {limit >= UNLIMITED_PROPERTIES
                  ? t("{used} (sin límite)", { used })
                  : t("{used} de {limit}", { used, limit })}
              </span>
            </p>
          ) : null}
          {mode === "manage" ? (
            <form action={manageSubscription} className="space-y-2">
              <button type="submit" className={panelSecondaryButtonClass}>
                {t("Administrar suscripción")}
              </button>
              <p className="text-ink-soft text-xs">
                {t(
                  "Cambia tu tarjeta, cancela o reactiva tu plan en Whop, nuestro procesador de pagos.",
                )}
              </p>
            </form>
          ) : null}
          <div>
            <p className={SECTION_TITLE}>{t("LO QUE TIENES")}</p>
            <ul className="space-y-2">
              {plan.includes.map((feature) => (
                <PlanFeatureItem
                  key={featureLabel(feature)}
                  feature={feature}
                  translate={t}
                  className="text-sm"
                  checkClassName="text-teal"
                />
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="planes">
        <h2 className={SECTION_TITLE}>{t("CAMBIAR DE PLAN")}</h2>
        <PlanChangeList
          currentPlanId={plan.id}
          trialing={trial?.kind === "trial"}
          checkout={mode === "checkout"}
        />
        <p className="text-ink-soft mt-3 text-xs">
          {mode === "checkout"
            ? t(
                "Pagas con tarjeta en Whop, nuestro procesador de pagos. ¿Prefieres SINPE Móvil? Escríbenos desde la página de contacto. Cambiar a un plan menor conserva todo lo que escribiste.",
              )
            : t(
                "Por ahora los cambios de plan se confirman con nuestro equipo: elige uno y te contactamos para el pago (tarjeta o SINPE Móvil). Cambiar a un plan menor conserva todo lo que escribiste.",
              )}
        </p>
      </section>
    </PanelPage>
  );
}

export default function SettingsPage({
  searchParams,
}: PageProps<"/panel/configuracion">) {
  return (
    <Suspense fallback={<PanelLoading variant="settings" />}>
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}
