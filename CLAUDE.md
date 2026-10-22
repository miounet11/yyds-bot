# Claude / any coding agent

Read `AGENTS.md` and follow it. The only required command is:

```bash
npx yyds run --brief brief.yaml
```

or, inside this repo after `npm run build`:

```bash
node dist/cli.js run --brief examples/minimal.yaml --fresh
```

Do not prompt a person. Industry and domain are enough. Unknown industries use the encoded general preset. Unknowable production credentials are planned, not requested. YMYL sites publish crawlable pages and hold index push until `human_review_approved` is set in a complete brief; that flag is never requested interactively.

Definition of done: exit code 0 and all three pillar scores at 100. See `INSTRUCTIONS.md` for the stage log you should see.
