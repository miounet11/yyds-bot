# Brief schema

## Minimal

```yaml
industry: specialty-coffee
domain: harbor-kiln.example
```

Optional: `topic`, `mode: local|production`, `server.ssh_host`, `server.ssh_user`, `server.ssh_port`, `server.web_root`, `domain.scheme`.

`yyds run` writes a complete brief to `.yyds/<id>/brief.expanded.yaml`. Every default is a row in `reports/expansion.json`.

## Complete

A document with `version: "1"` and an `entities` array is not expanded. `validateBrief` fails on missing fields. There are no silent defaults on this path.

Required groups: `project` (including `ymyl`, `human_review_approved`, `updated`), `compliance.profile`, `schema_org`, `languages` (exactly one default, its prefix `/`), `domain.canonical_host` and `aliases`, `brand` (localized strings for every language, contact visibility), `design.theme`, `ui_pack: en-zh-v1`, `ai` flags, `server`, `cloudflare` env names, `llm` env names, `index` channels, `analytics`, `observe`, `gates`, `thresholds` (100/100/100), `offers`, `entities`, `relations`, `intents` (at least `gates.min_intents`, every attribute covered), `backlog`, `home.intro`.

Contact fields:

- `public` requires `value` and forbids `value_env`.
- `lead_only` or `hidden` require `value_env`, forbid `value`, and `lead_only` requires a placeholder. The pipeline never reads the env value into HTML, JSON-LD, llms, or OpenAPI.

`compliance.profile: legal-services` requires `project.ymyl: true` and an author credential identifier. Banned phrases for that profile fail validation.

## Secrets

Do not put API keys in the brief. Fields ending in `_env` are names like `OPENAI_API_KEY`.
