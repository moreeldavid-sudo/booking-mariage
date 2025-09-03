// lib/firebaseAdmin.ts
import admin from "firebase-admin";

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
let privateKey = process.env.FB_PRIVATE_KEY || "";

// Corrige la version échappée avec \n si nécessaire
if (privateKey && privateKey.includes("\\n")) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

function assertEnv() {
  const missing: string[] = [];
  if (!projectId) missing.push("FB_PROJECT_ID");
  if (!clientEmail) missing.push("FB_CLIENT_EMAIL");
  if (!privateKey) missing.push("FB_PRIVATE_KEY");
  if (missing.length) {
    throw new Error(
      `Firebase Admin env manquantes: ${missing.join(" / ")}`
    );
  }
}

let _db: admin.firestore.Firestore | null = null;

export function getAdminDb() {
  if (_db) return _db;

  assertEnv();

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId!,
        clientEmail: clientEmail!,
        privateKey: privateKey!,
      }),
    });
  }
  _db = admin.firestore();
  return _db;
}

export const adminDb = getAdminDb();
