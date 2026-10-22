# Changelog

## 1.0.0 — 2026-10-22

First public release.

- `yyds run --brief brief.yaml` expands a minimal brief (`industry` and `domain`) and builds a static bilingual site without prompting.
- Pillar gate: SEO/GEO, UI, and AI each score 100, with up to three rebuilds if a check fails. `yyds audit` reprints the scorecard.
- Generated output includes HTML, JSON-LD `@graph`, `robots.txt`, a bidirectional `sitemap.xml`, `llms.txt` / `llms-full.txt`, per-entity llms files, Markdown mirrors, OpenAPI, an MCP descriptor, and a static checkout state machine.
- Local deploy is an atomic symlink. DNS, IndexNow, Google Search Console, and Baidu stay plan-only unless a complete brief turns live submit on and the named env vars exist.
- `yyds autopilot` adds backlog pages that match the measurement fixture. A daily systemd timer is written for the host.
- `yyds --version` prints the package version.
