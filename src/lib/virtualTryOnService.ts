import { prepareImageForReplicate } from './imageUploadService';

// Use server-side proxy to avoid CORS issues
const API_PROXY_URL = '/api/replicate-proxy';
const API_STATUS_URL = '/api/replicate-status';

// Cache for generated images
const imageCache = new Map<string, string>();

// Poll prediction status until completion
async function pollPredictionStatus(
  predictionId: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ output: unknown; error?: string; logs?: string }> {
  const startTime = Date.now();
  const timeoutMs = 90000; // 90 seconds max
  const pollInterval = 1200; // 1.2 seconds

  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(API_STATUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: predictionId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (onStatusUpdate) {
      onStatusUpdate(data.status);
    }

    if (data.status === 'succeeded') {
      return { output: data.output };
    } else if (data.status === 'failed') {
      return {
        output: null,
        error: data.error || 'Prediction failed',
        logs: data.logs
      };
    } else if (data.status === 'canceled') {
      return {
        output: null,
        error: 'Prediction was canceled'
      };
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Prediction timeout - still generating after 90 seconds. Please try again.');
}

export interface TryOnRequest {
  userPhoto: string; // Base64 or URL
  outfitImage: string; // Base64 or URL
  outfitId: number;
  userId?: string;
}

export interface TryOnResult {
  imageUrl: string;
  cached: boolean;
}

/**
 * Generate face-swapped image - replaces face in outfit image with user's face
 * Uses face swap models for simpler and more reliable results
 */
export async function generateVirtualTryOn(
  request: TryOnRequest
): Promise<TryOnResult> {
  // Create cache key
  const cacheKey = `tryon_${request.outfitId}_${request.userId || 'anonymous'}`;
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return {
      imageUrl: imageCache.get(cacheKey)!,
      cached: true,
    };
  }

  try {
    // Prepare images for Replicate in parallel (upload to Supabase Storage if available)
    const [userPhotoUrl, outfitImageUrl] = await Promise.all([
      prepareImageForReplicate(request.userPhoto, `user-${request.userId || 'anonymous'}.jpg`),
      prepareImageForReplicate(request.outfitImage, `outfit-${request.outfitId}.jpg`)
    ]);

    console.log('Attempting try-on generation via proxy', {
      userPhotoType: userPhotoUrl.substring(0, 50),
      outfitImageType: outfitImageUrl.substring(0, 50),
    });

    // Use face swap to put user's face onto outfit/model image
    // This preserves the outfit image's background/setting while applying the user's face
    console.log('Attempting face swap: user face onto outfit image');
    
    if (!userPhotoUrl || !outfitImageUrl) {
      throw new Error('Missing required images: both user photo and outfit image are required');
    }
    
    // Ensure source image is a URL (not data URL) for best results
    if (userPhotoUrl.startsWith('data:')) {
      throw new Error('Source image must be a hosted URL, not a data URL. Please upload to Supabase Storage first.');
    }
    
    // Step 1: Create prediction (returns immediately with ID)
    const response = await fetch(API_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: "faceswap", // Explicit task to prevent misrouting
        model: "ddvinh1/inswapper",
        input: {
          source_img: userPhotoUrl, // User's face (source)
          target_img: outfitImageUrl, // Outfit/model image (target - preserves its background)
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error(`API Error (${response.status}):`, errorMsg, errorData);
      throw new Error(`Server error: ${errorMsg}`);
    }

    const predictionData = await response.json();
    
    if (!predictionData || !predictionData.id) {
      console.error('Invalid response from server:', predictionData);
      throw new Error('Invalid response from server - no prediction ID received');
    }

    const predictionId = predictionData.id;
    console.log('Prediction created:', predictionId, 'Status:', predictionData.status);

    // Step 2: Poll for completion
    const result = await pollPredictionStatus(predictionId, (status) => {
      console.log('Prediction status:', status);
    });

    if (result.error) {
      throw new Error(result.error + (result.logs ? `\n\nLogs: ${result.logs}` : ''));
    }

    if (!result.output) {
      throw new Error('No output received from prediction');
    }

    const output = result.output;

    console.log('Model output received:', {
      type: typeof output,
      isArray: Array.isArray(output),
      length: Array.isArray(output) ? output.length : 'N/A',
      preview: typeof output === 'string' ? output.substring(0, 100) : JSON.stringify(output).substring(0, 100)
    });

    // Handle different output formats
    let imageUrl: string | null = null;
    
    if (Array.isArray(output)) {
      // If array, get first string URL
      imageUrl = output.find((item: unknown) => typeof item === 'string' && (item.startsWith('http') || item.startsWith('data:'))) || null;
    } else if (typeof output === 'string') {
      // Direct string URL
      imageUrl = output;
    } else if (output && typeof output === 'object') {
      // Object with URL property
      imageUrl = (output as { url?: string; image?: string; output?: string }).url || 
                 (output as { url?: string; image?: string; output?: string }).image ||
                 (output as { url?: string; image?: string; output?: string }).output ||
                 null;
    }
    
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0 && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
      console.log('Success! Generated image URL:', imageUrl.substring(0, 100));
      // Cache the result
      imageCache.set(cacheKey, imageUrl);
      
      return {
        imageUrl,
        cached: false,
      };
    } else {
      console.error('Model returned invalid output format:', {
        outputType: typeof output,
        isArray: Array.isArray(output),
        outputPreview: typeof output === 'string' 
          ? output.substring(0, 200) 
          : JSON.stringify(output).substring(0, 500),
        extractedUrl: imageUrl,
        fullOutput: output
      });
      throw new Error('Invalid output format from model');
    }
  } catch (error) {
    console.error('Virtual try-on error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate try-on image: ${errorMessage}`);
  }
}

