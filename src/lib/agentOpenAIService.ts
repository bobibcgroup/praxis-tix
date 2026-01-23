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
  let prompt = `You are Praxis Agent, a helpful fashion styling assistant. You help users find the perfect outfit through natural conversation.

Your goal: Collect information about the user's occasion, location, time, preferences, and budget, then generate outfit recommendations.

Current stage: ${stage}
Current context: ${JSON.stringify(context, null, 2)}

Guidelines:
- Be concise, friendly, and helpful (1-2 sentences max)
- Ask at most 3 clarifying questions total
- Extract key information: occasion, location, time, vibe (safe/sharp/relaxed), budget
- When you have enough info, offer to generate outfits
- Use natural, conversational language
- Keep responses short and actionable`;

  if (stage === 'intake') {
    prompt += '\n\nYou are in the intake stage. Ask about the occasion first (e.g., "What\'s the occasion?").';
  } else if (stage === 'clarify') {
    prompt += '\n\nYou are clarifying details. Ask about location/time or preferences (e.g., "Where and when?" or "What\'s your priority - safe, sharp, or relaxed?").';
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
          content: `Extract fashion styling context from user messages. Return JSON with: occasion, location, timeOfDay, vibe (safe/sharp/relaxed), budget, weatherPreference, notes. Use null for missing values.`,
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

  // Extract time
  if (lowerText.includes('evening') || lowerText.includes('night')) context.timeOfDay = 'NIGHT';
  else if (lowerText.includes('day') || lowerText.includes('morning')) context.timeOfDay = 'DAY';

  // Extract vibe
  if (lowerText.includes('sharp') || lowerText.includes('polished')) context.vibe = 'sharp';
  else if (lowerText.includes('relaxed') || lowerText.includes('casual')) context.vibe = 'relaxed';
  else if (lowerText.includes('safe') || lowerText.includes('conservative')) context.vibe = 'safe';

  // Extract budget
  if (lowerText.includes('budget') || lowerText.includes('cheap') || lowerText.includes('under $200')) {
    context.budget = 'EVERYDAY';
  } else if (lowerText.includes('premium') || lowerText.includes('expensive')) {
    context.budget = 'PREMIUM';
  }

  // Extract weather
  if (lowerText.includes('hot') || lowerText.includes('summer')) context.weatherPreference = 'hot';
  else if (lowerText.includes('cold') || lowerText.includes('winter')) context.weatherPreference = 'cold';

  return context;
}
