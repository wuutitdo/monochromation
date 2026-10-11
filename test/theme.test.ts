import { describe, expect, test } from "vitest";
import {
  applyTheme,
  buildTheme,
  CONTRAST_PAIRS,
  TOKEN_NAMES,
  themeToCss,
  type Mode,
} from "../src/theme";
import { contrastRatio } from "../src/contrast";

const HEX = /^#[0-9a-f]{6}$/;
const MODES: Mode[] = ["light", "dark"];
const SEEDS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#eab308", // yellow, low-contrast-prone
  "#808080", // near-grey, low chroma
  "#0a0a0a", // near-black
  "#fafafa", // near-white
  "#ff00ff", // max-chroma magenta
];

describe("buildTheme", () => {
  test("returns every token as a hex colour", () => {
    const tokens = buildTheme("#3b82f6", "light");
    expect(Object.keys(tokens)).toEqual(TOKEN_NAMES);
    for (const hex of Object.values(tokens)) expect(hex).toMatch(HEX);
  });

  test("is deterministic", () => {
    expect(buildTheme("#3b82f6", "dark")).toEqual(buildTheme("#3b82f6", "dark"));
  });

  test("light and dark differ for the same seed", () => {
    expect(buildTheme("#3b82f6", "light").surface).not.toBe(
      buildTheme("#3b82f6", "dark").surface,
    );
  });

  test("dark surface is darker than light surface", () => {
    const light = contrastRatio(buildTheme("#3b82f6", "light").surface, "#000000");
    const dark = contrastRatio(buildTheme("#3b82f6", "dark").surface, "#000000");
    expect(light).toBeGreaterThan(dark);
  });

  test("returns a frozen object", () => {
    expect(Object.isFrozen(buildTheme("#3b82f6", "light"))).toBe(true);
  });

  test("rejects a non-hex seed", () => {
    expect(() => buildTheme("blue", "light")).toThrow(/hex/);
    expect(() => buildTheme("#fff", "light")).toThrow(/hex/);
  });

  test("rejects an out-of-range contrast", () => {
    expect(() => buildTheme("#3b82f6", "light", 2)).toThrow(/\[-1, 1\]/);
    expect(() => buildTheme("#3b82f6", "light", Number.NaN)).toThrow(/\[-1, 1\]/);
  });

  describe.each(SEEDS)("seed %s", (seed) => {
    test.each(MODES)("%s mode: every on-colour reads at >= 4.5:1", (mode) => {
      const tokens = buildTheme(seed, mode);
      for (const [text, base] of CONTRAST_PAIRS) {
        expect(
          contrastRatio(tokens[text], tokens[base]),
          `${text} on ${base}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    test.each(MODES)("%s mode: outline reads at >= 3:1 on surface", (mode) => {
      const tokens = buildTheme(seed, mode);
      expect(contrastRatio(tokens.outline, tokens.surface)).toBeGreaterThanOrEqual(3);
    });
  });

  test("higher contrast raises on-primary ratio", () => {
    const base = buildTheme("#eab308", "light", 0);
    const high = buildTheme("#eab308", "light", 1);
    expect(contrastRatio(high["on-primary"], high.primary)).toBeGreaterThanOrEqual(
      contrastRatio(base["on-primary"], base.primary),
    );
  });
});

describe("themeToCss", () => {
  test("emits prefixed custom properties under :root by default", () => {
    const css = themeToCss(buildTheme("#3b82f6", "light"));
    expect(css.startsWith(":root {\n")).toBe(true);
    expect(css).toMatch(/^ {2}--mc-primary: #[0-9a-f]{6};$/m);
    expect(css.trimEnd().endsWith("}")).toBe(true);
  });

  test("honours a custom selector", () => {
    expect(themeToCss(buildTheme("#3b82f6", "light"), ".app")).toMatch(/^\.app \{/);
  });
});

describe("applyTheme", () => {
  test("sets variables and the mode attribute on the root", () => {
    const root = document.createElement("div");
    const tokens = buildTheme("#3b82f6", "dark");
    applyTheme(tokens, "dark", root);
    expect(root.style.getPropertyValue("--mc-primary")).toBe(tokens.primary);
    expect(root.dataset.theme).toBe("dark");
  });

  test("re-applying overwrites rather than accumulates", () => {
    const root = document.createElement("div");
    applyTheme(buildTheme("#3b82f6", "light"), "light", root);
    const next = buildTheme("#ef4444", "dark");
    applyTheme(next, "dark", root);
    expect(root.style.getPropertyValue("--mc-primary")).toBe(next.primary);
    expect(root.style.length).toBe(TOKEN_NAMES.length);
    expect(root.dataset.theme).toBe("dark");
  });
});
