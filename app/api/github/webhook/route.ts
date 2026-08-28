import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 503 });
  }

  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  try {
    const rawBody = await req.text(); // Raw text for signature verification
    
    // Verify HMAC SHA-256
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(rawBody).digest("hex");
    
    if (signature.length !== digest.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const deliveryId = req.headers.get("x-github-delivery");
    const eventName = req.headers.get("x-github-event");
    
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Process event (queued for auditing)
    console.log(`[GitHub Webhook] Event: ${eventName}, Delivery: ${deliveryId}, Action: ${payload.action}`);

    // Return 2xx safe receipt
    return NextResponse.json({ success: true, received: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
