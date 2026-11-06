"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";

import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/ui";
import {
  publishDraft,
  saveDraft,
} from "@/app/(site)/panel/[businessId]/actions";
import { businessStatusLabel, pageStatusLabel } from "@/lib/admin/labels";
import type { PanelPage } from "@/lib/panel/load";
import type { GeneralContent } from "@/lib/templates/general/schema";
import { generalContentSchema } from "@/lib/templates/general/schema";
import type { HospitalityContent } from "@/lib/templates/hospitality/schema";
import { hospitalityContentSchema } from "@/lib/templates/hospitality/schema";
import { TEMPLATE_LABELS, type PageContent } from "@/lib/templates/registry";

import { GeneralFields } from "./GeneralFields";
import { HospitalityFields } from "./HospitalityFields";
import { ImageField, useImageSlot } from "./fields";

const NOTICES: Record<string, string> = {
  guardado: "Borrador guardado.",
  publicada: "La página pública ya muestra este borrador.",
};

export function PageEditor({
  page,
  content,
  invalidDraft,
  notice,
}: {
  page: PanelPage;
  content: PageContent;
  invalidDraft: boolean;
  notice?: string;
}) {
  switch (content.templateKey) {
    case "hospitality":
      return (
        <HospitalityEditor
          page={page}
          content={content.content}
          invalidDraft={invalidDraft}
          notice={notice}
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
        "La página pública pasará a mostrar el borrador guardado.",
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
}: {
  page: PanelPage;
  content: HospitalityContent;
  invalidDraft: boolean;
  notice?: string;
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
    >
      <HospitalityFields form={form} />
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
  children,
}: {
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
  const canEdit = page.status === "active";
  const dirty = formDirty || panel.logo.dirty || panel.cover.dirty;
  const savedNotice = notice ? NOTICES[notice] : undefined;

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate>
      <header className="space-y-1">
        <p className="text-ink-soft text-sm">
          {TEMPLATE_LABELS[page.templateKey]} ·{" "}
          {pageStatusLabel(page.pageStatus)} ·{" "}
          {businessStatusLabel(page.status)}
        </p>
        {savedNotice ? (
          <p role="status" className="text-ink-soft text-sm">
            {savedNotice}
          </p>
        ) : null}
        {invalidDraft ? (
          <p role="alert" className="text-sm text-red-700">
            El borrador guardado no se pudo leer. Corrige los campos y vuelve a
            guardarlo antes de publicar.
          </p>
        ) : null}
        {!canEdit ? (
          <p role="status" className="text-sm text-red-700">
            Este negocio está suspendido o archivado. Puedes ver el contenido,
            no editarlo.
          </p>
        ) : null}
        {panel.message ? (
          <p role="alert" className="text-sm text-red-700">
            {panel.message}
          </p>
        ) : null}
      </header>

      <fieldset disabled={!canEdit || panel.pending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField
            id="logo"
            label="Logo"
            currentPath={logoPath}
            slot={panel.logo}
          />
          <ImageField
            id="cover"
            label="Foto de portada"
            currentPath={coverPath}
            slot={panel.cover}
          />
        </div>
        {children}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!canEdit || panel.pending}
          className={primaryButtonClass}
        >
          {panel.pending ? "Procesando..." : "Guardar borrador"}
        </button>
        <button
          type="button"
          disabled={!canEdit || panel.pending || dirty || invalidDraft}
          className={secondaryButtonClass}
          onClick={panel.publish}
        >
          Publicar
        </button>
      </div>
      {canEdit && (dirty || invalidDraft) ? (
        <p className="text-ink-soft text-sm">
          Publicar usa el último borrador guardado.
        </p>
      ) : null}
    </form>
  );
}
