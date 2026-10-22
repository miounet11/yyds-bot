import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { Brief } from "../../brief/types.js";
import { publicOffers } from "../../site/model.js";
import type { Check } from "../types.js";

export async function aiChecks(brief: Brief, workDir: string, repoRoot: string): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (id: string, pass: boolean, detail: string) => checks.push({ id, pillar: "ai", pass, detail });
  const siteDir = path.join(workDir, "site");
  const openapi = JSON.parse(await readFile(path.join(siteDir, "openapi.json"), "utf8").catch(() => "null")) as {
    openapi?: string;
    paths?: Record<string, unknown>;
    "x-offers"?: { id: string; price: string; specialty: Record<string, string> }[];
  } | null;
  const offers = publicOffers(brief);
  add("openapi", Boolean(openapi?.openapi && openapi.paths?.["/api/offers.json"] && openapi.paths?.["/api/leads"]), openapi?.openapi ?? "missing");
  const api = JSON.parse(await readFile(path.join(siteDir, "api", "offers.json"), "utf8").catch(() => "null")) as { offers?: { id: string; price: string; specialty: Record<string, string> }[] } | null;
  const parity = offers.every((offer) => {
    const row = api?.offers?.find((item) => item.id === offer.id);
    const spec = openapi?.["x-offers"]?.find((item) => item.id === offer.id);
    return row?.price === offer.price && row?.specialty?.en === offer.specialty.en && spec?.price === offer.price;
  });
  add("offers-parity", parity && offers.length === (api?.offers?.length ?? 0), parity ? `${offers.length} offers` : "offer price or specialty drifted");
  const mcp = JSON.parse(await readFile(path.join(siteDir, "mcp.json"), "utf8").catch(() => "null")) as { tools?: { name: string }[] } | null;
  const toolNames = (mcp?.tools ?? []).map((tool) => tool.name);
  add("mcp", ["list_offers", "get_offer", "draft_lead"].every((name) => toolNames.includes(name)), toolNames.join(", ") || "missing mcp.json");
  const machines = await readFile(path.join(siteDir, ".well-known", "yyds-machines.json"), "utf8").catch(() => "");
  add("machine-descriptor", machines.includes("payment-demo") && machines.includes("invalid-phone"), "checkout descriptor");
  const design = await readFile(path.join(siteDir, ".well-known", "yyds-design.json"), "utf8").catch(() => "");
  add("design-descriptor", design.includes(brief.design.theme), brief.design.theme);
  const expansion = await readFile(path.join(workDir, "reports", "expansion.json"), "utf8").catch(() => "");
  add("expansion-report", expansion.includes("decisions"), expansion ? "expansion decisions recorded" : "missing expansion report");
  const state = JSON.parse(await readFile(path.join(workDir, "state.json"), "utf8").catch(() => "null")) as { stages?: Record<string, { status?: string }> } | null;
  const ready = ["expand", "intent", "infra", "build"].every((stage) => state?.stages?.[stage]?.status === "ok");
  add("stage-state", ready, ready ? "earlier stages ok" : "pipeline state incomplete");
  const timer = await readFile(path.join(workDir, "infra", "yyds-autopilot.timer"), "utf8").catch(() => "");
  const service = await readFile(path.join(workDir, "infra", "yyds-autopilot.service"), "utf8").catch(() => "");
  add("autopilot-units", timer.includes("OnCalendar") && service.includes("autopilot"), timer ? "systemd timer written" : "missing timer");
  const bootstrap = path.join(workDir, "infra", "bootstrap.sh");
  const script = await readFile(bootstrap, "utf8").catch(() => "");
  const syntax = spawnSync("bash", ["-n", bootstrap], { encoding: "utf8" });
  add(
    "bootstrap",
    syntax.status === 0 && ["nginx", "certbot", "systemd", "YYDS_BOOTSTRAP_EXECUTE"].every((word) => script.includes(word)),
    syntax.status === 0 ? "idempotent bootstrap parses" : syntax.stderr
  );
  const dns = JSON.parse(await readFile(path.join(workDir, "infra", "dns-plan.json"), "utf8").catch(() => "null")) as { records?: unknown[] } | null;
  add("dns-plan", Array.isArray(dns?.records) && (dns?.records.length ?? 0) > 0, "cloudflare plan written, not applied in local mode");
  const agents = await readFile(path.join(repoRoot, "AGENTS.md"), "utf8").catch(() => "");
  const claude = await readFile(path.join(repoRoot, "CLAUDE.md"), "utf8").catch(() => "");
  const rules = await readFile(path.join(repoRoot, ".cursor", "rules", "yyds-bot.mdc"), "utf8").catch(() => "");
  const instructions = await readFile(path.join(repoRoot, "INSTRUCTIONS.md"), "utf8").catch(() => "");
  const contract = [agents, claude, rules].every((text) => text.includes("yyds run")) && instructions.includes("EXIT=0") && !agents.toLowerCase().includes("ask the user what");
  add("agent-contract", contract, contract ? "AGENTS.md, CLAUDE.md, and Cursor rules point at yyds run" : "agent entry files incomplete");
  const auditLog = await stat(path.join(workDir, "audit", "publish-log.jsonl")).then(() => true).catch(() => false);
  add("publish-log", auditLog, auditLog ? "append-only publish log" : "missing publish log");
  return checks;
}
