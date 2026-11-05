"use server";

import { headers } from "next/headers";

import { quoteRateLimitIdentity } from "@/lib/quotes/identity";
import { quoteRequestSchema } from "@/lib/quotes/schema";
import { whatsappLink } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

export type QuoteFormValues = {
  name: string;
  phone: string;
  email: string;
  businessType: string;
  productSlug: string;
  message: string;
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
  "phone",
  "email",
  "businessType",
  "productSlug",
  "message",
] as const;

function readValues(formData: FormData): QuoteFormValues {
  const get = (key: string) => String(formData.get(key) ?? "");
  return {
    name: get("name"),
    phone: get("phone"),
    email: get("email"),
    businessType: get("businessType"),
    productSlug: get("productSlug"),
    message: get("message"),
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

  // submit_quote_request is service_role-only; the identity is computed here, never by the client.
  const { error } = await createAdminClient().rpc("submit_quote_request", {
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_business_type: input.businessType,
    p_product_id: productId ?? undefined,
    p_message: input.message,
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
    `Hola, soy ${input.name}. Acabo de enviar una solicitud de cotización desde el sitio.`,
    productName ? `Producto: ${productName}.` : null,
    input.businessType ? `Tipo de negocio: ${input.businessType}.` : null,
  ].filter(Boolean);

  return {
    status: "success",
    message: "¡Gracias! Recibimos tu solicitud y te contactaremos pronto.",
    whatsappUrl: whatsappLink(lines.join(" ")),
  };
}
