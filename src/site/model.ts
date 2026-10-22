import type { Brief } from "../brief/types.js";
import { EN_ZH_V1 } from "../i18n/en-zh-v1.js";
import { topUp } from "../presets/prose.js";
import { pagePath } from "../util.js";

export type PageKind = "home" | "entity" | "attribute" | "offer" | "offer-index" | "entity-index" | "trust" | "faq" | "search";

export interface Page {
  key: string;
  kind: PageKind;
  lang: string;
  locale: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  summary: string;
  paragraphs: string[];
  facts: { label: string; value: string; sourceTitle: string; sourceUrl: string }[];
  faqs: { q: string; a: string }[];
  sources: { title: string; url: string; publisher: string }[];
  breadcrumbs: { name: string; path: string }[];
  updated: string;
  noindex: boolean;
  entityId?: string;
  attributeId?: string;
  offerId?: string;
  trust?: "about" | "author" | "contact" | "editorial";
  placeholder: boolean;
}

export function ui(brief: Brief, key: string, lang: string): string {
  return brief.ui_overrides[key]?.[lang] || EN_ZH_V1[key]?.[lang] || key;
}

export function publicOffers(brief: Brief): Brief["offers"] {
  return brief.offers.filter((offer) => offer.visibility === "public");
}

export function phoneText(brief: Brief, lang: string): string | null {
  const phone = brief.brand.contact.phone;
  if (phone.visibility === "hidden") return null;
  if (phone.visibility === "lead_only") return phone.placeholder?.[lang] ?? ui(brief, "lead_only_cta", lang);
  return phone.value;
}

export function addressText(brief: Brief, lang: string): string | null {
  const address = brief.brand.contact.address;
  if (address.visibility !== "public" || !address.value) return null;
  return address.value[lang] ?? null;
}

function crumbs(brief: Brief, lang: string, prefix: string, tail: { name: string; path: string }[]): { name: string; path: string }[] {
  return [{ name: ui(brief, "breadcrumb_home", lang), path: pagePath(prefix) }, ...tail];
}

export function buildModel(brief: Brief): Page[] {
  const pages: Page[] = [];
  const offers = publicOffers(brief);
  for (const language of brief.languages) {
    const lang = language.code;
    const prefix = language.url_prefix;
    const homePath = pagePath(prefix);
    const entityIndex = pagePath(prefix, "entities");
    const offerIndex = pagePath(prefix, "offers");
    const push = (page: Page) => pages.push(page);

    push({
      key: "home",
      kind: "home",
      lang,
      locale: language.locale,
      path: homePath,
      title: `${brief.brand.name} — ${brief.brand.tagline[lang]}`,
      description: brief.brand.description[lang],
      h1: `${brief.brand.name}: ${brief.project.topic}`,
      summary: brief.home.intro[lang],
      paragraphs: [brief.brand.description[lang]],
      facts: [],
      faqs: [],
      sources: [],
      breadcrumbs: [{ name: ui(brief, "breadcrumb_home", lang), path: homePath }],
      updated: brief.project.updated,
      noindex: false,
      placeholder: false
    });

    const entityLinks = brief.entities
      .map((entity) => `${entity.name[lang]} (${entity.attributes.map((attr) => attr.name[lang]).join(", ")})`)
      .join(". ");
    push({
      key: "entities",
      kind: "entity-index",
      lang,
      locale: language.locale,
      path: entityIndex,
      title: `${ui(brief, "nav_entities", lang)} — ${brief.brand.name}`,
      description: entityLinks,
      h1: ui(brief, "entities_intro", lang),
      summary: topUp(lang as "en" | "zh", `entity-index-${lang}`, `${brief.brand.name} splits ${brief.project.topic} into separate entity pages. ${entityLinks}`, 90),
      paragraphs: [],
      facts: [],
      faqs: [],
      sources: [],
      breadcrumbs: crumbs(brief, lang, prefix, [{ name: ui(brief, "nav_entities", lang), path: entityIndex }]),
      updated: brief.project.updated,
      noindex: false,
      placeholder: false
    });

    for (const entity of brief.entities) {
      const entityPath = pagePath(prefix, `entities/${entity.id}`);
      push({
        key: `entity:${entity.id}`,
        kind: "entity",
        lang,
        locale: language.locale,
        path: entityPath,
        title: `${entity.name[lang]} — ${brief.brand.name}`,
        description: entity.summary[lang],
        h1: entity.name[lang],
        summary: entity.summary[lang],
        paragraphs: [],
        facts: [],
        faqs: [],
        sources: entity.attributes[0]?.sources ?? [],
        breadcrumbs: crumbs(brief, lang, prefix, [
          { name: ui(brief, "nav_entities", lang), path: entityIndex },
          { name: entity.name[lang], path: entityPath }
        ]),
        updated: entity.updated,
        noindex: false,
        entityId: entity.id,
        placeholder: entity.attributes.some((attr) => attr.sources.some((item) => item.url.includes("yyds-placeholder")))
      });
      for (const attr of entity.attributes) {
        const attrPath = pagePath(prefix, `entities/${entity.id}/${attr.id}`);
        const placeholder = attr.sources.some((item) => item.url.includes("yyds-placeholder"));
        push({
          key: `attribute:${entity.id}:${attr.id}`,
          kind: "attribute",
          lang,
          locale: language.locale,
          path: attrPath,
          title: `${entity.name[lang]} — ${attr.name[lang]} — ${brief.brand.name}`,
          description: attr.summary[lang],
          h1: `${entity.name[lang]}: ${attr.name[lang]}`,
          summary: attr.summary[lang],
          paragraphs: attr.body[lang].split(/\n+/).map((part) => part.trim()).filter(Boolean),
          facts: attr.facts.map((item) => ({
            label: item.label[lang],
            value: item.value[lang],
            sourceTitle: item.source_title,
            sourceUrl: item.source_url
          })),
          faqs: attr.faqs.map((item) => ({ q: item.q[lang], a: item.a[lang] })),
          sources: attr.sources,
          breadcrumbs: crumbs(brief, lang, prefix, [
            { name: ui(brief, "nav_entities", lang), path: entityIndex },
            { name: entity.name[lang], path: entityPath },
            { name: attr.name[lang], path: attrPath }
          ]),
          updated: attr.updated,
          noindex: false,
          entityId: entity.id,
          attributeId: attr.id,
          placeholder
        });
      }
    }

    push({
      key: "offers",
      kind: "offer-index",
      lang,
      locale: language.locale,
      path: offerIndex,
      title: `${ui(brief, "nav_offers", lang)} — ${brief.brand.name}`,
      description: offers.map((offer) => `${offer.name[lang]} ${offer.price} ${offer.currency}`).join(". "),
      h1: ui(brief, "offers_intro", lang),
      summary: topUp(
        lang as "en" | "zh",
        `offer-index-${lang}`,
        offers.map((offer) => `${offer.name[lang]} costs ${offer.price} ${offer.currency}. ${offer.specialty[lang]}`).join(" "),
        70
      ),
      paragraphs: [],
      facts: [],
      faqs: [],
      sources: [],
      breadcrumbs: crumbs(brief, lang, prefix, [{ name: ui(brief, "nav_offers", lang), path: offerIndex }]),
      updated: brief.project.updated,
      noindex: false,
      placeholder: false
    });

    for (const offer of offers) {
      const offerPath = pagePath(prefix, `offers/${offer.id}`);
      push({
        key: `offer:${offer.id}`,
        kind: "offer",
        lang,
        locale: language.locale,
        path: offerPath,
        title: `${offer.name[lang]} — ${offer.price} ${offer.currency}`,
        description: offer.description[lang],
        h1: offer.name[lang],
        summary: `${offer.specialty[lang]}. ${ui(brief, "price", lang)}: ${offer.price} ${offer.currency}.`,
        paragraphs: [offer.description[lang], offer.delivery[lang]],
        facts: [
          { label: ui(brief, "price", lang), value: `${offer.price} ${offer.currency}`, sourceTitle: brief.brand.name, sourceUrl: offerPath },
          { label: ui(brief, "specialty", lang), value: offer.specialty[lang], sourceTitle: brief.brand.name, sourceUrl: offerPath },
          { label: ui(brief, "delivery", lang), value: offer.delivery[lang], sourceTitle: brief.brand.name, sourceUrl: offerPath }
        ],
        faqs: [
          {
            q: lang === "zh" ? `${offer.name.zh}怎么交付？` : `How is ${offer.name.en} delivered?`,
            a: offer.delivery[lang]
          }
        ],
        sources: [],
        breadcrumbs: crumbs(brief, lang, prefix, [
          { name: ui(brief, "nav_offers", lang), path: offerIndex },
          { name: offer.name[lang], path: offerPath }
        ]),
        updated: offer.updated,
        noindex: false,
        offerId: offer.id,
        placeholder: false
      });
    }

    const trust = [
      ["about", "nav_about", brief.brand.about[lang], "about"],
      ["author", "nav_author", `${brief.brand.author.name}. ${brief.brand.author.job_title[lang]}. ${brief.brand.author.bio[lang]} ${brief.brand.author.credentials[lang]}`, "author"],
      [
        "contact",
        "nav_contact",
        topUp(
          lang as "en" | "zh",
          `contact-${lang}`,
          `${ui(brief, "contact_intro", lang)} Email ${brief.brand.contact.email.value}. ${phoneText(brief, lang) ?? ""} ${addressText(brief, lang) ?? ""}`,
          brief.gates.min_words.trust
        ),
        "contact"
      ],
      ["editorial", "nav_editorial", brief.brand.editorial_policy[lang], "editorial"]
    ] as const;
    for (const [slug, labelKey, summary, trustKind] of trust) {
      const trustPath = pagePath(prefix, slug === "editorial" ? "editorial-policy" : slug === "author" ? "author" : slug);
      push({
        key: `trust:${trustKind}`,
        kind: "trust",
        lang,
        locale: language.locale,
        path: trustPath,
        title: `${ui(brief, labelKey, lang)} — ${brief.brand.name}`,
        description: summary.slice(0, 180),
        h1: ui(brief, labelKey, lang),
        summary,
        paragraphs: [],
        facts: [],
        faqs: [],
        sources: [],
        breadcrumbs: crumbs(brief, lang, prefix, [{ name: ui(brief, labelKey, lang), path: trustPath }]),
        updated: brief.project.updated,
        noindex: false,
        trust: trustKind,
        placeholder: summary.includes("placeholder") || summary.includes("yyds-placeholder")
      });
    }

    const faqPath = pagePath(prefix, "faq");
    const faqItems = brief.entities.flatMap((entity) =>
      entity.attributes.flatMap((attr) => attr.faqs.map((item) => ({ q: item.q[lang], a: item.a[lang] })))
    );
    push({
      key: "faq",
      kind: "faq",
      lang,
      locale: language.locale,
      path: faqPath,
      title: `${ui(brief, "nav_faq", lang)} — ${brief.brand.name}`,
      description: brief.brand.description[lang],
      h1: ui(brief, "faq_label", lang),
      summary: topUp(lang as "en" | "zh", `faq-${lang}`, `${brief.brand.name} answers ${faqItems.length} questions about ${brief.project.topic} on this page and on the attribute pages.`, brief.gates.min_words.faq),
      paragraphs: [],
      facts: [],
      faqs: faqItems,
      sources: [],
      breadcrumbs: crumbs(brief, lang, prefix, [{ name: ui(brief, "nav_faq", lang), path: faqPath }]),
      updated: brief.project.updated,
      noindex: false,
      placeholder: false
    });

    const searchPath = pagePath(prefix, "search");
    push({
      key: "search",
      kind: "search",
      lang,
      locale: language.locale,
      path: searchPath,
      title: `${ui(brief, "nav_search", lang)} — ${brief.brand.name}`,
      description: ui(brief, "search_label", lang),
      h1: ui(brief, "search_label", lang),
      summary: ui(brief, "search_label", lang),
      paragraphs: [],
      facts: [],
      faqs: [],
      sources: [],
      breadcrumbs: crumbs(brief, lang, prefix, [{ name: ui(brief, "nav_search", lang), path: searchPath }]),
      updated: brief.project.updated,
      noindex: true,
      placeholder: false
    });
  }
  return pages;
}

export function equivalents(pages: Page[], page: Page): Page[] {
  return pages.filter((item) => item.key === page.key);
}
