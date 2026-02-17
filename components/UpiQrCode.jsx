"use client";

import { QRCodeSVG } from "qrcode.react";

// value = Razorpay short_url e.g. "https://rzp.io/i/xxxxxxx"
// This is a real Razorpay-hosted payment page — works with all UPI apps
// and triggers the webhook when paid.
export default function UpiQrCode({ value, amount, upiId }) {
  // Fallback to raw upi:// if no shortUrl yet (during loading)
  const qrValue = value || `upi://pay?pa=${upiId}&am=${amount}&cu=INR`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-xl ring-1 ring-slate-200">
        <QRCodeSVG
          value={qrValue}
          size={180}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="M"
        />
      </div>
      <div className="text-center">
        <p className="text-amber-400 font-bold text-2xl">₹{amount}</p>
        <p className="text-slate-400 text-xs mt-0.5">{upiId}</p>
        <p className="text-slate-600 text-xs mt-1">Scan with any UPI app · BHIM · GPay · PhonePe</p>
      </div>
    </div>
  );
}

