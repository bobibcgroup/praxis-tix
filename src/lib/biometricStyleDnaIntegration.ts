/**
 * Style DNA integration for biometric results.
 * Write biometric results into identity_core only when confidence >= threshold; otherwise mark provisional.
 * Respects drift rules (±0.05/week) for future scalar fields.
 */

import type { StyleDNA, IdentityCore, FaceProfile, BodyProfile } from '@/types/praxis';

const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Build IdentityCore from face and body profiles.
 * Only includes kibbe/color_season when confidence >= CONFIDENCE_THRESHOLD; otherwise provisional.
 */
export function identityCoreFromBiometrics(
  faceProfile: FaceProfile | null | undefined,
  bodyProfile: BodyProfile | null | undefined
): IdentityCore {
  const now = new Date().toISOString();
  const faceOk = faceProfile?.status === 'ok' && faceProfile.confidence >= CONFIDENCE_THRESHOLD;
  const bodyOk = bodyProfile?.status === 'ok' && bodyProfile.confidence >= CONFIDENCE_THRESHOLD;
  const provisional = !faceOk || !bodyOk;

  const verticalLine =
    bodyProfile?.measurements?.vertical_ratio != null
      ? bodyProfile.measurements.vertical_ratio >= 0.85
        ? 'Long'
        : bodyProfile.measurements.vertical_ratio >= 0.75
          ? 'Moderate'
          : 'Short'
      : undefined;
  const shoulder =
    bodyProfile?.measurements?.shoulder_angle_deg != null
      ? bodyProfile.measurements.shoulder_angle_deg >= 18
        ? 'Sharp'
        : bodyProfile.measurements.shoulder_angle_deg >= 10
          ? 'Blunt'
          : 'Soft'
      : undefined;

  return {
    color_season: faceOk && faceProfile?.color_season ? faceProfile.color_season : undefined,
    kibbe: bodyOk && bodyProfile?.kibbe_cluster ? bodyProfile.kibbe_cluster : undefined,
    assessed_date: (faceOk || bodyOk) ? now : undefined,
    provisional: provisional || undefined,
    undertone: faceOk && faceProfile?.undertone ? faceProfile.undertone : undefined,
    vertical_line: bodyOk ? verticalLine : undefined,
    shoulder: bodyOk ? shoulder : undefined,
  };
}

/**
 * Merge biometric identity_core into existing Style DNA.
 * Does not overwrite primaryStyle/secondaryStyle; adds or updates identity_core.
 */
export function mergeBiometricsIntoStyleDNA(
  existing: StyleDNA | null | undefined,
  faceProfile: FaceProfile | null | undefined,
  bodyProfile: BodyProfile | null | undefined
): StyleDNA {
  const identity_core = identityCoreFromBiometrics(faceProfile, bodyProfile);
  const base: StyleDNA = existing
    ? { ...existing }
    : {
        primaryStyle: 'SMART_CASUAL',
        secondaryStyle: undefined,
        confidence: 'medium',
      };
  return {
    ...base,
    identity_core: { ...base.identity_core, ...identity_core },
  };
}

export const BIOMETRIC_CONFIDENCE_THRESHOLD = CONFIDENCE_THRESHOLD;
