import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

/** Password of the seeded dev accounts (scripts/seed-dev-users.mjs). Local only. */
export const DEV_PASSWORD = process.env.E2E_PASSWORD ?? "emblematico-dev-1";

type MailpitList = {
  messages?: {
    ID: string;
    Created: string;
    To?: { Address?: string }[];
  }[];
};

type MailpitMessage = {
  HTML?: string;
  Text?: string;
};

function linkFrom(body: string): string | null {
  const match = body.match(/https?:\/\/[^\s"'<>]+/);
  if (!match) return null;
  return match[0].replace(/&amp;/g, "&").replace(/[).,]+$/, "");
}

/** First link in the newest email to `email` sent after `sentAt`. Needs local Mailpit. */
export async function emailLink(
  email: string,
  sentAt: number,
): Promise<string> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const list = (await fetch(`${MAILPIT}/api/v1/messages`).then((response) =>
      response.json(),
    )) as MailpitList;
    const hit = (list.messages ?? []).find((message) => {
      const to = (message.To ?? []).some(
        (recipient) => recipient.Address?.toLowerCase() === email,
      );
      return to && new Date(message.Created).getTime() >= sentAt - 2_000;
    });
    if (hit) {
      const message = (await fetch(`${MAILPIT}/api/v1/message/${hit.ID}`).then(
        (response) => response.json(),
      )) as MailpitMessage;
      const link = linkFrom(`${message.HTML ?? ""}\n${message.Text ?? ""}`);
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(
    `No email link for ${email}. Is Mailpit running at ${MAILPIT}?`,
  );
}

/**
 * Signs a seeded account in with its password. Tests in different files and workers
 * share these accounts, and a password, unlike a one-use magic link, can be used by
 * several of them at the same time.
 */
export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(DEV_PASSWORD);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/ingresar"));
}

/**
 * Requests a magic link and opens it in this page. Needs local Mailpit. Only for a
 * test about magic links: two tests doing this for the same account at once can
 * open the same one-use link.
 */
export async function signInWithEmailLink(
  page: Page,
  email: string,
): Promise<void> {
  const sentAt = Date.now();
  await page.goto("/ingresar");
  await page
    .getByRole("button", { name: "Entrar con un enlace por correo" })
    .click();
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("button", { name: "Enviar enlace de acceso" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Si tu correo tiene una cuenta",
  );
  await page.goto(await emailLink(email, sentAt));
}
