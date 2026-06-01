import Link from "next/link";
import {
  BOOKING_CANCELLATION_POLICY_ITEMS,
  BOOKING_CANCELLATION_POLICY_NOTE,
  BOOKING_CANCELLATION_POLICY_TITLE,
} from "@/constants/booking-cancellation";
import { LEGAL_PATHS } from "@/constants/legal-site";
import { cn } from "@/lib/utils/cn";

interface BookingCancellationPolicyProps {
  className?: string;
  compact?: boolean;
}

export function BookingCancellationPolicy({
  className,
  compact = false,
}: BookingCancellationPolicyProps) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/40",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      )}
      aria-labelledby="booking-cancellation-policy-title"
    >
      <h3
        id="booking-cancellation-policy-title"
        className={cn(
          "font-semibold text-zinc-200",
          compact ? "text-sm" : "text-base",
        )}
      >
        {BOOKING_CANCELLATION_POLICY_TITLE}
      </h3>
      <ul
        className={cn(
          "mt-3 space-y-3 text-zinc-400",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {BOOKING_CANCELLATION_POLICY_ITEMS.map((item) => (
          <li key={item.id}>
            <span className="font-medium text-zinc-300">{item.label}:</span>{" "}
            {item.text}
          </li>
        ))}
      </ul>
      <p
        className={cn(
          "mt-3 text-zinc-500",
          compact ? "text-[11px] leading-relaxed" : "text-xs leading-relaxed",
        )}
      >
        {BOOKING_CANCELLATION_POLICY_NOTE}{" "}
        <Link
          href={LEGAL_PATHS.terms}
          className="text-sky-400/90 underline-offset-2 hover:text-sky-300 hover:underline"
        >
          Términos de uso
        </Link>
        .
      </p>
    </aside>
  );
}
