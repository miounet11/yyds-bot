/**
 * Optional Lighthouse CI. The quality stage always enforces a static
 * performance budget (HTML/CSS/JS size, script count, image dimensions).
 * Run this when Chrome is installed:
 *   npx lhci autorun
 * The site under test is the last local build at .yyds/<project>/site.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: ".yyds/harbor-kiln/site",
      numberOfRuns: 1,
      settings: {
        onlyCategories: ["performance", "accessibility", "seo", "best-practices"]
      }
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }]
      }
    },
    upload: {
      target: "filesystem",
      outputDir: ".yyds/harbor-kiln/reports/lighthouse"
    }
  }
};
