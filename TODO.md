# Implementation Checklist — Photobooth ML PWA

## Phase 1: Core Foundation & UI Alignment
- [x] 1.1 Ingest Google Stitch UI tokens into `styles.css` (dark obsidian palette, touch targets ≥72px, modal components).
- [x] 1.2 Scaffold Mode Selector (Mode 1: Classic Photostrip vs Mode 2: 3D Depth Sculpture) in `index.html`.
- [x] 1.3 Verify PWA manifest, standalone viewport flags, and iOS splash meta tags.

## Phase 2: Mode 1 — Classic Photostrip Engine
- [x] 2.1 Refactor camera manager in `app.js` with robust error states and resolution fallbacks.
- [x] 2.2 Wire 4-shot automated countdown (3-2-1) + CSS flash animations with configurable timing.
- [x] 2.3 Optimize 1200×3600 2D canvas compositor with center-crop math and template overlay support.

## Phase 3: Mode 2 — 3D Depth Sculpture (ML Depth Anything + Three.js / WebGL)
- [x] 3.1 Integrate Three.js via lightweight ESM/CDN bundle.
- [x] 3.2 Build client-side ML depth estimation (`@xenova/transformers` + `Xenova/depth-anything-small-hf`, fallback luma).
- [x] 3.3 Create interactive 3D relief mesh viewer with touch OrbitControls (drag orbit + displacementMap).
- [x] 3.4 Wire real-time UI sliders (Displacement Height, Wireframe toggle, Light orbit).
- [x] 3.5 Implement 3D canvas snapshot capture for export pipeline.

## Phase 4: Backend API & Storage Verification
- [x] 4.1 Validate `/api/upload.js` with AWS SDK S3 client for Cloudflare R2 uploads.
- [x] 4.2 Confirm dynamic key generation (`photobooth/{timestamp}.jpg`) and public URL assembly.
- [x] 4.3 Add request validation, error reporting, and size limit enforcement (12MB).

## Phase 5: QR Code, Polish & Guided Access QA
- [x] 5.1 Connect upload output to `qrcodejs` with instant rendering and direct download links.
- [x] 5.2 Implement state reset flow ("Start Over") preserving active camera streams.
- [x] 5.3 Conduct end-to-end testing on iPad Safari in Guided Access kiosk mode.
