/**
 * Schema.org JSON-LD, derived from the SITE constants so structured data can
 * never drift from the <title>/OG/description that read the same source. The
 * output is validated by a Zod schema before it ships, keeping this file in the
 * same "define once, validate at the edge" discipline as the API contract
 * (lib/contract.ts).
 */
import { z } from "zod";

import { SITE } from "@/lib/site";

const WEBSITE_ID = `${SITE.url}/#website`;
const WEBAPP_ID = `${SITE.url}/#webapp`;

/** Loose structural guard: catches missing @type/@id and malformed graphs. */
const JsonLdSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@graph": z
    .array(
      z.looseObject({
        "@type": z.string(),
        "@id": z.string().optional(),
      }),
    )
    .min(1),
});

export type JsonLd = z.infer<typeof JsonLdSchema>;

export function buildJsonLd(): JsonLd {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "en",
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
        inLanguage: "en",
        isPartOf: { "@id": WEBSITE_ID },
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        disambiguatingDescription:
          "An AI representation of Bhagavad Gita concepts. Not scripture, and not a substitute for professional medical or mental-health advice.",
        about: {
          "@type": "Book",
          name: "Bhagavad Gita",
          alternateName: "Bhagavad-gita",
        },
      },
    ],
  };

  return JsonLdSchema.parse(graph);
}
