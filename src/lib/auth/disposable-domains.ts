/**
 * Well-known disposable email domains. This is a first filter against throwaway
 * signups, not a complete list: the captcha, email verification and the one-account-
 * per-person rule in the database do the rest.
 */
const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "burnermail.io",
  "dispostable.com",
  "discard.email",
  "emailondeck.com",
  "fakeinbox.com",
  "getairmail.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "inboxkitten.com",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "mohmal.com",
  "moakt.com",
  "mytemp.email",
  "sharklasers.com",
  "spam4.me",
  "spamgourmet.com",
  "temp-mail.io",
  "temp-mail.org",
  "tempail.com",
  "tempinbox.com",
  "tempmail.com",
  "tempmailo.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

/** True when the address belongs to a known disposable domain (or a subdomain of one). */
export function isDisposableEmail(email: string): boolean {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (!domain || domain === email.toLowerCase()) return false;
  const parts = domain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE_DOMAINS.has(parts.slice(i).join("."))) return true;
  }
  return false;
}
