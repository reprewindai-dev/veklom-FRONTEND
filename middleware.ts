import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getExecutionIdentity, hasRequiredCapabilities } from './lib/interlink-capi/edge';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // If the request comes from the veklom.dev domain, rewrite the root path to /dev
  if (hostname === 'veklom.dev' || hostname === 'www.veklom.dev') {
    if (url.pathname === '/') {
      url.pathname = '/dev';
      return NextResponse.rewrite(url);
    }
  }

  // Route gpc.veklom.com to /gpc
  if (hostname === 'gpc.veklom.com') {
    if (url.pathname === '/') {
      url.pathname = '/gpc';
      return NextResponse.rewrite(url);
    }
  }

  // interlink-cAPI: Edge Interception for capabilities
  if (url.pathname.startsWith('/terminal') || url.pathname.startsWith('/api/v1/jobs/')) {
    const identity = await getExecutionIdentity(request);
    
    // We determine required capabilities based on the route.
    const requiredCaps = ['openai_api_key']; // Default for these restricted routes
    const { missing } = hasRequiredCapabilities(identity, requiredCaps);

    if (missing.length > 0) {
      // Intercept and redirect to the edge-prompt to fulfill requirements
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
