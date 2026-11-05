import Image from "next/image";

import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6">
      <Image
        src="/brand/icon-gold.png"
        alt=""
        width={567}
        height={603}
        className="h-20 w-auto"
      />
      <h1 className="text-4xl sm:text-5xl">{SITE.tagline}</h1>
      <p className="text-ink-soft max-w-xl">{SITE.description}</p>
    </section>
  );
}
