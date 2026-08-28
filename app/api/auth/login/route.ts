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

    const byosApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.veklom.com";

    // Call the core backend
    const backendRes = await fetch(`${byosApiUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

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
      name: "veklom.session",
      value: jwt,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error", message: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
