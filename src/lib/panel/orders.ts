export const ORDER_STATUSES = [
  "solicitado",
  "en_produccion",
  "enviado",
  "entregado",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  solicitado: "Solicitado",
  en_produccion: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
};

export function orderStatusLabel(status: string): string {
  return (ORDER_STATUS_LABELS as Record<string, string>)[status] ?? status;
}
