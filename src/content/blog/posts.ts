export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  tags: string[];
  /** Markdown */
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "clases-snowboard-sierra-nevada-principiantes",
    title: "Clases de snowboard en Sierra Nevada para principiantes",
    description:
      "Qué esperar en tu primera clase en Sierra Nevada: material, postura, horarios de clase y cómo reservar con AM Snowboard Coach.",
    publishedAt: "2026-01-10",
    readingMinutes: 7,
    tags: ["iniciación", "Sierra Nevada", "Granada"],
    body: `
Sierra Nevada es una de las estaciones más accesibles de España para aprender snowboard. En la estación tienes telesillas, escuelas y pistas verdes ideales para los primeros giros.

## ¿Qué aprenderás en la primera sesión?

- Postura básica y equilibrio sobre la tabla
- Cómo llevar el canto y frenar de forma segura
- Primeros cambios de dirección en pista suave

Con más de 7.500 horas de clase, trabajo con objetivos claros: que salgas de la sesión sabiendo **qué practicar** la próxima vez.

## ¿Cuánto dura una clase?

Ofrecemos bloques de **2 h, 3 h o día completo** (10:00–16:00) en turnos fijos. Para principiantes, dos horas por la mañana suelen ser perfectas: aprovechas la nieve más consistente y evitas el cansancio.

## Reserva y confirmación

Solicita tu plaza desde la [central de reservas](/reservar). Reviso cada petición personalmente y te confirmo por email. El punto de encuentro es **Borreguiles, a la salida del telecabina Al-Andalus** (el forfait y el material no están incluidos; te asesoro si lo necesitas).

¿Listo? [Reserva tu clase](/reservar) o consulta [tarifas y horarios](/tarifas).
`,
  },
  {
    slug: "carving-snowboard-sierra-nevada",
    title: "Carving en snowboard: técnica y clases en Sierra Nevada",
    description:
      "Mejora tus giros cerrados y velocidad controlada en pista con sesiones de carving en Sierra Nevada y Sulayr.",
    publishedAt: "2026-01-22",
    readingMinutes: 6,
    tags: ["carving", "técnica", "intermedio"],
    body: `
El **carving** es disfrutar del canto: líneas limpias, menos derrape y más precisión. En Sierra Nevada hay pistas anchas perfectas para trabajar radios y presión.

## Errores habituales

1. Mirar la tabla en lugar de la línea de caída
2. Flexionar solo rodillas sin involucrar tobillos
3. Perder presión en el canto de salida

En clase corregimos con vídeo y progresiones cortas. Si ya tienes cuenta, guarda tus avances en el **Pasaporte de Trucos** del área de alumno.

## Material y pista

Recomiendo cantos afilados y tabla un poco más rígida si ya dominas el básico. Evita sesiones en hielo duro sin aviso: mira el parte de nieve del día.

[Reserva carving](/reservar) · [Ver tipos de clase](/clases)
`,
  },
  {
    slug: "freestyle-sulayr-snowpark-sierra-nevada",
    title: "Freestyle en Sulayr: guía del snowpark de Sierra Nevada",
    description:
      "Cómo preparar tu sesión de freestyle en Sulayr: boxes, saltos, seguridad y clases con progresión en el park.",
    publishedAt: "2026-02-05",
    readingMinutes: 8,
    tags: ["freestyle", "Sulayr", "snowpark"],
    body: `
**Sulayr** es el snowpark de referencia en Sierra Nevada. Cajones, rails y kickers para todos los niveles — siempre con respeto al código FIS y al flujo del park.

## Antes de entrar al park

- Casco y protecciones: no negociables
- Calienta fuera del park con giros amplios
- Empieza por features pequeños y sube progresivamente

## Qué trabajamos en clase

- Aproximación y pop limpio
- 50/50 y boardslide en cajón bajo
- Salidas de switch controladas

Las sesiones de **3 h o día completo** son ideales para combinar pista y park sin prisas.

¿Quieres feedback en vídeo? Regístrate y accede a tu área de alumno tras la clase.

[Clase freestyle](/reservar) · [Sobre el coach](/sobre-mi)
`,
  },
  {
    slug: "cuanto-cuesta-clase-snowboard-sierra-nevada",
    title: "¿Cuánto cuesta una clase de snowboard en Sierra Nevada?",
    description:
      "Precios por hora, duraciones 2 h / 3 h / día completo y qué incluye una clase con monitor en Sierra Nevada, Granada.",
    publishedAt: "2026-02-18",
    readingMinutes: 5,
    tags: ["tarifas", "Sierra Nevada", "reservas"],
    body: `
Transparencia total: en [tarifas](/tarifas) verás el precio por duración. Trabajamos con **turnos fijos** en horario diurno (10:00–16:00), lo que optimiza el tiempo en pista.

## Duraciones y precio por hora

- **2 h** (2 h en pista): 55 €/h → 110 € total
- **3 h** (3 h en pista): 50 €/h → 150 € total
- **Día completo** (6 h en pista, 10:00–16:00): 35 €/h → 210 € total

El día completo incluye pausa para comer; es la opción favorita de quien quiere progresar mucho en un solo día.

## ¿Qué incluye?

- Planificación según tu nivel y objetivos
- Corrección en pista (y vídeo si aplica)
- Seguimiento si eres alumno registrado

Tras confirmar tu plaza, recibirás un enlace para pagar con tarjeta (Stripe).

[Solicitar reserva](/reservar)
`,
  },
  {
    slug: "mejor-epoca-snowboard-sierra-nevada",
    title: "Mejor época para snowboard en Sierra Nevada",
    description:
      "Temporada, nieve, afluencia y consejos para elegir cuándo reservar tu clase en Sierra Nevada y Sulayr.",
    publishedAt: "2026-03-01",
    readingMinutes: 6,
    tags: ["temporada", "consejos", "Sierra Nevada"],
    body: `
La temporada en Sierra Nevada suele ir de **finales de noviembre a principios de mayo**, según nieve y condiciones. Para clases, estos tramos funcionan muy bien:

## Diciembre–marzo

Máxima garantía de nieve en pista. Fines de semana y vacaciones escolares hay más gente: reserva con antelación.

## Marzo–abril

Días más largos y temperaturas agradables. Ideal para **carving** y sesiones de **freestyle** en Sulayr con sol.

## Consejos de monitor

- Primera hora del bloque matinal: nieve más consistente
- Revisa el parte meteorológico y viste por capas
- Hidratación: a 2.600 m se nota

Reserva tu turno en la [central de reservas](/reservar). Te confirmo disponibilidad en el calendario real del coach.
`,
  },
];

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
