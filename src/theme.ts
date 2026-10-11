import {
  argbFromHex,
  hexFromArgb,
  Hct,
  MaterialDynamicColors,
  SchemeTonalSpot,
  type DynamicScheme,
} from "@material/material-color-utilities";

export type Mode = "light" | "dark";
export type Tokens = Readonly<Record<string, string>>;

export const TOKEN_PREFIX = "--mc-";
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

/** Material 3 colour roles exposed as tokens, in `kebab-case`. */
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

export const TOKEN_NAMES: readonly string[] = ROLES.map(toKebab);

/** Pairs of (text role, base role) that must stay readable. */
export const CONTRAST_PAIRS: ReadonlyArray<readonly [string, string]> = [
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

function toKebab(role: string): string {
  return role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function assertHex(seed: string): void {
  if (!HEX_PATTERN.test(seed)) {
    throw new Error(`Seed must be a #rrggbb hex colour, got "${seed}"`);
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
 * Build the full token set for one seed colour.
 * Pure: same inputs always give the same output.
 */
export function buildTheme(seed: string, mode: Mode, contrast = 0): Tokens {
  assertHex(seed);
  assertContrast(contrast);
  const scheme = new SchemeTonalSpot(
    Hct.fromInt(argbFromHex(seed)),
    mode === "dark",
    contrast,
  );
  const entries = ROLES.map((role) => [toKebab(role), roleHex(scheme, role)] as const);
  return Object.freeze(Object.fromEntries(entries));
}

/** Render tokens as a CSS rule of custom properties. */
export function themeToCss(tokens: Tokens, selector = ":root"): string {
  const lines = Object.entries(tokens).map(
    ([name, hex]) => `  ${TOKEN_PREFIX}${name}: ${hex};`,
  );
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}

/** Write tokens onto an element's inline style and tag the mode. Idempotent. */
export function applyTheme(
  tokens: Tokens,
  mode: Mode,
  root: HTMLElement = document.documentElement,
): void {
  for (const [name, hex] of Object.entries(tokens)) {
    root.style.setProperty(`${TOKEN_PREFIX}${name}`, hex);
  }
  root.dataset.theme = mode;
}
