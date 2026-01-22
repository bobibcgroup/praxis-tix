// Use server-side proxy to avoid CORS issues
const API_PROXY_URL = '/api/replicate-proxy';

// Cache for generated videos
const videoCache = new Map<string, string>();

export interface VideoRequest {
  imageUrl: string; // Try-on image or outfit image
  outfitId: number;
  userId?: string;
}

export interface VideoResult {
  videoUrl: string;
  cached: boolean;
}

/**
 * Generate animated video from static image using Replicate
 */
export async function generateAnimatedVideo(
  request: VideoRequest
): Promise<VideoResult> {
  const cacheKey = `video_${request.outfitId}_${request.userId || 'anonymous'}`;
  
  // Check cache first
  if (videoCache.has(cacheKey)) {
    return {
      videoUrl: videoCache.get(cacheKey)!,
      cached: true,
    };
  }

  try {
    // Call server-side proxy
    const response = await fetch(API_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "anotherjesse/zeroscope-v2-xl",
        input: {
          image: request.imageUrl,
          num_frames: 30,
          fps: 30,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const output = data.output;

    const videoUrl = Array.isArray(output) ? output[0] : output;
    
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('No video returned from API');
    }

    // Cache the result
    videoCache.set(cacheKey, videoUrl);
    
    return {
      videoUrl,
      cached: false,
    };
  } catch (error) {
    console.error('Video generation error:', error);
    throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

