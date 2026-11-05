import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AssignForm } from "@/components/admin/AssignForm";
import { BusinessForm } from "@/components/admin/BusinessForm";
import { CopyUrl } from "@/components/admin/CopyUrl";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { AdminNotice, secondaryButtonClass } from "@/components/admin/ui";
import {
  publishBusiness,
  setBusinessStatus,
  unpublishBusiness,
} from "@/app/(site)/admin/negocios/actions";
import { removeMember } from "@/app/(site)/admin/usuarios/actions";
import {
  businessStatusLabel,
  memberRoleLabel,
  pageStatusLabel,
} from "@/lib/admin/labels";
import { isServiceExpired } from "@/lib/admin/schemas";
import { businessPublicUrl } from "@/lib/qr/render";
import { createClient } from "@/lib/supabase/server";
import { parsePageContent } from "@/lib/templates/registry";

function codeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function BusinessDetail({
  id,
  searchParams,
}: {
  id: string;
  searchParams: PageProps<"/admin/negocios/[id]">["searchParams"];
}) {
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, category, status, service_plan, service_expires_at, indexable",
    )
    .eq("id", id)
    .maybeSingle();
  if (!business) notFound();

  const [{ data: page }, { data: members }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("pages")
        .select("template_key, status, draft_content")
        .eq("business_id", business.id)
        .maybeSingle(),
      supabase
        .from("business_members")
        .select("user_id, role")
        .eq("business_id", business.id),
      supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name"),
    ]);
  if (!page) notFound();

  const names = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.full_name || profile.email || "Sin nombre",
    ]),
  );
  const publicUrl = businessPublicUrl(business.slug);
  const draftOk =
    parsePageContent(page.template_key, page.draft_content) !== null;
  const expired = isServiceExpired(business.service_expires_at);

  return (
    <>
      <AdminNotice code={codeOf(query.aviso)} />
      <header className="space-y-2">
        <h1 className="text-3xl">{business.name}</h1>
        <p className="text-ink-soft text-sm">
          {businessStatusLabel(business.status)} ·{" "}
          {pageStatusLabel(page.status)}
          {expired ? " · Servicio vencido" : ""}
        </p>
      </header>

      <section className="border-cream-dark space-y-3 rounded-2xl border bg-white p-5">
        <h2 className="text-2xl">Dirección pública</h2>
        <CopyUrl url={publicUrl} />
        <div className="flex flex-wrap gap-3">
          <a
            href={`/negocio/${business.slug}`}
            className={secondaryButtonClass}
          >
            Ver página
          </a>
          <a
            href={`/api/qr/${business.id}?format=svg`}
            className={secondaryButtonClass}
          >
            Descargar QR SVG
          </a>
          <a
            href={`/api/qr/${business.id}?format=png`}
            className={secondaryButtonClass}
          >
            Descargar QR PNG
          </a>
        </div>
      </section>

      <section className="border-cream-dark space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-2xl">Estado</h2>
        <div className="flex flex-wrap gap-3">
          {business.status === "active" && draftOk && (
            <form action={publishBusiness}>
              <input type="hidden" name="businessId" value={business.id} />
              <SubmitButton>Publicar</SubmitButton>
            </form>
          )}
          {page.status === "published" && (
            <form action={unpublishBusiness}>
              <input type="hidden" name="businessId" value={business.id} />
              <SubmitButton variant="secondary">Despublicar</SubmitButton>
            </form>
          )}
          {business.status !== "suspended" && (
            <form action={setBusinessStatus}>
              <input type="hidden" name="businessId" value={business.id} />
              <input type="hidden" name="status" value="suspended" />
              <SubmitButton variant="secondary">Suspender</SubmitButton>
            </form>
          )}
          {business.status !== "archived" && (
            <form action={setBusinessStatus}>
              <input type="hidden" name="businessId" value={business.id} />
              <input type="hidden" name="status" value="archived" />
              <SubmitButton variant="secondary">Archivar</SubmitButton>
            </form>
          )}
          {business.status !== "active" && (
            <form action={setBusinessStatus}>
              <input type="hidden" name="businessId" value={business.id} />
              <input type="hidden" name="status" value="active" />
              <SubmitButton variant="secondary">Reactivar</SubmitButton>
            </form>
          )}
        </div>
        {!draftOk && (
          <p className="text-sm text-red-700">
            El borrador no es válido, así que no se puede publicar.
          </p>
        )}
      </section>

      <section className="border-cream-dark rounded-2xl border bg-white p-5">
        <h2 className="mb-4 text-2xl">Datos</h2>
        <BusinessForm
          business={{
            id: business.id,
            name: business.name,
            slug: business.slug,
            category: business.category ?? "",
            template: page.template_key,
            servicePlan: business.service_plan ?? "",
            serviceExpiresAt: business.service_expires_at,
            indexable: business.indexable,
          }}
        />
      </section>

      <section className="border-cream-dark space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-2xl">Personas con acceso</h2>
        {(members ?? []).length === 0 ? (
          <p className="text-ink-soft">Nadie tiene acceso todavía.</p>
        ) : (
          <ul className="space-y-2">
            {(members ?? []).map((member) => (
              <li
                key={member.user_id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <span>
                  {names.get(member.user_id) ?? "Cuenta sin perfil"} ·{" "}
                  {memberRoleLabel(member.role)}
                </span>
                <form action={removeMember}>
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="userId" value={member.user_id} />
                  <input
                    type="hidden"
                    name="returnTo"
                    value={`/admin/negocios/${business.id}`}
                  />
                  <SubmitButton variant="secondary">Quitar</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <AssignForm
          businessId={business.id}
          users={(profiles ?? []).map((profile) => ({
            id: profile.id,
            label: profile.full_name || profile.email || "Sin nombre",
          }))}
        />
      </section>
      <p>
        <Link
          href="/admin/negocios"
          className="text-sand-dark text-sm underline"
        >
          Volver a negocios
        </Link>
      </p>
    </>
  );
}

export default function BusinessPage({
  params,
  searchParams,
}: PageProps<"/admin/negocios/[id]">) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Detail params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Detail({
  params,
  searchParams,
}: Pick<PageProps<"/admin/negocios/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  return <BusinessDetail id={id} searchParams={searchParams} />;
}
