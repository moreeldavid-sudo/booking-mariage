export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * PATCH /api/admin/reservations/:id
 * Body (optionnel) :
 *   - paymentStatus?: "paid" | "pending"
 *   - status?: "confirmed" | "cancelled"
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
      // idempotent : si déjà supprimée / inexistante
      return NextResponse.json({ ok: true, notFound: true });
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
 * Idempotent :
 *  - Si la réservation n'existe pas déjà, on renvoie ok:true (pas d'exception)
 * Effets si elle existe :
 *  - Remet le stock (lodgings.reservedUnits -= qty, min 0)
 *  - Supprime définitivement le document de réservation
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const db = getAdminDb();
    const ref = db.collection("reservations").doc(id);

    // On lit d'abord HORS transaction pour savoir si le doc existe.
    const pre = await ref.get();
    if (!pre.exists) {
      // Idempotent: rien à faire mais succès
      return NextResponse.json({ ok: true, alreadyDeleted: true });
    }

    const data = pre.data() as any;
    const lodgingId: string | undefined = data?.lodgingId;
    const qty: number = Number(data?.qty ?? 0);

    // On ajuste le stock + on supprime la résa en UNE transaction
    await db.runTransaction(async (tx) => {
      // Ajuster le stock si possible (si lodgingId valide)
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

      // Supprimer la réservation (définitif)
      tx.delete(ref);
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/admin/reservations/:id error:", e);
    // On renvoie 200 pour rester idempotent côté UI (évite qu'elle "revienne")
    return NextResponse.json(
      { ok: true, note: e?.message ?? "Erreur masquée (idempotent)" },
      { status: 200 }
    );
  }
}
