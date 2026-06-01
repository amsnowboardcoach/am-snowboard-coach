import type { ReactElement, ReactNode } from "react";

export const BRAND_BG = "#1a2332";
export const BRAND_ACCENT = "#6eb0c8";
export const BRAND_ACCENT_LIGHT = "#8ec5db";

/** Logo cuadrado AM (+ COACH en tamaños grandes), mismo diseño que la PWA */
export function brandIconSquareMarkup(size: number): ReactElement {
  const fontMain = Math.round(size * 0.39);
  const fontSub = Math.round(size * 0.094);
  const radius = Math.round(size * 0.19);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_BG,
        borderRadius: radius,
      }}
    >
      <div
        style={{
          fontSize: fontMain,
          fontWeight: 800,
          color: BRAND_ACCENT,
          letterSpacing: "-0.05em",
          lineHeight: 1,
        }}
      >
        AM
      </div>
      {size >= 256 ? (
        <div
          style={{
            marginTop: Math.round(size * 0.031),
            fontSize: fontSub,
            fontWeight: 600,
            color: BRAND_ACCENT_LIGHT,
            letterSpacing: "0.2em",
          }}
        >
          COACH
        </div>
      ) : null}
    </div>
  );
}

/** Imagen para redes sociales (Open Graph / Twitter) */
export function brandOgMarkup(): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_BG,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 200,
            fontWeight: 800,
            color: BRAND_ACCENT,
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          AM
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 48,
            fontWeight: 600,
            color: BRAND_ACCENT_LIGHT,
            letterSpacing: "0.25em",
          }}
        >
          SNOWBOARD COACH
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#94a3b8",
          }}
        >
          Sierra Nevada · Granada
        </div>
      </div>
    </div>
  );
}
