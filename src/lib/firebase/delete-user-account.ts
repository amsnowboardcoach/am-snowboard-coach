import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { COACH_ROLES, ROLES } from "@/constants/roles";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

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
    await getStorage().bucket().file(path).delete();
  } catch {
    /* ya borrado */
  }
}

async function deleteStoragePrefix(prefix: string): Promise<void> {
  try {
    const [files] = await getStorage().bucket().getFiles({ prefix });
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

  const commentsSnap = await db
    .collectionGroup("comments")
    .where("authorId", "==", userId)
    .get();
  for (const commentDoc of commentsSnap.docs) {
    const postRef = commentDoc.ref.parent.parent;
    if (!postRef) continue;
    await commentDoc.ref.delete();
    try {
      await postRef.update({ commentCount: FieldValue.increment(-1) });
    } catch {
      /* ignore */
    }
  }

  const firesSnap = await db
    .collectionGroup("fires")
    .where(FieldPath.documentId(), "==", userId)
    .get();
  for (const fireDoc of firesSnap.docs) {
    const postRef = fireDoc.ref.parent.parent;
    if (!postRef) continue;
    await fireDoc.ref.delete();
    try {
      await postRef.update({ fireCount: FieldValue.increment(-1) });
    } catch {
      /* ignore */
    }
  }
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
  const batch = db.batch();
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

  if (role !== ROLES.STUDENT) {
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

  const db = getAdminDb();
  const studentSnap = await db.collection("users").doc(studentId).get();
  if (!studentSnap.exists) {
    throw new Error("Alumno no encontrado");
  }

  const student = studentSnap.data()!;
  if (student.role !== ROLES.STUDENT) {
    throw new Error("Solo puedes eliminar alumnos");
  }

  const coachSnap = await db.collection("users").doc(coachUid).get();
  const coachRole = coachSnap.data()?.role as string | undefined;
  if (!coachRole || !COACH_ROLES.includes(coachRole as (typeof COACH_ROLES)[number])) {
    throw new Error("No autorizado");
  }

  if (student.assignedCoachId !== coachUid && coachRole !== ROLES.ADMIN) {
    throw new Error("Este alumno no está asignado a tu panel");
  }
}
