import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelLoading } from "@/components/panel/PanelLanguageProvider";
import { CopyUrl } from "@/components/admin/CopyUrl";
import {
  panelCardClass,
  panelSecondaryButtonClass as secondaryButtonClass,
} from "@/components/panel/ui";
import { PanelHeading } from "@/components/panel/PanelHeading";
import { loadPanelPage } from "@/lib/panel/load";
import { PIECE_TIERS, formatUsd } from "@/lib/plans";
import { businessPublicUrl } from "@/lib/qr/render";

/** Lowest price per piece (the largest tier), for "from $X each". */
const PIECE_FROM = formatUsd(PIECE_TIERS[PIECE_TIERS.length - 1].unit);

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
        {/* The moment the welcome piece makes sense: the guide is live and has a QR. */}
        {page.pageStatus === "published" ? (
          <div
            className={`${panelCardClass} mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center`}
          >
            <Image
              src="/images/welcome-piece.webp"
              alt={t("Pieza de bienvenida 3D con el código QR de la guía")}
              width={112}
              height={112}
              className="border-cream-dark h-28 w-28 shrink-0 rounded-xl border object-cover"
            />
            <div className="min-w-0 space-y-2">
              <p className="font-semibold">
                {t("Lleva tu QR a la mesa de bienvenida")}
              </p>
              <p className="text-ink-soft text-sm">
                {t(
                  "Una pieza personalizada impresa en 3D con el código QR de tu guía, para la recepción o la habitación. Pago único, desde {price} c/u.",
                  { price: PIECE_FROM },
                )}
              </p>
              <Link href="/contacto?piezas=1" className={secondaryButtonClass}>
                {t("Pedir pieza de bienvenida")}
              </Link>
            </div>
          </div>
        ) : null}
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
