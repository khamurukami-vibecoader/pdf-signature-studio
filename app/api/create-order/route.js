// app/api/create-order/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function POST(request) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("[create-order] Missing Razorpay env vars");
    return NextResponse.json(
      { error: "Payment service not configured. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
      { status: 500 }
    );
  }

  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const { amount } = await request.json();

    // ── Create a Payment Link (not just an order) ──────────────────────────
    // Payment Links give you a short_url you can encode into the QR code.
    // When the customer pays via that URL, Razorpay fires the webhook with
    // the correct order/payment IDs — so your webhook can verify it properly.
    const paymentLink = await razorpay.paymentLink.create({
      amount:      amount * 100,  // paise
      currency:    "INR",
      accept_partial: false,
      description: "PDF Signature Service",
      upi_link:    true,          // generates a UPI-specific link & QR
      reference_id: `ref_${crypto.randomUUID().replace(/-/g, "").slice(0, 30)}`,
      notify: {
        sms:   false,
        email: false,
      },
      reminder_enable: false,
      callback_url:    process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`
        : undefined,
      callback_method: "get",
    });

    // short_url looks like: https://rzp.io/i/xxxxxxx
    // Encode THIS into the QR code — it's a real Razorpay-hosted payment page
    // that works with PhonePe, GPay, Paytm etc. and triggers your webhook.
    return NextResponse.json({
      orderId:  paymentLink.id,       // e.g. "plink_xxxxxxxx"
      shortUrl: paymentLink.short_url, // encode this into QR
      amount:   paymentLink.amount,
      currency: paymentLink.currency,
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json(
      { error: "Failed to create payment link", detail: err.message },
      { status: 500 }
    );
  }
}