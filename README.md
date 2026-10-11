# Monochromation

Pick one colour, get a full UI theme. The user chooses a seed in a colour picker; the library
derives every surface, text, border and state colour for both light and dark mode, with text
contrast guaranteed. Drop-in for any web or app build via CSS custom properties.

Built on Google's open-source `@material/material-color-utilities` (the Material You engine),
so edge cases like near-grey or near-black seeds are already handled.

## Use

```ts
import { applyTheme, buildTheme } from "monochromation";

const theme = buildTheme("#3b82f6", "dark");  // seed (#rrggbb), mode, optional contrast [-1, 1]
applyTheme(theme);                            // sets --mc-* and color-scheme on <html>, data-theme="dark"
```

Then in CSS:

```css
body   { background: var(--mc-background); color: var(--mc-on-background); }
button { background: var(--mc-primary);    color: var(--mc-on-primary); }
```

`themeToCss(theme)` returns the same variables as a CSS string for server rendering or static
export. Seeds must be 6-digit hex; the demo's colour picker always produces that form. Full
token list and contrast rules: [docs/spec.md](docs/spec.md).

Consume from another build via `npm run build:lib`, which emits `dist/` as ESM, CommonJS and
type declarations with the colour engine bundled in, so plain Node, SSR and Jest all work.

## Layout

| Path | What |
|---|---|
| `src/theme.ts` | `buildTheme`, `themeToCss`, `applyTheme`, token names |
| `src/contrast.ts` | WCAG contrast ratio helper |
| `src/demo.ts`, `index.html` | demo page with picker, mode toggle, contrast slider; follows the system scheme on load |
| `test/` | vitest suite, including a contrast sweep over awkward seeds |
| `docs/spec.md` | token spec |
| `.env.example` | required environment variables, placeholders only (none yet) |

## Commands

```
npm install
npm run dev        # demo at the printed localhost URL
npm test
npm run typecheck
npm run build      # build:lib (dist/, the package) + build:demo (dist-demo/)
```

## Install in another project

```
npm i github:wuutitdo/monochromation#v1.0.0
```

The `prepare` script builds `dist/` on install, so no committed build output is needed.
Always install as a dependency; never copy `src/` into a client repository. License: MIT.

## Status

Core library and demo working. Not yet: image-based seed extraction, named presets, native ports.
