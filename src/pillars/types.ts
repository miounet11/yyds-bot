export type PillarId = "seo_geo" | "ui" | "ai";

export interface Check {
  id: string;
  pillar: PillarId;
  pass: boolean;
  detail: string;
}

export interface PillarScore {
  score: number;
  threshold: number;
  pass: boolean;
  checks: Check[];
}

export interface Scorecard {
  ok: boolean;
  attempts: number;
  pillars: Record<PillarId, PillarScore>;
}
