import { describe, expect, it } from "vitest";

import { reportEmail } from "./email";

describe("reportEmail", () => {
  const base = {
    businessName: "Casa <Nébora>",
    slug: "casa-nebora",
    reason: "scam",
    details: "Pide pagos\npor fuera",
    contactEmail: "",
    siteUrl: "https://www.emblematicocr.com",
  };

  it("escapes what the visitor wrote", () => {
    const email = reportEmail({ ...base, details: "<script>x</script>" });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("Casa &lt;Nébora&gt;");
  });

  it("includes the guide, the reason and the admin link", () => {
    const email = reportEmail(base);
    expect(email.subject).toBe("Reporte de guía: Casa <Nébora>");
    expect(email.text).toContain(
      "https://www.emblematicocr.com/negocio/casa-nebora",
    );
    expect(email.text).toContain("Parece una estafa o un fraude");
    expect(email.text).toContain("(no lo dejó)");
    expect(email.html).toContain("Pide pagos<br>por fuera");
    expect(email.text).toContain(
      "https://www.emblematicocr.com/admin/reportes",
    );
  });
});
