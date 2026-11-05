import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CtaBanner } from "@/components/marketing/CtaBanner";
import { ButtonLink, ExternalButtonLink } from "@/components/ui/ButtonLink";
import {
  getCategories,
  getProductBySlugs,
  getProducts,
} from "@/lib/catalog/data";
import { mediaUrl } from "@/lib/catalog/media";
import { SITE, whatsappLink } from "@/lib/site";

export async function generateStaticParams() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c.slug]));
  return products.flatMap((p) => {
    const categoria = categoryById.get(p.category_id);
    return categoria ? [{ categoria, producto: p.slug }] : [];
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/productos/[categoria]/[producto]">): Promise<Metadata> {
  const { categoria, producto } = await params;
  const found = await getProductBySlugs(categoria, producto);
  if (!found) return {};
  const { category, product } = found;
  return {
    title: product.name,
    description: product.summary ?? undefined,
    alternates: { canonical: `/productos/${category.slug}/${product.slug}` },
    openGraph: product.images[0]
      ? { images: [mediaUrl(product.images[0])] }
      : undefined,
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/productos/[categoria]/[producto]">) {
  const { categoria, producto } = await params;
  const found = await getProductBySlugs(categoria, producto);
  if (!found) notFound();
  const { category, product } = found;

  const paragraphs = (product.description ?? "")
    .split(/\n{2,}/)
    .filter(Boolean);
  const quoteMessage = `Hola, me gustaría cotizar: ${product.name} (${SITE.name}). Mi negocio es: `;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary ?? undefined,
    image: product.images.map((img) =>
      new URL(mediaUrl(img), SITE.url).toString(),
    ),
    brand: { "@type": "Brand", name: SITE.name },
    category: category.name,
  };

  return (
    <article className="bg-white">
      <script
        type="application/ld+json"
        // JSON.stringify output is not HTML-injectable; escape "<" to be safe.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Ruta" className="text-ink-soft mb-8 text-sm">
          <Link href="/productos" className="hover:text-ink">
            Productos
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/productos/${category.slug}`} className="hover:text-ink">
            {category.name}
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            {product.images.map((image, index) => (
              <div
                key={image}
                className="bg-cream-dark relative aspect-square overflow-hidden rounded-3xl"
              >
                <Image
                  src={mediaUrl(image)}
                  alt={
                    index === 0
                      ? product.name
                      : `${product.name}, imagen ${index + 1}`
                  }
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <p className="text-sand-dark text-xs font-medium tracking-[0.2em] uppercase">
              {category.name}
            </p>
            <h1 className="text-4xl">{product.name}</h1>
            {product.summary && (
              <p className="text-ink-soft text-lg">{product.summary}</p>
            )}
            <div className="text-ink-soft space-y-4">
              {paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <ul className="space-y-1 text-sm">
              <li>✓ Personalizado con tu nombre, logo y colores</li>
              <li>✓ Código QR hacia tu página digital (opcional)</li>
              <li>✓ Impreso en 3D en Costa Rica</li>
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <ExternalButtonLink href={whatsappLink(quoteMessage)}>
                Cotizar por WhatsApp
              </ExternalButtonLink>
              <ButtonLink
                href={`/contacto?producto=${product.slug}`}
                variant="secondary"
              >
                Enviar solicitud
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
      <CtaBanner />
    </article>
  );
}
