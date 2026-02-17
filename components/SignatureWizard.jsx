"use client";

import { useState } from "react";
import StepIndicator  from "./StepIndicator";
import DropZone       from "./DropZone";
import ConfigPanel    from "./ConfigPanel";
import PreviewCanvas  from "./PreviewCanvas";
import PaymentPanel   from "./PaymentPanel";
import DownloadPanel  from "./DownloadPanel";

const DEFAULT_CONFIG = {
  placement:   "keyword",
  keyword:     "{{SIGNATURE}}",
  corner:      "bottom-right",
  pages:       "last",
  customPages: "",
  size:        20,
};

export default function SignatureWizard() {
  const [step,    setStep]    = useState(0);
  const [pdfFile, setPdfFile] = useState(null);
  const [sigFile, setSigFile] = useState(null);
  const [config,  setConfig]  = useState(DEFAULT_CONFIG);
  const [txnId,   setTxnId]   = useState(null);

  // Whether the user can advance from each step
  const canAdvance = [
    pdfFile && sigFile,   // Upload
    true,                 // Configure (always can proceed)
    true,                 // Preview
    !!txnId,              // Payment (needs verification)
  ];

  const steps = [
    {
      title:    "Upload Files",
      subtitle: "Select your PDF document and signature image",
      content: (
        <div className="space-y-4">
          <DropZone
            label="Drop your PDF document here"
            accept=".pdf,application/pdf"
            file={pdfFile}
            onChange={setPdfFile}
            icon="📄"
          />
          <DropZone
            label="Drop your signature image here"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            file={sigFile}
            onChange={setSigFile}
            icon="✍️"
          />
          {pdfFile && sigFile && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-xs animate-fade-slide">
              ✓ Both files ready — proceed to configure signature placement
            </div>
          )}
        </div>
      ),
    },
    {
      title:    "Configure Placement",
      subtitle: "Choose how and where to place your signature",
      content:  <ConfigPanel config={config} onChange={setConfig} />,
    },
    {
      title:    "Preview",
      subtitle: "Watermarked preview · Watermark removed after payment",
      content:  <PreviewCanvas pdfFile={pdfFile} sigFile={sigFile} config={config} />,
    },
    {
      title:    "Complete Payment",
      subtitle: `Scan the QR code and pay ₹${process.env.NEXT_PUBLIC_PRICE || 49} via UPI`,
      content:  (
        <PaymentPanel
          onVerified={(id) => {
            setTxnId(id);
            setStep(4);
          }}
        />
      ),
    },
    {
      title:    "Download",
      subtitle: "Your signed PDF is ready",
      content:  <DownloadPanel pdfFile={pdfFile} sigFile={sigFile} config={config} />,
    },
  ];

  const { title, subtitle, content } = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 640, height: 640, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)",
          top: -220, right: -120,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 520, height: 520, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          bottom: -160, left: -120,
        }}
      />

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 rounded-full px-4 py-1.5 text-amber-400 text-xs font-semibold tracking-widest mb-4">
            ✦ PDF SIGNATURE STUDIO
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            Sign Your Documents
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Keyword detection · Corner placement · UPI payment
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 border border-slate-700/80"
          style={{
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(24px)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.03), 0 32px 64px -16px rgba(0,0,0,0.6)",
          }}
        >
          <StepIndicator current={step} />

          {/* Step heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100">{title}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
          </div>

          {/* Step content */}
          <div style={{ minHeight: 300 }}>{content}</div>

          {/* Navigation — hidden on payment & download steps */}
          {step < 3 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm
                    font-medium hover:border-slate-500 hover:text-slate-300 transition-all"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance[step]}
                className="flex-1 py-3 rounded-xl font-bold text-slate-900 text-sm tracking-wide
                  bg-amber-400 hover:bg-amber-300
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200"
              >
                {step === 2 ? "Proceed to Payment →" : "Continue →"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-6">
          Files encrypted in transit · Auto-deleted after 24 hours · No data retained
        </p>
      </div>
    </div>
  );
}
