import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession, clearSessionRawImages } from '../../../src/lib/biometricSessionStore';

/** POST /api/biometrics/session/finalize — Finalize session (run pipelines if not yet run, clear raw images). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = (req.body || {}) as { session_id?: string };
    const session_id = body.session_id;
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'session_id is required' });
    }
    const session = getSession(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    clearSessionRawImages(session_id);
    const face = session.face_profile;
    const bodyProfile = session.body_profile;
    const overallConfidence =
      face && bodyProfile
        ? (face.confidence + bodyProfile.confidence) / 2
        : face
          ? face.confidence
          : bodyProfile
            ? bodyProfile.confidence
            : 0;
    return res.status(200).json({
      session_id,
      face_profile: face ?? null,
      body_profile: bodyProfile ?? null,
      overall_confidence: overallConfidence,
    });
  } catch (err) {
    console.error('[biometrics/session/finalize]', err);
    return res.status(500).json({
      error: 'Finalize failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
