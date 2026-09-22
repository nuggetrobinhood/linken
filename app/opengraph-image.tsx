import { ImageResponse } from "next/og";

export const alt = "LINKEN — position risk & net carry on Robinhood Chain";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OG/Twitter preview image, generated at request time (no binary asset needed).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A1411",
          padding: "70px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", width: 44, height: 44, borderRadius: 10, background: "#0E1C18", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 16, height: 16, background: "#A0D636", borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: 6, color: "#E4EEE9" }}>LINKEN</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.1, color: "#E4EEE9", maxWidth: 900 }}>
            The only LP number that matters is what you keep.
          </div>
          <div style={{ fontSize: 30, color: "#A2B4AB" }}>
            Net carry — fees minus impermanent loss minus real gas · Robinhood Chain
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", height: 12, background: "#050B09", borderRadius: 6, position: "relative" }}>
            <div style={{ position: "absolute", left: "12%", right: "14%", top: 0, bottom: 0, background: "#134E43", borderLeft: "3px solid #3ED0B8", borderRight: "3px solid #3ED0B8", borderRadius: 3 }} />
            <div style={{ position: "absolute", left: "80%", top: -6, width: 4, height: 24, background: "#E4EEE9", borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 24, color: "#7C9089" }}>linken.site</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
