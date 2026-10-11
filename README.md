# Monochromation

Pick one colour, get a full UI theme. The user chooses a seed in a colour picker; the library
derives every surface, text, border and state colour for both light and dark mode, with text
contrast guaranteed. Drop-in for any web or app build via CSS custom properties.

Built on Google's open-source `@material/material-color-utilities` (the Material You engine),
so edge cases like near-grey or near-black seeds are already handled.

## Use

```ts
import { applyTheme, buildTheme } from "monochromation";

const tokens = buildTheme("#3b82f6", "dark");   // seed, mode, optional contrast [-1, 1]
applyTheme(tokens, "dark");                     // sets --mc-* on <html>, data-theme="dark"
```

Then in CSS:

```css
body   { background: var(--mc-background); color: var(--mc-on-background); }
button { background: var(--mc-primary);    color: var(--mc-on-primary); }
```

`themeToCss(tokens)` returns the same variables as a CSS string for server rendering or static
export. Full token list and contrast rules: [docs/spec.md](docs/spec.md).

## Layout

| Path | What |
|---|---|
| `src/theme.ts` | `buildTheme`, `themeToCss`, `applyTheme`, token names |
| `src/contrast.ts` | WCAG contrast ratio helper |
| `src/demo.ts`, `index.html` | demo page with picker, mode toggle, contrast slider |
| `test/` | vitest suite, including a contrast sweep over awkward seeds |
| `docs/spec.md` | token spec |
| `.env.example` | required environment variables, placeholders only (none yet) |

## Commands

```
npm install
npm run dev        # demo at the printed localhost URL
npm test
npm run typecheck
npm run build
```

## Status

Core library and demo working. Not yet: image-based seed extraction, named presets, native ports.
