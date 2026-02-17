// app/api/sign-pdf/route.js
// App Router API handler — POST /api/sign-pdf

import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { writeFile, unlink, readdir, stat } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import crypto from "crypto";

// ── Draft directory setup ────────────────────────────────────────────────────
const DRAFT_DIR = path.join(process.cwd(), ".drafts");
if (!existsSync(DRAFT_DIR)) mkdirSync(DRAFT_DIR, { recursive: true });

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function scheduleDeletion(filePath) {
  setTimeout(async () => {
    try { await unlink(filePath); } catch {}
  }, TTL_MS);
}

async function cleanStaleDrafts() {
  try {
    const files = await readdir(DRAFT_DIR);
    const cutoff = Date.now() - TTL_MS;
    await Promise.all(
      files.map(async (f) => {
        const fp = path.join(DRAFT_DIR, f);
        const { mtimeMs } = await stat(fp);
        if (mtimeMs < cutoff) await unlink(fp).catch(() => {});
      })
    );
  } catch {}
}

// ── Parse page ranges like "1,3,5-7" → 0-indexed array ────────────────────
function parsePages(mode, custom, total) {
  if (mode === "all")  return Array.from({ length: total }, (_, i) => i);
  if (mode === "last") return [total - 1];
  if (mode === "custom") {
    const set = new Set();
    custom.split(",").forEach((part) => {
      const [a, b] = part.trim().split("-").map(Number);
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = a; i <= b; i++) set.add(i - 1);
      } else if (!isNaN(a)) {
        set.add(a - 1);
      }
    });
    return [...set].filter((i) => i >= 0 && i < total);
  }
  return [total - 1];
}

// ── Draw signature at the correct position ──────────────────────────────────
function drawSignature(page, embed, placement, corner, sizePct) {
  const { width: pw, height: ph } = page.getSize();
  const sigW = (sizePct / 100) * pw;
  const sigH = sigW * (embed.height / embed.width);
  const margin = 24;

  if (placement === "keyword") {
    // Center-bottom
    page.drawImage(embed, { x: pw / 2 - sigW / 2, y: margin, width: sigW, height: sigH });
    return;
  }

  if (corner === "bottom-both") {
    page.drawImage(embed, { x: margin, y: margin, width: sigW, height: sigH });
    page.drawImage(embed, { x: pw - margin - sigW, y: margin, width: sigW, height: sigH });
    return;
  }

  const x = corner === "bottom-left" ? margin : pw - margin - sigW;
  page.drawImage(embed, { x, y: margin, width: sigW, height: sigH });
}

// ── Watermark overlay ────────────────────────────────────────────────────────
function addWatermark(page) {
  const { width, height } = page.getSize();
  page.drawText("PREVIEW ONLY", {
    x: width / 2 - 100,
    y: height / 2,
    size: 44,
    color: rgb(0.96, 0.62, 0.04),
    opacity: 0.18,
    rotate: { type: "degrees", angle: -45 },
  });
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(request) {
  await cleanStaleDrafts();

  let pdfTmp, sigTmp;

  try {
    const form = await request.formData();

    const pdfFile = form.get("pdf");
    const sigFile = form.get("sig");

    if (!pdfFile || !sigFile) {
      return NextResponse.json({ error: "Missing pdf or sig file" }, { status: 400 });
    }

    // Save uploads to .drafts
    const uid = crypto.randomUUID();
    pdfTmp = path.join(DRAFT_DIR, `${uid}_input.pdf`);
    sigTmp = path.join(DRAFT_DIR, `${uid}_sig`);

    const pdfBuf = Buffer.from(await pdfFile.arrayBuffer());
    const sigBuf = Buffer.from(await sigFile.arrayBuffer());

    await writeFile(pdfTmp, pdfBuf);
    await writeFile(sigTmp, sigBuf);
    scheduleDeletion(pdfTmp);
    scheduleDeletion(sigTmp);

    // Config
    const placement   = form.get("placement")   || "corners";
    const corner      = form.get("corner")       || "bottom-right";
    const pages       = form.get("pages")        || "last";
    const customPages = form.get("customPages")  || "";
    const sizePct     = Number(form.get("size")) || 20;
    const isPreview   = form.get("preview") === "true";

    // Build PDF
    const pdfDoc   = await PDFDocument.load(pdfBuf);
    const total    = pdfDoc.getPageCount();
    const isPng    = sigBuf[0] === 0x89 && sigBuf[1] === 0x50;
    const embed    = isPng ? await pdfDoc.embedPng(sigBuf) : await pdfDoc.embedJpg(sigBuf);
    const targets  = parsePages(pages, customPages, total);

    for (const idx of targets) {
      const page = pdfDoc.getPage(idx);
      drawSignature(page, embed, placement, corner, sizePct);
      if (isPreview) addWatermark(page);
    }

    const outBytes = await pdfDoc.save();

    // Save output draft
    const outPath = path.join(DRAFT_DIR, `${uid}_output.pdf`);
    await writeFile(outPath, outBytes);
    scheduleDeletion(outPath);

    const prefix = isPreview ? "preview_" : "signed_";
    return new NextResponse(outBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${prefix}document.pdf"`,
        "X-Draft-Expires": new Date(Date.now() + TTL_MS).toISOString(),
      },
    });
  } catch (err) {
    console.error("[sign-pdf]", err);
    return NextResponse.json({ error: "PDF processing failed", detail: err.message }, { status: 500 });
  }
}
