# Pillar checklists

`yyds run` fails a pillar until every check below passes (score 100). The repair loop rewrites the site up to three times.

## SEO + GEO

- `robots-txt`, `robots-ai-crawlers`
- `sitemap-bidirectional`
- `canonical`, `alias-policy`, `hreflang`, `meta-description`
- `jsonld-graph`, `jsonld-types`, `jsonld-ids`
- `llms-txt`, `llms-full`, `per-entity-llms`
- `markdown-mirror`, `markdown-rel`
- `answer-first`, `fact-table`, `faq-dl`, `citations`, `updated`, `eeat-pages`
- `og-tags`, `visibility`, `word-count`, `thin-content`, `similarity`
- `ymyl-policy`, `banned-phrases`, `placeholder-disclosure`, `index-plan`

## UI

- `design-tokens`, `contrast`, `component-markers`
- `skip-link`, `landmarks`, `viewport`, `lang`, `single-h1`
- `focus-visible`, `reduced-motion`, `font-size`, `tap-targets`, `bottom-bar`
- `image-dimensions`, `performance-budget`, `checkout-machine`, `wechat-layout`

## AI usability

- `openapi`, `offers-parity`, `mcp`, `machine-descriptor`, `design-descriptor`
- `expansion-report`, `stage-state`, `autopilot-units`, `bootstrap`, `dns-plan`
- `agent-contract`, `publish-log`

Thresholds live in `src/pillars/thresholds.ts` and are copied into the expanded brief.
