import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelLoading } from "@/components/panel/PanelLanguageProvider";
import { panelSecondaryButtonClass as secondaryButtonClass } from "@/components/panel/ui";
import { PanelHeading } from "@/components/panel/PanelHeading";
import { loadPanelPage } from "@/lib/panel/load";
import { parsePageContent, TemplateView } from "@/lib/templates/registry";

async function Preview({ id }: { id: string }) {
  const { t } = await getPanelI18n();
  const page = await loadPanelPage(id);
  if (!page) notFound();
  const content = parsePageContent(page.templateKey, page.draft);

  return (
    <PanelHeading page={page}>
      <p className="text-ink-soft mb-6 text-sm">
        {t(
          "Vista previa del borrador guardado. La página pública no cambia hasta que publiques.",
        )}
      </p>
      {content ? (
        <div className="bg-ink shadow-ink/20 mx-auto w-full max-w-[390px] rounded-[2.75rem] p-3 shadow-xl">
          <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
            <div
              aria-hidden="true"
              className="flex h-9 items-center justify-center bg-white"
            >
              <span className="bg-ink h-6 w-24 rounded-full" />
            </div>
            <div className="h-[720px] max-h-[75dvh] overflow-y-auto [&_.min-h-dvh]:min-h-full">
              <TemplateView
                name={page.name}
                page={content}
                branding={page.branding}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-700">
          {t("El borrador no se puede mostrar.")}{" "}
          <Link href={`/panel/${page.id}`} className="underline">
            {t("Vuelve al editor")}
          </Link>{" "}
          {t("y guárdalo de nuevo.")}
        </p>
      )}
      <p className="mt-6 text-center">
        <Link href={`/panel/${page.id}`} className={secondaryButtonClass}>
          {t("Volver al editor")}
        </Link>
      </p>
    </PanelHeading>
  );
}

export default function PreviewPage({
  params,
}: PageProps<"/panel/[businessId]/vista-previa">) {
  return (
    <Suspense fallback={<PanelLoading />}>
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
