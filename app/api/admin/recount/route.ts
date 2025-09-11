export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const expected = process.env.ADMIN_RESET_TOKEN || "";
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();

  // 1) Agréger les qty des réservations confirmées
  const snap = await db.collection("reservations").where("status", "==", "confirmed").get();
  const totals: Record<string, number> = {};
  snap.forEach((doc) => {
    const d = doc.data() as any;
    const id = String(d.lodgingId || "");
    const q = Number(d.qty || 0);
    if (!id) return;
    totals[id] = (totals[id] || 0) + (Number.isFinite(q) ? q : 0);
  });

  // 2) Appliquer sur les docs lodgings
  const batch = db.batch();
  const touched: Record<string, number> = {};
  Object.entries(totals).forEach(([lodgingId, reserved]) => {
    const ref = db.collection("lodgings").doc(lodgingId);
    batch.update(ref, { reservedUnits: reserved });
    touched[lodgingId] = reserved;
  });

  // Remettre à 0 les lodgings non présents dans `totals`
  const lods = await db.collection("lodgings").get();
  lods.docs.forEach((d) => {
    if (!(d.id in touched)) batch.update(d.ref, { reservedUnits: 0 });
  });

  await batch.commit();

  return NextResponse.json({ ok: true, computed: { ...touched }, confirmedCount: snap.size });
}
