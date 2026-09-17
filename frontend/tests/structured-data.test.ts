import { describe, it, expect } from "vitest";

import { buildJsonLd } from "@/lib/structured-data";
import { SITE } from "@/lib/site";

describe("buildJsonLd", () => {
  const graph = buildJsonLd();

  it("emits a schema.org graph with WebSite and WebApplication", () => {
    expect(graph["@context"]).toBe("https://schema.org");
    const types = graph["@graph"].map((n) => n["@type"]);
    expect(types).toContain("WebSite");
    expect(types).toContain("WebApplication");
  });

  it("derives urls from the shared SITE constant", () => {
    const website = graph["@graph"].find((n) => n["@type"] === "WebSite");
    expect(website).toMatchObject({ url: SITE.url, name: SITE.name });
  });

  it("passes its own zod validation (no throw)", () => {
    expect(() => buildJsonLd()).not.toThrow();
  });
});
