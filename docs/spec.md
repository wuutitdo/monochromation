# Monochromation — token spec

One seed colour in, one complete light + dark token set out. Drop-in for any web or app build
through CSS custom properties.

## Input

- `seed`: hex string (`#rrggbb`), chosen by the user in a colour picker.
- `mode`: `light` | `dark`.
- `contrast`: number in `[-1, 1]`, default `0`. Negative = reduced, positive = increased
  (maps to Material's contrast level; `1` is the WCAG-AAA-leaning high-contrast scheme).

## Output tokens

Every token is a CSS variable `--mc-<name>` holding a hex colour. Names follow Material 3
roles so the mapping to any component library is one lookup.

| Group | Tokens | Rule |
|---|---|---|
| Brand | `primary`, `on-primary`, `primary-container`, `on-primary-container` | `on-*` is readable on its base at ≥ 4.5:1 |
| Secondary | `secondary`, `on-secondary`, `secondary-container`, `on-secondary-container` | same |
| Tertiary | `tertiary`, `on-tertiary`, `tertiary-container`, `on-tertiary-container` | same |
| Error | `error`, `on-error`, `error-container`, `on-error-container` | hue fixed red, chroma from seed scheme |
| Surfaces | `background`, `on-background`, `surface`, `on-surface`, `surface-variant`, `on-surface-variant`, `surface-container-lowest` … `-highest`, `surface-dim`, `surface-bright` | tinted by seed hue, lightness fixed per mode |
| Lines | `outline`, `outline-variant` | ≥ 3:1 against `surface` for `outline` |
| Inverse | `inverse-surface`, `inverse-on-surface`, `inverse-primary` | for snackbars/tooltips |
| Misc | `shadow`, `scrim` | |

## Contrast floor

Text roles (`on-*`) against their base, measured by the test sweep over eight awkward seeds
(near-grey, near-black, near-white, max-chroma) in both modes:

| `contrast` | Floor on every `on-*` pair | WCAG level |
|---|---|---|
| `0` | ≥ 4.5:1 | AA |
| `1` | ≥ 7:1 | AAA |
| `-1` | below 3:1 on some pairs in dark mode | **none**; opt-in only |

The floors come from Material 3's tone pairs, not from post-hoc fixing. Reduced contrast is a
user preference the host may expose; it is not an accessible default.

## Runtime behaviour

- `buildTheme(seed, mode, contrast?)` → `Theme { seed, mode, contrast, tokens }`; `tokens` is
  token name → hex. Pure and frozen.
- `themeToCss(theme, selector?)` → CSS text: `color-scheme` plus the variables, scoped to
  `:root` by default. `selector` is trusted input. For a static stylesheet with both modes, call
  twice: `themeToCss(light)` and `themeToCss(dark, '[data-theme="dark"]')`.
- `applyTheme(theme, root?)` → sets the variables and `color-scheme` on an element's inline
  style and tags it `data-theme="light" | "dark"`. Idempotent. Throws without a root when no
  `document` exists (server side).
- Switching mode re-runs `buildTheme` with the same seed.
- Persisting the seed is the host app's job. The library stores nothing.

## Non-goals (for now)

Seed extraction from images, named palette presets, non-web targets. Material's ports cover
Dart/Kotlin/Swift if a native build needs the identical scheme.
