"use client";

/**
 * UpiQrCode
 * Renders a deterministic QR-like SVG from a UPI deep-link string.
 * In production swap this for a proper QR library (e.g. `qrcode.react`).
 */
export default function UpiQrCode({ upiId, amount }) {
  const upiUrl = `upi://pay?pa=${upiId}&pn=SignaturePDF&am=${amount}&cu=INR&tn=PDF+Signature+Service`;

  // Deterministic pattern seeded by the UPI URL string
  const SIZE = 21;
  const seed = upiUrl.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const isFinderPattern = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= SIZE - 7) || (r >= SIZE - 7 && c < 7);

  const isTimingPattern = (r, c) =>
    (r === 6 && c >= 8 && c < SIZE - 8) || (c === 6 && r >= 8 && r < SIZE - 8);

  const isData = (r, c) =>
    !isFinderPattern(r, c) &&
    !isTimingPattern(r, c) &&
    ((seed * (r * 31 + c * 17 + 7)) % 5 < 2);

  const cells = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (isFinderPattern(r, c) || isTimingPattern(r, c) || isData(r, c))
        cells.push([r, c]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-xl ring-1 ring-slate-200">
        <svg width={SIZE * 8} height={SIZE * 8} viewBox={`0 0 ${SIZE * 8} ${SIZE * 8}`}>
          {cells.map(([r, c]) => (
            <rect key={`${r}-${c}`} x={c * 8} y={r * 8} width={7} height={7} fill="#0f172a" />
          ))}
        </svg>
      </div>
      <div className="text-center">
        <p className="text-amber-400 font-bold text-2xl">₹{amount}</p>
        <p className="text-slate-400 text-xs mt-0.5">{upiId}</p>
        <p className="text-slate-600 text-xs mt-1">Scan with any UPI app · BHIM · GPay · PhonePe</p>
      </div>
    </div>
  );
}
