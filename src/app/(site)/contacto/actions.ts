"use server";

import { headers } from "next/headers";

import { quoteRateLimitIdentity } from "@/lib/quotes/identity";
import { getPlan } from "@/lib/plans";
import { composeQuoteMessage, quoteRequestSchema } from "@/lib/quotes/schema";
import { whatsappLink } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

export type QuoteFormValues = {
  name: string;
  accommodation: string;
  area: string;
  accommodationType: string;
  size: string;
  phone: string;
  message: string;
  productSlug: string;
  plan: string;
  pieces: string;
};

export type QuoteFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof QuoteFormValues, string>>;
  values?: QuoteFormValues;
  whatsappUrl?: string;
};

const FIELDS = [
  "name",
  "accommodation",
  "area",
  "accommodationType",
  "size",
  "phone",
  "message",
  "productSlug",
  "plan",
  "pieces",
] as const;

function readValues(formData: FormData): QuoteFormValues {
  const get = (key: string) => String(formData.get(key) ?? "");
  return {
    name: get("name"),
    accommodation: get("accommodation"),
    area: get("area"),
    accommodationType: get("accommodationType"),
    size: get("size"),
    phone: get("phone"),
    message: get("message"),
    productSlug: get("productSlug"),
    plan: get("plan"),
    pieces: get("pieces"),
  };
}

export async function submitQuote(
  _prev: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  // Honeypot: real users never see or fill this field. Pretend success to bots.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", message: "¡Gracias! Recibimos tu solicitud." };
  }

  const values = readValues(formData);
  const parsed = quoteRequestSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: QuoteFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        typeof key === "string" &&
        (FIELDS as readonly string[]).includes(key)
      ) {
        fieldErrors[key as keyof QuoteFormValues] ??= issue.message;
      }
    }
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors,
      values,
    };
  }

  const input = parsed.data;

  // Resolve the optional product to its id (active products only).
  let productId: string | null = null;
  let productName: string | null = null;
  if (input.productSlug) {
    const { data } = await createPublicClient()
      .from("products")
      .select("id, name")
      .eq("slug", input.productSlug)
      .eq("is_active", true)
      .maybeSingle();
    productId = data?.id ?? null;
    productName = data?.name ?? null;
  }

  let identity: string;
  try {
    identity = quoteRateLimitIdentity(await headers());
  } catch (error) {
    console.error("quote: rate-limit identity unavailable", error);
    return {
      status: "error",
      message: "No pudimos enviar tu solicitud. Escríbenos por WhatsApp.",
      values,
    };
  }

  // TODO: enviar un correo de notificación al recibir una solicitud nueva.
  // Por ahora las solicitudes solo se guardan y se ven en /admin/cotizaciones.
  // Los campos extra (alojamiento, zona, tamaño) viajan dentro del texto del mensaje.

  // submit_quote_request is service_role-only; the identity is computed here, never by the client.
  const { error } = await createAdminClient().rpc("submit_quote_request", {
    p_name: input.name,
    p_phone: input.phone,
    p_business_type: input.accommodationType,
    p_product_id: productId ?? undefined,
    p_message: composeQuoteMessage(input),
    p_ip_hash: identity,
  });

  if (error) {
    if (error.code === "P0001") {
      return {
        status: "error",
        message:
          "Recibimos muchas solicitudes desde tu conexión. Intenta más tarde o escríbenos por WhatsApp.",
        values,
      };
    }
    console.error("quote: submit failed", error.code, error.message);
    return {
      status: "error",
      message:
        "No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.",
      values,
    };
  }

  const lines = [
    `Hola, soy ${input.name}. Acabo de enviar una solicitud de demo o propuesta desde el sitio.`,
    `Alojamiento: ${input.accommodation} (${input.area}).`,
    getPlan(input.plan) ? `Plan: ${getPlan(input.plan)?.name}.` : null,
    input.pieces > 0 ? `Piezas de bienvenida 3D: ${input.pieces}.` : null,
    productName ? `Producto de interés: ${productName}.` : null,
  ].filter(Boolean);

  return {
    status: "success",
    message: "¡Gracias! Recibimos tu solicitud y te contactaremos pronto.",
    whatsappUrl: whatsappLink(lines.join(" ")),
  };
}
