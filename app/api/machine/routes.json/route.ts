import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
export function GET() {
  return NextResponse.json({
    routes: [
      { path: "/", type: "static", auth_required: false, description: "Landing page" },
      { path: "/demo", type: "static", auth_required: false, description: "Demo hub" },
      { path: "/demo/governed-machine", type: "static", auth_required: false, description: "Governed machine demo" },
      { path: "/proof", type: "static", auth_required: false, description: "Evidence page" },
      { path: "/conformance", type: "static", auth_required: false, description: "Conformance registry" },
      { path: "/machine", type: "static", auth_required: false, description: "Machine surface" },
      { path: "/api/machine/manifest.json", type: "static", auth_required: false, description: "Manifest JSON" }
    ]
  });
}
