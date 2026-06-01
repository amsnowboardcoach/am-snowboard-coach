import Link from "next/link";
import { VIDEO_CORRECTION_PRODUCT } from "@/constants/video-correction";
import { cn } from "@/lib/utils/cn";

interface VideoCorrectionCardProps {
  className?: string;
  showCta?: boolean;
  compact?: boolean;
}

export function VideoCorrectionCard({
  className,
  showCta = true,
  compact = false,
}: VideoCorrectionCardProps) {
  return (
    <article
      className={cn(
        "glass-panel rounded-2xl border-violet-500/25 p-6 sm:p-8",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
        Fuera de pista
      </p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-100 sm:text-2xl">
        {VIDEO_CORRECTION_PRODUCT.name}
      </h2>
      {!compact && (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          {VIDEO_CORRECTION_PRODUCT.description}
        </p>
      )}
      <p className="mt-4 text-3xl font-bold text-sky-400">
        {VIDEO_CORRECTION_PRODUCT.priceEuros} €
        <span className="ml-2 text-base font-normal text-zinc-500">
          por vídeo
        </span>
      </p>
      {showCta && (
        <Link
          href="/reservar?tipo=video"
          className="mt-6 inline-flex rounded-full bg-violet-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-violet-400"
        >
          Pedir video corrección
        </Link>
      )}
    </article>
  );
}
