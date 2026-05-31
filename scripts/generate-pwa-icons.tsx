/**
 * Genera iconos PNG estáticos para el manifest (Chrome exige 192 y 512).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { ImageResponse } from "next/og";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const outDir = join(root, "public", "icons");

function iconMarkup(size: number) {
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
        background: "#1a2332",
        borderRadius: radius,
      }}
    >
      <div
        style={{
          fontSize: fontMain,
          fontWeight: 800,
          color: "#6eb0c8",
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
            color: "#8ec5db",
            letterSpacing: "0.2em",
          }}
        >
          COACH
        </div>
      ) : null}
    </div>
  );
}

async function writeIcon(name: string, size: number) {
  const res = new ImageResponse(iconMarkup(size), {
    width: size,
    height: size,
  });
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, name), buf);
  console.log(`[pwa-icons] ${name} (${size}x${size})`);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  await writeIcon("icon-192.png", 192);
  await writeIcon("icon-512.png", 512);
  console.log("[pwa-icons] Listo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
