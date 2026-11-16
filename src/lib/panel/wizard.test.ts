import { describe, expect, it } from "vitest";

import { EMPTY_WIZARD, buildContent, wizardSchema } from "./wizard";

function build(values: Partial<typeof EMPTY_WIZARD>) {
  return buildContent(wizardSchema.parse({ ...EMPTY_WIZARD, ...values }));
}

describe("buildContent", () => {
  it("solo muestra las secciones marcadas", () => {
    const content = build({
      name: "Casa Bahía",
      sections: { ...EMPTY_WIZARD.sections, wifi: true },
      wifiNetwork: "Bahia",
      wifiPassword: "secreto123",
      rules: ["No fumar"],
    });
    expect(content.wifi).toMatchObject({
      enabled: true,
      network: "Bahia",
      password: "secreto123",
    });
    expect(content.rules).toEqual({ enabled: false, items: [] });
  });

  it("descarta filas vacías y arma recomendaciones y WhatsApp", () => {
    const content = build({
      name: "Casa Bahía",
      sections: {
        ...EMPTY_WIZARD.sections,
        amenities: true,
        recommendations: true,
        contact: true,
      },
      amenities: ["Piscina", " "],
      recommendations: [
        { name: "Soda Tía Mery", description: "Casados" },
        { name: "", description: "sin nombre" },
      ],
      whatsapp: "8899 7060",
    });
    expect(content.amenities.items).toEqual([{ label: "Piscina", detail: "" }]);
    expect(content.recommendations.items).toHaveLength(1);
    expect(content.whatsapp).toMatchObject({ enabled: true, phone: "50688997060" });
  });

  it("una sección marcada pero vacía queda oculta", () => {
    const content = build({
      name: "X",
      sections: { ...EMPTY_WIZARD.sections, stay: true, welcome: true },
    });
    expect(content.stay.enabled).toBe(false);
    expect(content.welcome.enabled).toBe(false);
  });
});
