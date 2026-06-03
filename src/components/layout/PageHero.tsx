import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  imageSrc: string;
  imageAlt: string;
  videoSrc?: string;
  videoPoster?: string;
  tall?: boolean;
  /** Contenido entre subtítulo y acciones (p. ej. calendario). */
  afterSubtitle?: React.ReactNode;
  children?: React.ReactNode;
  /** Alineación del bloque de texto (por defecto centrado). */
  align?: "center" | "start";
}

export function PageHero({
  title,
  subtitle,
  eyebrow,
  imageSrc,
  imageAlt,
  videoSrc,
  videoPoster,
  tall,
  afterSubtitle,
  children,
  align = "center",
}: PageHeroProps) {
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        tall
          ? afterSubtitle
            ? "min-h-0 sm:min-h-[min(76dvh,740px)]"
            : "min-h-[min(68dvh,680px)] sm:min-h-[min(72dvh,720px)]"
          : "min-h-[min(38dvh,380px)] sm:min-h-[min(42dvh,420px)]",
      )}
    >
      {videoSrc ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={videoPoster ?? imageSrc}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/30" />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r to-transparent",
          centered ? "from-zinc-950/70" : "from-zinc-950/60",
        )}
      />
      <div
        className={cn(
          "page-container relative flex max-w-6xl flex-col justify-end pb-8 pt-[max(4.75rem,calc(2.75rem+env(safe-area-inset-top)))] sm:pb-14 sm:pt-24 lg:pb-20 lg:pt-28",
          afterSubtitle && "justify-start pb-6 sm:justify-end sm:pb-14",
          centered && "items-center text-center",
        )}
      >
        {eyebrow && (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-sky-400 sm:text-sm sm:tracking-[0.2em]">
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "max-w-3xl text-balance text-[clamp(1.625rem,4.2vw+0.85rem,3.75rem)] font-bold leading-[1.12] tracking-tight sm:leading-[1.1]",
            centered && "mx-auto",
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-zinc-300 sm:mt-4 sm:text-lg",
              centered && "mx-auto",
            )}
          >
            {subtitle}
          </p>
        )}
        {afterSubtitle && (
          <div
            className={cn(
              "mt-4 w-full sm:mt-5",
              centered
                ? "mx-auto w-full max-w-[min(100%,22rem)] sm:max-w-md lg:max-w-lg"
                : "max-w-[min(100%,22rem)] sm:max-w-md lg:max-w-lg",
            )}
          >
            {afterSubtitle}
          </div>
        )}
        {children && (
          <div
            className={cn(
              "btn-row w-full",
              centered && "btn-row-center",
              afterSubtitle ? "mt-4 sm:mt-5" : "mt-6 sm:mt-8",
            )}
          >
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
