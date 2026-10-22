import type { Brief } from "../brief/types.js";
import { aiChecks } from "./ai/checks.js";
import { seoChecks } from "./seo-geo/checks.js";
import type { Check, PillarId, PillarScore, Scorecard } from "./types.js";
import { uiChecks } from "./ui/checks.js";
import path from "node:path";

export async function scoreSite(brief: Brief, workDir: string, repoRoot: string, attempts = 1): Promise<Scorecard> {
  const checks: Check[] = [
    ...(await seoChecks(brief, path.join(workDir, "site"), path.join(workDir, "infra"), path.join(workDir, "reports"))),
    ...(await uiChecks(brief, path.join(workDir, "site"))),
    ...(await aiChecks(brief, workDir, repoRoot))
  ];
  const pillars = {} as Scorecard["pillars"];
  for (const pillar of ["seo_geo", "ui", "ai"] as PillarId[]) {
    const subset = checks.filter((check) => check.pillar === pillar);
    const score = subset.length ? Math.round((100 * subset.filter((check) => check.pass).length) / subset.length) : 0;
    const threshold = brief.thresholds[pillar];
    const row: PillarScore = { score, threshold, pass: score >= threshold && subset.every((check) => check.pass), checks: subset };
    pillars[pillar] = row;
  }
  return { ok: Object.values(pillars).every((pillar) => pillar.pass), attempts, pillars };
}

export function formatScorecard(card: Scorecard): string {
  const lines = [];
  for (const [name, pillar] of Object.entries(card.pillars)) {
    lines.push(`pillar=${name} score=${pillar.score} threshold=${pillar.threshold} EXIT=${pillar.pass ? 0 : 1}`);
    for (const check of pillar.checks.filter((item) => !item.pass)) lines.push(`failed=${check.id} detail=${check.detail}`);
  }
  lines.push(`audit EXIT=${card.ok ? 0 : 1} attempts=${card.attempts}`);
  return lines.join("\n");
}
