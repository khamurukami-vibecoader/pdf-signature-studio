"use client";

// Real implementation: creates Razorpay order on mount, polls for confirmation.

import { useEffect, useRef, useState } from "react";
import UpiQrCode from "./UpiQrCode";

const UPI_ID          = process.env.NEXT_PUBLIC_UPI_ID || "merchant@upi";
const PRICE           = Number(process.env.NEXT_PUBLIC_PRICE) || 49;
const POLL_INTERVAL   = 3000;
const SESSION_SECONDS = 300;

export default function PaymentPanel({ onVerified }) {
  const [orderId,    setOrderId]    = useState(null);
  const [shortUrl,   setShortUrl]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [countdown,  setCountdown]  = useState(SESSION_SECONDS);
  const [expired,    setExpired]    = useState(false);
  const [pollStatus, setPollStatus] = useState("waiting");

  const pollRef  = useRef();
  const timerRef = useRef();

  // 1. Create Razorpay order on mount
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/create-order", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ amount: PRICE }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Order creation failed");
        setOrderId(data.orderId);
        setShortUrl(data.shortUrl);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setExpired(true);
          clearInterval(timerRef.current);
          clearInterval(pollRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // 3. Poll for payment confirmation
  useEffect(() => {
    if (!orderId || expired) return;
    pollRef.current = setInterval(async () => {
      try {
        setPollStatus("verifying");
        const res  = await fetch(`/api/verify-payment?orderId=${orderId}`);
        const data = await res.json();
        if (data.paid) {
          setPollStatus("paid");
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          onVerified(orderId);
        } else {
          setPollStatus("waiting");
        }
      } catch {
        setPollStatus("waiting");
      }
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [orderId, expired, onVerified]);

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  if (loading) return (
    <div className="flex flex-col items-center gap-4 py-12">
      <span className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Creating secure payment session…</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-400 text-sm mb-4">{error}</p>
      <button onClick={() => window.location.reload()} className="text-amber-400 text-sm underline">Try again</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <span className="text-slate-400 text-sm font-medium">QR expires in</span>
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
            <span className="text-slate-500">Order ID</span>
            <span className="text-slate-400 font-mono text-xs truncate ml-4">{orderId}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-400">Total</span>
            <span className="text-amber-400 text-lg">₹{PRICE}</span>
          </div>
        </div>
      </div>

      <UpiQrCode value={shortUrl} upiId={UPI_ID} amount={PRICE} />

      <div className="flex items-center justify-center gap-2 text-sm">
        {pollStatus === "waiting" && (
          <><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /><span className="text-slate-500">Waiting for payment…</span></>
        )}
        {pollStatus === "verifying" && (
          <><span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" /><span className="text-slate-500">Checking…</span></>
        )}
        {pollStatus === "paid" && (
          <><span className="text-emerald-400">✓</span><span className="text-emerald-400 font-semibold">Payment confirmed! Redirecting…</span></>
        )}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Payment detected automatically · No transaction ID needed
      </p>
    </div>
  );
}
