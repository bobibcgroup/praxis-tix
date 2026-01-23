import OpenAI from 'openai';
import type { PraxisAgentContext, PraxisAgentMessage, AgentStage, AgentResponse } from '@/types/praxis';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not configured. Agent will use fallback responses.');
}

const openai = apiKey ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) : null;

/**
 * Generate agent response using OpenAI
 */
export async function generateAgentResponse(
  userMessage: string,
  conversationHistory: PraxisAgentMessage[],
  currentContext: PraxisAgentContext,
  currentStage: AgentStage
): Promise<AgentResponse> {
  // Fallback to deterministic if OpenAI not available
  if (!openai) {
    return generateFallbackResponse(userMessage, currentContext, currentStage);
  }

  try {
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(currentContext, currentStage);
    
    // Convert conversation history to OpenAI format
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages,
      max_tokens: 200,
      temperature: 0.7,
      // Don't force JSON - let it respond naturally, we'll extract info
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return generateFallbackResponse(userMessage, currentContext, currentStage);
    }

    // Extract structured info from natural response
    const extractedContext = await extractContextFromMessage(userMessage, currentContext);
    const nextStage = determineNextStage(userMessage, { ...currentContext, ...extractedContext }, currentStage);
    
    // Determine actions based on stage
    const actions = [];
    if (nextStage === 'capture_optional') {
      actions.push({ type: 'request_capture' });
    } else if (nextStage === 'generate') {
      actions.push({ type: 'generate_outfits' });
    }

    return {
      assistantMessage: content,
      nextStage,
      contextPatch: extractedContext,
      actions,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackResponse(userMessage, currentContext, currentStage);
  }
}

/**
 * Build system prompt for the agent
 */
function buildSystemPrompt(context: PraxisAgentContext, stage: AgentStage): string {
  const hasPhoto = !!context.hasPhoto || !!context.photoUrl;
  const isPersonalFlow = context.flowType === 'personal' || hasPhoto || !!context.lifestyle;
  
  let prompt = `You are Praxis Agent, a helpful fashion styling assistant. You help users find the perfect outfit through natural conversation.

Your goal: Collect information and generate personalized outfit recommendations.

Current stage: ${stage}
Flow type: ${isPersonalFlow ? 'personal (building style profile)' : 'quick (occasion-based)'}
Current context: ${JSON.stringify(context, null, 2)}

Guidelines:
- Be concise, friendly, and helpful (1-2 sentences max)
- Ask at most 3 clarifying questions total
- Detect flow type: "I need something for tonight" = quick, "Build my style" = personal
- Extract ALL relevant information from natural language
- When you have enough info, offer to generate outfits
- Use natural, conversational language
- Keep responses short and actionable`;

  if (stage === 'intake') {
    if (isPersonalFlow) {
      prompt += '\n\nYou are building a personal style profile. Ask about lifestyle (work/social/casual/mixed) or request a photo for analysis.';
    } else {
      prompt += '\n\nYou are in the intake stage. Ask about the occasion first (e.g., "What\'s the occasion?").';
    }
  } else if (stage === 'clarify') {
    if (isPersonalFlow) {
      prompt += '\n\nFor personal flow, ask about: lifestyle, fit preferences, inspiration style, or wardrobe items.';
    } else {
      prompt += '\n\nYou are clarifying details. Ask about location/time or preferences (e.g., "Where and when?" or "What\'s your priority - safe, sharp, or relaxed?").';
    }
  } else if (stage === 'capture_optional') {
    prompt += '\n\nOffer to generate outfits or ask if they want to add a photo for better personalization.';
  } else if (stage === 'generate') {
    prompt += '\n\nConfirm you\'re generating their looks now.';
  }

  return prompt;
}

/**
 * Determine next stage based on context
 */
function determineNextStage(
  text: string,
  context: PraxisAgentContext,
  currentStage: AgentStage
): AgentStage {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('skip') || lowerText.includes('no') || lowerText.includes('generate') ||
      lowerText.includes('now') || lowerText.includes('go ahead')) {
    return 'generate';
  }
  
  if (lowerText.includes('photo') || lowerText.includes('picture')) {
    return 'capture_optional';
  }
  
  const hasOccasion = !!context.occasion;
  const hasLocationOrTime = !!context.location || !!context.timeOfDay;
  const hasVibeOrBudget = !!context.vibe || !!context.budget;
  
  if (hasOccasion && hasLocationOrTime && hasVibeOrBudget) {
    return 'capture_optional';
  }
  
  if (hasOccasion) {
    return 'clarify';
  }
  
  return 'intake';
}

/**
 * Fallback response generator (deterministic)
 */
function generateFallbackResponse(
  text: string,
  context: PraxisAgentContext,
  currentStage: AgentStage
): AgentResponse {
  const lowerText = text.toLowerCase();
  
  // Extract occasion
  if (!context.occasion) {
    if (lowerText.includes('wedding')) {
      return {
        assistantMessage: 'A wedding! Perfect. Is this indoors or outdoors?',
        nextStage: 'clarify',
        contextPatch: { occasion: 'WEDDING' },
      };
    } else if (lowerText.includes('work') || lowerText.includes('office')) {
      return {
        assistantMessage: 'Work event - got it. Is this during the day or evening?',
        nextStage: 'clarify',
        contextPatch: { occasion: 'WORK' },
      };
    } else if (lowerText.includes('dinner')) {
      return {
        assistantMessage: 'Dinner sounds great! Is this casual or more formal?',
        nextStage: 'clarify',
        contextPatch: { occasion: 'DINNER' },
      };
    } else if (lowerText.includes('date')) {
      return {
        assistantMessage: 'A date! Exciting. First date or something more casual?',
        nextStage: 'clarify',
        contextPatch: { occasion: 'DATE' },
      };
    }
  }
  
  // Default response
  return {
    assistantMessage: 'What\'s the occasion? (e.g., work dinner, first date, wedding)',
    nextStage: 'intake',
    contextPatch: {},
  };
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Convert blob to File
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Optional: specify language
    });

    return transcription.text;
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw error;
  }
}

/**
 * Extract structured context from user message using LLM
 */
export async function extractContextFromMessage(
  message: string,
  currentContext: PraxisAgentContext
): Promise<Partial<PraxisAgentContext>> {
  if (!openai) {
    return extractContextFallback(message);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract fashion styling context from user messages. Return JSON with all relevant fields:
- Quick flow: occasion (WEDDING/WORK/DINNER/DATE/PARTY), location, timeOfDay (DAY/NIGHT), setting, priority (SIMPLE/SHARP/COMFORT/IMPRESSION), budget (EVERYDAY/MID_RANGE/PREMIUM), vibe (safe/sharp/relaxed), weatherPreference
- Personal flow: lifestyle (WORK/SOCIAL/CASUAL/MIXED), fitPreference (slim/regular/relaxed), height (number in cm), inspirationStyle (QUIET_LUXURY/SMART_CASUAL/MODERN_MINIMAL/ELEVATED_STREET/CLASSIC_TAILORED/RELAXED_WEEKEND)
- General: notes, flowType (quick/personal/mixed)
Use null for missing values.`,
        },
        {
          role: 'user',
          content: `Current context: ${JSON.stringify(currentContext)}\n\nUser message: "${message}"\n\nExtract any new information.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 150,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Context extraction error:', error);
  }

  return extractContextFallback(message);
}

/**
 * Fallback context extraction (deterministic)
 */
function extractContextFallback(message: string): Partial<PraxisAgentContext> {
  const lowerText = message.toLowerCase();
  const context: Partial<PraxisAgentContext> = {};

  // Extract occasion
  if (lowerText.includes('wedding')) context.occasion = 'WEDDING';
  else if (lowerText.includes('work') || lowerText.includes('office')) context.occasion = 'WORK';
  else if (lowerText.includes('dinner')) context.occasion = 'DINNER';
  else if (lowerText.includes('date')) context.occasion = 'DATE';
  else if (lowerText.includes('party')) context.occasion = 'PARTY';

  // Extract location
  if (lowerText.includes('riyadh')) context.location = 'RESTAURANT';
  else if (lowerText.includes('outdoor')) context.location = 'OUTDOOR_VENUE';
  else if (lowerText.includes('beach')) context.location = 'BEACH_RESORT';
  else if (lowerText.includes('restaurant')) context.location = 'RESTAURANT';
  else if (lowerText.includes('hotel')) context.location = 'HOTEL';
  else if (lowerText.includes('home')) context.location = 'HOME';
  else if (lowerText.includes('bar')) context.location = 'BAR';

  // Extract time
  if (lowerText.includes('evening') || lowerText.includes('night')) context.timeOfDay = 'NIGHT';
  else if (lowerText.includes('day') || lowerText.includes('morning') || lowerText.includes('afternoon')) context.timeOfDay = 'DAY';

  // Extract priority/vibe
  if (lowerText.includes('sharp') || lowerText.includes('polished') || lowerText.includes('intentional')) {
    context.vibe = 'sharp';
    context.priority = 'SHARP';
  } else if (lowerText.includes('relaxed') || lowerText.includes('casual') || lowerText.includes('comfort')) {
    context.vibe = 'relaxed';
    context.priority = 'COMFORT';
  } else if (lowerText.includes('safe') || lowerText.includes('conservative') || lowerText.includes('simple')) {
    context.vibe = 'safe';
    context.priority = 'SIMPLE';
  }

  // Extract budget
  if (lowerText.includes('budget') || lowerText.includes('cheap') || lowerText.includes('under $200') || lowerText.includes('affordable')) {
    context.budget = 'EVERYDAY';
  } else if (lowerText.includes('premium') || lowerText.includes('expensive') || lowerText.includes('high-end') || lowerText.includes('unrestricted')) {
    context.budget = 'PREMIUM';
  } else if (lowerText.includes('mid') || lowerText.includes('elevated')) {
    context.budget = 'MID_RANGE';
  }

  // Extract lifestyle (personal flow)
  if (lowerText.includes('work focused') || lowerText.includes('mostly work')) context.lifestyle = 'WORK';
  else if (lowerText.includes('social') || lowerText.includes('nights out')) context.lifestyle = 'SOCIAL';
  else if (lowerText.includes('casual') || lowerText.includes('relaxed lifestyle')) context.lifestyle = 'CASUAL';
  else if (lowerText.includes('mixed')) context.lifestyle = 'MIXED';

  // Extract fit preference
  if (lowerText.includes('slim fit') || lowerText.includes('slimmer')) context.fitInfo = { ...context.fitInfo, fitPreference: 'slim' };
  else if (lowerText.includes('regular fit') || lowerText.includes('standard')) context.fitInfo = { ...context.fitInfo, fitPreference: 'regular' };
  else if (lowerText.includes('relaxed fit') || lowerText.includes('looser')) context.fitInfo = { ...context.fitInfo, fitPreference: 'relaxed' };

  // Extract height (approximate)
  const heightMatch = lowerText.match(/(\d+)\s*(cm|centimeters?|ft|feet|'|inches?|")/i);
  if (heightMatch) {
    const value = parseInt(heightMatch[1]);
    const unit = heightMatch[2].toLowerCase();
    if (unit.includes('cm') || unit.includes('centimeter')) {
      context.fitInfo = { ...context.fitInfo, height: value, heightUnit: 'cm' };
    } else if (unit.includes('ft') || unit.includes('feet') || unit.includes("'")) {
      // Would need more parsing for ft-in, but basic support
      context.fitInfo = { ...context.fitInfo, heightUnit: 'ft-in' };
    }
  }

  // Extract inspiration style
  if (lowerText.includes('quiet luxury')) context.inspirationStyle = 'QUIET_LUXURY';
  else if (lowerText.includes('smart casual')) context.inspirationStyle = 'SMART_CASUAL';
  else if (lowerText.includes('modern minimal') || lowerText.includes('minimalist')) context.inspirationStyle = 'MODERN_MINIMAL';
  else if (lowerText.includes('elevated street') || lowerText.includes('streetwear')) context.inspirationStyle = 'ELEVATED_STREET';
  else if (lowerText.includes('classic tailored') || lowerText.includes('tailored')) context.inspirationStyle = 'CLASSIC_TAILORED';
  else if (lowerText.includes('relaxed weekend') || lowerText.includes('weekend')) context.inspirationStyle = 'RELAXED_WEEKEND';

  // Detect flow type
  if (lowerText.includes('build my style') || lowerText.includes('personal style') || lowerText.includes('style profile') || 
      lowerText.includes('long term') || context.lifestyle) {
    context.flowType = 'personal';
  } else if (lowerText.includes('for tonight') || lowerText.includes('for tomorrow') || lowerText.includes('specific event')) {
    context.flowType = 'quick';
  }

  // Extract weather
  if (lowerText.includes('hot') || lowerText.includes('summer') || lowerText.includes('warm')) context.weatherPreference = 'hot';
  else if (lowerText.includes('cold') || lowerText.includes('winter')) context.weatherPreference = 'cold';

  return context;
}
