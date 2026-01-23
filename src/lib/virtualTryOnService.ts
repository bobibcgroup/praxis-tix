import { prepareImageForReplicate } from './imageUploadService';

// Use server-side generation endpoint that handles everything
const API_GENERATE_URL = '/api/replicate-generate';

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
    console.log(`[TRYON] Starting generation for outfit ${request.outfitId}, user ${request.userId || 'anonymous'}`);
    
    // Prepare images for Replicate in parallel (upload to Supabase Storage if available)
    console.log('[TRYON] Preparing images for Replicate...');
    const [userPhotoUrl, outfitImageUrl] = await Promise.all([
      prepareImageForReplicate(request.userPhoto, `user-${request.userId || 'anonymous'}.jpg`),
      prepareImageForReplicate(request.outfitImage, `outfit-${request.outfitId}.jpg`)
    ]);

    console.log('[TRYON] Images prepared:', {
      userPhotoUrl: userPhotoUrl ? `${userPhotoUrl.substring(0, 100)}...` : 'null',
      outfitImageUrl: outfitImageUrl ? `${outfitImageUrl.substring(0, 100)}...` : 'null',
      userPhotoIsDataUrl: userPhotoUrl?.startsWith('data:'),
      outfitImageIsDataUrl: outfitImageUrl?.startsWith('data:')
    });

    // Use face swap to put user's face onto outfit/model image
    // This preserves the outfit image's background/setting while applying the user's face
    
    if (!userPhotoUrl || !outfitImageUrl) {
      console.error('[TRYON] Missing required images');
      throw new Error('Missing required images: both user photo and outfit image are required');
    }
    
    // Ensure source image is a URL (not data URL) for best results
    if (userPhotoUrl.startsWith('data:')) {
      console.error('[TRYON] Source image is data URL, not supported');
      throw new Error('Source image must be a hosted URL, not a data URL. Please upload to Supabase Storage first.');
    }
    
    // Call server-side generation endpoint that handles prediction creation and polling
    console.log('[TRYON] Calling server-side generation endpoint...');
    const response = await fetch(API_GENERATE_URL, {
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
      console.error(`[TRYON] API Error (${response.status}):`, errorMsg, errorData);
      throw new Error(`Server error: ${errorMsg}`);
    }

    const result = await response.json();
    
    console.log('[TRYON] Generation complete:', {
      success: result.success,
      hasImageUrl: !!result.imageUrl,
      predictionId: result.predictionId,
      model: result.model
    });
    
    if (!result.success || !result.imageUrl) {
      console.error('[TRYON] Invalid response from server:', result);
      throw new Error(result.error || 'Invalid response from server - no image URL received');
    }

    const imageUrl = result.imageUrl;
    
    if (typeof imageUrl === 'string' && imageUrl.length > 0 && (imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
      // Cache the result
      imageCache.set(cacheKey, imageUrl);
      console.log(`[TRYON] Success! Generated image URL: ${imageUrl.substring(0, 100)}...`);
      
      return {
        imageUrl,
        cached: false,
      };
    } else {
      console.error('[TRYON] Invalid image URL format:', {
        imageUrl,
        imageUrlType: typeof imageUrl,
        imageUrlLength: imageUrl?.length
      });
      throw new Error('Invalid image URL format received from server');
    }
  } catch (error) {
    console.error('[TRYON] Virtual try-on error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate try-on image: ${errorMessage}`);
  }
}

