# Advice map

Three notes written for a lawyer card + storefront were absorbed as industry-agnostic machinery. Lawyer copy remains the `legal-services` preset, with YMYL and advertising cautions.

## Advice 1 — SEO and GEO

| Item | In yyds-bot |
| --- | --- |
| Multi-tenant Host rewrite and Next.js SSR | Not a runtime. One brief builds one static site. Nginx `server_name` covers the canonical host, `redirect_301` aliases, and `canonical_only` aliases. HTML canonical always uses the primary host. Check `alias-policy`, `canonical`. |
| ISR / `revalidateTag` | Atomic release symlink plus a daily systemd timer (`yyds autopilot`) rebuilds files. |
| `filterByDisplaySettings` | `public` / `lead_only` / `hidden`. Non-public values may only be named by `value_env` and are never printed. Check `visibility`. |
| `/llms.txt` and `/llms-full.txt` per site and per entity | Generated. Check `llms-txt`, `llms-full`, `per-entity-llms`. |
| `.md` URLs and `Accept: text/markdown` | `index.md` plus nginx rewrite. HTML has `rel="alternate" type="text/markdown"` and `rel="describedby"`. Check `markdown-mirror`, `markdown-rel`. |
| AI and search crawler allow-list | Preset `search-and-ai-2026` in `robots.txt`. Check `robots-ai-crawlers`. |
| Nested JSON-LD `@graph` with `@id` | Organization or LegalService, WebSite + SearchAction, Person or Attorney, Article, FAQPage, BreadcrumbList, Offer + OfferCatalog. Check `jsonld-graph`, `jsonld-types`, `jsonld-ids`. |
| Answer-first block, table, `dl` FAQ | Check `answer-first`, `fact-table`, `faq-dl`. |
| Sitemap per tenant and active push | `sitemap.xml`, IndexNow, GSC sitemap PUT, Baidu push. Live calls need env vars. Check `sitemap-bidirectional`, `index-plan`. |
| WeChat `submitPages` | Not sent. No mini program is generated; the site is the crawlable twin. The plan records that. |
| OG image | `/assets/og.png` plus `og:*` tags. The bitmap is a brand-color card; the localized title is in `og:title`. Check `og-tags`. |
| `?checkout_sku=&ai_ref=` | Static checkout state machine reads both and shows them on the demo receipt. It does not take payment. |

## Advice 2 — design tokens and state machines

| Item | In yyds-bot |
| --- | --- |
| Theme skins | `trust-navy`, `elite-obsidian`, `civic-ivory`, `commercial-warm`. Action colors are deepened where the original hex failed WCAG AA. Check `design-tokens`, `contrast`. |
| Component spec | topbar, trust card, offer card, answer-first, fact table, FAQ, bottom bar, CTA. Check `component-markers`. |
| Checkout / admin / CRM state machines | Public checkout only: `closed → drawer → invalid-phone \| payment-demo → receipt`, described in `.well-known/yyds-machines.json`. CRM, seat billing, and admin diffs are a different product; the publish log is append-only instead. |
| Three-state visibility | Brief fields. Check `visibility`. |
| WORM audit UI | `.yyds/<id>/audit/publish-log.jsonl` is append-only. There is no delete API. Check `publish-log`. |

## Advice 3 — offers agents can act on

| Item | In yyds-bot |
| --- | --- |
| Price and specialty in a machine-readable catalog | `/api/offers.json` and OpenAPI `x-offers`. Check `openapi`, `offers-parity`. |
| MCP | `mcp.json` tools `list_offers`, `get_offer`, `draft_lead`. This is a descriptor, not a running MCP server. Check `mcp`. |
| Do not build a public price-rank marketplace | Offers are pages on one site. No cross-seller ranking. |
| Legal red lines | Profile `legal-services` bans outcome promises and holds index push. Demo license ids are labeled fictitious. |
| Guest checkout | State machine only. No card charge, no server-side phone store. |
| Mini program + official account | Out of scope. The static site is the open, crawlable twin. |

## Encoded defaults the advice did not specify

Bilingual `en` + `zh`, local mode, documentation IP `203.0.113.10`, data-driven bodies instead of LLM articles, pillar threshold 100, and a repair loop of three rebuilds. All of these are written into `reports/expansion.json`.
