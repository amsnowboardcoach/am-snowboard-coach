/**
 * Elimina reservas, facturas (PDFs) y alumnos de prueba en Firestore/Storage.
 * Conserva usuarios con rol coach, admin o collaborator.
 *
 * Uso:
 *   node scripts/purge-test-data.mjs           # solo muestra qué borraría
 *   node scripts/purge-test-data.mjs --confirm # ejecuta el borrado
 *
 * También elimina eventos «Clase snowboard — …» del Google Calendar (bloquean huecos).
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");
const confirm = process.argv.includes("--confirm");

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Falta .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val.replace(/\\n/g, "\n");
  }
  return env;
}

function initAdmin(env) {
  if (getApps().length > 0) return;

  const credPath =
    env.GOOGLE_APPLICATION_CREDENTIALS ||
    join(root, "secrets", "firebase-admin.json");

  if (
    env.FIREBASE_ADMIN_PROJECT_ID &&
    env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
      }),
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return;
  }

  if (existsSync(credPath)) {
    const key = JSON.parse(readFileSync(credPath, "utf8"));
    initializeApp({
      credential: cert({
        projectId: key.project_id,
        clientEmail: key.client_email,
        privateKey: key.private_key,
      }),
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return;
  }

  console.error(
    "Firebase Admin no configurado. Ejecuta import-firebase-admin.mjs primero.",
  );
  process.exit(1);
}

const KEEP_ROLES = new Set(["coach", "admin", "collaborator"]);

function isCoachUser(data, coachUid, coachEmails) {
  const role = data.role || "student";
  if (KEEP_ROLES.has(role)) return true;
  if (coachUid && data.uid === coachUid) return true;
  const email = (data.email || "").toLowerCase();
  return coachEmails.has(email);
}

async function deleteQueryBatch(db, query, label) {
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
    process.stdout.write(`  ${label}: ${total}…\r`);
  }
  if (total > 0) console.log(`  ${label}: ${total} eliminados`);
  return total;
}

async function deleteUserSubcollections(db, userId) {
  const subs = ["trick_progress", "progress_videos", "fcm_tokens"];
  let n = 0;
  for (const sub of subs) {
    n += await deleteQueryBatch(
      db,
      db.collection("users").doc(userId).collection(sub),
      `users/${userId}/${sub}`,
    );
  }
  return n;
}

async function deleteStorageInvoices(bucket) {
  let count = 0;
  try {
    const [files] = await bucket.getFiles({ prefix: "invoices/" });
    if (files.length === 0) return 0;
    await Promise.all(files.map((f) => f.delete()));
    count = files.length;
    console.log(`  Storage invoices/: ${count} archivos`);
  } catch (err) {
    console.warn("  Storage:", err.message);
  }
  return count;
}

async function main() {
  const env = loadEnv();
  initAdmin(env);

  const db = getFirestore();
  const auth = getAuth();
  const bucket = getStorage().bucket();

  const coachUid = env.NEXT_PUBLIC_DEFAULT_COACH_ID?.trim() || "";
  const coachEmails = new Set(
    (env.NEXT_PUBLIC_COACH_EMAILS || "amsnowboardcoach@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );

  console.log(confirm ? "=== BORRADO EN CURSO ===" : "=== VISTA PREVIA (añade --confirm) ===");
  console.log(`Coach conservado: UID ${coachUid || "(no definido)"}`);
  console.log(`Emails coach: ${[...coachEmails].join(", ")}\n`);

  const usersSnap = await db.collection("users").get();
  const studentsToDelete = [];
  const coachesKept = [];

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (isCoachUser({ ...data, uid: doc.id }, coachUid, coachEmails)) {
      coachesKept.push({ id: doc.id, email: data.email, role: data.role });
    } else {
      studentsToDelete.push({ id: doc.id, email: data.email, role: data.role });
    }
  }

  const bookingsSnap = await db.collection("bookings").get();

  console.log(`Reservas (bookings): ${bookingsSnap.size}`);
  console.log(`Alumnos a borrar: ${studentsToDelete.length}`);
  for (const s of studentsToDelete) {
    console.log(`  - ${s.email || s.id} (${s.role || "student"})`);
  }
  console.log(`Perfiles conservados: ${coachesKept.length}`);
  for (const c of coachesKept) {
    console.log(`  + ${c.email || c.id} (${c.role})`);
  }

  if (!confirm) {
    console.log("\nEjecuta: node scripts/purge-test-data.mjs --confirm");
    return;
  }

  let stats = { bookings: 0, subcols: 0, users: 0, auth: 0, storage: 0 };

  stats.bookings = await deleteQueryBatch(
    db,
    db.collection("bookings"),
    "bookings",
  );

  for (const student of studentsToDelete) {
    stats.subcols += await deleteUserSubcollections(db, student.id);
    await db.collection("users").doc(student.id).delete();
    stats.users++;
    try {
      await auth.deleteUser(student.id);
      stats.auth++;
    } catch {
      // Puede no existir en Auth (solo Firestore)
    }
  }

  stats.storage = await deleteStorageInvoices(bucket);

  console.log("\n=== LISTO ===");
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
