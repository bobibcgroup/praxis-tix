/**
 * Client for /api/biometrics (single route: start | face | body | finalize, GET for result).
 * Used by StepPhoto (Build my DNA) to run face + body pipeline and save to DNA card.
 */

import type { FaceProfile, BodyProfile } from '@/types/praxis';

const API_BASE = typeof window !== 'undefined' ? (import.meta.env.VITE_API_BASE ?? '') : '';

export interface BiometricSessionResult {
  session_id: string;
  face_profile: FaceProfile | null;
  body_profile: BodyProfile | null;
  overall_confidence: number;
}

export async function startBiometricSession(userId: string, flow: 'dna' | 'occasion' = 'dna'): Promise<string> {
  const res = await fetch(`${API_BASE}/api/biometrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start', user_id: userId, flow }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err?.message || err?.error) as string || 'Failed to start session');
  }
  const data = await res.json();
  return data.session_id;
}

export async function submitFaceImage(sessionId: string, imageBase64: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/biometrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'face', session_id: sessionId, image: imageBase64 }),
  });
  const data = await res.json();
  if (data.accepted === false) {
    throw new Error(data.reject_reason || data.how_to_fix || 'Face analysis failed');
  }
}

export async function submitBodyImage(sessionId: string, imageBase64: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/biometrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'body', session_id: sessionId, image: imageBase64 }),
  });
  const data = await res.json();
  if (data.accepted === false) {
    throw new Error(data.reject_reason || data.how_to_fix || 'Body analysis failed');
  }
}

export async function finalizeBiometricSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/biometrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'finalize', session_id: sessionId }),
  });
  if (!res.ok) throw new Error('Failed to finalize session');
}

export async function getBiometricResult(sessionId: string): Promise<BiometricSessionResult> {
  const res = await fetch(`${API_BASE}/api/biometrics?session_id=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Failed to get biometric result');
  const data = await res.json();
  return {
    session_id: data.session_id,
    face_profile: data.face_profile ?? null,
    body_profile: data.body_profile ?? null,
    overall_confidence: data.overall_confidence ?? 0,
  };
}

/**
 * Run full flow: start → face → body → finalize → get result.
 * Uses the same image for both face and body (head-and-shoulders photo).
 */
export async function runBiometricAnalysis(
  userId: string,
  imageBase64: string
): Promise<BiometricSessionResult> {
  const sessionId = await startBiometricSession(userId, 'dna');
  await submitFaceImage(sessionId, imageBase64);
  await submitBodyImage(sessionId, imageBase64);
  await finalizeBiometricSession(sessionId);
  return getBiometricResult(sessionId);
}
