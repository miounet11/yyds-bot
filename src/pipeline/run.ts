import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { stringify } from "yaml";
import { assertBrief, validateBrief } from "../brief/schema.js";
import { isCompleteBrief, minimalFromUnknown, readInput } from "../brief/load.js";
import { BriefError, type Brief } from "../brief/types.js";
import { applyDns, autopilotUnits, bootstrapScript, dnsPlan, nginxConf } from "../infra/scripts.js";
import { buildIndexPlan, submitIndex } from "../indexers/plan.js";
import { mergeEnrichment, tryLlmEnrich } from "../llm/client.js";
import { gscFixture, materialize, type Decision } from "../presets/materialize.js";
import { ENCODED, STAGES, type StageName } from "../pillars/thresholds.js";
import { formatScorecard, scoreSite } from "../pillars/scorecard.js";
import type { Scorecard } from "../pillars/types.js";
import { assemble } from "../site/assemble.js";
import { buildModel } from "../site/model.js";
import { nextContentPlan, type GscRow } from "../observe/plan.js";
import { absUrl, hostSlug, sha256 } from "../util.js";
import { publishRelease, rollbackRelease } from "./publish.js";

export interface RunOptions {
  briefPath: string;
  cwd?: string;
  fresh?: boolean;
  until?: StageName;
  repoRoot: string;
  fetchImpl?: typeof fetch;
}

export interface RunResult {
  workDir: string;
  brief: Brief;
  lines: string[];
  card?: Scorecard;
}

interface State {
  inputHash: string;
  projectId: string;
  stages: Record<string, { status: string; at: string }>;
}

function workDirFor(cwd: string, projectId: string): string {
  return path.join(cwd, ".yyds", projectId);
}

async function loadState(file: string): Promise<State | null> {
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, "utf8")) as State;
}

async function saveState(file: string, state: State): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(state, null, 2));
}

async function snapshot(work: string, stage: string): Promise<void> {
  const dest = path.join(work, "snapshots", stage);
  if (existsSync(dest)) return;
  await mkdir(dest, { recursive: true });
  for (const name of ["site", "infra", "reports"]) {
    const source = path.join(work, name);
    if (existsSync(source)) await cp(source, path.join(dest, name), { recursive: true });
  }
}

async function appendLog(work: string, event: string, extra: Record<string, unknown> = {}): Promise<void> {
  const file = path.join(work, "audit", "publish-log.jsonl");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify({ at: new Date().toISOString(), event, ...extra })}\n`, { flag: "a" });
}

async function writeSite(work: string, brief: Brief): Promise<string[]> {
  const assembled = assemble(brief);
  const site = path.join(work, "site");
  await rm(site, { recursive: true, force: true });
  for (const [rel, data] of assembled.files) {
    const abs = path.join(site, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, data);
  }
  return assembled.pages.filter((page) => !page.noindex).map((page) => absUrl(brief.domain.scheme, brief.domain.canonical_host, page.path));
}

async function expandRaw(raw: unknown, fetchImpl: typeof fetch): Promise<{ brief: Brief; decisions: Decision[] }> {
  if (isCompleteBrief(raw)) {
    const errors = validateBrief(raw);
    if (errors.length) throw new BriefError(errors);
    return { brief: raw, decisions: [{ field: "brief", source: "complete", detail: "Complete brief validated. Nothing was defaulted." }] };
  }
  const minimal = minimalFromUnknown(raw);
  const produced = materialize(minimal);
  const llm = await tryLlmEnrich(
    { industry: produced.brief.project.industry, topic: produced.brief.project.topic, host: produced.brief.domain.canonical_host },
    {
      baseUrl: process.env[ENCODED.llm.base_url_env],
      apiKey: process.env[ENCODED.llm.api_key_env],
      model: process.env.OPENAI_MODEL || ENCODED.llm.model
    },
    fetchImpl
  );
  produced.decisions.push({ field: "llm", source: "runtime", detail: llm.note });
  for (const note of mergeEnrichment(produced.brief, llm.enrichment)) {
    produced.decisions.push({ field: "llm.merge", source: "llm", detail: note });
  }
  assertBrief(produced.brief);
  return produced;
}

export async function runPipeline(options: RunOptions): Promise<RunResult> {
  const cwd = options.cwd ?? process.cwd();
  const fetchImpl = options.fetchImpl ?? fetch;
  const input = await readInput(options.briefPath);
  const hash = sha256(input.text);
  const previewId = isCompleteBrief(input.raw) ? input.raw.project.id : hostSlug(minimalFromUnknown(input.raw).domain ?? "missing");
  const work = workDirFor(cwd, previewId);
  const lines: string[] = [];
  if (!isCompleteBrief(input.raw) && !minimalFromUnknown(input.raw).domain) {
    throw new BriefError(["domain is required and must be a hostname. yyds-bot will not invent one and will not ask a follow-up question."]);
  }
  if (options.fresh && existsSync(work)) {
    const logPath = path.join(work, "audit", "publish-log.jsonl");
    const prior = existsSync(logPath) ? await readFile(logPath, "utf8") : "";
    await rm(work, { recursive: true, force: true });
    if (prior) {
      await mkdir(path.dirname(logPath), { recursive: true });
      await writeFile(logPath, prior);
    }
  }
  await mkdir(work, { recursive: true });
  const statePath = path.join(work, "state.json");
  let state = (await loadState(statePath)) ?? { inputHash: hash, projectId: previewId, stages: {} };
  if (state.inputHash !== hash) {
    throw new BriefError([
      `Input brief changed since the last run in ${work}. Re-run with --fresh. yyds-bot will not mix two briefs in one work directory.`
    ]);
  }
  const should = (stage: StageName) => {
    if (options.until) {
      const end = STAGES.indexOf(options.until);
      if (STAGES.indexOf(stage) > end) return false;
    }
    return state.stages[stage]?.status !== "ok";
  };
  const mark = async (stage: StageName) => {
    state.stages[stage] = { status: "ok", at: new Date().toISOString() };
    await saveState(statePath, state);
    lines.push(`stage=${stage} EXIT=0`);
  };

  let brief: Brief;
  const expandedPath = path.join(work, "brief.expanded.yaml");
  if (!should("expand") && existsSync(expandedPath)) {
    const saved = await readInput(expandedPath);
    if (!isCompleteBrief(saved.raw)) throw new BriefError(["saved expanded brief is incomplete"]);
    brief = saved.raw;
    lines.push("stage=expand EXIT=0");
  } else {
    await snapshot(work, "expand");
    const produced = await expandRaw(input.raw, fetchImpl);
    brief = produced.brief;
    if (brief.project.id !== previewId) {
      throw new BriefError([`project id ${brief.project.id} does not match work directory ${previewId}`]);
    }
    await mkdir(path.join(work, "reports"), { recursive: true });
    await writeFile(expandedPath, stringify(brief));
    await writeFile(path.join(work, "reports", "expansion.json"), JSON.stringify({ decisions: produced.decisions }, null, 2));
    if (brief.observe.mode === "fixture") {
      const fixturePath = path.resolve(work, brief.observe.fixture);
      await mkdir(path.dirname(fixturePath), { recursive: true });
      if (!existsSync(fixturePath)) await writeFile(fixturePath, JSON.stringify(gscFixture(brief), null, 2));
    }
    await appendLog(work, "expand", { decisions: produced.decisions.length });
    await mark("expand");
  }

  const urlsOf = () => buildModel(brief).filter((page) => !page.noindex).map((page) => absUrl(brief.domain.scheme, brief.domain.canonical_host, page.path));

  if (should("intent")) {
    await snapshot(work, "intent");
    const pages = buildModel(brief).filter((page) => !page.noindex);
    await writeFile(
      path.join(work, "reports", "content-plan.json"),
      JSON.stringify({ intents: brief.intents, pages: pages.map((page) => page.path) }, null, 2)
    );
    await mark("intent");
  } else lines.push("stage=intent EXIT=0");

  if (should("infra")) {
    await snapshot(work, "infra");
    const infra = path.join(work, "infra");
    await mkdir(infra, { recursive: true });
    const plan = dnsPlan(brief);
    if (plan.apply && process.env[brief.cloudflare.token_env] && process.env[brief.cloudflare.zone_id_env]) {
      plan.reason = (
        await applyDns(process.env[brief.cloudflare.zone_id_env] ?? "", process.env[brief.cloudflare.token_env] ?? "", plan.records, fetchImpl)
      ).join("; ");
    }
    await writeFile(path.join(infra, "dns-plan.json"), JSON.stringify(plan, null, 2));
    await writeFile(path.join(infra, "nginx.conf"), nginxConf(brief));
    await writeFile(path.join(infra, "bootstrap.sh"), bootstrapScript(brief));
    const units = autopilotUnits(brief);
    await writeFile(path.join(infra, "yyds-autopilot.service"), units.service);
    await writeFile(path.join(infra, "yyds-autopilot.timer"), units.timer);
    await writeFile(path.join(infra, "autopilot.sh"), units.shell);
    await mark("infra");
  } else lines.push("stage=infra EXIT=0");

  if (should("build")) {
    await snapshot(work, "build");
    await writeSite(work, brief);
    await appendLog(work, "build", { pages: urlsOf().length });
    await mark("build");
  } else lines.push("stage=build EXIT=0");

  let card: Scorecard | undefined;
  if (should("audit")) {
    await snapshot(work, "audit");
    let attempts = 0;
    do {
      attempts += 1;
      await writeFile(path.join(work, "reports", "index-plan.json"), JSON.stringify(buildIndexPlan(brief, urlsOf()), null, 2));
      card = await scoreSite(brief, work, options.repoRoot, attempts);
      if (card.ok) break;
      await writeSite(work, brief);
    } while (attempts < ENCODED.repairAttempts);
    await writeFile(path.join(work, "reports", "audit.json"), JSON.stringify(card, null, 2));
    lines.push(formatScorecard(card));
    if (!card.ok) {
      state.stages.audit = { status: "failed", at: new Date().toISOString() };
      await saveState(statePath, state);
      lines.push("stage=audit EXIT=1");
      const error = new Error(lines.join("\n"));
      (error as Error & { exitCode?: number }).exitCode = 1;
      throw error;
    }
    await mark("audit");
  } else if (existsSync(path.join(work, "reports", "audit.json"))) {
    card = JSON.parse(await readFile(path.join(work, "reports", "audit.json"), "utf8")) as Scorecard;
    lines.push("stage=audit EXIT=0");
  }

  if (should("deploy")) {
    await snapshot(work, "deploy");
    const id = await publishRelease(path.join(work, "deploy"), path.join(work, "site"));
    await appendLog(work, "deploy", { release: id, mode: brief.mode });
    await mark("deploy");
  } else lines.push("stage=deploy EXIT=0");

  if (should("index")) {
    await snapshot(work, "index");
    const plan = await submitIndex(buildIndexPlan(brief, urlsOf()), brief, fetchImpl);
    await writeFile(path.join(work, "reports", "index-plan.json"), JSON.stringify(plan, null, 2));
    await mark("index");
  } else lines.push("stage=index EXIT=0");

  if (should("observe")) {
    await snapshot(work, "observe");
    let rows: GscRow[] = [];
    let synthetic = true;
    if (brief.observe.mode === "live" && process.env[brief.observe.credentials_env]) {
      synthetic = false;
      const token = process.env[brief.observe.credentials_env];
      const site = encodeURIComponent(brief.observe.site_url);
      const response = await fetchImpl(`https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ startDate: "2026-09-01", endDate: "2026-10-01", dimensions: ["query", "page"], rowLimit: 50 })
      });
      if (response.ok) {
        const payload = (await response.json()) as { rows?: { keys?: string[]; clicks?: number; impressions?: number; position?: number }[] };
        rows = (payload.rows ?? []).map((row) => ({
          query: row.keys?.[0] ?? "",
          page: row.keys?.[1] ?? "",
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          position: row.position ?? 0
        }));
      }
    } else {
      const fixturePath = path.resolve(work, brief.observe.mode === "fixture" ? brief.observe.fixture : "fixtures/gsc.json");
      if (!existsSync(fixturePath)) {
        await mkdir(path.dirname(fixturePath), { recursive: true });
        await writeFile(fixturePath, JSON.stringify(gscFixture(brief), null, 2));
      }
      const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as { synthetic?: boolean; rows: GscRow[] };
      rows = fixture.rows;
      synthetic = fixture.synthetic !== false;
    }
    await writeFile(path.join(work, "reports", "next-content-plan.json"), JSON.stringify(nextContentPlan(brief, rows, synthetic), null, 2));
    await mark("observe");
  } else lines.push("stage=observe EXIT=0");

  if (should("autopilot")) {
    await snapshot(work, "autopilot");
    await writeFile(
      path.join(work, "reports", "autopilot.json"),
      JSON.stringify({ schedule: "daily", command: "yyds autopilot --brief brief.expanded.yaml", units: ["yyds-autopilot.timer"] }, null, 2)
    );
    await mark("autopilot");
  } else lines.push("stage=autopilot EXIT=0");

  lines.push(`site=${path.join(work, "site")}`);
  lines.push(`expanded=${expandedPath}`);
  return { workDir: work, brief, lines, card };
}

export async function runAutopilot(options: RunOptions): Promise<RunResult> {
  const first = await runPipeline({ ...options, fresh: false });
  const work = first.workDir;
  const brief = structuredClone(first.brief);
  const plan = JSON.parse(await readFile(path.join(work, "reports", "next-content-plan.json"), "utf8")) as { gaps?: { query: string }[] };
  const gaps = new Set((plan.gaps ?? []).map((gap) => gap.query.toLowerCase()));
  let added = 0;
  brief.backlog.attributes = brief.backlog.attributes.filter((item) => {
    if (!gaps.has(item.query.en.toLowerCase()) && !gaps.has(item.query.zh.toLowerCase())) return true;
    const entity = brief.entities.find((candidate) => candidate.id === item.entity);
    if (!entity) return true;
    if (entity.attributes.some((attr) => attr.id === item.attribute.id)) return false;
    entity.attributes.push(item.attribute);
    brief.intents.push({
      id: `${item.entity}-${item.attribute.id}`,
      kind: "attribute",
      entity: item.entity,
      attribute: item.attribute.id,
      query: item.query
    });
    added += 1;
    return false;
  });
  if (added) {
    assertBrief(brief);
    await writeFile(path.join(work, "brief.expanded.yaml"), stringify(brief));
    const urls = await writeSite(work, brief);
    await writeFile(path.join(work, "reports", "index-plan.json"), JSON.stringify(buildIndexPlan(brief, urls), null, 2));
    await appendLog(work, "autopilot-expand", { added });
  }
  const card = await scoreSite(brief, work, options.repoRoot, 1);
  await writeFile(path.join(work, "reports", "audit.json"), JSON.stringify(card, null, 2));
  const lines = [...first.lines, `autopilot added=${added}`, formatScorecard(card)];
  if (!card.ok) {
    const error = new Error(lines.join("\n"));
    (error as Error & { exitCode?: number }).exitCode = 1;
    throw error;
  }
  return { workDir: work, brief, lines, card };
}

export async function rollbackTo(options: { briefPath: string; cwd?: string; stage: StageName }): Promise<string> {
  const cwd = options.cwd ?? process.cwd();
  const input = await readInput(options.briefPath);
  const previewId = isCompleteBrief(input.raw) ? input.raw.project.id : hostSlug(minimalFromUnknown(input.raw).domain ?? "");
  const work = workDirFor(cwd, previewId);
  const snap = path.join(work, "snapshots", options.stage);
  if (!existsSync(snap)) throw new BriefError([`No snapshot for stage ${options.stage}.`]);
  for (const name of ["site", "infra", "reports"]) {
    await rm(path.join(work, name), { recursive: true, force: true });
    if (existsSync(path.join(snap, name))) await cp(path.join(snap, name), path.join(work, name), { recursive: true });
  }
  if (options.stage === "deploy" && existsSync(path.join(work, "deploy", "previous"))) {
    await rollbackRelease(path.join(work, "deploy"));
  }
  const statePath = path.join(work, "state.json");
  const state = (await loadState(statePath)) ?? { inputHash: "", projectId: previewId, stages: {} };
  const start = STAGES.indexOf(options.stage);
  for (const stage of STAGES.slice(start)) state.stages[stage] = { status: "rolled_back", at: new Date().toISOString() };
  await saveState(statePath, state);
  await appendLog(work, "rollback", { stage: options.stage });
  return `stage=${options.stage} EXIT=0`;
}

export { STAGES };
