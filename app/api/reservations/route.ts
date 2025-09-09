// app/api/reservations/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
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
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lodgingRef);
      if (!snap.exists) throw new Error('Hébergement introuvable.');
      const data = snap.data() as any;
      const total: number = data.totalUnits ?? 0;
      const reserved: number = data.reservedUnits ?? 0;
      const remaining = total - reserved;
      if (qty > remaining) throw new Error(`Plus que ${remaining} disponibilité(s).`);
      afterReserved = reserved + qty;
      tx.update(lodgingRef, { reservedUnits: afterReserved });
    });

    // 3) Enregistrer la réservation
    const reservationRef = await db.collection('reservations').add({
      lodgingId,
      qty,
      name,
      email,
      status: 'confirmed',
      cancelToken: crypto.randomUUID(),
      createdAt: new Date(),
    });

    // 4) Lien d’annulation
    const base = process.env.SITE_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '';
    const cancelToken = (await reservationRef.get()).data()!.cancelToken as string;
    const cancelUrl = `${base}/api/reservations/cancel?token=${encodeURIComponent(cancelToken)}`;

    // 5) Phrase lisible & nom convivial
    function humanizeLodging(id: string, q: number) {
      let friendlyName = id;
      let bedsPhrase = '';
      if (id === 'tipis-lit140') {
        friendlyName = 'Tipi lit 140';
        bedsPhrase = '1 lit de 140';
      } else if (id === 'tipis-lits90') {
        friendlyName = 'Tipi 2 lits 90';
        bedsPhrase = '2 lits de 90';
      }
      const tipiWord = q > 1 ? 'tipis' : 'tipi';
      const persons = q * 2;
      const personsWord = persons > 1 ? 'personnes' : 'personne';
      const summaryLine = `${q} ${tipiWord} pour ${persons} ${personsWord} avec ${bedsPhrase}`;
      return { friendlyName, summaryLine };
    }

    // Essayer de lire le "name" de Firestore si présent
    let lodgingName = '';
    try {
      const readSnap = await lodgingRef.get();
      lodgingName = (readSnap.data() as any)?.name || '';
    } catch {/* ignore */}

    const { friendlyName, summaryLine } = humanizeLodging(lodgingId, qty);
    const lodgingDisplay = lodgingName || friendlyName;

    // 6) Envoi emails via EmailJS (mode non-strict, sans Authorization)
    const endpoint = 'https://api.emailjs.com/api/v1.0/email/send';
    const headers = { 'Content-Type': 'application/json' };

    const templateIdClient = process.env.EMAILJS_TEMPLATE_ID;
    const templateIdAdmin = process.env.EMAILJS_TEMPLATE_ID_ADMIN || templateIdClient;

    const common = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
    } as const;

    // Admin
    const payloadAdmin = {
      ...common,
      template_id: templateIdAdmin,
      template_params: {
        to_email: process.env.RESERVATION_ADMIN_EMAIL,
        customer_name: name,
        customer_email: email,
        lodging_id: lodgingId,
        lodging_name: lodgingDisplay,   // ← lisible
        quantity: qty,
        summary_line: summaryLine,      // ← phrase prête : "1 tipi pour 2 personnes..."
        cancel_url: cancelUrl,
      },
    };

    // Client
    const payloadClient = {
      ...common,
      template_id: templateIdClient,
      template_params: {
        to_email: email,
        customer_name: name,
        customer_email: email,
        lodging_id: lodgingId,
        lodging_name: lodgingDisplay,
        quantity: qty,
        summary_line: summaryLine,
        cancel_url: cancelUrl,
      },
    };

    const [r1, r2] = await Promise.all([
      fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payloadAdmin) }),
      fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payloadClient) }),
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
