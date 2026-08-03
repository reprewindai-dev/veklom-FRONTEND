import { NextResponse } from 'next/server';

const MANIFEST = {
  service: 'veklom-governance-portal',
  repo: 'reprewindai-dev/veklom-FRONTEND',
  role: 'user-shell',
  version: '2026.07',
  base_url: 'https://governance.veklom.com',
  health: '/api/health',
  dependencies: '/api/health/dependencies',
  auth_mode: 'session',
  status: 'ok',
  capabilities: ['governance-ui', 'interlink-shell', 'operator-controls'],
  links: {
    core: 'https://api.veklom.com/protocol.json',
    cappo: 'https://capi.veklom.com/protocol.json',
    pgl: 'https://pgl.veklom.com/protocol.json',
  },
};

export async function GET() {
  return NextResponse.json(MANIFEST);
}
