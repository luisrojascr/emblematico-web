import { describe, expect, it } from "vitest";

import { displayTime, toTime24 } from "./time";

describe("toTime24", () => {
  it("entiende formatos comunes", () => {
    expect(toTime24("15:00")).toBe("15:00");
    expect(toTime24("3:00 PM")).toBe("15:00");
    expect(toTime24("3 pm")).toBe("15:00");
    expect(toTime24("11:30 a.m.")).toBe("11:30");
    expect(toTime24("12 AM")).toBe("00:00");
    expect(toTime24("9")).toBe("09:00");
  });

  it("rechaza texto libre y horas imposibles", () => {
    expect(toTime24("después de las 3")).toBeNull();
    expect(toTime24("25:00")).toBeNull();
    expect(toTime24("13 pm")).toBeNull();
    expect(toTime24("")).toBeNull();
  });
});

describe("displayTime", () => {
  it("muestra 12 horas y deja el texto libre igual", () => {
    expect(displayTime("15:00")).toBe("3:00 PM");
    expect(displayTime("00:30")).toBe("12:30 AM");
    expect(displayTime("12:00")).toBe("12:00 PM");
    expect(displayTime("Flexible")).toBe("Flexible");
  });
});
