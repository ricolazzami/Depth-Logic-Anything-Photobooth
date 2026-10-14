# Environment Configuration — Cloudflare R2

## Required Environment Variables
Configure these in your local `.env` file and within the Vercel Project Settings (Environment Variables):

- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account hex identifier.
- `CLOUDFLARE_R2_ACCESS_KEY_ID`: R2 API Access Key ID.
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`: R2 API Secret Access Key.
- `CLOUDFLARE_R2_BUCKET_NAME`: Target R2 bucket name (`photobooth-storage`).
- `CLOUDFLARE_R2_PUBLIC_URL`: Public custom domain or R.dev dev domain (`https://pub-5b2c3ea96c8b4537be5a1e8b0c44275b.r2.dev`).
