import { cn } from "@/lib/utils/cn";

export type PageShellWidth =
  | "default"
  | "narrow"
  | "reading"
  | "form"
  | "detail";

export type PageShellSpacing = "default" | "tight" | "loose" | "none";

const widthClass: Record<PageShellWidth, string> = {
  default: "max-w-6xl",
  narrow: "max-w-lg",
  reading: "max-w-3xl",
  form: "max-w-4xl",
  detail: "max-w-2xl",
};

const spacingClass: Record<PageShellSpacing, string> = {
  default: "page-pad-y",
  tight: "page-pad-y-tight",
  loose: "page-pad-y-loose",
  none: "",
};

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  width?: PageShellWidth;
  spacing?: PageShellSpacing;
  as?: "section" | "article" | "div" | "main";
}

/** Contenedor de página con márgenes horizontales y verticales coherentes. */
export function PageShell({
  children,
  className,
  width = "default",
  spacing = "default",
  as: Comp = "section",
}: PageShellProps) {
  return (
    <Comp
      className={cn(
        "page-container",
        widthClass[width],
        spacingClass[spacing],
        className,
      )}
    >
      {children}
    </Comp>
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

/** Cabecera de página (título + lead) con ritmo vertical unificado. */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("page-intro", className)}>
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-lead">{description}</p>}
    </header>
  );
}
