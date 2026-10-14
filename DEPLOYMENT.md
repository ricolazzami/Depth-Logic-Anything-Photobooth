# Deployment Guide — Photobooth ML PWA

## 1. Vercel Deployment

### Prerequisites
- Vercel CLI installed (`npm i -g vercel`) or linked GitHub repository.
- Cloudflare R2 bucket configured with public access enabled.

### Steps
1. Push project to GitHub or deploy directly:
   ```bash
   vercel --prod
   ```
2. Navigate to **Vercel Dashboard → Project Settings → Environment Variables**.
3. Add the following keys:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET_NAME`
   - `CLOUDFLARE_R2_PUBLIC_URL`
4. Redeploy to apply variables:
   ```bash
   vercel redeploy
   ```

---

## 2. iPad Safari Kiosk & Guided Access Setup

### Add to Home Screen (PWA Standalone Mode)
1. Open iPad Safari and navigate to production URL (must be HTTPS).
2. Tap the **Share** button (box with upward arrow).
3. Select **Add to Home Screen**.
4. Set name (e.g., "Photobooth") and tap **Add**.
5. Launch app from home screen icon — verify Safari address bar and navigation controls are absent.

### Enable Guided Access (Kiosk Lockdown)
1. Open **Settings → Accessibility → Guided Access**.
2. Toggle **Guided Access** ON.
3. Tap **Passcode Settings** → set a 4-digit or 6-digit PIN.
4. Open the installed Photobooth PWA.
5. Triple-click top lock button to launch Guided Access.
6. Tap **Options** (bottom left):
   - Disable **Hardware Buttons** (Sleep/Wake, Volume).
   - Disable **Motion**.
   - Keep **Touch** ENABLED.
7. Tap **Start** (top right). App is locked into fullscreen kiosk mode.
8. To exit kiosk mode: triple-click top button, enter PIN, tap **End**.

---

## 3. Camera & WebGL Checklist
- Ensure Safari has camera permission granted (`Settings → Safari → Camera → Allow`).
- Verify WebGL 2.0 is enabled (default on iPadOS 17+).
