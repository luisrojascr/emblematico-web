/**
 * Planes digitales (cobro anual, en dólares) y la pieza de bienvenida 3D como extra
 * de pago único con precio por cantidad. Todo es configurable aquí.
 * Pon `SHOW_PRICES` en false para ocultar los montos de pago (se muestra "Cotiza").
 */
export const SHOW_PRICES = true;

export const CURRENCY_NOTE =
  "Precios en dólares (USD). También aceptamos SINPE Móvil en colones al tipo de cambio del día.";

export const PLAN_IDS = ["free", "essential", "plus", "managers"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  name: string;
  /** Precio anual en USD (solo la parte digital). `null` = se cotiza. */
  price: number | null;
  /** Alojamientos incluidos. `null` = a la medida. */
  properties: number | null;
  /**
   * Precio anual en USD por cada alojamiento adicional, hasta MAX_SELF_SERVE_PROPERTIES.
   * Plus ya llega al máximo, así que no lo tiene.
   */
  extraProperty?: number;
  summary: string;
  includes: readonly string[];
  highlighted?: boolean;
};

/** Más de esta cantidad de alojamientos pasa al plan para administradores. */
export const MAX_SELF_SERVE_PROPERTIES = 5;

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Hospitality Free",
    price: 0,
    properties: 1,
    summary: "Para probar la guía en un solo alojamiento.",
    includes: [
      "1 alojamiento",
      "1 idioma, sin traducciones",
      "Tema estándar",
      "Wi-Fi, contacto, información de la casa, check-out, normas y recomendaciones",
      "Código QR permanente y plantilla PDF",
      "Panel editable",
      "Una cuenta gratuita por persona o empresa",
    ],
  },
  {
    id: "essential",
    name: "Hospitality Essential",
    price: 49,
    properties: 3,
    extraProperty: 15,
    summary: "Lo necesario para dar una bienvenida clara y ordenada.",
    includes: [
      "Hasta 3 alojamientos",
      "Guía digital bilingüe",
      "Información básica del alojamiento",
      "Contacto por WhatsApp",
      "Panel editable",
      "Alojamiento web (hosting) incluido",
    ],
  },
  {
    id: "plus",
    name: "Hospitality Plus",
    price: 99,
    properties: 5,
    summary: "Para propiedades que quieren ofrecer más a sus huéspedes.",
    includes: [
      "Hasta 5 alojamientos",
      "Todo lo de Essential",
      "Recomendaciones ampliadas de la zona",
      "Catálogo de experiencias o servicios",
    ],
    highlighted: true,
  },
  {
    id: "managers",
    name: "Plan para administradores",
    price: null,
    properties: null,
    summary: "Para administradores de propiedades con una cartera grande.",
    includes: [
      `Más de ${MAX_SELF_SERVE_PROPERTIES} alojamientos`,
      "Todo lo de Plus",
      "Precio por volumen en guías y piezas 3D",
      "Configuración a la medida de tu cartera",
    ],
  },
] as const;

/** Precio por pieza según la cantidad. Más allá del último tramo se cotiza. */
export const PIECE_TIERS = [
  { min: 1, max: 2, unit: 35 },
  { min: 3, max: 5, unit: 31 },
  { min: 6, max: 10, unit: 28 },
] as const;

export const MAX_PIECES_ONLINE = PIECE_TIERS[PIECE_TIERS.length - 1].max;

/** Extra recomendado: pago único, se suma al plan elegido. */
export const WELCOME_PIECE = {
  name: "Pieza de bienvenida 3D",
  /** Para usar a mitad de frase ("Agregar pieza de bienvenida 3D"). */
  inlineName: "pieza de bienvenida 3D",
  description:
    "Pieza personalizada impresa en 3D con el código QR de tu guía. Pago único.",
} as const;

export function getPlan(id: string | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Precio unitario de la pieza para una cantidad, o `null` si se cotiza (o es 0). */
export function pieceUnitPrice(quantity: number): number | null {
  const tier = PIECE_TIERS.find((t) => quantity >= t.min && quantity <= t.max);
  return tier ? tier.unit : null;
}

/** Total de las piezas, o `null` si la cantidad se cotiza. 0 piezas = 0. */
export function piecesTotal(quantity: number): number | null {
  if (quantity <= 0) return 0;
  const unit = pieceUnitPrice(quantity);
  return unit === null ? null : unit * quantity;
}

/** Lo que se paga el primer año: plan anual más las piezas. `null` si algo se cotiza. */
export function firstYearTotal(plan: Plan, pieces: number): number | null {
  const piecesCost = piecesTotal(pieces);
  if (plan.price === null || piecesCost === null) return null;
  return plan.price + piecesCost;
}

export function formatUsd(amount: number): string {
  return `$${new Intl.NumberFormat("en-US").format(amount)}`;
}
