"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { assertAdmin } from "@/lib/admin/guard";

const reportStatusSchema = z.object({
  reportId: z.uuid(),
  status: z.enum(["open", "reviewed"]),
});

export async function setReportStatus(formData: FormData): Promise<void> {
  const { user, supabase } = await assertAdmin();
  const parsed = reportStatusSchema.safeParse({
    reportId: String(formData.get("reportId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) redirect("/admin/reportes?aviso=error");

  const reviewed = parsed.data.status === "reviewed";
  const { error } = await supabase
    .from("guide_reports")
    .update({
      status: parsed.data.status,
      reviewed_at: reviewed ? new Date().toISOString() : null,
      reviewed_by: reviewed ? user.id : null,
    })
    .eq("id", parsed.data.reportId);
  if (error) {
    console.error("report status failed", error.code, error.message);
    redirect("/admin/reportes?aviso=error");
  }
  revalidatePath("/admin/reportes");
  revalidatePath("/admin");
  redirect("/admin/reportes?aviso=estado");
}
