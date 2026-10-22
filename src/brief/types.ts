export const THEMES = ["trust-navy", "elite-obsidian", "civic-ivory", "commercial-warm"] as const;
export type ThemeName = (typeof THEMES)[number];

export const COMPLIANCE_PROFILES = ["generic", "legal-services", "ymyl-health", "ymyl-finance"] as const;
export type ComplianceProfile = (typeof COMPLIANCE_PROFILES)[number];

export const UI_PACKS = ["en-zh-v1"] as const;
export type UiPack = (typeof UI_PACKS)[number];

export const CRAWLER_PRESETS = ["search-and-ai-2026"] as const;

export type Visibility = "public" | "lead_only" | "hidden";

export type Localized = Record<string, string>;

export interface ScalarField {
  visibility: Visibility;
  value: string | null;
  value_env: string | null;
  placeholder: Localized | null;
}

export interface LocalizedField {
  visibility: Visibility;
  value: Localized | null;
  value_env: string | null;
  placeholder: Localized | null;
}

export interface Language {
  code: string;
  locale: string;
  url_prefix: string;
  default: boolean;
}

export interface Alias {
  host: string;
  action: "redirect_301" | "canonical_only";
}

export interface Credential {
  category: Localized;
  identifier: string | null;
  recognized_by: string | null;
}

export interface Fact {
  label: Localized;
  value: Localized;
  source_url: string;
  source_title: string;
}

export interface Faq {
  q: Localized;
  a: Localized;
}

export interface Source {
  title: string;
  url: string;
  publisher: string;
}

export interface Attribute {
  id: string;
  name: Localized;
  summary: Localized;
  body: Localized;
  updated: string;
  facts: Fact[];
  faqs: Faq[];
  sources: Source[];
}

export interface Entity {
  id: string;
  type: string;
  name: Localized;
  summary: Localized;
  updated: string;
  attributes: Attribute[];
}

export interface Relation {
  from: string;
  to: string;
  type: string;
  label: Localized;
}

export interface Offer {
  id: string;
  name: Localized;
  specialty: Localized;
  description: Localized;
  price: string;
  currency: string;
  availability: "InStock" | "PreOrder" | "OutOfStock";
  delivery: Localized;
  visibility: Visibility;
  updated: string;
}

export type Intent =
  | { id: string; kind: "home"; query: Localized }
  | { id: string; kind: "entity"; entity: string; query: Localized }
  | { id: string; kind: "attribute"; entity: string; attribute: string; query: Localized }
  | { id: string; kind: "offer"; offer: string; query: Localized }
  | { id: string; kind: "trust"; trust: "about" | "author" | "contact" | "editorial"; query: Localized }
  | { id: string; kind: "faq"; query: Localized };

export interface BacklogAttribute {
  entity: string;
  attribute: Attribute;
  query: Localized;
}

export interface Brief {
  version: "1";
  mode: "local" | "production";
  project: {
    id: string;
    name: string;
    industry: string;
    topic: string;
    ymyl: boolean;
    human_review_approved: boolean;
    updated: string;
  };
  compliance: {
    profile: ComplianceProfile;
    notes: Localized;
  };
  schema_org: {
    organization_type: string;
    person_type: string;
    offer_type: "Product" | "Service";
  };
  languages: Language[];
  domain: {
    scheme: "https" | "http";
    canonical_host: string;
    aliases: Alias[];
  };
  brand: {
    name: string;
    tagline: Localized;
    description: Localized;
    about: Localized;
    editorial_policy: Localized;
    contact: {
      email: ScalarField;
      phone: ScalarField;
      address: LocalizedField;
    };
    author: {
      id: string;
      name: string;
      job_title: Localized;
      bio: Localized;
      credentials: Localized;
      same_as: string[];
      credential: Credential | null;
    };
  };
  design: {
    theme: ThemeName;
    token_overrides: Record<string, string>;
  };
  ui_pack: UiPack;
  ui_overrides: Record<string, Localized>;
  conversion: {
    checkout: "static-demo" | "none";
  };
  ai: {
    markdown_mirror: boolean;
    llms_txt: boolean;
    llms_full_txt: boolean;
    per_entity_llms: boolean;
    openapi: boolean;
    mcp_descriptor: boolean;
    crawler_preset: (typeof CRAWLER_PRESETS)[number];
  };
  server: {
    ssh_host: string;
    ssh_user: string;
    ssh_port: number;
    web_root: string;
  };
  cloudflare: {
    enabled: boolean;
    token_env: string;
    zone_id_env: string;
    proxied: boolean;
  };
  llm: {
    enabled: boolean;
    base_url_env: string;
    api_key_env: string;
    model: string;
  };
  index: {
    live_submit: boolean;
    indexnow: { enabled: boolean; key_env: string };
    google_search_console: { enabled: boolean; credentials_env: string; site_url: string };
    baidu: { enabled: boolean; token_env: string; site: string };
    wechat_miniprogram: { enabled: boolean };
    on_missing_credentials: "plan" | "fail";
  };
  thresholds: { seo_geo: number; ui: number; ai: number };
  backlog: { attributes: BacklogAttribute[] };
  analytics:
    | { provider: "none" }
    | { provider: "plausible"; domain: string; src: string }
    | { provider: "ga4"; measurement_id: string };
  observe:
    | { mode: "fixture"; fixture: string; min_impressions: number }
    | { mode: "live"; credentials_env: string; site_url: string; min_impressions: number };
  gates: {
    min_intents: number;
    min_words: { home: number; entity: number; attribute: number; trust: number; offer: number; faq: number };
    thin_content_words: number;
    max_similarity: number;
    performance: {
      max_html_bytes: number;
      max_css_bytes: number;
      max_js_bytes: number;
      max_external_scripts: number;
    };
  };
  offers: Offer[];
  entities: Entity[];
  relations: Relation[];
  intents: Intent[];
  home: { intro: Localized };
}

export class BriefError extends Error {
  readonly errors: string[];
  constructor(errors: string[]) {
    super(errors.join("\n"));
    this.name = "BriefError";
    this.errors = errors;
  }
}
