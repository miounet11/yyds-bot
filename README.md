# yyds-bot 1.0.0

One brief, one command, a finished static site. People, Google, Bing, Baidu, and answer engines get the same facts: HTML, JSON-LD, `llms.txt`, and a Markdown mirror. The agent does not stop to ask questions.

Node.js 22 or newer.

## Quick start

```bash
git clone https://github.com/miounet11/yyds-bot
cd yyds-bot
npm install
node dist/cli.js --version
node dist/cli.js run --brief examples/minimal.yaml --fresh
```

`npm install` compiles `dist/` (`prepare`). `examples/minimal.yaml` is only:

```yaml
industry: specialty-coffee
domain: harbor-kiln.example
```

Done when the process exits 0 and stdout contains `pillar=seo_geo score=100`, `pillar=ui score=100`, `pillar=ai score=100`, and `audit EXIT=0`. The site is `.yyds/harbor-kiln/site`. Reprint the gate with `node dist/cli.js audit --brief examples/minimal.yaml`.

`--until <stage>` stops early for debugging. It is not the definition of done. Stages: `expand`, `intent`, `infra`, `build`, `audit`, `deploy`, `index`, `observe`, `autopilot`.

## Three pillars

| Pillar | What a passing site has |
| --- | --- |
| SEO + GEO | One canonical host, sitemap that matches indexable HTML, robots allow-list for search and AI crawlers, JSON-LD `@graph` with `@id` links, `llms.txt` / `llms-full.txt`, per-entity llms files, `index.md` mirrors, answer-first blocks, fact tables, FAQ, citations, about / author / contact / editorial pages, IndexNow / GSC / Baidu plan |
| UI | Named theme tokens, WCAG AA contrast, 18px body type, 44px targets, visible focus, reduced motion, mobile bottom bar, byte budget |
| AI usability | Agents follow `AGENTS.md` and `yyds run`. Consumers read `/openapi.json`, `/mcp.json`, and `/api/offers.json` (price and specialty). Failures name a check id in `reports/audit.json` |

`yyds audit` reprints those scores. `yyds run` already uses them as a gate and rebuilds the site up to three times if a check fails. Check ids: [docs/pillars.md](docs/pillars.md).

The files are static HTML. Crawlers read them without a client bundle, and this dry run needs no server. Nginx, certbot, and a daily timer are generated for the day you point a host at the files.

## Use this in your project

**Prompt to give an agent** (copy as-is):

```text
You are building a production website with the yyds-bot repository. Do not ask me questions. Read AGENTS.md. Run `npx yyds run --brief brief.yaml` (or `node dist/cli.js run --brief brief.yaml --fresh` inside a clone). If brief.yaml only has industry and domain, that is enough. The command must exit 0 and every pillar score must be 100. Do not commit secrets. If it fails, read .yyds/<project>/reports/audit.json and run the command again.
```

**npm from GitHub** (`prepare` builds `dist/`):

```bash
npm install github:miounet11/yyds-bot
npx yyds run --brief brief.yaml
```

**Submodule or clone**

```bash
git submodule add https://github.com/miounet11/yyds-bot vendor/yyds-bot
npm install --prefix vendor/yyds-bot
node vendor/yyds-bot/dist/cli.js run --brief brief.yaml --fresh
```

`domain` is the only brief field the tool will not invent. A missing `industry` becomes `general` and is listed in `.yyds/<id>/reports/expansion.json`. A brief that already has `version: "1"` and `entities` is validated strictly and is not padded.

## Credentials

**Required for a local run:** Node.js 22+ and a hostname in the brief. No API key.

**Optional.** The default expanded brief does not call these services. Set them only when you opt in.

| Variable | When it is read |
| --- | --- |
| `OPENAI_BASE_URL`, `OPENAI_API_KEY` | During expand, if both are set. May replace the tagline and home intro. Page bodies stay data-driven. `OPENAI_MODEL` defaults to `gpt-4o-mini` when unset. A failed or short response keeps the preset. |
| `INDEXNOW_KEY`, `GSC_ACCESS_TOKEN`, `BAIDU_PUSH_TOKEN` | Only if a complete brief sets `index.live_submit: true` and the site is not an unreviewed YMYL hold. Otherwise `reports/index-plan.json` is written and nothing is sent. |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | Only if `mode` is `production` and `cloudflare.enabled` is true. Local mode writes `infra/dns-plan.json` only. |
| `GSC_ACCESS_TOKEN` | Also used when a complete brief sets `observe.mode: live`. The default mode is `fixture` (a synthetic Search Console file). |
| `YYDS_BOOTSTRAP_EXECUTE=1` | Runs the generated `infra/bootstrap.sh` (nginx, certbot, systemd). Without it the script exits 2 and changes nothing. Hosts ending in `.example`, `.invalid`, `.test`, or `.localhost` skip certbot. |
| `YYDS_BIN` | Absolute path to the `yyds` binary, used by the generated daily autopilot shell on the server. |

Non-public contact fields may name an env var (the legal preset uses `SITE_PHONE`). That value is never written into HTML, JSON-LD, llms files, or OpenAPI.

## Commands

| Command | Effect |
| --- | --- |
| `yyds --version` | Print `1.0.0`. |
| `yyds run --brief brief.yaml` | All stages. Resume if the brief file is unchanged. |
| `yyds run --brief brief.yaml --fresh` | Rebuild. The append-only publish log is kept. |
| `yyds autopilot --brief brief.yaml` | Add backlog pages that match measurement gaps, then re-score. |
| `yyds audit --brief brief.yaml` | Print pillar scores for an existing run. |
| `yyds rollback --brief brief.yaml --stage build` | Restore the snapshot taken before that stage. |

## Known limitations

- Remote SSH is not executed. Deploy in this version is an atomic symlink under `.yyds/<id>/deploy`. `infra/bootstrap.sh` and `infra/nginx.conf` are the host handoff.
- Checkout is a static state machine (`?checkout_sku=` and `?ai_ref=`). It does not charge a card or store a phone number.
- `mcp.json` describes tools. It is not a running MCP server. No WeChat mini program is generated.
- OG images are brand-color cards. The localized title is `og:title`.
- Unknown industries use a labeled placeholder preset (`example.com` source URLs). Coffee, legal, health, and finance have named presets.
- YMYL pages (legal, health, finance) stay crawlable and marked `data-ymyl="unreviewed"`. Index push is held until a complete brief sets `human_review_approved: true`. The tool does not ask for that flag.
- The required performance gate is a byte budget. `.lighthouserc.cjs` is optional and needs Chrome.
- Default languages are English at `/` and Chinese at `/zh`. A third language needs a complete brief and UI strings.
- `miounet11/yyds` and `miounet11/yyds-2` were not readable from the environment that wrote 1.0.0, so the stage model follows the written description of those repos rather than a line-by-line port.

Chinese: [README.zh.md](README.zh.md). Acceptance log: [INSTRUCTIONS.md](INSTRUCTIONS.md). Release notes: [CHANGELOG.md](CHANGELOG.md).
