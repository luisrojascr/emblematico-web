import type { ReactNode } from "react";

export type GuideIconName =
  | "welcome"
  | "wifi"
  | "stay"
  | "rules"
  | "amenities"
  | "recommendations"
  | "tours"
  | "wellness"
  | "shopping"
  | "emergency"
  | "cleaning"
  | "minibar"
  | "taxi"
  | "parking"
  | "faq";

const PATHS: Partial<Record<GuideIconName, ReactNode>> = {
  welcome: <path d="M4 6h16v10H8l-4 4z" />,
  wifi: (
    <>
      <path d="M2 9a15 15 0 0 1 20 0" />
      <path d="M5.5 12.5a10 10 0 0 1 13 0" />
      <path d="M9 16a5 5 0 0 1 6 0" />
      <circle cx="12" cy="19.5" r="0.8" />
    </>
  ),
  stay: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  rules: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  amenities: (
    <path d="M12 3l2.6 5.6 6 .6-4.5 4 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.5-4 6-.6z" />
  ),
  recommendations: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
};

Object.assign(PATHS, {
  tours: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  wellness: (
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  ),
  shopping: (
    <>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  emergency: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />,
  cleaning: (
    <>
      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  minibar: (
    <>
      <path d="M7 3h10l-1 18H8z" />
      <path d="M7.5 9h9" />
    </>
  ),
  taxi: (
    <>
      <path d="M5 16v-5l2-5h10l2 5v5z" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
    </>
  ),
  parking: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9.5 16V8h3.2a2.5 2.5 0 0 1 0 5H9.5" />
    </>
  ),
  faq: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" />
      <circle cx="12" cy="17" r="0.8" />
    </>
  ),
} satisfies Partial<Record<GuideIconName, ReactNode>>);

/** Small line icon for a guide section tile. Decorative: the title names it. */
export function GuideIcon({ name }: { name: GuideIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
