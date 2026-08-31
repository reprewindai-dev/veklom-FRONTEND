import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getExecutionIdentity, hasRequiredCapabilities } from './lib/interlink-capi/edge';

/**
 * Application-layer resource security gate.
 *
 * This middleware performs only a navigation/session-presence check. The BYOS
 * backend remains the authentication source of truth and CAPPO remains the
 * hard consequence-authority boundary.
 *
 * Browser login can arrive through either:
 *   - local token login -> `veklom.session` navigation marker
 *   - backend/GitHub OAuth -> HttpOnly `access_token` cookie
 *
 * Both are presence signals only. The backend still validates the actual token,
 * server-side session, workspace binding and account status.
 */

const AUTH_REQUIRED_PREFIXES = [
  '/os',
  '/admin',
  '/api/private',
  '/evidence/private',
  '/internal',
];

const MCP_PREFIXES = ['/mcp/execute'];

const SESSION_COOKIE = 'veklom.session';
const BACKEND_SESSION_COOKIE = 'access_token';

function isNavigation(request: NextRequest): boolean {
  if (request.headers.get('sec-fetch-mode') === 'navigate') return true;
  return (request.headers.get('accept') || '').includes('text/html');
}

function requiresAuth(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some(
    p => pathname === p || pathname.startsWith(p + '/')
  );
}

function isMCPSurface(pathname: string): boolean {
  return MCP_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function hasNavigationSession(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get(BACKEND_SESSION_COOKIE)?.value
  );
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  if (requiresAuth(url.pathname)) {
    if (isNavigation(request)) {
      if (!hasNavigationSession(request)) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', url.pathname + url.search);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      const authHeader = request.headers.get('authorization');
      const cookieToken = request.cookies.get(BACKEND_SESSION_COOKIE)?.value;
      if (!authHeader?.startsWith('Bearer ') && !cookieToken) {
        return NextResponse.json(
          { error: 'authentication_required', path: url.pathname },
          {
            status: 401,
            headers: { 'WWW-Authenticate': 'Bearer' },
          }
        );
      }
    }
  }

  if (isMCPSurface(url.pathname)) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'mcp_auth_required', message: 'MCP surface requires Bearer authentication.' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
      );
    }
    const x402Required = request.headers.get('x-veklom-x402-required');
    if (x402Required === 'true' && !request.headers.get('payment-signature')) {
      return NextResponse.json(
        { error: 'payment_required', schema: 'x402-v2' },
        { status: 402 }
      );
    }
  }

  if (hostname === 'veklom.dev' || hostname === 'www.veklom.dev') {
    if (url.pathname === '/') {
      url.pathname = '/dev';
      return NextResponse.rewrite(url);
    }
  }

  if (hostname === 'gpc.veklom.com') {
    if (url.pathname === '/') {
      url.pathname = '/gpc';
      return NextResponse.rewrite(url);
    }
  }

  if (hostname === 'app.veklom.com' || hostname === 'control.veklom.com') {
    if (url.pathname === '/') {
      url.pathname = '/os';
      return NextResponse.rewrite(url);
    }
  }

  if (url.pathname === '/workspace' || url.pathname === '/overview') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (url.pathname.startsWith('/terminal') || url.pathname.startsWith('/api/v1/jobs/')) {
    const identity = await getExecutionIdentity(request);
    const requiredCaps = ['openai_api_key'];
    const { missing } = hasRequiredCapabilities(identity, requiredCaps);

    if (missing.length > 0) {
      const promptUrl = new URL('/edge-prompt', request.url);
      promptUrl.searchParams.set('missing', missing.join(','));
      promptUrl.searchParams.set('returnTo', url.pathname + url.search);
      return NextResponse.redirect(promptUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
