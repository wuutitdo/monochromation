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

Text roles (`on-*`) against their base: ≥ 4.5:1 at `contrast = 0`. Guaranteed by the tonal
scheme (Material 3 tone pairs), not by post-hoc checking; the test suite still asserts it for a
sweep of seeds including near-grey and near-black ones.

## Runtime behaviour

- `buildTheme(seed, mode, contrast?)` → `Record<string, string>` of token name → hex. Pure.
- `themeToCss(tokens, selector?)` → CSS text, variables scoped to `:root` by default.
- `applyTheme(tokens, root?)` → sets the variables on an element's inline style. Idempotent.
- Mode is a data attribute on the root: `data-theme="light" | "dark"`. Switching mode re-runs
  `buildTheme` with the same seed.
- Persisting the seed is the host app's job. The library stores nothing.

## Non-goals (for now)

Seed extraction from images, named palette presets, non-web targets. Material's ports cover
Dart/Kotlin/Swift if a native build needs the identical scheme.
