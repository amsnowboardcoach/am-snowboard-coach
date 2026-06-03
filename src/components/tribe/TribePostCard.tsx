"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/contexts/AuthProvider";
import { isCoachProfile } from "@/lib/auth/coach-role";
import { loginPathWithNext } from "@/lib/auth/paths";
import { tribeCommentAuthorName } from "@/lib/auth/tribe-comment-author";
import {
  canInteractOnTribeFeed,
  tribeInteractBlockedMessage,
} from "@/lib/auth/tribe-interact";
import { formatFirestoreDate } from "@/lib/utils/dates";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import {
  addTribeComment,
  deleteTribeComment,
  fetchTribeComments,
  shareTribePost,
  toggleTribeFire,
  userHasFired,
} from "@/lib/firebase/tribe-posts";
import type { TribeComment, TribePost } from "@/types/tribe-post";
import { cn } from "@/lib/utils/cn";

const COMMENT_PREVIEW_COUNT = 2;

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
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [fired, setFired] = useState(false);
  const [fireCount, setFireCount] = useState(post.fireCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentsExpanded, setCommentsExpanded] = useState(openCommentsOnMount);
  const [comments, setComments] = useState<TribeComment[]>([]);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [interactNotice, setInteractNotice] = useState<string | null>(null);
  const interactNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [acting, setActing] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const isCoach = Boolean(profile && isCoachProfile(profile));
  const canInteract = canInteractOnTribeFeed(user, profile);
  const commentAsName = tribeCommentAuthorName(profile, user);

  useEffect(() => {
    return () => {
      if (interactNoticeTimerRef.current) {
        clearTimeout(interactNoticeTimerRef.current);
      }
    };
  }, []);

  function showInteractNotice() {
    if (interactNoticeTimerRef.current) {
      clearTimeout(interactNoticeTimerRef.current);
    }
    setInteractNotice(tribeInteractBlockedMessage(user, profile));
    interactNoticeTimerRef.current = setTimeout(() => {
      setInteractNotice(null);
      interactNoticeTimerRef.current = null;
    }, 3500);
  }

  function commentDisplayName(comment: TribeComment): string {
    if (user && comment.authorId === user.uid) {
      return tribeCommentAuthorName(profile, user, comment.authorDisplayName);
    }
    return comment.authorDisplayName;
  }

  function canDeleteComment(comment: TribeComment): boolean {
    if (!user) return false;
    if (isCoach) return true;
    return comment.authorId === user.uid;
  }

  useEffect(() => {
    setFireCount(post.fireCount);
    setCommentCount(post.commentCount);
  }, [post.fireCount, post.commentCount]);

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
    if (post.commentCount > 0) void loadComments();
  }, [post.commentCount, loadComments]);

  useEffect(() => {
    if (!openCommentsOnMount) return;
    setCommentsExpanded(true);
    void loadComments();
    commentInputRef.current?.focus({ preventScroll: true });
  }, [openCommentsOnMount, loadComments]);

  const hasHiddenComments =
    commentCount > COMMENT_PREVIEW_COUNT && !commentsExpanded;
  const visibleComments = commentsExpanded
    ? comments
    : comments.slice(-COMMENT_PREVIEW_COUNT);

  function blockInteract(): boolean {
    if (authLoading) return true;
    if (canInteract && user) return false;

    if (!user || user.isAnonymous) {
      router.push(loginPathWithNext(`/tribu?post=${post.id}`));
      return true;
    }

    showInteractNotice();
    return true;
  }

  async function handleFire() {
    if (blockInteract() || !user) return;
    setActing(true);
    setActionError(null);
    try {
      const result = await toggleTribeFire(post.id, user.uid);
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
    if (blockInteract() || !user) return;

    setActing(true);
    setActionError(null);
    try {
      const freshProfile = await refreshProfile();
      const name = tribeCommentAuthorName(freshProfile, user);
      if (!freshProfile?.displayName?.trim() && !user.displayName?.trim()) {
        setActionError(
          "Añade tu nombre en el perfil para que aparezca en los comentarios.",
        );
        return;
      }
      await addTribeComment(post.id, user.uid, name, trimmed);
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

  async function handleDeleteComment(comment: TribeComment) {
    if (!canDeleteComment(comment)) return;
    const prompt = isCoach
      ? "¿Eliminar este comentario del feed?"
      : "¿Eliminar tu comentario?";
    if (!window.confirm(prompt)) return;

    setDeletingCommentId(comment.id);
    setActionError(null);
    try {
      await deleteTribeComment(post.id, comment.id);
      setCommentCount((c) => Math.max(0, c - 1));
      await loadComments();
    } catch (err) {
      setActionError(
        formatFirestoreClientError(err, "No se pudo borrar el comentario"),
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleShare() {
    if (blockInteract()) return;
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
        <UserAvatar
          photoURL={post.authorPhotoURL}
          displayName={post.authorDisplayName}
        />
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
            disabled={acting || authLoading}
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
            onClick={() => {
              if (blockInteract()) return;
              commentInputRef.current?.focus({ preventScroll: true });
              commentInputRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }}
            disabled={authLoading}
            className="flex min-h-11 touch-manipulation items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800/80 hover:text-sky-200"
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
            disabled={authLoading}
            className="ml-auto flex min-h-11 touch-manipulation items-center rounded-xl px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800/80 hover:text-sky-200 disabled:opacity-50"
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
        {post.postKind === "passport" && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-200 ring-1 ring-sky-500/25">
            Logro del pasaporte
            {post.passportTrickName ? ` · ${post.passportTrickName}` : ""}
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

        {(commentCount > 0 || loadingComments) && (
          <div className="mt-3 space-y-1">
            {loadingComments && comments.length === 0 ? (
              <p className="text-xs text-zinc-500">Cargando comentarios…</p>
            ) : (
              <>
                {hasHiddenComments && (
                  <button
                    type="button"
                    onClick={() => {
                      setCommentsExpanded(true);
                      if (comments.length < commentCount) void loadComments();
                    }}
                    className="text-sm text-zinc-500 transition hover:text-zinc-300"
                  >
                    Ver los {commentCount} comentarios
                  </button>
                )}
                <ul className="space-y-1">
                  {visibleComments.map((c) => (
                    <li
                      key={c.id}
                      className="group flex gap-2 text-sm leading-snug"
                    >
                      <p className="min-w-0 flex-1 text-zinc-300">
                        <span className="mr-1.5 font-semibold text-zinc-100">
                          {commentDisplayName(c)}
                        </span>
                        {c.text}
                      </p>
                      {canDeleteComment(c) && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteComment(c)}
                          disabled={
                            acting ||
                            deletingCommentId === c.id ||
                            Boolean(deletingCommentId)
                          }
                          className="shrink-0 self-start rounded-lg px-2 py-0.5 text-xs text-zinc-500 opacity-70 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 sm:opacity-0"
                          aria-label={
                            isCoach && c.authorId !== user?.uid
                              ? "Eliminar comentario (coach)"
                              : "Eliminar mi comentario"
                          }
                        >
                          {deletingCommentId === c.id ? "…" : "Borrar"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {commentsExpanded && commentCount > COMMENT_PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setCommentsExpanded(false)}
                    className="text-sm text-zinc-500 transition hover:text-zinc-300"
                  >
                    Ocultar comentarios
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => void handleComment(e)}
          className="mt-3 space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 sm:p-4"
        >
          {canInteract && (
            <p className="text-sm font-semibold text-zinc-100">{commentAsName}</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario…"
              maxLength={500}
              disabled={acting || authLoading}
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100"
            />
            <button
              type="submit"
              disabled={acting || authLoading || !commentText.trim()}
              className="btn-primary-md btn-inline shrink-0 rounded-xl disabled:opacity-40 sm:min-w-[6.5rem]"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>

      {interactNotice && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-20 left-1/2 z-[100] max-w-[min(90vw,22rem)] -translate-x-1/2 rounded-xl border border-amber-500/40 bg-zinc-900/95 px-4 py-3 text-center text-sm text-amber-100 shadow-lg backdrop-blur-sm"
        >
          {interactNotice}
        </div>
      )}
    </article>
  );
}
