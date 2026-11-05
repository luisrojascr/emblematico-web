import type { Metadata } from "next";
import { Suspense } from "react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false },
};

async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <>
      <div className="border-cream-dark bg-ink text-cream border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm sm:px-6">
          <span>Administración · {user.email}</span>
          <SignOutButton />
        </div>
      </div>
      {children}
    </>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-ink-soft p-8">Cargando...</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
