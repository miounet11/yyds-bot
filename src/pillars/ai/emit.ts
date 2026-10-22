import type { Brief } from "../../brief/types.js";
import { publicOffers } from "../../site/model.js";
import { absUrl } from "../../util.js";

export function renderOffersApi(brief: Brief): unknown {
  return {
    publisher: brief.brand.name,
    offers: publicOffers(brief).map((offer) => ({
      id: offer.id,
      name: offer.name,
      specialty: offer.specialty,
      description: offer.description,
      price: offer.price,
      currency: offer.currency,
      availability: offer.availability,
      delivery: offer.delivery,
      url: absUrl(brief.domain.scheme, brief.domain.canonical_host, `/offers/${offer.id}/`),
      checkout_url: absUrl(brief.domain.scheme, brief.domain.canonical_host, `/?checkout_sku=${offer.id}`)
    }))
  };
}

export function renderOpenApi(brief: Brief): unknown {
  const origin = `${brief.domain.scheme}://${brief.domain.canonical_host}`;
  const offers = publicOffers(brief);
  return {
    openapi: "3.1.0",
    info: {
      title: `${brief.brand.name} catalog`,
      version: "1.0.0",
      description: "Static catalog. draft_lead does not charge a card or store a phone number on a server."
    },
    servers: [{ url: origin }],
    paths: {
      "/api/offers.json": {
        get: {
          operationId: "listOffers",
          summary: "List public offers with price and specialty",
          responses: { "200": { description: "Offer list" } }
        }
      },
      "/api/offers/{id}.json": {
        get: {
          operationId: "getOffer",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", enum: offers.map((offer) => offer.id) } }],
          responses: { "200": { description: "One offer" } }
        }
      },
      "/api/leads": {
        post: {
          operationId: "draftLead",
          "x-yyds-binding": "static-demo",
          summary: "Demo lead. The static site records nothing.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["offer_id", "phone"],
                  properties: {
                    offer_id: { type: "string" },
                    phone: { type: "string" },
                    note: { type: "string" },
                    ai_ref: { type: "string" }
                  }
                }
              }
            }
          },
          responses: { "200": { description: "Demo receipt id" } }
        }
      }
    },
    "x-offers": offers.map((offer) => ({
      id: offer.id,
      price: offer.price,
      currency: offer.currency,
      specialty: offer.specialty
    }))
  };
}

export function renderMcp(brief: Brief): unknown {
  return {
    name: `${brief.project.id}-catalog`,
    description: "Read offers and draft a demo lead. Payments are out of band.",
    tools: [
      { name: "list_offers", description: "List public offers with price, currency, and specialty.", href: "/api/offers.json" },
      { name: "get_offer", description: "Read one offer by id.", href: "/api/offers/{id}.json" },
      { name: "draft_lead", description: "Describe a lead. The static demo does not persist it.", href: "/api/leads" }
    ]
  };
}

export function renderMachinesDescriptor(): unknown {
  return {
    checkout: {
      initial: "closed",
      states: ["closed", "drawer", "invalid-phone", "payment-demo", "receipt"],
      transitions: [
        { from: "closed", event: "open", to: "drawer" },
        { from: "drawer", event: "submit-contact", to: "payment-demo", guard: "phone-format" },
        { from: "drawer", event: "submit-contact", to: "invalid-phone" },
        { from: "invalid-phone", event: "submit-contact", to: "payment-demo", guard: "phone-format" },
        { from: "payment-demo", event: "confirm-demo", to: "receipt" },
        { from: "receipt", event: "close", to: "closed" },
        { from: "drawer", event: "close", to: "closed" }
      ],
      note: "payment-demo does not charge a card."
    }
  };
}
