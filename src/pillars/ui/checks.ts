import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Brief } from "../../brief/types.js";
import { COMPONENT_MARKERS, CSS_VAR, resolveTokens } from "../../design/themes.js";
import { contrastRatio } from "../../util.js";
import type { Check } from "../types.js";

async function readHtml(siteDir: string): Promise<string[]> {
  const out: string[] = [];
  async function visit(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(next);
      else if (entry.name.endsWith(".html")) out.push(await readFile(next, "utf8"));
    }
  }
  await visit(siteDir);
  return out;
}

export async function uiChecks(brief: Brief, siteDir: string): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (id: string, pass: boolean, detail: string) => checks.push({ id, pillar: "ui", pass, detail });
  const css = await readFile(path.join(siteDir, "assets", "site.css"), "utf8").catch(() => "");
  const tokens = resolveTokens(brief.design.theme, brief.design.token_overrides);
  const tokenBad = (Object.keys(CSS_VAR) as (keyof typeof CSS_VAR)[]).filter((key) => !css.includes(`${CSS_VAR[key]}: ${tokens[key]}`));
  add("design-tokens", tokenBad.length === 0, tokenBad.length ? tokenBad.join(", ") : brief.design.theme);
  const pairs: [string, string, string][] = [
    ["text/background", tokens.colorText, tokens.colorBackground],
    ["text/surface", tokens.colorText, tokens.colorSurface],
    ["action", tokens.colorActionText, tokens.colorAction],
    ["muted/background", tokens.colorMuted, tokens.colorBackground],
    ["on-primary", tokens.colorOnPrimary, tokens.colorPrimary]
  ];
  const contrastBad = pairs.filter(([, a, b]) => contrastRatio(a, b) < 4.5).map(([name, a, b]) => `${name} ${contrastRatio(a, b).toFixed(2)}`);
  add("contrast", contrastBad.length === 0, contrastBad.join(", ") || "WCAG AA pairs >= 4.5");
  const pages = await readHtml(siteDir);
  const all = pages.join("\n");
  const markers = COMPONENT_MARKERS.filter((marker) => !all.includes(marker) || !css.includes(marker));
  add("component-markers", markers.length === 0, markers.join(", ") || "layout markers present");
  add("skip-link", pages.every((html) => html.includes('class="skip-link"') && html.includes('href="#content"')), "skip link");
  add("landmarks", pages.every((html) => html.includes("<main") && html.includes("<header") && html.includes("<footer")), "header main footer");
  add("viewport", pages.every((html) => html.includes('name="viewport" content="width=device-width, initial-scale=1"')), "viewport");
  add("lang", pages.every((html) => /<html lang="[a-z]{2}">/.test(html)), "html lang");
  add("single-h1", pages.every((html) => html.match(/<h1>/g)?.length === 1), "one h1");
  add("focus-visible", css.includes(":focus-visible"), "focus-visible outline");
  add("reduced-motion", css.includes("prefers-reduced-motion"), "reduced motion");
  add("font-size", css.includes("font-size: 18px"), "body 18px");
  add("tap-targets", css.includes("min-height: 44px"), "44px targets");
  add("bottom-bar", css.includes(".bottom-bar") && pages.every((html) => html.includes('class="bottom-bar"')), "mobile bar");
  add("image-dimensions", pages.every((html) => html.includes('property="og:image:width" content="1200"') && html.includes('content="630"')), "og dimensions");
  const htmlBytes = Math.max(...pages.map((html) => Buffer.byteLength(html)));
  const cssBytes = Buffer.byteLength(css);
  const js = await readFile(path.join(siteDir, "assets", "machines.js"), "utf8").catch(() => "");
  const jsBytes = Buffer.byteLength(js);
  const scripts = Math.max(...pages.map((html) => html.match(/<script[^>]+src=/g)?.length ?? 0));
  const budget = brief.gates.performance;
  const budgetOk = htmlBytes <= budget.max_html_bytes && cssBytes <= budget.max_css_bytes && jsBytes <= budget.max_js_bytes && scripts <= budget.max_external_scripts;
  add("performance-budget", budgetOk, `html ${htmlBytes}, css ${cssBytes}, js ${jsBytes}, scripts ${scripts}`);
  const machine = await stat(path.join(siteDir, ".well-known", "yyds-machines.json")).then(() => true).catch(() => false);
  const machineNeeded = brief.conversion.checkout === "static-demo";
  add(
    "checkout-machine",
    !machineNeeded || (machine && js.includes("payment-demo") && pages.some((html) => html.includes('data-machine="checkout"'))),
    machineNeeded ? "static demo state machine" : "checkout disabled"
  );
  add("wechat-layout", css.includes("@media (max-width: 800px)") && pages.every((html) => html.includes("width=device-width")), "narrow layout and viewport, no hover-only content");
  return checks;
}
