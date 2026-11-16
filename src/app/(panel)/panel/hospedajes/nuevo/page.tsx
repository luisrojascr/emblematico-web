import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PropertyWizard } from "@/components/panel/PropertyWizard";
import { requireUser } from "@/lib/auth/session";
import { loadOverview } from "@/lib/panel/overview";

async function Gate() {
  const user = await requireUser();
  const { canCreate } = await loadOverview(user.id, user.role === "admin");
  if (!canCreate) {
    redirect("/panel/hospedajes?aviso=limite");
  }
  return <PropertyWizard closeHref="/panel/hospedajes" />;
}

export default function NewPropertyPage() {
  return (
    <div className="px-4 py-8 sm:px-8 lg:py-12">
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Gate />
      </Suspense>
    </div>
  );
}
