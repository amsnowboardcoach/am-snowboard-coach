import { STUDENT_AREA_PATH } from "@/constants/student-area";

export interface SiteNavItem {
  href: string;
  label: string;
  shortLabel?: string;
  /** CTA principal en header / barra inferior */
  primary?: boolean;
}

/** Enlaces del sitio público (header, footer, barra móvil) */
export const SITE_NAV_PUBLIC: SiteNavItem[] = [
  { href: "/", label: "Inicio", shortLabel: "Inicio" },
  { href: "/clases", label: "Clases", shortLabel: "Clases" },
  { href: "/tarifas", label: "Tarifas", shortLabel: "Tarifas" },
  { href: "/tribu", label: "La Tribu", shortLabel: "Tribu" },
  { href: "/mercadillo", label: "Mercadillo", shortLabel: "Mercado" },
  { href: "/blog", label: "Blog", shortLabel: "Blog" },
  { href: "/sobre-mi", label: "Sobre mí", shortLabel: "Coach" },
  { href: "/reservar", label: "Reservar", shortLabel: "Reservar", primary: true },
];

export const SITE_NAV_AUTH: SiteNavItem[] = [
  {
    href: STUDENT_AREA_PATH,
    label: "Área de alumno",
    shortLabel: "Área",
  },
];

/** Header desktop: sin inicio ni CTA duplicado en lista */
export const SITE_HEADER_LINKS: SiteNavItem[] = SITE_NAV_PUBLIC.filter(
  (l) => l.href !== "/" && !l.primary,
);

export const SITE_HEADER_CTA: SiteNavItem = SITE_NAV_PUBLIC.find(
  (l) => l.primary,
)!;

/** Barra inferior móvil (máx. 5 ítems) */
export const SITE_MOBILE_TAB_BAR: SiteNavItem[] = [
  { href: "/", label: "Inicio", shortLabel: "Inicio" },
  { href: "/clases", label: "Clases", shortLabel: "Clases" },
  { href: "/reservar", label: "Reservar", shortLabel: "Reservar", primary: true },
  { href: "/mercadillo", label: "Mercadillo", shortLabel: "Mercado" },
  { href: "/tribu", label: "La Tribu", shortLabel: "Tribu" },
];

export interface WayfindingLink {
  href: string;
  label: string;
  description?: string;
}

export interface WayfindingBlock {
  title: string;
  links: WayfindingLink[];
}

/** Sugerencias al final de cada página para seguir navegando */
export function getPageWayfinding(pathname: string): WayfindingBlock | null {
  if (pathname.startsWith("/legal")) {
    return {
      title: "Sigue explorando",
      links: [
        { href: "/", label: "Inicio", description: "Volver a la portada" },
        { href: "/reservar", label: "Reservar clase", description: "Calendario en vivo" },
        { href: "/clases", label: "Tipos de clase", description: "Iniciación, carving, freestyle" },
      ],
    };
  }

  const map: Record<string, WayfindingBlock> = {
    "/": {
      title: "¿Qué quieres hacer ahora?",
      links: [
        { href: "/reservar", label: "Reservar clase", description: "Elige día y turno" },
        { href: "/clases", label: "Ver clases", description: "Duración y estilos" },
        { href: "/tarifas", label: "Tarifas", description: "Precios y extras" },
        { href: "/tribu", label: "La Tribu", description: "Fotos y comunidad" },
      ],
    },
    "/clases": {
      title: "Siguiente paso",
      links: [
        { href: "/reservar", label: "Reservar", description: "Calendario y disponibilidad" },
        { href: "/tarifas", label: "Tarifas", description: "2 h, 3 h o día completo" },
        { href: "/blog", label: "Guías en el blog", description: "Consejos en pista" },
        { href: "/sobre-mi", label: "Sobre Alejandro", description: "Experiencia y método" },
      ],
    },
    "/tarifas": {
      title: "Listo para reservar",
      links: [
        { href: "/reservar", label: "Reservar clase", description: "Confirmación personal" },
        { href: "/clases", label: "Tipos de clase", description: "Qué trabajamos en pista" },
        {
          href: STUDENT_AREA_PATH,
          label: "Área de alumno",
          description: "Pasaporte y vídeos",
        },
      ],
    },
    "/reservar": {
      title: "Antes o después de reservar",
      links: [
        { href: "/clases", label: "Tipos de clase", description: "Iniciación, carving, Sulayr" },
        { href: "/tarifas", label: "Tarifas", description: "Personas extra y precios" },
        { href: "/sobre-mi", label: "Sobre el coach", description: "Quién te enseña" },
        {
          href: STUDENT_AREA_PATH,
          label: "Área de alumno",
          description: "Entrar o registrarte para reservar",
        },
      ],
    },
    "/sobre-mi": {
      title: "Ponte en pista",
      links: [
        { href: "/reservar", label: "Reservar", description: "Solicitud en minutos" },
        { href: "/clases", label: "Clases", description: "Metodología AM" },
        { href: "/tribu", label: "La Tribu", description: "Comunidad en Sierra Nevada" },
      ],
    },
    "/tribu": {
      title: "Más de AM Snowboard",
      links: [
        { href: "/reservar", label: "Reservar clase", description: "Únete en pista" },
        { href: "/mercadillo", label: "Mercadillo", description: "Material entre alumnos" },
        {
          href: STUDENT_AREA_PATH,
          label: "Área de alumno",
          description: "Entrar o registrarte en La Tribu",
        },
      ],
    },
    "/mercadillo": {
      title: "Explorar",
      links: [
        { href: "/tribu", label: "La Tribu", description: "Comunidad y fotos" },
        { href: "/reservar", label: "Reservar clase", description: "Clases en Sierra Nevada" },
        {
          href: STUDENT_AREA_PATH,
          label: "Área de alumno",
          description: "Entrar o registrarte",
        },
      ],
    },
    "/blog": {
      title: "Acción en pista",
      links: [
        { href: "/reservar", label: "Reservar", description: "Aplica lo que lees" },
        { href: "/clases", label: "Clases", description: "Elige tu estilo" },
        { href: "/tarifas", label: "Tarifas", description: "Precios actualizados" },
      ],
    },
    "/login": {
      title: "Después de entrar",
      links: [
        { href: "/reservar", label: "Reservar clase", description: "Calendario en vivo" },
        { href: "/perfil", label: "Tu perfil", description: "Pasaporte y vídeos" },
        { href: "/", label: "Inicio", description: "Volver a la web" },
      ],
    },
    "/perfil": {
      title: "Tu espacio AM",
      links: [
        { href: "/reservar", label: "Reservar clase", description: "Nueva sesión en pista" },
        { href: "/perfil/pasaporte", label: "Pasaporte de trucos", description: "Progreso y niveles" },
        { href: "/tribu", label: "La Tribu", description: "Comunidad y fotos" },
        { href: "/mercadillo", label: "Mercadillo", description: "Material entre alumnos" },
      ],
    },
  };

  if (pathname.startsWith("/perfil")) {
    return map["/perfil"];
  }

  if (pathname.startsWith("/blog/")) {
    return {
      title: "Sigue leyendo o reserva",
      links: [
        { href: "/blog", label: "Todos los artículos", description: "Volver al blog" },
        { href: "/reservar", label: "Reservar clase", description: "Practica en Sierra Nevada" },
        { href: "/clases", label: "Tipos de clase", description: "Iniciación, carving, freestyle" },
      ],
    };
  }

  if (pathname.startsWith("/mercadillo/")) {
    return map["/mercadillo"];
  }

  return map[pathname] ?? null;
}
