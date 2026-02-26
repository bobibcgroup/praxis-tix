import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSession } from '../../../src/lib/biometricSessionStore';

/** GET /api/biometrics/session/result?session_id=... — Get FaceProfile + BodyProfile + confidence. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session_id = typeof req.query?.session_id === 'string' ? req.query.session_id : undefined;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id query is required' });
    }
    const session = getSession(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const face = session.face_profile;
    const bodyProfile = session.body_profile;
    const overall_confidence =
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
      overall_confidence,
      face_status: session.face_status,
      body_status: session.body_status,
    });
  } catch (err) {
    console.error('[biometrics/session/result]', err);
    return res.status(500).json({
      error: 'Failed to get result',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
