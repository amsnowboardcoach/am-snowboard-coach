/** Genera imagen 4:5 para el feed a partir de un logro del pasaporte. */
export async function renderPassportAchievementCardBlob(input: {
  trickName: string;
  statusLabel: string;
  categoryLabel: string;
  authorName: string;
}): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo preparar la imagen del logro.");
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0c4a6e");
  gradient.addColorStop(0.45, "#18181b");
  gradient.addColorStop(1, "#09090b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
  ctx.font = "600 36px system-ui, sans-serif";
  ctx.fillText("PASAPORTE AM", 96, 140);

  ctx.fillStyle = "#f4f4f5";
  ctx.font = "700 64px system-ui, sans-serif";
  wrapText(ctx, input.trickName, 96, 280, width - 192, 72);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 40px system-ui, sans-serif";
  ctx.fillText(input.categoryLabel, 96, 520);

  ctx.fillStyle = "#34d399";
  ctx.font = "700 48px system-ui, sans-serif";
  ctx.fillText(input.statusLabel, 96, 590);

  ctx.fillStyle = "#71717a";
  ctx.font = "400 32px system-ui, sans-serif";
  ctx.fillText(`Por ${input.authorName}`, 96, height - 120);

  ctx.fillStyle = "#52525b";
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillText("La Tribu · AM Snowboard Coach", 96, height - 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo generar la imagen del logro."));
      },
      "image/png",
      0.92,
    );
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}
