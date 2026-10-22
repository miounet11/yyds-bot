import { CSS_VAR, type DesignTokens } from "../../design/themes.js";

export function renderCss(tokens: DesignTokens): string {
  const vars = (Object.keys(CSS_VAR) as (keyof typeof CSS_VAR)[])
    .map((key) => `  ${CSS_VAR[key]}: ${tokens[key]};`)
    .join("\n");
  return `:root {
${vars}
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 18px;
  line-height: 1.6;
}
a { color: var(--color-action); }
a:hover { text-decoration: none; }
img { max-width: 100%; height: auto; }
.skip-link {
  position: absolute;
  left: 12px;
  top: -40px;
  background: var(--color-action);
  color: var(--color-action-text);
  padding: 8px 12px;
}
.skip-link:focus { top: 12px; }
.topbar {
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: 16px 20px;
}
.topbar a { color: var(--color-on-primary); text-decoration: none; }
.topbar-inner, .wrap { width: min(var(--max-width), calc(100% - 32px)); margin: 0 auto; }
.topbar-inner { display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; }
.brand { font-weight: 700; letter-spacing: 0.01em; }
.nav { display: flex; gap: 14px; flex-wrap: wrap; font-size: 16px; }
.site-layout {
  width: min(var(--max-width), calc(100% - 32px));
  margin: 28px auto 80px;
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.trust-card, .offer-card, .panel {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: 16px;
}
.trust-card { position: sticky; top: 12px; }
.kicker { color: var(--color-accent); font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
h1 { font-size: 34px; line-height: 1.2; margin: 0 0 12px; }
h2 { font-size: 22px; margin: 28px 0 8px; }
.answer-first {
  border-left: 4px solid var(--color-accent);
  padding: 8px 0 8px 14px;
  margin: 12px 0 20px;
}
.fact-table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
.fact-table th, .fact-table dd, .fact-table td { border-bottom: 1px solid var(--color-line); text-align: left; padding: 8px; vertical-align: top; }
.fact-table th { font-size: 14px; color: var(--color-muted); }
.price, .mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.offer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.offer-card h3 { margin: 0 0 8px; font-size: 18px; }
.cta, .bottom-bar a, button {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: var(--radius-control);
  border: 0;
  background: var(--color-action);
  color: var(--color-action-text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}
.cta.secondary { background: transparent; color: var(--color-text); border: 1px solid var(--color-line); }
:focus-visible { outline: 3px solid var(--color-action); outline-offset: 2px; }
.faq-list dt { font-weight: 700; margin-top: 12px; }
.faq-list dd { margin: 4px 0 0; }
.crumbs ol { display: flex; gap: 8px; flex-wrap: wrap; list-style: none; padding: 0; margin: 0 0 12px; color: var(--color-muted); font-size: 14px; }
.muted { color: var(--color-muted); }
.bottom-bar {
  display: none;
  position: sticky;
  bottom: 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
  justify-content: space-around;
  padding: 8px;
}
footer { padding: 24px 16px 32px; color: var(--color-muted); }
[data-machine="checkout"] [data-panel] { display: none; }
[data-machine="checkout"][data-state="drawer"] [data-panel="drawer"],
[data-machine="checkout"][data-state="invalid-phone"] [data-panel="drawer"],
[data-machine="checkout"][data-state="invalid-phone"] [data-panel="invalid"],
[data-machine="checkout"][data-state="payment-demo"] [data-panel="payment"],
[data-machine="checkout"][data-state="receipt"] [data-panel="receipt"] { display: block; }
input, textarea {
  width: 100%;
  font: inherit;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-text);
}
@media (max-width: 800px) {
  .site-layout { grid-template-columns: 1fr; }
  .trust-card { position: static; }
  .bottom-bar { display: flex; }
  h1 { font-size: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
`;
}
