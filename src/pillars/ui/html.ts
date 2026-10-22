import type { Brief } from "../../brief/types.js";
import type { DesignTokens } from "../../design/themes.js";
import { equivalents, phoneText, publicOffers, ui, type Page } from "../../site/model.js";
import { absUrl, esc, jsonLdScript, pagePath } from "../../util.js";
import type { Graph } from "../seo-geo/jsonld.js";

export function describedBy(brief: Brief, page: Page): string {
  const prefix = brief.languages.find((lang) => lang.code === page.lang)?.url_prefix ?? "/";
  if (page.entityId && brief.ai.per_entity_llms) return pagePath(prefix, `entities/${page.entityId}/llms.txt`);
  return pagePath(prefix, "llms.txt");
}

export function renderHtml(brief: Brief, page: Page, pages: Page[], graph: Graph, tokens: DesignTokens): string {
  const origin = `${brief.domain.scheme}://${brief.domain.canonical_host}`;
  const canonical = absUrl(brief.domain.scheme, brief.domain.canonical_host, page.path);
  const md = page.path === "/" ? "/index.md" : `${page.path}index.md`;
  const alternates = equivalents(pages, page)
    .map((item) => {
      const language = brief.languages.find((lang) => lang.code === item.lang);
      return `<link rel="alternate" hreflang="${esc(language?.locale ?? item.lang)}" href="${esc(absUrl(brief.domain.scheme, brief.domain.canonical_host, item.path))}">`;
    })
    .join("");
  const xDefault = equivalents(pages, page).find((item) => brief.languages.find((lang) => lang.default)?.code === item.lang);
  const robots = page.noindex ? "noindex,follow" : "index,follow";
  const ymyl = brief.project.ymyl && !brief.project.human_review_approved ? "unreviewed" : brief.project.ymyl ? "reviewed" : "na";
  const dark = tokens.colorBackground.toLowerCase() === "#0c0c0e";
  const offers = publicOffers(brief);
  const showOffers = page.kind === "home" || page.kind === "offer-index" || page.kind === "offer";
  const nav = [
    ["entities", "nav_entities"],
    ["offers", "nav_offers"],
    ["faq", "nav_faq"],
    ["about", "nav_about"],
    ["author", "nav_author"],
    ["contact", "nav_contact"],
    ["editorial-policy", "nav_editorial"]
  ] as const;
  const prefix = brief.languages.find((lang) => lang.code === page.lang)?.url_prefix ?? "/";
  const phone = phoneText(brief, page.lang);
  const email = brief.brand.contact.email.visibility === "public" ? brief.brand.contact.email.value : null;
  return `<!DOCTYPE html>
<html lang="${esc(page.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="${dark ? "dark" : "light"}">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(canonical)}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${esc(absUrl(brief.domain.scheme, brief.domain.canonical_host, xDefault?.path ?? page.path))}">
<link rel="alternate" type="text/markdown" href="${esc(origin + md)}">
<link rel="describedby" href="${esc(origin + describedBy(brief, page))}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="${page.kind === "attribute" ? "article" : "website"}">
<meta property="og:image" content="${esc(origin)}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">${jsonLdScript(graph)}</script>
</head>
<body data-ymyl="${ymyl}" data-page="${esc(page.kind)}">
<a class="skip-link" href="#content">${esc(ui(brief, "skip", page.lang))}</a>
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="${esc(pagePath(prefix))}">${esc(brief.brand.name)}</a>
    <nav class="nav" aria-label="Primary">
      ${nav.map(([slug, key]) => `<a href="${esc(pagePath(prefix, slug))}">${esc(ui(brief, key, page.lang))}</a>`).join("")}
      ${brief.languages.map((language) => {
        const sibling = equivalents(pages, page).find((item) => item.lang === language.code);
        return `<a href="${esc(sibling?.path ?? language.url_prefix)}" hreflang="${esc(language.locale)}">${esc(language.code.toUpperCase())}</a>`;
      }).join("")}
    </nav>
  </div>
</header>
<div class="site-layout">
  <aside class="trust-card">
    <p class="kicker">${esc(brief.brand.name)}</p>
    <p><a href="${esc(pagePath(prefix, "author"))}">${esc(brief.brand.author.name)}</a><br>${esc(brief.brand.author.job_title[page.lang])}</p>
    <p class="muted">${esc(ui(brief, "updated", page.lang))} <time datetime="${esc(page.updated)}">${esc(page.updated)}</time></p>
    ${email ? `<p><a href="mailto:${esc(email)}">${esc(email)}</a></p>` : ""}
    ${phone ? `<p>${esc(ui(brief, "phone", page.lang))}: ${esc(phone)}</p>` : ""}
    ${brief.project.ymyl && !brief.project.human_review_approved ? `<p>${esc(brief.compliance.notes[page.lang].slice(0, 180))}</p>` : ""}
  </aside>
  <main id="content">
    <nav class="crumbs" aria-label="Breadcrumb"><ol>
      ${page.breadcrumbs.map((crumb) => `<li><a href="${esc(crumb.path)}">${esc(crumb.name)}</a></li>`).join("")}
    </ol></nav>
    <h1>${esc(page.h1)}</h1>
    <section class="answer-first" data-geo="summary" aria-label="${esc(ui(brief, "answer_label", page.lang))}">
      <p data-prose="summary">${esc(page.summary)}</p>
    </section>
    ${page.facts.length ? `<table class="fact-table"><caption>${esc(ui(brief, "table_caption", page.lang))}</caption><thead><tr><th>${esc(ui(brief, "fact", page.lang))}</th><th>${esc(ui(brief, "value", page.lang))}</th><th>${esc(ui(brief, "source", page.lang))}</th></tr></thead><tbody>${page.facts
      .map(
        (fact) =>
          `<tr><td>${esc(fact.label)}</td><td>${esc(fact.value)}</td><td><a href="${esc(fact.sourceUrl)}">${esc(fact.sourceTitle)}</a></td></tr>`
      )
      .join("")}</tbody></table>` : ""}
    ${page.paragraphs.map((paragraph) => `<p data-prose="body">${esc(paragraph)}</p>`).join("")}
    ${
      page.kind === "entity"
        ? `<ul>${brief.entities
            .find((entity) => entity.id === page.entityId)
            ?.attributes.map(
              (attr) =>
                `<li><a href="${esc(pagePath(prefix, `entities/${page.entityId}/${attr.id}`))}">${esc(attr.name[page.lang])}</a></li>`
            )
            .join("")}</ul>`
        : ""
    }
    ${
      page.kind === "entity-index"
        ? `<ul>${brief.entities.map((entity) => `<li><a href="${esc(pagePath(prefix, `entities/${entity.id}`))}">${esc(entity.name[page.lang])}</a></li>`).join("")}</ul>`
        : ""
    }
    ${
      showOffers
        ? `<h2>${esc(ui(brief, "offers_label", page.lang))}</h2><div class="offer-grid">${(page.offerId ? offers.filter((offer) => offer.id === page.offerId) : offers)
            .map(
              (offer) => `<article class="offer-card" data-offer-id="${esc(offer.id)}">
              <h3>${esc(offer.name[page.lang])}</h3>
              <p>${esc(offer.specialty[page.lang])}</p>
              <p class="price">${esc(offer.price)} ${esc(offer.currency)}</p>
              <p>${esc(offer.delivery[page.lang])}</p>
              <a href="${esc(pagePath(prefix, `offers/${offer.id}`))}">${esc(offer.name[page.lang])}</a>
              ${brief.conversion.checkout === "static-demo" ? `<button class="cta" type="button" data-action="open" data-offer-id="${esc(offer.id)}">${esc(ui(brief, "buy", page.lang))}</button>` : ""}
            </article>`
            )
            .join("")}</div>`
        : ""
    }
    ${
      page.faqs.length
        ? `<section class="faq-list" aria-label="${esc(ui(brief, "faq_label", page.lang))}"><h2>${esc(ui(brief, "faq_label", page.lang))}</h2><dl>${page.faqs
            .map((item) => `<dt>${esc(item.q)}</dt><dd>${esc(item.a)}</dd>`)
            .join("")}</dl></section>`
        : ""
    }
    ${
      page.sources.length
        ? `<section><h2>${esc(ui(brief, "sources", page.lang))}</h2><ul>${page.sources
            .map((source) => `<li><a href="${esc(source.url)}">${esc(source.title)}</a> — ${esc(source.publisher)}</li>`)
            .join("")}</ul></section>`
        : ""
    }
    ${page.kind === "search" ? renderSearch(brief, page, pages) : ""}
    <p><a href="${esc(md)}">${esc(ui(brief, "read_md", page.lang))}</a></p>
    ${brief.conversion.checkout === "static-demo" ? renderMachine(brief, page) : ""}
  </main>
</div>
<nav class="bottom-bar" aria-label="Mobile">
  <a href="${esc(pagePath(prefix, "offers"))}">${esc(ui(brief, "bottom_offers", page.lang))}</a>
  <a href="${esc(pagePath(prefix, "contact"))}">${esc(ui(brief, "bottom_contact", page.lang))}</a>
  <a href="${esc(pagePath(prefix, "search"))}">${esc(ui(brief, "nav_search", page.lang))}</a>
</nav>
<footer class="wrap"><p>${esc(ui(brief, "footer_note", page.lang))}</p></footer>
${brief.analytics.provider === "plausible" ? `<script defer data-domain="${esc(brief.analytics.domain)}" src="${esc(brief.analytics.src)}"></script>` : ""}
${brief.analytics.provider === "ga4" ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(brief.analytics.measurement_id)}"></script>` : ""}
</body>
</html>
`;
}

function renderSearch(brief: Brief, page: Page, pages: Page[]): string {
  const index = pages
    .filter((item) => item.lang === page.lang && !item.noindex)
    .map((item) => ({ title: item.title, url: item.path, summary: item.summary }));
  return `<form action="${esc(page.path)}" method="get"><label>${esc(ui(brief, "search_label", page.lang))}<input type="search" name="q" placeholder="${esc(ui(brief, "search_placeholder", page.lang))}"></label></form>
<ul id="results">${index.map((item) => `<li><a href="${esc(item.url)}">${esc(item.title)}</a></li>`).join("")}</ul>
<script>const INDEX=${JSON.stringify(index).replace(/</g, "\\u003c")};const q=new URLSearchParams(location.search).get("q")||"";const list=document.getElementById("results");if(q&&list){list.innerHTML=INDEX.filter(i=> (i.title+" "+i.summary).toLowerCase().includes(q.toLowerCase())).map(i=>"<li><a href=\\""+i.url+"\\">"+i.title+"</a></li>").join("")||list.innerHTML;}</script>`;
}

function renderMachine(brief: Brief, page: Page): string {
  return `<section data-machine="checkout" data-state="closed" aria-label="${esc(ui(brief, "buy", page.lang))}">
  <form data-panel="drawer">
    <p data-offer-name></p>
    <label>${esc(ui(brief, "phone", page.lang))}<input name="phone" inputmode="tel" autocomplete="tel"></label>
    <label>${esc(ui(brief, "note", page.lang))}<textarea name="note"></textarea></label>
    <button class="cta" type="button" data-action="submit-contact">${esc(ui(brief, "buy", page.lang))}</button>
    <button class="cta secondary" type="button" data-action="close">${esc(ui(brief, "close", page.lang))}</button>
  </form>
  <p data-panel="invalid" role="alert">${esc(ui(brief, "phone", page.lang))}</p>
  <div data-panel="payment">
    <p>${esc(ui(brief, "machine_note", page.lang))}</p>
    <button class="cta" type="button" data-action="confirm-demo">${esc(ui(brief, "demo_pay", page.lang))}</button>
  </div>
  <div data-panel="receipt">
    <h2>${esc(ui(brief, "receipt", page.lang))}</h2>
    <p data-receipt-id class="mono"></p>
    <p>${esc(ui(brief, "ai_ref", page.lang))} <span data-receipt-ref></span></p>
  </div>
</section>
<script src="/assets/machines.js" defer></script>`;
}

export const MACHINES_JS = `/* checkout states: closed -> drawer -> invalid-phone | payment-demo -> receipt */
(function () {
  const root = document.querySelector("[data-machine=checkout]");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const ref = params.get("ai_ref") || "direct";
  function setState(state) { root.dataset.state = state; root.dataset.aiRef = ref; }
  function open(id) {
    root.dataset.offerId = id || "";
    const name = root.querySelector("[data-offer-name]");
    const card = id ? document.querySelector('[data-offer-id="' + id + '"] h3') : null;
    if (name) name.textContent = card ? card.textContent : id;
    setState("drawer");
  }
  const sku = params.get("checkout_sku");
  if (sku) open(sku);
  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.getAttribute("data-action");
    if (action === "open") open(button.getAttribute("data-offer-id"));
    if (action === "close") setState("closed");
    if (action === "submit-contact") {
      const phone = root.querySelector("[name=phone]").value.trim();
      if (!/^\\+?[0-9][0-9 \\-]{6,}$/.test(phone)) setState("invalid-phone");
      else setState("payment-demo");
    }
    if (action === "confirm-demo") {
      setState("receipt");
      root.querySelector("[data-receipt-id]").textContent = "demo-" + Date.now();
      root.querySelector("[data-receipt-ref]").textContent = ref;
    }
  });
})();
`;
