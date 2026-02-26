import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Stub: photo-based body/proportion analysis. Returns low_confidence until resolution/clipping checks exist. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // TODO: validate image resolution, blur, clipping; then run body analysis
    return res.status(200).json({
      status: 'low_confidence',
      reason: 'insufficient_resolution',
      message: 'Photo-based body analysis requires higher resolution and full-frame capture.',
    });
  } catch (err) {
    console.error('[analyze-body]', err);
    return res.status(500).json({
      error: 'Analysis failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
