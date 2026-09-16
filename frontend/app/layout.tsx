import type { Metadata, Viewport } from "next";
import { Outfit, Spectral } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

// Interface face. Self-hosted by next/font (no render-blocking <link>), swap +
// size-adjust fallback to keep CLS at 0.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

// Reading face, reserved for verse text and reflection prose (the justified
// scripture / manuscript exception). Loaded with the weights we actually use.
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE.name} - ${SITE.tagline}`, template: `%s - ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: SITE.themeColor.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
