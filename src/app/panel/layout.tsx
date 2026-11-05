import type { Metadata } from "next";
import { Suspense } from "react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false },
};

async function PanelGate({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <div className="border-cream-dark border-b bg-white/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm sm:px-6">
          <span className="text-ink-soft">{user.email}</span>
          <SignOutButton />
        </div>
      </div>
      {children}
    </>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <Suspense fallback={<p className="text-ink-soft p-8">Cargando...</p>}>
      <PanelGate>{children}</PanelGate>
    </Suspense>
  );
}
