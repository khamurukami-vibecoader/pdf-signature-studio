// app/api/create-order/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { amount } = await request.json(); // amount in INR

    const order = await razorpay.orders.create({
      amount:   amount * 100, // Razorpay expects paise (1 INR = 100 paise)
      currency: "INR",
      receipt:  `receipt_${crypto.randomUUID()}`,
      payment_capture: true,
    });

    // In production: save order.id + "pending" status to your DB here
    // await db.orders.create({ id: order.id, status: "pending", amount });

    return NextResponse.json({
      orderId:   order.id,       // e.g. "order_PjHabc123XYZ"
      amount:    order.amount,
      currency:  order.currency,
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
