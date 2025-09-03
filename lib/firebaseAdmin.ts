// lib/firebaseAdmin.ts
import admin from 'firebase-admin';

let _db: admin.firestore.Firestore | null = null;

export function getAdminDb() {
  if (_db) return _db;

  // --- Lis les variables d'environnement (noms FB_ comme tu as choisi) ---
  const projectId  = process.env.FB_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL;
  let privateKey   = process.env.FB_PRIVATE_KEY || '';

  // Accepte la clé privée au format "échappé" (\n) ou multilignes
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const missing: string[] = [];
  if (!projectId)   missing.push('FB_PROJECT_ID');
  if (!clientEmail) missing.push('FB_CLIENT_EMAIL');
  if (!privateKey)  missing.push('FB_PRIVATE_KEY');

  if (missing.length) {
    throw new Error(
      `Firebase Admin env manquantes: ${missing.join(' / ')}`
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  _db = admin.firestore();
  return _db;
}
