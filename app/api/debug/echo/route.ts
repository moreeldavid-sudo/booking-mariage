import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const keysWeCare = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'NEXT_PUBLIC_BASE_URL',
    'TEST_ENV_PING',
  ];

  const presentKeys = Object.keys(process.env || {});
  const report = Object.fromEntries(
    keysWeCare.map(k => [k, process.env?.[k] ? 'present' : 'MISSING'])
  );

  return NextResponse.json({
    ok: true,
    presentKeyCount: presentKeys.length,
    somePresentKeys: presentKeys.slice(0, 40),
    report,
  });
}
