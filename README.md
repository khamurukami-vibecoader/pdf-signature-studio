# PDF Signature Studio

Overlay signatures on PDFs with keyword detection or corner placement, watermarked preview, UPI QR payment gate, and 24-hour auto-deletion of drafts.

---

## Project Structure

```
pdf-signature-studio/
├── app/
│   ├── layout.jsx              # Root layout (fonts, metadata)
│   ├── globals.css             # Tailwind + custom CSS
│   ├── page.jsx                # Home page → renders SignatureWizard
│   └── api/
│       └── sign-pdf/
│           └── route.js        # POST /api/sign-pdf (pdf-lib processing)
├── components/
│   ├── SignatureWizard.jsx     # 5-step wizard orchestrator
│   ├── StepIndicator.jsx       # Progress bar
│   ├── DropZone.jsx            # Drag-and-drop file upload
│   ├── ConfigPanel.jsx         # Placement / pages / size config
│   ├── PreviewCanvas.jsx       # Canvas-based watermarked preview
│   ├── UpiQrCode.jsx           # Deterministic UPI QR SVG
│   └── PaymentPanel.jsx        # QR display + transaction ID verify
│   └── DownloadPanel.jsx       # Final download + auto-delete timer
├── lib/
│   └── utils.js                # parsePages, formatBytes, buildUpiUrl
├── .drafts/                    # Uploaded/processed files (auto-deleted, git-ignored)
├── .env.example                # Environment variable template
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local — set your UPI ID and price

# 3. Run dev server
npm run dev
# → http://localhost:3000
```

---

## Features

| Feature | Details |
|---------|---------|
| **PDF Upload** | Drag-and-drop or click-to-browse |
| **Signature Upload** | PNG / JPEG / WebP images |
| **Keyword Detection** | Replace `{{SIGNATURE}}` (or custom text) with the image |
| **Corner Placement** | Bottom-left, bottom-right, or both |
| **Page Selection** | All pages, last page, or custom range (e.g. `1,3,5-7`) |
| **Signature Size** | 5%–50% of page width (slider) |
| **Preview** | Canvas render with diagonal "PREVIEW ONLY" watermark |
| **UPI QR Payment** | QR code + transaction ID verification before download |
| **Auto-Delete** | Uploaded & processed files deleted after 24 hours |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_UPI_ID` | `merchant@upi` | Your UPI ID for the QR code |
| `NEXT_PUBLIC_PRICE` | `49` | Price in INR |
| `PAYMENT_WEBHOOK_SECRET` | — | For real payment gateway integration |
| `DRAFT_TTL_MS` | `86400000` | File TTL in ms (24 hours) |

---

## Production Notes

### Real Payment Verification
Replace the `setTimeout` simulation in `PaymentPanel.jsx` with a real call to `/api/verify-payment` backed by your UPI payment gateway (Razorpay, Cashfree, PayU, etc.).

### Persistent Draft Cleanup
The `scheduleDeletion` + `cleanStaleDrafts` pattern works for single-instance deployments. For multi-instance / serverless (Vercel), add a cron job or use Vercel's `@vercel/cron` to clean `.drafts/` (or use S3 with lifecycle policies).

### Scaling
- Replace local `.drafts/` with S3 + signed URLs for serverless environments.
- Store payment records in a database (Postgres / PlanetScale) instead of in-memory.
