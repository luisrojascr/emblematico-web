import Image from "next/image";
import Link from "next/link";

import { mediaUrl } from "@/lib/catalog/media";
import type { Product } from "@/lib/catalog/data";

export function ProductCard({
  product,
  categorySlug,
}: {
  product: Product;
  categorySlug: string;
}) {
  const image = product.images[0];
  return (
    <Link
      href={`/productos/${categorySlug}/${product.slug}`}
      className="group border-cream-dark flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-lg"
    >
      {image && (
        <div className="bg-cream-dark relative aspect-square overflow-hidden">
          <Image
            src={mediaUrl(image)}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="space-y-1 p-5">
        <h3 className="text-lg">{product.name}</h3>
        {product.summary && (
          <p className="text-ink-soft text-sm">{product.summary}</p>
        )}
      </div>
    </Link>
  );
}
