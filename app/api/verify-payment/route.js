// app/api/verify-payment/route.js
//
// Frontend polls GET /api/verify-payment?orderId=order_PjHabc123XYZ
// Returns { paid: true } once the webhook has confirmed payment.

import { NextResponse } from "next/server";
import { paymentStore } from "../webhook/route"; // import from webhook's in-memory store
// In production, query your DB instead:
// import { prisma } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  // ── Query your DB in production ────────────────────────────────────────
  // const order = await prisma.order.findUnique({ where: { id: orderId } });
  // const paid = order?.status === "paid";

  // In-memory fallback for demo:
  const record = paymentStore.get(orderId);
  const paid   = record?.paid === true;

  return NextResponse.json({ orderId, paid });
}
