/**
 * In-memory biometric session store.
 * Sessions hold only session metadata and extracted FaceProfile/BodyProfile — raw images are never stored.
 * Privacy: process in memory, delete raw after extraction, store only vectors/measurements.
 */

import type { FaceProfile, BodyProfile } from '@/types/praxis';

export type BiometricFlow = 'occasion' | 'dna';
export type UploadStatus = 'missing' | 'uploaded' | 'processed' | 'rejected';

export interface BiometricsSession {
  session_id: string;
  user_id: string;
  flow: BiometricFlow;
  face_status: UploadStatus;
  body_status: UploadStatus;
  created_at: string;
  face_profile?: FaceProfile | null;
  body_profile?: BodyProfile | null;
  /** Raw image buffers are never persisted; only set temporarily during processing then cleared */
  _faceBuffer?: Buffer | null;
  _bodyBuffer?: Buffer | null;
}

const sessions = new Map<string, BiometricsSession>();

export function createSession(userId: string, flow: BiometricFlow): BiometricsSession {
  const session_id = `bio_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const session: BiometricsSession = {
    session_id,
    user_id: userId,
    flow,
    face_status: 'missing',
    body_status: 'missing',
    created_at: new Date().toISOString(),
  };
  sessions.set(session_id, session);
  return session;
}

export function getSession(sessionId: string): BiometricsSession | undefined {
  return sessions.get(sessionId);
}

export function setFaceUploaded(sessionId: string, buffer: Buffer): void {
  const s = sessions.get(sessionId);
  if (s) {
    s._faceBuffer = buffer;
    s.face_status = 'uploaded';
  }
}

export function setBodyUploaded(sessionId: string, buffer: Buffer): void {
  const s = sessions.get(sessionId);
  if (s) {
    s._bodyBuffer = buffer;
    s.body_status = 'uploaded';
  }
}

export function setFaceProfile(sessionId: string, profile: FaceProfile): void {
  const s = sessions.get(sessionId);
  if (s) {
    s.face_profile = profile;
    s.face_status = profile.status === 'rejected' ? 'rejected' : 'processed';
    s._faceBuffer = null; // Delete raw; store only profile
  }
}

export function setBodyProfile(sessionId: string, profile: BodyProfile): void {
  const s = sessions.get(sessionId);
  if (s) {
    s.body_profile = profile;
    s.body_status = profile.status === 'rejected' ? 'rejected' : 'processed';
    s._bodyBuffer = null;
  }
}

export function getFaceBuffer(sessionId: string): Buffer | null | undefined {
  return sessions.get(sessionId)?._faceBuffer ?? null;
}

export function getBodyBuffer(sessionId: string): Buffer | null | undefined {
  return sessions.get(sessionId)?._bodyBuffer ?? null;
}

export function clearSessionRawImages(sessionId: string): void {
  const s = sessions.get(sessionId);
  if (s) {
    s._faceBuffer = null;
    s._bodyBuffer = null;
  }
}

/** Optional: prune old sessions (e.g. > 1 hour) to avoid unbounded memory growth */
export function pruneSessionsOlderThanMs(ms: number): number {
  const now = Date.now();
  let removed = 0;
  for (const [id, s] of sessions.entries()) {
    if (now - new Date(s.created_at).getTime() > ms) {
      sessions.delete(id);
      removed++;
    }
  }
  return removed;
}
