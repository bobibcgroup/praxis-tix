import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not configured. Motivational messages will use fallbacks.');
}

const openai = apiKey ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) : null;

export interface MotivationalContext {
  outfitLabel: string; // 'Safest choice' | 'Sharper choice' | 'More relaxed choice'
  occasion: string;
  location?: string;
  mode: 'quick' | 'personal';
  hasPhoto?: boolean;
}

// Cache for messages to avoid regenerating
const messageCache = new Map<string, string>();

export async function generateMotivationalMessage(
  context: MotivationalContext
): Promise<string> {
  // Create cache key
  const cacheKey = `${context.outfitLabel}_${context.occasion}_${context.mode}`;
  
  // Check cache first
  if (messageCache.has(cacheKey)) {
    return messageCache.get(cacheKey)!;
  }

  // Fallback messages if OpenAI not configured
  if (!openai) {
    const fallback = getFallbackMessage(context);
    messageCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const prompt = buildPrompt(context);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cheaper, faster
      messages: [
        {
          role: 'system',
          content: 'You are a fashion stylist with an editorial, confident voice. Write brief, subtle motivational messages (8-15 words) that feel natural and non-preachy.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 30,
      temperature: 0.7,
    });

    const message = completion.choices[0]?.message?.content?.trim() || getFallbackMessage(context);
    
    // Cache the result
    messageCache.set(cacheKey, message);
    
    return message;
  } catch (error) {
    console.error('OpenAI API error:', error);
    const fallback = getFallbackMessage(context);
    messageCache.set(cacheKey, fallback);
    return fallback;
  }
}

function buildPrompt(context: MotivationalContext): string {
  const { outfitLabel, occasion, location, mode, hasPhoto } = context;
  
  let prompt = `Context: User selected "${outfitLabel}" for ${occasion}`;
  if (location) prompt += ` at ${location}`;
  if (mode === 'personal' && hasPhoto) prompt += '. This was personalized based on their photo and preferences.';
  else if (mode === 'personal') prompt += '. This was personalized based on their style preferences.';
  else prompt += '. This was a quick recommendation.';
  
  prompt += '\n\nWrite a subtle, confident message (8-15 words) that affirms their choice without being preachy. Fashion editorial tone.';
  
  return prompt;
}

function getFallbackMessage(context: MotivationalContext): string {
  const { outfitLabel, occasion } = context;
  
  const fallbacks: Record<string, string[]> = {
    'Safest choice': [
      'This choice reflects confidence without effort.',
      'A balanced look that works every time.',
      'You\'ve found the sweet spot between sharp and comfortable.',
    ],
    'Sharper choice': [
      'Every detail here works together intentionally.',
      'This look commands attention without trying.',
      'Polished, confident, and completely natural.',
    ],
    'More relaxed choice': [
      'Comfort-first doesn\'t mean compromising style.',
      'Effortless elegance that feels like you.',
      'Relaxed, refined, and perfectly appropriate.',
    ],
  };

  const options = fallbacks[outfitLabel] || fallbacks['Safest choice'];
  return options[Math.floor(Math.random() * options.length)];
}
