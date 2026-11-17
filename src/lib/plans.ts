/**
 * Planes digitales (cobro anual o mensual, en dólares) y la pieza de bienvenida 3D como extra
 * de pago único con precio por cantidad. Todo es configurable aquí.
 * Pon `SHOW_PRICES` en false para ocultar los montos de pago (se muestra "Cotiza").
 */
export const SHOW_PRICES = true;

export const CURRENCY_NOTE =
  "Precios en dólares (USD). También aceptamos SINPE Móvil en colones al tipo de cambio del día.";

export const PLAN_IDS = ["free", "essential", "plus", "managers"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** Periodo de cobro. El anual es el que se muestra por defecto. */
export const BILLING_PERIODS = ["annual", "monthly"] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];
export const DEFAULT_BILLING: BillingPeriod = "annual";
export const BILLING_LABELS: Record<BillingPeriod, string> = {
  annual: "Anual",
  monthly: "Mensual",
};

export function parseBilling(
  value: string | undefined,
): BillingPeriod | undefined {
  if (value === "mensual") return "monthly";
  if (value === "anual") return "annual";
  return BILLING_PERIODS.find((b) => b === value);
}

/** Un punto de la lista del plan; con `items` se muestra como desplegable. */
export type PlanFeature = string | { label: string; items: readonly string[] };

export function featureLabel(feature: PlanFeature): string {
  return typeof feature === "string" ? feature : feature.label;
}

export type Plan = {
  id: PlanId;
  name: string;
  /** Precio anual en USD (solo la parte digital). `null` = se cotiza. */
  price: number | null;
  /** Precio mensual en USD. Solo los planes de pago que se pueden cobrar por mes. */
  monthlyPrice?: number;
  /** Alojamientos incluidos. `null` = a la medida. */
  properties: number | null;
  /** Precio anual en USD por cada alojamiento adicional. */
  extraProperty?: number;
  /** Igual, pero por mes cuando se cobra mensual. */
  extraPropertyMonthly?: number;
  /** Máximo de alojamientos en total sumando adicionales. Sin valor = sin límite. */
  maxProperties?: number;
  /** La guía se publica sin "Página creada con emblemático". */
  removesBranding?: boolean;
  summary: string;
  includes: readonly PlanFeature[];
  highlighted?: boolean;
};

/** Alojamientos incluidos en Plus (y tope de Essential con adicionales). */
export const MAX_SELF_SERVE_PROPERTIES = 7;

/** Essential puede sumar alojamientos adicionales hasta esta cantidad. */
export const ESSENTIAL_MAX_PROPERTIES = MAX_SELF_SERVE_PROPERTIES;

/** El plan para administradores se anuncia para más de esta cantidad de alojamientos. */
export const MANAGERS_MIN_PROPERTIES = 10;

/** Precio de cada alojamiento adicional (Essential hasta 7 en total; Plus sin límite). */
export const EXTRA_PROPERTY_YEARLY = 15;
export const EXTRA_PROPERTY_MONTHLY = 1.5;

/** Los 5 servicios estándar que trae cualquier guía. */
export const BASIC_SERVICES = [
  "Wi-Fi",
  "Contacto",
  "Información de la casa",
  "Check-out",
  "Normas de la casa",
] as const;

/** Los 15 servicios estándar de Essential y Plus (incluye los 5 básicos). */
export const STANDARD_SERVICES = [
  ...BASIC_SERVICES,
  "Restaurantes recomendados",
  "Tours recomendados",
  "Bienestar y gimnasio: spa, bienestar y gimnasios cercanos",
  "Compras y servicios: supermercados, farmacias y licorerías cercanas",
  "Emergencias: números de emergencia y hospitales más cercanos",
  "Limpieza: información sobre la limpieza para los huéspedes",
  "Minibar y precios",
  "Taxi: compañías de taxi con teléfonos y enlaces",
  "Parqueos cercanos",
  "Preguntas frecuentes",
] as const;

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Hospitality Free",
    price: 0,
    properties: 1,
    summary: "Para probar la guía en un solo alojamiento.",
    includes: [
      "1 alojamiento",
      "Tu idioma original, sin traducciones",
      `Cinco servicios estándar: ${BASIC_SERVICES.join(", ")}`,
      "Código QR permanente",
      "Alojamiento web (hosting) incluido",
      "Pequeña nota al final de la guía: «Creado con emblemático»",
    ],
  },
  {
    id: "essential",
    removesBranding: true,
    name: "Hospitality Essential",
    price: 49,
    monthlyPrice: 6,
    properties: 3,
    extraProperty: EXTRA_PROPERTY_YEARLY,
    extraPropertyMonthly: EXTRA_PROPERTY_MONTHLY,
    maxProperties: ESSENTIAL_MAX_PROPERTIES,
    summary: "Lo necesario para dar una bienvenida clara y ordenada.",
    includes: [
      "Hasta 3 alojamientos",
      "Hasta 3 idiomas de traducción",
      {
        label: `Incluye los ${STANDARD_SERVICES.length} servicios estándar`,
        items: STANDARD_SERVICES,
      },
      "Sin marca de emblemático",
      "Servicios propios",
      "Estadísticas de la guía: aperturas, visitas y acciones",
      {
        label: "Reseñas y opiniones, para mejorar tus calificaciones",
        items: [
          "Ventana «Deja una reseña»",
          "Recogida automática de reseñas de Google",
        ],
      },
      "Soporte por email",
    ],
  },
  {
    id: "plus",
    removesBranding: true,
    name: "Hospitality Plus",
    price: 99,
    monthlyPrice: 12,
    properties: MAX_SELF_SERVE_PROPERTIES,
    extraProperty: EXTRA_PROPERTY_YEARLY,
    extraPropertyMonthly: EXTRA_PROPERTY_MONTHLY,
    summary: "Para propiedades que quieren ofrecer más a sus huéspedes.",
    includes: [
      "Todo lo de Essential, más:",
      `Hasta ${MAX_SELF_SERVE_PROPERTIES} alojamientos`,
      "Onboarding personalizado: te ayudamos a montar las guías y el sistema",
      "Soporte con respuesta más rápida por WhatsApp",
    ],
  },
  {
    id: "managers",
    removesBranding: true,
    name: "Plan para administradores",
    price: null,
    properties: null,
    summary: "Para administradores de propiedades con una cartera grande.",
    includes: [
      `Más de ${MANAGERS_MIN_PROPERTIES} alojamientos`,
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

/** Lo que se ahorra al año pagando anual en vez de 12 meses. `null` si no aplica. */
export function annualSavings(plan: Plan): number | null {
  if (!plan.price || !plan.monthlyPrice) return null;
  return plan.monthlyPrice * 12 - plan.price;
}

/** Ahorro anual como porcentaje entero (el mayor de los planes), para la etiqueta del selector. */
export function maxAnnualSavingsPercent(): number {
  return Math.max(
    0,
    ...PLANS.map((p) => {
      const saved = annualSavings(p);
      return saved && p.monthlyPrice
        ? Math.round((saved / (p.monthlyPrice * 12)) * 100)
        : 0;
    }),
  );
}

/** Primer cobro: un mes (o el año) del plan más las piezas. `null` si algo se cotiza. */
export function firstChargeTotal(
  plan: Plan,
  pieces: number,
  billing: BillingPeriod,
): number | null {
  if (billing === "annual" || plan.monthlyPrice === undefined)
    return firstYearTotal(plan, pieces);
  const piecesCost = piecesTotal(pieces);
  return piecesCost === null ? null : plan.monthlyPrice + piecesCost;
}

export function formatUsd(amount: number): string {
  return `$${new Intl.NumberFormat("en-US").format(amount)}`;
}
