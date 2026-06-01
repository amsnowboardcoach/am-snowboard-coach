import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { COACH_ROLES, isAlumnoRole } from "@/constants/roles";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

function getStorageBucket() {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  return bucketName
    ? getStorage().bucket(bucketName)
    : getStorage().bucket();
}

async function deleteQueryBatch(
  query: FirebaseFirestore.Query,
): Promise<number> {
  const db = getAdminDb();
  let total = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await query.limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    total += snap.size;
  }
  return total;
}

async function deleteStorageFile(path: string | undefined): Promise<void> {
  if (!path?.trim()) return;
  try {
    await getStorageBucket().file(path).delete();
  } catch {
    /* ya borrado */
  }
}

async function deleteStoragePrefix(prefix: string): Promise<void> {
  try {
    const [files] = await getStorageBucket().getFiles({ prefix });
    await Promise.all(files.map((f) => f.delete().catch(() => undefined)));
  } catch {
    /* ignore */
  }
}

async function deleteTribePost(postId: string, storagePath?: string): Promise<void> {
  const db = getAdminDb();
  const postRef = db.collection("tribe_posts").doc(postId);
  await deleteQueryBatch(postRef.collection("comments"));
  await deleteQueryBatch(postRef.collection("fires"));
  await deleteStorageFile(storagePath);
  await deleteStoragePrefix(`tribe/${postId}/`);
  await postRef.delete();
}

async function deleteUserSubcollections(userId: string): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);

  const videosSnap = await userRef.collection("progress_videos").get();
  for (const v of videosSnap.docs) {
    const data = v.data();
    await deleteStorageFile(data.storagePath as string | undefined);
  }
  await deleteStoragePrefix(`progress_videos/${userId}/`);
  await deleteQueryBatch(userRef.collection("progress_videos"));
  await deleteQueryBatch(userRef.collection("trick_progress"));
  await deleteQueryBatch(userRef.collection("fcm_tokens"));
}

/** Comentarios del alumno en publicaciones de otros (sin collectionGroup). */
async function deleteTribeCommentsByAuthor(userId: string): Promise<void> {
  const db = getAdminDb();
  const postsSnap = await db.collection("tribe_posts").select().get();

  for (const post of postsSnap.docs) {
    const commentsSnap = await post.ref
      .collection("comments")
      .where("authorId", "==", userId)
      .get();

    for (const commentDoc of commentsSnap.docs) {
      await commentDoc.ref.delete();
      try {
        await post.ref.update({ commentCount: FieldValue.increment(-1) });
      } catch {
        /* ignore */
      }
    }
  }
}

/** Likes (fires) del alumno en publicaciones de otros. */
async function deleteTribeFiresByAuthor(userId: string): Promise<void> {
  const db = getAdminDb();
  const postsSnap = await db.collection("tribe_posts").select().get();

  for (const post of postsSnap.docs) {
    const fireRef = post.ref.collection("fires").doc(userId);
    const fireSnap = await fireRef.get();
    if (!fireSnap.exists) continue;

    await fireRef.delete();
    try {
      await post.ref.update({ fireCount: FieldValue.increment(-1) });
    } catch {
      /* ignore */
    }
  }
}

async function deleteTribeContentByAuthor(userId: string): Promise<void> {
  const db = getAdminDb();
  const postsSnap = await db
    .collection("tribe_posts")
    .where("authorId", "==", userId)
    .get();
  for (const doc of postsSnap.docs) {
    const data = doc.data();
    await deleteTribePost(
      doc.id,
      data.storagePath as string | undefined,
    );
  }

  await deleteTribeCommentsByAuthor(userId);
  await deleteTribeFiresByAuthor(userId);
}

async function deleteMarketplaceBySeller(userId: string): Promise<void> {
  const db = getAdminDb();
  const snap = await db
    .collection("marketplace_listings")
    .where("sellerId", "==", userId)
    .get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const paths = (data.storagePaths as string[] | undefined) ?? [];
    for (const p of paths) {
      await deleteStorageFile(p);
    }
    const urls = data.imageUrls as string[] | undefined;
    if (urls?.length) {
      await deleteStoragePrefix(`marketplace/${doc.id}/`);
    }
    await doc.ref.delete();
  }
}

async function deleteBookingsForUser(
  userId: string,
  email: string,
): Promise<void> {
  const db = getAdminDb();
  const toDelete = new Map<
    string,
    FirebaseFirestore.QueryDocumentSnapshot
  >();

  const byUid = await db
    .collection("bookings")
    .where("userId", "==", userId)
    .get();
  for (const doc of byUid.docs) {
    toDelete.set(doc.id, doc);
  }

  if (email) {
    const byEmail = await db
      .collection("bookings")
      .where("studentEmail", "==", email)
      .get();
    for (const doc of byEmail.docs) {
      toDelete.set(doc.id, doc);
    }
  }

  for (const doc of toDelete.values()) {
    const invoicePath = doc.data().invoice?.pdfStoragePath as
      | string
      | undefined;
    await deleteStorageFile(invoicePath);
    await deleteStoragePrefix(`invoices/${doc.id}/`);
    await doc.ref.delete();
  }
}

async function deleteSnowReportContributions(userId: string): Promise<void> {
  const db = getAdminDb();
  const reportsSnap = await db.collection("snow_reports").get();
  let batch = db.batch();
  let count = 0;

  for (const report of reportsSnap.docs) {
    const contribRef = report.ref.collection("contributions").doc(userId);
    const contribSnap = await contribRef.get();
    if (contribSnap.exists) {
      batch.delete(contribRef);
      count++;
    }
    if (count >= 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}

async function deleteNotifications(userId: string): Promise<void> {
  await deleteQueryBatch(
    getAdminDb().collection("notifications").where("userId", "==", userId),
  );
}

export type DeleteUserAccountResult = {
  userId: string;
  displayName: string;
  email: string;
};

/** Elimina cuenta Firebase Auth, perfil y todo el contenido asociado al alumno. */
export async function deleteUserAccountCompletely(
  userId: string,
): Promise<DeleteUserAccountResult> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("Usuario no encontrado");
  }

  const data = userSnap.data()!;
  const role = data.role as string;

  if (COACH_ROLES.includes(role as (typeof COACH_ROLES)[number])) {
    throw new Error("No se puede eliminar una cuenta de coach desde aquí");
  }

  if (!isAlumnoRole(role)) {
    throw new Error("Solo se pueden eliminar cuentas de alumno");
  }

  const email = (data.email as string) || "";
  const displayName = (data.displayName as string) || "Alumno";

  await deleteUserSubcollections(userId);
  await deleteTribeContentByAuthor(userId);
  await deleteMarketplaceBySeller(userId);
  await deleteBookingsForUser(userId, email);
  await deleteSnowReportContributions(userId);
  await deleteNotifications(userId);
  await deleteStoragePrefix(`avatars/${userId}/`);

  await userRef.delete();

  try {
    await getAdminAuth().deleteUser(userId);
  } catch {
    /* puede no existir en Auth */
  }

  return { userId, displayName, email };
}

export async function assertCoachCanDeleteStudent(
  coachUid: string,
  studentId: string,
): Promise<void> {
  if (coachUid === studentId) {
    throw new Error("No puedes eliminar tu propia cuenta desde el panel");
  }
  const { assertCoachCanManageStudent } = await import(
    "@/lib/firebase/coach-student-access"
  );
  await assertCoachCanManageStudent(coachUid, studentId);
}
