import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_token';

// Définir quelles routes sont "admin"
function isAdminArea(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

// Fonction pour générer la signature (Edge compatible)
async function hmacSHA256(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isAdminArea(pathname)) return NextResponse.next();

  // autoriser /admin/login sans cookie
  if (pathname.startsWith('/admin/login')) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value || '';
  const pin = process.env.ADMIN_PIN || '';
  const secret = process.env.ADMIN_SECRET || '';
  const expected = (pin && secret) ? await hmacSHA256(secret, pin) : '';

  const ok = !!token && !!expected && token === expected;
  if (ok) return NextResponse.next();

  // /admin → redirige vers login
  if (pathname.startsWith('/admin')) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // /api/admin → bloque
  return new NextResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
}

// Appliquer uniquement sur /admin et /api/admin
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
