import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { jaccard, shingles, contentTokens } from "../src/content/similarity.js";
import { contrastRatio } from "../src/util.js";
import { THEME_PRESETS } from "../src/design/themes.js";
import { runAutopilot, runPipeline, rollbackTo } from "../src/pipeline/run.js";
import { publishRelease, rollbackRelease } from "../src/pipeline/publish.js";
import { tryLlmEnrich } from "../src/llm/client.js";
import { readPackageVersion } from "../src/version.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempCwd(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "yyds-"));
  dirs.push(dir);
  return dir;
}

describe("zero-human pipeline", () => {
  it("builds a passing site from industry and domain only", async () => {
    const cwd = await tempCwd();
    const result = await runPipeline({ briefPath: path.join(root, "examples/minimal.yaml"), cwd, fresh: true, repoRoot: root });
    expect(result.card?.ok).toBe(true);
    expect(result.card?.pillars.seo_geo.score).toBe(100);
    expect(result.card?.pillars.ui.score).toBe(100);
    expect(result.card?.pillars.ai.score).toBe(100);
    const home = await readFile(path.join(result.workDir, "site/index.html"), "utf8");
    expect(home).toContain("application/ld+json");
    expect(home).toContain("answer-first");
    await expect(readFile(path.join(result.workDir, "site/llms.txt"), "utf8")).resolves.toContain("# Harbor Kiln");
    await expect(readFile(path.join(result.workDir, "site/openapi.json"), "utf8")).resolves.toContain("128.00");
    await expect(readFile(path.join(result.workDir, "deploy/current/index.html"), "utf8")).resolves.toContain("<h1>");
  });

  it("expands an unknown industry without asking", async () => {
    const cwd = await tempCwd();
    const brief = path.join(cwd, "brief.yaml");
    await writeFile(brief, "industry: bicycle-touring\ndomain: spoke-lane.example\n");
    const result = await runPipeline({ briefPath: brief, cwd, fresh: true, repoRoot: root });
    expect(result.card?.ok).toBe(true);
    const expansion = await readFile(path.join(result.workDir, "reports/expansion.json"), "utf8");
    expect(expansion).toContain("encoded-default");
  });

  it("holds YMYL index push and strips lead-only secrets", async () => {
    const cwd = await tempCwd();
    const brief = path.join(cwd, "brief.yaml");
    await writeFile(brief, "industry: legal-services\ndomain: studio-law.example\n");
    process.env.SITE_PHONE = "SENTINEL_PHONE_9f3a";
    try {
      const result = await runPipeline({ briefPath: brief, cwd, fresh: true, repoRoot: root });
      expect(result.card?.ok).toBe(true);
      const html = await readFile(path.join(result.workDir, "site/index.html"), "utf8");
      expect(html).not.toContain("SENTINEL_PHONE_9f3a");
      expect(html).toContain("Attorney");
      expect(html).toContain('data-ymyl="unreviewed"');
      const plan = JSON.parse(await readFile(path.join(result.workDir, "reports/index-plan.json"), "utf8")) as { ymyl_hold: boolean };
      expect(plan.ymyl_hold).toBe(true);
    } finally {
      delete process.env.SITE_PHONE;
    }
  });

  it("promotes a backlog page from the measurement fixture", async () => {
    const cwd = await tempCwd();
    const first = await runAutopilot({ briefPath: path.join(root, "examples/minimal.yaml"), cwd, repoRoot: root });
    expect(first.lines.join("\n")).toContain("added=1");
    expect(first.card?.ok).toBe(true);
    await expect(readFile(path.join(first.workDir, "site/entities/ceramic-v60/grind/index.html"), "utf8")).resolves.toContain("grind");
    const second = await runAutopilot({ briefPath: path.join(root, "examples/minimal.yaml"), cwd, repoRoot: root });
    expect(second.lines.join("\n")).toContain("added=0");
  });

  it("refuses to invent a domain", async () => {
    const cwd = await tempCwd();
    const brief = path.join(cwd, "brief.yaml");
    await writeFile(brief, "industry: specialty-coffee\n");
    await expect(runPipeline({ briefPath: brief, cwd, fresh: true, repoRoot: root })).rejects.toThrow(/domain is required/);
  });
});

describe("gates and design", () => {
  it("reports package version 1.0.0", () => {
    expect(readPackageVersion()).toBe("1.0.0");
  });

  it("flags duplicate prose and accepts distinct prose", () => {
    const same = shingles(contentTokens("alpha beta gamma delta epsilon zeta"));
    expect(jaccard(same, same)).toBe(1);
    const other = shingles(contentTokens("harbor kiln ceramic ratio fifteen grams"));
    expect(jaccard(same, other)).toBeLessThan(0.2);
  });

  it("keeps theme pairs at WCAG AA", () => {
    for (const tokens of Object.values(THEME_PRESETS)) {
      expect(contrastRatio(tokens.colorText, tokens.colorBackground)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens.colorActionText, tokens.colorAction)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens.colorOnPrimary, tokens.colorPrimary)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps an unusable LLM response from replacing the preset", async () => {
    const result = await tryLlmEnrich(
      { industry: "specialty-coffee", topic: "brewing", host: "harbor-kiln.example" },
      { baseUrl: "https://llm.example/v1", apiKey: "test", model: "demo" },
      (async () => new Response("not json", { status: 200 })) as typeof fetch
    );
    expect(result.enrichment).toBeNull();
  });

  it("rolls a release back to the previous symlink", async () => {
    const cwd = await tempCwd();
    const siteA = path.join(cwd, "a");
    const siteB = path.join(cwd, "b");
    await mkdir(siteA, { recursive: true });
    await mkdir(siteB, { recursive: true });
    await writeFile(path.join(siteA, "index.html"), "A");
    await writeFile(path.join(siteB, "index.html"), "B");
    const deploy = path.join(cwd, "deploy");
    await publishRelease(deploy, siteA);
    await publishRelease(deploy, siteB);
    expect(await readFile(path.join(deploy, "current/index.html"), "utf8")).toBe("B");
    await rollbackRelease(deploy);
    expect(await readFile(path.join(deploy, "current/index.html"), "utf8")).toBe("A");
  });

  it("rolls the build stage back and can resume", async () => {
    const cwd = await tempCwd();
    const brief = path.join(root, "examples/minimal.yaml");
    await runPipeline({ briefPath: brief, cwd, fresh: true, repoRoot: root });
    const line = await rollbackTo({ briefPath: brief, cwd, stage: "build" });
    expect(line).toContain("EXIT=0");
    const again = await runPipeline({ briefPath: brief, cwd, repoRoot: root });
    expect(again.card?.ok).toBe(true);
  });
});

