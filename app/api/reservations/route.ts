// app/api/reservations/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { PRICE_PER_TIPI_TOTAL, STAY_LABEL } from "@/lib/constants";

// ⚠️ Le front envoie: { lodgingId, quantity, name, email }

export async function POST(req: NextRequest) {
  try {
    const { lodgingId, quantity, name, email } = await req.json();

    // 1) Validations basiques
    if (!lodgingId || !quantity || !name || !email) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ error: "Quantité invalide." }, { status: 400 });
    }

    const db = getAdminDb();
    const lodgingRef = db.collection("lodgings").doc(lodgingId);

    let afterReserved = 0;
    let lodgingData: any = null;

    // 2) Transaction: décrémenter les dispos (schema: totalUnits / reservedUnits)
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lodgingRef);
      if (!snap.exists) throw new Error("Hébergement introuvable.");
      const data = snap.data() as any;
      lodgingData = data;

      const totalUnits: number = data.totalUnits ?? 0;
      const reservedUnits: number = data.reservedUnits ?? 0;
      const remaining = totalUnits - reservedUnits;

      if (qty > remaining) {
        throw new Error(`Plus que ${remaining} disponibilité(s).`);
      }

      afterReserved = reservedUnits + qty;
      tx.update(lodgingRef, { reservedUnits: afterReserved });
    });

    // 3) Prix fixe pour le séjour complet
    const unitPriceCHF = PRICE_PER_TIPI_TOTAL; // 200 CHF
    const totalCHF = unitPriceCHF * qty;

    // 4) Enregistrer la réservation
    const reservationRef = await db.collection("reservations").add({
      lodgingId,
      lodgingName: lodgingData?.name ?? lodgingId,
      qty,
      name,
      email,
      unitPriceCHF,
      totalCHF,
      stayLabel: STAY_LABEL,
      status: "confirmed",
      paymentStatus: "pending",
      createdAt: new Date(),
    });

    // 5) Répondre au front (le modal)
    return NextResponse.json({
      ok: true,
      reservationId: reservationRef.id,
      totalChf: totalCHF,
      reservedUnits: afterReserved,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
