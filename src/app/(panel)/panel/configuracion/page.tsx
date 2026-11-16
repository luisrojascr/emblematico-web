import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PanelPage } from "@/components/panel/PanelPage";
import { ProfileForm } from "@/components/panel/ProfileForm";
import { panelCardClass } from "@/components/panel/ui";
import { requireUser } from "@/lib/auth/session";
import { detectPlan } from "@/lib/panel/subscription";
import { PLANS, formatUsd } from "@/lib/plans";
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
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: businesses }, profileResult] = await Promise.all([
    supabase.from("businesses").select("service_plan, service_expires_at"),
    supabase.from("profiles").select("max_properties").eq("id", user.id).maybeSingle(),
  ]);
  const name = user.fullName?.trim() || user.email?.split("@")[0] || "";
  const maxProperties = profileResult.error ? null : (profileResult.data?.max_properties ?? null);
  const plan = detectPlan((businesses ?? []).map((b) => b.service_plan), maxProperties);
  const expiries = (businesses ?? [])
    .map((b) => b.service_expires_at)
    .filter((d): d is string => Boolean(d))
    .sort();
  const renews = expiries[0]
    ? new Intl.DateTimeFormat("es-CR", { dateStyle: "long" }).format(new Date(expiries[0]))
    : null;

  return (
    <PanelPage narrow title="Configuración">
      <div className="-mt-4 mb-8 flex items-center gap-4">
        <span className="bg-teal flex size-14 items-center justify-center rounded-2xl text-lg font-bold text-white">
          {initials(name)}
        </span>
        <div>
          <p className="font-semibold">{name}</p>
          {user.email ? <p className="text-ink-soft text-sm">{user.email}</p> : null}
        </div>
      </div>

      <section id="cuenta" className="mb-10">
        <h2 className={SECTION_TITLE}>CUENTA</h2>
        <div className={`${panelCardClass} divide-cream-dark divide-y`}>
          <div className="p-5">
            <ProfileForm fullName={user.fullName ?? ""} />
            <p className="text-ink-soft mt-3 text-xs">
              Tu correo ({user.email}) lo cambia el equipo de emblemático: escríbenos si
              lo necesitas.
            </p>
          </div>
          <Link
            href="/panel/contrasena"
            className="hover:bg-cream/60 flex items-center justify-between gap-3 p-5 transition-colors"
          >
            <span>
              <span className="block font-semibold">Contraseña</span>
              <span className="text-ink-soft text-sm">Cambiar contraseña</span>
            </span>
            <span aria-hidden="true" className="text-ink-soft">›</span>
          </Link>
        </div>
      </section>

      <section id="suscripcion" className="mb-10">
        <h2 className={SECTION_TITLE}>SUSCRIPCIÓN</h2>
        <div className={`${panelCardClass} space-y-4 p-5`}>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold">{plan.name}</p>
            <span className="bg-teal/15 text-teal-deep rounded-full px-3 py-1 text-xs font-bold">
              Plan actual
            </span>
          </div>
          {renews ? (
            <p className="flex flex-wrap justify-between gap-2">
              <span>Se renueva o vence</span>
              <span className="text-ink-soft">{renews}</span>
            </p>
          ) : null}
          <div>
            <p className={SECTION_TITLE}>LO QUE TIENES</p>
            <ul className="space-y-2">
              {plan.includes.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <span aria-hidden="true" className="text-teal">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="planes">
        <h2 className={SECTION_TITLE}>CAMBIAR DE PLAN</h2>
        <ul className={`${panelCardClass} divide-cream-dark divide-y`}>
          {PLANS.map((option) => {
            const current = option.id === plan.id;
            return (
              <li key={option.id}>
                <Link
                  href={current ? "#suscripcion" : `/contacto?plan=${option.id}`}
                  aria-current={current ? "true" : undefined}
                  className="hover:bg-cream/60 flex items-center gap-4 p-5 transition-colors"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      {option.name}
                      {current ? (
                        <span className="text-teal-deep text-xs font-bold">Tu plan</span>
                      ) : null}
                    </span>
                    <span className="text-ink-soft block text-sm">{option.summary}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-bold">
                      {option.price === null ? "Cotiza" : formatUsd(option.price)}
                    </span>
                    {option.price ? (
                      <span className="text-ink-soft text-xs">al año</span>
                    ) : null}
                  </span>
                  <span aria-hidden="true" className="text-ink-soft">›</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="text-ink-soft mt-3 text-xs">
          Por ahora los cambios de plan se confirman con nuestro equipo: elige uno y te
          contactamos para el pago (tarjeta o SINPE Móvil). Cambiar a un plan menor
          conserva todo lo que escribiste.
        </p>
      </section>
    </PanelPage>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft p-8">Cargando...</p>}>
      <Settings />
    </Suspense>
  );
}
