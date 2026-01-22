import type { VercelRequest, VercelResponse } from '@vercel/node';
import Replicate from 'replicate';

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
    const { model, input, version } = req.body;

    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    if (!input) {
      return res.status(400).json({ error: 'Input parameters are required' });
    }

    console.log(`[${new Date().toISOString()}] Running model: ${model}${version ? ` (version: ${version})` : ''}`);
    console.log('Input keys:', Object.keys(input));
    
    // Validate image inputs exist - support try-on, face swap, InstantID, and INSwapper models
    // Try-on models: human_img/human, garm_img/garment
    // Face swap models: source_image, target_image
    // InstantID models: face_image, image
    // INSwapper model: source_img, target_img
    const isINSwapper = model === 'ddvinh1/inswapper';
    const hasTryOnInputs = !!(input.garment || input.garment_img || input.garment_image || input.garm_img) && 
                           !!(input.human || input.human_img || input.human_image);
    const hasFaceSwapInputs = !!(input.source_image && input.target_image);
    const hasINSwapperInputs = !!(input.source_img && input.target_img);
    const hasInstantIDInputs = !!(input.face_image && input.image);
    
    if (!hasTryOnInputs && !hasFaceSwapInputs && !hasInstantIDInputs && !hasINSwapperInputs) {
      return res.status(400).json({ 
        error: 'Missing required image inputs',
        details: { 
          hasTryOnInputs,
          hasFaceSwapInputs,
          hasInstantIDInputs,
          hasINSwapperInputs,
          inputKeys: Object.keys(input)
        }
      });
    }

    // Validate that image inputs are valid URLs or data URLs
    // Determine which type of model based on input fields
    const isInstantID = hasInstantIDInputs;
    const isFaceSwap = hasFaceSwapInputs && !isInstantID && !isINSwapper;
    const requiredFields = isINSwapper
      ? ['source_img', 'target_img']
      : isInstantID
        ? ['face_image', 'image']
        : isFaceSwap 
          ? ['source_image', 'target_image']
          : ['human_img', 'garm_img'];
    
    for (const field of requiredFields) {
      if (!input[field] || (typeof input[field] === 'string' && input[field].trim() === '')) {
        return res.status(400).json({
          error: 'Missing required field',
          message: `Field ${field} is required but was ${input[field] === undefined ? 'undefined' : 'empty'}`,
        });
      }
      
      const value = input[field];
      if (typeof value !== 'string' || (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:'))) {
        return res.status(400).json({
          error: 'Invalid image input',
          message: `Field ${field} must be a valid URL or data URL`,
        });
      }
      
      if (value.startsWith('data:') && value.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          error: 'Image too large',
          message: 'Data URL images must be under 10MB. Please use Supabase Storage or another image hosting service.',
        });
      }
      
      if (value.startsWith('data:') && !value.includes('base64,')) {
        return res.status(400).json({
          error: 'Invalid data URL format',
          message: `Field ${field} must be a valid base64 data URL`,
        });
      }
    }

    // Get version ID for the model
    let versionId = version;
    
    if (!versionId) {
      try {
        const [owner, modelName] = model.split('/');
        if (owner && modelName) {
          const modelResponse = await fetch(`https://api.replicate.com/v1/models/${owner}/${modelName}`, {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
            },
          });
          
          if (modelResponse.ok) {
            const modelData = await modelResponse.json();
            versionId = modelData.latest_version?.id;
            if (versionId) {
              console.log(`Found version ID: ${versionId} for model ${model}`);
            }
          } else if (modelResponse.status === 404) {
            return res.status(404).json({
              error: 'Model not found',
              message: `Model ${model} does not exist or has been removed.`,
              model: model
            });
          }
        }
      } catch (versionError) {
        console.error('Version lookup failed:', versionError);
      }
    }
    
    if (!versionId) {
      return res.status(400).json({
        error: 'Model version not found',
        message: `Could not determine version for model ${model}. The model may not exist or may have been removed.`,
        model: model
      });
    }
    
    // Prepare cleaned input based on model type
    let cleanedInput: Record<string, string | number | boolean>;
    
    if (isINSwapper) {
      // INSwapper model: source_img and target_img
      const sourceImg = String(input.source_img || '').trim();
      const targetImg = String(input.target_img || '').trim();
      
      if (!sourceImg || !targetImg) {
        return res.status(400).json({
          error: 'Missing required image inputs',
          message: 'Both source_img and target_img must be provided and non-empty',
          received: {
            has_source_img: !!sourceImg,
            has_target_img: !!targetImg,
          }
        });
      }
      
      cleanedInput = {
        source_img: sourceImg,
        target_img: targetImg,
      };
    } else if (isInstantID) {
      // InstantID models: face_image and image
      const faceImg = String(input.face_image || '').trim();
      const targetImg = String(input.image || '').trim();
      
      if (!faceImg || !targetImg) {
        return res.status(400).json({
          error: 'Missing required image inputs',
          message: 'Both face_image and image must be provided and non-empty',
          received: {
            has_face_image: !!faceImg,
            has_image: !!targetImg,
          }
        });
      }
      
      cleanedInput = {
        face_image: faceImg,
        image: targetImg,
        // InstantID parameters for better identity preservation
        controlnet_conditioning_scale: input.controlnet_conditioning_scale || 0.8,
        ip_adapter_scale: input.ip_adapter_scale || 0.8,
      };
    } else if (isFaceSwap) {
      // Face swap models: source_image and target_image
      const sourceImg = String(input.source_image || '').trim();
      const targetImg = String(input.target_image || '').trim();
      
      if (!sourceImg || !targetImg) {
        return res.status(400).json({
          error: 'Missing required image inputs',
          message: 'Both source_image and target_image must be provided and non-empty',
          received: {
            has_source_image: !!sourceImg,
            has_target_image: !!targetImg,
          }
        });
      }
      
      cleanedInput = {
        source_image: sourceImg,
        target_image: targetImg,
      };
      
      // Add optional parameters if provided
      if (input.strength !== undefined) cleanedInput.strength = Number(input.strength);
      if (input.blend_ratio !== undefined) cleanedInput.blend_ratio = Number(input.blend_ratio);
      if (input.preserve_identity !== undefined) cleanedInput.preserve_identity = Boolean(input.preserve_identity);
    } else {
      // Try-on models: human_img, garm_img, and garment_des
      const humanImg = String(input.human_img || '').trim();
      const garmImg = String(input.garm_img || '').trim();
      
      if (!humanImg || !garmImg) {
        return res.status(400).json({
          error: 'Missing required image inputs',
          message: 'Both human_img and garm_img must be provided and non-empty',
          received: {
            has_human_img: !!humanImg,
            has_garm_img: !!garmImg,
          }
        });
      }
      
      const garmentDes = input.garment_des || input.garment_description || 'clothing';
      
      cleanedInput = {
        human_img: humanImg,
        garm_img: garmImg,
        garment_des: String(garmentDes).trim(),
      };
    }
    
    console.log(`Using model: ${model} with version: ${versionId} (${isINSwapper ? 'INSwapper' : isFaceSwap ? 'face swap' : isInstantID ? 'InstantID' : 'try-on'})`);
    console.log('Sending to Replicate:', {
      inputKeys: Object.keys(cleanedInput),
      preview: Object.fromEntries(
        Object.entries(cleanedInput).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.substring(0, 100) : value
        ])
      ),
    });
    
    // Create prediction using Replicate API
    const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60',
      },
      body: JSON.stringify({
        version: versionId,
        input: cleanedInput,
      }),
    });

    if (!predictionResponse.ok) {
      const errorData = await predictionResponse.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || errorData.message || `HTTP ${predictionResponse.status}`;
      
      console.error('Replicate API error:', {
        status: predictionResponse.status,
        error: errorMessage,
        errorData: JSON.stringify(errorData),
      });
      
      return res.status(predictionResponse.status >= 400 && predictionResponse.status < 500 ? predictionResponse.status : 500).json({
        error: 'Replicate API error',
        message: errorMessage,
        status: predictionResponse.status,
      });
    }

    const prediction = await predictionResponse.json();
    
    // Handle prediction result
    if (prediction.status === 'succeeded') {
      return res.status(200).json({ output: prediction.output });
    } else if (prediction.status === 'failed') {
      const errorMsg = prediction.error || prediction.detail || 'Prediction failed';
      console.error('Prediction failed:', {
        status: prediction.status,
        error: errorMsg,
        logs: prediction.logs,
      });
      return res.status(500).json({
        error: 'Prediction failed',
        message: errorMsg,
      });
    } else {
      // Prediction is still processing, poll for completion
      const predictionId = prediction.id;
      console.log(`Prediction ${predictionId} status: ${prediction.status}, polling...`);
      
      const startTime = Date.now();
      const timeoutMs = 60000;
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        if (Date.now() - startTime > timeoutMs) {
          return res.status(504).json({
            error: 'Request timeout',
            message: 'Prediction did not complete within 60 seconds',
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        });

        if (!statusResponse.ok) {
          return res.status(statusResponse.status).json({
            error: 'Failed to check prediction status',
            message: statusResponse.statusText,
          });
        }

        const statusData = await statusResponse.json();
        
        if (statusData.status === 'succeeded') {
          return res.status(200).json({ output: statusData.output });
        } else if (statusData.status === 'failed') {
          const errorMsg = statusData.error || statusData.detail || 'Prediction failed';
          return res.status(500).json({
            error: 'Prediction failed',
            message: errorMsg,
          });
        }
        
        attempts++;
      }

      return res.status(504).json({
        error: 'Request timeout',
        message: 'Prediction did not complete within timeout period',
      });
    }
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
