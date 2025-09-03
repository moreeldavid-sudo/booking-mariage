// app/api/reservations/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import crypto from 'crypto';


export async function POST(req: NextRequest) {
  try {
    const { lodgingId, quantity, name, email } = await req.json();

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

    const adminDb = getAdminDb();
    const docRef = adminDb.collection('lodgings').doc(lodgingId);

    let afterReserved = 0;
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) throw new Error('Hébergement introuvable.');
      const data = snap.data() as any;
      const total: number = data.totalUnits ?? 0;
      const reserved: number = data.reservedUnits ?? 0;
      const remaining = total - reserved;
      if (qty > remaining) throw new Error(`Plus que ${remaining} disponibilité(s).`);
      afterReserved = reserved + qty;
      tx.update(docRef, { reservedUnits: afterReserved });
    });

    // Log de la réservation + token d’annulation
    const reservationRef = await adminDb.collection('reservations').add({
      lodgingId,
      qty,
      name,
      email,
      status: 'confirmed',
      cancelToken: crypto.randomUUID(),
      createdAt: new Date(),
    });

    const base = process.env.NEXT_PUBLIC_BASE_URL || '';
    const cancelUrl = `${base}/api/reservations/cancel?token=${encodeURIComponent(
      (await reservationRef.get()).data()!.cancelToken
    )}`;

    // --- Emails via EmailJS (admin + client) ---
    const endpoint = 'https://api.emailjs.com/api/v1.0/email/send';
    const common = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
    } as const;

    // Admin
    const payloadAdmin = {
      ...common,
      template_params: {
        to_email: process.env.RESERVATION_ADMIN_EMAIL,
        customer_name: name,
        customer_email: email,
        lodging_id: lodgingId,
        quantity: qty,
        cancel_url: cancelUrl,
      },
    };

    // Client
    const payloadClient = {
      ...common,
      template_params: {
        to_email: email,
        customer_name: name,
        customer_email: email,
        lodging_id: lodgingId,
        quantity: qty,
        cancel_url: cancelUrl,
      },
    };

    const [r1, r2] = await Promise.all([
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadAdmin),
      }),
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadClient),
      }),
    ]);

    if (!r1.ok) console.error('EmailJS admin error:', await r1.text());
    if (!r2.ok) console.error('EmailJS client error:', await r2.text());

    return NextResponse.json({ ok: true, reservedUnits: afterReserved });
  } catch (e: any) {
    console.error(e);
    const msg = e?.message ?? 'Erreur serveur';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
