"use client";

import { useState } from "react";
import Image from "next/image";
import type { PexelsVideo } from "@/lib/pexels/client";

interface PexelsVideoGalleryProps {
  videos: PexelsVideo[];
  title?: string;
}

export function PexelsVideoGallery({
  videos,
  title = "En movimiento",
}: PexelsVideoGalleryProps) {
  const [active, setActive] = useState(0);

  if (videos.length === 0) return null;

  const current = videos[active] ?? videos[0];

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Vídeos de referencia ·{" "}
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:underline"
        >
          Pexels
        </a>
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <video
          key={current.src}
          controls
          playsInline
          poster={current.poster}
          className="aspect-video w-full bg-black"
        >
          <source src={current.src} type="video/mp4" />
        </video>
      </div>
      {videos.length > 1 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {videos.map((v, i) => (
            <li key={v.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`relative aspect-video w-full overflow-hidden rounded-xl border transition ${
                  active === i
                    ? "border-sky-500 ring-2 ring-sky-500/40"
                    : "border-zinc-200 opacity-80 hover:opacity-100"
                }`}
              >
                <Image
                  src={v.poster}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 text-[10px] text-zinc-700">
                  {Math.round(v.duration)}s
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
