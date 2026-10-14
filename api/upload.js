import crypto from 'crypto';

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

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    return res.status(500).json({ error: 'Cloudinary env missing (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)' });
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'photobooth';
    const toSign = `folder=${folder}&timestamp=${timestamp}${secret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const form = new URLSearchParams();
    form.append('file', image);
    form.append('api_key', key);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({ error: 'Upload gagal', details: data?.error?.message || 'cloudinary error' });
    }

    const publicUrl = data.secure_url;
    return res.status(200).json({ success: true, url: publicUrl, publicUrl });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return res.status(500).json({ error: 'Upload gagal', details: err.message });
  }
}

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };
