"use client";

import { useWatch, type Control } from "react-hook-form";

import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { HospitalityTemplate } from "@/lib/templates/hospitality/Template";
import {
  hospitalityContentSchema,
  type HospitalityContent,
} from "@/lib/templates/hospitality/schema";

/**
 * Teléfono con la guía tal como la verían los huéspedes, al vivo mientras se
 * edita. Muestra el borrador en pantalla (sin guardar). Las fotos nuevas
 * aparecen después de guardar.
 */
export function PhonePreview({
  name,
  control,
  fallback,
  branding = true,
}: {
  name: string;
  branding?: boolean;
  control: Control<HospitalityContent>;
  fallback: HospitalityContent;
}) {
  const { t } = usePanelI18n();
  const live = useWatch({ control });
  // Mientras se escribe un valor puede quedar inválido (un color a medias):
  // se muestra la última versión válida en vez de romper la vista.
  const parsed = hospitalityContentSchema.safeParse(live);
  const content = parsed.success ? parsed.data : fallback;

  return (
    <div className="space-y-3">
      <p className="text-ink-soft text-xs font-bold tracking-wider">
        {t("VISTA PREVIA PARA HUÉSPEDES")}
      </p>
      <div className="bg-ink shadow-ink/20 mx-auto w-full max-w-[340px] rounded-[2.75rem] p-3 shadow-xl">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
          {/* Barra de estado: el contenido empieza debajo de la "isla" del teléfono. */}
          <div
            aria-hidden="true"
            className="flex h-9 items-center justify-center bg-white"
          >
            <span className="bg-ink h-6 w-24 rounded-full" />
          </div>
          <div className="h-[min(600px,calc(100dvh-14rem))] overflow-y-auto [&_.min-h-dvh]:min-h-full">
            <HospitalityTemplate
              name={name}
              content={content}
              branding={branding}
            />
          </div>
        </div>
      </div>
      <p className="text-ink-soft text-center text-xs">
        {t(
          "Muestra lo que estás editando. Las fotos nuevas aparecen al guardar.",
        )}
      </p>
    </div>
  );
}
