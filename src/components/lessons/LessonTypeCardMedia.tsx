import Image from "next/image";
import { LOCAL_LESSON_CARD_IMAGES } from "@/constants/site-images";
import type { LessonTypeId } from "@/constants/lesson-types";

interface LessonTypeCardMediaProps {
  lessonId: LessonTypeId;
  /** Primera tarjeta en home: prioridad de carga */
  priority?: boolean;
  sizes?: string;
}

export function LessonTypeCardMedia({
  lessonId,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: LessonTypeCardMediaProps) {
  const { src, alt, objectPosition } = LOCAL_LESSON_CARD_IMAGES[lessonId];

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized
      className="object-cover transition duration-500 group-hover:scale-105"
      style={{ objectPosition }}
    />
  );
}
