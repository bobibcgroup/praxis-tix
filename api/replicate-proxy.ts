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
    
    // Validate image inputs exist
    const hasGarment = !!(input.garment || input.garment_img || input.garment_image || input.garm_img);
    const hasHuman = !!(input.human || input.human_img || input.human_image);
    
    if (!hasGarment || !hasHuman) {
      return res.status(400).json({ 
        error: 'Missing required image inputs',
        details: { 
          hasGarment, 
          hasHuman,
          inputKeys: Object.keys(input)
        }
      });
    }

    // Validate that image inputs are valid URLs or data URLs
    const requiredFields = ['human_img', 'garm_img'];
    
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
    
    // Prepare cleaned input - ensure values are strings and not null/undefined
    const humanImg = String(input.human_img || '').trim();
    const garmImg = String(input.garm_img || '').trim();
    
    if (!humanImg || !garmImg) {
      return res.status(400).json({
        error: 'Missing required image inputs',
        message: 'Both human_img and garm_img must be provided and non-empty',
        received: {
          has_human_img: !!humanImg,
          has_garm_img: !!garmImg,
          human_img_length: humanImg.length,
          garm_img_length: garmImg.length,
        }
      });
    }
    
    // The model requires garment_des (garment description) parameter
    // If not provided, use a default description
    const garmentDes = input.garment_des || input.garment_description || 'clothing';
    
    const cleanedInput: Record<string, string> = {
      human_img: humanImg,
      garm_img: garmImg,
      garment_des: String(garmentDes).trim(),
    };
    
    console.log(`Using model: ${model} with version: ${versionId}`);
    console.log('Sending to Replicate:', {
      human_img_preview: humanImg.substring(0, 100),
      garm_img_preview: garmImg.substring(0, 100),
      human_img_type: humanImg.startsWith('http') ? 'URL' : humanImg.startsWith('data:') ? 'data URL' : 'unknown',
      garm_img_type: garmImg.startsWith('http') ? 'URL' : garmImg.startsWith('data:') ? 'data URL' : 'unknown',
    });
    
    // Verify URLs are accessible (for HTTP URLs only)
    if (humanImg.startsWith('http')) {
      try {
        const check = await fetch(humanImg, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (!check.ok) {
          console.warn(`human_img URL returned status ${check.status}`);
        }
      } catch (e) {
        console.warn('Could not verify human_img URL:', e);
      }
    }
    
    if (garmImg.startsWith('http')) {
      try {
        const check = await fetch(garmImg, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (!check.ok) {
          console.warn(`garm_img URL returned status ${check.status}`);
        }
      } catch (e) {
        console.warn('Could not verify garm_img URL:', e);
      }
    }
    
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
