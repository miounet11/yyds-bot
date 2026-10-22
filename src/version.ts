import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Package version from the yyds-bot package.json next to this install. */
export function readPackageVersion(fromUrl: string = import.meta.url): string {
  let dir = path.dirname(fileURLToPath(fromUrl));
  for (let i = 0; i < 6; i += 1) {
    try {
      const raw = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")) as { name?: string; version?: string };
      if (raw.name === "yyds-bot" && raw.version) return raw.version;
    } catch {
      /* parent */
    }
    dir = path.dirname(dir);
  }
  throw new Error("yyds-bot package.json not found");
}
