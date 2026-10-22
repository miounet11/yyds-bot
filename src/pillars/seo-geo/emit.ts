import type { Brief } from "../../brief/types.js";
import { SEARCH_AND_AI_2026 } from "../../crawlers.js";
import type { Page } from "../../site/model.js";
import { describedBy } from "../ui/html.js";
import { absUrl, urlToFile } from "../../util.js";

export function renderMarkdown(page: Page): string {
  const facts = page.facts.length
    ? `\n\n## Facts\n\n| Fact | Value | Source |\n| --- | --- | --- |\n${page.facts
        .map((fact) => `| ${fact.label} | ${fact.value} | [${fact.sourceTitle}](${fact.sourceUrl}) |`)
        .join("\n")}`
    : "";
  const faqs = page.faqs.length ? `\n\n## FAQ\n\n${page.faqs.map((item) => `### ${item.q}\n\n${item.a}`).join("\n\n")}` : "";
  const sources = page.sources.length
    ? `\n\n## Sources\n\n${page.sources.map((source) => `- [${source.title}](${source.url}) — ${source.publisher}`).join("\n")}`
    : "";
  return `# ${page.h1}\n\n> ${page.summary}\n\n${page.updated}${facts}\n\n${page.paragraphs.join("\n\n")}${faqs}${sources}\n`;
}

export function renderRobots(brief: Brief): string {
  const sitemap = absUrl(brief.domain.scheme, brief.domain.canonical_host, "/sitemap.xml");
  const lines = ["User-agent: *", "Allow: /", "Disallow: /search/", "Disallow: /zh/search/", "", `Sitemap: ${sitemap}`, ""];
  for (const agent of SEARCH_AND_AI_2026) {
    lines.push(`User-agent: ${agent}`, "Allow: /", "");
  }
  return lines.join("\n");
}

export function renderSitemap(brief: Brief, pages: Page[]): string {
  const urls = pages
    .filter((page) => !page.noindex)
    .map((page) => {
      const loc = absUrl(brief.domain.scheme, brief.domain.canonical_host, page.path);
      return `  <url><loc>${loc}</loc><lastmod>${page.updated}</lastmod></url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function linkList(brief: Brief, pages: Page[]): string {
  return pages
    .filter((page) => !page.noindex)
    .map((page) => {
      const md = absUrl(brief.domain.scheme, brief.domain.canonical_host, page.path === "/" ? "/index.md" : `${page.path}index.md`);
      return `- [${page.title}](${md}): ${page.summary.replace(/\s+/g, " ").slice(0, 180)}`;
    })
    .join("\n");
}

export function renderLlms(brief: Brief, _pages: Page[], scope: Page[]): string {
  const offers = brief.offers
    .filter((offer) => offer.visibility === "public")
    .map((offer) => {
      const sample = scope[0];
      const prefix = brief.languages.find((lang) => lang.code === sample?.lang)?.url_prefix ?? "/";
      const path = prefix === "/" ? `/offers/${offer.id}/` : `${prefix.replace(/\/$/, "")}/offers/${offer.id}/`;
      const url = absUrl(brief.domain.scheme, brief.domain.canonical_host, path);
      const lang = sample?.lang ?? "en";
      return `- [${offer.name[lang]}](${url}): ${offer.price} ${offer.currency} | ${offer.specialty[lang]}`;
    })
    .join("\n");
  return `# ${brief.brand.name}\n\n> ${brief.brand.description[scope[0]?.lang ?? "en"]}\n\n${brief.brand.editorial_policy[scope[0]?.lang ?? "en"]}\n\n## Pages\n\n${linkList(brief, scope)}\n\n## Offers\n\n${offers}\n`;
}

export function renderLlmsFull(brief: Brief, pages: Page[]): string {
  return pages
    .filter((page) => !page.noindex)
    .map((page) => `# ${absUrl(brief.domain.scheme, brief.domain.canonical_host, page.path)}\n\n${renderMarkdown(page)}`)
    .join("\n");
}

export function languagePages(_brief: Brief, pages: Page[], lang: string): Page[] {
  return pages.filter((page) => page.lang === lang);
}

export function entityPages(pages: Page[], entityId: string, lang: string): Page[] {
  return pages.filter((page) => page.lang === lang && (page.entityId === entityId || page.key === `entity:${entityId}`));
}

export function llmsPath(urlPath: string): string {
  if (urlPath === "/") return "llms.txt";
  return `${urlPath.replace(/^\/|\/$/g, "")}/llms.txt`;
}

export { describedBy, urlToFile };
