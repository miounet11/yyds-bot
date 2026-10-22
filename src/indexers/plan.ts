import type { Brief } from "../brief/types.js";

export interface IndexPlan {
  urls: string[];
  ymyl_hold: boolean;
  live_submit: boolean;
  channels: Record<string, { enabled: boolean; submitted: boolean; reason: string }>;
}

export function buildIndexPlan(brief: Brief, urls: string[]): IndexPlan {
  const ymylHold = brief.project.ymyl && !brief.project.human_review_approved;
  const channels: IndexPlan["channels"] = {
    indexnow: channel(brief.index.indexnow.enabled, brief.index.indexnow.key_env, brief, ymylHold, "IndexNow"),
    google_search_console: channel(brief.index.google_search_console.enabled, brief.index.google_search_console.credentials_env, brief, ymylHold, "Google Search Console sitemap"),
    baidu: channel(brief.index.baidu.enabled, brief.index.baidu.token_env, brief, ymylHold, "Baidu push"),
    wechat_miniprogram: {
      enabled: brief.index.wechat_miniprogram.enabled,
      submitted: false,
      reason: "No mini program is generated. The website is the crawlable twin; enable wechat only when a separate app id exists."
    }
  };
  if (!ymylHold && brief.index.live_submit && brief.index.on_missing_credentials === "fail") {
    for (const [name, item] of Object.entries(channels)) {
      if (item.enabled && item.reason.includes("missing")) {
        throw new Error(`index channel ${name} is missing credentials and on_missing_credentials=fail`);
      }
    }
  }
  return { urls, ymyl_hold: ymylHold, live_submit: brief.index.live_submit && !ymylHold, channels };
}

function channel(enabled: boolean, envName: string, brief: Brief, ymylHold: boolean, label: string): { enabled: boolean; submitted: boolean; reason: string } {
  if (!enabled) return { enabled: false, submitted: false, reason: `${label} disabled in the brief.` };
  if (ymylHold) return { enabled: true, submitted: false, reason: "YMYL human_review_approved is false. Push is held. The site stays crawlable." };
  if (!brief.index.live_submit) return { enabled: true, submitted: false, reason: "live_submit is false. Payload is planned only." };
  if (!process.env[envName]) {
    return { enabled: true, submitted: false, reason: `missing ${envName}. Downgraded to plan.` };
  }
  return { enabled: true, submitted: false, reason: `${label} credentials are present. Submit from the index stage.` };
}

export async function submitIndex(plan: IndexPlan, brief: Brief, fetchImpl: typeof fetch = fetch): Promise<IndexPlan> {
  const next = structuredClone(plan);
  if (!next.live_submit) return next;
  if (next.channels.indexnow?.enabled && process.env[brief.index.indexnow.key_env]) {
    const key = process.env[brief.index.indexnow.key_env] ?? "";
    const response = await fetchImpl("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        host: brief.domain.canonical_host,
        key,
        keyLocation: `${brief.domain.scheme}://${brief.domain.canonical_host}/${key}.txt`,
        urlList: plan.urls
      })
    });
    next.channels.indexnow = { enabled: true, submitted: response.ok, reason: `IndexNow HTTP ${response.status}` };
  }
  if (next.channels.google_search_console?.enabled && process.env[brief.index.google_search_console.credentials_env]) {
    const token = process.env[brief.index.google_search_console.credentials_env];
    const site = encodeURIComponent(brief.index.google_search_console.site_url);
    const sitemap = encodeURIComponent(`${brief.domain.scheme}://${brief.domain.canonical_host}/sitemap.xml`);
    const response = await fetchImpl(`https://www.googleapis.com/webmasters/v3/sites/${site}/sitemaps/${sitemap}`, {
      method: "PUT",
      headers: { authorization: `Bearer ${token}` }
    });
    next.channels.google_search_console = { enabled: true, submitted: response.ok, reason: `GSC HTTP ${response.status}` };
  }
  if (next.channels.baidu?.enabled && process.env[brief.index.baidu.token_env]) {
    const token = process.env[brief.index.baidu.token_env];
    const response = await fetchImpl(`http://data.zz.baidu.com/urls?site=${encodeURIComponent(brief.index.baidu.site)}&token=${encodeURIComponent(token ?? "")}`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: plan.urls.join("\n")
    });
    next.channels.baidu = { enabled: true, submitted: response.ok, reason: `Baidu HTTP ${response.status}` };
  }
  return next;
}
