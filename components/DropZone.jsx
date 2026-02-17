"use client";

import { useCallback, useRef, useState } from "react";

export default function DropZone({ label, accept, file, onChange, icon }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files[0];
      if (f) onChange(f);
    },
    [onChange]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center
        transition-all duration-300 select-none
        ${drag
          ? "border-amber-400 bg-amber-400/10 scale-[1.02]"
          : file
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-slate-600 hover:border-amber-400/60 hover:bg-amber-400/5"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
      <div className="text-4xl mb-3 pointer-events-none">{icon}</div>
      {file ? (
        <>
          <p className="text-emerald-400 font-semibold text-sm truncate">{file.name}</p>
          <p className="text-slate-500 text-xs mt-1">
            {(file.size / 1024).toFixed(1)} KB · Click to replace
          </p>
        </>
      ) : (
        <>
          <p className="text-slate-300 font-semibold text-sm">{label}</p>
          <p className="text-slate-600 text-xs mt-1">Drag & drop or click to browse</p>
        </>
      )}
    </div>
  );
}
