/**
 * Single source of truth for site-level constants. Metadata, Open Graph,
 * sitemap, robots, and JSON-LD structured data all read from here so the name,
 * description, and URL are never duplicated or allowed to drift.
 */
export const SITE = {
  name: "Sakha",
  /** Sakha is Sanskrit for companion, the word Krishna uses for Arjuna. */
  tagline: "Reflective guidance from the Bhagavad Gita.",
  description:
    "Share what weighs on you and receive a grounded verse from the Bhagavad Gita with a short reflection. An AI representation of the text, not scripture and not professional advice.",
  /** No trailing slash. Overridden per environment via NEXT_PUBLIC_SITE_URL. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
  locale: "en_US",
  themeColor: "#171512", // letterpress stock (locked dark theme)
} as const;

export type Site = typeof SITE;
