import { prepareImageForReplicate } from './imageUploadService';

// Use server-side proxy to avoid CORS issues
const API_PROXY_URL = '/api/replicate-proxy';

// Cache for generated images
const imageCache = new Map<string, string>();

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
    // First, check if serverless function is available
    try {
      const healthCheck = await fetch(API_PROXY_URL, { method: 'GET' });
      const health = await healthCheck.json();
      if (!health.hasToken) {
        throw new Error('Serverless function is not configured. REPLICATE_API_TOKEN missing in Vercel.');
      }
    } catch (healthError) {
      console.warn('Health check failed:', healthError);
      // Continue anyway, might be network issue
    }

    // Prepare images for Replicate (upload to Supabase Storage if available)
    const userPhotoUrl = await prepareImageForReplicate(request.userPhoto, `user-${request.userId || 'anonymous'}.jpg`);
    const outfitImageUrl = await prepareImageForReplicate(request.outfitImage, `outfit-${request.outfitId}.jpg`);

    console.log('Attempting try-on generation via proxy', {
      userPhotoType: userPhotoUrl.substring(0, 50),
      outfitImageType: outfitImageUrl.substring(0, 50),
    });

    // Use INSwapper model for face swap
    // source_image = user's face photo (the face we want to keep completely)
    // target_image = outfit image (where we want to put the face)
    console.log('Attempting face swap with ddvinh1/inswapper');
    
    const response = await fetch(API_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "ddvinh1/inswapper",
        input: {
          source_image: userPhotoUrl,
          target_image: outfitImageUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      // Handle rate limiting with retry
      if (response.status === 429) {
        const retryAfter = errorData.retryAfter || 10;
        console.warn(`Rate limited. Retrying after ${retryAfter}s...`);
        
        // Wait and retry once
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        
        const retryResponse = await fetch(API_PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "ddvinh1/inswapper",
            input: {
              source_image: userPhotoUrl,
              target_image: outfitImageUrl,
            },
          }),
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          const output = retryData.output;
          
          // Parse output
          let imageUrl: string | null = null;
          if (Array.isArray(output)) {
            imageUrl = output.find((item: unknown) => typeof item === 'string' && (item.startsWith('http') || item.startsWith('data:'))) || null;
          } else if (typeof output === 'string') {
            imageUrl = output;
          } else if (output && typeof output === 'object') {
            imageUrl = (output as { url?: string; image?: string; output?: string }).url || 
                       (output as { url?: string; image?: string; output?: string }).image ||
                       (output as { url?: string; image?: string; output?: string }).output ||
                       null;
          }
          
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0 && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
            console.log('Success after retry!');
            imageCache.set(cacheKey, imageUrl);
            return { imageUrl, cached: false };
          }
        }
        
        throw new Error(`Rate limit exceeded. Please try again later.`);
      }
      
      console.error(`API Error (${response.status}):`, errorMsg, errorData);
      throw new Error(`Server error: ${errorMsg}`);
    }

    const data = await response.json();
    
    if (!data || !data.output) {
      console.error('Invalid response from server:', data);
      throw new Error('Invalid response from server - no output received');
    }
    
    const output = data.output;

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

/**
 * Alternative: Use a simpler face-swap model if IDM-VTON doesn't work
 * Note: This also uses the server-side proxy
 */
export async function generateFaceSwap(
  request: TryOnRequest
): Promise<TryOnResult> {
  const cacheKey = `faceswap_${request.outfitId}_${request.userId || 'anonymous'}`;
  
  if (imageCache.has(cacheKey)) {
    return {
      imageUrl: imageCache.get(cacheKey)!,
      cached: true,
    };
  }

  try {
    const userPhotoUrl = await prepareImageForReplicate(request.userPhoto, `user-${request.userId || 'anonymous'}.jpg`);
    const outfitImageUrl = await prepareImageForReplicate(request.outfitImage, `outfit-${request.outfitId}.jpg`);

    const response = await fetch(API_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "yan-ops/face_swap",
        input: {
          source_image: userPhotoUrl,
          target_image: outfitImageUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const output = data.output;
    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('No image returned from face swap');
    }
    
    imageCache.set(cacheKey, imageUrl);
    
    return {
      imageUrl,
      cached: false,
    };
  } catch (error) {
    console.error('Face swap error:', error);
    throw error;
  }
}
