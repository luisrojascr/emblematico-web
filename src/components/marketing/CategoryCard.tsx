import Image from "next/image";
import Link from "next/link";

import { mediaUrl } from "@/lib/catalog/media";
import type { Category } from "@/lib/catalog/data";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/productos/${category.slug}`}
      className="group border-cream-dark flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-lg"
    >
      {category.image_path && (
        <div className="bg-cream-dark relative aspect-square overflow-hidden">
          <Image
            src={mediaUrl(category.image_path)}
            alt={category.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="space-y-2 p-5">
        <h3 className="text-xl">{category.name}</h3>
        {category.description && (
          <p className="text-ink-soft line-clamp-3 text-sm">
            {category.description}
          </p>
        )}
        <span className="text-sand-dark inline-block pt-1 text-sm font-medium">
          Ver productos →
        </span>
      </div>
    </Link>
  );
}
