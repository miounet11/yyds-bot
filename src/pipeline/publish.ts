import { cp, mkdir, readFile, readlink, rename, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";

export async function publishRelease(deployDir: string, siteDir: string): Promise<string> {
  const id = new Date().toISOString().replace(/[:.]/g, "-");
  const release = path.join(deployDir, "releases", id);
  await mkdir(path.dirname(release), { recursive: true });
  await cp(siteDir, release, { recursive: true });
  const current = path.join(deployDir, "current");
  try {
    const previous = await readlink(current);
    await writeFile(path.join(deployDir, "previous"), previous);
  } catch {
    /* first release */
  }
  const tmp = path.join(deployDir, `current.tmp-${id}`);
  await symlink(release, tmp);
  await rename(tmp, current);
  return id;
}

export async function rollbackRelease(deployDir: string): Promise<void> {
  const previous = (await readFile(path.join(deployDir, "previous"), "utf8")).trim();
  const current = path.join(deployDir, "current");
  const tmp = path.join(deployDir, "current.rollback");
  await rm(tmp, { force: true });
  await symlink(previous, tmp);
  await rename(tmp, current);
}
