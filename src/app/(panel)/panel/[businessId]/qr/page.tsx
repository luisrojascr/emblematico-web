import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelLoading } from "@/components/panel/PanelLanguageProvider";
import { CopyUrl } from "@/components/admin/CopyUrl";
import { panelSecondaryButtonClass as secondaryButtonClass } from "@/components/panel/ui";
import { PanelHeading } from "@/components/panel/PanelHeading";
import { loadPanelPage } from "@/lib/panel/load";
import { businessPublicUrl } from "@/lib/qr/render";

async function Qr({ id }: { id: string }) {
  const { t } = await getPanelI18n();
  const page = await loadPanelPage(id);
  if (!page) notFound();
  const url = businessPublicUrl(page.slug);

  return (
    <PanelHeading page={page}>
      <div className="space-y-4">
        <p className="text-ink-soft text-sm">
          {t(
            "El código abre la página publicada. Un borrador sin publicar no se ve al escanearlo.",
          )}
        </p>
        {page.pageStatus !== "published" ? (
          <p className="text-sm text-red-700">
            {t("Esta página todavía no está publicada.")}
          </p>
        ) : null}
        <CopyUrl url={url} copyLabel={t("Copiar")} copiedLabel={t("Copiado")} />
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/qr/${page.id}?format=svg`}
            className={secondaryButtonClass}
          >
            {t("Descargar SVG")}
          </a>
          <a
            href={`/api/qr/${page.id}?format=png`}
            className={secondaryButtonClass}
          >
            {t("Descargar PNG")}
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
    <Suspense fallback={<PanelLoading />}>
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
