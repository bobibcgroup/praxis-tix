import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Stub: photo-based color/contrast analysis. Returns low_confidence until resolution checks exist. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // TODO: validate image resolution, blur; then run color analysis
    return res.status(200).json({
      status: 'low_confidence',
      reason: 'insufficient_resolution',
      message: 'Photo-based color analysis requires sufficient resolution and clear skin tone visibility.',
    });
  } catch (err) {
    console.error('[analyze-color]', err);
    return res.status(500).json({
      error: 'Analysis failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
