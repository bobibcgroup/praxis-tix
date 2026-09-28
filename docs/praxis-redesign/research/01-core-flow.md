# Praxis core flow: UX code audit

Scope: `src/pages/Flow.tsx` (route `/`), `src/components/app/*`, `src/lib/*` called by the flow, `src/pages/Dashboard.tsx`, and the `api/*` handlers they hit. Read-only audit; all paths relative to `/Users/clawdbob/ClaudeProjects/praxis`.

Headline: the whole product lives in one React component with a numeric `step` state (`src/pages/Flow.tsx:90`), 20 step IDs, two branches, and no URL per step. The quick branch's result is real (Gemini text + image generation from a ~16-outfit library), but two of the three things the personal branch promises (biometric Style DNA, personalized outfits) are placeholder or library-only, and the one wow moment it can deliver (face-swap try-on) is buried at the 18th step.

---

## 1. Step map

Step IDs are the `case` labels in `renderStep()` (`Flow.tsx:399-869`). "Back" in the header ("Start over", `Flow.tsx:917-924`) resets everything.

### Entry: step 0, mode select (`StepModeSelect.tsx`)
- Sees: "Let's style your next look." + "One-tap outfits, or a style built just for you." Two cards.
- Inputs: choose Flow 1 "Style a moment / Get an outfit" (dominant card) or Flow 2 "Build my personal style" (quiet card, badge "Sign in to personalize" if anonymous, "Personalized for you" if signed in, `StepModeSelect.tsx:57-66`).
- No back. Next: card tap sets `mode` and jumps to step 1 or 10 (`Flow.tsx:405-413`). Sign-in is NOT enforced for Flow 2 despite the badge (`Flow.tsx:410`).
- Deep links: Dashboard tiles and History "use again" navigate to `/` with `state.occasion` -> mode quick, step 1 with occasion preselected (`Flow.tsx:127-131`). Profile "edit" navigates with `state.editProfile` -> mode personal, step 10 (`Flow.tsx:124-126`).

### Flow 1: "Style a moment" (quick)

| Step | Screen | Inputs asked | Primary CTA | Secondary / skip / back | Advances when |
|---|---|---|---|---|---|
| 1 | Occasion (`StepOccasion.tsx`) "What's the occasion?" | 1 choice of 5: Wedding, Work, Dinner, Date, Party | tap = advance (auto) | Back arrow -> 0 | option tap (`:32`) |
| 2 | Context (`StepContext.tsx`) "Set the context" | Location (2-col grid, 3-5 options filtered by occasion `:33-39`); Time of day Day/Night (hidden for Dinner, auto Night `:67,151`; Day auto-defaulted `:121-125`). Setting is inferred, never shown (`:16-29`). | "Next" (disabled until location+time) | "Back" -> 1 | Next |
| 3 | Preferences (`StepPreferences.tsx`) "Your priorities" | Vibe: Safe & clean / Sharp & confident / Relaxed & easy; Budget: Considered / Elevated / Unrestricted | "Show my looks" (sticky bottom on mobile `:80`) | "Back" -> 2 | Submit -> 35 |
| 35 | Photo gate (`StepQuickPhotoGate.tsx`) "Got it." | none | "Add photos for precision" -> 36 | "Skip (lower accuracy)" -> generate; Back -> 3 | either button |
| 36 | Quick photo capture (`StepQuickPhotoCapture.tsx`) | Phase 1 face photo, phase 2 full-body photo. Each: "Upload photo" (file picker) or "Take photo" (getUserMedia, `:164-181`). Server accept/reject per photo with `how_to_fix` (`:108-125`). | Upload / Take photo | Back (body phase -> face phase, face -> 35, `:200-208`) | body photo accepted + finalize -> `onDone()` -> generate |
| 4 (loading) | Results loading (`StepResults.tsx:189-238`) "Styling your moment…" | none | none | "Back" -> 3 is visible during loading (`:181-187`) | fetch resolves (`Flow.tsx:148-173`) |
| 4 | Results (`StepResults.tsx:240-404`) "Choose your outfit / Tap the one that feels right." | Optional text "Name this look", optional date "When is it?" (`:256-274`); select 1 of 3 cards. Per card: thumbs up/down, "Swap this one", "More options" (bottom sheet), "Take your friend's opinion" (share), favorite heart (signed in), expand "why this works", "Shop similar" link. | "Choose this look" (disabled until selection) | "Save all three to history" (signed in), "Share my looks", "Compare outfits" (fullscreen modal), "Show alternatives", Back -> 3, header "Start over" | Choose -> save to history if signed in (`Flow.tsx:496-543`) -> StyleNameModal if signed in (`:545-549`) else step 5 |
| modal | Style name (`StyleNameModal.tsx`) "Name Your Style" | text input | "Continue" | "Cancel" -> still goes to 5 (`Flow.tsx:893-896`) | either |
| 5 | Purchase (`StepPurchase.tsx`) "Complete Your Look" + confetti (`:43-45`) | none | 3x "Buy this" -> `example.com`, $89/$129/$159 hardcoded (`:15-37`) | "Style another moment" (restart), "Back to outfit selection" -> 4 | terminal |
| 6 | Complete (`StepComplete.tsx`) "This is the right choice." | none | "Build my style profile" (signed in) / "Sign in to build your style profile" | "Plan next look", "Email my looks" (copies URL), "Add to calendar" (.ics) | only reachable as fallback when `selectedOutfit` is null (`Flow.tsx:566-584`); effectively dead |

Branching inside Flow 1: photo gate is a fork with no downstream effect (see section 10, problem 3). Engine failure falls back to the static library with a toast (`Flow.tsx:159-167`).

### Flow 2: "Build my personal style" (personal)

| Step | Screen | Inputs asked | Primary CTA | Secondary / skip / back | Advances when |
|---|---|---|---|---|---|
| 10 | Photo (`StepPhoto.tsx:509-593`) "Optional: refine the fit" + "Calibration" card | "Start scan" (fullscreen mirrored camera modal `:410-503`, capture button) or "Upload photo" (file picker -> crop modal `PhotoCropModal.tsx`, drag crop, "Confirm crop" / "Retake"). Camera path skips crop (`:164-197`). | Start scan | "Skip this step" -> 11; Back -> 0 | after 1s "Perfect." interstitial (`:370-378`) + "Analyzing your photo..." spinner -> `onPhotoConfirmed` -> 11 |
| 11 | Fit calibration (`StepFitCalibration.tsx`) "Quick fit check" | Height (cm, or ft+in; unit toggle) number input, autoFocus (`:110,128`); Fit preference Slim/Regular/Relaxed | "Next" only appears once something is entered (`:178-193`) | "Skip" (becomes the only button when empty `:195-203`); Back -> 10 | Next / Skip -> 12 |
| 12 | Lifestyle (`StepLifestyle.tsx`) "Where do you spend most of your week?" | 1 of 4: Corporate office, Social & nights out, Casual & relaxed, Mixed | tap = advance | "Back" -> 11 | option tap. Required (no skip) |
| 13 | Inspiration (`StepInspiration.tsx`) "Show us a look you like (optional)" | "Upload inspiration photo" (-> preview sub-view, Confirm/Change) OR "Choose from examples" (-> 2x3 grid of swipeable style cards: Quiet luxury, Smart casual, Modern minimal, Elevated street, Classic tailored, Relaxed weekend; tap auto-confirms after 200ms `:229-235`) | Confirm | "Skip" -> 14; "Back" -> 12 | photo confirm / preset tap |
| 14 | Wardrobe (`StepWardrobe.tsx`) "Style what you already own / One item is enough." | Up to 4 photo uploads: Top, Jacket/Layer, Bottom, Shoes (tapping a row opens the OS picker immediately `:137-144`) | "Build my look" (always enabled, even with 0 items `:165-172`) | "I'll add my closet later" / "Skip for now" (two skips with different tracked reasons `:178-191`); Back -> 13 | any -> 15 |
| 15 | Loading (`StepPersonalLoading.tsx`) "Styling you…" 3-item process card + spinner | none | none | error state: "Try again" / "Go back" | 500ms artificial delay then synchronous local generation (`Flow.tsx:286-294`) -> 16 |
| 16 | Personal results (`StepPersonalResults.tsx`) "Choose your outfit / Chosen for {your build, coloring, lifestyle…}" | select 1 of 3 cards (labels Best for you / More expressive / More relaxed) | "Choose this look" | Back -> 14 (re-shows wardrobe, not loading) | Choose -> save history (signed in) -> 17 |
| 17 | Style DNA (`StepStyleDNA.tsx`) "Your Style DNA" | none | "Save my style" (or SignInButton wrapper) | "Try virtual try-on" (only if photo + selection `Flow.tsx:812-816`), "Style me again" (restart), "Back to my outfits" -> 16 | terminal; auto-saves on mount if signed in (`:175-181`) |
| modal | Style name (required, non-dismissable when signed in `StepVirtualTryOn.tsx:396`) | text | "Continue" | none | Continue -> generation starts |
| 18 | Virtual try-on (`StepVirtualTryOn.tsx`) "Your personalized look" + confetti on mount (`:69-71`) | none during generation | after image: "Wear this", "Save look", "This is perfect" (all three call the same `handleContinue` `:472-475,525`), Download, Share, 3x "Buy this" dummy links, fit feedback Perfect/Too tight/Too loose (toast only `:534-541`) | "Try different look" -> 16, "Swap item" -> 17 (it just goes back), "Go to Dashboard" while generating, "Continue to Style DNA" on error | onComplete -> updates history -> 17 |

Progress indicator: 6 dots for quick (photo steps collapsed into dot 4), 9 dots for personal (`Flow.tsx:362-380`). Dots have no labels.

### First-time vs returning
There is no returning-user branch inside the flow. `Flow.tsx` never calls `getUserProfile`; the only profile readers are `Profile.tsx`, `Settings.tsx` and `userSync.ts`. A signed-in user with a saved Style DNA gets the identical quick flow and identical results as an anonymous user. The only "returning" affordances are the Dashboard occasion tiles, which land on step 1 with the occasion preselected but still require the user to tap it again (`Flow.tsx:127-131` + `StepOccasion.tsx:32` only advances on click).

---

## 2. Interaction cost per journey

Counting minimum taps on the happy path; "decisions" = points where the user must choose between meaningful options.

### (a) First-time user -> first outfit result (Flow 1, anonymous, skip photos)
Screens: 6 (mode, occasion, context, preferences, photo gate, results). Taps: 9 (mode 1, occasion 1, location 1, time 1, Next 1, vibe 1, budget 1, Show my looks 1, Skip 1); 8 for Dinner (time hidden). Decisions: 7. Form fields: 0 typed. Scroll: none until results; results = 3 stacked 3:4 images on mobile, roughly 3 viewport-heights before the primary CTA. Wait: one blocking 25-50s request (section 4).

Chain: intent "I have a date Friday, what do I wear" -> tap Get an outfit -> Occasion screen -> Date -> Context screen (location grid) -> Restaurant, Night, Next -> Preferences -> vibe + budget -> Show my looks -> "Got it." photo upsell -> Skip -> "Styling your moment…" with cycling fake steps for ~30s -> 3 cards with generated images + confidence pill + why bullets -> decision: which card, or Swap / More options / Alternatives -> tap card -> Choose this look -> Purchase page with fake prices and confetti. Result: 3 concepts + 1 "chosen" one with no real next action.

### (b) First-time user -> Style DNA (Flow 2)
Fully skipped path: 9 screens, 8 taps (mode, Skip photo, Skip fit, lifestyle, Skip inspiration, Build my look, card, Choose). Yields a DNA page with default copy and default swatches only (`StepStyleDNA.tsx:23-29`, `:183-191`).
Full path: mode 1, Start scan 1, allow camera 1, capture 1, (or upload 1 + OS picker + drag crop + Confirm crop), wait "Perfect." 1s + analysis, height typing (3-4 keystrokes) + fit 1 + Next 1, lifestyle 1, Choose from examples 1, preset 1, wardrobe: 1-4 x (tap row + OS picker), Build my look 1, fake loading 0.5s, card 1, Choose 1 = ~15-20 taps, 1 typed field, 2-5 OS pickers/camera prompts, 12+ screens/sub-states, then DNA. Then optionally Try virtual try-on 1 -> forced name modal (typed field) -> 20-90s wait -> image.
Decisions: 9 (mode, scan-or-skip, fit-or-skip, lifestyle, inspiration-or-skip, preset, wardrobe-or-skip, outfit, try-on-or-not). Note the DNA is only reachable AFTER picking an outfit at step 16; the thing the card promised ("Build my personal style") is delivered as a postscript to an outfit choice.

### (c) Returning signed-in user -> a new outfit
From Dashboard: tile tap 1 -> Flow step 1 (occasion visually preselected, must tap again) 1 -> context 3 -> preferences 3 -> photo gate 1 -> results. 6 screens, 9 taps, same blocking wait. Identical to journey (a) plus a Dashboard visit; the saved profile, wardrobe, height, and DNA contribute nothing (`getOutfitsWithTrend(flowData)` at `Flow.tsx:152` receives only occasion/context/preferences). Signed-in users pay an extra modal (StyleNameModal, `Flow.tsx:545-549`) on Choose.

---

## 3. What the system produces

Quick flow result: 3 `Outfit` objects, one per tier (SAFEST / SHARPER / RELAXED), chosen from the ~16-entry static library (`src/lib/outfitLibrary.ts:324-335`) by the decision engine (`src/lib/decisionEngine/index.ts:54-92`), with Gemini-written 4-part reasoning and a composite confidence capped at 98 (`:87`). Images: 3 Gemini-generated 1K 3:4 photos returned as base64 data URLs (`api/generate-trend-outfits.ts:98-112`) and merged over the library image (`engineOutfitService.ts:70-71`). Displayed as stacked `OutfitCard`s: image (carousel if wardrobe pieces), title, Top/Bottom/Shoes/Extras rows, pills ("Best for you" replaces the tier label on card 1 `OutfitCard.tsx:382-390`; "Praxis confidence: N%"; "Event · Vibe · Color" breakdown), 2-line reason expandable to "Why this works" bullets + a second score line.

Actions on a quick result: select, Choose, Swap this one (library alternative for that tier), More options (sheet of library alternatives), Show alternatives (replace all three), Compare (fullscreen paged modal), favorite (Supabase), thumbs up/down (POST `/api/log-feedback`, `OutfitCard.tsx:98-112`), share per card or all, Save all three, name + date the look, Shop similar (static `praxis.style/shop` link). Regenerate with AI: not available; swaps and alternatives are library-only and keep the old library image (no trend image for swapped-in outfits, `outfitGenerator.ts:136`).

Personal flow result: 3 library outfits filtered by lifestyle -> occasion map and sorted by a local scoring function (`personalOutfitGenerator.ts:385-449`). No AI, no generated images, library image only. Cards add "Chosen to complement your coloring / Balanced for your proportions / Refined to suit your features" lines when analysis exists (`OutfitCard.tsx:411-427`), and a carousel of the user's own wardrobe photos with a "Your piece" badge.

Style DNA page: "Archetype unlocked" banner, italic identity phrase (Gemini copy or fallback), "Biometric" card (undertone / vertical line / shoulder, confidence %), 4-axis radar chart MINIMAL/STRUCT/BOLD/COMFORT derived from the kibbe cluster (`StyleDNARadarChart.tsx:95-111`), "Your season" swatches + 2 hardcoded avoid colors (`StepStyleDNA.tsx:134`), optimal palette (4 swatches + metals), Lean into / Avoid bullets, closing line. Because the face and body pipelines return constants (`facePipelineService.ts:39-49` = "Deep Winter", cool, 0.82; `bodyPipelineService.ts:33-51` = Natural 0.78 / Classic 0.22, 0.79), every user who submits an acceptable photo gets the same archetype, season, radar shape and "Confidence 81%".

Try-on: a face swap (`ddvinh1/inswapper`, `virtualTryOnService.ts:83`) of the user's face onto the outfit image, not garment try-on. Shown with a "Match 98%" badge that falls back to a literal 98 (`StepVirtualTryOn.tsx:432`), Download, Share (file share or URL copy), dummy purchase list, no-op fit feedback.

---

## 4. AI / latency map

| Call | Where | Model | Sequential? | Waiting UI | Est. duration | Streaming |
|---|---|---|---|---|---|---|
| Intent classification | `api/generate-outfits.ts:19` -> `decisionEngine/index.ts:47` | gemini-2.5-flash | 1 call | part of results loading | 1-2s | no |
| Reasoning per outfit | `decisionEngine/index.ts:59-76` | gemini-2.5-flash x3 | sequential `await` in a for loop | same | 3-6s | no |
| Trend text | `api/generate-trend-outfits.ts:143` | gemini-2.5-flash | 1 call | same | 1-2s | no |
| Outfit images | `api/generate-trend-outfits.ts:146-150` | gemini-2.5-flash-image x3 | sequential for loop | same | 15-40s | no; `maxDuration: 120` |
| Motivational line | `StepResults.tsx:100`, `StepPersonalResults.tsx:31` | gpt-4o-mini from the browser (`openaiService.ts:9`, `dangerouslyAllowBrowser`) | after results render | none (fades in) | 1-2s | no |
| Biometrics | `StepPhoto.tsx:173-176` -> `biometricApi.ts:80-89` | none (placeholders) | 4 sequential POSTs, image base64 sent twice | "Analyzing your photo..." spinner | 1-3s | no |
| Client photo heuristics | `photoAnalysis.ts:283` | canvas sampling | parallel with above | same | <0.5s | n/a |
| Personal outfit generation | `Flow.tsx:286-288` | none, local | 500ms `setTimeout` for "smooth transition" | 3-item process card + spinner, static pulse on item 1 only (`StepPersonalLoading.tsx:69-71`) | 0.5s | n/a |
| Style DNA copy | `StepStyleDNA.tsx:72` -> `api/generate-style-dna.ts` | gemini | 1 call | none: fallback copy renders immediately, then swaps when the response lands | 1-3s | no |
| Virtual try-on | `virtualTryOnService.ts:76` -> `api/replicate-generate.ts` | Replicate inswapper, server polls 1.2s up to 90s (`:114-115`) | 2 Supabase uploads first | bouncing-boxes animation + "Getting you dressed..." + "Go to Dashboard"; Dashboard polls localStorage every 2s and times out at 5 min (`Dashboard.tsx:195-220`) | 20-90s | no |

The quick-flow results wait is one blocking `fetch` chain (`Flow.tsx:152`) of roughly 25-50s. The "Processing" card cycles the highlighted dot every 1s independent of actual progress (`StepResults.tsx:88-94`), so it shows "Selecting optimal silhouettes…" long before the engine is even called. An SSE endpoint that emits real reasoning steps and outfits one by one exists (`api/generate-outfits-stream.ts:35-57`) plus a DNA-build stream (`api/events/stream.ts`), but no client code opens an `EventSource` or reads `text/event-stream` (grep of `src/` returns nothing). Streaming is built and unused.

---

## 5. Loading / empty / error states

Present:
- Loading: results (`StepResults.tsx:189-238`), personal loading (`StepPersonalLoading.tsx`), photo analyzing (`StepPhoto.tsx:395-407`), camera starting (`:447-453`), crop processing (`PhotoCropModal.tsx`), quick-photo "Preparing..." (`StepQuickPhotoCapture.tsx:216-222`), upload button "Uploading..." (`:278`), try-on animation, image skeleton pulse per card (`OutfitCard.tsx:256-258`), Save button "Loading..." while Clerk loads (`StepStyleDNA.tsx:394-397`).
- Errors: quick photo rejection with `how_to_fix` (`StepQuickPhotoCapture.tsx:253-258`), file validation + camera permission/not-found/in-use (`StepPhoto.tsx:100-115, 576-581`), inspiration file errors, personal generation error with retry, try-on error card, toasts for history/favorites failures.
- Empty: "No other options for this tier right now." in the alternatives sheet (`StepResults.tsx:397-399`); "No alternative for this tier right now" toast.

Missing:
- Results with 0 outfits: header renders with a disabled "Select an outfit" button and nothing else (`StepResults.tsx:276-316`); no empty state.
- Engine/trend failure: toast "Trend looks unavailable. Showing curated looks." then silent degradation to library images (`Flow.tsx:161-166`); the confidence pills simply vanish with no explanation.
- Wardrobe validation errors are swallowed: an oversized or non-image file does nothing (`StepWardrobe.tsx:51-54`).
- Style DNA copy has no loading state; the page shows fallback text then re-renders with AI text (content flash) (`StepStyleDNA.tsx:235, 322, 376`).
- Dashboard has a `loading` flag but renders nothing for it, and renders nothing at all below the tiles for a user with no history (`Dashboard.tsx:323, 373`); no first-run empty state.
- Try-on error copy is developer-facing: "add a payment method to your Replicate account", "REPLICATE_API_TOKEN is set in Vercel", "Check Vercel function logs" (`StepVirtualTryOn.tsx:209-216`).
- Camera permission denial in the quick photo step shows the raw browser error message (`StepQuickPhotoCapture.tsx:179`).
- "Save my style" success toast never fires for a manual tap: `onClick={handleSaveStyle}` passes the MouseEvent as `isAutoSave` (truthy) (`StepStyleDNA.tsx:136, 383`).
- Motivational line and Style DNA copy failures are silent by design (fine), but `generateMotivationalMessage` logs a console warning on every load when the key is absent (`openaiService.ts:5-7`).

---

## 6. State management

- Flow progress, mode, all answers, outfits, selection, photo data URLs, wardrobe data URLs: `useState` in `Flow.tsx:90-115` and child components. One route (`/`, `App.tsx:37`); no URL, history entry or storage per step. Refresh or browser Back loses everything. Generated trend images (base64) live only in memory.
- localStorage keys written by the flow: `praxis_selected_outfit` (`Flow.tsx:490, 742`), `praxis_active_generation`, `praxis_current_history_entry_id` (`Flow.tsx:782`, `StepVirtualTryOn.tsx:129`), `praxis_style_dna` (`StepStyleDNA.tsx:152`), `praxis_events` (`eventLog.ts:34`, 500-event ring), `praxis_lifestyle_usage` (`personalOutfitGenerator.ts:24`), `praxis_feedback` (dead component), `praxis_outfit_history` (Supabase fallback, `userService.ts:157`).
- Supabase (via `userService.ts`): outfit history (`saveOutfitToHistory`, including the outfit object and its `imageUrl`, which for quick-flow trend images is a ~1MB base64 string), favorites, user profile (`saveUserProfile`, auto-saved on DNA mount), and Storage for try-on inputs (`imageUploadService.ts:113-119`). Cross-device merge by email on Dashboard mount (`Dashboard.tsx:84`).
- Clerk: identity only; gates history save, favorites, naming modals, "Save my style".
- Server: biometric sessions are an in-memory `Map` (`biometricSessionStore.ts:26`); on Vercel they do not survive across function instances, so `finalize` can 404 on a cold split.
- Persists across sessions when signed in: history, favorites, profile/DNA, try-on URL. Lost every time: current step, answers, generated images not chosen, wardrobe photos (only in `personal` state, sent to profile save as data URLs), quick-flow photo session results (never used anyway).
- Cross-page coordination for background try-on is done with `window` CustomEvents plus a 2s localStorage poll in Dashboard (`Dashboard.tsx:190-227`); History/Profile refresh via a `profile-should-refresh` event.

---

## 7. The aha moment

Candidate moments, by strength of the actual payoff in code:

1. Try-on image of your own face in the outfit (`StepVirtualTryOn.tsx:451-457`). Genuinely personal, shareable, downloadable. Cost: Flow 2 through step 17, then an extra opt-in button, a forced name modal, and a 20-90s wait: roughly 18-25 interactions and 3 waits before it appears. Two confetti bursts fire around it, one before anything exists (`:69-71`).
2. Three AI-generated editorial images that match "date, restaurant, night, sharp" with a confidence pill and a written rationale (`StepResults.tsx:276-316`). This is the real first-session payoff. Cost: 9 taps, 6 screens, one 25-50s blocking wait. The library-only fallback removes the confidence pills and reasoning, and the user is not told why.
3. Style DNA card. In the current code it cannot be the aha: the archetype, season and radar shape are constants for every accepted photo, and it appears only after an outfit was chosen.

Judgment: the intended aha is (2) for Flow 1 and (1) for Flow 2. Flow 1 reaches it after ~9 interactions plus a wait that is longer than the product's own tagline ("Get dressed right, in under a minute", `Flow.tsx:913`) once you add the 30-45s generation. Flow 2 delays its only real magic behind 9 steps, two of which (wardrobe, inspiration preset) do not affect anything the user sees until the results cards' badges.

---

## 8. Confusing terminology and microcopy

Competing names for the same thing:
- The personal branch is "Build my personal style" (`StepModeSelect.tsx:51`), "Build my style profile" (`StepComplete.tsx:88`), "Build my DNA" (code comments, `Flow.tsx:806`), "My Style" (nav, `Flow.tsx:959`), "Your Style DNA" (`StepStyleDNA.tsx:210`), "Praxis Agent" (document title at step 16, `Flow.tsx:395`).
- Restart is "Start over" (header), "Style me again" (DNA), "Plan next look" (complete), "Style another moment" (purchase).
- Tier labels: "Safest choice / Sharper choice / More relaxed choice" (`outfitLibrary.ts:341-347`) in Flow 1 vs "Best for you / More expressive / More relaxed" in Flow 2 (`personalOutfitGenerator.ts:75`); and in Flow 1 the first card's label is overwritten with "Best for you" so the Safest tier is never named on the top card (`OutfitCard.tsx:382-390`).
- "Praxis confidence: 94%" next to "Event 80% · Vibe 80% · Color 80%" and, when expanded, a second "Score:" line with Weather; three numeric systems on one card.

Jargon exposed to users: "Archetype unlocked", "Kibbe" values (Natural/Classic) shown as the archetype name, "Vertical line Moderate", "Shoulder Blunt", "Undertone cool", "Your season: Deep Winter", radar axes "MINIMAL / STRUCT / BOLD / COMFORT" (`StyleDNARadarChart.tsx:12`), "Calibration", "Encrypted & local processing" badge on a step that uploads the photo to a server twice (`StepPhoto.tsx:522-524` vs `biometricApi.ts:85-86`), "Biometric".

Labels that do not say what they do: budget options "Considered / Elevated / Unrestricted" (`StepPreferences.tsx:24-26`); photo gate title "Got it."; "Start scan" for taking a selfie; "Take your friend's opinion" for share (`OutfitCard.tsx:485`); Dashboard "Meeting" tile sends WORK and "Other Occasion" sends PARTY (`Dashboard.tsx:247, 287`); "Swap item" on try-on just goes back (`StepVirtualTryOn.tsx:483-485`); "Wear this", "Save look" and "This is perfect" are the same action.

Too long / guilt-laden: the Calibration card (two paragraphs plus two badges before any button, `StepPhoto.tsx:517-532`); StyleNameModal description "…This will help you track your style evolution" (`StyleNameModal.tsx:44-46`); "Skip (lower accuracy)" (`StepQuickPhotoGate.tsx:35`) for a step whose photos are never used; "I'll add my closet later" vs "Skip for now" as two separate skips (`StepWardrobe.tsx:178-191`); StepSignInPrompt's three-sentence pitch (never mounted: `StepSignInPrompt.tsx` is not imported by `Flow.tsx`).

---

## 9. Responsive behaviour

- Layout: every step is a centered `max-w-md` (448px) column via `FlowStep.tsx:13-14`; results are `max-w-2xl`. On desktop the flow is a narrow strip with large empty margins; on mobile it fits. Cards go image-on-top at <768px and side-by-side at md (`OutfitCard.tsx:253-255`).
- Sticky bottom CTAs on mobile for Preferences and Purchase only (`StepPreferences.tsx:80`, `StepPurchase.tsx:96`); Results, DNA and Try-on have long scrolls with the primary CTA at the bottom.
- Camera: `StepPhoto` opens a fullscreen black modal with `getUserMedia({facingMode:'user'})`, mirrored preview, a dashed guide box, and falls back to an `<input capture="user">` when permission fails (`StepPhoto.tsx:83-91, 243-248, 536-544`). `StepQuickPhotoCapture` uses an inline 4:3 `<video>` and requests the rear camera for the body shot (`facingMode: 'environment'`, `:173`), which assumes someone else is holding the phone; there is no guidance saying so.
- Style preset cards: arrows are hover-only (`opacity-0 group-hover:opacity-100`, `StyleCardCarousel.tsx:100`) so invisible on touch; swipe is implemented (`:26-46`) but not signposted beyond dots.
- Nav: desktop ghost buttons vs `MobileNavMenu` sheet, switched by `useIsMobile` whose initial value is `undefined` (`use-mobile.tsx:6`) so signed-in users see the nav pop in after first paint.
- Dead responsive code: `StepLifestyle.tsx:33-37` has a mobile "auto-advance" timer with an empty body.
- Try-on "Download" builds a blob link; on iOS Safari this opens the image rather than saving. Share uses the Web Share API with a file when available (`StepVirtualTryOn.tsx:267-277`), which is mobile-only in practice.
- Comparison modal is `fixed inset-0` fullscreen (`OutfitComparison.tsx:30`), fine on both.

---

## 10. Top 10 UX problems (ranked by impact)

1. Browser Back leaves the app and refresh wipes the session; 20 steps share one URL with all state in `useState`. Evidence: `App.tsx:37` single route, `Flow.tsx:90` numeric step state, no `history.pushState`/storage of step.
2. First result sits behind a 25-50s blocking wait with fake progress; seven sequential model calls, three image generations in a `for` loop, and the built SSE endpoint is never consumed. Evidence: `api/generate-trend-outfits.ts:146-150`, `decisionEngine/index.ts:59-76`, `StepResults.tsx:88-94`, `api/generate-outfits-stream.ts` unused.
3. The quick-flow photo gate asks for two photos that have zero effect on results; the session ID is never passed to the engine. Evidence: `StepQuickPhotoCapture.tsx:123-124` calls `onDone()` with nothing; `Flow.tsx:139-145,152` sends only `{occasion, context, preferences}`.
4. Style DNA is a placeholder: every accepted photo yields "Deep Winter / cool / Natural" with fabricated confidence, so the personal flow's promise is not delivered and could not be trusted if noticed. Evidence: `facePipelineService.ts:38-49`, `bodyPipelineService.ts:33-51`, `StepStyleDNA.tsx:216-227` "Archetype unlocked".
5. Personalization never feeds back: the flow ignores the saved profile, so returning users re-answer everything and get the same output as anonymous users; Dashboard shortcuts still land on the occasion screen. Evidence: no `getUserProfile` call in `Flow.tsx`; `Flow.tsx:127-131` + `StepOccasion.tsx:32`.
6. Flow 2 is 9 steps (5 skippable) that end in library outfits and a 500ms fake loading screen; the DNA card comes after an outfit choice, inverting the promise. Evidence: `Flow.tsx:286-294`, `personalOutfitGenerator.ts:385-449`, `Flow.tsx:798-799`.
7. Dead-end commerce and no-op controls: "Buy this" links to `example.com` with invented prices, "Shop similar" is a static URL, fit feedback only toasts, "Match 98%" is a hardcoded fallback. Evidence: `StepPurchase.tsx:15-37`, `StepVirtualTryOn.tsx:26-48, 432, 534-541`, `OutfitCard.tsx:527`.
8. Developer error strings shown to end users on the most delicate step (try-on). Evidence: `StepVirtualTryOn.tsx:209-216`; raw `getUserMedia` error text at `StepQuickPhotoCapture.tsx:179`.
9. Interruptions around the payoff: mandatory name modal before try-on for signed-in users, optional name modal after Choose in Flow 1, a forced 1s "Perfect." interstitial, confetti on mount before any image exists. Evidence: `StepVirtualTryOn.tsx:74-88, 396`, `Flow.tsx:545-549`, `StepPhoto.tsx:167-197`, `StepVirtualTryOn.tsx:69-71`.
10. Results screen is overloaded and the primary CTA is below three full-height images on mobile: per-card thumbs, swap, more options, share, favorite, expand; page-level name/date inputs above the cards; five stacked full-width buttons. Evidence: `StepResults.tsx:256-359`, `OutfitCard.tsx:474-538`.

Secondary defects worth fixing in the same pass: "Save my style" toast never fires (`StepStyleDNA.tsx:383` passes the click event as `isAutoSave`); personal-flow history saves `lifestyle` (SOCIAL/CASUAL/MIXED) as an `OccasionType` (`Flow.tsx:751`); "Save all three" then "Choose" writes the chosen outfit twice; wardrobe file errors are silent (`StepWardrobe.tsx:51-54`); OpenAI key shipped to the browser (`openaiService.ts:3-9`); `StepSignInPrompt` and `StepFeedback` are unmounted dead components; step 6 (`StepComplete` with upsell) is unreachable in practice because step 5 always has a `selectedOutfit`.
