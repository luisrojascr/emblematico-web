import Link from "next/link";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { loadEntitlements } from "@/lib/panel/entitlements";
import { TRIAL_URGENT_DAYS, trialState } from "@/lib/panel/entitlements-shared";
import { getPlan } from "@/lib/plans";

const LINK = "text-teal-deep font-semibold whitespace-nowrap underline";

/**
 * Strip at the top of every panel page while the trial runs (and once after it
 * lapses), so the user always knows how many days are left and what happens next.
 */
export async function TrialBanner() {
  const [{ t, locale }, entitlements] = await Promise.all([
    getPanelI18n(),
    loadEntitlements(),
  ]);
  const state = trialState(entitlements);
  if (!state) return null;

  if (state.kind === "lapsed") {
    return (
      <div role="status" className="bg-cream-dark/70 px-4 py-3 text-sm sm:px-8">
        {t(
          "Tu cuenta está en la versión básica: tu guía y tu código QR siguen funcionando.",
        )}{" "}
        <Link href="/panel/configuracion#planes" className={LINK}>
          {t("Ver planes")}
        </Link>
      </div>
    );
  }

  const urgent = state.daysLeft <= TRIAL_URGENT_DAYS;
  const planName = t(getPlan(state.plan)?.name ?? "");
  const endsOn = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    state.endsAt,
  );
  return (
    <div
      role="status"
      className={`px-4 py-3 text-sm sm:px-8 ${urgent ? "bg-sand/40" : "bg-teal/10"}`}
    >
      <span className="font-semibold">
        {t(
          state.daysLeft === 1
            ? "Te queda 1 día de prueba de {plan}."
            : "Te quedan {days} días de prueba de {plan}.",
          { days: state.daysLeft, plan: planName },
        )}
      </span>{" "}
      {urgent
        ? t(
            "El {date} tu cuenta pasa a la versión básica; tu guía y tu código QR siguen funcionando.",
            { date: endsOn },
          )
        : null}{" "}
      <Link href="/panel/configuracion#suscripcion" className={LINK}>
        {t(urgent ? "Continuar con {plan}" : "Ver mi plan", { plan: planName })}
      </Link>
    </div>
  );
}
