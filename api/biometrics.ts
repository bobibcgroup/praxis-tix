/**
 * Single biometrics API: POST /api/biometrics with body.action = start | face | body | finalize
 * GET /api/biometrics?session_id=... for result.
 * Use this when multiple routes (e.g. /api/biometrics-session-face) return 404 on your host.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createSession,
  getSession,
  setFaceProfile,
  setBodyProfile,
  clearSessionRawImages,
} from '../src/lib/biometricSessionStore';
import { runFacePipeline } from '../src/lib/facePipelineService';
import { runBodyPipeline } from '../src/lib/bodyPipelineService';

function bufferFromBase64(data: string): Buffer | null {
  try {
    const base64 = data.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64, 'base64');
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
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
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const action = body.action as string | undefined;

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ error: 'body.action is required: start | face | body | finalize' });
    }

    switch (action) {
      case 'start': {
        const user_id = (body.user_id as string) ?? 'anonymous';
        const flow = body.flow === 'dna' ? 'dna' : 'occasion';
        const session = createSession(user_id, flow);
        return res.status(200).json({
          session_id: session.session_id,
          user_id: session.user_id,
          flow: session.flow,
          face_status: session.face_status,
          body_status: session.body_status,
          created_at: session.created_at,
        });
      }

      case 'face': {
        const session_id = body.session_id as string | undefined;
        if (!session_id || typeof session_id !== 'string') {
          return res.status(400).json({ error: 'session_id is required', accepted: false });
        }
        const session = getSession(session_id);
        if (!session) {
          return res.status(404).json({ error: 'Session not found', accepted: false });
        }
        const imageBase64 = body.image as string | undefined;
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
      }

      case 'body': {
        const session_id = body.session_id as string | undefined;
        if (!session_id || typeof session_id !== 'string') {
          return res.status(400).json({ error: 'session_id is required', accepted: false });
        }
        const session = getSession(session_id);
        if (!session) {
          return res.status(404).json({ error: 'Session not found', accepted: false });
        }
        const imageBase64 = body.image as string | undefined;
        if (!imageBase64 || typeof imageBase64 !== 'string') {
          return res.status(400).json({ error: 'image (base64) is required', accepted: false });
        }
        const buffer = bufferFromBase64(imageBase64);
        if (!buffer) {
          return res.status(400).json({ error: 'Invalid image data', accepted: false });
        }
        const bodyProfile = await runBodyPipeline(buffer);
        setBodyProfile(session_id, bodyProfile);
        return res.status(200).json({
          accepted: true,
          next: 'finalize',
          status: bodyProfile.status,
          confidence: bodyProfile.confidence,
          reject_reason: bodyProfile.reject_reason ?? undefined,
          how_to_fix: bodyProfile.how_to_fix ?? undefined,
        });
      }

      case 'finalize': {
        const session_id = body.session_id as string | undefined;
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
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}. Use start | face | body | finalize` });
    }
  } catch (err) {
    console.error('[biometrics]', err);
    return res.status(500).json({
      error: 'Biometrics failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
