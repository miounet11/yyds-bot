import type { ComplianceProfile } from "../brief/types.js";

export interface ComplianceProfileSpec {
  id: ComplianceProfile;
  banned: string[];
  caution: string;
}

export const PROFILES: Record<ComplianceProfile, ComplianceProfileSpec> = {
  generic: {
    id: "generic",
    banned: [],
    caution: "No extra regulated-industry phrase list. YMYL still follows project.ymyl."
  },
  "legal-services": {
    id: "legal-services",
    banned: [
      "胜诉率",
      "包打赢",
      "包赢",
      "百分百胜诉",
      "关系硬",
      "法院有人",
      "guaranteed win",
      "win rate",
      "100% success"
    ],
    caution:
      "Legal-services preset: do not promise outcomes, do not rank lawyers by price, and do not treat the platform as a law firm. License identifiers that are shown must be real and publicly checkable. Fee quotes are service prices, not a split of legal fees. Hidden contact fields stay out of HTML, JSON-LD, llms.txt, and OpenAPI."
  },
  "ymyl-health": {
    id: "ymyl-health",
    banned: ["guaranteed cure", "miracle cure", "包治", "百分百治愈"],
    caution: "Health YMYL: no cure guarantees. Human review is required before index submission."
  },
  "ymyl-finance": {
    id: "ymyl-finance",
    banned: ["guaranteed return", "无风险收益", "保本保息"],
    caution: "Finance YMYL: no guaranteed-return claims. Human review is required before index submission."
  }
};
