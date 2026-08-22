import { NextRequest, NextResponse } from 'next/server';
import { CAPI_RUNTIME_URL, capiAuthHeaderValue } from '@/lib/capi-runtime';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ query: '' }));
  const q = (body.query || '').toLowerCase();
  const headers = new Headers({ accept: 'application/json' });
  const key = capiAuthHeaderValue();
  if (key) headers.set('x-api-key', key);
  const upstream = await fetch(`${CAPI_RUNTIME_URL.replace(/\/+$/, '')}/protocol/introspect`, {
    method: 'POST', headers, body: JSON.stringify({ query: body.query || '' }), cache: 'no-store',
  });
  if (!upstream.ok) return NextResponse.json({ error: 'cAPI introspection unavailable' }, { status: upstream.status });
  const live = await upstream.json();
  return NextResponse.json({
    ...live,
    query: body.query || '',
    normalized_query: q,
    auth_mode: 'session',
    source: 'capi.veklom.com',
  });
}
