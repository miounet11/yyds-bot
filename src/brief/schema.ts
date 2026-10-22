import { PROFILES } from "../compliance/profiles.js";
import { TOKEN_KEYS } from "../design/themes.js";
import { UI_KEYS, EN_ZH_V1 } from "../i18n/en-zh-v1.js";
import { CRAWLER_PRESETS, COMPLIANCE_PROFILES, THEMES, type Brief, BriefError } from "./types.js";
import { isHostname, looksLikeSecret } from "../util.js";

export function assertBrief(brief: Brief): void {
  const errors = validateBrief(brief);
  if (errors.length) throw new BriefError(errors);
}

export function validateBrief(brief: Brief): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(message);
  if (brief.version !== "1") fail("version must be \"1\"");
  if (brief.mode !== "local" && brief.mode !== "production") fail("mode must be local or production");
  if (!brief.project?.id) fail("project.id is required");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(brief.project?.id ?? "")) fail("project.id must be a slug");
  if (typeof brief.project?.ymyl !== "boolean") fail("project.ymyl must be boolean");
  if (typeof brief.project?.human_review_approved !== "boolean") fail("project.human_review_approved must be boolean");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(brief.project?.updated ?? "")) fail("project.updated must be YYYY-MM-DD");
  if (!COMPLIANCE_PROFILES.includes(brief.compliance?.profile)) fail("compliance.profile is not a known profile");
  if (!THEMES.includes(brief.design?.theme)) fail("design.theme is not a known theme");
  for (const key of Object.keys(brief.design?.token_overrides ?? {})) {
    if (!TOKEN_KEYS.includes(key as (typeof TOKEN_KEYS)[number])) fail(`unknown design token override ${key}`);
  }
  if (brief.ui_pack !== "en-zh-v1") fail("ui_pack must be en-zh-v1");
  if (!CRAWLER_PRESETS.includes(brief.ai?.crawler_preset)) fail("ai.crawler_preset is unknown");
  if (!isHostname(brief.domain?.canonical_host ?? "")) fail("domain.canonical_host must be a hostname");
  const langs = brief.languages ?? [];
  if (!langs.length) fail("languages must not be empty");
  if (langs.filter((lang) => lang.default).length !== 1) fail("exactly one language must be default");
  const defaultLang = langs.find((lang) => lang.default);
  if (defaultLang && defaultLang.url_prefix !== "/") fail("the default language url_prefix must be /");
  const codes = langs.map((lang) => lang.code);
  if (new Set(codes).size !== codes.length) fail("language codes must be unique");
  for (const lang of langs) {
    for (const key of UI_KEYS) {
      const pack = EN_ZH_V1[key]?.[lang.code];
      const override = brief.ui_overrides?.[key]?.[lang.code];
      if (!pack && !override) fail(`language ${lang.code} is missing ui string ${key}`);
    }
  }
  const checkLocalized = (path: string, value: Record<string, string> | null | undefined, allowNull: boolean) => {
    if (value == null) {
      if (!allowNull) fail(`${path} is required`);
      return;
    }
    const keys = Object.keys(value);
    if (keys.length !== codes.length || codes.some((code) => typeof value[code] !== "string" || !value[code].trim())) {
      fail(`${path} must contain exactly the language codes ${codes.join(", ")}`);
    }
  };
  checkLocalized("brand.tagline", brief.brand?.tagline, false);
  checkLocalized("brand.description", brief.brand?.description, false);
  checkLocalized("brand.about", brief.brand?.about, false);
  checkLocalized("brand.editorial_policy", brief.brand?.editorial_policy, false);
  checkLocalized("home.intro", brief.home?.intro, false);
  checkLocalized("compliance.notes", brief.compliance?.notes, false);
  const phone = brief.brand?.contact?.phone;
  if (phone?.visibility === "public" && !phone.value) fail("public phone needs value");
  if (phone?.visibility !== "public" && phone?.value) fail("non-public phone must not store a value in the brief");
  if (phone?.visibility === "lead_only") checkLocalized("phone.placeholder", phone.placeholder, false);
  if (phone?.visibility !== "public" && !phone?.value_env) fail("non-public phone needs value_env");
  if (phone?.value && looksLikeSecret(phone.value)) fail("phone value looks like an API secret");
  for (const alias of brief.domain?.aliases ?? []) {
    if (!isHostname(alias.host)) fail(`alias ${alias.host} is not a hostname`);
    if (alias.host === brief.domain.canonical_host) fail("alias duplicates canonical host");
    if (alias.action !== "redirect_301" && alias.action !== "canonical_only") fail(`alias ${alias.host} has a bad action`);
  }
  const entityIds = new Set<string>();
  for (const entity of brief.entities ?? []) {
    if (entityIds.has(entity.id)) fail(`duplicate entity ${entity.id}`);
    entityIds.add(entity.id);
    const attrIds = new Set<string>();
    for (const attr of entity.attributes) {
      if (attrIds.has(attr.id)) fail(`duplicate attribute ${entity.id}/${attr.id}`);
      attrIds.add(attr.id);
      if (!attr.facts.length) fail(`${entity.id}/${attr.id} needs facts`);
      if (!attr.sources.length) fail(`${entity.id}/${attr.id} needs sources`);
      if (!attr.faqs.length) fail(`${entity.id}/${attr.id} needs faqs`);
      checkLocalized(`${entity.id}.${attr.id}.body`, attr.body, false);
    }
  }
  for (const offer of brief.offers ?? []) {
    if (!/^\d+\.\d{2}$/.test(offer.price)) fail(`offer ${offer.id} price must look like 12.00`);
    if (!/^[A-Z]{3}$/.test(offer.currency)) fail(`offer ${offer.id} currency must be ISO`);
  }
  if ((brief.intents?.length ?? 0) < (brief.gates?.min_intents ?? 1)) {
    fail(`intents ${brief.intents?.length ?? 0} < gates.min_intents ${brief.gates?.min_intents}`);
  }
  for (const intent of brief.intents ?? []) {
    if (intent.kind === "attribute") {
      const entity = brief.entities.find((item) => item.id === intent.entity);
      if (!entity?.attributes.some((attr) => attr.id === intent.attribute)) fail(`intent ${intent.id} does not resolve`);
    }
    if (intent.kind === "entity" && !entityIds.has(intent.entity)) fail(`intent ${intent.id} missing entity`);
    if (intent.kind === "offer" && !brief.offers.some((offer) => offer.id === intent.offer && offer.visibility === "public")) {
      fail(`intent ${intent.id} missing public offer`);
    }
  }
  for (const entity of brief.entities) {
    for (const attr of entity.attributes) {
      if (!brief.intents.some((intent) => intent.kind === "attribute" && intent.entity === entity.id && intent.attribute === attr.id)) {
        fail(`attribute ${entity.id}/${attr.id} has no intent`);
      }
    }
  }
  for (const item of brief.backlog?.attributes ?? []) {
    if (!entityIds.has(item.entity)) fail(`backlog entity ${item.entity} missing`);
  }
  if (brief.compliance.profile === "legal-services") {
    if (!brief.project.ymyl) fail("legal-services profile requires project.ymyl true");
    if (!brief.brand.author.credential?.identifier) fail("legal-services profile requires a credential identifier");
  }
  const blob = JSON.stringify(brief);
  for (const phrase of PROFILES[brief.compliance.profile].banned) {
    if (blob.toLowerCase().includes(phrase.toLowerCase())) fail(`banned phrase present: ${phrase}`);
  }
  if (brief.thresholds.seo_geo !== 100 || brief.thresholds.ui !== 100 || brief.thresholds.ai !== 100) {
    fail("encoded thresholds are 100 for every pillar");
  }
  return errors;
}
