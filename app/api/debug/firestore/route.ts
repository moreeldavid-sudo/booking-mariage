import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('lodgings').limit(5).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, count: docs.length, docs });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
