import { ImageResponse } from "next/og";

// Static metadata Next reads to wire the route up. Edge runtime is the
// default for ImageResponse and keeps generation fast.
export const runtime = "edge";
export const alt = "ScholarScout — Find scholarships everyone else misses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #818cf8 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "white",
        }}
      >
        {/* Top bar: logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Inline GraduationCap (Lucide), white stroke */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M22 10v6" />
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            ScholarScout
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              maxWidth: 980,
            }}
          >
            Find scholarships
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              color: "#fde68a",
              maxWidth: 980,
            }}
          >
            everyone else misses.
          </div>
        </div>

        {/* Bottom row: tagline + chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 28, opacity: 0.9, maxWidth: 720 }}>
            Niche, low-competition awards for incoming college freshmen.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 22px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.3)",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            Free · No login
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
