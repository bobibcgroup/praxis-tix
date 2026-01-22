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
    const hasGarment = !!(input.garment || input.garment_img || input.garment_image);
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
    
    if (versionId) {
      // Use direct API call for community models with version ID
      console.log(`Using direct API call for community model: ${model}:${versionId}`);
      
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
        throw {
          status: predictionResponse.status,
          statusCode: predictionResponse.status,
          message: errorData.detail || errorData.error || `HTTP ${predictionResponse.status}`,
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
          throw {
            status: 500,
            message: statusData.error || 'Prediction failed',
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
