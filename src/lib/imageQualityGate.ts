/**
 * Image quality gates before photo-based analysis (body, color, try-on).
 * Validates resolution, blur, clipping, channel correlation; returns low_confidence with reason when not suitable.
 */

export interface ImageQualityResult {
  ok: boolean;
  reason?:
    | 'insufficient_resolution'
    | 'blur_detected'
    | 'clipping_detected'
    | 'channel_correlation_high'
    | 'unsupported_format';
  message?: string;
  /** Optional: min width/height that was required */
  minResolution?: { width: number; height: number };
  /** User-facing instruction when rejected (e.g. "Stand near natural daylight. Avoid filters.") */
  instruction?: string;
}

const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;

/**
 * Stub for client/frontend: in production use server-side checkImageQualityFromBuffer with actual image data.
 * For URLs/base64 the real check runs in API after upload.
 */
export function checkImageQuality(_imageUrlOrBase64: string): ImageQualityResult {
  return {
    ok: false,
    reason: 'insufficient_resolution',
    message: 'Photo-based analysis requires higher resolution and full-frame capture.',
    minResolution: { width: MIN_WIDTH, height: MIN_HEIGHT },
    instruction: 'Stand near natural daylight. Avoid filters.',
  };
}

/**
 * Use before calling body or color analysis APIs; show user-facing message when !result.ok.
 * Prefers result.instruction when present (server-side reject reason).
 */
export function getImageQualityMessage(result: ImageQualityResult): string {
  if (result.ok) return '';
  return result.instruction ?? result.message ?? 'Image quality is insufficient for this analysis.';
}
