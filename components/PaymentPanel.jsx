"use client";

import { useEffect, useState } from "react";
import UpiQrCode from "./UpiQrCode";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "merchant@upi";
const PRICE   = Number(process.env.NEXT_PUBLIC_PRICE) || 49;
const SESSION_SECONDS = 300; // 5 minutes

export default function PaymentPanel({ onVerified }) {
  const [txnId,     setTxnId]     = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState("");
  const [countdown, setCountdown] = useState(SESSION_SECONDS);
  const [expired,   setExpired]   = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setExpired(true); clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  const handleVerify = async () => {
    const id = txnId.trim();
    if (!id) { setError("Please enter your UPI transaction ID."); return; }
    setError("");
    setVerifying(true);

    // --- Replace with real backend verification ---
    // const res = await fetch("/api/verify-payment", {
    //   method: "POST",
    //   body: JSON.stringify({ txnId: id }),
    //   headers: { "Content-Type": "application/json" },
    // });
    // const data = await res.json();
    // if (!data.ok) { setError("Payment not found. Try again."); setVerifying(false); return; }

    // Simulated 2-second verification
    await new Promise((r) => setTimeout(r, 2000));
    setVerifying(false);
    onVerified(id);
  };

  return (
    <div className="space-y-6">
      {/* Order summary */}
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <span className="text-slate-400 text-sm font-medium">Session expires in</span>
          <span className={`font-mono text-lg font-bold ${countdown < 60 ? "text-red-400 animate-pulse" : "text-amber-400"}`}>
            {mm}:{ss}
          </span>
        </div>
        {expired && (
          <p className="text-red-400 text-xs mb-3">
            Session expired. <button onClick={() => window.location.reload()} className="underline">Start over</button>
          </p>
        )}
        <div className="space-y-1.5 text-sm border-t border-slate-700 pt-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Service</span>
            <span className="text-slate-300">PDF Signature Overlay</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Processing</span>
            <span className="text-slate-300">Instant · No watermark</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-400">Total</span>
            <span className="text-amber-400 text-lg">₹{PRICE}</span>
          </div>
        </div>
      </div>

      {/* QR code */}
      <UpiQrCode upiId={UPI_ID} amount={PRICE} />

      {/* Transaction ID */}
      <div>
        <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block font-semibold">
          UPI Transaction / Reference ID
        </label>
        <input
          value={txnId}
          onChange={(e) => { setTxnId(e.target.value); setError(""); }}
          placeholder="e.g. 412345678901"
          disabled={expired || verifying}
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3
            text-slate-200 text-sm placeholder-slate-600
            focus:outline-none focus:border-amber-400 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <p className="text-xs text-slate-600 mt-2">
          After payment, copy the UPI reference number from your app receipt
        </p>
      </div>

      <button
        onClick={handleVerify}
        disabled={!txnId.trim() || verifying || expired}
        className="w-full py-4 rounded-2xl font-bold text-slate-900 text-sm tracking-wide
          bg-amber-400 hover:bg-amber-300
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200 flex items-center justify-center gap-2"
      >
        {verifying ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            Verifying…
          </>
        ) : (
          "Verify & Unlock Download →"
        )}
      </button>
    </div>
  );
}
