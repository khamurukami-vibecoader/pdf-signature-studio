"use client";

import { useEffect, useRef, useState } from "react";

export default function DownloadPanel({ pdfFile, sigFile, config }) {
  const [status,      setStatus]      = useState("idle"); // idle | generating | done | error
  const [errorMsg,    setErrorMsg]    = useState("");
  const [deleteTimer, setDeleteTimer] = useState(24 * 3600);
  const timerRef = useRef();

  // 24-hour countdown
  useEffect(() => {
    timerRef.current = setInterval(
      () => setDeleteTimer((d) => (d > 0 ? d - 1 : 0)),
      1000
    );
    return () => clearInterval(timerRef.current);
  }, []);

  const hh = String(Math.floor(deleteTimer / 3600)).padStart(2, "0");
  const mm = String(Math.floor((deleteTimer % 3600) / 60)).padStart(2, "0");
  const ss = String(deleteTimer % 60).padStart(2, "0");

  const handleDownload = async () => {
    setStatus("generating");
    setErrorMsg("");

    try {
      const body = new FormData();
      body.append("pdf",         pdfFile);
      body.append("sig",         sigFile);
      body.append("placement",   config.placement);
      body.append("corner",      config.corner);
      body.append("pages",       config.pages);
      body.append("customPages", config.customPages);
      body.append("size",        String(config.size));
      body.append("preview",     "false");

      const res = await fetch("/api/sign-pdf", { method: "POST", body });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `signed_${pdfFile.name}`;
      a.click();
      URL.revokeObjectURL(url);

      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6 text-center">
      {/* Success badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto text-4xl">
        ✅
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-100">Payment Verified!</h3>
        <p className="text-slate-500 text-sm mt-1">Your signed PDF is ready to generate & download</p>
      </div>

      {/* Config summary */}
      <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 text-left space-y-2 text-sm">
        {[
          ["PDF",       pdfFile?.name],
          ["Signature", sigFile?.name],
          ["Placement", config.placement === "keyword" ? `Keyword: "${config.keyword}"` : `Corner: ${config.corner}`],
          ["Pages",     config.pages === "custom" ? config.customPages : config.pages],
          ["Size",      `${config.size}% of page width`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-slate-500 shrink-0">{k}</span>
            <span className="text-slate-300 truncate">{v}</span>
          </div>
        ))}
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={status === "generating" || status === "done"}
        className="w-full py-4 rounded-2xl font-bold text-slate-900 text-sm tracking-wide
          bg-emerald-400 hover:bg-emerald-300
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 flex items-center justify-center gap-2"
      >
        {status === "generating" ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            Processing PDF…
          </>
        ) : status === "done" ? (
          "Downloaded ✓"
        ) : (
          "⬇ Download Signed PDF"
        )}
      </button>

      {status === "error" && (
        <p className="text-red-400 text-xs">{errorMsg}</p>
      )}

      {/* Auto-delete notice */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-1">
          ⏳ Auto-Delete Timer
        </p>
        <p className="text-red-300 font-mono text-2xl font-bold tracking-widest">
          {hh}:{mm}:{ss}
        </p>
        <p className="text-slate-600 text-xs mt-2">
          All uploaded files and processed drafts are permanently deleted after 24 hours
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="text-slate-600 text-xs hover:text-slate-400 transition-colors"
      >
        Start a new document →
      </button>
    </div>
  );
}
