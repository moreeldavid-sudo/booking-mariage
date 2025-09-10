// app/api/reservations/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { PRICE_PER_TIPI_TOTAL, STAY_LABEL } from '@/lib/constants';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { lodgingId, quantity, name, email } = await req.json();

    // 1) Validations
    if (!lodgingId || !quantity || !name || !email) {
      return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantité invalide.' }, { status: 400 });
    }

    // 2) Transaction: décrémenter les dispos
    const db = getAdminDb();
    const lodgingRef = db.collection('lodgings').doc(lodgingId);

    let afterReserved = 0;
    let lodgingData: any = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lodgingRef);
      if (!snap.exists) throw new Error('Hébergement introuvable.');
      const data = snap.data() as any;
      lodgingData = data;

      const totalUnits: number = data.totalUnits ?? 0;
      const reserved: number = data.reservedUnits ?? 0;
      const remaining = totalUnits - reserved;
      if (qty > remaining) throw new Error(`Plus que ${remaining} disponibilité(s).`);

      afterReserved = reserved + qty;
      tx.update(lodgingRef, { reservedUnits: afterReserved });
    });

    // 3) Prix fixe pour tout le séjour
    const unitPriceCHF = PRICE_PER_TIPI_TOTAL; // 200 CHF par tipi pour 26–28 juin 2026
    const totalCHF = unitPriceCHF * qty;

    // 4) Enregistrer la réservation
    const reservationRef = await db.collection('reservations').add({
      lodgingId,
      lodgingName: lodgingData?.name ?? lodgingId,
      qty,
      name,
      email,
      unitPriceCHF,
      totalCHF,
      stayLabel: STAY_LABEL,
      status: 'confirmed',
      paymentStatus: 'pending',
      cancelToken: crypto.randomUUID(),
      createdAt: new Date(),
    });

    const reservationId = reservationRef.id;

    // 5) URL QR (si base publique définie)
    const base =
      process.env.SITE_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      '';
    const qrUrl = base
      ? `${base}/api/qr?amount=${totalCHF}&ref=${encodeURIComponent('Resa ' + reservationId)}`
      : '';

    // 6) Réponse pour le front
    return NextResponse.json({
      ok: true,
      reservationId,
      totalChf: totalCHF,
      qrUrl,
      reservedUnits: afterReserved,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
