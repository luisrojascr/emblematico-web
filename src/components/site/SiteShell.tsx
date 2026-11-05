import type { ReactNode } from "react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

/** emblemático chrome (header, footer, WhatsApp). Client pages under /negocio don't use it. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
