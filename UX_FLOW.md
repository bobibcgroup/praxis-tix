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

2. **History Not Saved for Quick Flow**
   - **Issue**: Quick Flow outfits are never saved to history, even for signed-in users
   - **Current**: Only Personal Flow try-on results are saved (step 17)
   - **Suggestion**: Save Quick Flow outfit selections to history when user is authenticated, even without try-on

3. **History Only Saves After Try-On**
   - **Issue**: Personal Flow only saves to history if try-on completes successfully
   - **Current**: If user skips try-on or it fails, outfit selection is lost
   - **Suggestion**: Save outfit selection immediately when user selects an outfit, regardless of try-on status

4. **Mode Selection Confusion**
   - **Issue**: "Build my personal style" button shows sign-in prompt, but user might not understand why
   - **Suggestion**: Add tooltip or helper text explaining that personal flow requires an account

5. **No Clear Value Proposition**
   - **Issue**: Users don't understand the difference between Quick and Personal flows
   - **Suggestion**: Add brief descriptions under each option explaining benefits

### 🟡 Medium Priority Issues

4. **No Profile Management/Editing**
   - **Issue**: Users cannot edit their profile after creation (Style DNA, fit preferences, lifestyle)
   - **Current**: Profile is read-only, can only be created once
   - **Suggestion**: Add "Edit Profile" button in Profile page to update Style DNA, fit preferences, lifestyle, and re-upload photo

5. **No Account Settings**
   - **Issue**: No account settings page for signed-in users
   - **Missing**: Email preferences, notification settings, privacy controls, account deletion
   - **Suggestion**: Create Settings page accessible from UserButton dropdown with:
     - Account information (email, name)
     - Notification preferences
     - Privacy settings
     - Data export option
     - Account deletion option

6. **History Page Lacks Functionality**
   - **Issue**: History page is read-only with no controls
   - **Missing**: Delete entries, filter by occasion/date, search, sort options, favorites
   - **Suggestion**: Add:
     - Delete button for each history entry
     - Filter by occasion type
     - Sort by date (newest/oldest)
     - Search by outfit title/items
     - "Add to favorites" button (favorites functions exist but not used in UI)
     - "Use this outfit again" button to restart flow with same occasion

7. **No Favorites Feature**
   - **Issue**: `addToFavorites` and `removeFromFavorites` functions exist but are never called
   - **Missing**: No UI to favorite outfits, no favorites page
   - **Suggestion**: 
     - Add heart icon to outfit cards in Results and History pages
     - Create Favorites page showing all favorited outfits
     - Add "Favorites" link in header navigation

8. **Profile Page Missing Features**
   - **Issue**: Profile page only shows Style DNA if it exists, no other controls
   - **Missing**: Edit profile, view/delete photo, update preferences, export profile data
   - **Suggestion**: Add:
     - "Edit Profile" button to update Style DNA and preferences
     - "View/Change Photo" option
     - "Export My Data" button (download profile as JSON)
     - "Delete Profile" option

9. **Progress Indicator Inconsistency**
   - **Issue**: Progress shows 1-3 for Quick Flow, but there are 6 steps total
   - **Suggestion**: Show progress for all steps, or clarify what "progress" means

10. **Error Handling**
    - **Issue**: Some errors show technical messages to users
    - **Suggestion**: Create user-friendly error messages with actionable steps

11. **Loading States**
    - **Issue**: Virtual try-on polling doesn't show progress percentage
    - **Suggestion**: Add progress indicator or estimated time remaining

12. **Navigation Confusion**
    - **Issue**: "Start over" button in header might be confusing
    - **Suggestion**: Rename to "Restart" or "New search" for clarity

13. **Missing Skip Options**
    - **Issue**: Some steps don't have skip options, forcing users through all steps
    - **Suggestion**: Add skip options where appropriate (e.g., Fit Calibration, Wardrobe)

### 🟢 Low Priority / Enhancement Suggestions

14. **User Dashboard**
    - **Suggestion**: Create a dashboard page showing:
      - Recent outfit selections
      - Style DNA summary
      - Quick stats (outfits saved, occasions styled, etc.)
      - Quick actions (start new flow, view history, edit profile)

15. **Profile Export/Import**
    - **Suggestion**: Allow users to export their profile data (JSON) and import it on another device
    - **Use Case**: Switching devices, backup, data portability

16. **Outfit Collections**
    - **Suggestion**: Allow users to create custom collections (e.g., "Work Outfits", "Date Night", "Weekend")
    - **Suggestion**: Organize history into collections for better management

17. **Outfit Sharing**
    - **Suggestion**: Add "Share Outfit" button to history entries
    - **Suggestion**: Generate shareable links for outfits (with try-on images)
    - **Suggestion**: Social media sharing with pre-filled captions

18. **Outfit Comparison**
    - **Suggestion**: Allow users to compare multiple outfits side-by-side
    - **Suggestion**: "Compare" button in History page to select 2-3 outfits

19. **Outfit Recommendations Based on History**
    - **Suggestion**: Analyze user's history to suggest similar outfits
    - **Suggestion**: "You might also like" section based on past selections

20. **Empty States**
    - **Suggestion**: Add empty states for History page when user has no saved outfits
    - **Suggestion**: Add empty state for Favorites page
    - **Suggestion**: Add empty state for Profile when no Style DNA exists

21. **Onboarding**
    - **Suggestion**: Add a brief onboarding tour for first-time users
    - **Suggestion**: Show tooltips explaining features (History, Profile, Favorites)

22. **Feedback Collection**
    - **Issue**: StepFeedback component exists but is never used
    - **Suggestion**: Integrate feedback collection after outfit selection, or remove component
    - **Suggestion**: Add "Rate this outfit" feature in History page

23. **Accessibility**
    - **Suggestion**: Add ARIA labels, keyboard navigation improvements, screen reader support

24. **Mobile Optimization**
    - **Issue**: Some buttons are hidden on mobile (History, My Style)
    - **Suggestion**: Add mobile-friendly navigation menu
    - **Suggestion**: Bottom navigation bar for mobile with quick access to Flow, History, Profile

25. **Performance**
    - **Suggestion**: Implement image lazy loading, optimize bundle size, add loading skeletons
    - **Suggestion**: Paginate History page for users with many saved outfits

26. **Analytics**
    - **Suggestion**: Add analytics tracking for:
      - Flow completion rates
      - Step drop-off points
      - Outfit selection patterns
      - Try-on usage
      - History page views
      - Profile edits

27. **Social Sharing**
    - **Suggestion**: Enhance share functionality with pre-filled text, image previews
    - **Suggestion**: Share Style DNA profile as a visual card

28. **Retry Logic**
    - **Suggestion**: Add automatic retry for failed API calls with exponential backoff

29. **Caching**
    - **Suggestion**: Cache outfit recommendations to avoid regenerating same results
    - **Suggestion**: Cache user profile data to reduce Supabase queries

30. **Personalization**
    - **Suggestion**: Remember user preferences across sessions, show personalized greetings
    - **Suggestion**: Show "Welcome back" message with last outfit selected
    - **Suggestion**: Suggest outfits based on time of day, weather, or occasion frequency

31. **Help/Support**
    - **Suggestion**: Add help tooltips, FAQ section, or support chat
    - **Suggestion**: Add "How to use" guide for new users

32. **Data Management**
    - **Suggestion**: Add "Clear History" option in Settings
    - **Suggestion**: Add "Delete All Favorites" option
    - **Suggestion**: Show storage usage (how many outfits saved, profile size)

33. **Notifications**
    - **Suggestion**: Email notifications for:
      - New outfit recommendations
      - Style DNA updates
      - Weekly outfit suggestions
    - **Suggestion**: In-app notifications for saved outfits, profile updates

34. **Profile Photo Management**
    - **Suggestion**: Allow users to update/replace their profile photo
    - **Suggestion**: Show photo preview in Profile page
    - **Suggestion**: Option to delete photo and re-upload

35. **Style DNA Evolution**
    - **Suggestion**: Show how Style DNA has changed over time
    - **Suggestion**: Track style preferences evolution based on outfit selections

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

### Immediate (Critical for Signed-In Users)
1. ✅ ~~Fix Quick Flow try-on logic (Step 5)~~ **COMPLETED**
2. **Save Quick Flow outfits to history** - Currently only Personal Flow saves history
3. **Save outfit selection immediately** - Don't wait for try-on completion
4. **Add Edit Profile functionality** - Allow users to update Style DNA and preferences

### Short-term (Essential User Features)
5. **Create Account Settings page** - Email, notifications, privacy, account deletion
6. **Add Favorites UI** - Implement favorites feature (functions exist but unused)
7. **Enhance History page** - Add delete, filter, search, sort, favorites
8. **Add user-friendly error messages** - Replace technical errors with actionable steps

### Medium-term (Enhanced Experience)
9. **Add onboarding tour** - Guide new users through features
10. **Improve mobile navigation** - Bottom nav bar, better mobile menu
11. **Add Profile photo management** - Update/replace photo, preview in Profile
12. **Implement outfit sharing** - Shareable links, social media integration

### Long-term (Advanced Features)
13. **Create User Dashboard** - Overview of activity, stats, quick actions
14. **Add Outfit Collections** - Custom collections for organizing outfits
15. **Implement Analytics** - Track usage, completion rates, preferences
16. **Add Notifications** - Email and in-app notifications for updates
17. **Profile Export/Import** - Data portability and backup
18. **Style DNA Evolution** - Track style changes over time

---

*Last Updated: January 2025*
