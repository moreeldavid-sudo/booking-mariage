export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/admin/reservations/:id
 * Body (optionnel) :
 *   - paymentStatus?: "paid" | "pending"
 *   - status?: "confirmed" | "cancelled"
 *
 * Remarque :
 *  - On utilise set(..., { merge: true }) pour éviter "No document to update"
 *  - Si la réservation n'existe pas → 404
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const { paymentStatus, status } = body || {};

    const db = getAdminDb();
    const ref = db.collection("reservations").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "reservation_not_found" }, { status: 404 });
    }

    const payload: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof paymentStatus === "string") payload.paymentStatus = paymentStatus;
    if (typeof status === "string") payload.status = status;

    await ref.set(payload, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PATCH /api/admin/reservations/:id error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Erreur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reservations/:id
 *
 * Effets :
 *  - Remet le stock (lodgings.reservedUnits -= qty, min 0)
 *  - Supprime définitivement le document de réservation
 *  - Si la réservation n'existe pas → 404
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const db = getAdminDb();
    const ref = db.collection("reservations").doc(id);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("reservation_not_found");

      const data = snap.data() as any;
      const lodgingId: string | undefined = data?.lodgingId;
      const qty: number = Number(data?.qty ?? 0);

      // 1) Remettre le stock si on a un lodgingId et une quantité valide
      if (lodgingId && qty > 0) {
        const lodgingRef = db.collection("lodgings").doc(lodgingId);
        const lodgingSnap = await tx.get(lodgingRef);
        if (lodgingSnap.exists) {
          const l = lodgingSnap.data() as any;
          const reservedUnits = Number(l?.reservedUnits ?? 0);
          const newReserved = Math.max(0, reservedUnits - qty);
          tx.update(lodgingRef, { reservedUnits: newReserved });
        }
      }

      // 2) Supprimer la réservation (définitif, elle ne reviendra pas après F5)
      tx.delete(ref);
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/admin/reservations/:id error:", e);
    const code = e?.message === "reservation_not_found" ? 404 : 500;
    return NextResponse.json(
      { error: e?.message ?? "Erreur" },
      { status: code }
    );
  }
}
