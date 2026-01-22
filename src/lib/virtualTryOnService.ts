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
 * Generate virtual try-on image using Replicate IDM-VTON model
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

    // Try multiple models - using models that are currently available
    // Note: Models may change availability. Check Replicate.com for current options
    const models = [
      {
        name: "cuuupid/idm-vton",
        input: {
          human: userPhotoUrl,
          garment: outfitImageUrl,
        }
      },
      {
        name: "levihsu/ootdiffusion",
        input: {
          model_type: "hd",
          category: "upper_body",
          garment_img: outfitImageUrl,
          human_img: userPhotoUrl,
        }
      },
      {
        name: "yisol/idm-vton",
        input: {
          human: userPhotoUrl,
          garment: outfitImageUrl,
        }
      }
    ];

    let lastError: Error | null = null;
    let lastErrorDetails: unknown = null;

    for (const modelConfig of models) {
      try {
        console.log(`Trying model: ${modelConfig.name}`);
        
        // Call server-side proxy instead of direct API
        const response = await fetch(API_PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelConfig.name,
            input: modelConfig.input,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          
          // Skip 404 errors (model not found) and try next model
          if (response.status === 404) {
            console.warn(`Model ${modelConfig.name} not found (404), trying next model...`);
            continue;
          }
          
          // Handle rate limiting with retry
          if (response.status === 429) {
            const retryAfter = errorData.retryAfter || 10;
            console.warn(`Rate limited. Retrying after ${retryAfter}s...`);
            
            // Wait and retry once
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            
            // Retry the same model
            const retryResponse = await fetch(API_PROXY_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: modelConfig.name,
                input: modelConfig.input,
              }),
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              const output = retryData.output;
              const imageUrl = Array.isArray(output) ? output[0] : output;
              
              if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0) {
                console.log('Success after retry!');
                imageCache.set(cacheKey, imageUrl);
                return { imageUrl, cached: false };
              }
            }
            
            // If retry failed, throw with helpful message
            throw new Error(`Rate limit exceeded. ${errorData.details || 'Please add a payment method to your Replicate account: https://replicate.com/account/billing'}`);
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

        console.log('Model output received');

        // Output is an array, get the first image
        const imageUrl = Array.isArray(output) ? output[0] : output;
        
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0) {
          console.log('Success! Generated image URL');
          // Cache the result
          imageCache.set(cacheKey, imageUrl);
          
          return {
            imageUrl,
            cached: false,
          };
        } else {
          console.warn(`Model ${modelConfig.name} returned invalid output`);
        }
      } catch (modelError: unknown) {
        console.error(`Model ${modelConfig.name} failed:`, modelError);
        lastErrorDetails = modelError;
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError));
        // Try next model
        continue;
      }
    }

    // If all models failed, provide detailed error
    const errorDetails = lastErrorDetails?.message || lastError?.message || 'Unknown error';
    console.error('All models failed. Last error:', errorDetails);
    throw new Error(`Failed to generate try-on image: ${errorDetails}`);
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
