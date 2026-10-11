import { describe, expect, test } from "vitest";
import {
  applyTheme,
  buildTheme,
  CONTRAST_PAIRS,
  TOKEN_NAMES,
  themeToCss,
  type Mode,
  type Theme,
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
const CONTRASTS = [-1, 0, 1];

function assertReadable(theme: Theme, floor: number): void {
  for (const [text, base] of CONTRAST_PAIRS) {
    expect(
      contrastRatio(theme.tokens[text], theme.tokens[base]),
      `${text} on ${base} (${theme.seed} ${theme.mode} c=${theme.contrast})`,
    ).toBeGreaterThanOrEqual(floor);
  }
}

describe("buildTheme", () => {
  test("returns every token as a hex colour, plus its inputs", () => {
    const theme = buildTheme("#3b82f6", "light");
    expect(Object.keys(theme.tokens)).toEqual(TOKEN_NAMES);
    for (const hex of Object.values(theme.tokens)) expect(hex).toMatch(HEX);
    expect(theme).toMatchObject({ seed: "#3b82f6", mode: "light", contrast: 0 });
  });

  test("is deterministic and case-insensitive on the seed", () => {
    expect(buildTheme("#3B82F6", "dark")).toEqual(buildTheme("#3b82f6", "dark"));
  });

  test("pinned output for a known seed (catches dependency drift)", () => {
    const { tokens } = buildTheme("#3b82f6", "light");
    expect([tokens.primary, tokens["on-primary"], tokens.surface, tokens.outline]).toEqual([
      "#445e91",
      "#ffffff",
      "#f9f9ff",
      "#75777f",
    ]);
  });

  test("light and dark differ for the same seed", () => {
    expect(buildTheme("#3b82f6", "light").tokens.surface).not.toBe(
      buildTheme("#3b82f6", "dark").tokens.surface,
    );
  });

  test("dark surface is darker than light surface", () => {
    const light = contrastRatio(buildTheme("#3b82f6", "light").tokens.surface, "#000000");
    const dark = contrastRatio(buildTheme("#3b82f6", "dark").tokens.surface, "#000000");
    expect(light).toBeGreaterThan(dark);
  });

  test("returns frozen objects", () => {
    const theme = buildTheme("#3b82f6", "light");
    expect(Object.isFrozen(theme)).toBe(true);
    expect(Object.isFrozen(theme.tokens)).toBe(true);
  });

  test.each(["blue", "#fff", "#3b82f680", " #3b82f6", "#3b82f6\n"])(
    "rejects seed %j",
    (seed) => {
      expect(() => buildTheme(seed, "light")).toThrow(/hex/);
    },
  );

  test.each([2, -1.01, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects contrast %s",
    (contrast) => {
      expect(() => buildTheme("#3b82f6", "light", contrast)).toThrow(/\[-1, 1\]/);
    },
  );

  test.each([-1, 1])("accepts boundary contrast %s", (contrast) => {
    expect(buildTheme("#3b82f6", "light", contrast).contrast).toBe(contrast);
  });

  describe.each(SEEDS)("seed %s", (seed) => {
    test.each(MODES)("%s mode, contrast 0: every on-colour reads at >= 4.5:1", (mode) => {
      assertReadable(buildTheme(seed, mode, 0), 4.5);
    });

    test.each(MODES)("%s mode, contrast 1: every on-colour reads at >= 7:1", (mode) => {
      assertReadable(buildTheme(seed, mode, 1), 7);
    });

    test.each(MODES)("%s mode, contrast -1 lowers on-colour contrast below contrast 0", (mode) => {
      const low = buildTheme(seed, mode, -1).tokens;
      const base = buildTheme(seed, mode, 0).tokens;
      for (const [text, bg] of CONTRAST_PAIRS) {
        expect(contrastRatio(low[text], low[bg])).toBeLessThanOrEqual(
          contrastRatio(base[text], base[bg]) + 1e-9,
        );
      }
    });

    test.each(MODES)("%s mode: outline reads at >= 3:1 on surface", (mode) => {
      const { tokens } = buildTheme(seed, mode);
      expect(contrastRatio(tokens.outline, tokens.surface)).toBeGreaterThanOrEqual(3);
    });
  });

  test("contrast is monotonic on on-primary across the range", () => {
    const ratios = CONTRASTS.map((c) => {
      const { tokens } = buildTheme("#eab308", "light", c);
      return contrastRatio(tokens["on-primary"], tokens.primary);
    });
    expect(ratios[1]).toBeGreaterThanOrEqual(ratios[0]!);
    expect(ratios[2]).toBeGreaterThanOrEqual(ratios[1]!);
  });
});

describe("themeToCss", () => {
  test("emits color-scheme and every prefixed property under :root", () => {
    const theme = buildTheme("#3b82f6", "dark");
    const css = themeToCss(theme);
    expect(css.startsWith(":root {\n  color-scheme: dark;\n")).toBe(true);
    for (const name of TOKEN_NAMES) {
      expect(css).toContain(`  --mc-${name}: ${theme.tokens[name]};`);
    }
    expect(css.trimEnd().endsWith("}")).toBe(true);
  });

  test("honours a custom selector", () => {
    expect(themeToCss(buildTheme("#3b82f6", "light"), ".app")).toMatch(/^\.app \{/);
  });

  test("rejects tampered token values", () => {
    const theme = buildTheme("#3b82f6", "light");
    const tampered = {
      ...theme,
      tokens: { ...theme.tokens, primary: "red; } body { display: none" },
    };
    expect(() => themeToCss(tampered)).toThrow(/hex/);
  });
});

describe("applyTheme", () => {
  test("sets variables, color-scheme and the mode attribute on the root", () => {
    const root = document.createElement("div");
    const theme = buildTheme("#3b82f6", "dark");
    applyTheme(theme, root);
    expect(root.style.getPropertyValue("--mc-primary")).toBe(theme.tokens.primary);
    expect(root.style.colorScheme).toBe("dark");
    expect(root.dataset.theme).toBe("dark");
  });

  test("defaults to the document element", () => {
    const theme = buildTheme("#3b82f6", "light");
    applyTheme(theme);
    expect(document.documentElement.style.getPropertyValue("--mc-surface")).toBe(
      theme.tokens.surface,
    );
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("re-applying overwrites rather than accumulates", () => {
    const root = document.createElement("div");
    applyTheme(buildTheme("#3b82f6", "light"), root);
    const next = buildTheme("#ef4444", "dark");
    applyTheme(next, root);
    expect(root.style.getPropertyValue("--mc-primary")).toBe(next.tokens.primary);
    expect(root.style.length).toBe(TOKEN_NAMES.length + 1); // + color-scheme
    expect(root.dataset.theme).toBe("dark");
  });
});
