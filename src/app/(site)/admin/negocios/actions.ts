"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { revalidateBusiness } from "@/lib/admin/cache";
import { assertAdmin } from "@/lib/admin/guard";
import {
  businessIdSchema,
  checked,
  createBusinessSchema,
  expiryToIso,
  postgresMessage,
  updateBusinessSchema,
  validateBusinessSlug,
  zodFieldErrors,
  type ActionState,
} from "@/lib/admin/schemas";
import { takenBusinessSlugs } from "@/lib/admin/storage";
import { uniqueSlug } from "@/lib/admin/slug";
import { parsePageContent, defaultContent } from "@/lib/templates/registry";
import type { Json } from "@/lib/supabase/database.types";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function fail(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors };
}

export async function createBusiness(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const parsed = createBusinessSchema.safeParse({
    name: text(formData, "name"),
    category: text(formData, "category"),
    template: text(formData, "template"),
    slug: text(formData, "slug"),
  });
  if (!parsed.success) {
    return fail(
      "Revisa los campos marcados.",
      zodFieldErrors(parsed.error, ["name", "category", "template", "slug"]),
    );
  }

  const input = parsed.data;
  const taken = await takenBusinessSlugs(supabase);
  const slug = input.slug || uniqueSlug(input.name, taken);
  if (!slug)
    return fail("No pudimos generar un slug a partir del nombre.", {
      slug: "Escribe un slug.",
    });
  const slugProblem = validateBusinessSlug(slug);
  if (slugProblem) return fail(slugProblem, { slug: slugProblem });
  if (taken.has(slug)) {
    return fail("Ese slug ya existe o está retirado.", {
      slug: "Elige otro slug.",
    });
  }

  const content = defaultContent(input.template).content;
  const { data: id, error } = await supabase.rpc("create_business", {
    p_name: input.name,
    p_slug: slug,
    p_category: input.category,
    p_template: input.template,
    p_content: content as Json,
  });

  if (error || !id) {
    console.error("create_business failed", error?.code, error?.message);
    return fail(
      error ? postgresMessage(error) : "No pudimos crear el negocio.",
      { slug: "Revisa el slug." },
    );
  }

  revalidatePath("/admin/negocios");
  redirect(`/admin/negocios/${id}?aviso=creado`);
}

export async function updateBusiness(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await assertAdmin();
  const parsed = updateBusinessSchema.safeParse({
    businessId: text(formData, "businessId"),
    name: text(formData, "name"),
    category: text(formData, "category"),
    template: text(formData, "template"),
    slug: text(formData, "slug"),
    servicePlan: text(formData, "servicePlan"),
    serviceExpiresAt: text(formData, "serviceExpiresAt"),
    indexable: checked(formData, "indexable"),
    confirmSlug: checked(formData, "confirmSlug"),
    confirmTemplate: checked(formData, "confirmTemplate"),
  });
  if (!parsed.success) {
    return fail(
      "Revisa los campos marcados.",
      zodFieldErrors(parsed.error, [
        "name",
        "category",
        "template",
        "slug",
        "servicePlan",
        "serviceExpiresAt",
      ]),
    );
  }

  const input = parsed.data;
  const { data: current, error: loadError } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", input.businessId)
    .maybeSingle();
  if (loadError || !current) return fail("No encontramos ese negocio.");

  const { data: page, error: pageLoadError } = await supabase
    .from("pages")
    .select("template_key")
    .eq("business_id", current.id)
    .maybeSingle();
  if (pageLoadError || !page) return fail("El negocio no tiene página.");

  const slug = input.slug;
  const slugProblem = validateBusinessSlug(slug);
  if (slugProblem) return fail(slugProblem, { slug: slugProblem });

  const slugChanged = slug !== current.slug;
  const templateChanged = input.template !== page.template_key;
  if (slugChanged && !input.confirmSlug) {
    return fail("Confirma el cambio de slug. El anterior va a redirigir.", {
      confirmSlug: "Marca la casilla para continuar.",
    });
  }
  if (templateChanged && !input.confirmTemplate) {
    return fail(
      "Confirma el cambio de plantilla. Se borra el contenido y se despublica.",
      {
        confirmTemplate: "Marca la casilla para continuar.",
      },
    );
  }
  if (
    slugChanged &&
    (await takenBusinessSlugs(supabase, current.id)).has(slug)
  ) {
    return fail("Ese slug ya existe o está retirado.", {
      slug: "Elige otro slug.",
    });
  }

  const expires = expiryToIso(input.serviceExpiresAt);
  if (input.serviceExpiresAt && !expires) {
    return fail("Fecha no válida.", { serviceExpiresAt: "Fecha no válida." });
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      name: input.name,
      slug,
      category: input.category || null,
      service_plan: input.servicePlan || null,
      service_expires_at: expires,
      indexable: input.indexable,
    })
    .eq("id", current.id);
  if (error) {
    console.error("update business failed", error.code, error.message);
    return fail(postgresMessage(error));
  }

  if (templateChanged) {
    const draft = defaultContent(input.template).content;
    const { error: pageError } = await supabase
      .from("pages")
      .update({
        template_key: input.template,
        draft_content: draft as Json,
        published_content: null,
        status: "draft",
        published_at: null,
      })
      .eq("business_id", current.id);
    if (pageError) {
      console.error(
        "template change failed",
        pageError.code,
        pageError.message,
      );
      return fail(
        "Guardamos el negocio, pero no pudimos cambiar la plantilla.",
      );
    }
  }

  await revalidateBusiness(supabase, current.id, [current.slug, slug]);
  revalidatePath(`/admin/negocios/${current.id}`);
  redirect(`/admin/negocios/${current.id}?aviso=guardado`);
}

async function loadPage(businessId: string) {
  const { supabase } = await assertAdmin();
  const { data, error } = await supabase
    .from("businesses")
    .select("id, slug, status")
    .eq("id", businessId)
    .maybeSingle();
  if (error || !data) return { supabase, business: null };
  const { data: page } = await supabase
    .from("pages")
    .select("template_key, status, draft_content")
    .eq("business_id", data.id)
    .maybeSingle();
  return { supabase, business: { ...data, page } };
}

export async function publishBusiness(formData: FormData): Promise<void> {
  const parsed = businessIdSchema.safeParse({
    businessId: text(formData, "businessId"),
  });
  if (!parsed.success) redirect("/admin/negocios?aviso=error");
  const { supabase, business } = await loadPage(parsed.data.businessId);
  if (!business?.page) redirect("/admin/negocios?aviso=error");
  if (business.status !== "active") {
    redirect(`/admin/negocios/${business.id}?aviso=inactivo`);
  }
  if (
    !parsePageContent(business.page.template_key, business.page.draft_content)
  ) {
    redirect(`/admin/negocios/${business.id}?aviso=borrador`);
  }

  const { error } = await supabase.rpc("publish_page", {
    p_business_id: business.id,
  });
  if (error) {
    console.error("publish_page failed", error.code, error.message);
    redirect(`/admin/negocios/${business.id}?aviso=error`);
  }
  await revalidateBusiness(supabase, business.id, [business.slug]);
  revalidatePath(`/admin/negocios/${business.id}`);
  redirect(`/admin/negocios/${business.id}?aviso=publicada`);
}

export async function unpublishBusiness(formData: FormData): Promise<void> {
  const parsed = businessIdSchema.safeParse({
    businessId: text(formData, "businessId"),
  });
  if (!parsed.success) redirect("/admin/negocios?aviso=error");
  const { supabase, business } = await loadPage(parsed.data.businessId);
  if (!business) redirect("/admin/negocios?aviso=error");

  const { error } = await supabase
    .from("pages")
    .update({ status: "unpublished" })
    .eq("business_id", business.id)
    .eq("status", "published");
  if (error) {
    console.error("unpublish failed", error.code, error.message);
    redirect(`/admin/negocios/${business.id}?aviso=error`);
  }
  await revalidateBusiness(supabase, business.id, [business.slug]);
  revalidatePath(`/admin/negocios/${business.id}`);
  redirect(`/admin/negocios/${business.id}?aviso=despublicada`);
}

export async function setBusinessStatus(formData: FormData): Promise<void> {
  const parsed = businessIdSchema.safeParse({
    businessId: text(formData, "businessId"),
  });
  const status = text(formData, "status");
  if (
    !parsed.success ||
    (status !== "active" && status !== "suspended" && status !== "archived")
  ) {
    redirect("/admin/negocios?aviso=error");
  }
  const { supabase } = await assertAdmin();
  const { data, error } = await supabase
    .from("businesses")
    .update({ status })
    .eq("id", parsed.data.businessId)
    .select("id, slug")
    .maybeSingle();
  if (error || !data) {
    console.error("status change failed", error?.code, error?.message);
    redirect(`/admin/negocios/${parsed.data.businessId}?aviso=error`);
  }
  await revalidateBusiness(supabase, data.id, [data.slug]);
  revalidatePath(`/admin/negocios/${data.id}`);
  redirect(`/admin/negocios/${data.id}?aviso=estado`);
}
