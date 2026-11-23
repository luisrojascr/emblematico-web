import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getPanelI18n } from "@/lib/panel/i18n-server";
import { PanelLoading } from "@/components/panel/PanelLanguageProvider";
import { PanelPage } from "@/components/panel/PanelPage";
import {
  panelCardClass,
  panelPrimaryButtonClass,
  panelSecondaryButtonClass,
} from "@/components/panel/ui";
import { requireUser } from "@/lib/auth/session";
import { getCategories, getProducts } from "@/lib/catalog/data";
import { mediaUrl } from "@/lib/catalog/media";
import { orderStatusLabel } from "@/lib/panel/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Productos" };

const STATUS_STYLE: Record<string, string> = {
  solicitado: "bg-sand/25 text-ink",
  en_produccion: "bg-aqua/25 text-teal-deep",
  enviado: "bg-teal/15 text-teal-deep",
  entregado: "bg-teal text-white",
};

async function Products() {
  const { t, locale } = await getPanelI18n();
  await requireUser();
  const supabase = await createClient();
  const [ordersResult, { data: businesses }, products, categories] =
    await Promise.all([
      supabase
        .from("business_orders")
        .select(
          "id, business_id, product_id, product_name, quantity, status, notes, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("businesses").select("id, name"),
      getProducts(),
      getCategories(),
    ]);
  // Si la migración de pedidos aún no está aplicada, la página igual muestra recomendados.
  const orders = ordersResult.error ? [] : (ordersResult.data ?? []);
  const businessName = new Map((businesses ?? []).map((b) => [b.id, b.name]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const categorySlug = new Map(categories.map((c) => [c.id, c.slug]));
  const owned = new Set(orders.map((o) => o.product_id).filter(Boolean));
  const recommended = products.filter((p) => !owned.has(p.id));

  return (
    <PanelPage
      title={t("Productos")}
      subtitle={t(
        "Las piezas físicas de tus hospedajes y otras ideas para tus huéspedes.",
      )}
    >
      <section className="mb-12 space-y-4">
        <h2 className="text-xl">{t("Tus productos")}</h2>
        {orders.length === 0 ? (
          <div className={`${panelCardClass} p-6`}>
            <p className="font-semibold">
              {t("Todavía no tienes productos físicos.")}
            </p>
            <p className="text-ink-soft mt-1 text-sm">
              {t(
                "La pieza de bienvenida 3D con tu código QR es la favorita de los anfitriones. Cuando hagas un pedido, aquí verás su estado.",
              )}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => {
              const product = order.product_id
                ? productById.get(order.product_id)
                : undefined;
              const image = product?.images[0];
              return (
                <li
                  key={order.id}
                  className={`${panelCardClass} flex items-center gap-4 p-4`}
                >
                  <div className="bg-cream-dark size-16 shrink-0 overflow-hidden rounded-xl">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(image)}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {order.product_name}
                      <span className="text-ink-soft font-normal">
                        {" "}
                        × {order.quantity}
                      </span>
                    </p>
                    <p className="text-ink-soft text-sm">
                      {businessName.get(order.business_id) ?? t("Hospedaje")} ·{" "}
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(order.created_at))}
                    </p>
                    {order.notes ? (
                      <p className="text-ink-soft mt-1 text-sm">
                        {order.notes}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      STATUS_STYLE[order.status] ?? "bg-cream-dark"
                    }`}
                  >
                    {t(orderStatusLabel(order.status))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {recommended.length ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl">{t("Recomendados para ti")}</h2>
            <Link
              href="/productos"
              className="text-teal-deep text-sm font-semibold"
            >
              {t("Ver catálogo completo")}
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((product) => {
              const image = product.images[0];
              const slug = categorySlug.get(product.category_id);
              return (
                <li
                  key={product.id}
                  className={`${panelCardClass} flex flex-col overflow-hidden`}
                >
                  <div className="bg-cream-dark aspect-[4/3] overflow-hidden">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(image)}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex-1">
                      <h3 className="text-lg leading-tight">{product.name}</h3>
                      {product.summary ? (
                        <p className="text-ink-soft mt-1 text-sm">
                          {product.summary}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/contacto?producto=${product.slug}`}
                        className={panelPrimaryButtonClass}
                      >
                        {t("Solicitar")}
                      </Link>
                      {slug ? (
                        <Link
                          href={`/productos/${slug}/${product.slug}`}
                          className={panelSecondaryButtonClass}
                        >
                          {t("Ver detalle")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </PanelPage>
  );
}

export default function PanelProductsPage() {
  return (
    <Suspense fallback={<PanelLoading variant="products" />}>
      <Products />
    </Suspense>
  );
}
