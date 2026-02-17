// app/api/webhook/route.js
//
// Razorpay calls this URL automatically when a payment succeeds/fails.
// Set this URL in your Razorpay Dashboard → Webhooks → Add New Webhook:
//   https://yourdomain.com/api/webhook
//
// PAYMENT_WEBHOOK_SECRET is the "Webhook Secret" you set in that same form.

import { NextResponse } from "next/server";
import crypto from "crypto";

// ─── Simple in-memory store (replace with a real DB) ──────────────────────
// Maps orderId → { paid: boolean, paidAt: string }
// In production use: PostgreSQL, PlanetScale, Upstash Redis, etc.
const paymentStore = new Map();
export { paymentStore }; // exported so verify-payment route can read it


// ─── Verify Razorpay's HMAC-SHA256 signature ──────────────────────────────
//
// Razorpay signs every webhook body with your PAYMENT_WEBHOOK_SECRET.
// If the signature doesn't match, the request is NOT from Razorpay — reject it.
//
function verifyWebhookSignature(rawBody, razorpaySignature) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!secret) throw new Error("PAYMENT_WEBHOOK_SECRET is not set");

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)           // rawBody MUST be the exact bytes Razorpay sent
    .digest("hex");

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(razorpaySignature)
  );
}


// ─── Route handler ─────────────────────────────────────────────────────────
export async function POST(request) {
  let rawBody;

  try {
    rawBody = await request.text(); // read as raw string — do NOT parse yet
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  const razorpaySignature = request.headers.get("x-razorpay-signature");

  if (!razorpaySignature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
  }

  // ── 1. Verify the signature ──────────────────────────────────────────────
  let isValid;
  try {
    isValid = verifyWebhookSignature(rawBody, razorpaySignature);
  } catch (err) {
    console.error("[webhook] Signature verification error:", err.message);
    return NextResponse.json({ error: "Signature error" }, { status: 500 });
  }

  if (!isValid) {
    console.warn("[webhook] INVALID SIGNATURE — possible spoofed request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 2. Parse and handle the event ───────────────────────────────────────
  const event = JSON.parse(rawBody);

  console.log("[webhook] Event received:", event.event);

  switch (event.event) {

    case "payment_link.paid": {
      // Fired when a Payment Link is fully paid
      const paymentLink = event.payload.payment_link.entity;
      const orderId     = paymentLink.id; // e.g. "plink_xxxxxxxx"
      console.log(`[webhook] Payment link paid: ${orderId} ₹${paymentLink.amount / 100}`);
      paymentStore.set(orderId, {
        paid:      true,
        paidAt:    new Date().toISOString(),
        amount:    paymentLink.amount / 100,
      });
      break;
    }

    case "payment.captured": {
      // Also handle direct order payments as fallback
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      console.log(`[webhook] Payment captured: orderId=${orderId} ₹${payment.amount / 100}`);
      paymentStore.set(orderId, {
        paid:      true,
        paidAt:    new Date().toISOString(),
        paymentId: payment.id,
        amount:    payment.amount / 100,
      });
      break;
    }

    case "payment.failed": {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      console.warn(`[webhook] Payment failed: orderId=${orderId} reason=${payment.error_description}`);

      // Optionally mark as failed in DB:
      // await prisma.order.update({ where: { id: orderId }, data: { status: "failed" } });

      paymentStore.set(orderId, { paid: false, failedAt: new Date().toISOString() });

      break;
    }

    default:
      console.log("[webhook] Unhandled event type:", event.event);
  }

  // Razorpay expects a 200 OK — if you return anything else it retries
  return NextResponse.json({ received: true }, { status: 200 });
}
