import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelLoading } from "@/components/panel/PanelLanguageProvider";
import { PanelPage } from "@/components/panel/PanelPage";
import { PlanFeatureItem } from "@/components/marketing/PlanFeatureItem";
import { PLANS, featureLabel, getPlan } from "@/lib/plans";
import { PlanChangeList } from "@/components/panel/PlanChangeList";
import { ProfileForm } from "@/components/panel/ProfileForm";
import { panelCardClass, panelPrimaryButtonClass } from "@/components/panel/ui";
import { requireUser } from "@/lib/auth/session";
import { loadEntitlements } from "@/lib/panel/entitlements";
import {
  UNLIMITED_PROPERTIES,
  trialState,
} from "@/lib/panel/entitlements-shared";

import { createClient } from "@/lib/supabase/server";

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

async function Settings() {
  const { t, locale } = await getPanelI18n();
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: businesses }, entitlements] = await Promise.all([
    supabase.from("businesses").select("service_expires_at"),
    loadEntitlements(),
  ]);
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
            </div>
          ) : null}
          {trial?.kind === "lapsed" ? (
            <p className="bg-cream/70 rounded-xl p-4 text-sm">
              {t(
                "Tu cuenta está en la versión básica: tu guía y tu código QR siguen funcionando.",
              )}
            </p>
          ) : null}
          {pastDue ? (
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
          {renews ? (
            <p className="flex flex-wrap justify-between gap-2">
              <span>{t("Se renueva o vence")}</span>
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
        />
        <p className="text-ink-soft mt-3 text-xs">
          {t(
            "Por ahora los cambios de plan se confirman con nuestro equipo: elige uno y te contactamos para el pago (tarjeta o SINPE Móvil). Cambiar a un plan menor conserva todo lo que escribiste.",
          )}
        </p>
      </section>
    </PanelPage>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PanelLoading />}>
      <Settings />
    </Suspense>
  );
}
