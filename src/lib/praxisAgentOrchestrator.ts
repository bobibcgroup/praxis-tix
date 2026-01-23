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
} from '@/types/praxis';
import { generateOutfits } from './outfitGenerator';
import type { FlowData } from '@/types/praxis';

/**
 * Praxis Agent Orchestrator
 * 
 * Manages the agent conversation flow and outfit generation.
 * Uses a mock/deterministic provider for MVP - can be swapped with real LLM later.
 */
class PraxisAgentOrchestrator {
  private conversationHistory: PraxisAgentMessage[] = [];
  private context: PraxisAgentContext = {};
  private currentStage: AgentStage = 'intake';

  /**
   * Process a user text message
   */
  processUserMessage(text: string, context: PraxisAgentContext): AgentResponse {
    this.conversationHistory.push({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    });

    // Update context with new information
    this.context = { ...this.context, ...context };

    // Determine next stage and generate response
    const response = this.determineResponse(text);
    
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
   * Process a voice transcript
   */
  processVoiceTranscript(transcript: string, context: PraxisAgentContext): AgentResponse {
    return this.processUserMessage(transcript, context);
  }

  /**
   * Process an attachment (photo/video)
   */
  processAttachment(
    metadata: { type: 'photo' | 'video'; url: string },
    context: PraxisAgentContext
  ): AgentResponse {
    this.context = { ...this.context, ...context };
    
    // For MVP, just acknowledge and move forward
    const response: AgentResponse = {
      assistantMessage: 'Got it. I\'ll use this to refine your fit and color preferences.',
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
   * Generate outfits based on current context
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

    const { outfits } = generateOutfits(flowData, []);
    return outfits;
  }

  /**
   * Refine outfits based on refinement text
   */
  refineOutfits(context: PraxisAgentContext, refinementText: string): Outfit[] {
    // Parse refinement text for keywords
    const lowerText = refinementText.toLowerCase();
    
    // Update context based on refinement
    if (lowerText.includes('more formal') || lowerText.includes('formal')) {
      context.vibe = 'sharp';
    } else if (lowerText.includes('less black') || lowerText.includes('lighter')) {
      // Could filter by color in future
    } else if (lowerText.includes('hot weather') || lowerText.includes('summer')) {
      context.weatherPreference = 'hot';
    } else if (lowerText.includes('budget') || lowerText.includes('cheap') || lowerText.includes('affordable')) {
      context.budget = 'EVERYDAY';
    } else if (lowerText.includes('premium') || lowerText.includes('expensive')) {
      context.budget = 'PREMIUM';
    }

    // Regenerate with updated context
    return this.generateOutfits(context);
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
        assistantMessage: 'Perfect! I can refine fit and color if you\'d like to share a photo, or I can generate your looks now.',
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
          assistantMessage: 'Got it! Ready to generate your looks. Want to add a photo for better fit and color matching?',
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
      if (lowerText.includes('skip') || lowerText.includes('no') || lowerText.includes('generate')) {
        return {
          assistantMessage: 'Generating your looks now...',
          nextStage: 'generate',
          contextPatch: {},
          actions: [{ type: 'generate_outfits' }],
        };
      }
      
      // If they provide more info, continue clarifying
      return this.determineResponse(text);
    }

    // Default: move to generate
    return {
      assistantMessage: 'Generating your looks...',
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
