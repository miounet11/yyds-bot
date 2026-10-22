export interface LlmEnrichment {
  tagline?: { en?: string; zh?: string };
  homeIntro?: { en?: string; zh?: string };
}

export interface LlmEnv {
  baseUrl?: string;
  apiKey?: string;
  model: string;
}

/** OpenAI-compatible chat call. Returns null when the endpoint is missing or the payload is unusable. */
export async function tryLlmEnrich(
  input: { industry: string; topic: string; host: string },
  env: LlmEnv,
  fetchImpl: typeof fetch = fetch
): Promise<{ enrichment: LlmEnrichment | null; note: string }> {
  if (!env.baseUrl || !env.apiKey) {
    return { enrichment: null, note: "LLM endpoint not configured; encoded industry preset used." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetchImpl(`${env.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${env.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: env.model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Return JSON only with optional tagline and homeIntro objects, each with en and zh strings of at least 40 characters. Do not invent prices, credentials, or outcome promises."
          },
          {
            role: "user",
            content: JSON.stringify(input)
          }
        ]
      })
    });
    if (!response.ok) return { enrichment: null, note: `LLM HTTP ${response.status}; preset kept.` };
    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return { enrichment: null, note: "LLM returned no JSON object; preset kept." };
    const parsed = JSON.parse(match[0]) as LlmEnrichment;
    return { enrichment: parsed, note: "LLM enrichment accepted for tagline/home intro only." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return { enrichment: null, note: `LLM call failed (${message}); preset kept.` };
  } finally {
    clearTimeout(timer);
  }
}

export function mergeEnrichment(
  brief: { brand: { tagline: Record<string, string> }; home: { intro: Record<string, string> } },
  enrichment: LlmEnrichment | null
): string[] {
  if (!enrichment) return [];
  const notes: string[] = [];
  for (const lang of ["en", "zh"] as const) {
    const tagline = enrichment.tagline?.[lang];
    const intro = enrichment.homeIntro?.[lang];
    if (tagline && tagline.trim().length >= 40) {
      brief.brand.tagline[lang] = tagline.trim();
      notes.push(`brand.tagline.${lang} replaced from LLM`);
    }
    if (intro && intro.trim().length >= 80) {
      brief.home.intro[lang] = intro.trim();
      notes.push(`home.intro.${lang} replaced from LLM`);
    }
  }
  if (notes.length === 0) notes.push("LLM JSON did not meet length floors; preset copy kept.");
  return notes;
}
