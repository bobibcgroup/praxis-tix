/**
 * Image quality gates before photo-based analysis (body, color, try-on).
 * Validates resolution, blur, clipping; returns low_confidence with reason when not suitable.
 */

export interface ImageQualityResult {
  ok: boolean;
  reason?: 'insufficient_resolution' | 'blur_detected' | 'clipping_detected' | 'unsupported_format';
  message?: string;
  /** Optional: min width/height that was required */
  minResolution?: { width: number; height: number };
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;

/**
 * Stub: in production would decode image and check dimensions/blur/clipping.
 * For now returns low_confidence so analyze-body and analyze-color can return a clear message.
 */
export function checkImageQuality(_imageUrlOrBase64: string): ImageQualityResult {
  // TODO: decode image, check dimensions >= MIN_WIDTH/MIN_HEIGHT, run blur detection, clipping detection
  return {
    ok: false,
    reason: 'insufficient_resolution',
    message: 'Photo-based analysis requires higher resolution and full-frame capture.',
    minResolution: { width: MIN_WIDTH, height: MIN_HEIGHT },
  };
}

/**
 * Use before calling body or color analysis APIs; show user-facing message when !result.ok.
 */
export function getImageQualityMessage(result: ImageQualityResult): string {
  if (result.ok) return '';
  return result.message ?? 'Image quality is insufficient for this analysis.';
}
