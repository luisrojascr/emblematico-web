"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";

import {
  panelPrimaryButtonClass as primaryButtonClass,
  panelSecondaryButtonClass as secondaryButtonClass,
} from "./ui";
import {
  publishDraft,
  saveDraft,
} from "@/app/(panel)/panel/[businessId]/actions";
import { usePanelI18n } from "@/components/panel/PanelLanguageProvider";
import { businessStatusLabel } from "@/lib/admin/labels";
import type { PanelPage } from "@/lib/panel/load";
import type { GeneralContent } from "@/lib/templates/general/schema";
import { generalContentSchema } from "@/lib/templates/general/schema";
import type { HospitalityContent } from "@/lib/templates/hospitality/schema";
import { hospitalityContentSchema } from "@/lib/templates/hospitality/schema";
import { TEMPLATE_LABELS, type PageContent } from "@/lib/templates/registry";

import { GeneralFields } from "./GeneralFields";
import { HospitalityFields } from "./HospitalityFields";
import { PhonePreview } from "./PhonePreview";
import { TranslationsSection } from "./TranslationsSection";
import { ImageField, useImageSlot } from "./fields";

const NOTICES: Record<string, string> = {
  guardado: "Borrador guardado.",
  publicada: "La página pública ya muestra este borrador.",
  creado:
    "Tu hospedaje está creado como borrador. Revisa los datos y publícalo cuando quieras.",
};

export function PageEditor({
  page,
  content,
  invalidDraft,
  notice,
  canTranslate = false,
}: {
  page: PanelPage;
  content: PageContent;
  invalidDraft: boolean;
  notice?: string;
  /** The owner's plan includes translations (any paid plan). */
  canTranslate?: boolean;
}) {
  switch (content.templateKey) {
    case "hospitality":
      return (
        <HospitalityEditor
          page={page}
          content={content.content}
          invalidDraft={invalidDraft}
          notice={notice}
          canTranslate={canTranslate}
        />
      );
    case "general":
      return (
        <GeneralEditor
          page={page}
          content={content.content}
          invalidDraft={invalidDraft}
          notice={notice}
        />
      );
    default: {
      const unreachable: never = content;
      return unreachable;
    }
  }
}

function usePanelSubmit(businessId: string) {
  const { t } = usePanelI18n();
  const logo = useImageSlot();
  const cover = useImageSlot();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(values: unknown) {
    if (logo.error || cover.error) {
      setMessage(logo.error ?? cover.error);
      return;
    }
    const data = new FormData();
    data.set("content", JSON.stringify(values));
    if (logo.file) data.set("logo", logo.file);
    if (cover.file) data.set("cover", cover.file);
    if (logo.remove) data.set("remove_logo", "1");
    if (cover.remove) data.set("remove_cover", "1");
    startTransition(async () => {
      const result = await saveDraft(businessId, data);
      if (result) setMessage(result.message);
    });
  }

  function publish() {
    if (
      !window.confirm(
        t("La página pública pasará a mostrar el borrador guardado."),
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await publishDraft(businessId);
      if (result) setMessage(result.message);
    });
  }

  return { logo, cover, message, pending, submit, publish };
}

function HospitalityEditor({
  page,
  content,
  invalidDraft,
  notice,
  canTranslate,
}: {
  page: PanelPage;
  content: HospitalityContent;
  invalidDraft: boolean;
  notice?: string;
  canTranslate: boolean;
}) {
  const form = useForm<HospitalityContent>({
    resolver: zodResolver(
      hospitalityContentSchema,
    ) as Resolver<HospitalityContent>,
    defaultValues: content,
  });
  const panel = usePanelSubmit(page.id);
  return (
    <EditorChrome
      page={page}
      invalidDraft={invalidDraft}
      notice={notice}
      panel={panel}
      formDirty={form.formState.isDirty}
      onSubmit={form.handleSubmit(panel.submit)}
      logoPath={content.theme.logo_path}
      coverPath={content.theme.cover_path}
      preview={
        <PhonePreview
          name={page.name}
          control={form.control}
          fallback={content}
          branding={page.branding}
        />
      }
    >
      <HospitalityFields form={form} fullServices={canTranslate} />
      <TranslationsSection
        form={form}
        businessId={page.id}
        enabled={canTranslate}
      />
    </EditorChrome>
  );
}

function GeneralEditor({
  page,
  content,
  invalidDraft,
  notice,
}: {
  page: PanelPage;
  content: GeneralContent;
  invalidDraft: boolean;
  notice?: string;
}) {
  const form = useForm<GeneralContent>({
    resolver: zodResolver(generalContentSchema) as Resolver<GeneralContent>,
    defaultValues: content,
  });
  const panel = usePanelSubmit(page.id);
  return (
    <EditorChrome
      page={page}
      invalidDraft={invalidDraft}
      notice={notice}
      panel={panel}
      formDirty={form.formState.isDirty}
      onSubmit={form.handleSubmit(panel.submit)}
      logoPath={content.theme.logo_path}
      coverPath={content.theme.cover_path}
    >
      <GeneralFields form={form} />
    </EditorChrome>
  );
}

function EditorChrome({
  page,
  invalidDraft,
  notice,
  panel,
  formDirty,
  onSubmit,
  logoPath,
  coverPath,
  preview,
  children,
}: {
  preview?: ReactNode;
  page: PanelPage;
  invalidDraft: boolean;
  notice?: string;
  panel: ReturnType<typeof usePanelSubmit>;
  formDirty: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  logoPath?: string | null;
  coverPath?: string | null;
  children: ReactNode;
}) {
  const { t } = usePanelI18n();
  const canEdit = page.status === "active" && !page.pausedByPlan;
  const dirty = formDirty || panel.logo.dirty || panel.cover.dirty;
  const savedNotice = notice ? NOTICES[notice] : undefined;
  const [previewOpen, setPreviewOpen] = useState(false);

  const editor = (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      <header className="space-y-1">
        <p className="text-ink-soft text-sm">
          {t(TEMPLATE_LABELS[page.templateKey])}
          {page.status === "active"
            ? null
            : ` · ${t(businessStatusLabel(page.status))}`}
        </p>
        {savedNotice ? (
          <p role="status" className="text-ink-soft text-sm">
            {t(savedNotice)}
          </p>
        ) : null}
        {invalidDraft ? (
          <p role="alert" className="text-sm text-red-700">
            {t(
              "El borrador guardado no se pudo leer. Corrige los campos y vuelve a guardarlo antes de publicar.",
            )}
          </p>
        ) : null}
        {!canEdit ? (
          <p role="status" className="text-sm text-red-700">
            {t(
              page.pausedByPlan
                ? "Esta guía está en pausa por tu plan. Puedes ver el contenido, no editarlo. Actualiza tu plan para reactivarla."
                : "Este negocio está suspendido o archivado. Puedes ver el contenido, no editarlo.",
            )}
          </p>
        ) : null}
        {panel.message ? (
          <p role="alert" className="text-sm text-red-700">
            {t(panel.message)}
          </p>
        ) : null}
      </header>

      <fieldset disabled={!canEdit || panel.pending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField
            id="logo"
            label={"Logo"}
            currentPath={logoPath}
            slot={panel.logo}
          />
          <ImageField
            id="cover"
            label={t("Foto de portada")}
            currentPath={coverPath}
            slot={panel.cover}
          />
        </div>
        {children}
      </fieldset>

      <div className="border-cream-dark bg-cream/95 sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-wrap items-center gap-3 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border lg:bottom-0">
        {preview ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            aria-label={t("Vista previa")}
            className={`${secondaryButtonClass} size-11 !p-0 xl:hidden`}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!canEdit || panel.pending}
          className={primaryButtonClass}
        >
          {panel.pending ? t("Procesando...") : t("Guardar borrador")}
        </button>
        <button
          type="button"
          disabled={!canEdit || panel.pending || dirty || invalidDraft}
          className={secondaryButtonClass}
          onClick={panel.publish}
        >
          {t("Publicar")}
        </button>
      </div>
      {canEdit && (dirty || invalidDraft) ? (
        <p className="text-ink-soft text-sm">
          {t("Publicar usa el último borrador guardado.")}
        </p>
      ) : null}
    </form>
  );
  if (!preview) return editor;
  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">{editor}</div>
      <aside className="hidden xl:block">
        <div className="sticky top-8">{preview}</div>
      </aside>
      {previewOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("Vista previa")}
          className="bg-cream fixed inset-0 z-50 flex flex-col overflow-y-auto xl:hidden"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="font-semibold">{t("Vista previa")}</p>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className={secondaryButtonClass}
            >
              {t("Cerrar")}
            </button>
          </div>
          <div className="px-4 pb-8">{preview}</div>
        </div>
      ) : null}
    </div>
  );
}
