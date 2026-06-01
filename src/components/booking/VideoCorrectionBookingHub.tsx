"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookingAuthGate } from "@/components/booking/BookingAuthGate";
import { getBookingAuthHeaders } from "@/lib/auth/booking-auth-headers";
import { useAuth } from "@/contexts/AuthProvider";
import {
  VIDEO_CORRECTION_PRODUCT,
  formatVideoCorrectionPrice,
  videoCorrectionTotalEuros,
} from "@/constants/video-correction";
import { scrollToId, scrollToTop } from "@/lib/navigation/scroll";
import { cn } from "@/lib/utils/cn";

export function VideoCorrectionBookingHub() {
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const canBook = Boolean(user?.email) && !authLoading;

  const [videoCount, setVideoCount] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const autoSubmitStarted = useRef(false);

  const totalEuros = videoCorrectionTotalEuros(videoCount);

  useEffect(() => {
    if (searchParams.get("paid") === "1") {
      setPaymentSuccess(true);
      scrollToTop();
    } else if (searchParams.get("cancelled") === "1") {
      setSubmitError(
        "El pago se canceló. Vuelve a intentarlo o escríbenos por WhatsApp si necesitas ayuda.",
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || !user?.email) return;
    const displayName =
      profile?.displayName?.trim() ||
      user.displayName?.trim() ||
      user.email.split("@")[0] ||
      "Alumno";
    setName(displayName);
    setEmail(user.email);
  }, [authLoading, user, profile]);

  const submitRequest = useCallback(async () => {
    if (!canBook) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings/reserve-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getBookingAuthHeaders()),
        },
        body: JSON.stringify({
          name,
          email,
          videoCount,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar la solicitud");
      if (typeof data.checkoutUrl === "string" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error("No se recibió el enlace de pago");
    } catch (err) {
      autoSubmitStarted.current = false;
      setSubmitError(
        err instanceof Error ? err.message : "No se pudo enviar la solicitud",
      );
    } finally {
      setSubmitting(false);
    }
  }, [canBook, name, email, videoCount, notes]);

  useEffect(() => {
    if (
      authLoading ||
      !canBook ||
      !showAuthGate ||
      autoSubmitStarted.current
    ) {
      return;
    }
    autoSubmitStarted.current = true;
    void submitRequest();
  }, [authLoading, canBook, showAuthGate, submitRequest]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canBook) {
      setShowAuthGate(true);
      setSubmitError(null);
      requestAnimationFrame(() => {
        scrollToId("booking-auth-gate", { block: "start" });
      });
      return;
    }
    await submitRequest();
  }

  if (paymentSuccess) {
    return (
      <div className="alert-success p-8 text-center sm:p-10">
        <p className="text-2xl font-semibold text-emerald-300">
          ¡Pago recibido!
        </p>
        <p className="mt-4 text-zinc-300">
          Hemos registrado tu pago por video corrección.{" "}
          <strong>Alejandro revisará tu solicitud</strong> y te avisará por email
          y notificación cuando puedas subir el material desde{" "}
          <Link
            href="/perfil/videos"
            className="link-accent underline-offset-2 hover:underline"
          >
            Mis vídeos
          </Link>
          .
        </p>
        <Link
          href="/perfil/videos"
          className="btn-primary-md mt-8"
        >
          Ir a Mis vídeos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-5">
        <h2 className="text-lg font-semibold text-sky-200">
          {VIDEO_CORRECTION_PRODUCT.name}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {VIDEO_CORRECTION_PRODUCT.description}
        </p>
        <p className="mt-4 text-2xl font-bold text-sky-400">
          {VIDEO_CORRECTION_PRODUCT.priceEuros} €{" "}
          <span className="text-base font-normal text-zinc-500">
            por vídeo a corregir
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-sm font-medium text-zinc-300">
            ¿Cuántos vídeos quieres corregir?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from(
              { length: VIDEO_CORRECTION_PRODUCT.maxQuantity },
              (_, i) => i + 1,
            ).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setVideoCount(n)}
                className={cn(
                  "min-w-[3rem] rounded-full border px-4 py-2 text-sm font-medium transition",
                  videoCount === n
                    ? "border-sky-500 bg-sky-500/20 text-sky-200"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            {formatVideoCorrectionPrice(videoCount)}
          </p>
        </div>

        <label className="block text-sm text-zinc-300">
          Notas para el coach <span className="text-zinc-500">(opcional)</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nivel, maniobra a revisar, enlace al vídeo si ya lo tienes…"
            className="form-input"
          />
        </label>

        <div
          id="video-booking-summary"
          className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-400"
        >
          <p className="font-medium text-zinc-200">Resumen</p>
          <p className="mt-1">
            {videoCount} {videoCount === 1 ? "vídeo" : "vídeos"} a corregir ·{" "}
            <strong className="text-sky-300">{totalEuros} €</strong>
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Pagas con tarjeta ahora (Stripe). Tras el pago, Alejandro aceptará tu
            solicitud y podrás subir el material.
          </p>
        </div>

        {submitError && (
          <p className="text-sm text-red-300" role="alert">
            {submitError}
          </p>
        )}

        {(!showAuthGate || canBook) && (
          <>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-md w-full disabled:opacity-50 sm:w-auto"
            >
              {submitting
                ? "Preparando pago…"
                : `Reservar y pagar ${totalEuros} €`}
            </button>
            <p className="text-center text-xs text-zinc-500">
              {!canBook
                ? "Entra con tu cuenta de alumno y te llevamos al pago con tarjeta. "
                : "Pago seguro con Stripe. "}
            </p>
          </>
        )}

        {showAuthGate && !canBook && (
          <>
            <BookingAuthGate
              className="scroll-mt-header"
              headline="Tu solicitud está lista"
              totalEuros={totalEuros}
              summary={`${videoCount} ${videoCount === 1 ? "vídeo" : "vídeos"} a corregir`}
              onError={setAuthError}
              onGoogleSuccess={() => setShowAuthGate(true)}
            />
            {authError && (
              <p className="text-sm text-red-300" role="alert">
                {authError}
              </p>
            )}
          </>
        )}
      </form>

      <p className="text-center text-sm text-zinc-500">
        ¿Buscas clase en pista?{" "}
        <Link
          href="/reservar"
          className="link-accent underline-offset-2 hover:underline"
        >
          Reservar clase en Sierra Nevada
        </Link>
      </p>
    </div>
  );
}
