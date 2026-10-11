import {
  argbFromHex,
  hexFromArgb,
  Hct,
  MaterialDynamicColors,
  SchemeTonalSpot,
  type DynamicScheme,
} from "@material/material-color-utilities";

export type Mode = "light" | "dark";

export const TOKEN_PREFIX = "--mc-";
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const TOKEN_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

/** Material 3 colour roles exposed as tokens. */
const ROLES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "background",
  "onBackground",
  "surface",
  "onSurface",
  "surfaceVariant",
  "onSurfaceVariant",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
  "outline",
  "outlineVariant",
  "inverseSurface",
  "inverseOnSurface",
  "inversePrimary",
  "shadow",
  "scrim",
] as const;

type Role = (typeof ROLES)[number];

type Kebab<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Uppercase<Head>
    ? Head extends Lowercase<Head>
      ? `${Head}${Kebab<Tail>}`
      : `-${Lowercase<Head>}${Kebab<Tail>}`
    : `${Head}${Kebab<Tail>}`
  : S;

/** Token name in `kebab-case`, e.g. `on-primary-container`. */
export type TokenName = Kebab<Role>;
export type Tokens = Readonly<Record<TokenName, string>>;

/** A built theme: the inputs it came from plus every token as a hex colour. */
export interface Theme {
  readonly seed: string;
  readonly mode: Mode;
  readonly contrast: number;
  readonly tokens: Tokens;
}

function toKebab<S extends string>(role: S): Kebab<S> {
  return role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`) as Kebab<S>;
}

export const TOKEN_NAMES: readonly TokenName[] = ROLES.map((role) => toKebab(role));

/** Pairs of (text role, base role) that must stay readable. */
export const CONTRAST_PAIRS: ReadonlyArray<readonly [TokenName, TokenName]> = [
  ["on-primary", "primary"],
  ["on-primary-container", "primary-container"],
  ["on-secondary", "secondary"],
  ["on-secondary-container", "secondary-container"],
  ["on-tertiary", "tertiary"],
  ["on-tertiary-container", "tertiary-container"],
  ["on-error", "error"],
  ["on-error-container", "error-container"],
  ["on-background", "background"],
  ["on-surface", "surface"],
  ["on-surface-variant", "surface-variant"],
  ["inverse-on-surface", "inverse-surface"],
];

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}

export function assertHex(value: string, what = "Colour"): void {
  if (!isHexColor(value)) {
    throw new Error(`${what} must be a #rrggbb hex colour, got "${value}"`);
  }
}

function assertContrast(contrast: number): void {
  if (!Number.isFinite(contrast) || contrast < -1 || contrast > 1) {
    throw new Error(`Contrast must be a number in [-1, 1], got ${contrast}`);
  }
}

function roleHex(scheme: DynamicScheme, role: Role): string {
  return hexFromArgb(MaterialDynamicColors[role].getArgb(scheme));
}

/**
 * Build the full theme for one seed colour.
 * Pure: same inputs always give the same output.
 */
export function buildTheme(seed: string, mode: Mode, contrast = 0): Theme {
  assertHex(seed, "Seed");
  assertContrast(contrast);
  const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), mode === "dark", contrast);
  const entries = ROLES.map((role) => [toKebab(role), roleHex(scheme, role)] as const);
  const tokens = Object.freeze(Object.fromEntries(entries)) as Tokens;
  return Object.freeze({ seed: seed.toLowerCase(), mode, contrast, tokens });
}

function assertTokens(tokens: Tokens): void {
  for (const [name, hex] of Object.entries(tokens)) {
    if (!TOKEN_NAME_PATTERN.test(name)) throw new Error(`Invalid token name "${name}"`);
    assertHex(hex, `Token ${name}`);
  }
}

/**
 * Render a theme as a CSS rule of custom properties plus `color-scheme`.
 * `selector` is trusted: pass only values you wrote yourself.
 * For a static stylesheet with both modes, call twice:
 * `themeToCss(light)` and `themeToCss(dark, '[data-theme="dark"]')`.
 */
export function themeToCss(theme: Theme, selector = ":root"): string {
  assertTokens(theme.tokens);
  const lines = Object.entries(theme.tokens).map(
    ([name, hex]) => `  ${TOKEN_PREFIX}${name}: ${hex};`,
  );
  return `${selector} {\n  color-scheme: ${theme.mode};\n${lines.join("\n")}\n}\n`;
}

/** Write a theme onto an element's inline style and tag the mode. Idempotent. */
export function applyTheme(theme: Theme, root?: HTMLElement): void {
  const target = root ?? (typeof document === "undefined" ? undefined : document.documentElement);
  if (!target) {
    throw new Error("applyTheme needs a root element when no document exists");
  }
  assertTokens(theme.tokens);
  for (const [name, hex] of Object.entries(theme.tokens)) {
    target.style.setProperty(`${TOKEN_PREFIX}${name}`, hex);
  }
  target.style.colorScheme = theme.mode;
  target.dataset.theme = theme.mode;
}
