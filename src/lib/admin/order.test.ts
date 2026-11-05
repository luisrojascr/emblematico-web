import { describe, expect, it } from "vitest";

import { moveItem } from "./order";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("moveItem", () => {
  function ids(id: string, direction: "up" | "down") {
    const next = moveItem(items, id, direction);
    if (!next) throw new Error("expected items");
    return next.map((item) => item.id);
  }

  it("swaps with the neighbor", () => {
    expect(ids("b", "up")).toEqual(["b", "a", "c"]);
    expect(ids("b", "down")).toEqual(["a", "c", "b"]);
  });

  it("leaves the ends in place and ignores unknown ids", () => {
    expect(ids("a", "up")).toEqual(["a", "b", "c"]);
    expect(moveItem(items, "missing", "down")).toBeNull();
  });
});
