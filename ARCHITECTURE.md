# Architecture — Photobooth ML PWA

## 1. System Architecture
```
[iPad Safari PWA]
  │
  ├─► Mode 1: 2D Canvas Engine (1200×3600 Compositor)
  ├─► Mode 2: Three.js WebGL Engine (Depth Plane Shader + OrbitControls)
  │
  ▼
POST /api/upload { image: "data:image/jpeg;base64,..." }
  │
  ▼
[Vercel Serverless Function: api/upload.js]
  │
  ▼ (S3 Client PutObject)
[Cloudflare R2 Bucket]
  │
  ▼
Public URL -> [Client QR Generator]
```

## 2. Directory Structure
```
Photobooth_ML/
├── api/
│   └── upload.js          # Serverless handler for Cloudflare R2
├── .env                   # Environment credentials
├── .env.example           # Shared environment key template
├── index.html             # Single-page app layout with Google Stitch design token structure
├── styles.css             # Stitch design tokens + responsive iPad layout
├── app.js                 # App routing, state management, camera controller
├── depth3d.js             # Three.js 3D Depth Sculpture renderer
├── manifest.json          # PWA metadata
├── vercel.json            # Deployment routing
├── package.json           # Dependencies (@aws-sdk/client-s3)
└── *.md                   # Documentation suite
```

## 3. Data & Render Flow
- **2D Canvas Compositor:** Draws 4 sequential video frames into 1200×3600 canvas buffer with aspect ratio center-cropping, then layers high-resolution PNG template overlay.
- **3D Depth Engine:** Takes 1 video snapshot, generates gray-scale brightness map for displacement, updates Three.js `MeshStandardMaterial` plane geometry parameters.
- **Upload Flow:** Exports canvas to JPEG data URL (`quality: 0.92`), posts payload to `/api/upload.js`, receives signed/public R2 HTTPS URL, renders QR code via `qrcode.js`.
