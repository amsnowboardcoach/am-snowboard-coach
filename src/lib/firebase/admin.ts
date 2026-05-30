import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

let adminAppInstance: App | null = null;

function loadServiceAccountFromFile(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const credPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    join(process.cwd(), "secrets", "firebase-admin.json");
  if (!existsSync(credPath)) return null;
  const json = JSON.parse(readFileSync(credPath, "utf8")) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  if (!json.project_id || !json.client_email || !json.private_key) return null;
  return {
    projectId: json.project_id,
    clientEmail: json.client_email,
    privateKey: json.private_key,
  };
}

function createAdminApp(): App {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  const fromFile = loadServiceAccountFromFile();
  if (fromFile) {
    return initializeApp({
      credential: cert(fromFile),
    });
  }

  if (projectId) {
    try {
      return initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    } catch {
      // fall through
    }
  }

  throw new Error(
    "Firebase Admin: añade FIREBASE_ADMIN_* en .env.local, o ejecuta: node scripts/import-firebase-admin.mjs <clave.json>",
  );
}

export function getAdminApp(): App {
  if (adminAppInstance) {
    return adminAppInstance;
  }

  if (getApps().length > 0) {
    adminAppInstance = getApps()[0]!;
    return adminAppInstance;
  }

  adminAppInstance = createAdminApp();
  return adminAppInstance;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
