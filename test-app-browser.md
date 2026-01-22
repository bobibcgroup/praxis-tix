# Browser-Based Test Checklist for Praxis Tix

## Prerequisites
- App deployed and accessible
- Browser with developer console open
- Test user account created (or use sign-up flow)

---

## 1. Route Accessibility Tests

### ✅ Public Routes (No Auth Required)
- [ ] `/` - Flow page loads
- [ ] `/landing` - Landing page loads
- [ ] `/nonexistent` - Shows 404 page

### ✅ Protected Routes (Auth Required)
- [ ] `/history` - Redirects to `/` if not signed in
- [ ] `/profile` - Redirects to `/` if not signed in
- [ ] `/favorites` - Redirects to `/` if not signed in
- [ ] `/settings` - Redirects to `/` if not signed in

### ✅ Authenticated Access
- [ ] Sign in
- [ ] `/history` - Loads successfully
- [ ] `/profile` - Loads successfully
- [ ] `/favorites` - Loads successfully
- [ ] `/settings` - Loads successfully

---

## 2. Quick Flow Tests

### Step-by-Step Flow
- [ ] **Step 0**: Mode selection shows two options
- [ ] **Step 1**: Select occasion (Work/Date/Dinner/Wedding/Party)
- [ ] **Step 2**: Fill context (location, when, setting)
- [ ] **Step 3**: Select preferences (priority, budget)
- [ ] **Step 4**: Results page shows 3 outfits
- [ ] **Step 5**: Complete page shows with upsell

### Quick Flow Features
- [ ] Back button works on all steps
- [ ] Progress indicator shows (1/3, 2/3, 3/3)
- [ ] "Start over" button appears in header
- [ ] Can select an outfit
- [ ] **If signed in**: Outfit saves to history (check History page)

---

## 3. Personal Flow Tests

### Authentication Check
- [ ] Clicking "Build my personal style" without sign-in shows sign-in prompt
- [ ] After signing in, Personal Flow starts

### Step-by-Step Flow
- [ ] **Step 10**: Photo upload (can skip)
- [ ] **Step 11**: Fit calibration (can skip)
- [ ] **Step 12**: Select lifestyle
- [ ] **Step 13**: Inspiration (can skip or upload/preset)
- [ ] **Step 14**: Wardrobe (can skip)
- [ ] **Step 15**: Loading/generation step
- [ ] **Step 16**: Personal results show 3 outfits
- [ ] **Step 17**: Virtual try-on (if photo uploaded) or skip to Style DNA
- [ ] **Step 18**: Style DNA page shows

### Personal Flow Features
- [ ] Back button works on all steps
- [ ] Progress indicator shows (1/5, 2/5, etc.)
- [ ] Can skip optional steps
- [ ] Outfit saves immediately when selected (check History)
- [ ] Try-on image updates history entry
- [ ] "Save my style" button saves profile

---

## 4. History Page Tests

### Basic Functionality
- [ ] Page loads with saved outfits
- [ ] Empty state shows when no history
- [ ] Each entry shows: image, title, occasion, date, items

### Management Features
- [ ] **Delete**: Click delete → confirmation dialog → entry removed
- [ ] **Filter**: Filter by occasion (Work/Date/Dinner/Wedding/Party/All)
- [ ] **Search**: Search by outfit title or items
- [ ] **Sort**: Sort by newest/oldest
- [ ] **Favorites**: Heart icon toggles favorite status
- [ ] **Use Again**: Button navigates to Flow with occasion pre-selected

### Edge Cases
- [ ] Filter + search work together
- [ ] Clear filters button works
- [ ] No results message shows when filters match nothing

---

## 5. Favorites Page Tests

### Basic Functionality
- [ ] Page loads with favorited outfits
- [ ] Empty state shows when no favorites
- [ ] Can unfavorite from Favorites page

### Integration
- [ ] Favorites added from Results page appear here
- [ ] Favorites added from History page appear here
- [ ] Unfavoriting removes from page immediately

---

## 6. Profile Page Tests

### Display
- [ ] Shows Style DNA if profile exists
- [ ] Shows color palette if photo analyzed
- [ ] Shows fit preferences if set
- [ ] Shows lifestyle if set
- [ ] Empty state shows if no profile

### Actions
- [ ] "Edit Profile" button navigates to Personal Flow
- [ ] "View Outfit History" button navigates to History
- [ ] "Settings" button navigates to Settings

---

## 7. Settings Page Tests

### Display
- [ ] Shows account information (email, name)
- [ ] Shows data management section
- [ ] Shows danger zone section

### Actions
- [ ] **Export Data**: Downloads JSON file with user data
- [ ] **Delete Account**: Shows confirmation dialog
- [ ] Back button navigates to Profile

---

## 8. Favorites Feature Tests

### Adding Favorites
- [ ] Heart icon on Results page (Quick Flow)
- [ ] Heart icon on Personal Results page
- [ ] Heart icon on History page entries
- [ ] Visual feedback (filled vs outline heart)
- [ ] Toast notification on add/remove

### Favorites Persistence
- [ ] Favorites persist after page refresh
- [ ] Favorites sync across pages
- [ ] Favorites appear in Favorites page

---

## 9. Data Persistence Tests

### Quick Flow
- [ ] **Signed-in user**: Outfit saves to history immediately
- [ ] **Not signed-in**: Outfit not saved (expected)

### Personal Flow
- [ ] Outfit saves immediately when selected
- [ ] Try-on URL updates existing history entry
- [ ] Profile saves when "Save my style" clicked
- [ ] Profile updates when edited

---

## 10. Navigation Tests

### Header Navigation
- [ ] History link visible (desktop)
- [ ] Favorites link visible (desktop)
- [ ] My Style link visible (desktop)
- [ ] UserButton dropdown works

### Flow Navigation
- [ ] "Start over" button resets flow
- [ ] Back buttons work correctly
- [ ] Progress indicator shows correctly

---

## 11. Error Handling Tests

### Network Errors
- [ ] Graceful handling of API failures
- [ ] User-friendly error messages
- [ ] Retry options where applicable

### Edge Cases
- [ ] Empty states display correctly
- [ ] Loading states show during async operations
- [ ] Form validation works

---

## 12. Authentication Tests

### Sign In/Out
- [ ] Sign in modal works
- [ ] Sign out works
- [ ] Protected routes redirect when signed out
- [ ] UserButton shows profile picture

### Protected Features
- [ ] Personal Flow requires sign-in
- [ ] History requires sign-in
- [ ] Profile requires sign-in
- [ ] Favorites requires sign-in
- [ ] Settings requires sign-in

---

## 13. Mobile Responsiveness Tests

- [ ] All pages responsive on mobile
- [ ] Navigation works on mobile
- [ ] Forms usable on mobile
- [ ] Images display correctly

---

## 14. Performance Tests

- [ ] Pages load quickly
- [ ] Images lazy load
- [ ] No console errors (except expected warnings)
- [ ] Smooth transitions between pages

---

## Test Results

**Date**: _______________
**Tester**: _______________
**Environment**: _______________

**Total Tests**: _______________
**Passed**: _______________
**Failed**: _______________

**Notes**:
_________________________________________________
_________________________________________________
_________________________________________________
