import type { Brief, Intent, Language } from "../brief/types.js";
import { ENCODED } from "../pillars/thresholds.js";
import { hostSlug, isHostname, titleFromHost } from "../util.js";
import { selectCatalog } from "./catalogs.js";
import { topUp } from "./prose.js";

export interface Decision {
  field: string;
  source: string;
  detail: string;
}

export interface ExpandInput {
  industry?: string;
  topic?: string;
  domain?: string;
  scheme?: "https" | "http";
  mode?: "local" | "production";
  server?: Partial<Brief["server"]>;
}

export function materialize(input: ExpandInput): { brief: Brief; decisions: Decision[] } {
  const decisions: Decision[] = [];
  const industry = input.industry?.trim() || "general";
  if (!input.industry?.trim()) {
    decisions.push({ field: "project.industry", source: "encoded-default", detail: "Missing industry became general." });
  }
  const host = input.domain?.trim() ?? "";
  if (!isHostname(host)) {
    throw new Error("domain is required and must be a hostname such as example.com. yyds-bot will not invent one.");
  }
  const brand = titleFromHost(host);
  const topic = input.topic?.trim() || industry;
  if (!input.topic?.trim()) {
    decisions.push({ field: "project.topic", source: "encoded-default", detail: `Topic defaulted to industry “${topic}”.` });
  }
  const mode = input.mode ?? "local";
  if (!input.mode) {
    decisions.push({ field: "mode", source: "encoded-default", detail: "Server mode defaulted to local dry-run. No SSH is attempted." });
  }
  const scheme = input.scheme ?? "https";
  if (!input.scheme) decisions.push({ field: "domain.scheme", source: "encoded-default", detail: "Scheme defaulted to https." });

  const catalog = selectCatalog(industry, topic, brand);
  decisions.push({
    field: "preset",
    source: `preset:${catalog.id}`,
    detail: `Theme ${catalog.theme}, compliance ${catalog.compliance}, ymyl ${catalog.ymyl}.`
  });
  decisions.push({
    field: "languages",
    source: "encoded-default",
    detail: "Languages defaulted to English at / and Chinese at /zh from ui pack en-zh-v1."
  });
  decisions.push({
    field: "brand.name",
    source: "derived-from-domain",
    detail: `Brand “${brand}” derived from ${host}.`
  });

  const languages = ENCODED.languages.map((lang) => ({ ...lang })) as Language[];
  const originHost = host;
  const aliases = [
    { host: `www.${host.replace(/^www\./, "")}`, action: "redirect_301" as const },
    { host: `shop.${host.replace(/^www\./, "")}`, action: "canonical_only" as const }
  ].filter((alias) => alias.host !== originHost);
  decisions.push({
    field: "domain.aliases",
    source: "encoded-default",
    detail: "www redirects to the canonical host. shop is an alias that canonicalizes back, so weight stays on one host."
  });

  const intents: Intent[] = [
    { id: "home", kind: "home", query: { en: `${brand} ${topic}`, zh: `${brand} ${topic}` } },
    { id: "faq", kind: "faq", query: { en: `${brand} faq`, zh: `${brand} 常见问题` } }
  ];
  for (const entity of catalog.entities) {
    intents.push({
      id: `entity-${entity.id}`,
      kind: "entity",
      entity: entity.id,
      query: { en: `${brand} ${entity.name.en}`, zh: `${brand} ${entity.name.zh}` }
    });
    for (const attr of entity.attributes) {
      intents.push({
        id: `${entity.id}-${attr.id}`,
        kind: "attribute",
        entity: entity.id,
        attribute: attr.id,
        query: { en: `${entity.name.en} ${attr.name.en}`, zh: `${entity.name.zh} ${attr.name.zh}` }
      });
    }
  }
  for (const offer of catalog.offers) {
    if (offer.visibility !== "public") continue;
    intents.push({
      id: `offer-${offer.id}`,
      kind: "offer",
      offer: offer.id,
      query: { en: `${offer.name.en} price`, zh: `${offer.name.zh} 价格` }
    });
  }

  const brief: Brief = {
    version: "1",
    mode,
    project: {
      id: hostSlug(host),
      name: brand,
      industry,
      topic,
      ymyl: catalog.ymyl,
      human_review_approved: false,
      updated: ENCODED.updated
    },
    compliance: {
      profile: catalog.compliance,
      notes: {
        en: topUp("en", "compliance", catalog.editorial.en, 40),
        zh: topUp("zh", "compliance", catalog.editorial.zh, 40)
      }
    },
    schema_org: {
      organization_type: catalog.organizationType,
      person_type: catalog.personType,
      offer_type: catalog.offerType
    },
    languages,
    domain: { scheme, canonical_host: host, aliases },
    brand: {
      name: brand,
      tagline: catalog.tagline,
      description: catalog.description,
      about: { en: topUp("en", "about", catalog.about.en, ENCODED.gates.min_words.trust), zh: topUp("zh", "about", catalog.about.zh, ENCODED.gates.min_words.trust) },
      editorial_policy: {
        en: topUp("en", "editorial", catalog.editorial.en, ENCODED.gates.min_words.trust),
        zh: topUp("zh", "editorial", catalog.editorial.zh, ENCODED.gates.min_words.trust)
      },
      contact: {
        email: { visibility: "public", value: `hello@${host}`, value_env: null, placeholder: null },
        phone: catalog.phone,
        address: {
          visibility: "public",
          value: { en: `${brand}, published at ${host}`, zh: `${brand}，站点 ${host}` },
          value_env: null,
          placeholder: null
        }
      },
      author: {
        id: "author",
        name: catalog.authorName,
        job_title: catalog.authorTitle,
        bio: { en: topUp("en", "author", catalog.bio.en, ENCODED.gates.min_words.trust), zh: topUp("zh", "author", catalog.bio.zh, ENCODED.gates.min_words.trust) },
        credentials: catalog.credentialsText,
        same_as: [],
        credential: catalog.credential
      }
    },
    design: { theme: catalog.theme, token_overrides: {} },
    ui_pack: "en-zh-v1",
    ui_overrides: {},
    conversion: { checkout: catalog.offers.some((offer) => offer.visibility === "public") ? "static-demo" : "none" },
    ai: {
      markdown_mirror: true,
      llms_txt: true,
      llms_full_txt: true,
      per_entity_llms: true,
      openapi: true,
      mcp_descriptor: true,
      crawler_preset: "search-and-ai-2026"
    },
    server: {
      ssh_host: input.server?.ssh_host || ENCODED.server.ssh_host,
      ssh_user: input.server?.ssh_user || ENCODED.server.ssh_user,
      ssh_port: input.server?.ssh_port || ENCODED.server.ssh_port,
      web_root: input.server?.web_root || `/var/www/${hostSlug(host)}`
    },
    cloudflare: {
      enabled: false,
      token_env: ENCODED.cloudflare.token_env,
      zone_id_env: ENCODED.cloudflare.zone_id_env,
      proxied: false
    },
    llm: {
      enabled: false,
      base_url_env: ENCODED.llm.base_url_env,
      api_key_env: ENCODED.llm.api_key_env,
      model: ENCODED.llm.model
    },
    index: {
      live_submit: false,
      indexnow: { enabled: true, key_env: ENCODED.index.indexnow_key_env },
      google_search_console: {
        enabled: true,
        credentials_env: ENCODED.index.gsc_credentials_env,
        site_url: `${scheme}://${host}/`
      },
      baidu: { enabled: true, token_env: ENCODED.index.baidu_token_env, site: `${scheme}://${host}/` },
      wechat_miniprogram: { enabled: false },
      on_missing_credentials: ENCODED.index.on_missing_credentials
    },
    analytics: { provider: "none" },
    observe: { mode: "fixture", fixture: "fixtures/gsc.json", min_impressions: 10 },
    gates: {
      min_intents: ENCODED.gates.min_intents,
      min_words: { ...ENCODED.gates.min_words },
      thin_content_words: ENCODED.gates.thin_content_words,
      max_similarity: ENCODED.gates.max_similarity,
      performance: { ...ENCODED.gates.performance }
    },
    thresholds: { ...ENCODED.thresholds },
    offers: catalog.offers.map((offer) => ({
      ...offer,
      description: {
        en: topUp("en", offer.id, offer.description.en, ENCODED.gates.min_words.offer),
        zh: topUp("zh", offer.id, offer.description.zh, ENCODED.gates.min_words.offer)
      }
    })),
    entities: catalog.entities.map((entity) => ({
      ...entity,
      summary: {
        en: topUp("en", entity.id, entity.summary.en, ENCODED.gates.min_words.entity),
        zh: topUp("zh", entity.id, entity.summary.zh, ENCODED.gates.min_words.entity)
      }
    })),
    relations: catalog.relations,
    intents,
    backlog: { attributes: catalog.backlog },
    home: {
      intro: {
        en: topUp("en", "home", catalog.homeIntro.en, ENCODED.gates.min_words.home),
        zh: topUp("zh", "home", catalog.homeIntro.zh, ENCODED.gates.min_words.home)
      }
    }
  };

  if (!input.server?.ssh_host) {
    decisions.push({
      field: "server.ssh_host",
      source: "encoded-default",
      detail: `SSH host left as documentation address ${ENCODED.server.ssh_host} (TEST-NET-3). Local mode does not connect.`
    });
  }
  decisions.push({
    field: "llm.enabled",
    source: "encoded-policy",
    detail: "Page bodies stay data-driven. The LLM may only adjust tagline and home intro during expand, and only when env vars exist."
  });
  decisions.push({
    field: "index.live_submit",
    source: "encoded-default",
    detail: "Indexing is planned, not sent. YMYL pushes stay on hold until human_review_approved is true."
  });
  decisions.push({
    field: "project.human_review_approved",
    source: "encoded-default",
    detail: catalog.ymyl
      ? "YMYL site ships crawlable and labeled unreviewed. No question is asked; index push is held."
      : "Non-YMYL demo does not claim a human review it did not have."
  });
  return { brief, decisions };
}

export function gscFixture(brief: Brief): { synthetic: true; rows: { query: string; page: string; clicks: number; impressions: number; position: number }[] } {
  const covered = brief.intents[0]?.query.en ?? brief.project.name;
  const gap = brief.backlog.attributes[0]?.query.en ?? `${brief.project.industry} follow-up question`;
  const home = `${brief.domain.scheme}://${brief.domain.canonical_host}/`;
  return {
    synthetic: true,
    rows: [
      { query: covered, page: home, clicks: 3, impressions: 40, position: 8 },
      { query: gap, page: home, clicks: 0, impressions: 22, position: 18 }
    ]
  };
}
