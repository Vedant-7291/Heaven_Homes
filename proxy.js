// proxy.ts  (project root — Next.js 16 renamed middleware → proxy)
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'hh_session';

function base64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

async function verifySessionTokenEdge(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(encoded));
  const expected = base64url(new Uint8Array(sigBuf));

  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(fromBase64url(encoded).toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ---- PUBLIC PATHS ----
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/webhook' ||                  // ← WhatsApp webhook — MUST be public
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // ---- PROTECTED ----
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    console.error('[proxy] AUTH_SECRET missing');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifySessionTokenEdge(token, secret);
  if (!payload) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};