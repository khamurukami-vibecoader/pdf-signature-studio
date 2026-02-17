// app/api/sign-pdf/route.js
// App Router API handler — POST /api/sign-pdf
// Uses Vercel Blob for storage (no local filesystem writes)

import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { put } from "@vercel/blob";
import crypto from "crypto";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Parse page ranges like "1,3,5-7" → 0-indexed array ────────────────────
function parsePages(mode, custom, total) {
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
        if (!isNaN(a) && !isNaN(b))
          for (let i = a; i <= b; i++) set.add(i - 1);
      } else {
        const n = Number(trimmed);
        if (!isNaN(n) && n > 0) set.add(n - 1);
      }
    });
    return [...set].filter((i) => i >= 0 && i < total).sort((a, b) => a - b);
  }
  return [total - 1];
}

// ── Draw signature at the correct position ──────────────────────────────────
function drawSignature(page, embed, placement, corner, sizePct) {
  const { width: pw } = page.getSize();
  const sigW   = (sizePct / 100) * pw;
  const sigH   = sigW * (embed.height / embed.width);
  const margin = 24;

  if (placement === "keyword") {
    page.drawImage(embed, { x: pw / 2 - sigW / 2, y: margin, width: sigW, height: sigH });
    return;
  }

  if (corner === "bottom-both") {
    page.drawImage(embed, { x: margin,              y: margin, width: sigW, height: sigH });
    page.drawImage(embed, { x: pw - margin - sigW,  y: margin, width: sigW, height: sigH });
    return;
  }

  const x = corner === "bottom-left" ? margin : pw - margin - sigW;
  page.drawImage(embed, { x, y: margin, width: sigW, height: sigH });
}

// ── Watermark overlay ────────────────────────────────────────────────────────
function addWatermark(page) {
  const { width, height } = page.getSize();
  page.drawText("PREVIEW ONLY", {
    x:       width / 2 - 100,
    y:       height / 2,
    size:    44,
    color:   rgb(0.96, 0.62, 0.04),
    opacity: 0.18,
    rotate:  { type: "degrees", angle: -45 },
  });
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const form = await request.formData();

    const pdfFile = form.get("pdf");
    const sigFile = form.get("sig");

    if (!pdfFile || !sigFile) {
      return NextResponse.json({ error: "Missing pdf or sig file" }, { status: 400 });
    }

    // Read uploads into memory buffers — no disk writes needed
    const pdfBuf = Buffer.from(await pdfFile.arrayBuffer());
    const sigBuf = Buffer.from(await sigFile.arrayBuffer());

    // Config
    const placement   = form.get("placement")   || "corners";
    const corner      = form.get("corner")       || "bottom-right";
    const pages       = form.get("pages")        || "last";
    const customPages = form.get("customPages")  || "";
    const sizePct     = Number(form.get("size")) || 20;
    const isPreview   = form.get("preview") === "true";

    // ── Build signed PDF in memory ──────────────────────────────────────────
    const pdfDoc  = await PDFDocument.load(pdfBuf);
    const total   = pdfDoc.getPageCount();
    const isPng   = sigBuf[0] === 0x89 && sigBuf[1] === 0x50;
    const embed   = isPng
      ? await pdfDoc.embedPng(sigBuf)
      : await pdfDoc.embedJpg(sigBuf);
    const targets = parsePages(pages, customPages, total);

    for (const idx of targets) {
      const page = pdfDoc.getPage(idx);
      drawSignature(page, embed, placement, corner, sizePct);
      if (isPreview) addWatermark(page);
    }

    const outBytes = await pdfDoc.save();

    // ── Upload to Vercel Blob ───────────────────────────────────────────────
    // Files are stored under signed/ or preview/ prefix for easy cleanup.
    // The unique ID prevents collisions between concurrent requests.
    const uid    = crypto.randomUUID();
    const prefix = isPreview ? "preview" : "signed";
    const blob   = await put(
      `${prefix}/${uid}.pdf`,
      outBytes,
      {
        access:      "public",            // user needs a URL to download
        contentType: "application/pdf",
        addRandomSuffix: false,           // uid already guarantees uniqueness
      }
    );

    // Return the blob URL + expiry metadata to the client.
    // DownloadPanel fetches this URL directly for the download.
    const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
    return NextResponse.json({
      url:        blob.url,       // e.g. https://xxxx.public.blob.vercel-storage.com/signed/uuid.pdf
      blobUrl:    blob.url,       // alias kept for clarity
      filename:   `${prefix}_document.pdf`,
      expiresAt,
    });

  } catch (err) {
    console.error("[sign-pdf]", err);
    return NextResponse.json(
      { error: "PDF processing failed", detail: err.message },
      { status: 500 }
    );
  }
}