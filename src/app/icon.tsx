import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a2332",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            fontSize: 200,
            fontWeight: 800,
            color: "#6eb0c8",
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          AM
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 48,
            fontWeight: 600,
            color: "#8ec5db",
            letterSpacing: "0.2em",
          }}
        >
          COACH
        </div>
      </div>
    ),
    { ...size },
  );
}
