import type { VercelRequest, VercelResponse } from '@vercel/node';

// Version ID cache: model -> { versionId, timestamp }
const versionCache = new Map<string, { versionId: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

    // Normalize input aliases for face swap detection
    const normalizedInput: Record<string, unknown> = { ...input };
    
    // Map source image aliases to source_img
    const sourceAliases = ['source_img', 'source_image', 'face_image', 'source', 'swap_image'];
    const targetAliases = ['target_img', 'target_image', 'image', 'target', 'target_video'];
    
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

    // Determine model type
    const isINSwapper = model === 'ddvinh1/inswapper';
    const isFaceSwap = isINSwapper || (!!sourceImg && !!targetImg);
    const hasTryOnInputs = !!(input.garment || input.garment_img || input.garment_image || input.garm_img) && 
                           !!(input.human || input.human_img || input.human_image);
    const hasInstantIDInputs = !!(input.face_image && input.image && !isFaceSwap);
    
    // Face swap: strict identity preservation mode
    if (isFaceSwap) {
      if (!sourceImg || !targetImg) {
        return res.status(400).json({
          error: 'Missing required image inputs',
          message: 'Both source_img and target_img must be provided',
          received: {
            has_source: !!sourceImg,
            has_target: !!targetImg,
            inputKeys: Object.keys(input)
          }
        });
      }

      // Reject data URLs for source_img (hairline-heavy images cause artifacts)
      if (sourceImg.startsWith('data:')) {
        return res.status(400).json({
          error: 'Invalid source image format',
          message: 'Use hosted image URLs for best results. Data URLs are not supported for source images.',
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
      const warnings: string[] = [];
      if (sourceImg.includes('full') || sourceImg.includes('body') || sourceImg.includes('fullbody')) {
        warnings.push('Best results come from a tight face crop; avoid visible hairline');
      }
      if (targetImg.includes('full') || targetImg.includes('body') || targetImg.includes('fullbody')) {
        warnings.push('Best results come from a tight face crop; avoid visible hairline');
      }

      // Get version ID with caching
      let versionId = version;
      if (!versionId) {
        const cached = versionCache.get(model);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          versionId = cached.versionId;
          console.log(`Using cached version ID: ${versionId} for model ${model}`);
        } else {
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
                  versionCache.set(model, { versionId, timestamp: Date.now() });
                  console.log(`Found and cached version ID: ${versionId} for model ${model}`);
                }
              } else {
                const errorData = await modelResponse.json().catch(() => ({}));
                return res.status(modelResponse.status).json({
                  error: 'Model not found',
                  message: `Model ${model} does not exist or has been removed.`,
                  model: model,
                  details: errorData
                });
              }
            }
          } catch (versionError) {
            console.error('Version lookup failed:', versionError);
            return res.status(500).json({
              error: 'Version lookup failed',
              message: versionError instanceof Error ? versionError.message : 'Unknown error'
            });
          }
        }
      }
      
      if (!versionId) {
        return res.status(400).json({
          error: 'Model version not found',
          message: `Could not determine version for model ${model}. The model may not exist or may have been removed.`,
          model: model
        });
      }

      // Prepare strict identity preservation input for INSwapper
      const cleanedInput: Record<string, string | number | boolean> = {
        source_img: sourceImg,
        target_img: targetImg,
        // Conservative defaults to prevent artifacts
        upscale: false, // Disable upscaling
        face_restore: false, // Disable face restoration
        face_upsample: false, // Disable face upsampling
      };

      // Add face_only if model supports it (minimize hair artifacts)
      if (input.face_only !== undefined) {
        cleanedInput.face_only = Boolean(input.face_only);
      } else {
        // Default to face_only=true for minimal artifacts
        cleanedInput.face_only = true;
      }

      console.log(`Using INSwapper (strict identity mode) with version: ${versionId}`);
      console.log('Input:', {
        source_img: sourceImg.substring(0, 100),
        target_img: targetImg.substring(0, 100),
        ...cleanedInput
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
        
        console.error('Replicate API error:', {
          status: predictionResponse.status,
          errorData: JSON.stringify(errorData),
        });
        
        // Forward full error payload
        return res.status(predictionResponse.status).json({
          error: 'Replicate API error',
          message: errorData.detail || errorData.error || errorData.message || `HTTP ${predictionResponse.status}`,
          status: predictionResponse.status,
          details: errorData
        });
      }

      const prediction = await predictionResponse.json();
      
      // Handle prediction result
      if (prediction.status === 'succeeded') {
        const response: { output: unknown; warnings?: string[] } = { output: prediction.output };
        if (warnings.length > 0) {
          response.warnings = warnings;
        }
        return res.status(200).json(response);
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
          details: prediction
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
            const errorData = await statusResponse.json().catch(() => ({}));
            return res.status(statusResponse.status).json({
              error: 'Failed to check prediction status',
              message: statusResponse.statusText,
              details: errorData
            });
          }

          const statusData = await statusResponse.json();
          
          if (statusData.status === 'succeeded') {
            const response: { output: unknown; warnings?: string[] } = { output: statusData.output };
            if (warnings.length > 0) {
              response.warnings = warnings;
            }
            return res.status(200).json(response);
          } else if (statusData.status === 'failed') {
            const errorMsg = statusData.error || statusData.detail || 'Prediction failed';
            return res.status(500).json({
              error: 'Prediction failed',
              message: errorMsg,
              details: statusData
            });
          }
          
          attempts++;
        }

        return res.status(504).json({
          error: 'Request timeout',
          message: 'Prediction did not complete within timeout period',
        });
      }
    }

    // Try-on models: human_img, garm_img
    if (hasTryOnInputs) {
      const humanImg = String(input.human_img || input.human || input.human_image || '').trim();
      const garmImg = String(input.garm_img || input.garment || input.garment_img || input.garment_image || '').trim();
      
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
      
      // Get version ID with caching
      let versionId = version;
      if (!versionId) {
        const cached = versionCache.get(model);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          versionId = cached.versionId;
        } else {
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
                  versionCache.set(model, { versionId, timestamp: Date.now() });
                }
              } else {
                const errorData = await modelResponse.json().catch(() => ({}));
                return res.status(modelResponse.status).json({
                  error: 'Model not found',
                  message: `Model ${model} does not exist or has been removed.`,
                  model: model,
                  details: errorData
                });
              }
            }
          } catch (versionError) {
            console.error('Version lookup failed:', versionError);
          }
        }
      }
      
      if (!versionId) {
        return res.status(400).json({
          error: 'Model version not found',
          message: `Could not determine version for model ${model}.`,
          model: model
        });
      }

      const cleanedInput = {
        human_img: humanImg,
        garm_img: garmImg,
        garment_des: String(garmentDes).trim(),
      };

      console.log(`Using try-on model: ${model} with version: ${versionId}`);
      
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
        return res.status(predictionResponse.status).json({
          error: 'Replicate API error',
          message: errorData.detail || errorData.error || errorData.message || `HTTP ${predictionResponse.status}`,
          status: predictionResponse.status,
          details: errorData
        });
      }

      const prediction = await predictionResponse.json();
      
      if (prediction.status === 'succeeded') {
        return res.status(200).json({ output: prediction.output });
      } else if (prediction.status === 'failed') {
        const errorMsg = prediction.error || prediction.detail || 'Prediction failed';
        return res.status(500).json({
          error: 'Prediction failed',
          message: errorMsg,
          details: prediction
        });
      } else {
        // Poll for completion (same logic as face swap)
        const predictionId = prediction.id;
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
            const errorData = await statusResponse.json().catch(() => ({}));
            return res.status(statusResponse.status).json({
              error: 'Failed to check prediction status',
              message: statusResponse.statusText,
              details: errorData
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
              details: statusData
            });
          }
          
          attempts++;
        }

        return res.status(504).json({
          error: 'Request timeout',
          message: 'Prediction did not complete within timeout period',
        });
      }
    }

    // InstantID models: face_image, image
    if (hasInstantIDInputs) {
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

      // Get version ID with caching
      let versionId = version;
      if (!versionId) {
        const cached = versionCache.get(model);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          versionId = cached.versionId;
        } else {
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
                  versionCache.set(model, { versionId, timestamp: Date.now() });
                }
              } else {
                const errorData = await modelResponse.json().catch(() => ({}));
                return res.status(modelResponse.status).json({
                  error: 'Model not found',
                  message: `Model ${model} does not exist or has been removed.`,
                  model: model,
                  details: errorData
                });
              }
            }
          } catch (versionError) {
            console.error('Version lookup failed:', versionError);
          }
        }
      }
      
      if (!versionId) {
        return res.status(400).json({
          error: 'Model version not found',
          message: `Could not determine version for model ${model}.`,
          model: model
        });
      }

      const cleanedInput = {
        face_image: faceImg,
        image: targetImg,
        controlnet_conditioning_scale: input.controlnet_conditioning_scale || 0.8,
        ip_adapter_scale: input.ip_adapter_scale || 0.8,
      };

      console.log(`Using InstantID model: ${model} with version: ${versionId}`);
      
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
        return res.status(predictionResponse.status).json({
          error: 'Replicate API error',
          message: errorData.detail || errorData.error || errorData.message || `HTTP ${predictionResponse.status}`,
          status: predictionResponse.status,
          details: errorData
        });
      }

      const prediction = await predictionResponse.json();
      
      if (prediction.status === 'succeeded') {
        return res.status(200).json({ output: prediction.output });
      } else if (prediction.status === 'failed') {
        const errorMsg = prediction.error || prediction.detail || 'Prediction failed';
        return res.status(500).json({
          error: 'Prediction failed',
          message: errorMsg,
          details: prediction
        });
      } else {
        // Poll for completion (same logic as above)
        const predictionId = prediction.id;
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
            const errorData = await statusResponse.json().catch(() => ({}));
            return res.status(statusResponse.status).json({
              error: 'Failed to check prediction status',
              message: statusResponse.statusText,
              details: errorData
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
              details: statusData
            });
          }
          
          attempts++;
        }

        return res.status(504).json({
          error: 'Request timeout',
          message: 'Prediction did not complete within timeout period',
        });
      }
    }

    // No matching model type
    return res.status(400).json({
      error: 'Unsupported model type',
      message: 'Could not determine model type from input parameters',
      inputKeys: Object.keys(input),
      model: model
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
