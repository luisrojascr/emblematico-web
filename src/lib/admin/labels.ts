import type { Database } from "@/lib/supabase/database.types";

type BusinessStatus = Database["public"]["Enums"]["business_status"];
type PageStatus = Database["public"]["Enums"]["page_status"];
type QuoteStatus = Database["public"]["Enums"]["quote_status"];
type MemberRole = Database["public"]["Enums"]["member_role"];

export function businessStatusLabel(status: BusinessStatus): string {
  switch (status) {
    case "active":
      return "Activo";
    case "suspended":
      return "Suspendido";
    case "archived":
      return "Archivado";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function pageStatusLabel(status: PageStatus): string {
  switch (status) {
    case "draft":
      return "Borrador";
    case "published":
      return "Publicada";
    case "unpublished":
      return "Despublicada";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function quoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "new":
      return "Nueva";
    case "contacted":
      return "Contactada";
    case "closed":
      return "Cerrada";
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function memberRoleLabel(role: MemberRole): string {
  switch (role) {
    case "owner":
      return "Responsable";
    case "editor":
      return "Editor";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

export const QUOTE_STATUSES = ["new", "contacted", "closed"] as const;
export const MEMBER_ROLES = ["owner", "editor"] as const;
export const TEMPLATE_OPTIONS = [
  { value: "hospitality", label: "Hospedaje" },
  { value: "general", label: "Negocio general" },
] as const;
