// Local dev only: creates an admin and a client (magic-link login via Mailpit
// at http://127.0.0.1:54324). Refuses to run against non-local Supabase.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing (load .env.local)");
if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
  throw new Error(`Refusing to seed non-local Supabase: ${url}`);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function ensureUser(email, fullName) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users.find((u) => u.email === email);
  if (existing) return existing.id;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

const adminId = await ensureUser("admin@emblematico.test", "Admin emblemático");
const clientId = await ensureUser("cliente@emblematico.test", "Cliente Demo");

await supabase.from("profiles").update({ role: "admin" }).eq("id", adminId);

const casaBrisaContent = {
  schema_version: 1,
  theme: { accent: "#C9AC87" },
  tagline: "Tu refugio frente al volcán",
  welcome: {
    enabled: true,
    title: "Bienvenido a Casa Brisa",
    message:
      "Nos alegra tenerte aquí.\nEsta página reúne todo lo que necesitas durante tu estadía.",
  },
  wifi: { enabled: true, network: "CasaBrisa_Guest", password: "brisa2026", notes: "El router está en la sala." },
  stay: { enabled: true, check_in: "3:00 p. m.", check_out: "11:00 a. m.", notes: "Si necesitas salida tardía, escríbenos." },
  rules: { enabled: true, items: ["No fumar dentro de la casa.", "Silencio después de las 10:00 p. m.", "Cuida el agua y la energía."] },
  amenities: {
    enabled: true,
    items: [
      { label: "Cocina equipada", detail: "Café y té de cortesía." },
      { label: "Parqueo privado", detail: "" },
    ],
  },
  recommendations: {
    enabled: true,
    items: [
      { name: "Soda La Fortuna", category: "Comer", description: "Casado típico, a 5 minutos.", url: "https://example.com/soda" },
      { name: "Aguas termales", category: "Actividades", description: "Reserva con anticipación.", url: "" },
    ],
  },
  whatsapp: { enabled: true, phone: "50688997060", message: "Hola, estoy hospedado en Casa Brisa y necesito ayuda.", label: "Escribir al anfitrión" },
};

const cafeAuroraContent = {
  schema_version: 1,
  theme: { accent: "#1F1F1F" },
  tagline: "Café de especialidad en el centro",
  cta: { enabled: true, label: "Reservar mesa", url: "https://example.com/reservas" },
  description: { enabled: true, title: "Sobre nosotros", body: "Tostamos café de fincas costarricenses cada semana.\nVen a probar nuestra preparación del día." },
  location: { enabled: true, address: "Avenida Central, San José", hours: "Lun a Vie: 7:00 a. m. - 6:00 p. m.\nSáb: 8:00 a. m. - 2:00 p. m.", maps_url: "https://maps.google.com/?q=San+Jose+Costa+Rica" },
  menu: { enabled: true, label: "Ver menú", url: "https://example.com/menu" },
  reviews: { enabled: true, url: "https://example.com/resenas" },
  social: { enabled: true, links: [{ label: "Instagram", url: "https://instagram.com/cafeaurora" }] },
  whatsapp: { enabled: true, phone: "50688997060", message: "Hola, quisiera hacer una consulta.", label: "Escribir por WhatsApp" },
};

async function ensureBusiness({ name, slug, category, template, content, memberId }) {
  let { data: biz } = await supabase.from("businesses").select("id").eq("slug", slug).maybeSingle();
  if (!biz) {
    const { data, error } = await supabase.from("businesses").insert({ name, slug, category }).select("id").single();
    if (error) throw error;
    biz = data;
    const { error: pageError } = await supabase.from("pages").insert({ business_id: biz.id, template_key: template });
    if (pageError) throw pageError;
    await supabase.from("qr_codes").insert({ business_id: biz.id, destination_path: `/negocio/${slug}` });
  }
  // Seed draft + published content (service_role may write protected fields).
  const { error } = await supabase
    .from("pages")
    .update({ draft_content: content, published_content: content, status: "published", published_at: new Date().toISOString() })
    .eq("business_id", biz.id);
  if (error) throw error;
  if (memberId) await supabase.from("business_members").upsert({ business_id: biz.id, user_id: memberId, role: "owner" });
}

await ensureBusiness({ name: "Casa Brisa", slug: "casa-brisa", category: "hospedaje", template: "hospitality", content: casaBrisaContent, memberId: clientId });
await ensureBusiness({ name: "Café Aurora", slug: "cafe-aurora", category: "restaurante", template: "general", content: cafeAuroraContent });

console.log("Seeded: admin@emblematico.test (admin), cliente@emblematico.test (client, Casa Brisa); published: casa-brisa, cafe-aurora");
