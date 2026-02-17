"use client";

import { useEffect, useRef, useState } from "react";

export default function PreviewCanvas({ pdfFile, sigFile, config }) {
  const canvasRef = useRef();
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error

  useEffect(() => {
    if (!pdfFile || !sigFile) return;
    setStatus("loading");

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const sigUrl = URL.createObjectURL(sigFile);
    const sigImg = new Image();

    sigImg.onload = () => {
      const W = 595, H = 842;
      canvas.width = W;
      canvas.height = H;

      // Page background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // Simulated PDF content lines
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(60, 56, 220, 16);      // title
      ctx.fillRect(60, 88, 460, 10);
      for (let i = 0; i < 18; i++) {
        const lineW = 120 + Math.sin(i * 1.7) * 200 + 180;
        ctx.fillRect(60, 116 + i * 32, lineW, 8);
      }
      ctx.fillRect(60, 700, 320, 8);
      ctx.fillRect(60, 720, 200, 8);

      // Signature placement
      const sigW = (config.size / 100) * W;
      const sigH = sigW * (sigImg.height / sigImg.width);
      const margin = 30;

      const drawAt = (x, y) => ctx.drawImage(sigImg, x, y, sigW, sigH);

      if (config.placement === "keyword") {
        drawAt(W / 2 - sigW / 2, margin);
      } else if (config.corner === "bottom-both") {
        drawAt(margin, H - margin - sigH);
        drawAt(W - margin - sigW, H - margin - sigH);
      } else if (config.corner === "bottom-left") {
        drawAt(margin, H - margin - sigH);
      } else {
        drawAt(W - margin - sigW, H - margin - sigH);
      }

      // Watermark
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.font = "bold 58px Georgia, serif";
      ctx.fillStyle = "#f59e0b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PREVIEW", 0, 0);
      ctx.restore();

      // Page border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, W, H);

      URL.revokeObjectURL(sigUrl);
      setStatus("ready");
    };

    sigImg.onerror = () => {
      setStatus("error");
      URL.revokeObjectURL(sigUrl);
    };

    sigImg.src = sigUrl;
  }, [pdfFile, sigFile, config]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-white"
        style={{ maxWidth: 340, width: "100%" }}
      >
        {status === "loading" && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center z-10 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Rendering preview…
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} />
      </div>

      {status === "ready" && (
        <p className="text-xs text-slate-600 text-center">
          ⚠️ Watermark is removed after successful payment
        </p>
      )}

      {status === "error" && (
        <p className="text-xs text-red-400 text-center">
          Could not load signature image. Check the file format.
        </p>
      )}
    </div>
  );
}
