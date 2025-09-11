// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

let app: admin.app.App | undefined;

function env(name: string): string | undefined {
  return process.env[name] || undefined;
}

// Accepte les deux conventions d'ENV: FIREBASE_* et FB_*
const projectId =
  env("FIREBASE_PROJECT_ID") || env("FB_PROJECT_ID");

const clientEmail =
  env("FIREBASE_CLIENT_EMAIL") || env("FB_CLIENT_EMAIL");

let privateKey =
  env("FIREBASE_PRIVATE_KEY") || env("FB_PRIVATE_KEY");

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
      projectId, // renseigne options.projectId pour debug
    });
    console.log("[firebaseAdmin] Initialized with explicit credentials");
  } else {
    // Fallback: GOOGLE_APPLICATION_CREDENTIALS, etc.
    app = admin.initializeApp();
    console.warn(
      "[firebaseAdmin] ⚠️ No explicit creds from env (FIREBASE_* or FB_*). Falling back to default credentials."
    );
  }
}

export function getAdminDb() {
  if (!app) throw new Error("Firebase Admin non initialisé");
  return admin.firestore();
}

export function getAdminApp() {
  if (!app) throw new Error("Firebase Admin non initialisé");
  return app;
}
