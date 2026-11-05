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

let { data: biz } = await supabase.from("businesses").select("id").eq("slug", "casa-brisa").maybeSingle();
if (!biz) {
  const { data, error } = await supabase
    .from("businesses")
    .insert({ name: "Casa Brisa", slug: "casa-brisa", category: "hospedaje" })
    .select("id")
    .single();
  if (error) throw error;
  biz = data;
  await supabase.from("pages").insert({ business_id: biz.id, template_key: "hospitality" });
  await supabase.from("qr_codes").insert({ business_id: biz.id, destination_path: "/negocio/casa-brisa" });
}
await supabase.from("business_members").upsert({ business_id: biz.id, user_id: clientId, role: "owner" });

console.log("Seeded: admin@emblematico.test (admin), cliente@emblematico.test (client, Casa Brisa)");
