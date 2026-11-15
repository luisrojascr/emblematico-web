import Image from "next/image";
import Link from "next/link";

import { getCategories, type Category } from "@/lib/catalog/data";
import { mediaUrl } from "@/lib/catalog/media";

import { SectionHeading } from "./SectionHeading";

/** Si la consulta falla o no hay categorías, la sección se omite y el resto de la página sigue. */
export async function Catalog() {
  let categories: Category[];
  try {
    categories = await getCategories();
  } catch (error) {
    console.error("home: catalog unavailable", error);
    return null;
  }
  if (categories.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <SectionHeading
          eyebrow="Catálogo"
          title="Piezas que completan la bienvenida"
        />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/productos/${c.slug}`}
                className="group border-cream-dark flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-lg"
              >
                {c.image_path && (
                  <div className="bg-cream-dark relative aspect-square overflow-hidden">
                    <Image
                      src={mediaUrl(c.image_path)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col space-y-2 p-5">
                  <h3 className="text-xl">{c.name}</h3>
                  {c.description && (
                    <p className="text-ink-soft line-clamp-3 text-sm">
                      {c.description}
                    </p>
                  )}
                  <span className="text-sand-dark mt-auto pt-2 text-xs font-semibold tracking-[0.08em] uppercase">
                    Ver modelo →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
