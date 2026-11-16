import type { Metadata } from "next";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelPage } from "@/components/panel/PanelPage";
import { PasswordForm } from "@/components/panel/PasswordForm";
import { panelCardClass } from "@/components/panel/ui";

export const metadata: Metadata = { title: "Contraseña" };

async function Intro({
  searchParams,
}: {
  searchParams: PageProps<"/panel/contrasena">["searchParams"];
}) {
  const { t } = await getPanelI18n();
  const query = await searchParams;
  return (
    <p className="text-ink-soft mb-6">
      {query.primera
        ? t(
            "Bienvenido. Crea una contraseña para entrar la próxima vez con tu correo.",
          )
        : t("Elige una contraseña nueva para entrar con tu correo.")}
    </p>
  );
}

export default async function PasswordPage({
  searchParams,
}: PageProps<"/panel/contrasena">) {
  const { t } = await getPanelI18n();
  return (
    <PanelPage narrow title={t("Tu contraseña")}>
      <Suspense fallback={null}>
        <Intro searchParams={searchParams} />
      </Suspense>
      <div className={`${panelCardClass} max-w-md p-6`}>
        <PasswordForm />
      </div>
    </PanelPage>
  );
}
