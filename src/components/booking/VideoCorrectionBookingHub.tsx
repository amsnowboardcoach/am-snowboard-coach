"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { BookingAuthGate } from "@/components/booking/BookingAuthGate";
import { getBookingAuthHeaders } from "@/lib/auth/booking-auth-headers";
import { useAuth } from "@/contexts/AuthProvider";
import {
  VIDEO_CORRECTION_PRODUCT,
  formatVideoCorrectionPrice,
  videoCorrectionTotalEuros,
} from "@/constants/video-correction";
import { scrollToId } from "@/lib/navigation/scroll";
import { cn } from "@/lib/utils/cn";

export function VideoCorrectionBookingHub() {
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
  const [done, setDone] = useState(false);
  const autoSubmitStarted = useRef(false);

  const totalEuros = videoCorrectionTotalEuros(videoCount);

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
      setDone(true);
      setShowAuthGate(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "No se pudo enviar la solicitud",
      );
    } finally {
      setSubmitting(false);
    }
  }, [canBook, name, email, videoCount, notes]);

  useEffect(() => {
    if (authLoading || !canBook || !showAuthGate || autoSubmitStarted.current) {
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

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-10 text-center">
        <p className="text-2xl font-semibold text-emerald-300">
          ¡Solicitud recibida!
        </p>
        <p className="mt-4 text-zinc-300">
          Revisaré tu petición de {videoCount}{" "}
          {videoCount === 1 ? "vídeo" : "vídeos"}. Si la confirmo, te enviaré el
          enlace para pagar {totalEuros} € y podrás subir el material desde{" "}
          <Link href="/perfil/videos" className="text-sky-400 hover:underline">
            Mis vídeos
          </Link>
          .
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Te avisaremos por email y notificación cuando haya novedades.
        </p>
        <Link
          href="/perfil/videos"
          className="mt-6 inline-block rounded-full border border-violet-500/50 px-6 py-3 text-sm font-medium text-violet-200 hover:bg-violet-500/10"
        >
          Ir a Mis vídeos
        </Link>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setVideoCount(1);
            setNotes("");
            setShowAuthGate(false);
            autoSubmitStarted.current = false;
          }}
          className="mt-8 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
        >
          Otra solicitud
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5">
        <h2 className="text-lg font-semibold text-violet-200">
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
          Notas para el coach <span className="text-zinc-600">(opcional)</span>
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
            Pagas con tarjeta cuando confirme tu solicitud.
          </p>
        </div>

        {submitError && (
          <p className="text-sm text-red-400" role="alert">
            {submitError}
          </p>
        )}

        {!showAuthGate && (
          <>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-sky-500 py-3 font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50 sm:w-auto sm:px-10"
            >
              {submitting
                ? "Enviando…"
                : `Solicitar corrección · ${totalEuros} €`}
            </button>
            <p className="text-center text-xs text-zinc-500">
              Al enviar verás el último paso (entrar o registrarte).
            </p>
          </>
        )}

        {showAuthGate && (
          <>
            <BookingAuthGate
              className="scroll-mt-header"
              headline="Tu solicitud está lista"
              totalEuros={totalEuros}
              summary={`${videoCount} ${videoCount === 1 ? "vídeo" : "vídeos"} a corregir`}
              confirming={submitting}
              onConfirm={() => void submitRequest()}
              onError={setAuthError}
              onGoogleSuccess={() => setShowAuthGate(true)}
            />
            {authError && (
              <p className="text-sm text-red-400" role="alert">
                {authError}
              </p>
            )}
          </>
        )}
      </form>

      <p className="text-center text-sm text-zinc-500">
        ¿Buscas clase en pista?{" "}
        <Link href="/reservar" className="text-sky-400 hover:underline">
          Reservar clase en Sierra Nevada
        </Link>
      </p>
    </div>
  );
}
