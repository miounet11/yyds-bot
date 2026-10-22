import { stringify } from "yaml";
import type { Brief } from "../brief/types.js";
import { CSS_VAR, resolveTokens } from "../design/themes.js";
import { renderMcp, renderMachinesDescriptor, renderOffersApi, renderOpenApi } from "../pillars/ai/emit.js";
import { entityPages, languagePages, llmsPath, renderLlms, renderLlmsFull, renderMarkdown, renderRobots, renderSitemap } from "../pillars/seo-geo/emit.js";
import { buildGraph } from "../pillars/seo-geo/jsonld.js";
import { renderCss } from "../pillars/ui/css.js";
import { MACHINES_JS, renderHtml } from "../pillars/ui/html.js";
import { renderOgPng } from "../pillars/ui/og.js";
import { urlToFile } from "../util.js";
import { buildModel, type Page } from "./model.js";

export interface Assembled {
  pages: Page[];
  files: Map<string, string | Buffer>;
}

export function assemble(brief: Brief): Assembled {
  const pages = buildModel(brief);
  const tokens = resolveTokens(brief.design.theme, brief.design.token_overrides);
  const files = new Map<string, string | Buffer>();
  for (const page of pages) {
    const graph = buildGraph(brief, page);
    files.set(urlToFile(page.path, "index.html"), renderHtml(brief, page, pages, graph, tokens));
    if (brief.ai.markdown_mirror) files.set(urlToFile(page.path, "index.md"), renderMarkdown(page));
  }
  files.set("robots.txt", renderRobots(brief));
  files.set("sitemap.xml", renderSitemap(brief, pages));
  files.set("assets/site.css", renderCss(tokens));
  files.set("assets/machines.js", MACHINES_JS);
  files.set("assets/og.png", renderOgPng(tokens.colorPrimary, tokens.colorAccent));
  if (brief.ai.llms_txt || brief.ai.llms_full_txt) {
    for (const language of brief.languages) {
      const scoped = languagePages(brief, pages, language.code);
      const base = language.url_prefix === "/" ? "" : language.url_prefix.replace(/^\/|\/$/g, "");
      if (brief.ai.llms_txt) files.set(base ? `${base}/llms.txt` : "llms.txt", renderLlms(brief, pages, scoped));
      if (brief.ai.llms_full_txt) files.set(base ? `${base}/llms-full.txt` : "llms-full.txt", renderLlmsFull(brief, scoped));
      if (brief.ai.per_entity_llms) {
        for (const entity of brief.entities) {
          const entityScoped = entityPages(pages, entity.id, language.code);
          const entityBase = language.url_prefix === "/" ? `entities/${entity.id}` : `${base}/entities/${entity.id}`;
          files.set(`${entityBase}/llms.txt`, renderLlms(brief, pages, entityScoped));
          files.set(`${entityBase}/llms-full.txt`, renderLlmsFull(brief, entityScoped));
        }
      }
    }
  }
  if (brief.ai.openapi) {
    const catalog = renderOffersApi(brief);
    files.set("openapi.json", JSON.stringify(renderOpenApi(brief), null, 2));
    files.set("api/offers.json", JSON.stringify(catalog, null, 2));
    for (const offer of brief.offers.filter((item) => item.visibility === "public")) {
      const one = (catalog as { offers: { id: string }[] }).offers.find((item) => item.id === offer.id);
      files.set(`api/offers/${offer.id}.json`, JSON.stringify(one, null, 2));
    }
  }
  if (brief.ai.mcp_descriptor) files.set("mcp.json", JSON.stringify(renderMcp(brief), null, 2));
  files.set(".well-known/yyds-machines.json", JSON.stringify(renderMachinesDescriptor(), null, 2));
  files.set(
    ".well-known/yyds-design.json",
    JSON.stringify({ theme: brief.design.theme, tokens, cssVars: CSS_VAR }, null, 2)
  );
  files.set("brief.published.yaml", stringify(brief));
  return { pages, files };
}

export { llmsPath };
