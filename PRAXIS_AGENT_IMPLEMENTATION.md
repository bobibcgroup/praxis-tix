# Praxis Agent MVP Implementation

## Overview

Praxis Agent is a new automated styling assistant mode in the Praxis app that allows users to get styled outfits through natural language conversation. The MVP includes full UI, routing, state management, and agent orchestration scaffolding with a mock provider.

## Files Added/Modified

### New Files Created

1. **Types & Services**
   - `src/types/praxis.ts` - Added Praxis Agent types (PraxisAgentMessage, PraxisAgentContext, AgentStage, AgentResponse)
   - `src/lib/praxisAgentOrchestrator.ts` - Core agent orchestration service with mock provider

2. **Pages**
   - `src/pages/Agent.tsx` - Main agent chat interface (`/agent`)
   - `src/pages/AgentCapture.tsx` - Optional capture page for photos/videos (`/agent/capture`)
   - `src/pages/AgentResults.tsx` - Outfit results page with refine capability (`/agent/results`)

3. **Components**
   - `src/components/app/AgentChatInput.tsx` - Chat input component with text, voice, and attachment buttons
   - `src/components/app/AgentVoiceRecorder.tsx` - Voice recording component (push-to-talk)
   - `src/components/app/AgentSuggestedPrompts.tsx` - Suggested prompt chips component

### Modified Files

1. **Routing & Entry**
   - `src/App.tsx` - Added routes for `/agent`, `/agent/capture`, `/agent/results`
   - `src/components/app/StepModeSelect.tsx` - Added Praxis Agent as third option on home screen
   - `src/hooks/useSEO.ts` - Added SEO metadata for agent routes

## Features Implemented

### 1. Entry Point
- Added "Praxis Agent" card on home screen (between "Style a moment" and "Build my personal style")
- Card includes Bot icon, title, subtitle, and CTA button
- Mobile-first responsive design

### 2. Agent Chat Interface (`/agent`)
- Chat-style conversation UI with message bubbles
- Text input with send button
- Voice recording button (push-to-talk)
- Attachment button for photos/videos
- Suggested prompt chips (horizontal scroll)
- Auto-scroll to latest message
- Loading indicators during processing
- Local storage persistence for conversation state

### 3. Optional Capture (`/agent/capture`)
- Options: Take photo, Upload photo, Record video (5-10s), Skip
- Privacy notice: "Private. Not shared."
- Navigates to results after capture or skip

### 4. Results Page (`/agent/results`)
- Displays 3 outfit cards (reuses existing OutfitCard component)
- "Choose this look" and "Refine" buttons per outfit
- Refine input at bottom for natural language refinement
- Updates results in place (no navigation)

### 5. Agent Orchestration
- State machine with stages: `intake` → `clarify` → `capture_optional` → `generate` → `refine` → `done`
- Extracts context from user messages (occasion, location, time, vibe, budget, weather)
- Asks max 3 clarifying questions
- Generates outfits using existing `generateOutfits` function
- Supports refinement with natural language

### 6. State Management
- Local storage persistence (`praxis_agent_state`)
- Conversation history saved
- Context preserved across page refreshes
- State can be reset/cleared

## How It Works

### User Flow

1. **Entry**: User selects "Praxis Agent" from home screen
2. **Intake**: Agent asks about occasion, location/time, preferences (max 3 questions)
3. **Optional Capture**: User can add photo/video for fit/color refinement, or skip
4. **Generation**: Agent generates 3 outfit options automatically
5. **Results**: User sees outfits and can refine with natural language ("more formal", "less black", etc.)

### Agent Logic (Mock Provider)

The `PraxisAgentOrchestrator` uses deterministic rules:

- **Text Parsing**: Extracts keywords for occasion (wedding, work, dinner, date, party), location, time, vibe, budget
- **Stage Management**: Tracks conversation stage and determines next action
- **Outfit Generation**: Converts agent context to `FlowData` format and uses existing `generateOutfits` function
- **Refinement**: Parses refinement text and updates context, then regenerates outfits

### Example Interactions

**User**: "Work dinner in Riyadh"
**Agent**: "What's your priority? Safe and polished, sharp and intentional, or relaxed and comfortable?"

**User**: "Sharp and intentional"
**Agent**: "Perfect! I can refine fit and color if you'd like to share a photo, or I can generate your looks now."

**User**: "Skip"
**Agent**: "Generating your looks now..." → Navigates to results

**User** (on results): "more formal"
**Agent**: Updates outfits to be more formal

## Where to Plug in Real Providers

### 1. LLM Provider
Replace the `determineResponse()` method in `PraxisAgentOrchestrator`:

```typescript
// Current: Deterministic rules
private determineResponse(text: string): AgentResponse {
  // ... rule-based logic
}

// Future: LLM call
private async determineResponse(text: string): Promise<AgentResponse> {
  const response = await llmProvider.chat({
    messages: this.conversationHistory,
    context: this.context,
    systemPrompt: 'You are Praxis Agent...'
  });
  return parseLLMResponse(response);
}
```

### 2. Speech-to-Text Provider
Update `AgentVoiceRecorder.tsx`:

```typescript
// Current: Mock transcription
const mockTranscript = '[Voice message recorded - transcription coming soon]';

// Future: Real STT service
const transcript = await speechToTextService.transcribe(audioBlob);
```

Options:
- Web Speech API (browser-native, limited)
- OpenAI Whisper API
- Google Cloud Speech-to-Text
- AssemblyAI

### 3. Vision Provider (Photo/Video Analysis)
Add to `praxisAgentOrchestrator.ts`:

```typescript
async processAttachment(metadata, context) {
  // Current: Just stores URL
  // Future: Analyze image/video
  const analysis = await visionProvider.analyze({
    imageUrl: metadata.url,
    tasks: ['fit', 'color', 'body-proportions', 'skin-tone']
  });
  
  context.fitInfo = analysis.fit;
  context.colorProfile = analysis.colors;
  // ... update context
}
```

Options:
- Existing `photoAnalysis.ts` service (already in codebase)
- OpenAI Vision API
- Custom ML model

## Testing Locally

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to home** (`/`)
   - Should see three options: "Style a moment", "Praxis Agent", "Build my personal style"

3. **Click "Praxis Agent"**
   - Should navigate to `/agent`
   - Should see welcome message and suggested prompts

4. **Test conversation flow**:
   - Type "Work dinner in Riyadh" or click a suggested prompt
   - Agent should ask clarifying questions
   - After 1-3 exchanges, should navigate to `/agent/capture` or `/agent/results`

5. **Test capture** (optional):
   - Click attachment button or navigate to `/agent/capture`
   - Try uploading a photo or skipping
   - Should navigate to results

6. **Test results**:
   - Should see 3 outfit cards
   - Try refining: "more formal", "less black", "hot weather"
   - Results should update in place

7. **Test persistence**:
   - Start a conversation, refresh page
   - Conversation should be restored from localStorage

## Known Limitations (MVP)

1. **Voice Transcription**: Currently shows placeholder message. Real STT not implemented.
2. **Photo/Video Analysis**: Files are stored locally but not analyzed. Uses existing photo analysis service integration point.
3. **LLM**: Uses deterministic rule-based responses. Real LLM integration point ready.
4. **Refinement**: Basic keyword matching. Real LLM would provide better understanding.

## Next Steps for Production

1. **Integrate LLM**: Replace mock provider with OpenAI/Anthropic/etc.
2. **Add Speech-to-Text**: Implement real voice transcription
3. **Enhance Photo Analysis**: Use existing `photoAnalysis.ts` service in capture flow
4. **Improve Refinement**: Use LLM for better natural language understanding
5. **Add Analytics**: Track agent usage, conversation length, refinement patterns
6. **Error Handling**: Add retry logic, better error messages
7. **Accessibility**: Enhance keyboard navigation, screen reader support

## Design Notes

- Mobile-first: All components optimized for thumb-friendly interaction
- Consistent with existing Praxis design system
- Minimal animations (as requested)
- Progressive disclosure: Only show what's needed at each step
- Premium feel: Clean, calm, decisive UI
