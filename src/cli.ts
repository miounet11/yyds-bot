#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isCompleteBrief, minimalFromUnknown, readInput } from "./brief/load.js";
import { BriefError } from "./brief/types.js";
import { rollbackTo, runAutopilot, runPipeline } from "./pipeline/run.js";
import { STAGES, type StageName } from "./pillars/thresholds.js";
import { formatScorecard, scoreSite } from "./pillars/scorecard.js";
import { hostSlug } from "./util.js";

function repoRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i += 1) {
    try {
      const raw = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")) as { name?: string };
      if (raw.name === "yyds-bot") return dir;
    } catch {
      /* parent */
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function usage(): string {
  return `yyds run --brief brief.yaml [--fresh] [--cwd dir]
yyds autopilot --brief brief.yaml [--cwd dir]
yyds audit --brief brief.yaml [--cwd dir]
yyds rollback --brief brief.yaml --stage <${STAGES.join("|")}> [--cwd dir]

Do not prompt a person. A brief may contain only industry and domain.
Definition of done: yyds run exits 0 and every pillar score meets its threshold.`;
}

function arg(name: string, argv: string[]): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const briefPath = arg("--brief", argv);
  const cwd = path.resolve(arg("--cwd", argv) ?? process.cwd());
  const root = repoRoot();
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!briefPath) {
    process.stderr.write(`missing --brief\n${usage()}\n`);
    process.exitCode = 2;
    return;
  }
  if (command === "run") {
    const until = arg("--until", argv) as StageName | undefined;
    if (until && !STAGES.includes(until)) {
      process.stderr.write(`unknown --until ${until}\n`);
      process.exitCode = 2;
      return;
    }
    const result = await runPipeline({ briefPath, cwd, fresh: argv.includes("--fresh"), until, repoRoot: root });
    process.stdout.write(`${result.lines.join("\n")}\n`);
    return;
  }
  if (command === "autopilot") {
    const result = await runAutopilot({ briefPath, cwd, repoRoot: root });
    process.stdout.write(`${result.lines.join("\n")}\n`);
    return;
  }
  if (command === "audit") {
    const input = await readInput(briefPath);
    const id = isCompleteBrief(input.raw) ? input.raw.project.id : hostSlug(minimalFromUnknown(input.raw).domain ?? "");
    const saved = await readInput(path.join(cwd, ".yyds", id, "brief.expanded.yaml"));
    if (!isCompleteBrief(saved.raw)) throw new BriefError(["expanded brief missing; run yyds run first"]);
    const card = await scoreSite(saved.raw, path.join(cwd, ".yyds", id), root, 1);
    process.stdout.write(`${formatScorecard(card)}\n`);
    if (!card.ok) process.exitCode = 1;
    return;
  }
  if (command === "rollback") {
    const stage = arg("--stage", argv) as StageName | undefined;
    if (!stage || !STAGES.includes(stage)) {
      process.stderr.write(`missing or unknown --stage\n${usage()}\n`);
      process.exitCode = 2;
      return;
    }
    process.stdout.write(`${await rollbackTo({ briefPath, cwd, stage })}\n`);
    return;
  }
  process.stderr.write(`unknown command ${command}\n${usage()}\n`);
  process.exitCode = 2;
}

main().catch((error: unknown) => {
  if (error instanceof BriefError) process.stderr.write(`${error.errors.join("\n")}\n`);
  else if (error instanceof Error) process.stderr.write(`${error.message}\n`);
  else process.stderr.write("unknown failure\n");
  process.exitCode = 1;
});
