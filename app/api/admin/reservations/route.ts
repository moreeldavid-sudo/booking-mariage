export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('reservations')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const items = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        lodgingId: data.lodgingId ?? null,
        lodgingName: data.lodgingName ?? null,
        qty: data.qty ?? 0,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        name: data.name ?? '',
        email: data.email ?? '',
        unitPriceCHF: data.unitPriceCHF ?? 0,
        totalCHF: data.totalCHF ?? 0,
        stayLabel: data.stayLabel ?? '',
        status: data.status ?? 'confirmed',
        paymentStatus: data.paymentStatus ?? 'pending',
        twintReference: data.twintReference ?? null,
        createdAt: (data.createdAt?.toMillis?.() ?? data.createdAt) || 0,
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('GET /api/admin/reservations error:', e);
    return NextResponse.json({ error: e.message ?? 'Erreur' }, { status: 500 });
  }
}
