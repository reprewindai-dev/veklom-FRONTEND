import { NextRequest, NextResponse } from 'next/server';

const CAPABILITIES = ['governance-ui', 'interlink-shell', 'operator-controls'];

const LINKS = {
  core: 'https://api.veklom.com/protocol.json',
  cappo: 'https://capi.veklom.com/protocol.json',
  pgl: 'https://pgl.veklom.com/protocol.json',
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ query: '' }));
  const q = (body.query || '').toLowerCase();
  const matches = CAPABILITIES.filter(
    (c) => q === '*' || c.includes(q)
  );
  return NextResponse.json({
    query: body.query || '',
    matches,
    total: matches.length,
    auth_mode: 'session',
    links: LINKS,
  });
}
