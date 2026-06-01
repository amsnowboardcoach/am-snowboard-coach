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
      <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-base leading-relaxed text-zinc-400 sm:mt-4",
            centered && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
