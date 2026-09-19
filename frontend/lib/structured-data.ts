/**
 * Schema.org JSON-LD, derived from the SITE constants so structured data can
 * never drift from the <title>/OG/description that read the same source. Every
 * builder returns a self-contained @graph and is validated by a Zod schema
 * before it ships, keeping this file in the same "define once, validate at the
 * edge" discipline as the API contract (lib/contract.ts).
 *
 * Shape is tuned for machine citation (search + answer engines): stable @ids so
 * nodes across blocks resolve to one entity, a publishing Organization, the
 * source text linked out to Wikipedia/Wikidata for disambiguation, and an
 * FAQPage carrying the questions an assistant is most likely to quote.
 */
import { z } from "zod";

import { SITE } from "@/lib/site";

const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;
const WEBAPP_ID = `${SITE.url}/#webapp`;
const GITA_ID = `${SITE.url}/#bhagavad-gita`;

/** Last substantive content/policy update; kept in step with the legal pages. */
const MODIFIED = "2026-09-17";
const LANG = "en-GB";

/** Structural guard: catches missing @type/@id and malformed graphs. */
const JsonLdSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@graph": z
    .array(
      z.looseObject({
        "@type": z.union([z.string(), z.array(z.string())]),
        "@id": z.string().optional(),
      }),
    )
    .min(1),
});

export type JsonLd = z.infer<typeof JsonLdSchema>;

/** The publisher. Same @id everywhere so the entity is singular across pages. */
const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  email: SITE.contactEmail,
  logo: {
    "@type": "ImageObject",
    url: `${SITE.url}/icon`,
    width: 32,
    height: 32,
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: SITE.contactEmail,
    contactType: "privacy and data protection",
    areaServed: "GB",
    availableLanguage: "English",
  },
  privacyPolicy: `${SITE.url}/privacy`,
  termsOfService: `${SITE.url}/terms`,
};

/** The source text, linked out so an engine can pin the entity unambiguously. */
const bhagavadGita = {
  "@type": "Book",
  "@id": GITA_ID,
  name: "Bhagavad Gita",
  alternateName: "Bhagavad-gita",
  inLanguage: "sa",
  sameAs: [
    "https://en.wikipedia.org/wiki/Bhagavad_Gita",
    "https://www.wikidata.org/wiki/Q79821",
  ],
};

/** Site-wide graph (Organization, WebSite, WebApplication, source Book). */
export function buildSiteJsonLd(): JsonLd {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: LANG,
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "WebApplication",
        "@id": WEBAPP_ID,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        isFamilyFriendly: true,
        inLanguage: LANG,
        datePublished: "2026-09-01",
        dateModified: MODIFIED,
        image: {
          "@type": "ImageObject",
          url: `${SITE.url}/opengraph-image`,
          width: 1200,
          height: 630,
        },
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
        featureList: [
          "Retrieval-augmented guidance grounded in the Bhagavad Gita",
          "Every citation traceable to a real retrieved verse — no invented shlokas",
          "Safety screening with UK crisis-line signposting",
          "No account required and no message history stored",
        ],
        disambiguatingDescription:
          "An AI representation of Bhagavad Gita concepts. Not scripture, and not a substitute for professional medical or mental-health advice.",
        about: { "@id": GITA_ID },
        citation: { "@id": GITA_ID },
      },
      bhagavadGita,
    ],
  };

  return JsonLdSchema.parse(graph);
}

/**
 * FAQPage for the home route — the questions an assistant is most likely to
 * quote, phrased to reinforce what the service is and is not.
 */
export function buildFaqJsonLd(): JsonLd {
  const faqs: Array<[string, string]> = [
    [
      `What is ${SITE.name}?`,
      `${SITE.name} is a free web app that offers reflective guidance grounded in the Bhagavad Gita. You share what is on your mind and it retrieves the most relevant verse and adds a short reflection. It is an AI representation of the text — not scripture, not a person, and not a religious authority.`,
    ],
    [
      `Is ${SITE.name} a substitute for therapy or medical advice?`,
      `No. ${SITE.name} is for reflection only and is not a substitute for professional medical, mental-health, or other advice. It is not an emergency service. If you are in distress or danger, contact your local emergency services (999 in the UK) or a helpline such as the Samaritans on 116 123.`,
    ],
    [
      `Does ${SITE.name} store my messages?`,
      `No. The service is stateless: there are no accounts and your messages are not stored on our servers after your request is answered. It uses no tracking or advertising cookies. See the Privacy Notice for how your message is processed, including transfers to AI providers.`,
    ],
    [
      `How does ${SITE.name} choose which verses to share?`,
      `It uses retrieval-augmented generation. Your message is matched against the verses of the Gita, the most relevant are retrieved, and the reflection is generated only from those verses. Every citation is traceable to a real retrieved verse, so it does not invent shlokas.`,
    ],
    [
      `Is ${SITE.name} free to use?`,
      `Yes. ${SITE.name} is free to use and does not require an account.`,
    ],
  ];

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        url: SITE.url,
        inLanguage: LANG,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": WEBAPP_ID },
        mainEntity: faqs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return JsonLdSchema.parse(graph);
}

/**
 * WebPage + breadcrumb for a static sub-page (privacy, terms). Links back to the
 * site entities by @id so the page resolves inside the same graph.
 */
export function buildPageJsonLd(opts: {
  path: string;
  name: string;
  description: string;
}): JsonLd {
  const url = `${SITE.url}${opts.path}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: opts.name,
        description: opts.description,
        inLanguage: LANG,
        dateModified: MODIFIED,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": WEBAPP_ID },
        publisher: { "@id": ORG_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE.name,
            item: SITE.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: opts.name,
            item: url,
          },
        ],
      },
    ],
  };

  return JsonLdSchema.parse(graph);
}
