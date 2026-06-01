import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  getFirebasePublicConfig,
  isFirebaseConfigured,
} from "@/lib/auth/config";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

function assertFirebaseConfig(): void {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase no está configurado. Revisa NEXT_PUBLIC_FIREBASE_* en .env.local o en Vercel y vuelve a desplegar.",
    );
  }
}

function firebaseConfig() {
  return getFirebasePublicConfig();
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) {
    return appInstance;
  }

  if (getApps().length > 0) {
    appInstance = getApp();
    return appInstance;
  }

  assertFirebaseConfig();
  appInstance = initializeApp(firebaseConfig());
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  assertFirebaseConfig();

  if (authInstance) {
    return authInstance;
  }

  const app = getFirebaseApp();
  // getAuth (no initializeAuth): compatible con signInWithRedirect / getRedirectResult
  authInstance = getAuth(app);
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}
