"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { ROLES } from "@/constants/roles";
import { isStudentProfile } from "@/lib/auth/coach-role";
import {
  ensureTribeVisitorAuth,
  getStoredTribeGuestName,
  storeTribeGuestName,
  tribeCommentDisplayName,
} from "@/lib/auth/tribe-visitor";
import { formatFirestoreDate } from "@/lib/utils/dates";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import {
  addTribeComment,
  fetchTribeComments,
  shareTribePost,
  toggleTribeFire,
  userHasFired,
} from "@/lib/firebase/tribe-posts";
import type { TribeComment, TribePost } from "@/types/tribe-post";
import { cn } from "@/lib/utils/cn";

interface TribePostCardProps {
  post: TribePost;
  compact?: boolean;
  videoVertical?: boolean;
  highlighted?: boolean;
  openCommentsOnMount?: boolean;
  onFireChange?: (postId: string, fireCount: number) => void;
}

export function TribePostCard({
  post,
  compact = false,
  videoVertical = false,
  highlighted = false,
  openCommentsOnMount = false,
  onFireChange,
}: TribePostCardProps) {
  const { user, profile } = useAuth();
  const [fired, setFired] = useState(false);
  const [fireCount, setFireCount] = useState(post.fireCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentsOpen, setCommentsOpen] = useState(openCommentsOnMount);
  const [comments, setComments] = useState<TribeComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isStudentAccount =
    Boolean(user) &&
    !user?.isAnonymous &&
    Boolean(profile && isStudentProfile(profile));
  const needsGuestName = !isStudentAccount && !profile?.displayName;

  useEffect(() => {
    setFireCount(post.fireCount);
    setCommentCount(post.commentCount);
  }, [post.fireCount, post.commentCount]);

  useEffect(() => {
    setGuestName(getStoredTribeGuestName());
  }, []);

  useEffect(() => {
    if (!user) {
      setFired(false);
      return;
    }
    userHasFired(post.id, user.uid)
      .then(setFired)
      .catch(() => setFired(false));
  }, [post.id, user]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const list = await fetchTribeComments(post.id);
      setComments(list);
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  useEffect(() => {
    if (commentsOpen) loadComments();
  }, [commentsOpen, loadComments]);

  async function handleFire() {
    setActing(true);
    setActionError(null);
    try {
      const uid = await ensureTribeVisitorAuth();
      const result = await toggleTribeFire(post.id, uid);
      setFired(result.fired);
      setFireCount(result.fireCount);
      onFireChange?.(post.id, result.fireCount);
    } catch (err) {
      setActionError(
        formatFirestoreClientError(err, "No se pudo guardar tu reacción"),
      );
    } finally {
      setActing(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    if (needsGuestName && !guestName.trim()) {
      setActionError("Escribe cómo quieres que te vean en el comentario.");
      return;
    }

    setActing(true);
    setActionError(null);
    try {
      const uid = await ensureTribeVisitorAuth();
      const name = tribeCommentDisplayName(
        profile?.displayName || user?.displayName,
        guestName,
      );
      storeTribeGuestName(guestName);
      await addTribeComment(post.id, uid, name, trimmed);
      setCommentText("");
      setCommentCount((c) => c + 1);
      await loadComments();
    } catch (err) {
      setActionError(
        formatFirestoreClientError(err, "No se pudo enviar el comentario"),
      );
    } finally {
      setActing(false);
    }
  }

  async function handleShare() {
    try {
      const result = await shareTribePost(post);
      if (result === "copied") setShareHint("Enlace copiado");
      else if (result === "shared") setShareHint("Compartido");
      setTimeout(() => setShareHint(null), 2500);
    } catch {
      setShareHint("No se pudo compartir");
      setTimeout(() => setShareHint(null), 2500);
    }
  }

  const pending = post.moderationStatus === "pending";

  return (
    <article
      id={`tribe-post-${post.id}`}
      className={cn(
        "scroll-mt-header overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-sm",
        compact && "max-w-sm",
        highlighted &&
          "ring-2 ring-sky-500/50 shadow-lg shadow-sky-500/10",
      )}
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-sky-300">
          {post.authorPhotoURL ? (
            <Image
              src={post.authorPhotoURL}
              alt=""
              width={36}
              height={36}
              className="size-full object-cover"
            />
          ) : (
            post.authorDisplayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {post.authorDisplayName}
          </p>
          <p className="text-xs text-zinc-500">
            {formatFirestoreDate(post.createdAt)}
            {pending && (
              <span className="ml-2 text-amber-400">
                · En revisión (solo tú lo ves)
              </span>
            )}
          </p>
        </div>
      </header>

      <div
        className={cn(
          "relative bg-black",
          post.mediaType === "video" && videoVertical
            ? "aspect-[9/16] max-h-[min(70vh,520px)]"
            : post.mediaType === "video"
              ? "aspect-video"
              : "aspect-[4/5] sm:aspect-square",
        )}
      >
        {post.mediaType === "photo" ? (
          <Image
            src={post.mediaUrl}
            alt={post.caption || "Foto de la comunidad AM"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized
          />
        ) : (
          <video
            src={post.mediaUrl}
            controls
            playsInline
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => void handleFire()}
            disabled={acting}
            className={cn(
              "flex min-h-11 touch-manipulation items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              fired
                ? "bg-orange-500/15 text-orange-300"
                : "text-zinc-300 hover:bg-zinc-800/80 hover:text-orange-200",
            )}
            aria-pressed={fired}
            aria-label={fired ? "Quitar me gusta" : "Me gusta"}
          >
            <span className="text-base" aria-hidden>
              {fired ? "♥" : "♡"}
            </span>
            <span>{fireCount > 0 ? fireCount : "Me gusta"}</span>
          </button>
          <button
            type="button"
            onClick={() => setCommentsOpen((o) => !o)}
            aria-expanded={commentsOpen}
            className={cn(
              "flex min-h-11 touch-manipulation items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              commentsOpen
                ? "bg-sky-500/15 text-sky-300"
                : "text-zinc-300 hover:bg-zinc-800/80 hover:text-sky-200",
            )}
          >
            <span className="text-base" aria-hidden>
              💬
            </span>
            <span>
              {commentCount > 0
                ? `${commentCount} comentario${commentCount === 1 ? "" : "s"}`
                : "Comentar"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="ml-auto flex min-h-11 touch-manipulation items-center rounded-xl px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800/80 hover:text-sky-200"
          >
            Compartir
          </button>
        </div>
        {shareHint && (
          <p className="mt-1 text-xs text-sky-400">{shareHint}</p>
        )}
        {actionError && (
          <p className="mt-2 text-xs text-red-300" role="alert">
            {actionError}
          </p>
        )}
        {post.caption && (
          <p className="mt-2 text-sm text-zinc-300">
            <span className="font-medium text-zinc-200">
              {post.authorDisplayName}
            </span>{" "}
            {post.caption}
          </p>
        )}

        {commentsOpen && (
          <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 sm:p-4">
            {loadingComments ? (
              <p className="text-xs text-zinc-500">Cargando comentarios…</p>
            ) : (
              <ul className="max-h-48 space-y-3 overflow-y-auto">
                {comments.length === 0 && (
                  <li className="text-sm text-zinc-500">
                    Sé el primero en comentar
                  </li>
                )}
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="text-sm leading-relaxed"
                  >
                    <span className="font-semibold text-zinc-100">
                      {c.authorDisplayName}
                    </span>
                    <span className="mt-0.5 block text-zinc-400">{c.text}</span>
                  </li>
                ))}
              </ul>
            )}
            <form
              onSubmit={(e) => void handleComment(e)}
              className="mt-4 space-y-2 border-t border-zinc-800/80 pt-3"
            >
              {needsGuestName && (
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Tu nombre (visible en el comentario)"
                  maxLength={40}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100"
                />
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario…"
                  maxLength={500}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={acting || !commentText.trim()}
                  className="btn-primary-md btn-inline shrink-0 rounded-xl disabled:opacity-40 sm:min-w-[6.5rem]"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
