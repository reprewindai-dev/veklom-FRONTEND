import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const byosApiUrl = process.env.VEKLOM_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8088";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let backendRes;
    try {
      backendRes = await fetch(`${byosApiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.error("Backend fetch error:", fetchErr);
      if (fetchErr.name === 'AbortError') {
         return NextResponse.json({ error: "Backend connection timed out" }, { status: 504 });
      }
      return NextResponse.json({ error: "Could not connect to core backend" }, { status: 502 });
    }
    
    clearTimeout(timeoutId);

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      let errMsg = "Invalid credentials";
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.detail || errJson.error || errMsg;
      } catch (e) {}
      return NextResponse.json({ error: errMsg }, { status: 401 });
    }

    const authData = await backendRes.json();
    const jwt = authData.access_token || authData.token;

    if (!jwt) {
      return NextResponse.json(
        { error: "No JWT returned from backend" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: process.env.VEKLOM_SESSION_COOKIE_NAME || "veklom_session",
      value: jwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
