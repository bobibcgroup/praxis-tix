import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, setFaceProfile } from '../../../src/lib/biometricSessionStore';
import { runFacePipeline } from '../../../src/lib/facePipelineService';

/** POST /api/biometrics/session/face — Upload face image. Body: session_id, image (base64). Optionally process immediately. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = (req.body || {}) as { session_id?: string; image?: string; save_raw?: boolean };
    const session_id = body.session_id;
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'session_id is required' });
    }
    const session = getSession(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const imageBase64 = body.image;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'image (base64) is required', accepted: false });
    }
    const buffer = bufferFromBase64(imageBase64);
    if (!buffer) {
      return res.status(400).json({ error: 'Invalid image data', accepted: false });
    }
    const faceProfile = await runFacePipeline(buffer);
    setFaceProfile(session_id, faceProfile);
    return res.status(200).json({
      accepted: true,
      next: 'body',
      status: faceProfile.status,
      confidence: faceProfile.confidence,
      reject_reason: faceProfile.reject_reason ?? undefined,
      how_to_fix: faceProfile.how_to_fix ?? undefined,
    });
  } catch (err) {
    console.error('[biometrics/session/face]', err);
    return res.status(500).json({
      error: 'Face upload failed',
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
