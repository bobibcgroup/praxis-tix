import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runFacePipeline } from '../src/lib/facePipelineService';

/** Photo-based color/contrast analysis. Uses quality gate + face pipeline; returns FaceProfile. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body as { image?: string } | undefined;
    const imageBase64 = body?.image;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(200).json({
        status: 'low_confidence',
        reason: 'insufficient_resolution',
        message: 'Photo-based color analysis requires sufficient resolution and clear skin tone visibility.',
      });
    }
    const buffer = bufferFromBase64(imageBase64);
    if (!buffer) {
      return res.status(400).json({
        status: 'rejected',
        reason: 'unsupported_format',
        message: 'Invalid image data.',
      });
    }
    const faceProfile = await runFacePipeline(buffer);
    return res.status(200).json(faceProfile);
  } catch (err) {
    console.error('[analyze-color]', err);
    return res.status(500).json({
      error: 'Analysis failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

function bufferFromBase64(data: string): Buffer | null {
  try {
    const base64 = data.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64, 'base64');
  } catch {
    return null;
  }
}
