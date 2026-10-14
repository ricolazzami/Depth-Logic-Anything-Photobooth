# Test Plan — Photobooth ML PWA

## 1. Overview
Validation suite covering camera streaming, 2D composite accuracy, 3D WebGL depth rendering performance, R2 upload pipelines, and iPad touch UX.

---

## 2. Test Cases

### TC-01: PWA Shell & Standalone Display
- **Target:** iPad Safari & PWA standalone.
- **Action:** Add to Home Screen, launch app.
- **Expected:** Fullscreen launch, no browser chrome/address bar, `#0a0a0f` status bar color.

### TC-02: Camera Feed & Mirroring
- **Target:** Camera stream module (`app.js`).
- **Action:** Request front camera (`facingMode: 'user'`).
- **Expected:** 1080p stream starts within 1.5s, video mirror matches real-world mirror orientation (`scaleX(-1)`), permission error handled gracefully if denied.

### TC-03: Mode 1 — 4-Shot Sequence & Canvas Compositing
- **Target:** Sequential capture & 1200×3600 compositor.
- **Action:** Select Template A, tap "Start Capture".
- **Expected:**
  - 4 consecutive shots with 3-2-1 pop animation and 350ms white flash.
  - Correct 1.5s interval between frames.
  - Final image assembled at exact 1200×3600 resolution with template overlay.
  - Center-crop matches slot dimensions without distortion.

### TC-04: Mode 2 — 3D Depth Sculpture & Shader Performance
- **Target:** Three.js depth engine (`depth3d.js`).
- **Action:** Select Mode 2, capture single shot, interact with sliders.
- **Expected:**
  - Depth estimation runs client-side under 500ms on iPad A16.
  - 3D relief mesh renders at stable 60fps.
  - Sliders for Displacement and Extrusion update mesh geometry in real-time.
  - Touch OrbitControls rotate and pan smoothly.
  - Snapshot export generates clear 2D rendered capture.

### TC-05: Cloudflare R2 Upload & Payload Integrity
- **Target:** `/api/upload.js`.
- **Action:** Post Base64 JPEG buffer to endpoint.
- **Expected:**
  - Response 200 OK with public URL.
  - Image uploaded to `photobooth/{timestamp}.jpg` in R2 bucket.
  - Payload limits up to 12MB accepted.

### TC-06: QR Code Generation & Guest Download
- **Target:** QR display module.
- **Action:** Receive upload URL on result screen.
- **Expected:**
  - QR renders immediately (<200ms).
  - Scanning QR on external phone opens/downloads public image directly from R2 URL.
  - "Start Over" button resets camera and state without full page refresh.

### TC-07: Error Handling & Offline Fallback
- **Target:** Network failure scenario.
- **Action:** Trigger upload with network disconnected.
- **Expected:** Error message displayed, photo strip remains visible, guest instructed to long-press to save locally.
