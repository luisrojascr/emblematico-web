import { describe, expect, it } from "vitest";

import {
  droppedNotice,
  dueNotice,
  noticeEmail,
  type NoticeSubscription,
} from "./notices";

const now = new Date("2026-11-18T12:00:00Z");
const at = (days: number, hours = 0) =>
  new Date(
    now.getTime() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000,
  ).toISOString();

function trial(endsAt: string): NoticeSubscription {
  return {
    plan: "essential",
    status: "trialing",
    trial_ends_at: endsAt,
    current_period_end: null,
  };
}

function paid(
  end: string,
  status: NoticeSubscription["status"] = "active",
): NoticeSubscription {
  return { plan: "plus", status, trial_ends_at: null, current_period_end: end };
}

describe("dueNotice", () => {
  it("reminds 7 and 3 days before a trial ends (days 23 and 27 of 30)", () => {
    expect(dueNotice(trial(at(10)), now)).toBeNull();
    expect(dueNotice(trial(at(6, 20)), now)).toMatchObject({
      kind: "trial_7d",
      daysLeft: 7,
    });
    expect(dueNotice(trial(at(4)), now)?.kind).toBe("trial_7d");
    expect(dueNotice(trial(at(2, 3)), now)).toMatchObject({
      kind: "trial_3d",
      daysLeft: 3,
    });
    expect(dueNotice(trial(at(0, 3)), now)).toMatchObject({
      kind: "trial_3d",
      daysLeft: 1,
    });
    expect(dueNotice(trial(at(-1)), now)).toBeNull();
  });

  it("reminds before and after a paid plan ends, within the grace", () => {
    expect(dueNotice(paid(at(30)), now)).toBeNull();
    expect(dueNotice(paid(at(5)), now)?.kind).toBe("paid_7d");
    expect(dueNotice(paid(at(-1)), now)?.kind).toBe("paid_ended");
    expect(dueNotice(paid(at(-8)), now)).toBeNull();
    expect(dueNotice(paid(at(5), "canceled"), now)?.kind).toBe("paid_7d");
    expect(dueNotice(paid(at(-1), "canceled"), now)).toBeNull();
    expect(dueNotice(paid(at(5), "past_due"), now)).toBeNull();
  });

  it("skips renewal reminders for Whop plans, which renew on their own", () => {
    expect(dueNotice({ ...paid(at(3)), provider: "whop" }, now)).toBeNull();
    expect(
      dueNotice({ ...paid(at(3), "canceled"), provider: "whop" }, now)?.kind,
    ).toBe("paid_7d");
  });

  it("ignores Free", () => {
    expect(dueNotice({ ...trial(at(3)), plan: "free" }, now)).toBeNull();
  });

  it("picks the email for a dropped plan", () => {
    expect(droppedNotice("trialing")).toBe("trial_ended");
    expect(droppedNotice("active")).toBe("paid_dropped");
  });
});

describe("noticeEmail", () => {
  const base = {
    name: "Ana <b>Mora</b>",
    plan: "essential" as const,
    periodEnd: new Date("2026-12-18T05:00:00Z"),
    daysLeft: 3,
    siteUrl: "https://www.emblematicocr.com",
  };

  it("writes the trial reminder in Spanish with the end date and a link", () => {
    const email = noticeEmail("trial_3d", base);
    expect(email.subject).toBe("Te quedan 3 días de prueba en emblemático");
    expect(email.text).toContain("Hola, Ana:");
    expect(email.text).toContain("17 de diciembre de 2026");
    expect(email.html).toContain(
      "https://www.emblematicocr.com/panel/configuracion#suscripcion",
    );
    expect(email.text).toContain("siguen funcionando");
  });

  it("escapes the name in HTML", () => {
    const email = noticeEmail("trial_ended", {
      ...base,
      name: "<script>x</script>",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;x&lt;/script&gt;");
  });

  it("has an email for every notice", () => {
    for (const kind of [
      "trial_7d",
      "trial_3d",
      "trial_ended",
      "paid_7d",
      "paid_ended",
      "paid_dropped",
      "paid_canceled",
    ] as const) {
      const email = noticeEmail(kind, { ...base, daysLeft: 1 });
      expect(email.subject).not.toBe("");
      expect(email.html).toContain("#d4a862");
    }
  });

  it("tells online buyers to reactivate from the panel, not to write to us", () => {
    const selfServe = noticeEmail("paid_7d", { ...base, selfServe: true });
    expect(selfServe.text).toContain("reactívalo desde tu panel");
    expect(selfServe.text).not.toContain("SINPE");
    const cancel = noticeEmail("paid_canceled", { ...base, selfServe: true });
    expect(cancel.subject).toContain("Cancelaste tu plan");
    expect(cancel.text).toContain("no se te volverá a cobrar");
  });
});
