import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { BriefError, type Brief } from "./types.js";

export interface LoadedInput {
  file: string;
  dir: string;
  raw: unknown;
  text: string;
}

export async function readInput(file: string): Promise<LoadedInput> {
  const abs = path.resolve(file);
  const text = await readFile(abs, "utf8");
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid YAML";
    throw new BriefError([`brief YAML parse failed: ${message}`]);
  }
  if (!raw || typeof raw !== "object") throw new BriefError(["brief must be a YAML mapping"]);
  return { file: abs, dir: path.dirname(abs), raw, text };
}

export function isCompleteBrief(raw: unknown): raw is Brief {
  if (!raw || typeof raw !== "object") return false;
  const data = raw as Record<string, unknown>;
  return data.version === "1" && Array.isArray(data.entities) && Array.isArray(data.intents);
}

export function minimalFromUnknown(raw: unknown): {
  industry?: string;
  topic?: string;
  domain?: string;
  scheme?: "https" | "http";
  mode?: "local" | "production";
  server?: { ssh_host?: string; ssh_user?: string; ssh_port?: number; web_root?: string };
} {
  const data = raw as Record<string, unknown>;
  const project = (data.project ?? {}) as Record<string, unknown>;
  const domain = data.domain;
  let host: string | undefined;
  let scheme: "https" | "http" | undefined;
  if (typeof domain === "string") host = domain;
  else if (domain && typeof domain === "object") {
    const record = domain as Record<string, unknown>;
    if (typeof record.canonical_host === "string") host = record.canonical_host;
    if (record.scheme === "http" || record.scheme === "https") scheme = record.scheme;
  }
  const server = (data.server ?? {}) as Record<string, unknown>;
  const mode =
    data.mode === "local" || data.mode === "production"
      ? data.mode
      : server.mode === "local" || server.mode === "production"
        ? server.mode
        : undefined;
  return {
    industry: typeof data.industry === "string" ? data.industry : typeof project.industry === "string" ? project.industry : undefined,
    topic: typeof data.topic === "string" ? data.topic : typeof project.topic === "string" ? project.topic : undefined,
    domain: host,
    scheme,
    mode,
    server: {
      ssh_host: typeof server.ssh_host === "string" ? server.ssh_host : undefined,
      ssh_user: typeof server.ssh_user === "string" ? server.ssh_user : undefined,
      ssh_port: typeof server.ssh_port === "number" ? server.ssh_port : undefined,
      web_root: typeof server.web_root === "string" ? server.web_root : undefined
    }
  };
}
