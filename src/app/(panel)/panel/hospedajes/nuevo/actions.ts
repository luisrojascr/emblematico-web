"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { slugError, slugifyName } from "@/lib/admin/slug";
import { requireUser } from "@/lib/auth/session";
import { importListing, type ListingImport } from "@/lib/panel/listing-import";
import { uploadBusinessImage } from "@/lib/panel/media";
import { buildContent, wizardSchema } from "@/lib/panel/wizard";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type WizardFailure = { ok: false; message: string };

// Simple per-process limit so the server cannot be used as a page fetcher.
const recentImports = new Map<string, number[]>();
const IMPORT_WINDOW_MS = 10 * 60_000;
const IMPORT_MAX = 8;

function allowImport(userId: string): boolean {
  const now = Date.now();
  const recent = (recentImports.get(userId) ?? []).filter(
    (time) => now - time < IMPORT_WINDOW_MS,
  );
  if (recent.length >= IMPORT_MAX) {
    recentImports.set(userId, recent);
    return false;
  }
  recent.push(now);
  recentImports.set(userId, recent);
  return true;
}

export async function importFromListing(
  url: string,
  confirmedOwnership: boolean,
): Promise<ListingImport> {
  const user = await requireUser();
  if (!confirmedOwnership) {
    return {
      ok: false,
      message: "Confirma que el contenido del anuncio es tuyo para continuar.",
    };
  }
  if (typeof url !== "string" || url.length > 500) {
    return { ok: false, message: "Ese enlace no es válido." };
  }
  if (!allowImport(user.id)) {
    return {
      ok: false,
      message: "Hiciste varios intentos seguidos. Espera unos minutos.",
    };
  }
  return importListing(url);
}

function slugCandidates(name: string): string[] {
  const root = slugifyName(name).slice(0, 52).replace(/-+$/g, "");
  const base = root.length >= 3 ? root : "alojamiento";
  const candidates = [base];
  for (let i = 0; i < 6; i += 1) {
    const suffix = Math.random().toString(36).slice(2, 6);
    candidates.push(`${base}-${suffix}`);
  }
  return candidates.filter((slug) => slugError(slug) === null);
}

export async function createProperty(
  formData: FormData,
): Promise<WizardFailure | void> {
  await requireUser();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("values") ?? ""));
  } catch {
    return { ok: false, message: "No recibimos el formulario." };
  }
  const parsed = wizardSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  }
  const values = parsed.data;
  const content = buildContent(values);

  const supabase = await createClient();
  let id: string | null = null;
  let failure =
    "No pudimos crear el hospedaje. Intenta de nuevo en un momento.";
  for (const slug of slugCandidates(values.name)) {
    const { data, error } = await supabase.rpc("create_my_business", {
      p_name: values.name,
      p_slug: slug,
      p_content: content as Json,
    });
    if (!error && data) {
      id = data;
      break;
    }
    console.error("create_my_business failed", error?.code, error?.message);
    const reason = error?.message.toLowerCase() ?? "";
    if (reason.includes("property limit")) {
      failure =
        "Ya usaste todos los alojamientos de tu plan. Escríbenos para ampliarlo.";
      break;
    }
    if (reason.includes("email not verified")) {
      failure = "Confirma tu correo antes de crear un hospedaje.";
      break;
    }
    if (reason.includes("rate limit")) {
      failure =
        "Creaste varios hospedajes seguidos. Espera un rato e intenta de nuevo.";
      break;
    }
    // Taken or reserved slug: try the next one. Any other error stops here.
    if (error?.code !== "23505" && error?.code !== "23514") break;
  }
  if (!id) {
    return { ok: false, message: failure };
  }

  // The photo is optional: if it fails, the property exists and it can be uploaded in the editor.
  const photo = await uploadBusinessImage(
    supabase,
    id,
    formData.get("cover"),
    "cover",
  );
  if (photo && "path" in photo) {
    const withCover = {
      ...content,
      theme: { ...content.theme, cover_path: photo.path },
    };
    const { error } = await supabase
      .from("pages")
      .update({ draft_content: withCover as Json })
      .eq("business_id", id);
    if (error) console.error("cover save failed", error.message);
  }

  revalidatePath("/panel");
  revalidatePath("/panel/hospedajes");
  redirect(`/panel/${id}?aviso=creado`);
}
