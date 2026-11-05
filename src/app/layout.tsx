import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { SITE } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    siteName: SITE.name,
    locale: "es_CR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6EFE6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CR" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
