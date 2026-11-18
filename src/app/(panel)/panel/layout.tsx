import type { Metadata } from "next";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelSidebar } from "@/components/panel/PanelSidebar";
import { PanelLanguageProvider } from "@/components/panel/PanelLanguageProvider";
import { TrialBanner } from "@/components/panel/TrialBanner";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false },
};

async function PanelGate({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { language, t } = await getPanelI18n();
  const name =
    user.fullName?.trim() || user.email?.split("@")[0] || t("Mi cuenta");
  return (
    <PanelLanguageProvider initial={language}>
      <div className="marketing-fonts flex min-h-dvh flex-1 flex-col lg:flex-row">
        <PanelSidebar
          name={name}
          email={user.email}
          isAdmin={user.role === "admin"}
        />
        <main id="contenido" className="min-w-0 flex-1">
          {user.role === "admin" ? null : <TrialBanner />}
          {children}
        </main>
      </div>
    </PanelLanguageProvider>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <Suspense
      fallback={
        <p className="marketing-fonts text-ink-soft p-8">Cargando...</p>
      }
    >
      <PanelGate>{children}</PanelGate>
    </Suspense>
  );
}
