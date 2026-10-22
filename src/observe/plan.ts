import type { Brief } from "../brief/types.js";

export interface GscRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  position: number;
}

export function nextContentPlan(brief: Brief, rows: GscRow[], synthetic: boolean): {
  synthetic: boolean;
  covered: GscRow[];
  gaps: GscRow[];
} {
  const known = new Set(brief.intents.flatMap((intent) => Object.values(intent.query).map((query) => query.toLowerCase())));
  const floor = brief.observe.min_impressions;
  const covered = rows.filter((row) => known.has(row.query.toLowerCase()));
  const gaps = rows.filter((row) => row.impressions >= floor && !known.has(row.query.toLowerCase()));
  return { synthetic, covered, gaps };
}
