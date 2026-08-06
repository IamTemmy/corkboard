import { ImageResponse } from "next/og";

// This file is a Next.js convention: it auto-generates the link-preview image
// (1200×630) shown when the site is shared on iMessage, WhatsApp, X, etc.
// It's drawn with the Corkboard palette so the card is on-brand.

export const alt = "Corkboard — buy and sell with people on your campus";
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
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#F7F1E6",
          padding: "80px",
        }}
      >
        {/* The pin motif */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: 9999,
            backgroundColor: "#B24A34",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 9999,
              backgroundColor: "#FBF8F2",
            }}
          />
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, letterSpacing: "-2px" }}>
          <span style={{ color: "#1C2430" }}>cork</span>
          <span style={{ color: "#E7A93B" }}>board</span>
        </div>

        <div style={{ display: "flex", fontSize: 44, color: "#1C2430", marginTop: 28 }}>
          Buy and sell with people on your campus
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#6E8C6A", marginTop: 18 }}>
          No shipping. No fees. Just students down the hall.
        </div>
      </div>
    ),
    { ...size },
  );
}
