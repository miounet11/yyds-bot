import { createHash } from "node:crypto";

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function pagePath(prefix: string, slug = ""): string {
  const pre = prefix === "/" ? "" : `/${prefix.replace(/^\/|\/$/g, "")}`;
  const tail = slug.replace(/^\/|\/$/g, "");
  const joined = tail ? `${pre}/${tail}` : pre;
  if (!joined) return "/";
  return joined.endsWith("/") ? joined : `${joined}/`;
}

export function urlToFile(urlPath: string, leaf: "index.html" | "index.md"): string {
  if (urlPath === "/") return leaf;
  return `${urlPath.replace(/^\/|\/$/g, "")}/${leaf}`;
}

export function absUrl(scheme: string, host: string, urlPath: string): string {
  return `${scheme}://${host}${urlPath === "/" ? "/" : urlPath}`;
}

export function hostSlug(host: string): string {
  const label = host.replace(/^www\./, "").split(".")[0] ?? host;
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "site";
}

export function titleFromHost(host: string): string {
  return hostSlug(host)
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isHostname(value: string): boolean {
  return /^[a-z0-9.-]+$/i.test(value) && value.includes(".") && !value.includes("..") && !value.startsWith(".") && !value.endsWith(".");
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function lin(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bch] = hexToRgb(hex);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bch);
  };
  const l1 = lum(a);
  const l2 = lum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function looksLikeSecret(value: string): boolean {
  return /^sk-[a-zA-Z0-9]{10,}/.test(value) || /^sk-ant-/.test(value);
}
