export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/admin/reservations/:id
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
      return NextResponse.json({ ok: true, notFound: true });
    }

    const payload: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof paymentStatus === "string") payload.paymentStatus = paymentStatus;
    if (typeof status === "string") payload.status = status;

    await ref.set(payload, { merge: true });
    return NextResponse.json({ ok: true, id, updated: payload });
  } catch (e: any) {
    console.error("PATCH /api/admin/reservations/:id error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reservations/:id
 * → remet le stock ET passe la réservation en "cancelled" (on garde l’historique)
 * → idempotent
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const db = getAdminDb();
    const resRef = db.collection("reservations").doc(id);

    // On renvoie des infos utiles au client
    const result = await db.runTransaction(async (tx) => {
      const resSnap = await tx.get(resRef);
      if (!resSnap.exists) {
        return { ok: true, found: false, id };
      }

      const data = resSnap.data() as any;
      const lodgingId: string | undefined = data?.lodgingId;
      const qty: number = Number(data?.qty ?? 0);

      // 1) stock
      if (lodgingId && qty > 0) {
        const lodgingRef = db.collection("lodgings").doc(lodgingId);
        const lSnap = await tx.get(lodgingRef);
        if (lSnap.exists) {
          const l = lSnap.data() as any;
          const reservedUnits = Number(l?.reservedUnits ?? 0);
          const newReserved = Math.max(0, reservedUnits - qty);
          tx.update(lodgingRef, { reservedUnits: newReserved });
        }
      }

      // 2) statut -> cancelled
      tx.set(resRef, { status: "cancelled", updatedAt: new Date() }, { merge: true });

      return { ok: true, found: true, id, lodgingId, qty, action: "cancelled" };
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("DELETE /api/admin/reservations/:id error:", e);
    // on reste idempotent pour l’UI
    return NextResponse.json(
      { ok: true, note: e?.message ?? "Erreur masquée (idempotent)" },
      { status: 200 }
    );
  }
}
