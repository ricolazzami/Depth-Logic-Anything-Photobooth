import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image } = req.body;
  if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Base64 image data:image/* required' });
  }

  try {
    const buffer = Buffer.from(image.split(',')[1], 'base64');
    const key = `photobooth/${Date.now()}.jpg`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    }));

    return res.status(200).json({ success: true, url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}` });
  } catch (err) {
    console.error('R2 upload error:', err);
    return res.status(500).json({ error: 'Upload gagal', details: err.message });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };
