"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccount } from "@/lib/account/delete-account-client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { LEGAL_PATHS } from "@/constants/legal-site";
import Link from "next/link";

const CONFIRM_TEXT = "ELIMINAR";

export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await deleteMyAccount(phrase);
      await getFirebaseAuth().signOut();
      router.replace("/?cuenta=eliminada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <section className="mt-12 rounded-2xl border border-red-500/25 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-200">Eliminar mi cuenta</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Se borrarán tu perfil, vídeos, publicaciones en La Tribu, anuncios del
          mercadillo y reservas vinculadas. Esta acción no se puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-full border border-red-500/50 px-5 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
        >
          Quiero eliminar mi cuenta
        </button>
      </section>
    );
  }

  return (
    <section className="mt-12 rounded-2xl border border-red-500/40 bg-red-500/10 p-6">
      <h2 className="text-lg font-semibold text-red-200">Confirmar eliminación</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-500">
        <li>Perfil y acceso (no podrás volver a entrar con este email)</li>
        <li>Vídeos de corrección y archivos subidos</li>
        <li>Publicaciones y comentarios en La Tribu</li>
        <li>Anuncios del mercadillo</li>
        <li>Reservas asociadas a tu cuenta</li>
      </ul>
      <p className="mt-3 text-xs text-zinc-500">
        Consulta la{" "}
        <Link href={LEGAL_PATHS.privacy} className="link-accent underline-offset-2 hover:underline">
          política de privacidad
        </Link>{" "}
        sobre supresión de datos.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="block text-sm text-zinc-400">
          Escribe <strong className="text-red-200">{CONFIRM_TEXT}</strong> para
          confirmar
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="form-input mt-2 max-w-xs uppercase tracking-wider"
            autoComplete="off"
            required
          />
        </label>

        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <div className="btn-row">
          <button
            type="submit"
            disabled={loading || phrase.trim().toUpperCase() !== CONFIRM_TEXT}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
          >
            {loading ? "Eliminando…" : "Eliminar cuenta definitivamente"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setOpen(false);
              setPhrase("");
              setError(null);
            }}
            className="btn-outline btn-inline"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
