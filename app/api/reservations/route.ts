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
    const unitPriceCHF = PRICE_PER_TIPI_TOTAL; // 200 CHF par tipi, séjour complet
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
      paymentStatus: 'pending', // à encaisser
      cancelToken: crypto.randomUUID(),
      createdAt: new Date(),
    });

    const reservationId = reservationRef.id;

    // 5) URLs utiles (annulation + QR)
    const base =
      process.env.SITE_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      '';
    const cancelToken = (await reservationRef.get()).data()!.cancelToken as string;
    const cancelUrl = base ? `${base}/api/reservations/cancel?token=${encodeURIComponent(cancelToken)}` : '';
    const qrUrl = base
      ? `${base}/api/qr?amount=${totalCHF}&ref=${encodeURIComponent('Resa ' + reservationId)}`
      : '';

    // 6) Texte lisible
    const formatCHF = (n: number) =>
      new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(n);

    const totalCHFFormatted = formatCHF(totalCHF);
    const unitCHFFormatted = formatCHF(unitPriceCHF);

    const paymentInstructions = [
      `Montant à payer : ${totalCHFFormatted} (${unitCHFFormatted} / tipi × ${qty})`,
      `Paiement par TWINT au numéro +41 78 902 87 58 (ou en espèces à l'arrivée).`,
      `Référence à indiquer : Resa ${reservationId}`,
    ].join('\n');

    // 7) Emails via EmailJS (mêmes variables + nouvelles : stay_label, qr_url, reservation_id)
    const endpoint = 'https://api.emailjs.com/api/v1.0/email/send';
    const headers = { 'Content-Type': 'application/json' };
    const templateIdClient = process.env.EMAILJS_TEMPLATE_ID;
    const templateIdAdmin = process.env.EMAILJS_TEMPLATE_ID_ADMIN || templateIdClient;
    const common = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
    } as const;

    const templateParams = {
      to_email: '',                  // sera fourni par chaque payload
      customer_name: name,
      customer_email: email,
      lodging_id: lodgingId,
      lodging_name: lodgingData?.name ?? lodgingId,
      quantity: qty,
      unit_price_chf: unitCHFFormatted,
      total_chf: totalCHFFormatted,
      stay_label: STAY_LABEL,        // << nouveau
      payment_instructions: paymentInstructions,
      cancel_url: cancelUrl,
      reservation_id: reservationId, // << nouveau
      qr_url: qrUrl,                 // << nouveau
    };

    // Admin
    const payloadAdmin = {
      ...common,
      template_id: templateIdAdmin,
      template_params: { ...templateParams, to_email: process.env.RESERVATION_ADMIN_EMAIL || '' },
    };

    // Client
    const payloadClient = {
      ...common,
      template_id: templateIdClient,
      template_params: { ...templateParams, to_email: email },
    };

    const [r1, r2] = await Promise.all([
      fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payloadAdmin) }),
      fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payloadClient) }),
    ]);
    if (!r1.ok) console.error('EmailJS admin error:', await r1.text());
    if (!r2.ok) console.error('EmailJS client error:', await r2.text());

    return NextResponse.json({ ok: true, reservationId, totalChf: totalCHF, reservedUnits: afterReserved });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
