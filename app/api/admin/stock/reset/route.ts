export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST() {
  try {
    const db = getAdminDb();
    const docs = ["tipis-lit140", "tipis-lits90"];

    const batch = db.batch();
    docs.forEach((id) => {
      const ref = db.collection("lodgings").doc(id);
      batch.set(ref, { reservedUnits: 0 }, { merge: true });
    });
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /api/admin/stock/reset error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 500 });
  }
}
