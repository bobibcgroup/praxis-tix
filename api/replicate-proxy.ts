import type { VercelRequest, VercelResponse } from '@vercel/node';
import Replicate from 'replicate';

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

  const replicate = new Replicate({ auth: apiToken });

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
    console.log('Request URL:', req.url);
    console.log('Request body model:', model);
    
    // Validate image inputs exist (check multiple possible field names)
    // Support various naming conventions: garment/garment_img/garm_img, human/human_img
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
    const imageFields = ['human_img', 'garm_img', 'human', 'garment', 'garment_img', 'human_image', 'garment_image'];
    const requiredFields = ['human_img', 'garm_img']; // Required fields for cuuupid/idm-vton
    
    // Check required fields exist
    for (const field of requiredFields) {
      if (!input[field] || (typeof input[field] === 'string' && input[field].trim() === '')) {
        return res.status(400).json({
          error: 'Missing required field',
          message: `Field ${field} is required but was ${input[field] === undefined ? 'undefined' : 'empty'}`,
          received: input[field]
        });
      }
    }
    
    // Validate all image fields
    for (const field of imageFields) {
      if (input[field]) {
        const value = input[field];
        // Check if it's a valid URL or data URL
        if (typeof value !== 'string' || (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:'))) {
          return res.status(400).json({
            error: 'Invalid image input',
            message: `Field ${field} must be a valid URL or data URL`,
            received: typeof value === 'string' ? value.substring(0, 100) : typeof value
          });
        }
        // Check data URL isn't too large (Replicate has limits)
        if (value.startsWith('data:') && value.length > 10 * 1024 * 1024) { // 10MB limit
          return res.status(400).json({
            error: 'Image too large',
            message: 'Data URL images must be under 10MB. Please use Supabase Storage or another image hosting service.',
          });
        }
        // Check data URL format is valid
        if (value.startsWith('data:') && !value.includes('base64,')) {
          return res.status(400).json({
            error: 'Invalid data URL format',
            message: `Field ${field} must be a valid base64 data URL`,
          });
        }
      }
    }
    
    // Verify HTTP URLs are accessible (quick HEAD request)
    for (const field of ['human_img', 'garm_img']) {
      if (input[field] && input[field].startsWith('http')) {
        try {
          const urlCheck = await fetch(input[field], { method: 'HEAD', signal: AbortSignal.timeout(5000) });
          if (!urlCheck.ok) {
            console.warn(`URL ${field} returned status ${urlCheck.status}, but continuing anyway`);
          }
        } catch (urlError) {
          console.warn(`Could not verify URL ${field}:`, urlError);
          // Continue anyway - might be CORS or network issue, but Replicate might still be able to access it
        }
      }
    }

    // For community models, use the Replicate API directly with version ID
    // Community models require POST /v1/predictions with version identifier
    let versionId = version;
    
    if (!versionId) {
      // Try to get the latest version using the SDK
      try {
        const [owner, modelName] = model.split('/');
        if (owner && modelName) {
          const modelInfo = await replicate.models.get(owner, modelName);
          versionId = modelInfo.latest_version?.id;
          
          if (versionId) {
            console.log(`Found version ID: ${versionId} for model ${model}`);
          } else {
            console.warn(`No version found for model ${model}`);
          }
        }
      } catch (versionError: unknown) {
        const verr = versionError as { status?: number; message?: string };
        // If model doesn't exist (404), throw early
        if (verr.status === 404) {
          throw {
            status: 404,
            statusCode: 404,
            message: `Model ${model} not found`,
            response: {
              status: 404,
              statusText: 'Not Found',
              data: { detail: 'The requested model could not be found.' },
            },
          };
        }
        console.warn(`Could not get version for ${model}, will try SDK run method:`, versionError);
      }
    }

    let output: string | string[];
    
    if (!versionId) {
      return res.status(400).json({
        error: 'Model version not found',
        message: `Could not determine version for model ${model}. The model may not exist or may have been removed.`,
        model: model
      });
    }
    
    // Use direct API call for community models with version ID
    console.log(`Using direct API call for community model: ${model}:${versionId}`);
    console.log('Input summary:', {
      keys: Object.keys(input),
      human_img_type: input.human_img?.substring(0, 50),
      garm_img_type: input.garm_img?.substring(0, 50),
      human_img_length: input.human_img?.length,
      garm_img_length: input.garm_img?.length,
    });
    
    // Ensure we only send the fields the model expects
    const cleanedInput: Record<string, string> = {};
    if (input.human_img) cleanedInput.human_img = input.human_img;
    if (input.garm_img) cleanedInput.garm_img = input.garm_img;
    
    if (!cleanedInput.human_img || !cleanedInput.garm_img) {
      return res.status(400).json({
        error: 'Missing required image inputs',
        message: 'Both human_img and garm_img are required',
        received: {
          has_human_img: !!cleanedInput.human_img,
          has_garm_img: !!cleanedInput.garm_img,
        }
      });
    }
      
      const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: versionId,
          input: cleanedInput,
        }),
      });

      if (!predictionResponse.ok) {
        const errorData = await predictionResponse.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.error || errorData.message || `HTTP ${predictionResponse.status}`;
        
        // Log detailed error for debugging
        console.error('Replicate API error:', {
          status: predictionResponse.status,
          error: errorMessage,
          errorData: JSON.stringify(errorData),
          inputKeys: Object.keys(input),
        });
        
        throw {
          status: predictionResponse.status,
          statusCode: predictionResponse.status,
          message: errorMessage,
          response: {
            status: predictionResponse.status,
            statusText: predictionResponse.statusText,
            data: errorData,
          },
        };
      }

      const prediction = await predictionResponse.json();
      const predictionId = prediction.id;

      // Poll for completion with timeout
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max
      const startTime = Date.now();
      const timeoutMs = 60000; // 60 seconds total timeout

      while (!completed && attempts < maxAttempts) {
        // Check overall timeout
        if (Date.now() - startTime > timeoutMs) {
          throw new Error('Request timeout after 60s');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        });

        if (!statusResponse.ok) {
          throw {
            status: statusResponse.status,
            message: `Failed to check prediction status: ${statusResponse.statusText}`,
          };
        }

        const statusData = await statusResponse.json();
        
        if (statusData.status === 'succeeded') {
          output = statusData.output;
          completed = true;
        } else if (statusData.status === 'failed') {
          const errorMsg = statusData.error || statusData.detail || 'Prediction failed';
          console.error('Prediction failed:', {
            status: statusData.status,
            error: errorMsg,
            logs: statusData.logs,
          });
          throw {
            status: 500,
            statusCode: 500,
            message: errorMsg,
            response: {
              status: 500,
              data: statusData,
            },
          };
        }
        
        attempts++;
      }

      if (!completed) {
        throw new Error('Request timeout after 60s');
      }
    } else {
      // Fall back to SDK for official models or if version lookup failed
      console.log(`Using SDK run method for model: ${model}`);
      output = await Promise.race([
        replicate.run(model as string, { input }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 60s')), 60000)
        )
      ]) as string | string[];
    }

    console.log('Model completed:', { 
      outputType: typeof output,
      isArray: Array.isArray(output),
      outputLength: Array.isArray(output) ? output.length : 'N/A'
    });

    res.status(200).json({ output });
  } catch (error: unknown) {
    const err = error as { 
      message?: string; 
      status?: number; 
      statusCode?: number; 
      response?: { 
        data?: unknown;
        status?: number;
        statusText?: string;
      };
    };
    
    // Extract error details from Replicate SDK error
    const errorDetails = err?.response?.data || {};
    const errorString = JSON.stringify(errorDetails);
    const httpStatus = err?.status || err?.statusCode || err?.response?.status;
    
    console.error('[ERROR] Replicate API error:', {
      message: err?.message,
      status: httpStatus,
      statusCode: err?.statusCode,
      responseStatus: err?.response?.status,
      responseStatusText: err?.response?.statusText,
      details: errorString,
      model: req.body?.model
    });
    
    // Handle model not found (404) - forward the status code properly
    if (httpStatus === 404 || errorString.includes('404') || errorString.includes('not found') || err?.message?.includes('404')) {
      return res.status(404).json({ 
        error: 'Model not found',
        message: 'The requested model does not exist or has been removed.',
        details: errorString || err?.message,
        model: req.body?.model
      });
    }
    
    // Handle rate limiting (429)
    if (err?.status === 429 || err?.statusCode === 429 || errorString.includes('429') || errorString.includes('rate limit')) {
      const retryAfter = (errorDetails as { retry_after?: number })?.retry_after || 10;
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please add a payment method to your Replicate account to increase rate limits. See: https://replicate.com/account/billing',
        retryAfter,
        details: errorString.includes('payment method') 
          ? 'Your rate limit is reduced until you add a payment method. Visit https://replicate.com/account/billing to upgrade.'
          : `Rate limit resets in ~${retryAfter}s`
      });
    }
    
    // Provide helpful error messages
    let errorMessage = 'Failed to generate image';
    let statusCode = 500;
    
    if (err?.message?.includes('timeout')) {
      errorMessage = 'Request timed out. The model may be slow or overloaded.';
    } else if (err?.status === 401 || err?.statusCode === 401 || err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
      errorMessage = 'Invalid API token. Check REPLICATE_API_TOKEN in Vercel.';
      statusCode = 401;
    } else if (err?.status === 400 || err?.statusCode === 400) {
      errorMessage = 'Invalid request. Check image format and model inputs.';
      statusCode = 400;
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      message: err?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? errorString : undefined
    });
  }
}
