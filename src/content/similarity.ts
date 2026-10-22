export function contentTokens(text: string): string[] {
  const out: string[] = [];
  const re = /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)?|\p{Script=Han}/gu;
  for (const match of text.matchAll(re)) out.push(match[0].toLowerCase());
  return out;
}

export function shingles(tokens: string[], size = 5): Set<string> {
  if (tokens.length === 0) return new Set();
  if (tokens.length < size) return new Set([tokens.join(" ")]);
  const set = new Set<string>();
  for (let i = 0; i <= tokens.length - size; i++) set.add(tokens.slice(i, i + size).join(" "));
  return set;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const item of a) if (b.has(item)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
