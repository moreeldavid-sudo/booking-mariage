export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';

const COOKIE_NAME = 'admin_token';

function expectedToken(pin: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(pin).digest('hex');
}

export async function POST(req: Request) {
  const { pin } = await req.json() as { pin?: string };

  const expectedPin = process.env.ADMIN_PIN || '';
  const secret = process.env.ADMIN_SECRET || '';

  if (!expectedPin || !secret) {
    return NextResponse.json({ error: 'ADMIN_PIN/ADMIN_SECRET manquants' }, { status: 500 });
  }
  if (!pin || pin !== expectedPin) {
    return NextResponse.json({ error: 'PIN invalide' }, { status: 401 });
  }

  const token = expectedToken(expectedPin, secret);
  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
