// app/api/create-order/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function POST(request) {
  // Guard — fail fast with a clear message if env vars are missing
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("[create-order] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
    return NextResponse.json(
      { error: "Payment service not configured. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel env vars." },
      { status: 500 }
    );
  }

  // Instantiate inside the handler so env vars are always resolved at request time
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const { amount } = await request.json();

    const order = await razorpay.orders.create({
      amount:          amount * 100, // paise
      currency:        "INR",
      receipt:         `r_${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`,
      payment_capture: true,
    });

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create order", detail: err.message }, { status: 500 });
  }
}