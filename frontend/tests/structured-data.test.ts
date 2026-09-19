import { describe, it, expect } from "vitest";

import {
  buildSiteJsonLd,
  buildFaqJsonLd,
  buildPageJsonLd,
} from "@/lib/structured-data";
import { SITE } from "@/lib/site";

describe("buildSiteJsonLd", () => {
  const graph = buildSiteJsonLd();
  const types = graph["@graph"].map((n) => n["@type"]);

  it("emits a connected graph with the core entities", () => {
    expect(graph["@context"]).toBe("https://schema.org");
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
    expect(types).toContain("WebApplication");
    expect(types).toContain("Book");
  });

  it("derives urls from the shared SITE constant", () => {
    const website = graph["@graph"].find((n) => n["@type"] === "WebSite");
    expect(website).toMatchObject({ url: SITE.url, name: SITE.name });
  });

  it("links the app to the publisher and source text by @id", () => {
    const app = graph["@graph"].find((n) => n["@type"] === "WebApplication");
    expect(app?.publisher).toEqual({ "@id": `${SITE.url}/#organization` });
    expect(app?.about).toEqual({ "@id": `${SITE.url}/#bhagavad-gita` });
  });

  it("disambiguates the source text with sameAs links", () => {
    const book = graph["@graph"].find((n) => n["@type"] === "Book");
    expect(book?.sameAs).toContain("https://en.wikipedia.org/wiki/Bhagavad_Gita");
  });
});

describe("buildFaqJsonLd", () => {
  const graph = buildFaqJsonLd();

  it("emits a non-empty FAQPage", () => {
    const faq = graph["@graph"].find((n) => n["@type"] === "FAQPage");
    expect(faq).toBeDefined();
    expect((faq?.mainEntity as unknown[]).length).toBeGreaterThan(0);
  });

  it("shapes every entry as a Question with an accepted Answer", () => {
    const faq = graph["@graph"].find((n) => n["@type"] === "FAQPage");
    for (const q of faq?.mainEntity as Array<Record<string, unknown>>) {
      expect(q["@type"]).toBe("Question");
      expect(q.name).toBeTruthy();
      expect((q.acceptedAnswer as Record<string, unknown>).text).toBeTruthy();
    }
  });
});

describe("buildPageJsonLd", () => {
  const graph = buildPageJsonLd({
    path: "/privacy",
    name: "Privacy Notice",
    description: "d",
  });
  const types = graph["@graph"].map((n) => n["@type"]);

  it("emits a WebPage and a BreadcrumbList", () => {
    expect(types).toContain("WebPage");
    expect(types).toContain("BreadcrumbList");
  });

  it("points the breadcrumb tail at the page url", () => {
    const crumb = graph["@graph"].find((n) => n["@type"] === "BreadcrumbList");
    const items = crumb?.itemListElement as Array<Record<string, unknown>>;
    expect(items[items.length - 1].item).toBe(`${SITE.url}/privacy`);
  });

  it("passes its own zod validation (no throw)", () => {
    expect(() =>
      buildPageJsonLd({ path: "/terms", name: "Terms of Use", description: "d" }),
    ).not.toThrow();
  });
});
