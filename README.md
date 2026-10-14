# Photobooth ML PWA — iPad Gen 11

A dual-mode, kiosk-ready Progressive Web Application engineered for Apple iPad Gen 11 (A16 Bionic) running Safari in Guided Access mode. Features zero-build deployment, client-side Three.js 3D depth estimation, 1200×3600 photostrip compositing, and direct Cloudflare R2 cloud uploads with instant QR distribution.

---

## Features
- **Mode 1: Classic Photostrip:**
  - 4-shot automated capture with 3-2-1 pop animations and 350ms flash.
  - High-res 1200×3600 2D canvas collage with transparent PNG corner templates.
- **Mode 2: 3D Depth Sculpture:**
  - Single-shot portrait capture.
  - Client-side WebGL / Three.js depth relief mesh generation.
  - Real-time touch OrbitControls and displacement sliders.
- **Backend & Cloud Storage:**
  - Vercel Serverless Function (`/api/upload.js`) with `@aws-sdk/client-s3`.
  - Direct streaming to Cloudflare R2 object storage.
  - Instant client-side QR code generation (`qrcodejs`).
- **Kiosk Optimized:**
  - Designed for iPadOS Safari PWA standalone mode.
  - Minimum 72px touch targets, dark obsidian UI theme.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file based on `.env.example`:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=photobooth-storage
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxxx.r2.dev
```

### 3. Run Locally
```bash
npm run dev
# Or run with vercel dev
vercel dev
```

---

## Documentation Suite
- [PRD.md](PRD.md) — Product requirements and iPad hardware specs.
- [ARCHITECTURE.md](ARCHITECTURE.md) — System flow, 2D/3D engines, file map.
- [DESIGN.md](DESIGN.md) — Google Stitch design tokens and touch layout.
- [API_SPEC.md](API_SPEC.md) — Vercel Serverless API payload contracts.
- [ENVIRONMENT.md](ENVIRONMENT.md) — Cloudflare R2 configuration guide.
- [DEPLOYMENT.md](DEPLOYMENT.md) — Vercel deploy & iPad Guided Access setup.
- [TEST_PLAN.md](TEST_PLAN.md) — Full test cases and QA scenarios.
- [TODO.md](TODO.md) — Implementation roadmap across 5 phases.
