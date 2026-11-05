import { Suspense } from "react";

import { AssignForm } from "@/components/admin/AssignForm";
import { InviteForm } from "@/components/admin/InviteForm";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { AdminNotice } from "@/components/admin/ui";
import { removeMember } from "@/app/(site)/admin/usuarios/actions";
import { memberRoleLabel } from "@/lib/admin/labels";
import { createClient } from "@/lib/supabase/server";

function codeOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Users({
  searchParams,
}: {
  searchParams: PageProps<"/admin/usuarios">["searchParams"];
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: profiles }, { data: businesses }, { data: members }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .order("email"),
      supabase.from("businesses").select("id, name").order("name"),
      supabase.from("business_members").select("business_id, user_id, role"),
    ]);

  const businessName = new Map(
    (businesses ?? []).map((business) => [business.id, business.name]),
  );

  return (
    <>
      <AdminNotice code={codeOf(query.aviso)} />
      <section className="border-cream-dark space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-2xl">Invitar</h2>
        <p className="text-ink-soft text-sm">
          La invitación llega por correo. La cuenta queda como cliente; luego le
          asignas un negocio.
        </p>
        <InviteForm />
      </section>
      <section className="border-cream-dark space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-2xl">Asignar un negocio</h2>
        <AssignForm
          users={(profiles ?? []).map((profile) => ({
            id: profile.id,
            label: `${profile.full_name || "Sin nombre"} · ${profile.email ?? ""}`,
          }))}
          businesses={(businesses ?? []).map((business) => ({
            id: business.id,
            label: business.name,
          }))}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl">Cuentas</h2>
        <ul className="space-y-3">
          {(profiles ?? []).map((profile) => {
            const access = (members ?? []).filter(
              (member) => member.user_id === profile.id,
            );
            return (
              <li
                key={profile.id}
                className="border-cream-dark rounded-2xl border bg-white p-4"
              >
                <p className="font-medium">
                  {profile.full_name || "Sin nombre"}
                </p>
                <p className="text-ink-soft text-sm">
                  {profile.email} ·{" "}
                  {profile.role === "admin" ? "Administración" : "Cliente"}
                </p>
                {access.length === 0 ? (
                  <p className="text-ink-soft mt-2 text-sm">
                    Sin negocios asignados.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {access.map((member) => (
                      <li
                        key={`${member.business_id}-${member.user_id}`}
                        className="flex flex-wrap items-center justify-between gap-3 text-sm"
                      >
                        <span>
                          {businessName.get(member.business_id) ?? "Negocio"} ·{" "}
                          {memberRoleLabel(member.role)}
                        </span>
                        <form action={removeMember}>
                          <input
                            type="hidden"
                            name="businessId"
                            value={member.business_id}
                          />
                          <input
                            type="hidden"
                            name="userId"
                            value={member.user_id}
                          />
                          <input
                            type="hidden"
                            name="returnTo"
                            value="/admin/usuarios"
                          />
                          <SubmitButton variant="secondary">
                            Quitar
                          </SubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

export default function UsersPage({
  searchParams,
}: PageProps<"/admin/usuarios">) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-3xl">Usuarios</h1>
      <Suspense fallback={<p className="text-ink-soft">Cargando...</p>}>
        <Users searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
