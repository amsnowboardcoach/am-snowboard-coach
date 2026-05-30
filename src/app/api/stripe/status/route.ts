import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe/config";

export function GET() {
  return NextResponse.json({ enabled: isStripeConfigured() });
}
