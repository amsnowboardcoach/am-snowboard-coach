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
        tall ? "min-h-[min(72dvh,720px)]" : "min-h-[min(42dvh,420px)]",
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
          "page-container relative flex max-w-6xl flex-col justify-end pb-12 pt-[max(5.5rem,calc(3.25rem+env(safe-area-inset-top)))] sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32",
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
            "max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl",
            centered && "mx-auto",
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:mt-5 sm:text-lg",
              centered && "mx-auto",
            )}
          >
            {subtitle}
          </p>
        )}
        {afterSubtitle && (
          <div
            className={cn(
              "mt-5 w-full sm:mt-6",
              centered ? "mx-auto max-w-xl lg:max-w-2xl" : "max-w-xl lg:max-w-2xl",
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
