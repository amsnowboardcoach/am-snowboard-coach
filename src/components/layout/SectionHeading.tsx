import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  /** Solo usar `false` en paneles internos (coach, formularios). */
  centered?: boolean;
}

export function SectionHeading({
  title,
  subtitle,
  className,
  centered = true,
}: SectionHeadingProps) {
  return (
    <div className={cn(centered && "mx-auto max-w-3xl text-center", className)}>
      <h2 className="text-[clamp(1.375rem,2.8vw+0.65rem,1.875rem)] font-bold leading-snug tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-zinc-400 sm:mt-3.5 sm:text-base",
            centered && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
