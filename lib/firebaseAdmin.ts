// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

let app: admin.app.App | undefined;

function getEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

// Accepte les deux conventions d'ENV: FIREBASE_* et FB_*
const projectId =
  getEnv("FIREBASE_PROJECT_ID") ||
  getEnv("FB_PROJECT_ID");

const clientEmail =
  getEnv("FIREBASE_CLIENT_EMAIL") ||
  getEnv("FB_CLIENT_EMAIL");

let privateKey =
  getEnv("FIREBASE_PRIVATE_KEY") ||
  getEnv("FB_PRIVATE_KEY");

// Vercel stocke souvent la clé avec \n littéraux -> on les remet en vrais retours à la ligne
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Fallback: tentera d'utiliser GOOGLE_APPLICATION_CREDENTIALS si dispo
    app = admin.initializeApp();
    if (!projectId || !clientEmail || !privateKey) {
      console.warn(
        "⚠️ Firebase Admin: credentials non fournies via ENV (FIREBASE_* ou FB_*). " +
        "On tente le fallback par défaut (GOOGLE_APPLICATION_CREDENTIALS)."
      );
    }
  }
}

export function getAdminDb() {
  if (!app) {
    throw new Error("Firebase Admin non initialisé.");
  }
  return admin.firestore();
}
