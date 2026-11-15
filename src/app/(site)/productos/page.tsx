import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ContactBand } from "@/components/marketing/home/ContactBand";
import {
  ArrowIcon,
  CubeIcon,
  QrIcon,
  SparkIcon,
} from "@/components/marketing/home/icons";
import { SquareLink } from "@/components/ui/SquareButton";
import {
  type Category,
  type Product,
  getCategories,
  getProducts,
} from "@/lib/catalog/data";
import { mediaUrl } from "@/lib/catalog/media";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Productos y accesorios para alojamientos",
  description:
    "Welcome Station, Room Essentials y Hospitality Kits personalizados para alojamientos turísticos en Costa Rica, con QR hacia tu guía digital, más displays QR para negocios.",
  alternates: { canonical: "/productos" },
};

// Las categorías de hospedaje van primero; el resto (negocios) queda en segundo plano.
const HOSPITALITY_SLUGS = new Set([
  "hospitality-kits",
  "welcome-station",
  "room-essentials",
]);

/** Frase corta sobre dónde va cada categoría. Las nuevas usan la genérica. */
const PLACEMENT: Record<string, string> = {
  "welcome-station": "Para la entrada o la recepción",
  "room-essentials": "Para habitaciones y áreas comunes",
  "hospitality-kits": "Todo en un solo diseño",
};

const BENEFITS: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <SparkIcon />,
    title: "Con tu marca",
    text: "Nombre, logo y colores de tu alojamiento en cada pieza.",
  },
  {
    icon: <QrIcon />,
    title: "QR hacia tu guía",
    text: "Actualizas la guía desde tu panel, sin reimprimir nada.",
  },
  {
    icon: <CubeIcon />,
    title: "Cotización a la medida",
    text: "Según tus habitaciones y servicios. El envío se cobra aparte.",
  },
];

const eyebrow =
  "text-sand-dark text-[11px] font-semibold tracking-[0.18em] uppercase";

function categoryHref(category: Category) {
  return `/productos/${category.slug}`;
}

function quoteHref(products: Product[]) {
  return products[0] ? `/contacto?producto=${products[0].slug}` : "/contacto";
}

/** Imagen de la categoría. Es decorativa: el nombre ya está en el título. */
function CategoryImage({
  category,
  className,
  sizes,
}: {
  category: Category;
  className: string;
  sizes: string;
}) {
  if (!category.image_path) return null;
  return (
    <div
      className={`bg-cream-dark relative overflow-hidden rounded-2xl ${className}`}
    >
      <Image
        src={mediaUrl(category.image_path)}
        alt=""
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}

function ProductLinks({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  if (products.length === 0) return null;
  return (
    <ul className="border-cream-dark divide-cream-dark divide-y border-y">
      {products.map((product) => (
        <li key={product.id}>
          <Link
            href={`${categoryHref(category)}/${product.slug}`}
            className="group flex items-center justify-between gap-4 py-4"
          >
            <span className="space-y-0.5">
              <span className="block font-medium group-hover:underline">
                {product.name}
              </span>
              {product.summary && (
                <span className="text-ink-soft block text-sm">
                  {product.summary}
                </span>
              )}
            </span>
            <span className="text-sand-dark shrink-0 transition-transform group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CategoryFeature({
  category,
  products,
  index,
}: {
  category: Category;
  products: Product[];
  index: number;
}) {
  const reverse = index % 2 === 1;
  return (
    <article
      id={category.slug}
      className="grid scroll-mt-24 items-center gap-8 lg:grid-cols-2 lg:gap-16"
    >
      <CategoryImage
        category={category}
        sizes="(min-width: 1024px) 45vw, 100vw"
        className={`aspect-[4/3] ${reverse ? "lg:order-2" : ""}`}
      />
      <div className="space-y-5">
        <p className={eyebrow}>
          {String(index + 1).padStart(2, "0")} ·{" "}
          {PLACEMENT[category.slug] ?? "Accesorios"}
        </p>
        <h2 className="text-3xl sm:text-4xl">{category.name}</h2>
        {category.description && (
          <p className="text-ink-soft max-w-xl">{category.description}</p>
        )}
        <ProductLinks category={category} products={products} />
        <SquareLink href={quoteHref(products)}>
          Cotizar {category.name}
        </SquareLink>
      </div>
    </article>
  );
}

function BusinessCategory({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  return (
    <article
      id={category.slug}
      className="border-cream-dark grid scroll-mt-24 items-center gap-8 rounded-2xl border bg-white p-6 sm:p-8 lg:grid-cols-[1fr_20rem] lg:gap-12"
    >
      <div className="space-y-4">
        <p className={eyebrow}>También para negocios</p>
        <h2 className="text-2xl sm:text-3xl">{category.name}</h2>
        {category.description && (
          <p className="text-ink-soft max-w-xl">{category.description}</p>
        )}
        <ProductLinks category={category} products={products} />
        <SquareLink href={quoteHref(products)} variant="outline">
          Cotizar {category.name}
        </SquareLink>
      </div>
      <CategoryImage
        category={category}
        sizes="(min-width: 1024px) 20rem, 100vw"
        className="order-first aspect-[4/3] lg:order-none lg:aspect-square"
      />
    </article>
  );
}

async function Catalog() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const productsOf = (category: Category) =>
    products.filter((p) => p.category_id === category.id);
  const hospitality = categories.filter((c) => HOSPITALITY_SLUGS.has(c.slug));
  const business = categories.filter((c) => !HOSPITALITY_SLUGS.has(c.slug));

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 sm:py-20 lg:space-y-28 lg:px-12 lg:py-24">
          {hospitality.map((category, index) => (
            <CategoryFeature
              key={category.id}
              category={category}
              products={productsOf(category)}
              index={index}
            />
          ))}
        </div>
      </section>
      {business.length > 0 && (
        <section className="bg-cream">
          <div className="mx-auto max-w-7xl space-y-6 px-4 py-16 sm:px-6 lg:px-12">
            {business.map((category) => (
              <BusinessCategory
                key={category.id}
                category={category}
                products={productsOf(category)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-12 lg:pt-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="space-y-5 lg:col-span-8">
              <p className={eyebrow}>Productos</p>
              <h1 className="text-4xl sm:text-5xl">
                Piezas que completan la bienvenida
              </h1>
              <p className="text-ink-soft max-w-2xl text-lg">
                Accesorios impresos en 3D y personalizados para tu alojamiento.
                Cada uno puede llevar un código QR hacia tu guía digital.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <SquareLink href="/contacto">Solicitar propuesta</SquareLink>
              <SquareLink href={SITE.demoPath} variant="outline">
                Ver demo
              </SquareLink>
            </div>
          </div>
          <ul className="border-cream-dark mt-12 grid gap-6 border-t pt-10 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="text-sand-dark shrink-0">{b.icon}</span>
                <span className="space-y-1">
                  <span className="block font-medium">{b.title}</span>
                  <span className="text-ink-soft block text-sm">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Catalog />
      <ContactBand />
    </>
  );
}
