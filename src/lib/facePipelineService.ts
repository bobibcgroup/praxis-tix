/**
 * Face image pipeline: quality gate → (future: radiometric calibration, feature extraction) → 12-season cluster.
 * Returns FaceProfile with color_season, undertone, contrast, hair/eye clusters.
 * Privacy: callers must not persist raw image; store only FaceProfile / embeddings.
 */

import type { FaceProfile, QualityGateReport } from '@/types/praxis';
import { checkImageQualityFromBuffer } from './imageQualityGateServer';

const CONFIDENCE_THRESHOLD = 0.7;
const PLACEHOLDER_SEASON = 'Deep Winter';
const PLACEHOLDER_UNDERTONE = 'cool' as const;
const PLACEHOLDER_CONTRAST = 0.72;
const PLACEHOLDER_HAIR = 'dark_brown';
const PLACEHOLDER_EYE = 'hazel';

/**
 * Run face pipeline: quality gate then placeholder color analysis.
 * In production, add radiometric calibration (sclera anchor / learning-based WB) and real feature extraction.
 */
export async function runFacePipeline(imageBuffer: Buffer): Promise<FaceProfile> {
  const gate = await checkImageQualityFromBuffer(imageBuffer);
  const qualityGates: QualityGateReport = {
    passed: gate.ok,
    notes: gate.reason ? [gate.reason] : [],
  };

  if (!gate.ok) {
    return {
      status: 'rejected',
      confidence: 0,
      quality_gates: qualityGates,
      reject_reason: gate.reason,
      how_to_fix: gate.instruction,
    };
  }

  // Placeholder: real implementation would extract skin LAB, undertone, hair/eye clusters → 12-season
  return {
    status: 'ok',
    color_season: PLACEHOLDER_SEASON,
    confidence: 0.82,
    undertone: PLACEHOLDER_UNDERTONE,
    contrast_ratio: PLACEHOLDER_CONTRAST,
    hair_cluster: PLACEHOLDER_HAIR,
    eye_cluster: PLACEHOLDER_EYE,
    skin_lab_mean: { L: 63, a: 14, b: 18 },
    quality_gates: { passed: true, notes: [] },
  };
}

export { checkImageQualityFromBuffer };
export const FACE_CONFIDENCE_THRESHOLD = CONFIDENCE_THRESHOLD;
