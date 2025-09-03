import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const keys = ['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY','NEXT_PUBLIC_BASE_URL'];
  const out = Object.fromEntries(
    keys.map(k => [k, process.env[k] ? (k === 'FIREBASE_PRIVATE_KEY' ? 'present' : process.env[k]) : 'MISSING'])
  );
  return NextResponse.json({ ok: true, env: out });
}
