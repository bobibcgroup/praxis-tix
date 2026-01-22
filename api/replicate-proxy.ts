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
    const { model, input } = req.body;

    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    if (!input) {
      return res.status(400).json({ error: 'Input parameters are required' });
    }

    console.log(`[${new Date().toISOString()}] Running model: ${model}`);
    console.log('Input keys:', Object.keys(input));
    
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

    // Run the model with timeout
    const output = await Promise.race([
      replicate.run(model as string, { input }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 60s')), 60000)
      )
    ]) as string | string[];

    console.log('Model completed:', { 
      outputType: typeof output,
      isArray: Array.isArray(output),
      outputLength: Array.isArray(output) ? output.length : 'N/A'
    });

    res.status(200).json({ output });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; statusCode?: number; response?: { data?: unknown } };
    const errorDetails = err?.response?.data || {};
    const errorString = JSON.stringify(errorDetails);
    
    console.error('[ERROR] Replicate API error:', {
      message: err?.message,
      status: err?.status,
      statusCode: err?.statusCode,
      details: errorString
    });
    
    // Handle model not found (404)
    if (err?.status === 404 || err?.statusCode === 404 || errorString.includes('404') || errorString.includes('not found')) {
      return res.status(404).json({ 
        error: 'Model not found',
        message: 'The requested model does not exist or has been removed. Trying alternative models...',
        details: errorString
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
