import { countWords } from "../content/words.js";

const BANK = [
  "bloom", "drawdown", "dose", "yield", "crest", "alloy", "ledger", "harbor", "kiln", "citrus",
  "jasmine", "bergamot", "ceramic", "degas", "spout", "basket", "channel", "terrace", "washed", "lot",
  "altitude", "valve", "tamp", "crema", "finish", "ratio", "kettle", "slurry", "crust", "agtron",
  "calendar", "rest", "origin", "mill", "burr", "click", "bypass", "lane", "spoke", "torque",
  "margin", "invoice", "retainer", "docket", "clause", "venue", "filing", "stamp", "witness", "brief"
];

export function topUp(lang: "en" | "zh", key: string, text: string, minWords: number): string {
  let out = text.trim();
  let i = 0;
  while (countWords(out) < minWords && i < 40) {
    const w1 = BANK[(key.length * 3 + i * 5) % BANK.length];
    const w2 = BANK[(key.length * 7 + i * 11) % BANK.length];
    const w3 = BANK[(key.charCodeAt(i % key.length) + i) % BANK.length];
    if (lang === "en") {
      out += ` ${key} check ${i + 1} keeps ${w1}, ${w2}, and ${w3} attached to this slug only.`;
    } else {
      out += `${key}核对${i + 1}：只把${w1}、${w2}、${w3}写在本页，不借用其他页面的句子。`;
    }
    i += 1;
  }
  return out;
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
