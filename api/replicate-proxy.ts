import type { VercelRequest, VercelResponse } from '@vercel/node';

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
      console.log(`Found and cached version ID: ${versionId} for model ${model}`);
    }
    
    return versionId || null;
  } catch (error) {
    console.error('Version lookup failed:', error);
    return null;
  }
}

// Helper function to create prediction and handle polling
async function createPrediction(
  apiToken: string,
  versionId: string,
  input: Record<string, unknown>
): Promise<{ output: unknown } | { error: string; details: unknown }> {
  const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait=60',
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

  if (prediction.status === 'succeeded') {
    return { output: prediction.output };
  } else if (prediction.status === 'failed') {
    return {
      error: 'Prediction failed',
      details: {
        message: prediction.error || prediction.detail || 'Prediction failed',
        logs: prediction.logs,
        ...prediction
      }
    };
  } else {
    // Poll for completion
    const predictionId = prediction.id;
    const startTime = Date.now();
    const timeoutMs = 60000;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      if (Date.now() - startTime > timeoutMs) {
        return {
          error: 'Request timeout',
          details: { message: 'Prediction did not complete within 60 seconds' }
        };
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        return {
          error: 'Failed to check prediction status',
          details: {
            status: statusResponse.status,
            message: statusResponse.statusText,
            ...errorData
          }
        };
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'succeeded') {
        return { output: statusData.output };
      } else if (statusData.status === 'failed') {
        return {
          error: 'Prediction failed',
          details: {
            message: statusData.error || statusData.detail || 'Prediction failed',
            logs: statusData.logs,
            ...statusData
          }
        };
      }

      attempts++;
    }

    return {
      error: 'Request timeout',
      details: { message: 'Prediction did not complete within timeout period' }
    };
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check
  if (req.method === 'GET') {
    const hasToken = !!process.env.REPLICATE_API_TOKEN;
    return res.status(200).json({ 
      status: 'ok',
      hasToken,
      message: hasToken 
        ? 'Serverless function is ready' 
        : 'REPLICATE_API_TOKEN not configured'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!apiToken) {
    console.error('REPLICATE_API_TOKEN is missing');
    return res.status(500).json({ 
      error: 'Replicate API token not configured',
      message: 'Please set REPLICATE_API_TOKEN in Vercel environment variables'
    });
  }

  try {
    const { model, input, version, task } = req.body;

    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    if (!input) {
      return res.status(400).json({ error: 'Input parameters are required' });
    }

    console.log(`[${new Date().toISOString()}] Running model: ${model}${version ? ` (version: ${version})` : ''}${task ? ` [task: ${task}]` : ''}`);
    console.log('Input keys:', Object.keys(input));

    // Check if this is an IDM-VTON model - route directly to try-on, bypassing all other detection
    const isIDMVTON = model === 'cuuupid/idm-vton' || model.endsWith('/idm-vton');
    
    let cleanedInput: Record<string, unknown>;
    
    if (isIDMVTON) {
      // Get version ID
      const versionId = await getVersionId(model, apiToken, version);
      if (!versionId) {
        return res.status(400).json({
          error: 'Model version not found',
          message: `Could not determine version for model ${model}. The model may not exist or may have been removed.`,
          model: model
        });
      }

      // Normalize garment/person keys for IDM-VTON
      const humanAliases = ['human_img', 'human', 'human_image', 'person_img', 'model_img'];
      const garmAliases = ['garm_img', 'garment_img', 'garment', 'garment_image'];
      const garmentDesAliases = ['garment_des', 'garment_description', 'garment_desc'];
      
      let humanImg: string | undefined;
      let garmImg: string | undefined;
      
      for (const alias of humanAliases) {
        if (input[alias] && typeof input[alias] === 'string') {
          humanImg = String(input[alias]).trim();
          break;
        }
      }
      
      for (const alias of garmAliases) {
        if (input[alias] && typeof input[alias] === 'string') {
          garmImg = String(input[alias]).trim();
          break;
        }
      }

      // Validate required fields
      if (!humanImg || !garmImg) {
        const missingFields: string[] = [];
        if (!humanImg) missingFields.push('human_img (or human, human_image, person_img, model_img)');
        if (!garmImg) missingFields.push('garm_img (or garment_img, garment, garment_image)');
        
        return res.status(400).json({
          error: 'Missing required image inputs for IDM-VTON',
          message: 'Both human_img and garm_img must be provided',
          missingFields: missingFields,
          received: {
            has_human_img: !!humanImg,
            has_garm_img: !!garmImg,
            inputKeys: Object.keys(input)
          }
        });
      }

      // Validate URLs - reject large data URLs
      if (!humanImg.startsWith('http://') && !humanImg.startsWith('https://')) {
        return res.status(400).json({
          error: 'Invalid human_img',
          message: 'human_img must be a valid HTTP/HTTPS URL (data URLs not supported to avoid Vercel limits)',
        });
      }

      if (!garmImg.startsWith('http://') && !garmImg.startsWith('https://')) {
        return res.status(400).json({
          error: 'Invalid garm_img',
          message: 'garm_img must be a valid HTTP/HTTPS URL (data URLs not supported to avoid Vercel limits)',
        });
      }

      // Get garment description
      let garmentDes = 'clothing';
      for (const alias of garmentDesAliases) {
        if (input[alias] && typeof input[alias] === 'string') {
          garmentDes = String(input[alias]).trim();
          break;
        }
      }

      // Build cleaned input with optional parameters
      cleanedInput = {
        human_img: humanImg,
        garm_img: garmImg,
        garment_des: garmentDes,
      };

      // Optional parameters
      if (input.steps !== undefined) {
        const steps = Number(input.steps);
        if (!isNaN(steps)) {
          cleanedInput.steps = Math.max(20, Math.min(40, Math.round(steps))); // Clamp 20..40
        }
      } else {
        cleanedInput.steps = 30; // Default
      }

      if (input.seed !== undefined) {
        const seed = Number(input.seed);
        if (!isNaN(seed)) {
          cleanedInput.seed = Math.round(seed);
        }
      } else {
        cleanedInput.seed = 42; // Default
      }

      if (input.mask_img !== undefined && typeof input.mask_img === 'string' && input.mask_img.trim()) {
        const maskImg = String(input.mask_img).trim();
        if (maskImg.startsWith('http://') || maskImg.startsWith('https://')) {
          cleanedInput.mask_img = maskImg;
        }
      }

      console.log(`Using IDM-VTON (try-on) with version: ${versionId}`);
      console.log('Input:', {
        human_img: humanImg.substring(0, 100),
        garm_img: garmImg.substring(0, 100),
        garment_des: garmentDes,
        steps: cleanedInput.steps,
        seed: cleanedInput.seed,
        has_mask_img: !!cleanedInput.mask_img
      });

      const result = await createPrediction(apiToken, versionId, cleanedInput);
      
      if ('error' in result) {
        return res.status(500).json({
          error: result.error,
          ...(typeof result.details === 'object' && result.details !== null ? result.details : { details: result.details })
        });
      }

      return res.status(200).json({ output: result.output });
    }

    // Determine task type: explicit task field OR infer from model name
    let taskType: 'faceswap' | 'tryon' | 'instantid' | null = null;
    
    if (task) {
      if (task === 'faceswap' || task === 'tryon' || task === 'instantid') {
        taskType = task;
      } else {
        return res.status(400).json({
          error: 'Invalid task',
          message: `Task must be one of: "faceswap", "tryon", "instantid"`,
          received: task
        });
      }
    } else {
      // Fallback: infer from model name (for backward compatibility)
      // NOTE: IDM-VTON models are already handled above, so they won't reach here
      if (model === 'ddvinh1/inswapper') {
        taskType = 'faceswap';
      } else if (model.includes('vton') || model.includes('try-on')) {
        taskType = 'tryon';
      } else if (model.includes('instant-id') || model.includes('instantid')) {
        taskType = 'instantid';
      }
    }

    // Get version ID
    const versionId = await getVersionId(model, apiToken, version);
    if (!versionId) {
      return res.status(400).json({
        error: 'Model version not found',
        message: `Could not determine version for model ${model}. The model may not exist or may have been removed.`,
        model: model
      });
    }

    let cleanedInput: Record<string, unknown>;
    let warnings: string[] = [];

    // Task: Face Swap (only if NOT IDM-VTON)
    if ((taskType === 'faceswap' || model === 'ddvinh1/inswapper') && !isIDMVTON) {
      // Normalize input aliases - ONLY accept faceswap-specific aliases
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

      if (!targetImg.startsWith('http://') && !targetImg.startsWith('https://') && !targetImg.startsWith('data:')) {
        return res.status(400).json({
          error: 'Invalid target image',
          message: 'target_img must be a valid URL or data URL',
        });
      }

      // Check for full-body images (warning only)
      if (sourceImg.includes('full') || sourceImg.includes('body') || sourceImg.includes('fullbody')) {
        warnings.push('Best results come from a tight face crop; avoid visible hairline');
      }

      // Prepare conservative input for INSwapper
      cleanedInput = {
        source_img: sourceImg,
        target_img: targetImg,
        upscale: 1, // No upscaling
      };

      console.log(`Using face swap (INSwapper) with version: ${versionId}`);
      console.log('Input:', {
        source_img: sourceImg.substring(0, 100),
        target_img: targetImg.substring(0, 100),
        upscale: 1
      });

      const result = await createPrediction(apiToken, versionId, cleanedInput);
      
      if ('error' in result) {
        return res.status(500).json({
          error: result.error,
          ...(typeof result.details === 'object' && result.details !== null ? result.details : { details: result.details })
        });
      }

      const response: { output: unknown; warnings?: string[] } = { output: result.output };
      if (warnings.length > 0) {
        response.warnings = warnings;
      }
      return res.status(200).json(response);
    }

    // Task: Virtual Try-On (only if NOT IDM-VTON, which is handled above)
    if (taskType === 'tryon' && !isIDMVTON) {
      const humanImg = String(input.human_img || input.human || input.human_image || '').trim();
      const garmImg = String(input.garm_img || input.garment || input.garment_img || input.garment_image || '').trim();
      
      if (!humanImg || !garmImg) {
        return res.status(400).json({
          error: 'Missing required image inputs for try-on',
          message: 'Both human_img and garm_img must be provided and non-empty',
          received: {
            has_human_img: !!humanImg,
            has_garm_img: !!garmImg,
            inputKeys: Object.keys(input)
          }
        });
      }

      const garmentDes = input.garment_des || input.garment_description || 'clothing';
      
      cleanedInput = {
        human_img: humanImg,
        garm_img: garmImg,
        garment_des: String(garmentDes).trim(),
      };

      console.log(`Using try-on model: ${model} with version: ${versionId}`);
      
      const result = await createPrediction(apiToken, versionId, cleanedInput);
      
      if ('error' in result) {
        return res.status(500).json({
          error: result.error,
          ...(typeof result.details === 'object' && result.details !== null ? result.details : { details: result.details })
        });
      }

      return res.status(200).json({ output: result.output });
    }

    // Task: InstantID (only if NOT IDM-VTON)
    if (taskType === 'instantid' && !isIDMVTON) {
      const faceImg = String(input.face_image || '').trim();
      const targetImg = String(input.image || '').trim();
      
      if (!faceImg || !targetImg) {
        return res.status(400).json({
          error: 'Missing required image inputs for InstantID',
          message: 'Both face_image and image must be provided and non-empty',
          received: {
            has_face_image: !!faceImg,
            has_image: !!targetImg,
            inputKeys: Object.keys(input)
          }
        });
      }

      cleanedInput = {
        face_image: faceImg,
        image: targetImg,
        controlnet_conditioning_scale: input.controlnet_conditioning_scale || 0.8,
        ip_adapter_scale: input.ip_adapter_scale || 0.8,
      };

      console.log(`Using InstantID model: ${model} with version: ${versionId}`);
      
      const result = await createPrediction(apiToken, versionId, cleanedInput);
      
      if ('error' in result) {
        return res.status(500).json({
          error: result.error,
          ...(typeof result.details === 'object' && result.details !== null ? result.details : { details: result.details })
        });
      }

      return res.status(200).json({ output: result.output });
    }

    // Unknown task/model combination
    return res.status(400).json({
      error: 'Unknown task or model type',
      message: 'Could not determine task type. Please provide a "task" field: "faceswap", "tryon", or "instantid"',
      model: model,
      inputKeys: Object.keys(input),
      hint: 'Add "task": "faceswap" | "tryon" | "instantid" to your request body'
    });

  } catch (error: unknown) {
    const err = error as { 
      message?: string; 
      status?: number; 
      statusCode?: number;
    };
    
    console.error('[ERROR] Handler error:', {
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

/*
 * Example request body for IDM-VTON (cuuupid/idm-vton):
 * 
 * {
 *   "model": "cuuupid/idm-vton",
 *   "input": {
 *     "human_img": "https://example.com/person.jpg",
 *     "garm_img": "https://example.com/outfit.jpg",
 *     "garment_des": "clothing",
 *     "steps": 30,
 *     "seed": 42,
 *     "mask_img": "https://example.com/mask.jpg"  // optional
 *   }
 * }
 * 
 * Input aliases supported:
 * - human_img: human_img, human, human_image, person_img, model_img
 * - garm_img: garm_img, garment_img, garment, garment_image
 * - garment_des: garment_des, garment_description, garment_desc (default: "clothing")
 * 
 * Optional parameters:
 * - steps: integer, default 30, clamped to 20-40
 * - seed: integer, default 42
 * - mask_img: string URL (optional)
 * 
 * Note: Both human_img and garm_img must be HTTP/HTTPS URLs (data URLs rejected).
 */
