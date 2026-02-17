"use client";

const STEPS = ["Upload", "Configure", "Preview", "Payment", "Download"];

export default function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                i < current
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : i === current
                  ? "bg-amber-400 border-amber-400 text-slate-900"
                  : "bg-slate-800 border-slate-600 text-slate-500"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs mt-1 font-medium tracking-wide ${
                i === current
                  ? "text-amber-400"
                  : i < current
                  ? "text-emerald-400"
                  : "text-slate-600"
              }`}
            >
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-10 h-0.5 mb-5 mx-1 transition-all duration-700 ${
                i < current ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
