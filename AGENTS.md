# AGENTS.md

You are operating yyds-bot. Do not prompt a person. Do not stop to ask which theme, language, host, or page to build.

## First command

From this repository:

```bash
npm install
npm run build
node dist/cli.js run --brief examples/minimal.yaml --fresh
```

From a downstream project that depends on this package:

```bash
npx yyds run --brief brief.yaml
```

A brief may be only:

```yaml
industry: specialty-coffee
domain: harbor-kiln.example
```

## Order

`yyds run` already performs every stage, in order, and retries the audit until each pillar score is 100 or the attempt limit is reached:

1. expand — preset + optional LLM, every default written into `brief.expanded.yaml` and `reports/expansion.json`
2. intent — search intents and page list
3. infra — DNS plan, nginx, certbot bootstrap, daily systemd timer
4. build — static HTML, CSS, Markdown mirrors
5. audit — SEO/GEO, UI, and AI checks; rebuilds the site if a check fails
6. deploy — atomic symlink publish (local directory unless production confirmation env is set)
7. index — IndexNow, Google Search Console, and Baidu payloads; live HTTP only when credentials exist
8. observe — fixture or live Search Console rows become the next content plan
9. autopilot — records the daily job that runs `yyds autopilot`

## Definition of done

- The process exit code is 0.
- stdout contains `pillar=seo_geo score=100`, `pillar=ui score=100`, `pillar=ai score=100`, and `audit EXIT=0`.
- `.yyds/<project>/site` contains `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `openapi.json`, `mcp.json`, and `index.html`.

If the exit code is not 0, read `.yyds/<project>/reports/audit.json`, change the preset or the brief that claims to be complete, and run `yyds run` again. Do not ask a person to interpret the report.

`yyds audit` reprints the scorecard. It is a gate inside `yyds run`, not a separate product.

## Secrets

Put tokens in the environment variables named in `.env.example`. Never write token values into the brief or the git tree.
