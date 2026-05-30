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
  children?: React.ReactNode;
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
  children,
}: PageHeroProps) {
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
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 to-transparent" />
      <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-12 pt-[max(6rem,calc(3.5rem+env(safe-area-inset-top)))] sm:pb-16 sm:pt-28">
        {eyebrow && (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-sky-400 sm:text-sm sm:tracking-[0.2em]">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:mt-5 sm:text-lg">
            {subtitle}
          </p>
        )}
        {children && (
          <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
