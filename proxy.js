// proxy.js (project root — Next.js 16 renamed middleware → proxy)
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'hh_session';

function fromBase64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

async function verifySessionTokenEdge(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    // crypto.subtle.verify is constant-time
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64url(signature),
      enc.encode(encoded)
    );
    if (!valid) return null;

    const payload = JSON.parse(fromBase64url(encoded).toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // ---- PUBLIC APIs (no cookie needed) ----
  const isPublicApi =
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/webhook'; // WhatsApp webhook — Meta posts here, no cookie
  if (isPublicApi) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;
  const payload = secret && token ? await verifySessionTokenEdge(token, secret) : null;

  // ---- LOGIN PAGE: only for logged-out users ----
  if (pathname === '/login') {
    if (payload) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  // ---- Server misconfiguration ----
  if (!secret) {
    console.error('[proxy] AUTH_SECRET missing');
    if (isApi) {
      return NextResponse.json(
        { error: 'Server misconfigured', message: 'AUTH_SECRET missing' },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ---- PROTECTED (everything else, including "/") ----
  if (!payload) {
    if (isApi) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in' },
        { status: 401 }
      );
    }
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files (logo.png etc. must load on the login page)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff2?|txt)$).*)',
  ],
};