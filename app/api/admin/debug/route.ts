// app/api/admin/debug/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    const app = getAdminApp();

    // Infos d’environnement (présence des variables)
    const envPresence = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FB_PROJECT_ID: !!process.env.FB_PROJECT_ID,
      FB_CLIENT_EMAIL: !!process.env.FB_CLIENT_EMAIL,
      FB_PRIVATE_KEY: !!process.env.FB_PRIVATE_KEY,
      GOOGLE_CLOUD_PROJECT: !!process.env.GOOGLE_CLOUD_PROJECT,
    };

    // Project ID réellement utilisé par l'app admin
    const adminProjectId =
      // @ts-ignore - projectId est présent dans options si fourni
      (app.options && (app.options as any).projectId) ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.FB_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      "unknown";

    // Lecture 'lodgings'
    const lodSnap = await db.collection("lodgings").get();
    const lodgings = lodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 10 dernières réservations
    const resSnap = await db
      .collection("reservations")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    const reservations = resSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      adminProjectId,
      envPresence,
      lodgings,
      reservationsCount: resSnap.size,
      reservations,
    });
  } catch (e: any) {
    console.error("DEBUG ERROR", e);
    return NextResponse.json({ error: e?.message || "debug error" }, { status: 500 });
  }
}
