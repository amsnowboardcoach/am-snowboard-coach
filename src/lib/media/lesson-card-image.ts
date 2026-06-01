import {
  LOCAL_LESSON_CARD_IMAGES,
  type LessonCardImage,
} from "@/constants/site-images";
import type { LessonTypeId } from "@/constants/lesson-types";
import type { StaticImageData } from "next/image";

interface LessonCardImageFallback {
  lessonCards: { src: string }[];
  claseImageSrc: string;
}

export function resolveLessonCardImage(
  lessonId: LessonTypeId,
  index: number,
  fallback: LessonCardImageFallback,
  displayName: string,
): {
  src: StaticImageData | string;
  alt: string;
  objectPosition?: string;
} {
  const local: LessonCardImage | undefined = LOCAL_LESSON_CARD_IMAGES[lessonId];
  return {
    src: local?.src ?? fallback.lessonCards[index]?.src ?? fallback.claseImageSrc,
    alt: local?.alt ?? displayName,
    objectPosition: local?.objectPosition,
  };
}
