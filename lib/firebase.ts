// lib/firebaseAdmin.ts
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function getAdminDb() {
  if (!adminApp) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    // On n'initialise PAS pendant la build si les env ne sont pas injectées
    if (!projectId || !clientEmail || !rawKey) {
      throw new Error(
        'Firebase Admin env manquantes. Vérifiez FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.'
      );
    }

    const privateKey = rawKey.replace(/\\n/g, '\n');

    adminApp = getApps().length
      ? getApps()[0]!
      : initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
  }
  return getFirestore(adminApp);
}
