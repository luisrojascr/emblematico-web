import { describe, expect, it } from "vitest";

import { hospitalityContentSchema } from "@/lib/templates/hospitality/schema";
import type { HospitalityContent } from "@/lib/templates/hospitality/schema";

import {
  applyManualEdit,
  applyTranslations,
  fieldStatus,
  fieldsToTranslate,
  hashText,
  pick,
  pruneBlock,
  sourceFields,
} from "./hospitality";

function guide(): HospitalityContent {
  const base = hospitalityContentSchema.parse({ theme: {} });
  return {
    ...base,
    tagline: "Casa frente al mar",
    rules: { enabled: true, items: ["No fumar", "Silencio después de las 10"] },
    wifi: { enabled: false, network: "n", password: "p", notes: "oculto" },
  };
}

describe("sourceFields", () => {
  it("lists non-empty text of enabled sections only", () => {
    const paths = sourceFields(guide()).map((f) => f.path);
    expect(paths).toEqual(["tagline", "rules.items.0", "rules.items.1"]);
  });
});

describe("translation status", () => {
  const fields = sourceFields(guide());

  it("flags missing, ok and outdated", () => {
    const block = applyTranslations(undefined, [
      { field: fields[0]!, text: "House by the sea" },
    ]);
    expect(fieldStatus(fields[0]!, block)).toBe("ok");
    expect(fieldStatus(fields[1]!, block)).toBe("missing");
    expect(fieldStatus({ ...fields[0]!, text: "Otra" }, block)).toBe(
      "outdated",
    );
  });

  it("re-translates outdated fields unless the host edited them", () => {
    let block = applyTranslations(undefined, [
      { field: fields[0]!, text: "a" },
      { field: fields[1]!, text: "b" },
    ]);
    block = applyManualEdit(block, fields[1]!, "b edited");
    const changed = fields.map((f) => ({ ...f, text: f.text + "!" }));
    expect(fieldsToTranslate(changed, block).map((f) => f.path)).toEqual([
      "tagline",
      "rules.items.1",
    ]);
    expect(fieldsToTranslate(changed, block, true)).toHaveLength(3);
  });
});

describe("pick and prune", () => {
  it("falls back to the original", () => {
    expect(pick(undefined, "tagline", "hola")).toBe("hola");
    const block = {
      tagline: { text: "hi", src: hashText("hola"), edited: false },
    };
    expect(pick(block, "tagline", "hola")).toBe("hi");
  });

  it("ignores a translation made from a different original", () => {
    const block = {
      "recommendations.items.0.name": {
        text: "Deleted place",
        src: hashText("Lugar borrado"),
        edited: true,
      },
    };
    expect(pick(block, "recommendations.items.0.name", "Otro lugar")).toBe(
      "Otro lugar",
    );
  });

  it("prunes entries of removed fields", () => {
    const block = {
      "rules.items.5": { text: "x", src: "1", edited: false },
      tagline: { text: "hi", src: "1", edited: false },
    };
    expect(Object.keys(pruneBlock(block, sourceFields(guide())))).toEqual([
      "tagline",
    ]);
  });
});
