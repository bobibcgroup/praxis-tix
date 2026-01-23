import type { 
  PraxisAgentContext, 
  PraxisAgentMessage, 
  AgentStage, 
  AgentResponse,
  Outfit,
  OccasionType,
  LocationType,
  TimeType,
  BudgetType,
  SkinToneData,
  ContrastLevel,
  BodyProportions,
  FaceShapeData,
} from '@/types/praxis';
import { generateOutfits } from './outfitGenerator';
import { analyzePhoto } from './photoAnalysis';
import { generateAgentResponse, extractContextFromMessage } from './agentOpenAIService';
import type { FlowData } from '@/types/praxis';

/**
 * Praxis Agent Orchestrator
 * 
 * Manages the agent conversation flow and outfit generation.
 * Uses OpenAI for natural conversation and leverages existing services.
 */
class PraxisAgentOrchestrator {
  private conversationHistory: PraxisAgentMessage[] = [];
  private context: PraxisAgentContext = {};
  private currentStage: AgentStage = 'intake';
  private photoAnalysis?: {
    skinTone?: SkinToneData;
    contrastLevel?: ContrastLevel;
    bodyProportions?: BodyProportions;
    faceShape?: FaceShapeData;
  };

  /**
   * Process a user text message (async with OpenAI)
   */
  async processUserMessage(text: string, context: PraxisAgentContext): Promise<AgentResponse> {
    this.conversationHistory.push({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    });

    // Extract context from message using LLM
    const extractedContext = await extractContextFromMessage(text, this.context);
    
    // Update context with new information
    this.context = { ...this.context, ...context, ...extractedContext };

    // Generate response using OpenAI
    const response = await generateAgentResponse(
      text,
      this.conversationHistory,
      this.context,
      this.currentStage
    );
    
    // Apply context patch
    if (response.contextPatch) {
      this.context = { ...this.context, ...response.contextPatch };
    }
    
    // Add assistant message to history
    this.conversationHistory.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.assistantMessage,
      createdAt: new Date(),
    });

    this.currentStage = response.nextStage;
    
    return response;
  }

  /**
   * Process a voice transcript (async)
   */
  async processVoiceTranscript(transcript: string, context: PraxisAgentContext): Promise<AgentResponse> {
    return this.processUserMessage(transcript, context);
  }

  /**
   * Process an attachment (photo/video) with analysis
   */
  async processAttachment(
    metadata: { type: 'photo' | 'video'; url: string },
    context: PraxisAgentContext
  ): Promise<AgentResponse> {
    this.context = { ...this.context, ...context };
    
    // Analyze photo if it's an image
    if (metadata.type === 'photo') {
      try {
        const analysis = await analyzePhoto(metadata.url);
        if (analysis) {
          this.photoAnalysis = {
            skinTone: analysis.skinTone,
            contrastLevel: analysis.contrastLevel,
            bodyProportions: analysis.bodyProportions,
            faceShape: analysis.faceShape,
          };
          
          // Update context with fit info
          if (analysis.bodyProportions) {
            this.context.fitInfo = {
              fitPreference: this.context.fitInfo?.fitPreference || 'regular',
            };
          }
        }
      } catch (error) {
        console.error('Photo analysis error:', error);
      }
    }
    
    const response: AgentResponse = {
      assistantMessage: 'Perfect! I\'ve analyzed your photo and will use it to personalize your outfit recommendations.',
      nextStage: 'generate',
      contextPatch: {},
    };

    this.conversationHistory.push({
      id: Date.now().toString(),
      role: 'user',
      content: `[${metadata.type} attached]`,
      createdAt: new Date(),
      meta: {
        attachmentType: metadata.type,
        attachmentUrl: metadata.url,
      },
    });

    this.conversationHistory.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.assistantMessage,
      createdAt: new Date(),
    });

    this.currentStage = response.nextStage;
    return response;
  }

  /**
   * Generate outfits based on current context (with photo analysis if available)
   */
  generateOutfits(context: PraxisAgentContext): Outfit[] {
    // Convert agent context to FlowData format
    const flowData: FlowData = {
      occasion: {
        event: (context.occasion as OccasionType) || 'WORK',
      },
      context: {
        location: (context.location as LocationType) || '',
        when: (context.timeOfDay as TimeType) || '',
        setting: '',
      },
      preferences: {
        priority: context.vibe === 'sharp' ? 'SHARP' : context.vibe === 'relaxed' ? 'COMFORT' : 'IMPRESSION',
        budget: (context.budget as BudgetType) || 'MID_RANGE',
      },
    };

    // Note: Photo analysis results are stored in this.photoAnalysis
    // The generateOutfits function can use this data if we pass PersonalData
    // For now, we'll use the basic flow - can enhance later with PersonalData integration
    const { outfits } = generateOutfits(flowData, []);
    return outfits;
  }

  /**
   * Get photo analysis results
   */
  getPhotoAnalysis() {
    return this.photoAnalysis;
  }

  /**
   * Refine outfits based on refinement text (with LLM understanding)
   */
  async refineOutfits(context: PraxisAgentContext, refinementText: string): Promise<Outfit[]> {
    // Use LLM to extract refinement intent
    const extractedContext = await extractContextFromMessage(refinementText, context);
    
    // Update context with refinements
    const updatedContext = { ...context, ...extractedContext };
    
    // Parse common refinement patterns
    const lowerText = refinementText.toLowerCase();
    
    if (lowerText.includes('more formal') || lowerText.includes('formal') || lowerText.includes('sharper')) {
      updatedContext.vibe = 'sharp';
    } else if (lowerText.includes('less formal') || lowerText.includes('casual') || lowerText.includes('relaxed')) {
      updatedContext.vibe = 'relaxed';
    } else if (lowerText.includes('safer') || lowerText.includes('conservative')) {
      updatedContext.vibe = 'safe';
    }
    
    if (lowerText.includes('hot weather') || lowerText.includes('summer') || lowerText.includes('warm')) {
      updatedContext.weatherPreference = 'hot';
    } else if (lowerText.includes('cold') || lowerText.includes('winter')) {
      updatedContext.weatherPreference = 'cold';
    }
    
    if (lowerText.includes('budget') || lowerText.includes('cheap') || lowerText.includes('affordable') || lowerText.includes('under')) {
      updatedContext.budget = 'EVERYDAY';
    } else if (lowerText.includes('premium') || lowerText.includes('expensive') || lowerText.includes('high-end')) {
      updatedContext.budget = 'PREMIUM';
    }

    // Update orchestrator context
    this.context = updatedContext;
    
    // Regenerate with updated context
    return this.generateOutfits(updatedContext);
  }

  /**
   * Determine agent response based on current stage and user input
   */
  private determineResponse(text: string): AgentResponse {
    const lowerText = text.toLowerCase();
    const currentStage = this.currentStage;

    // Extract information from user input
    this.extractContextFromText(text);

    // Stage-based logic
    if (currentStage === 'intake') {
      // Check if we have enough info
      const hasOccasion = !!this.context.occasion;
      
      if (!hasOccasion) {
        return {
          assistantMessage: 'What\'s the occasion? (e.g., work dinner, first date, wedding guest)',
          nextStage: 'clarify',
          contextPatch: {},
        };
      }

      // Check if we need more details
      const needsMore = !this.context.location && !this.context.timeOfDay;
      
      if (needsMore) {
        return {
          assistantMessage: 'Where and when? (e.g., "Riyadh, evening" or "outdoor, daytime")',
          nextStage: 'clarify',
          contextPatch: {},
        };
      }

      // Check if we need vibe/budget
      const needsPreferences = !this.context.vibe && !this.context.budget;
      
      if (needsPreferences) {
        return {
          assistantMessage: 'What\'s your priority? Safe and polished, sharp and intentional, or relaxed and comfortable?',
          nextStage: 'clarify',
          contextPatch: {},
        };
      }

      // We have enough info, move to optional capture
      return {
        assistantMessage: 'Perfect! I have everything I need. I can refine fit and color with a photo, or generate your looks right away. What would you prefer?',
        nextStage: 'capture_optional',
        contextPatch: {},
        actions: [{ type: 'request_capture' }],
      };
    }

    if (currentStage === 'clarify') {
      // Check if we have enough info now
      const hasOccasion = !!this.context.occasion;
      const hasLocationOrTime = !!this.context.location || !!this.context.timeOfDay;
      const hasVibeOrBudget = !!this.context.vibe || !!this.context.budget;

      if (hasOccasion && hasLocationOrTime && hasVibeOrBudget) {
        return {
          assistantMessage: 'Excellent! I\'m ready to create your looks. You can add a photo for personalized fit and color matching, or I\'ll generate them now based on what you\'ve told me.',
          nextStage: 'capture_optional',
          contextPatch: {},
          actions: [{ type: 'request_capture' }],
        };
      }

      // Still need more info
      if (!hasOccasion) {
        return {
          assistantMessage: 'What\'s the occasion?',
          nextStage: 'clarify',
          contextPatch: {},
        };
      }

      if (!hasLocationOrTime) {
        return {
          assistantMessage: 'Where and when is this?',
          nextStage: 'clarify',
          contextPatch: {},
        };
      }

      return {
        assistantMessage: 'Any preference on style? Safe, sharp, or relaxed?',
        nextStage: 'clarify',
        contextPatch: {},
      };
    }

    if (currentStage === 'capture_optional') {
      // User can skip or provide capture
      if (lowerText.includes('skip') || lowerText.includes('no') || lowerText.includes('generate') || 
          lowerText.includes('now') || lowerText.includes('go ahead') || lowerText.includes('yes') ||
          lowerText.includes('sure') || lowerText === 'ok' || lowerText === 'okay') {
        return {
          assistantMessage: 'Perfect! Generating your looks now...',
          nextStage: 'generate',
          contextPatch: {},
          actions: [{ type: 'generate_outfits' }],
        };
      }
      
      // If they want to add photo
      if (lowerText.includes('photo') || lowerText.includes('picture') || lowerText.includes('image') ||
          lowerText.includes('yes') || lowerText.includes('sure') || lowerText.includes('add')) {
        return {
          assistantMessage: 'Great! You can take or upload a photo on the next screen.',
          nextStage: 'capture_optional',
          contextPatch: {},
          actions: [{ type: 'request_capture' }],
        };
      }
      
      // If they provide more info, continue clarifying
      return this.determineResponse(text);
    }

    // Default: move to generate
    return {
      assistantMessage: 'Got it! Generating your looks now...',
      nextStage: 'generate',
      contextPatch: {},
      actions: [{ type: 'generate_outfits' }],
    };
  }

  /**
   * Extract context information from user text
   */
  private extractContextFromText(text: string): void {
    const lowerText = text.toLowerCase();

    // Extract occasion
    if (!this.context.occasion) {
      if (lowerText.includes('wedding') || lowerText.includes('wedding guest')) {
        this.context.occasion = 'WEDDING';
      } else if (lowerText.includes('work') || lowerText.includes('office') || lowerText.includes('business')) {
        this.context.occasion = 'WORK';
      } else if (lowerText.includes('dinner') || lowerText.includes('restaurant')) {
        this.context.occasion = 'DINNER';
      } else if (lowerText.includes('date') || lowerText.includes('first date')) {
        this.context.occasion = 'DATE';
      } else if (lowerText.includes('party') || lowerText.includes('night out')) {
        this.context.occasion = 'PARTY';
      }
    }

    // Extract location
    if (!this.context.location) {
      const locationKeywords: Record<string, LocationType> = {
        'riyadh': 'RESTAURANT',
        'restaurant': 'RESTAURANT',
        'office': 'OFFICE',
        'hotel': 'HOTEL',
        'outdoor': 'OUTDOOR_VENUE',
        'beach': 'BEACH_RESORT',
        'garden': 'GARDEN',
      };

      for (const [keyword, location] of Object.entries(locationKeywords)) {
        if (lowerText.includes(keyword)) {
          this.context.location = location;
          break;
        }
      }
    }

    // Extract time
    if (!this.context.timeOfDay) {
      if (lowerText.includes('evening') || lowerText.includes('night') || lowerText.includes('dinner')) {
        this.context.timeOfDay = 'NIGHT';
      } else if (lowerText.includes('day') || lowerText.includes('morning') || lowerText.includes('afternoon')) {
        this.context.timeOfDay = 'DAY';
      }
    }

    // Extract vibe
    if (!this.context.vibe) {
      if (lowerText.includes('sharp') || lowerText.includes('intentional') || lowerText.includes('polished')) {
        this.context.vibe = 'sharp';
      } else if (lowerText.includes('relaxed') || lowerText.includes('comfortable') || lowerText.includes('casual')) {
        this.context.vibe = 'relaxed';
      } else if (lowerText.includes('safe') || lowerText.includes('conservative')) {
        this.context.vibe = 'safe';
      }
    }

    // Extract budget
    if (!this.context.budget) {
      if (lowerText.includes('budget') || lowerText.includes('cheap') || lowerText.includes('affordable') || lowerText.includes('under $200')) {
        this.context.budget = 'EVERYDAY';
      } else if (lowerText.includes('premium') || lowerText.includes('expensive') || lowerText.includes('high-end')) {
        this.context.budget = 'PREMIUM';
      } else {
        this.context.budget = 'MID_RANGE';
      }
    }

    // Extract weather
    if (lowerText.includes('hot') || lowerText.includes('summer') || lowerText.includes('warm')) {
      this.context.weatherPreference = 'hot';
    } else if (lowerText.includes('cold') || lowerText.includes('winter')) {
      this.context.weatherPreference = 'cold';
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): PraxisAgentMessage[] {
    return this.conversationHistory;
  }

  /**
   * Get current context
   */
  getContext(): PraxisAgentContext {
    return this.context;
  }

  /**
   * Get current stage
   */
  getCurrentStage(): AgentStage {
    return this.currentStage;
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.conversationHistory = [];
    this.context = {};
    this.currentStage = 'intake';
  }

  /**
   * Load state from storage
   */
  loadState(state: { conversationHistory: PraxisAgentMessage[]; context: PraxisAgentContext; stage: AgentStage }): void {
    this.conversationHistory = state.conversationHistory.map(msg => ({
      ...msg,
      createdAt: new Date(msg.createdAt),
    }));
    this.context = state.context;
    this.currentStage = state.stage;
  }

  /**
   * Get state for storage
   */
  getState(): { conversationHistory: PraxisAgentMessage[]; context: PraxisAgentContext; stage: AgentStage } {
    return {
      conversationHistory: this.conversationHistory,
      context: this.context,
      stage: this.currentStage,
    };
  }
}

// Export singleton instance
export const praxisAgentOrchestrator = new PraxisAgentOrchestrator();
