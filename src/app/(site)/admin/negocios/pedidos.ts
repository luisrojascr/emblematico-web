"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { assertAdmin } from "@/lib/admin/guard";
import { ORDER_STATUSES } from "@/lib/panel/orders";

const addSchema = z.object({
  businessId: z.uuid(),
  productId: z.uuid(),
  quantity: z.coerce.number().int().min(1).max(999),
  status: z.enum(ORDER_STATUSES),
  notes: z.string().trim().max(500),
});

const statusSchema = z.object({
  businessId: z.uuid(),
  orderId: z.uuid(),
  status: z.enum(ORDER_STATUSES),
});

const removeSchema = z.object({ businessId: z.uuid(), orderId: z.uuid() });

function back(businessId: string, code: string): never {
  redirect(`/admin/negocios/${businessId}?aviso=${code}#pedidos`);
}

export async function addBusinessOrder(formData: FormData): Promise<void> {
  const { supabase } = await assertAdmin();
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  const businessId = String(formData.get("businessId") ?? "");
  if (!parsed.success) back(businessId, "error");

  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!product) back(businessId, "error");

  const { error } = await supabase.from("business_orders").insert({
    business_id: parsed.data.businessId,
    product_id: parsed.data.productId,
    product_name: product.name,
    quantity: parsed.data.quantity,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
  });
  if (error) {
    console.error("order insert failed", error.code, error.message);
    back(businessId, "error");
  }
  revalidatePath(`/admin/negocios/${businessId}`);
  revalidatePath("/panel/productos");
  back(businessId, "guardado");
}

export async function setOrderStatus(formData: FormData): Promise<void> {
  const { supabase } = await assertAdmin();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  const businessId = String(formData.get("businessId") ?? "");
  if (!parsed.success) back(businessId, "error");
  const { error } = await supabase
    .from("business_orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.orderId)
    .eq("business_id", parsed.data.businessId);
  if (error) {
    console.error("order status failed", error.code, error.message);
    back(businessId, "error");
  }
  revalidatePath(`/admin/negocios/${businessId}`);
  revalidatePath("/panel/productos");
  back(businessId, "estado");
}

export async function removeBusinessOrder(formData: FormData): Promise<void> {
  const { supabase } = await assertAdmin();
  const parsed = removeSchema.safeParse(Object.fromEntries(formData));
  const businessId = String(formData.get("businessId") ?? "");
  if (!parsed.success) back(businessId, "error");
  const { error } = await supabase
    .from("business_orders")
    .delete()
    .eq("id", parsed.data.orderId)
    .eq("business_id", parsed.data.businessId);
  if (error) {
    console.error("order delete failed", error.code, error.message);
    back(businessId, "error");
  }
  revalidatePath(`/admin/negocios/${businessId}`);
  revalidatePath("/panel/productos");
  back(businessId, "guardado");
}
