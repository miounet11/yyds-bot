# Use yyds-bot in your project

## The one prompt

```text
You are building a production website with the yyds-bot repository. Do not ask me questions. Read AGENTS.md. Run `npx yyds run --brief brief.yaml` (or `node dist/cli.js run --brief brief.yaml --fresh` inside a clone). If brief.yaml only has industry and domain, that is enough. The command must exit 0 and every pillar score must be 100. Do not commit secrets. If it fails, read .yyds/<project>/reports/audit.json and run the command again.
```

## Reference the repo

| Method | Command |
| --- | --- |
| npm from GitHub | `npm install github:miounet11/yyds-bot` then `npx yyds run --brief brief.yaml`. `prepare` compiles `dist/`. |
| Submodule | `git submodule add https://github.com/miounet11/yyds-bot vendor/yyds-bot`, then `npm install --prefix vendor/yyds-bot`, then `node vendor/yyds-bot/dist/cli.js run --brief brief.yaml --fresh` |
| Clone | Same commands as the submodule, from the clone root |

## Minimal brief

```yaml
industry: specialty-coffee
domain: harbor-kiln.example
```

`domain` is the only field the tool will not invent. A missing industry becomes `general` and is recorded. Server SSH defaults to local dry-run.

## After it exits 0

- Site files: `.yyds/<project-id>/site`
- Expanded brief: `.yyds/<project-id>/brief.expanded.yaml`
- Decisions: `.yyds/<project-id>/reports/expansion.json`
- Scorecard: `.yyds/<project-id>/reports/audit.json`
- Host bootstrap (review, then `YYDS_BOOTSTRAP_EXECUTE=1`): `.yyds/<project-id>/infra/bootstrap.sh`
- Daily loop: `yyds autopilot --brief brief.yaml`, also described by `infra/yyds-autopilot.timer`
