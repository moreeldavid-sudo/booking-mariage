// app/api/admin/recount/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

const EXPECTED_TOKEN = process.env.ADMIN_RESET_TOKEN || process.env.ADMIN_SECRET_TOKEN;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!EXPECTED_TOKEN || token !== EXPECTED_TOKEN) {
    return NextResponse.json({ error: "Token invalide." }, { status: 401 });
  }

  const db = getAdminDb();

  // 1) Récupère toutes les réservations confirmées (non annulées)
  const snap = await db.collection("reservations").get();
  const counts: Record<string, number> = {};
  snap.forEach((doc) => {
    const d = doc.data() as any;
    const status = d.status;
    const qty = Number(d.qty) || 0;
    if (status !== "cancelled" && qty > 0 && d.lodgingId) {
      counts[d.lodgingId] = (counts[d.lodgingId] || 0) + qty;
    }
  });

  // 2) Applique les compteurs
  const batch = db.batch();
  Object.entries(counts).forEach(([lodgingId, reservedUnits]) => {
    batch.set(db.collection("lodgings").doc(lodgingId), { reservedUnits }, { merge: true });
  });

  // S’assure que les autres lodgings non présents retombent à 0
  const lodgingsSnap = await db.collection("lodgings").get();
  lodgingsSnap.forEach((doc) => {
    if (!counts[doc.id]) {
      batch.set(doc.ref, { reservedUnits: 0 }, { merge: true });
    }
  });

  await batch.commit();

  return NextResponse.json({ ok: true, computed: counts });
}
