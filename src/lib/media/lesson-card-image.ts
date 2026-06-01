import { LOCAL_LESSON_CARD_IMAGES } from "@/constants/site-images";
import type { LessonTypeId } from "@/constants/lesson-types";

interface LessonCardImageFallback {
  lessonCards: { src: string }[];
  claseImageSrc: string;
}

export function resolveLessonCardImage(
  lessonId: LessonTypeId,
  index: number,
  fallback: LessonCardImageFallback,
  displayName: string,
) {
  const local = LOCAL_LESSON_CARD_IMAGES[lessonId];
  return {
    src: local?.src ?? fallback.lessonCards[index]?.src ?? fallback.claseImageSrc,
    alt: local?.alt ?? displayName,
    objectPosition: local?.objectPosition,
  };
}
