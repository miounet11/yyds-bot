/** Encoded best-practice defaults. Expansion writes these into the brief and records each one. */
export const ENCODED = {
  thresholds: { seo_geo: 100, ui: 100, ai: 100 },
  repairAttempts: 3,
  gates: {
    min_intents: 6,
    min_words: { home: 80, entity: 90, attribute: 100, trust: 70, offer: 60, faq: 70 },
    thin_content_words: 50,
    max_similarity: 0.72,
    performance: {
      max_html_bytes: 180_000,
      max_css_bytes: 80_000,
      max_js_bytes: 40_000,
      max_external_scripts: 1
    }
  },
  llm: {
    base_url_env: "OPENAI_BASE_URL",
    api_key_env: "OPENAI_API_KEY",
    model: "gpt-4o-mini"
  },
  server: {
    ssh_host: "203.0.113.10",
    ssh_user: "deploy",
    ssh_port: 22
  },
  index: {
    on_missing_credentials: "plan" as const,
    indexnow_key_env: "INDEXNOW_KEY",
    gsc_credentials_env: "GSC_ACCESS_TOKEN",
    baidu_token_env: "BAIDU_PUSH_TOKEN"
  },
  cloudflare: {
    token_env: "CLOUDFLARE_API_TOKEN",
    zone_id_env: "CLOUDFLARE_ZONE_ID"
  },
  updated: "2026-10-01",
  languages: [
    { code: "en", locale: "en-US", url_prefix: "/", default: true },
    { code: "zh", locale: "zh-CN", url_prefix: "/zh", default: false }
  ]
} as const;

export const STAGES = [
  "expand",
  "intent",
  "infra",
  "build",
  "audit",
  "deploy",
  "index",
  "observe",
  "autopilot"
] as const;

export type StageName = (typeof STAGES)[number];
