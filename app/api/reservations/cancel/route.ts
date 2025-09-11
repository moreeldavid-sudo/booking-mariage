// app/api/reservations/cancel/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";

  if (!token) {
    return html("Lien d’annulation invalide.");
  }

  const db = getAdminDb();

  // Chercher la réservation par le token
  const snap = await db
    .collection("reservations")
    .where("cancelToken", "==", token)
    .limit(1)
    .get();

  if (snap.empty) {
    return html("Lien d’annulation expiré ou déjà utilisé.");
  }

  const doc = snap.docs[0];
  const data = doc.data() as any;

  if (data.status === "cancelled") {
    return html("Cette réservation est déjà annulée.");
  }

  // Remettre les dispos + marquer annulé
  const lodgingRef = db.collection("lodgings").doc(data.lodgingId);
  await db.runTransaction(async (tx) => {
    const lod = await tx.get(lodgingRef);
    if (lod.exists) {
      const ld = lod.data() as any;
      const reservedUnits: number = ld.reservedUnits ?? 0;
      const qty: number = data.qty ?? 0;
      tx.update(lodgingRef, { reservedUnits: Math.max(0, reservedUnits - qty) });
    }
    tx.update(doc.ref, { status: "cancelled", cancelledAt: new Date() });
  });

  return html("Votre réservation a bien été annulée. Merci de nous avoir prévenus.");
}

function html(message: string) {
  const body = `<!doctype html><meta charset="utf-8" />
  <title>Annulation</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:40px;background:#f6f7fb}
    .card{max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
    h1{font-size:20px;margin:0 0 12px}
    p{margin:0;color:#334155;line-height:1.6}
  </style>
  <div class="card">
    <h1>Annulation de réservation</h1>
    <p>${message}</p>
  </div>`;
  return new NextResponse(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
