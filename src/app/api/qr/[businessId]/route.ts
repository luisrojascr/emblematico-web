import { type NextRequest } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import { businessPublicUrl, renderQrPng, renderQrSvg } from "@/lib/qr/render";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/qr/[businessId]">,
) {
  const { businessId } = await context.params;
  if (!z.uuid().safeParse(businessId).success) {
    return new Response("No encontrado", { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format");
  if (format !== "svg" && format !== "png") {
    return new Response("Formato no válido", { status: 400 });
  }

  const user = await getSessionUser();
  if (!user) return new Response("Debes ingresar", { status: 401 });

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", businessId)
    .maybeSingle();
  if (!business) return new Response("No encontrado", { status: 404 });

  const url = businessPublicUrl(business.slug);
  const body =
    format === "svg"
      ? await renderQrSvg(url)
      : new Uint8Array(await renderQrPng(url));
  return new Response(body, {
    headers: {
      "Content-Type": format === "svg" ? "image/svg+xml" : "image/png",
      "Content-Disposition": `attachment; filename="${business.slug}.${format}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
