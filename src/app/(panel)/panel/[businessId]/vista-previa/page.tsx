import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { panelSecondaryButtonClass as secondaryButtonClass } from "@/components/panel/ui";
import { PanelHeading } from "@/components/panel/PanelHeading";
import { loadPanelPage } from "@/lib/panel/load";
import { parsePageContent, TemplateView } from "@/lib/templates/registry";

async function Preview({ id }: { id: string }) {
  const page = await loadPanelPage(id);
  if (!page) notFound();
  const content = parsePageContent(page.templateKey, page.draft);

  return (
    <PanelHeading page={page}>
      <p className="text-ink-soft mb-6 text-sm">
        Vista previa del borrador guardado. La página pública no cambia hasta
        que publiques.
      </p>
      {content ? (
        <div className="bg-ink mx-auto w-full max-w-[390px] rounded-[2.75rem] p-3 shadow-xl shadow-ink/20">
          <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
            <div aria-hidden="true" className="flex h-9 items-center justify-center bg-white">
              <span className="bg-ink h-6 w-24 rounded-full" />
            </div>
            <div className="h-[720px] max-h-[75dvh] overflow-y-auto [&_.min-h-dvh]:min-h-full">
              <TemplateView name={page.name} page={content} />
            </div>
          </div>
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
      <p className="mt-6 text-center">
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
