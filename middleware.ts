import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getExecutionIdentity, hasRequiredCapabilities } from './lib/interlink-capi/edge';

/**
 * Application-layer resource security gate.
 *
 * Responsibility split:
 *   Cloudflare (AI Crawl Control + WAF + admission-worker)
 *     = WHO MAY APPROACH THE DOOR
 *     = crawler classification, bot blocking, rate limiting, x402 prerequisite
 *
 *   This middleware (Application layer)
 *     = WHO MAY ENTER
 *     = authentication presence, authority requirements, capability checks
 *
 * This middleware does NOT duplicate Cloudflare bot detection. If a request
 * arrives here, Cloudflare has already made its admission decision. The
 * application enforces resource security regardless of the origin â€” if someone
 * bypasses Cloudflare entirely they still cannot access protected resources.
 *
 * Hard authorization (JWT validation, scope enforcement, LAW 0) is CAPPO's job.
 * This middleware handles soft gates: is an auth token present? Are required
 * capabilities declared? If not, redirect or reject early before reaching
 * the expensive backend round-trip.
 *
 * Navigations and API calls prove session presence differently, because the
 * browser cannot attach an Authorization header to a top-level navigation:
 *
 *   navigation (document request) -> `veklom.session` cookie -> redirect to /login
 *   API / fetch call              -> Authorization: Bearer   -> 401 JSON
 *
 * Requiring a Bearer header on navigation is unsatisfiable: it locks every
 * operator out of the surface while appearing to protect it. Neither check is
 * authorization â€” both are presence checks, and the backend still decides.
 */

// â”€â”€ Resource Security Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
//  /os              â†’ authentication required
//  /admin           â†’ authentication + authority required (enforced by CAPPO)
//  /api/private     â†’ authentication required
//  /mcp             â†’ MCP auth + payment/governance requirements
//  /evidence/privateâ†’ tenant + authority required (enforced by CAPPO)
//  /internal        â†’ authentication required
//
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AUTH_REQUIRED_PREFIXES = [
  '/os',
  '/admin',
  '/api/private',
  '/evidence/private',
  '/internal',
];

const MCP_PREFIXES = ['/mcp/execute'];

const SESSION_COOKIE = 'veklom.session';

/**
 * A top-level document request, as opposed to a fetch/XHR from page code.
 * `sec-fetch-mode: navigate` is set by the browser and cannot be forged by
 * page script, so it is a safe discriminator here.
 */
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

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // â”€â”€ Auth-required surfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // We only check that a session is PRESENT here.
  // Validation and authorization are CAPPO's responsibility.
  if (requiresAuth(url.pathname)) {
    if (isNavigation(request)) {
      if (!request.cookies.get(SESSION_COOKIE)) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', url.pathname + url.search);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
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

  // â”€â”€ MCP surface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isMCPSurface(url.pathname)) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'mcp_auth_required', message: 'MCP surface requires Bearer authentication.' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
      );
    }
    // x402 prerequisite presence check (hard verification in CAPPO/admission worker)
    const x402Required = request.headers.get('x-veklom-x402-required');
    if (x402Required === 'true' && !request.headers.get('payment-signature')) {
      return NextResponse.json(
        { error: 'payment_required', schema: 'x402-v2' },
        { status: 402 }
      );
    }
  }

  // ðŸ”¹ Hostname-based routing ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹ðŸ”¹
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

  // â”€â”€ Legacy route redirects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (url.pathname === '/workspace' || url.pathname === '/overview') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // â”€â”€ interlink-cAPI: Edge capability check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
