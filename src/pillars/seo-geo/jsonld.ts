import type { Brief } from "../../brief/types.js";
import { addressText, phoneText, publicOffers, ui, type Page } from "../../site/model.js";
import { absUrl } from "../../util.js";

export interface Graph {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
}

function originOf(brief: Brief): string {
  return `${brief.domain.scheme}://${brief.domain.canonical_host}`;
}

export function buildGraph(brief: Brief, page: Page): Graph {
  const origin = originOf(brief);
  const pageUrl = absUrl(brief.domain.scheme, brief.domain.canonical_host, page.path);
  const orgId = `${origin}/#organization`;
  const personId = `${origin}/#person-${brief.brand.author.id}`;
  const websiteId = `${origin}/#website`;
  const defaultLang = brief.languages.find((lang) => lang.default) ?? brief.languages[0];
  const searchPath = defaultLang?.url_prefix === "/" ? "/search/" : `${defaultLang?.url_prefix}/search/`;
  const phone = phoneText(brief, page.lang);
  const address = addressText(brief, page.lang);
  const organization: Record<string, unknown> = {
    "@type": brief.schema_org.organization_type,
    "@id": orgId,
    name: brief.brand.name,
    url: origin + "/",
    description: brief.brand.description[page.lang],
    email: brief.brand.contact.email.visibility === "public" ? brief.brand.contact.email.value : undefined
  };
  if (phone && brief.brand.contact.phone.visibility === "public") organization.telephone = phone;
  if (address) {
    organization.address = { "@type": "PostalAddress", streetAddress: address };
  }
  const person: Record<string, unknown> = {
    "@type": brief.schema_org.person_type,
    "@id": personId,
    name: brief.brand.author.name,
    jobTitle: brief.brand.author.job_title[page.lang],
    description: brief.brand.author.bio[page.lang],
    worksFor: { "@id": orgId }
  };
  if (brief.brand.author.credential?.identifier) {
    person.hasCredential = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: brief.brand.author.credential.category[page.lang],
      identifier: brief.brand.author.credential.identifier,
      recognizedBy: brief.brand.author.credential.recognized_by
        ? { "@type": "Organization", name: brief.brand.author.credential.recognized_by }
        : undefined
    };
  }
  const website: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": websiteId,
    name: brief.brand.name,
    url: origin + "/",
    publisher: { "@id": orgId },
    inLanguage: brief.languages.map((lang) => lang.locale),
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}${searchPath}?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: page.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absUrl(brief.domain.scheme, brief.domain.canonical_host, crumb.path)
    }))
  };
  const webpage = {
    "@type": page.kind === "trust" && page.trust === "contact" ? "ContactPage" : page.kind === "trust" && page.trust === "about" ? "AboutPage" : "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: page.title,
    description: page.description,
    dateModified: page.updated,
    isPartOf: { "@id": websiteId },
    breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
    inLanguage: page.locale
  };
  const graph: Record<string, unknown>[] = [organization, person, website, webpage, breadcrumb];
  if (page.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: page.faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    });
  }
  if (page.kind === "attribute") {
    graph.push({
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: page.h1,
      description: page.summary,
      dateModified: page.updated,
      datePublished: page.updated,
      author: { "@id": personId },
      publisher: { "@id": orgId },
      mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
      citation: page.sources.map((source) => source.url)
    });
  }
  const offers = publicOffers(brief);
  if (offers.length && (page.kind === "home" || page.kind === "offer" || page.kind === "offer-index")) {
    const listed = page.offerId ? offers.filter((offer) => offer.id === page.offerId) : offers;
    for (const offer of listed) {
      const offerUrl = absUrl(brief.domain.scheme, brief.domain.canonical_host, `${page.lang === brief.languages.find((l) => l.default)?.code ? "" : ""}${offerPath(brief, page.lang, offer.id)}`);
      graph.push({
        "@type": "Offer",
        "@id": `${origin}/#offer-${offer.id}`,
        url: offerUrl,
        price: offer.price,
        priceCurrency: offer.currency,
        availability: `https://schema.org/${offer.availability}`,
        itemOffered: {
          "@type": brief.schema_org.offer_type,
          name: offer.name[page.lang],
          description: `${offer.specialty[page.lang]} ${offer.description[page.lang]}`
        }
      });
    }
    graph.push({
      "@type": "OfferCatalog",
      "@id": `${origin}/#catalog`,
      name: ui(brief, "offers_label", page.lang),
      itemListElement: listed.map((offer) => ({ "@id": `${origin}/#offer-${offer.id}` }))
    });
    organization.hasOfferCatalog = { "@id": `${origin}/#catalog` };
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function offerPath(brief: Brief, lang: string, id: string): string {
  const prefix = brief.languages.find((item) => item.code === lang)?.url_prefix ?? "/";
  const pre = prefix === "/" ? "" : prefix.replace(/\/$/, "");
  return `${pre}/offers/${id}/`;
}
