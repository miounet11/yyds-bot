export function countWords(text: string): number {
  const cjk = text.match(/\p{Script=Han}/gu) ?? [];
  const stripped = text.replace(/\p{Script=Han}/gu, " ");
  const latin = stripped.match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)?/g) ?? [];
  return cjk.length + latin.length;
}
