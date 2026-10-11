import { applyTheme, buildTheme, themeToCss, type Mode } from "./index";

const seedInput = document.querySelector<HTMLInputElement>("#seed")!;
const contrastInput = document.querySelector<HTMLInputElement>("#contrast")!;
const modeButton = document.querySelector<HTMLButtonElement>("#mode")!;
const swatches = document.querySelector<HTMLElement>("#swatches")!;
const cssOut = document.querySelector<HTMLElement>("#css")!;

let mode: Mode = "light";

function render(): void {
  const tokens = buildTheme(seedInput.value, mode, Number(contrastInput.value));
  applyTheme(tokens, mode);
  modeButton.textContent = mode === "light" ? "Dark" : "Light";
  cssOut.textContent = themeToCss(tokens);
  swatches.replaceChildren(
    ...Object.entries(tokens).map(([name, hex]) => {
      const el = document.createElement("div");
      el.className = "swatch";
      el.style.background = hex;
      el.style.color = tokens[onRole(name)] ?? tokens["on-surface"];
      el.textContent = `${name}\n${hex}`;
      el.style.whiteSpace = "pre";
      return el;
    }),
  );
}

function onRole(name: string): string {
  return name.startsWith("on-") ? name.slice(3) : `on-${name}`;
}

seedInput.addEventListener("input", render);
contrastInput.addEventListener("input", render);
modeButton.addEventListener("click", () => {
  mode = mode === "light" ? "dark" : "light";
  render();
});

render();
