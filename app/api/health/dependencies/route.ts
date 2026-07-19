import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'degraded',
    reason:
      'Dependency health route present but real dependency checks (API reachability, auth service) are not wired yet.',
    dependencies: {},
  });
}
