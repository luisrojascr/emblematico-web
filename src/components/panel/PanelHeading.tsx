import Link from "next/link";
import type { ReactNode } from "react";

import { businessPublicUrl } from "@/lib/qr/render";

import { PanelNav } from "./PanelNav";

export function PanelHeading({
  id,
  name,
  slug,
  children,
}: {
  id: string;
  name: string;
  slug: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/panel" className="text-ink-soft hover:text-ink text-sm">
        Mis negocios
      </Link>
      <h1 className="mt-2 mb-4 text-3xl">{name}</h1>
      <div className="mb-8">
        <PanelNav businessId={id} publicUrl={businessPublicUrl(slug)} />
      </div>
      {children}
    </section>
  );
}
