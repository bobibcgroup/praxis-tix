# Praxis Tix - User Experience Flow Documentation

## Overview
Praxis Tix is a personalized outfit recommendation app that helps users find the right outfit for any occasion. The app offers two main flows: **Quick Flow** (occasion-based) and **Personal Flow** (personalized style profile).

---

## User Journey Map

### Entry Point
- **Route**: `/` (Flow page)
- **Authentication**: Not required initially
- **First Screen**: Mode Selection (Step 0)

---

## Flow 1: Quick Flow (Occasion-Based)

**Access**: Available to all users (no login required)
**Duration**: ~2-3 minutes
**Steps**: 6 steps total

### Step 0: Mode Selection
**Component**: `StepModeSelect`
- User sees two options:
  1. **"Style a moment"** - Quick, occasion-based (leads to Quick Flow)
  2. **"Build my personal style"** - Personalized (requires login, leads to Personal Flow)
- **UX Note**: If user clicks "Build my personal style" without login, they see a sign-in prompt instead of the button

### Step 1: Occasion Selection
**Component**: `StepOccasion`
- User selects the occasion/event type:
  - Work
  - Date
  - Dinner
  - Wedding
  - Party
- **Progress**: 1/3 shown in progress indicator
- **Navigation**: Back → Step 0, Next → Step 2

### Step 2: Context Details
**Component**: `StepContext`
- User provides context about:
  - Location (where)
  - Time (when)
  - Setting (formal/casual)
- **Progress**: 2/3 shown
- **Navigation**: Back → Step 1, Next → Step 3

### Step 3: Preferences
**Component**: `StepPreferences`
- User selects:
  - Priority (comfort, style, etc.)
  - Budget range
- **Progress**: 3/3 shown
- **Navigation**: Back → Step 2, Submit → Step 4 (generates outfits)

### Step 4: Results
**Component**: `StepResults`
- Displays 3 outfit recommendations:
  - **Safest choice** - Conservative, reliable
  - **Sharper choice** - Bold, statement-making
  - **Relaxed choice** - Comfortable, casual
- User can:
  - View outfit details
  - See alternatives (if available)
  - Select an outfit
- **Navigation**: Back → Step 3, Select → Step 5

### Step 5: Complete
**Component**: `StepComplete`
- **Note**: Quick Flow skips virtual try-on (no photo upload in Quick Flow)
- Shows completion message
- **Upsell**: Prompts user to:
  - Sign in (if not authenticated) to save outfits
  - Build personal style profile (if authenticated)
- **Actions**:
  - "Style another moment" - Restarts Quick Flow
  - "Build my style profile" - Starts Personal Flow (requires login)

### Step 6: Complete
**Component**: `StepComplete`
- Shows completion message
- **Upsell**: Prompts user to:
  - Sign in (if not authenticated) to save outfits
  - Build personal style profile (if authenticated)
- **Actions**:
  - "Style another moment" - Restarts Quick Flow
  - "Build my style profile" - Starts Personal Flow (requires login)

---

## Flow 2: Personal Flow (Personalized Style Profile)

**Access**: Requires authentication (login)
**Duration**: ~5-10 minutes (one-time setup)
**Steps**: 9 steps total

### Authentication Guard
- All Personal Flow steps (10-18) check authentication
- If user is not logged in, redirects to Step 0 (Mode Selection)
- **UX Note**: User must sign in before accessing Personal Flow

### Step 10: Photo Upload
**Component**: `StepPhoto`
- User uploads a photo of themselves
- Photo analysis extracts:
  - Skin tone
  - Contrast level
  - Body proportions
  - Face shape
- **Progress**: 1/5 shown
- **Navigation**: Back → Step 0, Skip/Continue → Step 11

### Step 11: Fit Calibration
**Component**: `StepFitCalibration`
- User provides:
  - Height (optional)
  - Height unit (imperial/metric)
  - Fit preference (slim, regular, relaxed)
- **Progress**: 2/5 shown
- **Navigation**: Back → Step 10, Skip/Continue → Step 12

### Step 12: Lifestyle
**Component**: `StepLifestyle`
- User selects lifestyle type:
  - Work
  - Casual
  - Formal
  - Athletic
  - Creative
- **Progress**: 3/5 shown
- **Navigation**: Back → Step 11, Select → Step 13

### Step 13: Inspiration
**Component**: `StepInspiration`
- User can:
  - Upload inspiration photos, OR
  - Select from preset style directions
- **Progress**: 4/5 shown
- **Navigation**: Back → Step 12, Skip/Continue → Step 14

### Step 14: Wardrobe
**Component**: `StepWardrobe`
- User can optionally add items from their existing wardrobe
- **Progress**: 5/5 shown
- **Navigation**: Back → Step 13, Skip/Continue → Step 15 (starts generation)

### Step 15: Loading/Generation
**Component**: `StepPersonalLoading`
- Generates personalized outfit recommendations
- Shows loading state with progress
- **Error Handling**: Shows retry option if generation fails
- **Navigation**: Back → Step 14, Auto-advance → Step 16

### Step 16: Personal Results
**Component**: `StepPersonalResults`
- Displays personalized outfit recommendations based on:
  - Photo analysis (skin tone, contrast, proportions)
  - Lifestyle preferences
  - Inspiration/style direction
  - Wardrobe items (if provided)
- User selects favorite outfit
- **Navigation**: Back → Step 14, Select → Step 17

### Step 17: Virtual Try-On
**Component**: `StepVirtualTryOn`
- **Condition**: Only shown if user uploaded photo in Step 10
- If no photo: Skips directly to Step 18
- If photo available:
  - Generates virtual try-on image
  - Uses async Replicate API (polls for completion)
  - Shows result with download/share options
- **Navigation**: Back → Step 16, Continue → Step 18

### Step 18: Style DNA
**Component**: `StepStyleDNA`
- Shows user's personalized style profile:
  - Color palette recommendations
  - Metal recommendations (based on skin tone)
  - Style direction summary
- **Actions**:
  - "Style me again" - Restarts Personal Flow
  - "Save my style" - Saves profile to database (if authenticated)
- **Navigation**: Back → Step 17

---

## Additional Pages

### History Page (`/history`)
**Access**: Requires authentication
- Shows user's outfit history
- Displays:
  - Outfit images
  - Occasion/context
  - Date created
- **Navigation**: Accessible via header "History" button

### Profile Page (`/profile`)
**Access**: Requires authentication
- Shows user's saved style profile (Style DNA)
- Displays:
  - Color palette
  - Metal recommendations
  - Style preferences
- **Navigation**: Accessible via header "My Style" button

### Landing Page (`/landing`)
**Access**: Public
- Marketing/landing page with:
  - Hero section
  - Problem statement
  - How it works
  - Why different
  - Who it's for
  - Early access signup
- **Note**: Currently not linked from main flow

---

## Technical Flow Details

### Virtual Try-On Process (Async)
1. **Create Prediction**: Frontend calls `/api/replicate-proxy`
   - Returns immediately with prediction ID
2. **Poll Status**: Frontend polls `/api/replicate-status` every 1.2 seconds
   - Checks prediction status (starting, processing, succeeded, failed)
3. **Display Result**: When status = "succeeded", shows generated image
4. **Timeout**: Stops polling after 90 seconds, shows retry option

### Authentication Flow
- **Clerk** handles authentication
- **Protected Routes**: Personal Flow steps, History, Profile
- **Public Routes**: Quick Flow, Landing, NotFound
- **UserButton**: Shows in header when authenticated (profile pic + dropdown)

### Data Persistence
- **Outfit History**: Saved to Supabase when user completes try-on
- **Style Profile**: Saved to Supabase when user completes Personal Flow
- **Local Storage**: Used for temporary state (selected outfit, feedback)

---

## UX Issues & Suggestions

### 🔴 Critical Issues

1. ~~**Quick Flow Try-On Logic**~~ ✅ **FIXED**
   - **Issue**: Step 5 checked `personal.hasPhoto` but Quick Flow users don't have personal data
   - **Fix**: Quick Flow now correctly skips try-on and goes directly to completion
   - **Current**: Try-on is only available in Personal Flow where users upload photos

2. **Mode Selection Confusion**
   - **Issue**: "Build my personal style" button shows sign-in prompt, but user might not understand why
   - **Suggestion**: Add tooltip or helper text explaining that personal flow requires an account

3. **No Clear Value Proposition**
   - **Issue**: Users don't understand the difference between Quick and Personal flows
   - **Suggestion**: Add brief descriptions under each option explaining benefits

### 🟡 Medium Priority Issues

4. **Progress Indicator Inconsistency**
   - **Issue**: Progress shows 1-3 for Quick Flow, but there are 6 steps total
   - **Suggestion**: Show progress for all steps, or clarify what "progress" means

5. **Error Handling**
   - **Issue**: Some errors show technical messages to users
   - **Suggestion**: Create user-friendly error messages with actionable steps

6. **Loading States**
   - **Issue**: Virtual try-on polling doesn't show progress percentage
   - **Suggestion**: Add progress indicator or estimated time remaining

7. **Navigation Confusion**
   - **Issue**: "Start over" button in header might be confusing
   - **Suggestion**: Rename to "Restart" or "New search" for clarity

8. **Missing Skip Options**
   - **Issue**: Some steps don't have skip options, forcing users through all steps
   - **Suggestion**: Add skip options where appropriate (e.g., Fit Calibration, Wardrobe)

### 🟢 Low Priority / Enhancement Suggestions

9. **Empty States**
   - **Suggestion**: Add empty states for History page when user has no saved outfits

10. **Onboarding**
    - **Suggestion**: Add a brief onboarding tour for first-time users

11. **Feedback Collection**
    - **Issue**: StepFeedback component exists but is never used
    - **Suggestion**: Integrate feedback collection after outfit selection, or remove component

12. **Accessibility**
    - **Suggestion**: Add ARIA labels, keyboard navigation improvements, screen reader support

13. **Mobile Optimization**
    - **Issue**: Some buttons are hidden on mobile (History, My Style)
    - **Suggestion**: Add mobile-friendly navigation menu

14. **Performance**
    - **Suggestion**: Implement image lazy loading, optimize bundle size, add loading skeletons

15. **Analytics**
    - **Suggestion**: Add analytics tracking for:
      - Flow completion rates
      - Step drop-off points
      - Outfit selection patterns
      - Try-on usage

16. **Social Sharing**
    - **Suggestion**: Enhance share functionality with pre-filled text, image previews

17. **Retry Logic**
    - **Suggestion**: Add automatic retry for failed API calls with exponential backoff

18. **Caching**
    - **Suggestion**: Cache outfit recommendations to avoid regenerating same results

19. **Personalization**
    - **Suggestion**: Remember user preferences across sessions, show personalized greetings

20. **Help/Support**
    - **Suggestion**: Add help tooltips, FAQ section, or support chat

---

## Code Optimization Opportunities

### Removed Unused Code
- ✅ `StepFeedback` component (imported but never used)
- ✅ `generateFaceSwap` function (duplicate/unused)
- ✅ `uploadImageToTempHost` function (redundant wrapper)
- ✅ `NavLink` component (not used anywhere)
- ✅ Test files (example.test.ts, setup.ts)
- ✅ `App.css` (unused default styles)

### Suggested Optimizations

1. **Consolidate Authentication Guards**
   - **Current**: Each Personal Flow step has duplicate auth check
   - **Suggestion**: Create a `ProtectedStep` wrapper component

2. **Reduce Console Logs**
   - **Current**: 39 console.log/warn/error statements
   - **Suggestion**: Use proper logging service or remove debug logs

3. **Extract Constants**
   - **Suggestion**: Move step numbers, flow modes to constants file

4. **Type Safety**
   - **Suggestion**: Enable strict TypeScript mode, add missing type annotations

5. **Error Boundaries**
   - **Suggestion**: Add React Error Boundaries to catch and handle errors gracefully

6. **Code Splitting**
   - **Suggestion**: Lazy load Personal Flow components (only load when needed)

7. **Memoization**
   - **Suggestion**: Add React.memo to expensive components, useMemo for computed values

---

## File Structure Summary

### Active Components
- **Flow Steps**: 18 step components (all used)
- **UI Components**: 49 shadcn/ui components (all used)
- **Pages**: 5 pages (Flow, Landing, History, Profile, NotFound)
- **Services**: 15 lib files (all used)

### Removed Files
- `StepFeedback.tsx` - Unused component
- `NavLink.tsx` - Unused wrapper
- `generateFaceSwap()` - Unused function
- `uploadImageToTempHost()` - Redundant function
- Test files - Not actively used
- `App.css` - Unused styles

---

## Next Steps for Improvement

1. **Immediate**: Fix Quick Flow try-on logic (Step 5)
2. **Short-term**: Add user-friendly error messages, improve loading states
3. **Medium-term**: Add onboarding, improve mobile navigation
4. **Long-term**: Add analytics, enhance personalization, implement feedback collection

---

*Last Updated: January 2025*
