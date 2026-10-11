import { describe, expect, test } from "vitest";
import { contrastRatio, relativeLuminance } from "../src/contrast";

describe("relativeLuminance", () => {
  test("black is 0 and white is 1", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
  });

  test("rejects anything but #rrggbb", () => {
    for (const bad of ["fff", "#fff", "#ff000080", "red"]) {
      expect(() => relativeLuminance(bad)).toThrow(/hex/);
    }
  });
});

describe("contrastRatio", () => {
  test("black on white is 21:1 in either order", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 10);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 10);
  });

  test("identical colours are 1:1", () => {
    expect(contrastRatio("#3b82f6", "#3B82F6")).toBe(1);
  });
});
