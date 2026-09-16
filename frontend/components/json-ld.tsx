import type { JsonLd as JsonLdData } from "@/lib/structured-data";

/**
 * Renders a JSON-LD block. Server component; the payload is already validated by
 * buildJsonLd(), so this only serialises it into the standard script tag.
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      // Structured data must be inline JSON; not user input, safe to serialise.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
