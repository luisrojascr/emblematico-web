import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CopyUrl } from "@/components/admin/CopyUrl";
import { secondaryButtonClass } from "@/components/admin/ui";
import { PanelHeading } from "@/components/panel/PanelHeading";
import { loadPanelPage } from "@/lib/panel/load";
import { businessPublicUrl } from "@/lib/qr/render";

async function Qr({ id }: { id: string }) {
  const page = await loadPanelPage(id);
  if (!page) notFound();
  const url = businessPublicUrl(page.slug);

  return (
    <PanelHeading id={page.id} name={page.name} slug={page.slug}>
      <div className="space-y-4">
        <p className="text-ink-soft text-sm">
          El código abre la página publicada. Un borrador sin publicar no se ve
          al escanearlo.
        </p>
        {page.pageStatus !== "published" ? (
          <p className="text-sm text-red-700">
            Esta página todavía no está publicada.
          </p>
        ) : null}
        <CopyUrl url={url} />
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/qr/${page.id}?format=svg`}
            className={secondaryButtonClass}
          >
            Descargar SVG
          </a>
          <a
            href={`/api/qr/${page.id}?format=png`}
            className={secondaryButtonClass}
          >
            Descargar PNG
          </a>
        </div>
      </div>
    </PanelHeading>
  );
}

export default function QrPage({
  params,
}: PageProps<"/panel/[businessId]/qr">) {
  return (
    <Suspense fallback={<p className="text-ink-soft p-8">Cargando...</p>}>
      <QrLoader params={params} />
    </Suspense>
  );
}

async function QrLoader({
  params,
}: {
  params: PageProps<"/panel/[businessId]/qr">["params"];
}) {
  const { businessId } = await params;
  return <Qr id={businessId} />;
}
