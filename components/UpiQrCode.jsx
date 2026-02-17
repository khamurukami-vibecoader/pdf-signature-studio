"use client";

import { QRCodeSVG } from "qrcode.react";

export default function UpiQrCode({ upiId, amount }) {
  const upiUrl = `upi://pay?pa=${upiId}&pn=SignaturePDF&am=${amount}&cu=INR&tn=PDF+Signature+Service`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-xl ring-1 ring-slate-200">
        <QRCodeSVG
          value={upiUrl}
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

