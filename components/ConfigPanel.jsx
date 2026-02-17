"use client";

export default function ConfigPanel({ config, onChange }) {
  return (
    <div className="space-y-6">
      {/* Placement mode */}
      <div>
        <label className="text-xs uppercase tracking-widest text-slate-500 mb-3 block font-semibold">
          Signature Placement
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "keyword", label: "Keyword Detection", desc: "Find & replace text marker", icon: "🔍" },
            { value: "corners", label: "Bottom Corners",    desc: "Fixed corner placement",     icon: "📐" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...config, placement: opt.value })}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200
                ${config.placement === opt.value
                  ? "border-amber-400 bg-amber-400/10"
                  : "border-slate-700 hover:border-slate-500 bg-slate-800/50"
                }`}
            >
              <div className="text-2xl mb-2">{opt.icon}</div>
              <p className={`text-sm font-semibold ${config.placement === opt.value ? "text-amber-400" : "text-slate-300"}`}>
                {opt.label}
              </p>
              <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Keyword input */}
      {config.placement === "keyword" && (
        <div className="animate-fade-slide">
          <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block font-semibold">
            Keyword to Replace
          </label>
          <input
            value={config.keyword}
            onChange={(e) => onChange({ ...config, keyword: e.target.value })}
            placeholder="e.g. {{SIGNATURE}}"
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3
              text-slate-200 text-sm placeholder-slate-600
              focus:outline-none focus:border-amber-400 transition-colors"
          />
          <p className="text-xs text-slate-600 mt-2">
            The signature image replaces all occurrences of this text in the PDF
          </p>
        </div>
      )}

      {/* Corner selection */}
      {config.placement === "corners" && (
        <div className="animate-fade-slide">
          <label className="text-xs uppercase tracking-widest text-slate-500 mb-3 block font-semibold">
            Corner Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "bottom-left",  label: "Bottom Left"  },
              { value: "bottom-right", label: "Bottom Right" },
              { value: "bottom-both",  label: "Both Corners" },
            ].map((c) => (
              <button
                key={c.value}
                onClick={() => onChange({ ...config, corner: c.value })}
                className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all
                  ${config.corner === c.value
                    ? "border-amber-400 bg-amber-400/10 text-amber-400"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Page selection */}
      <div>
        <label className="text-xs uppercase tracking-widest text-slate-500 mb-3 block font-semibold">
          Page Selection
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "all",    label: "All Pages"  },
            { value: "last",   label: "Last Page"  },
            { value: "custom", label: "Custom"     },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...config, pages: opt.value })}
              className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all
                ${config.pages === opt.value
                  ? "border-amber-400 bg-amber-400/10 text-amber-400"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {config.pages === "custom" && (
          <input
            value={config.customPages}
            onChange={(e) => onChange({ ...config, customPages: e.target.value })}
            placeholder="e.g. 1,3,5-7"
            className="w-full mt-3 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3
              text-slate-200 text-sm placeholder-slate-600
              focus:outline-none focus:border-amber-400 transition-colors"
          />
        )}
      </div>

      {/* Signature size */}
      <div>
        <label className="text-xs uppercase tracking-widest text-slate-500 mb-2 block font-semibold">
          Signature Size — <span className="text-amber-400">{config.size}%</span> of page width
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={config.size}
          onChange={(e) => onChange({ ...config, size: Number(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-700 mt-1">
          <span>5%</span>
          <span>50%</span>
        </div>
      </div>
    </div>
  );
}
