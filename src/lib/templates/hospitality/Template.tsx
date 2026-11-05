import { whatsappHref } from "../common";
import { ActionLink, Card, PlainText, TemplateFrame } from "../ui";

import type { HospitalityContent } from "./schema";

export function HospitalityTemplate({
  name,
  content: c,
}: {
  name: string;
  content: HospitalityContent;
}) {
  const wifiShown = c.wifi.enabled && (c.wifi.network || c.wifi.password);
  const stayShown =
    c.stay.enabled && (c.stay.check_in || c.stay.check_out || c.stay.notes);
  const whatsappShown = c.whatsapp.enabled && c.whatsapp.phone;

  return (
    <TemplateFrame name={name} tagline={c.tagline} theme={c.theme}>
      {whatsappShown ? (
        <ActionLink href={whatsappHref(c.whatsapp.phone, c.whatsapp.message)}>
          {c.whatsapp.label || "Escribir por WhatsApp"}
        </ActionLink>
      ) : null}

      {c.welcome.enabled && c.welcome.message ? (
        <Card title={c.welcome.title || undefined}>
          <PlainText>{c.welcome.message}</PlainText>
        </Card>
      ) : null}

      {wifiShown ? (
        <Card title="Wi-Fi">
          <dl className="space-y-2">
            {c.wifi.network ? (
              <div>
                <dt className="text-ink-soft text-xs tracking-wide uppercase">
                  Red
                </dt>
                <dd className="text-lg font-medium">{c.wifi.network}</dd>
              </div>
            ) : null}
            {c.wifi.password ? (
              <div>
                <dt className="text-ink-soft text-xs tracking-wide uppercase">
                  Contraseña
                </dt>
                <dd className="font-mono text-lg break-all select-all">
                  {c.wifi.password}
                </dd>
              </div>
            ) : null}
          </dl>
          {c.wifi.notes ? (
            <p className="text-ink-soft mt-3 text-sm whitespace-pre-line">
              {c.wifi.notes}
            </p>
          ) : null}
        </Card>
      ) : null}

      {stayShown ? (
        <Card title="Tu estadía">
          <dl className="grid grid-cols-2 gap-4">
            {c.stay.check_in ? (
              <div>
                <dt className="text-ink-soft text-xs tracking-wide uppercase">
                  Check-in
                </dt>
                <dd className="font-medium">{c.stay.check_in}</dd>
              </div>
            ) : null}
            {c.stay.check_out ? (
              <div>
                <dt className="text-ink-soft text-xs tracking-wide uppercase">
                  Check-out
                </dt>
                <dd className="font-medium">{c.stay.check_out}</dd>
              </div>
            ) : null}
          </dl>
          {c.stay.notes ? (
            <p className="text-ink-soft mt-3 text-sm whitespace-pre-line">
              {c.stay.notes}
            </p>
          ) : null}
        </Card>
      ) : null}

      {c.rules.enabled && c.rules.items.length > 0 ? (
        <Card title="Reglas de la casa">
          <ul className="list-disc space-y-1.5 pl-5">
            {c.rules.items.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {c.amenities.enabled && c.amenities.items.length > 0 ? (
        <Card title="Servicios">
          <ul className="space-y-3">
            {c.amenities.items.map((item, i) => (
              <li key={i}>
                <p className="font-medium">{item.label}</p>
                {item.detail ? (
                  <p className="text-ink-soft text-sm">{item.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {c.recommendations.enabled && c.recommendations.items.length > 0 ? (
        <Card title="Recomendaciones">
          <ul className="divide-y divide-black/5">
            {c.recommendations.items.map((item, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                {item.category ? (
                  <p className="text-sand-dark text-xs font-medium tracking-wide uppercase">
                    {item.category}
                  </p>
                ) : null}
                <p className="font-medium">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {item.name}
                    </a>
                  ) : (
                    item.name
                  )}
                </p>
                {item.description ? (
                  <p className="text-ink-soft text-sm">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </TemplateFrame>
  );
}
