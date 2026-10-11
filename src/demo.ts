import {
  applyTheme,
  buildTheme,
  CONTRAST_PAIRS,
  contrastRatio,
  themeToCss,
  type Mode,
  type TokenName,
  type Tokens,
} from "./index";

function must<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Demo markup is missing ${selector}`);
  return el;
}

const seedInput = must<HTMLInputElement>("#seed");
const contrastInput = must<HTMLInputElement>("#contrast");
const modeButton = must<HTMLButtonElement>("#mode");
const swatches = must<HTMLElement>("#swatches");
const cssOut = must<HTMLElement>("#css");

const TEXT_FOR_BASE = new Map<TokenName, TokenName>(
  CONTRAST_PAIRS.map(([text, base]) => [base, text]),
);

let mode: Mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function labelColor(tokens: Tokens, name: TokenName): string {
  const paired = TEXT_FOR_BASE.get(name);
  if (paired) return tokens[paired];
  const hex = tokens[name];
  return contrastRatio(hex, "#000000") >= contrastRatio(hex, "#ffffff") ? "#000000" : "#ffffff";
}

function swatch(tokens: Tokens, name: TokenName): HTMLElement {
  const el = document.createElement("div");
  el.className = "swatch";
  el.style.background = tokens[name];
  el.style.color = labelColor(tokens, name);
  el.textContent = `${name}\n${tokens[name]}`;
  return el;
}

function render(): void {
  const theme = buildTheme(seedInput.value, mode, Number(contrastInput.value));
  applyTheme(theme);
  modeButton.textContent = mode === "light" ? "Dark" : "Light";
  cssOut.textContent = themeToCss(theme);
  const names = Object.keys(theme.tokens) as TokenName[];
  swatches.replaceChildren(...names.map((name) => swatch(theme.tokens, name)));
}

seedInput.addEventListener("input", render);
contrastInput.addEventListener("input", render);
modeButton.addEventListener("click", () => {
  mode = mode === "light" ? "dark" : "light";
  render();
});

render();
