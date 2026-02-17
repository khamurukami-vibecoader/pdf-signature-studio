// app/api/cleanup/route.js
//
// Deletes Vercel Blob files older than 24 hours.
//
// Called two ways:
//   1. Automatically — Vercel Cron hits GET /api/cleanup daily at midnight.
//      Vercel injects `Authorization: Bearer <CRON_SECRET>` on every cron call.
//   2. Manually — you can hit the URL yourself with the same header:
//      curl -H "Authorization: Bearer <CRON_SECRET>" https://yourdomain.com/api/cleanup
//
// Required env vars:
//   CRON_SECRET           — any strong random string (openssl rand -hex 32)
//   BLOB_READ_WRITE_TOKEN — auto-added by Vercel when Blob store is connected

import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";

const TTL_MS      = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_LIMIT = 100;                  // Vercel Blob list() max per page

export async function GET(request) {

  // ── Auth ──────────────────────────────────────────────────────────────────
  // Vercel Cron automatically sends: Authorization: Bearer <CRON_SECRET>
  // So this check works for both cron calls and manual curl calls.
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Scan & delete ─────────────────────────────────────────────────────────
  const cutoff  = Date.now() - TTL_MS;
  const errors  = [];
  let deleted   = 0;
  let checked   = 0;
  let cursor;

  try {
    // Paginate through every blob in the store
    do {
      const page = await list({ cursor, limit: BATCH_LIMIT });

      checked += page.blobs.length;

      const stale = page.blobs.filter(
        (b) => new Date(b.uploadedAt).getTime() < cutoff
      );

      if (stale.length > 0) {
        try {
          // del() accepts an array of URLs — batches the deletes in one call
          await del(stale.map((b) => b.url));
          deleted += stale.length;
        } catch (err) {
          // Don't abort the whole run if one batch fails — record and continue
          errors.push(err.message);
          console.error("[cleanup] Batch delete error:", err.message);
        }
      }

      cursor = page.cursor; // undefined when there are no more pages
    } while (cursor);

  } catch (err) {
    // list() itself failed — likely a token/network issue
    console.error("[cleanup] list() error:", err.message);
    return NextResponse.json(
      { error: "Failed to list blobs", detail: err.message },
      { status: 500 }
    );
  }

  const result = {
    deleted,
    checked,
    errors:  errors.length > 0 ? errors : undefined,
    cutoff:  new Date(cutoff).toISOString(),
    ranAt:   new Date().toISOString(),
  };

  console.log("[cleanup]", result);
  return NextResponse.json(result);
}