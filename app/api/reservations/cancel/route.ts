// app/api/reservations/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs'; // important: pour accéder aux ENV côté serveur

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    const adminDb = getAdminDb();

    // On retrouve la réservation via le token d’annulation
    const snap = await adminDb
      .collection('reservations')
      .where('cancelToken', '==', token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 404 });
    }

    const resDoc = snap.docs[0];
    const resData = resDoc.data() as any;

    if (resData.status === 'canceled') {
      return NextResponse.json({ ok: true, message: 'Déjà annulée' });
    }

    const lodgingRef = adminDb.collection('lodgings').doc(resData.lodgingId);

    // Transaction: on décrémente le stock et on marque la résa comme annulée
    await adminDb.runTransaction(async (tx) => {
      const lSnap = await tx.get(lodgingRef);
      if (!lSnap.exists) throw new Error('Hébergement introuvable');

      const lData = lSnap.data() as any;
      const reserved: number = lData.reservedUnits ?? 0;
      const qty: number = resData.qty ?? 0;

      const newReserved = Math.max(0, reserved - qty);

      tx.update(lodgingRef, { reservedUnits: newReserved });
      tx.update(resDoc.ref, { status: 'canceled', canceledAt: new Date() });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('cancel error:', e);
    return NextResponse.json(
      { error: e?.message ?? 'Erreur serveur' },
      { status: 500 }
    );
  }
}
