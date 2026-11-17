import { whatsappHref } from "../common";
import { CopyButton } from "../CopyButton";
import { displayTime } from "../time";
import { T, isDefaultWelcome, isDefaultWhatsapp } from "../i18n";
import { ActionLink, Card, PlainText, TemplateFrame } from "../ui";

import type { HospitalityContent } from "./schema";

export function HospitalityTemplate({
  name,
  content: c,
  branding = true,
}: {
  name: string;
  content: HospitalityContent;
  branding?: boolean;
}) {
  const wifiShown = c.wifi.enabled && (c.wifi.network || c.wifi.password);
  const stayShown =
    c.stay.enabled && (c.stay.check_in || c.stay.check_out || c.stay.notes);
  const whatsappShown = c.whatsapp.enabled && c.whatsapp.phone;

  return (
    <TemplateFrame
      name={name}
      tagline={c.tagline}
      theme={c.theme}
      language={c.language}
      switcher
      branding={branding}
    >
      {whatsappShown ? (
        <ActionLink href={whatsappHref(c.whatsapp.phone, c.whatsapp.message)}>
          {isDefaultWhatsapp(c.whatsapp.label) ? (
            <T k="whatsapp" />
          ) : (
            c.whatsapp.label
          )}
        </ActionLink>
      ) : null}

      {c.welcome.enabled && c.welcome.message ? (
        <Card
          title={
            isDefaultWelcome(c.welcome.title) ? (
              <T k="welcome" />
            ) : (
              c.welcome.title
            )
          }
          collapsible
          defaultOpen
        >
          <PlainText>{c.welcome.message}</PlainText>
        </Card>
      ) : null}

      {wifiShown ? (
        <Card title={<T k="wifi" />} collapsible>
          <dl className="space-y-2">
            {c.wifi.network ? (
              <div>
                <dt className="text-ink-soft text-xs tracking-wide uppercase">
                  <T k="network" />
                </dt>
                <dd className="text-lg font-medium whitespace-pre-wrap">
                  {c.wifi.network}
                </dd>
              </div>
            ) : null}
            {c.wifi.password ? (
              <div>
                <dt className="text-ink-soft text-xs tracking-wide uppercase">
                  <T k="password" />
                </dt>
                <dd className="flex items-center justify-between gap-3">
                  <span className="font-mono text-lg break-all whitespace-pre-wrap select-all">
                    {c.wifi.password}
                  </span>
                  <CopyButton value={c.wifi.password} />
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
        <Card title={<T k="stay" />} collapsible>
          <dl className="grid grid-cols-2 gap-4">
            {c.stay.check_in ? (
              <div>
                <dt className="text-ink-soft text-xs tracking-wide uppercase">
                  <T k="checkIn" />
                </dt>
                <dd className="font-medium">{displayTime(c.stay.check_in)}</dd>
              </div>
            ) : null}
            {c.stay.check_out ? (
              <div>
                <dt className="text-ink-soft text-xs tracking-wide uppercase">
                  <T k="checkOut" />
                </dt>
                <dd className="font-medium">{displayTime(c.stay.check_out)}</dd>
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
        <Card title={<T k="rules" />} collapsible>
          <ul className="list-disc space-y-1.5 pl-5">
            {c.rules.items.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {c.amenities.enabled && c.amenities.items.length > 0 ? (
        <Card title={<T k="amenities" />} collapsible>
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
        <Card title={<T k="recommendations" />} collapsible>
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
