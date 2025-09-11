// app/api/admin/debug/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();

    // Lis les docs 'lodgings' vus par le SERVEUR
    const lodgingsSnap = await db.collection("lodgings").get();
    const lodgings = lodgingsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Compte rapide des 10 dernières résas vues par le SERVEUR
    const resSnap = await db
      .collection("reservations")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const reservations = resSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Retour debug
    return NextResponse.json({
      projectId:
        process.env.FIREBASE_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        "unknown",
      lodgings,
      reservationsCount: resSnap.size,
      reservations,
    });
  } catch (e: any) {
    console.error("DEBUG ERROR", e);
    return NextResponse.json({ error: e?.message || "debug error" }, { status: 500 });
  }
}
