import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configure max duration for this serverless function (100 seconds)
// This allows enough time for prediction creation and polling (up to 90 seconds)
export const config = {
  maxDuration: 100,
};

// Version ID cache: model -> { versionId, timestamp }
const versionCache = new Map<string, { versionId: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Helper function to get version ID with caching
async function getVersionId(
  model: string,
  apiToken: string,
  providedVersion?: string
): Promise<string | null> {
  if (providedVersion) {
    return providedVersion;
  }

  const cached = versionCache.get(model);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.versionId;
  }

  try {
    const [owner, modelName] = model.split('/');
    if (!owner || !modelName) {
      return null;
    }

    const modelResponse = await fetch(`https://api.replicate.com/v1/models/${owner}/${modelName}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!modelResponse.ok) {
      return null;
    }

    const modelData = await modelResponse.json();
    const versionId = modelData.latest_version?.id;
    
    if (versionId) {
      versionCache.set(model, { versionId, timestamp: Date.now() });
      console.log(`[GENERATE] Found and cached version ID: ${versionId} for model ${model}`);
    }
    
    return versionId || null;
  } catch (error) {
    console.error('[GENERATE] Version lookup failed:', error);
    return null;
  }
}

// Helper function to create prediction
async function createPrediction(
  apiToken: string,
  versionId: string,
  input: Record<string, unknown>,
  model: string
): Promise<{ 
  id: string; 
  status: string; 
} | { error: string; details: unknown }> {
  const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: versionId,
      input: input,
    }),
  });

  if (!predictionResponse.ok) {
    const errorData = await predictionResponse.json().catch(() => ({}));
    return {
      error: 'Replicate API error',
      details: {
        status: predictionResponse.status,
        message: errorData.detail || errorData.error || errorData.message || `HTTP ${predictionResponse.status}`,
        ...errorData
      }
    };
  }

  const prediction = await predictionResponse.json();
  
  console.log(`[GENERATE] Prediction created:`, {
    id: prediction.id,
    status: prediction.status,
    model: model,
    versionId: versionId
  });

  return {
    id: prediction.id,
    status: prediction.status,
  };
}

// Poll prediction status until completion (server-side)
async function pollPredictionStatus(
  predictionId: string,
  apiToken: string
): Promise<{ output: unknown; error?: string; logs?: string }> {
  const startTime = Date.now();
  const timeoutMs = 90000; // 90 seconds max
  const pollInterval = 1200; // 1.2 seconds

  let pollCount = 0;
  while (Date.now() - startTime < timeoutMs) {
    pollCount++;
    
    try {
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        console.error(`[GENERATE] Status check ${pollCount} failed for ${predictionId}:`, {
          status: statusResponse.status,
          error: errorData
        });
        throw new Error(errorData.detail || errorData.error || errorData.message || `HTTP ${statusResponse.status}`);
      }

      const prediction = await statusResponse.json();
      
      console.log(`[GENERATE] Status check ${pollCount} for ${predictionId}:`, {
        status: prediction.status,
        elapsed: Date.now() - startTime,
        hasOutput: !!prediction.output,
        hasError: !!prediction.error,
        hasLogs: !!prediction.logs
      });

      if (prediction.status === 'succeeded') {
        console.log(`[GENERATE] Prediction ${predictionId} succeeded:`, {
          outputType: typeof prediction.output,
          outputIsArray: Array.isArray(prediction.output),
          outputPreview: Array.isArray(prediction.output) 
            ? `Array[${prediction.output.length}]` 
            : typeof prediction.output === 'string' 
              ? prediction.output.substring(0, 100) 
              : JSON.stringify(prediction.output).substring(0, 100)
        });
        return { output: prediction.output };
      } else if (prediction.status === 'failed') {
        console.error(`[GENERATE] Prediction ${predictionId} failed:`, {
          error: prediction.error,
          logs: prediction.logs
        });
        return {
          output: null,
          error: prediction.error || 'Prediction failed',
          logs: prediction.logs
        };
      } else if (prediction.status === 'canceled') {
        console.warn(`[GENERATE] Prediction ${predictionId} was canceled`);
        return {
          output: null,
          error: 'Prediction was canceled'
        };
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error(`[GENERATE] Error polling prediction ${predictionId}:`, error);
      throw error;
    }
  }
  
  console.error(`[GENERATE] Prediction ${predictionId} timed out after ${timeoutMs}ms (${pollCount} polls)`);
  throw new Error('Prediction timeout - still generating after 90 seconds. Please try again.');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    console.error('[GENERATE] REPLICATE_API_TOKEN is missing');
    return res.status(500).json({ 
      error: 'Replicate API token not configured',
      message: 'Please set REPLICATE_API_TOKEN in Vercel environment variables'
    });
  }

  try {
    const { model, input, version, task } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input parameters are required' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    console.log(`[GENERATE] Starting generation:`, {
      model,
      version: version || 'latest',
      task: task || 'auto-detect',
      inputKeys: Object.keys(input),
      timestamp: new Date().toISOString()
    });

    // Get version ID
    const versionId = await getVersionId(model, apiToken, version);
    if (!versionId) {
      return res.status(400).json({
        error: 'Model version not found',
        message: `Could not determine version for model ${model}. The model may not exist or may have been removed.`,
        model: model
      });
    }

    // Determine task type for face swap
    const isFaceSwap = task === 'faceswap' || model === 'ddvinh1/inswapper';
    
    let cleanedInput: Record<string, unknown>;
    
    if (isFaceSwap) {
      // Normalize input aliases for face swap
      const sourceAliases = ['source_img', 'source_image', 'source'];
      const targetAliases = ['target_img', 'target_image', 'target'];
      
      let sourceImg: string | undefined;
      let targetImg: string | undefined;
      
      for (const alias of sourceAliases) {
        if (input[alias] && typeof input[alias] === 'string') {
          sourceImg = String(input[alias]).trim();
          break;
        }
      }
      
      for (const alias of targetAliases) {
        if (input[alias] && typeof input[alias] === 'string') {
          targetImg = String(input[alias]).trim();
          break;
        }
      }

      if (!sourceImg || !targetImg) {
        return res.status(400).json({
          error: 'Missing required image inputs for face swap',
          message: 'Both source_img and target_img must be provided',
          received: {
            has_source: !!sourceImg,
            has_target: !!targetImg,
            inputKeys: Object.keys(input)
          }
        });
      }

      // Validate URLs
      if (!sourceImg.startsWith('http://') && !sourceImg.startsWith('https://')) {
        return res.status(400).json({
          error: 'Invalid source image',
          message: 'source_img must be a valid HTTP/HTTPS URL',
        });
      }

      cleanedInput = {
        source_img: sourceImg,
        target_img: targetImg,
        upscale: 1, // No upscaling
      };

      console.log(`[GENERATE] Using face swap (INSwapper) with version: ${versionId}`);
    } else {
      // For other models, pass input as-is (already validated by client)
      cleanedInput = input;
    }

    // Step 1: Create prediction
    const predictionResult = await createPrediction(apiToken, versionId, cleanedInput, model);
    
    if ('error' in predictionResult) {
      return res.status(500).json({
        error: predictionResult.error,
        ...(typeof predictionResult.details === 'object' && predictionResult.details !== null 
          ? predictionResult.details 
          : { details: predictionResult.details })
      });
    }

    const predictionId = predictionResult.id;

    // Step 2: Poll for completion (server-side)
    console.log(`[GENERATE] Starting to poll for prediction ${predictionId}...`);
    const pollResult = await pollPredictionStatus(predictionId, apiToken);

    if (pollResult.error) {
      return res.status(500).json({
        error: pollResult.error,
        logs: pollResult.logs
      });
    }

    if (!pollResult.output) {
      return res.status(500).json({
        error: 'No output received from prediction'
      });
    }

    // Step 3: Extract image URL from output
    const output = pollResult.output;
    let imageUrl: string | null = null;
    
    if (Array.isArray(output)) {
      imageUrl = output.find((item: unknown) => 
        typeof item === 'string' && (item.startsWith('http') || item.startsWith('data:'))
      ) || null;
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object') {
      imageUrl = (output as { url?: string; image?: string; output?: string }).url || 
                 (output as { url?: string; image?: string; output?: string }).image ||
                 (output as { url?: string; image?: string; output?: string }).output ||
                 null;
    }
    
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.length === 0) {
      console.error('[GENERATE] Invalid output format:', {
        outputType: typeof output,
        outputIsArray: Array.isArray(output),
        output: JSON.stringify(output).substring(0, 200)
      });
      return res.status(500).json({
        error: 'Invalid output format from model',
        output: output
      });
    }

    console.log(`[GENERATE] Success! Generated image URL: ${imageUrl.substring(0, 100)}...`);

    // Return the final result
    return res.status(200).json({
      imageUrl,
      predictionId,
      model,
      success: true
    });

  } catch (error: unknown) {
    const err = error as { 
      message?: string; 
      status?: number; 
      statusCode?: number;
    };
    
    console.error('[GENERATE] Handler error:', {
      message: err?.message,
      status: err?.status || err?.statusCode,
      error: error
    });
    
    const httpStatus = err?.status || err?.statusCode || 500;
    const errorMessage = err?.message || 'Internal server error';
    
    return res.status(httpStatus >= 400 && httpStatus < 600 ? httpStatus : 500).json({ 
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}
