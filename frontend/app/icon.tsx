import { ImageResponse } from "next/og";

// Generated favicon: a burnt-saffron tile with an off-white dot, echoing the
// brand mark. Keeps the icon in sync with the palette and drops the default
// Next logo.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#b0491d",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 9999,
            background: "#fffaf4",
          }}
        />
      </div>
    ),
    size,
  );
}
