import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
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
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span>Administración · {user.email}</span>
            <SignOutButton className="text-cream/80 hover:text-cream" />
          </div>
          <AdminNav />
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
