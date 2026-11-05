"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertAdmin } from "@/lib/admin/guard";
import { quoteStatusSchema } from "@/lib/admin/schemas";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export async function setQuoteStatus(formData: FormData): Promise<void> {
  const { supabase } = await assertAdmin();
  const parsed = quoteStatusSchema.safeParse({
    quoteId: text(formData, "quoteId"),
    status: text(formData, "status"),
  });
  if (!parsed.success) redirect("/admin/cotizaciones?aviso=error");

  const { error } = await supabase
    .from("quote_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.quoteId);
  if (error) {
    console.error("quote status failed", error.code, error.message);
    redirect("/admin/cotizaciones?aviso=error");
  }
  revalidatePath("/admin/cotizaciones");
  revalidatePath("/admin");
  redirect("/admin/cotizaciones?aviso=estado");
}
