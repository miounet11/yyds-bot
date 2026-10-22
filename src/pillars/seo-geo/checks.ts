import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { PROFILES } from "../../compliance/profiles.js";
import { contentTokens, jaccard, shingles } from "../../content/similarity.js";
import { countWords } from "../../content/words.js";
import { SEARCH_AND_AI_2026 } from "../../crawlers.js";
import type { Brief } from "../../brief/types.js";
import type { Check } from "../types.js";

async function walk(dir: string): Promise<string[]> {
  const found: string[] = [];
  async function visit(current: string) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(next);
      else found.push(next);
    }
  }
  await visit(dir);
  return found;
}

function textOf(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map((match) => match[1]?.replace(/<[^>]+>/g, " ") ?? "");
}

async function htmlFiles(siteDir: string): Promise<{ rel: string; html: string }[]> {
  const files = await walk(siteDir);
  const htmls = files.filter((file) => file.endsWith("index.html"));
  const out = [];
  for (const file of htmls) {
    out.push({ rel: path.relative(siteDir, file).replaceAll("\\", "/"), html: await readFile(file, "utf8") });
  }
  return out;
}

export async function seoChecks(brief: Brief, siteDir: string, infraDir: string, reportsDir: string): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (id: string, pass: boolean, detail: string) => checks.push({ id, pillar: "seo_geo", pass, detail });
  const pages = await htmlFiles(siteDir);
  const robotsPath = path.join(siteDir, "robots.txt");
  const robots = await readFile(robotsPath, "utf8").catch(() => "");
  add("robots-txt", robots.includes("Sitemap:") && robots.includes("User-agent: *"), robots ? "robots.txt present" : "missing robots.txt");
  const missingBots = SEARCH_AND_AI_2026.filter((bot) => !robots.includes(bot));
  add("robots-ai-crawlers", missingBots.length === 0, missingBots.length ? `missing ${missingBots.join(", ")}` : "crawler preset allowed");
  const sitemap = await readFile(path.join(siteDir, "sitemap.xml"), "utf8").catch(() => "");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const indexable = pages.filter((page) => !page.html.includes('content="noindex'));
  const missingFiles = [];
  for (const loc of locs) {
    const url = new URL(loc);
    const rel = url.pathname === "/" ? "index.html" : `${url.pathname.replace(/^\/|\/$/g, "")}/index.html`;
    if (!pages.some((page) => page.rel === rel)) missingFiles.push(loc);
  }
  const missingLocs = [];
  for (const page of indexable) {
    const pathname = page.rel === "index.html" ? "/" : `/${page.rel.replace(/\/index\.html$/, "/")}`;
    const canonical = `${brief.domain.scheme}://${brief.domain.canonical_host}${pathname}`;
    if (!locs.includes(canonical)) missingLocs.push(canonical);
  }
  add("sitemap-bidirectional", locs.length > 0 && missingFiles.length === 0 && missingLocs.length === 0, `locs ${locs.length}, missing files ${missingFiles.length}, missing locs ${missingLocs.length}`);
  const badCanonical = indexable.filter((page) => {
    const href = page.html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
    return !href.includes(`://${brief.domain.canonical_host}/`) && !href.endsWith(`://${brief.domain.canonical_host}`);
  });
  add("canonical", badCanonical.length === 0, badCanonical.length ? badCanonical.map((page) => page.rel).join(", ") : "canonical host matches");
  const hreflangBad = indexable.filter((page) => {
    const tags = page.html.match(/hreflang="/g)?.length ?? 0;
    return tags < brief.languages.length + 1;
  });
  add("hreflang", hreflangBad.length === 0, hreflangBad.length ? "missing hreflang" : "hreflang and x-default present");
  const metaBad = indexable.filter((page) => !/name="description" content=".{10,}"/.test(page.html));
  add("meta-description", metaBad.length === 0, metaBad.length ? "short or missing description" : "descriptions present");
  const graphs = indexable.map((page) => {
    const raw = page.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "";
    try {
      return JSON.parse(raw) as { "@graph"?: Record<string, unknown>[] };
    } catch {
      return null;
    }
  });
  add("jsonld-graph", graphs.every((graph) => Array.isArray(graph?.["@graph"]) && graph?.["@graph"].length), "each indexable page has an @graph");
  const types = new Set<string>();
  const collect = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }
    const record = node as Record<string, unknown>;
    const value = record["@type"];
    for (const item of Array.isArray(value) ? value : [value]) if (typeof item === "string") types.add(item);
    for (const child of Object.values(record)) collect(child);
  };
  for (const graph of graphs) collect(graph);
  const required = ["WebSite", "SearchAction", "BreadcrumbList", "FAQPage", "Article", "Offer", brief.schema_org.organization_type, brief.schema_org.person_type];
  const missingTypes = required.filter((type) => !types.has(type));
  add("jsonld-types", missingTypes.length === 0, missingTypes.length ? `missing ${missingTypes.join(", ")}` : "required types present");
  const idProblems: string[] = [];
  for (const graph of graphs) {
    const nodes = graph?.["@graph"] ?? [];
    const ids = new Set(nodes.map((node) => node["@id"]).filter((id) => typeof id === "string"));
    for (const node of nodes) {
      if (typeof node["@id"] === "string" && !String(node["@id"]).startsWith("https://")) idProblems.push(String(node["@id"]));
      const author = node.author as { "@id"?: string } | undefined;
      const publisher = node.publisher as { "@id"?: string } | undefined;
      if (author?.["@id"] && !ids.has(author["@id"])) idProblems.push(author["@id"]);
      if (publisher?.["@id"] && !ids.has(publisher["@id"])) idProblems.push(publisher["@id"]);
    }
  }
  add("jsonld-ids", idProblems.length === 0, idProblems.length ? idProblems.slice(0, 5).join(", ") : "@id links resolve inside the page graph");
  const llms = await readFile(path.join(siteDir, "llms.txt"), "utf8").catch(() => "");
  add("llms-txt", llms.startsWith(`# ${brief.brand.name}`) && llms.includes("\n> ") && llms.includes("](") && llms.includes(".md"), "root llms.txt is an H1, blockquote, and markdown links");
  const full = await stat(path.join(siteDir, "llms-full.txt")).then(() => true).catch(() => false);
  add("llms-full", full, full ? "llms-full.txt present" : "missing llms-full.txt");
  const entityLlmsMissing = [];
  for (const entity of brief.entities) {
    if (!(await stat(path.join(siteDir, "entities", entity.id, "llms.txt")).then(() => true).catch(() => false))) entityLlmsMissing.push(entity.id);
  }
  add("per-entity-llms", entityLlmsMissing.length === 0, entityLlmsMissing.length ? entityLlmsMissing.join(", ") : "per-entity llms.txt present");
  const mdMissing: string[] = [];
  for (const page of indexable) {
    const md = page.rel === "index.html" ? "index.md" : page.rel.replace(/index\.html$/, "index.md");
    if (!(await stat(path.join(siteDir, md)).then(() => true).catch(() => false))) mdMissing.push(md);
  }
  add("markdown-mirror", mdMissing.length === 0, mdMissing.length ? mdMissing.slice(0, 6).join(", ") : "index.md beside indexable HTML");
  const relMissing = indexable.filter((page) => !page.html.includes('type="text/markdown"') || !page.html.includes('rel="describedby"'));
  add("markdown-rel", relMissing.length === 0, relMissing.length ? "missing markdown or describedby links" : "alternate markdown and describedby links");
  const answerMissing = indexable.filter((page) => !page.html.includes('class="answer-first"'));
  add("answer-first", answerMissing.length === 0, answerMissing.length ? "missing answer block" : "answer-first blocks present");
  const attributes = indexable.filter((page) => page.html.includes('data-page="attribute"'));
  add("fact-table", attributes.every((page) => page.html.includes("<table") && page.html.includes("<th")), "attribute pages use tables");
  const faqPages = indexable.filter((page) => page.html.includes('data-page="attribute"') || page.html.includes('data-page="faq"') || page.html.includes('data-page="offer"'));
  add("faq-dl", faqPages.every((page) => page.html.includes("<dl>") && page.html.includes("<dt>")), "FAQ blocks use dl");
  add("citations", attributes.every((page) => page.html.includes("<h2>") && /Sources|引用/.test(page.html) && page.html.includes("http")), "attribute pages cite sources");
  add("updated", indexable.every((page) => page.html.includes("<time datetime=")), "updated dates present");
  const eeat = ["about/index.html", "author/index.html", "contact/index.html", "editorial-policy/index.html"];
  add("eeat-pages", eeat.every((rel) => pages.some((page) => page.rel === rel)), "about, author, contact, editorial policy");
  const ogBad = indexable.filter((page) => !page.html.includes('property="og:title"') || !page.html.includes('property="og:image"') || !page.html.includes("/assets/og.png"));
  const ogFile = await stat(path.join(siteDir, "assets", "og.png")).then(() => true).catch(() => false);
  add("og-tags", ogBad.length === 0 && ogFile, ogFile ? "og tags and image" : "missing og image");
  const leaked: string[] = [];
  const blob = pages.map((page) => page.html).join("\n") + llms;
  for (const field of [brief.brand.contact.phone, brief.brand.contact.email, brief.brand.contact.address]) {
    if (field.visibility !== "public" && field.value_env) {
      const secret = process.env[field.value_env];
      if (secret && secret.length > 2 && blob.includes(secret)) leaked.push(field.value_env);
    }
  }
  add("visibility", leaked.length === 0, leaked.length ? `leaked ${leaked.join(", ")}` : "hidden values stayed out of the site");
  const thin: string[] = [];
  const short: string[] = [];
  for (const page of indexable) {
    const kind = page.html.match(/data-page="([^"]+)"/)?.[1] ?? "home";
    if (kind === "search") continue;
    const prose = textOf(page.html, /data-prose="[^"]*">([\s\S]*?)<\/p>/g).join(" ");
    const extra = textOf(page.html, /<dd>([\s\S]*?)<\/dd>/g).join(" ");
    const words = countWords(`${prose} ${extra}`);
    const floor =
      kind === "home" ? brief.gates.min_words.home :
      kind === "entity" || kind === "entity-index" ? brief.gates.min_words.entity :
      kind === "attribute" ? brief.gates.min_words.attribute :
      kind === "offer" || kind === "offer-index" ? brief.gates.min_words.offer :
      kind === "faq" ? brief.gates.min_words.faq :
      brief.gates.min_words.trust;
    if (words < floor) short.push(`${page.rel}:${words}<${floor}`);
    if (words < brief.gates.thin_content_words) thin.push(page.rel);
  }
  add("word-count", short.length === 0, short.slice(0, 6).join(", ") || "word floors met");
  add("thin-content", thin.length === 0, thin.join(", ") || "no thin pages");
  const byLang = new Map<string, string[]>();
  for (const page of indexable) {
    const lang = page.html.match(/<html lang="([^"]+)"/)?.[1] ?? "en";
    const prose = textOf(page.html, /data-prose="[^"]*">([\s\S]*?)<\/p>/g).join(" ");
    const list = byLang.get(lang) ?? [];
    list.push(prose);
    byLang.set(lang, list);
  }
  let worst = 0;
  let worstPair = "";
  for (const [lang, texts] of byLang) {
    const sets = texts.map((text) => shingles(contentTokens(text)));
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const score = jaccard(sets[i]!, sets[j]!);
        if (score > worst) {
          worst = score;
          worstPair = lang;
        }
      }
    }
  }
  add("similarity", worst <= brief.gates.max_similarity, `max jaccard ${worst.toFixed(3)} (${worstPair}) threshold ${brief.gates.max_similarity}`);
  const ymylHold = brief.project.ymyl && !brief.project.human_review_approved;
  const labeled = pages.some((page) => page.html.includes('data-ymyl="unreviewed"'));
  add("ymyl-policy", ymylHold ? labeled : pages.every((page) => !page.html.includes('data-ymyl="unreviewed"')), ymylHold ? "unreviewed YMYL is labeled; push is held later" : "not an unreviewed YMYL site");
  const banned = PROFILES[brief.compliance.profile].banned.filter((phrase) => blob.toLowerCase().includes(phrase.toLowerCase()));
  add("banned-phrases", banned.length === 0, banned.join(", ") || "no banned phrases");
  const placeholder = blob.includes("yyds-placeholder");
  const editorial = pages.find((page) => page.rel === "editorial-policy/index.html")?.html ?? "";
  add("placeholder-disclosure", !placeholder || editorial.toLowerCase().includes("placeholder"), placeholder ? "placeholders disclosed" : "no placeholders");
  const indexPlan = await readFile(path.join(reportsDir, "index-plan.json"), "utf8").catch(() => "");
  let planOk = false;
  try {
    const plan = JSON.parse(indexPlan) as { urls?: string[]; ymyl_hold?: boolean };
    planOk = Array.isArray(plan.urls) && plan.urls.length === locs.length && (!ymylHold || plan.ymyl_hold === true);
  } catch {
    planOk = false;
  }
  add("index-plan", planOk, planOk ? "index plan lists sitemap urls" : "index plan missing or ymyl hold not recorded");
  const nginx = await readFile(path.join(infraDir, "nginx.conf"), "utf8").catch(() => "");
  const aliasOk = brief.domain.aliases.every((alias) => nginx.includes(alias.host) && (alias.action === "redirect_301" ? nginx.includes("return 301") : nginx.includes("canonical_only")));
  add("alias-policy", aliasOk && nginx.includes(brief.domain.canonical_host), aliasOk ? "nginx encodes canonical policy" : "nginx alias policy incomplete");
  return checks;
}
