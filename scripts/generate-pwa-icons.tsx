/**
 * Genera iconos PNG estáticos (favicon, PWA, manifest).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { ImageResponse } from "next/og";
import { brandIconSquareMarkup } from "../src/lib/brand/icon-markup";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const outDir = join(root, "public", "icons");

async function writeIcon(name: string, size: number) {
  const res = new ImageResponse(brandIconSquareMarkup(size), {
    width: size,
    height: size,
  });
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, name), buf);
  console.log(`[brand-icons] ${name} (${size}x${size})`);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  await writeIcon("icon-32.png", 32);
  await writeIcon("icon-144.png", 144);
  await writeIcon("icon-180.png", 180);
  await writeIcon("icon-192.png", 192);
  await writeIcon("icon-512.png", 512);
  await writeIcon("icon-512-maskable.png", 512);
  console.log("[brand-icons] Listo");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
