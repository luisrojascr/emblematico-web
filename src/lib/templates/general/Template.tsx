import { whatsappHref } from "../common";
import { ActionLink, Card, PlainText, TemplateFrame } from "../ui";

import type { GeneralContent } from "./schema";

export function GeneralTemplate({
  name,
  content: c,
}: {
  name: string;
  content: GeneralContent;
}) {
  const ctaShown = c.cta.enabled && c.cta.url && c.cta.label;
  const whatsappShown = c.whatsapp.enabled && c.whatsapp.phone;
  const locationShown =
    c.location.enabled &&
    (c.location.address || c.location.hours || c.location.maps_url);
  const menuShown = c.menu.enabled && c.menu.url;
  const reviewsShown = c.reviews.enabled && c.reviews.url;

  return (
    <TemplateFrame name={name} tagline={c.tagline} theme={c.theme}>
      {ctaShown ? (
        <ActionLink href={c.cta.url} external={!c.cta.url.startsWith("tel:")}>
          {c.cta.label}
        </ActionLink>
      ) : null}
      {whatsappShown ? (
        <ActionLink
          href={whatsappHref(c.whatsapp.phone, c.whatsapp.message)}
          variant={ctaShown ? "outline" : "accent"}
        >
          {c.whatsapp.label || "Escribir por WhatsApp"}
        </ActionLink>
      ) : null}
      {menuShown ? (
        <ActionLink href={c.menu.url} variant="outline">
          {c.menu.label || "Ver menú"}
        </ActionLink>
      ) : null}

      {c.description.enabled && c.description.body ? (
        <Card title={c.description.title || undefined}>
          <PlainText>{c.description.body}</PlainText>
        </Card>
      ) : null}

      {locationShown ? (
        <Card title="Ubicación y horario">
          <div className="space-y-3">
            {c.location.address ? (
              <PlainText>{c.location.address}</PlainText>
            ) : null}
            {c.location.hours ? (
              <p className="text-ink-soft text-sm whitespace-pre-line">
                {c.location.hours}
              </p>
            ) : null}
            {c.location.maps_url ? (
              <a
                href={c.location.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium underline underline-offset-4"
              >
                Cómo llegar
              </a>
            ) : null}
          </div>
        </Card>
      ) : null}

      {reviewsShown ? (
        <ActionLink href={c.reviews.url} variant="outline">
          Déjanos una reseña en Google
        </ActionLink>
      ) : null}

      {c.social.enabled && c.social.links.length > 0 ? (
        <Card title="Síguenos">
          <ul className="flex flex-wrap gap-2">
            {c.social.links.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-ink/20 hover:border-ink inline-block rounded-full border px-4 py-2 text-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </TemplateFrame>
  );
}
