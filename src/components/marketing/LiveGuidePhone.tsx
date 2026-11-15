"use client";

import { useState, useSyncExternalStore } from "react";

/** Mismo corte que `lg` en Tailwind. Debajo de eso, la guía se abre a pantalla completa. */
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

/**
 * Teléfono con la guía real cargada en un iframe (mismo origen). El iframe solo
 * se monta en escritorio, así en el celular no se descarga una página que no se ve.
 */
export function LiveGuidePhone({ src, title }: { src: string; title: string }) {
  const desktop = useSyncExternalStore(subscribe, isDesktop, () => false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-[395px] rounded-[3rem] bg-[#111] p-[10px] shadow-2xl ring-1 ring-white/10">
      <div className="bg-cream relative h-[680px] overflow-hidden rounded-[2.4rem]">
        <div
          aria-hidden="true"
          className="absolute top-2 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#111]"
        />
        {!loaded && (
          <p className="text-ink-soft absolute inset-0 flex items-center justify-center text-sm">
            Cargando la guía…
          </p>
        )}
        {desktop && (
          <iframe
            src={src}
            title={title}
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full border-0 pt-10 transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>
    </div>
  );
}
