"use client";

import { useEffect, useRef, useState } from "react";

// Silent, looping promo video for the home hero. Autoplay is only used when
// the visitor has not asked for reduced motion; otherwise the poster is shown
// with native controls so playback stays opt-in.
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    if (!query.matches) {
      // Some browsers ignore the autoPlay attribute; try explicitly.
      ref.current?.play().catch(() => {});
    }
  }, []);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      poster="/video/hero-poster.jpg"
      muted
      loop
      playsInline
      autoPlay={!reducedMotion}
      controls={reducedMotion}
      preload="auto"
      aria-label="Video de 45 segundos: cómo funciona la guía digital de Emblemático, con QR, idiomas, extras y recomendaciones"
    >
      <source src="/video/hero-emblematico.mp4" type="video/mp4" />
    </video>
  );
}
