/** Slugs the database rejects for businesses (businesses_slug_not_reserved). */
export const RESERVED_BUSINESS_SLUGS = [
  "admin",
  "panel",
  "api",
  "www",
  "negocio",
  "login",
  "ingresar",
  "auth",
  "productos",
  "contacto",
  "nosotros",
  "test",
  "demo-admin",
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type SlugRules = {
  reserved?: readonly string[];
  minLength?: number;
  maxLength?: number;
};

const BUSINESS_RULES: Required<SlugRules> = {
  reserved: RESERVED_BUSINESS_SLUGS,
  minLength: 3,
  maxLength: 60,
};

/** Lowercase ASCII slug. Accents are stripped (ñ → n, á → a). */
export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function slugError(
  slug: string,
  rules: SlugRules = BUSINESS_RULES,
): string | null {
  const minLength = rules.minLength ?? 3;
  const maxLength = rules.maxLength ?? 60;
  if (
    slug.length < minLength ||
    slug.length > maxLength ||
    !SLUG_PATTERN.test(slug)
  ) {
    return `Usa de ${minLength} a ${maxLength} caracteres: minúsculas, números y guiones.`;
  }
  if (rules.reserved?.includes(slug)) return "Ese slug está reservado.";
  return null;
}

function withSuffix(root: string, n: number, maxLength: number): string {
  const suffix = `-${n}`;
  const head = root.slice(0, maxLength - suffix.length).replace(/-+$/g, "");
  if (!head) return "";
  return `${head}${suffix}`;
}

/**
 * First slug derived from `name` that passes `rules` and is not in `taken`.
 * `taken` must already include current slugs and slugs retired by other businesses.
 */
export function uniqueSlug(
  name: string,
  taken: ReadonlySet<string>,
  rules: SlugRules = BUSINESS_RULES,
): string | null {
  const root = slugifyName(name);
  if (!root) return null;
  const maxLength = rules.maxLength ?? 60;

  for (let n = 1; n <= 50; n += 1) {
    const candidate =
      n === 1
        ? root.slice(0, maxLength).replace(/-+$/g, "")
        : withSuffix(root, n, maxLength);
    if (!candidate) continue;
    if (slugError(candidate, rules)) continue;
    if (taken.has(candidate)) continue;
    return candidate;
  }
  return null;
}
