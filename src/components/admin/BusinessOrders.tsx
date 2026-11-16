import {
  addBusinessOrder,
  removeBusinessOrder,
  setOrderStatus,
} from "@/app/(site)/admin/negocios/pedidos";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/panel/orders";
import { createClient } from "@/lib/supabase/server";

import { SubmitButton } from "./SubmitButton";
import { inputClass } from "./ui";

/** Pedidos de productos físicos de un negocio (los ve el cliente en su panel). */
export async function BusinessOrders({ businessId }: { businessId: string }) {
  const supabase = await createClient();
  const [{ data: orders, error }, { data: products }] = await Promise.all([
    supabase
      .from("business_orders")
      .select("id, product_name, quantity, status, notes, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <section
      id="pedidos"
      className="border-cream-dark space-y-4 rounded-2xl border bg-white p-5"
    >
      <h2 className="text-2xl">Productos comprados</h2>
      {error ? (
        <p className="text-sm text-red-700">
          No se pudieron cargar los pedidos. ¿Ya aplicaste la migración
          20261116000009_business_orders?
        </p>
      ) : (orders ?? []).length === 0 ? (
        <p className="text-ink-soft">Este negocio no tiene productos registrados.</p>
      ) : (
        <ul className="divide-cream-dark divide-y">
          {(orders ?? []).map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <span>
                <span className="font-medium">{order.product_name}</span> ×{" "}
                {order.quantity}
                {order.notes ? (
                  <span className="text-ink-soft block text-sm">{order.notes}</span>
                ) : null}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <form action={setOrderStatus} className="flex items-center gap-2">
                  <input type="hidden" name="businessId" value={businessId} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    aria-label={`Estado de ${order.product_name}`}
                    className={`${inputClass} w-auto`}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <SubmitButton variant="secondary">Guardar</SubmitButton>
                </form>
                <form action={removeBusinessOrder}>
                  <input type="hidden" name="businessId" value={businessId} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <SubmitButton variant="secondary">Quitar</SubmitButton>
                </form>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={addBusinessOrder} className="grid gap-3 sm:grid-cols-4">
        <input type="hidden" name="businessId" value={businessId} />
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="order-product" className="text-sm font-medium">
            Producto
          </label>
          <select id="order-product" name="productId" required className={inputClass}>
            {(products ?? []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="order-quantity" className="text-sm font-medium">
            Cantidad
          </label>
          <input
            id="order-quantity"
            name="quantity"
            type="number"
            min={1}
            max={999}
            defaultValue={1}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="order-status" className="text-sm font-medium">
            Estado
          </label>
          <select id="order-status" name="status" className={inputClass}>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-3">
          <label htmlFor="order-notes" className="text-sm font-medium">
            Nota para el cliente (opcional)
          </label>
          <input id="order-notes" name="notes" maxLength={500} className={inputClass} />
        </div>
        <div className="flex items-end">
          <SubmitButton>Agregar producto</SubmitButton>
        </div>
      </form>
    </section>
  );
}
