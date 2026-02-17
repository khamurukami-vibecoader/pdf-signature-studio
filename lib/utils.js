/**
 * lib/utils.js
 * Shared utilities for PDF Signature Studio
 */

/**
 * Parse a pages config into 0-indexed page numbers.
 * @param {"all"|"last"|"custom"} mode
 * @param {string} custom  - e.g. "1,3,5-7"
 * @param {number} total   - total pages in the PDF
 * @returns {number[]}
 */
export function parsePages(mode, custom, total) {
  if (mode === "all")  return Array.from({ length: total }, (_, i) => i);
  if (mode === "last") return [total - 1];
  if (mode === "custom") {
    const set = new Set();
    custom.split(",").forEach((part) => {
      const trimmed = part.trim();
      const dashIdx = trimmed.indexOf("-");
      if (dashIdx > 0) {
        const a = Number(trimmed.slice(0, dashIdx));
        const b = Number(trimmed.slice(dashIdx + 1));
        if (!isNaN(a) && !isNaN(b)) {
          for (let i = a; i <= b; i++) set.add(i - 1);
        }
      } else {
        const n = Number(trimmed);
        if (!isNaN(n) && n > 0) set.add(n - 1);
      }
    });
    return [...set].filter((i) => i >= 0 && i < total).sort((a, b) => a - b);
  }
  return [total - 1];
}

/**
 * Format bytes into a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

/**
 * Compute UPI deep-link URL.
 * @param {string} upiId
 * @param {number} amount
 * @param {string} [note]
 * @returns {string}
 */
export function buildUpiUrl(upiId, amount, note = "PDF Signature Service") {
  const params = new URLSearchParams({
    pa:  upiId,
    pn:  "SignaturePDF",
    am:  String(amount),
    cu:  "INR",
    tn:  note,
  });
  return `upi://pay?${params}`;
}

/**
 * Schedule a file for deletion after `ms` milliseconds.
 * Server-only helper.
 */
export function scheduleDeletion(filePath, ms = 24 * 60 * 60 * 1000) {
  if (typeof setTimeout === "undefined") return;
  setTimeout(async () => {
    try {
      const { unlink } = await import("fs/promises");
      await unlink(filePath);
    } catch {}
  }, ms);
}
