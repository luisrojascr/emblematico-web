"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { revalidateBusiness } from "@/lib/admin/cache";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { PageContent } from "@/lib/templates/registry";

import {
  draftForBusiness,
  imagesToRelease,
  themeImagePaths,
} from "@/lib/panel/draft";
import { loadPanelPage } from "@/lib/panel/load";
import { removeStoredImage, uploadBusinessImage } from "@/lib/panel/media";

export type PanelFailure = { ok: false; message: string };

function fileOf(formData: FormData, key: string): FormDataEntryValue | null {
  const entry = formData.get(key);
  return entry instanceof File && entry.size > 0 ? entry : null;
}

function withImage(
  page: PageContent,
  slot: "logo_path" | "cover_path",
  path: string | null,
): PageContent {
  switch (page.templateKey) {
    case "hospitality":
      return {
        templateKey: page.templateKey,
        content: {
          ...page.content,
          theme: { ...page.content.theme, [slot]: path },
        },
      };
    case "general":
      return {
        templateKey: page.templateKey,
        content: {
          ...page.content,
          theme: { ...page.content.theme, [slot]: path },
        },
      };
    default: {
      const unreachable: never = page;
      return unreachable;
    }
  }
}

export async function saveDraft(
  businessId: string,
  formData: FormData,
): Promise<PanelFailure | void> {
  if (!z.uuid().safeParse(businessId).success) {
    return { ok: false, message: "No encontramos este negocio." };
  }
  const current = await loadPanelPage(businessId);
  if (!current) return { ok: false, message: "No encontramos este negocio." };
  if (current.status !== "active") {
    return {
      ok: false,
      message: "Este negocio está suspendido o archivado. No se puede editar.",
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("content") ?? ""));
  } catch {
    return { ok: false, message: "No recibimos el formulario." };
  }

  const parsed = draftForBusiness(current.templateKey, raw, businessId);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const logo = await uploadBusinessImage(
    supabase,
    businessId,
    fileOf(formData, "logo"),
    "logo",
  );
  if (logo && "error" in logo) return { ok: false, message: logo.error };
  const cover = await uploadBusinessImage(
    supabase,
    businessId,
    fileOf(formData, "cover"),
    "cover",
  );
  if (cover && "error" in cover) {
    if (logo && "path" in logo) await removeStoredImage(supabase, logo.path);
    return { ok: false, message: cover.error };
  }

  let page = parsed.page;
  const previousLogo = page.content.theme.logo_path;
  const previousCover = page.content.theme.cover_path;
  if (logo && "path" in logo) page = withImage(page, "logo_path", logo.path);
  else if (formData.get("remove_logo") === "1") {
    page = withImage(page, "logo_path", null);
  }
  if (cover && "path" in cover)
    page = withImage(page, "cover_path", cover.path);
  else if (formData.get("remove_cover") === "1") {
    page = withImage(page, "cover_path", null);
  }

  const { error } = await supabase
    .from("pages")
    .update({ draft_content: page.content as Json })
    .eq("business_id", businessId);
  if (error) {
    console.error("draft save failed", error.message);
    if (logo && "path" in logo) await removeStoredImage(supabase, logo.path);
    if (cover && "path" in cover) await removeStoredImage(supabase, cover.path);
    return { ok: false, message: "No pudimos guardar el borrador." };
  }

  const { data: stored, error: storedError } = await supabase
    .from("pages")
    .select("published_content")
    .eq("business_id", businessId)
    .maybeSingle();
  if (storedError) {
    console.error("published image lookup failed", storedError.message);
  } else {
    // The live page keeps its copy until publish. Drop a file only when the
    // new draft and the published page have both stopped pointing at it.
    const released = imagesToRelease(
      [previousLogo, previousCover],
      [
        ...themeImagePaths(page.content),
        ...themeImagePaths(stored?.published_content),
      ],
    );
    for (const path of released) await removeStoredImage(supabase, path);
  }

  revalidatePath(`/panel/${businessId}`);
  revalidatePath(`/panel/${businessId}/vista-previa`);
  redirect(`/panel/${businessId}?aviso=guardado`);
}

function publishMessage(error: { message: string }): string {
  const message = error.message.toLowerCase();
  if (message.includes("not active")) {
    return "Este negocio está suspendido o archivado. No se puede publicar.";
  }
  if (message.includes("nothing to publish")) {
    return "Guarda un borrador antes de publicar.";
  }
  if (
    message.includes("not allowed") ||
    message.includes("not authenticated")
  ) {
    return "No tienes permiso para publicar esta página.";
  }
  return "No pudimos publicar la página.";
}

export async function publishDraft(
  businessId: string,
): Promise<PanelFailure | void> {
  if (!z.uuid().safeParse(businessId).success) {
    return { ok: false, message: "No encontramos este negocio." };
  }
  const current = await loadPanelPage(businessId);
  if (!current) return { ok: false, message: "No encontramos este negocio." };
  if (current.status !== "active") {
    return {
      ok: false,
      message:
        "Este negocio está suspendido o archivado. No se puede publicar.",
    };
  }
  const parsed = draftForBusiness(
    current.templateKey,
    current.draft,
    businessId,
  );
  if (!parsed.ok) {
    return {
      ok: false,
      message: "El borrador no es válido, así que no se publicó.",
    };
  }

  const supabase = await createClient();
  const { data: stored, error: storedError } = await supabase
    .from("pages")
    .select("published_content")
    .eq("business_id", businessId)
    .maybeSingle();
  const { error } = await supabase.rpc("publish_page", {
    p_business_id: businessId,
  });
  if (error) {
    console.error("publish failed", error.message);
    return { ok: false, message: publishMessage(error) };
  }

  if (storedError) {
    console.error("published image lookup failed", storedError.message);
  } else {
    // publish_page copies the draft over the published page, so a logo or
    // cover that only the previous published version used can go now.
    const released = imagesToRelease(
      themeImagePaths(stored?.published_content),
      themeImagePaths(parsed.page.content),
    );
    for (const path of released) await removeStoredImage(supabase, path);
  }

  await revalidateBusiness(supabase, businessId);
  revalidatePath(`/panel/${businessId}`);
  redirect(`/panel/${businessId}?aviso=publicada`);
}
