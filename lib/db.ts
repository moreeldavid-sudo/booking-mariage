import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * Ajoute `qty` au champ reservedUnits du doc lodgings/{lodgingDocId}.
 * Vérifie qu'on ne dépasse pas totalUnits.
 */
export async function incrementReserved(lodgingDocId: string, qty: number) {
  const db = getAdminDb();
  const ref = db.collection("lodgings").doc(lodgingDocId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Hébergement introuvable");
    const data = snap.data() as any;
    const total = data.totalUnits ?? 0;
    const reserved = data.reservedUnits ?? 0;

    if (!Number.isInteger(qty) || qty <= 0) throw new Error("Quantité invalide");
    if (reserved + qty > total) throw new Error("Plus assez de disponibilités");

    tx.update(ref, { reservedUnits: reserved + qty });
  });
}

/**
 * Retire `qty` de reservedUnits (sans jamais descendre sous 0).
 */
export async function decrementReserved(lodgingDocId: string, qty: number) {
  const db = getAdminDb();
  const ref = db.collection("lodgings").doc(lodgingDocId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() as any;
    const reserved = data.reservedUnits ?? 0;

    const next = Math.max(0, reserved - (Number.isInteger(qty) ? qty : 0));
    tx.update(ref, { reservedUnits: next });
  });
}
