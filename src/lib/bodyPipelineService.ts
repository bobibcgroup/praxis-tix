/**
 * Full-body image pipeline: quality gate → (future: Gemini agentic loop) → Kibbe cluster.
 * Returns BodyProfile with measurements and cluster (never single deterministic type).
 * Privacy: callers must not persist raw image; store only BodyProfile / measurements.
 */

import type { BodyProfile, BodyMeasurements, KibbeCluster, QualityGateReport } from '@/types/praxis';
import { checkImageQualityFromBuffer } from './imageQualityGateServer';

const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Run body pipeline: quality gate then placeholder Kibbe/cluster analysis.
 * In production, use Gemini Think–Act–Observe loop for measurements → cluster.
 */
export async function runBodyPipeline(imageBuffer: Buffer): Promise<BodyProfile> {
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

  // Placeholder measurements and cluster (real: agentic vision loop)
  const measurements: BodyMeasurements = {
    vertical_ratio: 0.82,
    shoulder_angle_deg: 12,
    curve_score: 0.41,
    width_ratio: 0.63,
  };
  const kibbe_cluster: KibbeCluster = {
    Natural: 0.78,
    Classic: 0.22,
  };

  return {
    status: 'ok',
    kibbe_cluster,
    confidence: 0.79,
    measurements,
    quality_gates: { passed: true, notes: [] },
  };
}

export const BODY_CONFIDENCE_THRESHOLD = CONFIDENCE_THRESHOLD;
