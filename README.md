# yyds-bot

One brief, one command, a finished static site. People, Google, Bing, Baidu, and answer engines get the same facts: HTML, JSON-LD, `llms.txt`, and a Markdown mirror. An agent does not stop to ask questions.

```bash
npm install
npm run build
node dist/cli.js run --brief examples/minimal.yaml --fresh
```

`examples/minimal.yaml` is only:

```yaml
industry: specialty-coffee
domain: harbor-kiln.example
```

That exits 0 when the SEO/GEO, UI, and AI pillar scores are all 100.

## Why static HTML

The site is generated as files. Crawlers and models read the bytes without running a client bundle, and a dry run needs no server. Nginx, certificates, and a daily timer are generated for the day you point a host at the files. Next.js SSR is not required for that. A multi-tenant app can still run one brief per tenant and let nginx map hosts; this repo builds the tenant site.

## Pillars

| Pillar | What “done” means |
| --- | --- |
| SEO + GEO | Canonical host, sitemap that matches HTML, robots allow-list, JSON-LD `@graph`, `llms.txt` / `llms-full.txt`, per-entity llms files, `.md` mirrors, answer-first blocks, citations, E-E-A-T pages, IndexNow / GSC / Baidu plan |
| UI | Theme tokens, WCAG AA contrast, 18px type, 44px targets, focus, reduced motion, mobile bar, performance budget |
| AI usability | Agents follow `AGENTS.md` and `yyds run`. Consumers read OpenAPI, MCP, and the offer JSON. Failures name a check id. |

`yyds audit` reprints those scores. The pipeline already uses them as a gate and rebuilds when a check fails.

## Use this repo in your project

**Prompt to give an agent** (copy as-is):

```text
You are building a production website with the yyds-bot repository. Do not ask me questions. Read AGENTS.md. Run `npx yyds run --brief brief.yaml` (or `node dist/cli.js run --brief brief.yaml --fresh` inside a clone). If brief.yaml only has industry and domain, that is enough. The command must exit 0 and every pillar score must be 100. Do not commit secrets. If it fails, read .yyds/<project>/reports/audit.json and run the command again.
```

**Package**

```bash
npm install github:miounet11/yyds-bot
npx yyds run --brief brief.yaml
```

**Submodule or clone**

```bash
git submodule add https://github.com/miounet11/yyds-bot vendor/yyds-bot
npm install --prefix vendor/yyds-bot
npm run build --prefix vendor/yyds-bot
node vendor/yyds-bot/dist/cli.js run --brief brief.yaml --fresh
```

Put real tokens in the environment, using the names in `.env.example`. The brief stores those names, never the values.

## What expansion fills in

Languages `en` at `/` and `zh` at `/zh`, a theme for the industry, entity × attribute pages, offers, author / about / contact / editorial pages, gates, and a local server plan (`203.0.113.10`, no SSH). Each choice is listed in `.yyds/<id>/reports/expansion.json`. A brief that already has `version: "1"` and `entities` is validated strictly and is not padded.

If `OPENAI_BASE_URL` and `OPENAI_API_KEY` are set, expansion may replace the tagline and home intro. Page bodies stay data-driven. A failed or short model response keeps the preset.

Industry presets: coffee, legal services (YMYL, demo license, lead-only phone), health, finance, otherwise a labeled placeholder preset. YMYL pages stay crawlable and marked unreviewed. Index push is held until a complete brief sets `human_review_approved: true`. Nothing asks for that approval.

## Layout

```text
src/pillars/seo-geo   JSON-LD, sitemap, robots, llms, markdown, index plan checks
src/pillars/ui        tokens, CSS, HTML, contrast, performance budget
src/pillars/ai        OpenAPI, MCP, agent-contract checks
src/presets           encoded industries
src/pipeline          stages, repair loop, atomic publish, autopilot
```

## Commands

| Command | Effect |
| --- | --- |
| `yyds run --brief brief.yaml` | Full pipeline. Resume if the brief file is unchanged. |
| `yyds run --brief brief.yaml --fresh` | Rebuild, keeping the append-only publish log. |
| `yyds autopilot --brief brief.yaml` | Add backlog pages that match measurement gaps, then re-score. |
| `yyds audit --brief brief.yaml` | Print pillar scores. |
| `yyds rollback --brief brief.yaml --stage build` | Restore the pre-stage snapshot. |

## Credentials and limits

Live DNS, IndexNow, Google Search Console, Baidu, and Search Console pullback run only when the named env vars exist. Otherwise the plan is written and the command still exits 0. `bootstrap.sh` installs nginx, certbot, and the timer only when `YYDS_BOOTSTRAP_EXECUTE=1`. Hosts ending in `.example` skip certbot. Checkout is a static state machine: it does not charge a card or store a phone number. Lighthouse CI is optional (`.lighthouserc.cjs`) when Chrome is installed; the required performance gate is the byte budget in the audit.

`miounet11/yyds` and `miounet11/yyds-2` returned 404 from this environment, so the stage model follows the written description of those repos (brief, quality gates, atomic rename, IndexNow, systemd, sitemap checks) rather than a line copy.

Chinese: [README.zh.md](README.zh.md). Stage log: [INSTRUCTIONS.md](INSTRUCTIONS.md). Advice mapping: [docs/advice-map.md](docs/advice-map.md).
