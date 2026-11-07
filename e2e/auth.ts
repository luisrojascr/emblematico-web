import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

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

async function magicLink(email: string, sentAt: number): Promise<string> {
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
    `No magic link for ${email}. Is Mailpit running at ${MAILPIT}?`,
  );
}

/** Requests a magic link and opens it in this page. Needs local Mailpit. */
export async function signIn(page: Page, email: string): Promise<void> {
  const sentAt = Date.now();
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByRole("button", { name: "Enviar enlace de acceso" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Si tu correo tiene una cuenta",
  );
  await page.goto(await magicLink(email, sentAt));
}
