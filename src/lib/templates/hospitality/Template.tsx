import { telHref, whatsappHref } from "../common";
import { CopyButton } from "../CopyButton";
import { displayTime } from "../time";
import { T, isDefaultWelcome, isDefaultWhatsapp } from "../i18n";
import { ActionLink, Card, PlainText, TemplateFrame } from "../ui";

import { HostText } from "./HostText";
import type { HospitalityContent } from "./schema";

export function HospitalityTemplate({
  name,
  content: c,
  branding = true,
  reportHref,
}: {
  name: string;
  content: HospitalityContent;
  branding?: boolean;
  reportHref?: string;
}) {
  const wifiShown = c.wifi.enabled && (c.wifi.network || c.wifi.password);
  const stayShown =
    c.stay.enabled && (c.stay.check_in || c.stay.check_out || c.stay.notes);
  const whatsappShown = c.whatsapp.enabled && c.whatsapp.phone;
  /** The host's text in every language (see HostText). */
  const h = (path: string, original: string) => (
    <HostText
      path={path}
      original={original}
      language={c.language}
      translations={c.translations}
    />
  );

  const linkClass = "underline underline-offset-4";

  /** List of places (tours, wellness, shopping, parking). */
  const places = (
    key: "tours" | "wellness" | "shopping" | "parking",
    items: HospitalityContent["tours"]["items"],
  ) => (
    <ul className="divide-y divide-black/5">
      {items.map((item, i) => (
        <li key={i} className="py-3 first:pt-0 last:pb-0">
          {item.category ? (
            <p className="text-sand-dark text-xs font-medium tracking-wide uppercase">
              {h(`${key}.items.${i}.category`, item.category)}
            </p>
          ) : null}
          <p className="font-medium">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {h(`${key}.items.${i}.name`, item.name)}
              </a>
            ) : (
              h(`${key}.items.${i}.name`, item.name)
            )}
          </p>
          {item.description ? (
            <p className="text-ink-soft text-sm">
              {h(`${key}.items.${i}.description`, item.description)}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );

  /** List of contacts (emergency numbers, taxi companies). */
  const contacts = (
    key: "emergency" | "taxi",
    items: HospitalityContent["emergency"]["items"],
  ) => (
    <ul className="divide-y divide-black/5">
      {items.map((item, i) => (
        <li key={i} className="space-y-1 py-3 first:pt-0 last:pb-0">
          <p className="font-medium">{h(`${key}.items.${i}.name`, item.name)}</p>
          {item.detail ? (
            <p className="text-ink-soft text-sm">
              {h(`${key}.items.${i}.detail`, item.detail)}
            </p>
          ) : null}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {item.phone ? (
              <a href={telHref(item.phone)} className={linkClass}>
                <T k="call" /> {item.phone}
              </a>
            ) : null}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <T k="openLink" />
              </a>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  );

  return (
    <TemplateFrame
      name={name}
      tagline={c.tagline ? h("tagline", c.tagline) : ""}
      theme={c.theme}
      language={c.language}
      switcher
      branding={branding}
      reportHref={reportHref}
    >
      {whatsappShown ? (
        <ActionLink href={whatsappHref(c.whatsapp.phone, c.whatsapp.message)}>
          {isDefaultWhatsapp(c.whatsapp.label) ? (
            <T k="whatsapp" />
          ) : (
            h("whatsapp.label", c.whatsapp.label)
          )}
        </ActionLink>
      ) : null}

      {c.welcome.enabled && c.welcome.message ? (
        <Card
          icon="welcome"
          title={
            isDefaultWelcome(c.welcome.title) ? (
              <T k="welcome" />
            ) : (
              h("welcome.title", c.welcome.title)
            )
          }
          collapsible
          defaultOpen
        >
          <PlainText>{h("welcome.message", c.welcome.message)}</PlainText>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 items-stretch gap-3 [&>*:last-child:nth-child(odd)]:col-span-2">
      {wifiShown ? (
        <Card icon="wifi" title={<T k="wifi" />} collapsible>
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
              {h("wifi.notes", c.wifi.notes)}
            </p>
          ) : null}
        </Card>
      ) : null}

      {stayShown ? (
        <Card icon="stay" title={<T k="stay" />} collapsible>
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
              {h("stay.notes", c.stay.notes)}
            </p>
          ) : null}
        </Card>
      ) : null}

      {c.rules.enabled && c.rules.items.length > 0 ? (
        <Card icon="rules" title={<T k="rules" />} collapsible>
          <ul className="list-disc space-y-1.5 pl-5">
            {c.rules.items.map((rule, i) => (
              <li key={i}>{h(`rules.items.${i}`, rule)}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {c.amenities.enabled && c.amenities.items.length > 0 ? (
        <Card icon="amenities" title={<T k="amenities" />} collapsible>
          <ul className="space-y-3">
            {c.amenities.items.map((item, i) => (
              <li key={i}>
                <p className="font-medium">{h(`amenities.items.${i}.label`, item.label)}</p>
                {item.detail ? (
                  <p className="text-ink-soft text-sm">{h(`amenities.items.${i}.detail`, item.detail)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {c.recommendations.enabled && c.recommendations.items.length > 0 ? (
        <Card icon="recommendations" title={<T k="recommendations" />} collapsible>
          <ul className="divide-y divide-black/5">
            {c.recommendations.items.map((item, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                {item.category ? (
                  <p className="text-sand-dark text-xs font-medium tracking-wide uppercase">
                    {h(`recommendations.items.${i}.category`, item.category)}
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
                      {h(`recommendations.items.${i}.name`, item.name)}
                    </a>
                  ) : (
                    h(`recommendations.items.${i}.name`, item.name)
                  )}
                </p>
                {item.description ? (
                  <p className="text-ink-soft text-sm">{h(`recommendations.items.${i}.description`, item.description)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {c.tours.enabled && c.tours.items.length > 0 ? (
        <Card icon="tours" title={<T k="tours" />} collapsible>
          {places("tours", c.tours.items)}
        </Card>
      ) : null}

      {c.wellness.enabled && c.wellness.items.length > 0 ? (
        <Card icon="wellness" title={<T k="wellness" />} collapsible>
          {places("wellness", c.wellness.items)}
        </Card>
      ) : null}

      {c.shopping.enabled && c.shopping.items.length > 0 ? (
        <Card icon="shopping" title={<T k="shopping" />} collapsible>
          {places("shopping", c.shopping.items)}
        </Card>
      ) : null}

      {c.emergency.enabled && c.emergency.items.length > 0 ? (
        <Card icon="emergency" title={<T k="emergency" />} collapsible>
          {contacts("emergency", c.emergency.items)}
        </Card>
      ) : null}

      {c.cleaning.enabled && c.cleaning.message ? (
        <Card icon="cleaning" title={<T k="cleaning" />} collapsible>
          <PlainText>{h("cleaning.message", c.cleaning.message)}</PlainText>
        </Card>
      ) : null}

      {c.minibar.enabled && c.minibar.items.length > 0 ? (
        <Card icon="minibar" title={<T k="minibar" />} collapsible>
          <ul className="divide-y divide-black/5">
            {c.minibar.items.map((item, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span className="min-w-0">
                  <span className="block font-medium">
                    {h(`minibar.items.${i}.name`, item.name)}
                  </span>
                  {item.detail ? (
                    <span className="text-ink-soft block text-sm">
                      {h(`minibar.items.${i}.detail`, item.detail)}
                    </span>
                  ) : null}
                </span>
                {item.price ? (
                  <span className="shrink-0 font-semibold">{item.price}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {c.taxi.enabled && c.taxi.items.length > 0 ? (
        <Card icon="taxi" title={<T k="taxi" />} collapsible>
          {contacts("taxi", c.taxi.items)}
        </Card>
      ) : null}

      {c.parking.enabled && c.parking.items.length > 0 ? (
        <Card icon="parking" title={<T k="parking" />} collapsible>
          {places("parking", c.parking.items)}
        </Card>
      ) : null}

      {c.faq.enabled && c.faq.items.length > 0 ? (
        <Card icon="faq" title={<T k="faq" />} collapsible>
          <dl className="space-y-4">
            {c.faq.items.map((item, i) => (
              <div key={i}>
                <dt className="font-medium">
                  {h(`faq.items.${i}.question`, item.question)}
                </dt>
                {item.answer ? (
                  <dd className="text-ink-soft mt-1 text-sm whitespace-pre-line">
                    {h(`faq.items.${i}.answer`, item.answer)}
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        </Card>
      ) : null}
      </div>
    </TemplateFrame>
  );
}
