import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

// Generated social card, so the palette and copy stay in sync with the site
// automatically. Next wires this into both Open Graph and Twitter tags.
export const alt = `${SITE.name} - ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0c18",
          backgroundImage:
            "radial-gradient(120% 90% at 50% 130%, rgba(219,138,74,0.42), transparent 58%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#f4ad6a",
            fontSize: 34,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 9999,
              background: "#f4ad6a",
            }}
          />
          {SITE.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              color: "#ece8e0",
              fontSize: 68,
              lineHeight: 1.05,
              fontWeight: 600,
              maxWidth: 900,
            }}
          >
            {SITE.tagline}
          </div>
          <div style={{ color: "#a7a2b8", fontSize: 30, maxWidth: 820 }}>
            Share what weighs on you and receive a grounded verse with a short
            reflection.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
