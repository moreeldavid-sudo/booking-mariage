import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // ✅ pour éviter l’erreur “dynamic server usage”

export async function GET(req: NextRequest) {
  try {
    // On récupère le token passé dans l’URL
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 });
    }

    const db = getAdminDb();
    const snap = await db.collection('reservations').where('cancelToken', '==', token).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ ok: false, error: 'Reservation not found' }, { status: 404 });
    }

    const doc = snap.docs[0];
    const data = doc.data() as any;

    // décrémente reservedUnits
    const lodgingRef = db.collection('lodgings').doc(data.lodgingId);
    await db.runTransaction(async (tx) => {
      const lSnap = await tx.get(lodgingRef);
      if (!lSnap.exists) throw new Error('Lodging not found');
      const lData = lSnap.data() as any;
      const reserved = Math.max(0, (lData.reservedUnits ?? 0) - (data.qty ?? 1));
      tx.update(lodgingRef, { reservedUnits: reserved });
      tx.update(doc.ref, { status: 'canceled' });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
