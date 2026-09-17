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
          background: "#171512",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#e2593a",
            fontSize: 34,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 9999,
              background: "#e2593a",
            }}
          />
          {SITE.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              color: "#e7e0d2",
              fontSize: 68,
              lineHeight: 1.05,
              fontWeight: 600,
              maxWidth: 900,
            }}
          >
            {SITE.tagline}
          </div>
          <div style={{ color: "#a69d8a", fontSize: 30, maxWidth: 820 }}>
            Share what weighs on you and receive a grounded verse with a short
            reflection.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
