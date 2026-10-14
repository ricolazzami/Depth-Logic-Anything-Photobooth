# PRD — Photobooth ML PWA (iPad Gen 11)

## 1. Executive Summary
The Photobooth ML PWA is a dual-mode, offline-first Progressive Web Application designed specifically for the Apple iPad Gen 11 in Safari kiosk mode. It offers two distinct experiences:
1. **Classic Photostrip:** Automated 4-shot sequence with countdowns and flash, composited onto 2D templates with custom corner branding.
2. **3D Depth Sculpture:** Single-shot capture with client-side WebGL depth estimation (Three.js), transforming flat portrait frames into interactive 3D relief meshes with real-time displacement and roughness sliders.

Both modes upload final assets to Cloudflare R2 via a Vercel Serverless Function (`/api/upload.js`) and instantly generate dynamic QR codes for guest downloads.

## 2. Target Hardware & Environment
- **Device:** Apple iPad Gen 11 (A16 Bionic, 11-inch Retina display, 120Hz/60Hz touch).
- **OS:** iPadOS 17+ (Safari standalone PWA mode).
- **Network:** Venue Wi-Fi (offline resilient fallback via long-press save).
- **Peripherals:** Front-facing TrueDepth/FaceTime camera, touch screen.

## 3. Workflow Modes
- **Mode 1 (Classic Photostrip):**
  - Select Template (A/B layout).
  - Preview camera feed (mirrored).
  - Tap Start → 4 captures (3-2-1 countdown + 350ms flash, 1.5s interval).
  - Composite onto 1200×3600 canvas with transparent PNG overlay.
  - Upload & Display QR.
- **Mode 2 (3D Depth Sculpture):**
  - Single-shot capture.
  - WebGL/Three.js fragment shader depth displacement.
  - Interactive controls (Displacement height, Depth scale, Light orbit).
  - Export rendered canvas snapshot / model snapshot → Upload & Display QR.

## 4. Functional Requirements
- **F1 (PWA Shell):** Standalone mode, status-bar-black-translucent, touch-optimized (min 72px targets).
- **F2 (Camera Stream):** `navigator.mediaDevices.getUserMedia` with ideal 1080p resolution and front-facing constraint.
- **F3 (Classic Engine):** Sequential canvas rendering with precise coordinate cropping.
- **F4 (3D Engine):** Three.js scene setup, plane geometry with heightmap displacement, OrbitControls.
- **F5 (Cloud Storage):** Base64 transfer to `/api/upload.js`, streaming multipart/buffer via AWS SDK to Cloudflare R2 bucket.
- **F6 (QR Generator):** Instant client-side rendering via `qrcodejs` CDN.
