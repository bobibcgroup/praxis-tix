import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const { id } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ 
        error: 'Prediction ID is required',
        message: 'Please provide a valid prediction ID'
      });
    }

    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}));
      return res.status(statusResponse.status).json({
        error: 'Failed to fetch prediction status',
        message: errorData.detail || errorData.error || errorData.message || `HTTP ${statusResponse.status}`,
        ...errorData
      });
    }

    const prediction = await statusResponse.json();

    return res.status(200).json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      logs: prediction.logs,
      created_at: prediction.created_at,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
    });

  } catch (error: unknown) {
    const err = error as { 
      message?: string; 
      status?: number; 
      statusCode?: number;
    };
    
    console.error('[ERROR] Status handler error:', {
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
