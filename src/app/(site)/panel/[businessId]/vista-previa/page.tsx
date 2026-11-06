import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { secondaryButtonClass } from "@/components/admin/ui";
import { PanelHeading } from "@/components/panel/PanelHeading";
import { loadPanelPage } from "@/lib/panel/load";
import { parsePageContent, TemplateView } from "@/lib/templates/registry";

async function Preview({ id }: { id: string }) {
  const page = await loadPanelPage(id);
  if (!page) notFound();
  const content = parsePageContent(page.templateKey, page.draft);

  return (
    <PanelHeading id={page.id} name={page.name} slug={page.slug}>
      <p className="text-ink-soft mb-6 text-sm">
        Vista previa del borrador guardado. La página pública no cambia hasta
        que publiques.
      </p>
      {content ? (
        <div className="border-cream-dark overflow-hidden rounded-xl border">
          <TemplateView name={page.name} page={content} />
        </div>
      ) : (
        <p className="text-sm text-red-700">
          El borrador no se puede mostrar.{" "}
          <Link href={`/panel/${page.id}`} className="underline">
            Vuelve al editor
          </Link>{" "}
          y guárdalo de nuevo.
        </p>
      )}
      <p className="mt-6">
        <Link href={`/panel/${page.id}`} className={secondaryButtonClass}>
          Volver al editor
        </Link>
      </p>
    </PanelHeading>
  );
}

export default function PreviewPage({
  params,
}: PageProps<"/panel/[businessId]/vista-previa">) {
  return (
    <Suspense fallback={<p className="text-ink-soft p-8">Cargando...</p>}>
      <PreviewLoader params={params} />
    </Suspense>
  );
}

async function PreviewLoader({
  params,
}: {
  params: PageProps<"/panel/[businessId]/vista-previa">["params"];
}) {
  const { businessId } = await params;
  return <Preview id={businessId} />;
}
