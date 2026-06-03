import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const SIZE_PX = {
  sm: 32,
  md: 36,
  lg: 64,
} as const;

interface UserAvatarProps {
  photoURL?: string | null;
  displayName: string;
  size?: keyof typeof SIZE_PX;
  className?: string;
}

export function UserAvatar({
  photoURL,
  displayName,
  size = "md",
  className,
}: UserAvatarProps) {
  const px = SIZE_PX[size];
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 font-semibold text-sky-300",
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-9 text-sm",
        size === "lg" && "size-16 text-xl",
        className,
      )}
    >
      {photoURL ? (
        <Image
          src={photoURL}
          alt=""
          width={px}
          height={px}
          className="size-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
}
