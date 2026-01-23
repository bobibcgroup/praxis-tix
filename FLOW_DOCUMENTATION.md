# Praxis App Flow Documentation

## Current App Flows

### 1. Quick Flow (Occasion-Based)
**Purpose**: Fast outfit recommendations for a specific moment

**Steps**:
1. **Mode Select** → User chooses "Style a moment"
2. **Occasion** → Select: WEDDING, WORK, DINNER, DATE, PARTY
3. **Context** → 
   - Location (filtered by occasion)
   - Time (DAY/NIGHT)
   - Setting (auto-derived from location)
4. **Preferences** →
   - Priority: SIMPLE (safe), SHARP (polished), COMFORT (relaxed)
   - Budget: EVERYDAY, MID_RANGE, PREMIUM
5. **Results** → 3 outfits displayed
6. **Choose Outfit** → 
   - Save to history (if authenticated)
   - Style name modal (if authenticated)
   - Purchase page
7. **Virtual Try-On** (optional)
8. **Complete** → Upsell to personal flow

**Functions Used**:
- `generateOutfits(flowData)` - Generate 3 outfits
- `generateAlternativeOutfits()` - Show alternatives
- `saveOutfitToHistory()` - Save selection
- `updateOutfitHistoryStyleName()` - Name the style
- `generateVirtualTryOn()` - Create try-on image

---

### 2. Personal Flow (Personalized)
**Purpose**: Long-term style profile with personalized recommendations

**Steps**:
1. **Mode Select** → User chooses "Build my personal style"
2. **Photo** → 
   - Upload/take photo
   - Analyze: skin tone, contrast, body proportions, face shape
   - Crop if needed
3. **Fit Calibration** →
   - Height (cm or ft-in)
   - Fit preference: slim, regular, relaxed
4. **Lifestyle** → WORK, SOCIAL, CASUAL, MIXED
5. **Inspiration** →
   - Upload photo OR
   - Choose preset: QUIET_LUXURY, SMART_CASUAL, MODERN_MINIMAL, ELEVATED_STREET, CLASSIC_TAILORED, RELAXED_WEEKEND
6. **Wardrobe** (optional) →
   - Upload: top, jacket, bottom, shoes
   - Build outfits around owned items
7. **Loading** → Generate personalized outfits
8. **Personal Results** → 3 outfits (personalized)
9. **Choose Outfit** →
   - Save to history
   - Virtual Try-On (if photo available)
10. **Style DNA** → Final summary with style profile

**Functions Used**:
- `analyzePhoto()` - Analyze user photo
- `deriveStyleColorProfile()` - Create color profile
- `getRecommendedSwatches()` - Get color recommendations
- `generatePersonalOutfits()` - Generate personalized outfits
- `saveUserProfile()` - Save style DNA and preferences
- `generateVirtualTryOn()` - Create try-on image
- `updateOutfitHistoryTryOn()` - Save try-on to history

---

### 3. Agent Flow (Current - Basic)
**Purpose**: Conversational styling assistant

**Steps**:
1. **Chat** → Natural language conversation
2. **Capture** (optional) → Photo/video for analysis
3. **Results** → 3 outfits
4. **Choose** → Purchase page
5. **Try-On** (if photo available)

**Functions Used**:
- `processUserMessage()` - Handle conversation
- `processAttachment()` - Handle photo/video
- `generateOutfits()` - Generate outfits
- `refineOutfits()` - Refine based on feedback

---

## Conversion to Full AI Assistant Experience

### Unified Agent Flow
**Goal**: Handle ALL flows through natural conversation

**Key Principles**:
1. **Progressive Disclosure** - Only ask what's needed
2. **Context Awareness** - Remember previous inputs
3. **Natural Language** - Understand user intent
4. **Hands-Off** - Minimize user clicks
5. **Smart Defaults** - Infer when possible

### Enhanced Agent Capabilities Needed

#### 1. Flow Detection
- Detect if user wants quick or personal flow
- "I need something for tonight" → Quick flow
- "Build my style profile" → Personal flow
- "Help me find my style" → Personal flow

#### 2. Information Extraction
- Occasion: "wedding", "work dinner", "first date"
- Location: "Riyadh", "outdoor", "restaurant"
- Time: "evening", "night", "daytime"
- Preferences: "more formal", "comfortable", "sharp"
- Budget: "under $200", "premium", "affordable"

#### 3. Photo Handling
- Request photo when needed
- Analyze automatically
- Use for personalization
- Store for try-on

#### 4. Personal Flow Features
- Fit calibration through conversation
- Lifestyle detection from context
- Inspiration from photos or descriptions
- Wardrobe integration

#### 5. Results & Actions
- Show 3 outfits
- Allow refinement
- Generate alternatives
- Virtual try-on
- Save to history
- Purchase flow

#### 6. Advanced Features
- Style DNA generation
- Color palette recommendations
- Outfit locking (build around owned items)
- Weather-aware suggestions
- Budget filtering

---

## Implementation Plan

### Phase 1: Enhanced Context Understanding
- Improve LLM prompts for better extraction
- Handle all occasion types
- Understand location/time context
- Parse preferences accurately

### Phase 2: Personal Flow Integration
- Photo analysis integration
- Fit calibration via conversation
- Lifestyle detection
- Inspiration handling
- Wardrobe integration

### Phase 3: Advanced Features
- Style DNA generation
- Color recommendations
- Outfit alternatives
- Weather integration
- Budget parsing

### Phase 4: Polish
- Better error handling
- Loading states
- Confirmation flows
- History integration
