# Praxis UX/Product Audit

Date: 2026-09-27. Scope: repository at branch `v2` (HEAD `73a95c2`), the live product at trypraxis.ai, and the founder research corpus in `Praxis-Docs-Research/`. Method: full code read of the flow and system, an anonymous Playwright walkthrough of production at 1440/1280/768/390 (231 screenshots), and extraction of all 12 research PDFs. Detailed evidence lives in `research/01` to `research/04` next to this file. Every claim below was verified against code (file:line) or observed live.

---

## 0. Read this first

1. **The product's best screen apologises to every user.** On production, image generation fails on 100% of result pages and a "Trend looks unavailable" toast covers the first outfit on mobile. Results are 15 static photos of one white male model, keyed on occasion only. Two wedding runs with opposite location, time, vibe and budget return byte-identical outfits, text and images. Eight of the nine taps before results have no effect on the output.
2. **The promise and the product are inverted.** The research says "tell, don't ask", "minimum questions", "under one minute", "smart defaults on open". The product opens with a fork, asks 5 to 7 questions, upsells photos it never uses, then shows three options with seven secondary controls each and a disabled primary button below the fold.
3. **The personal branch does not deliver personalisation.** Face and body analysis return constants (every accepted photo is "Deep Winter, cool, Natural, 81%"). The Style DNA copy is generated once and never saved. The saved profile is never read by the flow, so a returning user gets the identical experience and identical output as an anonymous one.
4. **Three production-hygiene issues must be fixed before any redesign ships** (section 9): an OpenAI secret key is embedded in the JS bundle, Clerk runs a dev instance in production, and Supabase is queried with no user identity.

The redesign problem is therefore not visual polish. It is: collapse the question funnel, make the first result real and fast, make personalisation observable, and give the product one home.

---

## 1. Current product map

### 1.1 Information architecture

| Route | What it is | Reachable from | Verdict |
|---|---|---|---|
| `/` | The whole app: a 20-step wizard in one component with a numeric `step` in `useState` (`Flow.tsx:90`). Opens on a two-card fork. | Everything | The real home. Not a landing page. |
| `/landing` | Marketing page. Hero CTA "Try It Now" links to `/app`, which is a 404 (`Hero.tsx:21`). Early-access form is a `setTimeout` stub. Footer links are `#`. | Nothing links to it | Broken funnel, orphaned. |
| `/dashboard` | Five occasion tiles (labels do not match the flow's enum) plus a history teaser. Renders without auth. | Header nav | Duplicates flow step 1. |
| `/history` | Library of saved looks with search, filter, sort, bulk select, delete, favorite, lightbox, detail modal. | Header nav | The one secondary page that earns a place. |
| `/favorites` | History filtered by favorited catalog id. Card has a pointer cursor and no click handler. | Header nav | A filter chip, not a page. |
| `/profile` ("My Style") | Re-render of the Style DNA card with hardcoded identity phrase, "Lean into" and "Avoid" bullets (`Profile.tsx:222, 325, 346`). Two h1s. | Header nav | Identical for every user. |
| `/settings` | Third theme control, a retail-mode switch nothing reads, raw Clerk user id, JSON export, a delete button that only toasts. | Header nav | Two working controls. |
| `*` | Soft 404 (HTTP 200) with different background and no header. | Typos and the landing CTA | |

Protected pages bounce anonymous users to `/` silently. There are two divergent header implementations (`Header.tsx` and `Flow.tsx:902-999`). Nav items are buttons with no href, no active state and no `aria-current`. Anonymous users see no navigation at all.

### 1.2 The flow (what a user actually walks through)

**Fork (step 0):** "Style a moment" or "Build my personal style". The second card says "Sign in to personalize" but opens a photo calibration screen without sign-in.

**Flow 1, Style a moment:** occasion (5) → location (3 to 5) + day/night → vibe (3) + budget (3) → photo upsell "Got it. Skip (lower accuracy)" → optional face and body capture → 1 to 50 s wait → three cards → optional name and date → choose → "Complete Your Look" with confetti and three "Buy this" links to example.com at invented prices.

**Flow 2, Build my personal style:** photo (camera or upload with crop) → height and fit → lifestyle (required) → inspiration (upload or six presets) → wardrobe (up to four photos) → 500 ms fake loading → three library outfits → Style DNA card → optional face-swap try-on behind a mandatory naming modal and a 20 to 90 s wait.

Neither branch has a URL per step. Browser Back exits the site. Reload wipes everything.

### 1.3 Primary journeys, derived from the product and the research

| Journey | Screens | Taps | Decisions | Typed fields | Scroll to primary CTA | Waits |
|---|---|---|---|---|---|---|
| First-timer to first outfit (skip photos) | 6 | 9 | 7 | 0 | 2.1 viewports desktop, 4.0 mobile | 1 blocking, 0.6 to 8 s live (25 to 50 s when image generation works) |
| First-timer to Style DNA, everything skipped | 9 | 8 | 4 | 0 | 1.5 viewports | 0.5 s fake |
| First-timer to Style DNA, full path | 12+ | 15 to 20 | 9 | 1 plus 2 to 5 OS pickers | varies | 3 |
| First-timer to try-on image | 13+ | 18 to 25 | 10 | 2 | 1.5 viewports | 3, last is 20 to 90 s |
| Returning user to a new outfit | 7 | 10 | 7 | 0 | same as first-timer | same |

The returning-user row is the tell. The saved profile, wardrobe, height and DNA contribute nothing to the next recommendation (`Flow.tsx:152` sends only occasion, context, preferences). Dashboard tiles land on the occasion screen with the occasion visually preselected but still requiring a tap.

Intent → action → response chain for the main journey, as observed live:

- Intent "I have a wedding, what do I wear" → tap Get an outfit → occasion list → decide among 5.
- Tap Wedding → context screen, Next disabled with no hint → decide location and time.
- Tap Next → priorities, CTA disabled until both answered → decide vibe and budget.
- Tap Show my looks → an interstitial asks for two photos and labels skipping as "lower accuracy" → decide whether to trust "No setup".
- Tap Skip → spinner with three timer-driven fake steps → three cards, then an error toast, then an italic AI sentence that pushes the cards down 3.5 s later.
- Tap Swap, More options, Show alternatives, Share → "No alternative", "No other options", disabled, "Share failed". Every adjust path is a dead end.
- Tap a card → Choose this look → confetti and an Example Store.

---

## 2. UX audit

### 2.1 Cognitive load
- The first screen asks the user to understand the product's internal architecture ("a moment" vs "my personal style") before it has shown any value.
- Budget is asked as "Considered / Elevated / Unrestricted"; vibe as "Safe & clean / Sharp & confident / Relaxed & easy". Users must decode the product's vocabulary to answer.
- Three numeric systems on one result card: "Praxis confidence 94%", "Event 80% · Vibe 80% · Color 80%", and an expanded "Score:" line. None changes the decision.
- The results page carries a name field, a date field, three cards with seven controls each, four page-level buttons, and a disabled primary CTA. That is 30+ interactive elements to choose one outfit.
- The Style DNA card exposes Kibbe labels, "Vertical line Moderate", "Shoulder Blunt", "Undertone cool", "Deep Winter", and a radar with axes MINIMAL / STRUCT / BOLD / COMFORT. The research itself says to show consequences, not labels (`research/04`, section 7).

### 2.2 Navigation and discoverability
- No wayfinding: nav is invisible when anonymous, unlabelled dots inside the flow, no current-page state when signed in, and "Start over" is the only escape.
- The five secondary pages exist because the wizard has no home. They are reachable only from a header the anonymous user never sees.
- Restart has four names: Start over, Style me again, Plan next look, Style another moment.
- "Sign in to personalize", "Swap item", "Take your friend's opinion" and "Wear this / Save look / This is perfect" (three labels, one action) do not do what they say.

### 2.3 Hierarchy
- Too much attention: the header tagline on every screen, the progress bar, the name and date form above results, the photo upsell, the confetti (fires before any image exists on the try-on step), the shop step.
- Too little attention: the outfit image itself (a 3:4 thumbnail on desktop beside a table of text), the reason (2 lines, muted, 3.75:1 contrast), and the primary action (disabled, grey, at the bottom of a 2 to 4 viewport page).
- On the landing screen, nothing says clothes. No image, no example output, no proof.

### 2.4 Friction
- Question funnel of 7 decisions whose answers do not change the output.
- Photo gate framed as a penalty ("Skip (lower accuracy)") for a step whose photos are discarded (`StepQuickPhotoCapture.tsx:123` calls `onDone()` with nothing).
- Mandatory naming modal before try-on for signed-in users; optional naming modal after choose in Flow 1.
- A 1 s "Perfect." interstitial after photo capture.
- Required lifestyle question in Flow 2 (no skip) while five other steps are skippable.
- Two different skip buttons on the wardrobe step.
- Dead ends: swap, more options, alternatives, share, buy, fit feedback, delete account, retail mode, early access.

### 2.5 Onboarding and time to value
- Anonymous users can do everything and lose everything; persistence silently no-ops behind `if (user && ...)`. A visitor can spend five minutes and two model calls with nothing to return to and no warning.
- There is no first-run and no returning-user branch. The flow never calls `getUserProfile`.
- Sign-in is Apple/Google only and shows Clerk's red "Development mode" badge.

### 2.6 The aha moment
- Intended (research): "I said the occasion, and in seconds I saw three complete outfits I could actually wear, built first from what I own, each with one line that taught me something."
- Delivered, Flow 1: three static catalog photos after 9 taps, with a rationale that is generic per tier and an error toast. When image generation works (v2 code with quota), it is three editorial Gemini images after a 25 to 50 s blocking wait with fake progress.
- Delivered, Flow 2: a face-swapped image of the user in a catalog outfit, at step 18, after 18 to 25 interactions, three waits and a forced naming modal. This is the only genuinely personal artifact the product can produce and it is the hardest thing to reach.
- The Style DNA card cannot be the aha today: its archetype, season, radar and "81% confidence" are constants (`facePipelineService.ts:38-49`, `bodyPipelineService.ts:33-51`).

### 2.7 Information architecture: what to do with what exists

| Action | Items |
|---|---|
| Remove | The mode fork as a first screen; the photo upsell in Flow 1; name and date fields on results; "Compare outfits"; the confetti; "Complete Your Look" as a step; Favorites, Settings and Dashboard as routes; the header tagline; the second theme toggle; bulk select in History |
| Merge | Dashboard + Favorites + History into one "Looks" surface; Profile + Settings into one "You" surface; Flow 1 and Flow 2 into one path where personalisation is progressive, not a separate branch |
| Rename | "Style a moment" → the action itself ("What's the occasion?"); "Build my personal style / DNA / My Style / Identity" → one name; budget and vibe options → plain words; "Take your friend's opinion" → "Share" |
| Reorder | Result before configuration: show outfits from the occasion alone, then let the user refine (time, venue, budget) on the result page and watch it change |
| Hide | Confidence breakdowns, radar chart, Kibbe and season labels, score lines, thumbs (until after a choice), retail mode |
| Make contextual | Sign-in (at the moment of saving), photo capture (at the moment it would visibly change the result, e.g. try-on), wardrobe (one item at a time when it would replace a catalog piece) |
| Automate | Time of day (from the clock), setting (already inferred, never shown), occasion for returning users (from history), naming (auto-name by occasion and date) |

### 2.8 Content and microcopy
- Product name appears as Praxis, Practis (research), "Praxis Agent" (meta description and step 16 title). Persona "Bob" exists only in the spec.
- Copy register swings between editorial ("Let's style your next look."), utility ("Set the context"), and marketing ("Archetype unlocked").
- Developer strings reach users: "REPLICATE_API_TOKEN is set in Vercel", raw `getUserMedia` errors, OpenAI's quota message inside a 500 body.
- "Encrypted & local processing" badge sits on a step that uploads the photo to the server twice.
- The tagline "Get dressed right, in under a minute" is contradicted by the product's own generation time when images work.

### 2.9 Visual system
Existing dials (taste-skill reading): VARIANCE 2, MOTION 2, DENSITY 3. Generic score: landing 4/10, app 7 to 8/10.
- **Typography.** Inter body and Instrument Serif display, loaded via CSS `@import` (render-blocking, FOUT on cold cache). Serif is forced on every h1 to h3 including card and dialog titles, in weights the font does not ship (synthesised bold). The app runs at `text-sm` ×161 and `text-xs` ×88 with 30 px page titles and nothing between. The custom type scale exists and is used only on the marketing page. Both fonts are the two most common defaults in AI-generated interfaces.
- **Color.** Warm off-white, deep sage primary, low saturation. This is a real decision and worth keeping as a base. Problems: muted text at 3.75:1 fails AA and is used at 12 to 14 px everywhere; stock shadcn destructive red; an off-palette blue callout in Settings; `.dark img { filter: brightness(0.9) }` dims every fashion photo in dark mode.
- **Surfaces.** 21 hand-rolled `bg-card rounded-xl border` cards next to 10 `<Card>` components, sometimes on the same page. Card inside card on History, Settings, Profile, Dashboard. Two card weights (with and without shadow) coexist.
- **Radius.** Small buttons 8 px, default buttons 12 px, cards 16 px, pills full. No documented rule.
- **Motion.** A global 300 ms transition on every element's background, border and color (`index.css:190-196`) makes hover, focus and selection feel laggy and fights Radix enter/exit animations. No `prefers-reduced-motion` handling. Step transitions are a 180 ms fade. Loading is spinners and text lines; skeletons exist in `ui/` and are unused.
- **Imagery.** 15 catalog JPEGs of one model. The product is about clothes and the home screen has no image.
- **Iconography.** Lucide throughout; one emoji as an app icon in the iOS install prompt.
- **Component inventory.** 34 of 52 shadcn primitives unused (skeleton, drawer, tabs, badge, checkbox among them) while their jobs are hand-rolled. Two toast systems mounted, one dead.

### 2.10 Interaction design
- Waiting is unmanaged: the "Processing" checklist advances on a 1 s timer regardless of progress; results arrive as one 3 MB JSON payload after all three images finish; an SSE endpoint that could stream reasoning and outfits exists (`api/generate-outfits-stream.ts`) and no client opens it.
- Selection state on option chips is color-only.
- Feedback controls disable silently after a click; the first thumbs POST took 8 s live with no acknowledgement.
- Errors are toasts that linger 6 s over content, or silent degradation (library images appear, confidence pills vanish, no explanation).
- Destructive actions all go through the same centered `AlertDialog`; every dialog is a centered square on phones while the drawer primitive sits unused.

### 2.11 Mobile
- The flow's question steps fit one viewport and feel fine. Results are 4.0 viewports tall with the only primary CTA disabled at the bottom; each card is one screen. Purchase is 1.4 viewports.
- The header wraps at 390 px ("Start over" and the tagline both break to two lines).
- Touch targets: thumbs 28 px, Back 20 px tall, icon actions 32 px, nav buttons 36 px. Nothing except the large CTAs reaches 44 px.
- The fixed header ignores the top safe area in standalone PWA mode.
- Body-photo capture requests the rear camera, assuming a second person holds the phone, with no guidance.
- Style-preset carousel arrows are hover-only and invisible on touch.
- The desktop nav flashes before the hamburger on first paint (`useIsMobile` initialises undefined).

### 2.12 Accessibility
- Good: 0 missing alt attributes, visible focus rings, no horizontal overflow, inputs sized to avoid iOS zoom.
- Blocking: outfit cards are `<div>`s with no role or tabindex, so a keyboard user can never enable the primary CTA. Dashboard, History and Favorites cards are also non-focusable divs.
- Muted text fails AA at the sizes used. Name and date inputs are unlabelled. Option chips are not a radiogroup. Compare overlay and More-options sheet are not dialogs. Lightbox has no accessible title. Native `<details>` on Profile has its disclosure marker hidden.

### 2.13 Performance perception
- The shell is fast: TTFB under 90 ms, FCP around 250 ms, 295 KB brotli main bundle.
- What feels slow: the generate call is a cold-start lottery (0.64 s to 7.8 s live); three sequential browser-to-OpenAI calls after results add 3.5 s and a 28 px layout shift for one italic sentence; the error toast on every result; an 8 s first feedback POST; Clerk loads 2 MB of chunks on a page whose only Clerk UI is an unopened modal; serif font swap on cold cache.
- Structural: one 1 MB bundle with no route splitting; a 1 s `setInterval` for the whole app lifetime (add-to-home-screen hook); Dashboard polls localStorage every 2 s and History every 5 s; `setTimeout(500)` used as a database consistency mechanism; sync re-runs on every reload because its cooldown lives in memory.

---

## 3. The core problem

### The product is currently optimized around:
Collecting inputs. Two branches, a seven-decision funnel, a photo upsell, biometrics, wardrobe upload and a naming modal are all built as if the recommendation gets better with every answer. It does not: the engine keys on occasion, the photos are discarded, the profile is never read back.

### But users actually want to:
Say what is happening ("dinner Friday, want to look sharp not stiff") and see, in seconds, three outfits they could wear tonight, ideally from clothes they own, with one line each that explains the choice. The research is unambiguous: decision fatigue and low confidence are the pains; setup effort and gimmicky output are why styling apps get deleted.

### The biggest UX friction is:
Distance between intent and result. Nine taps, one fork, one upsell and one unmanaged wait sit between "I need an outfit" and seeing one, and the result then asks the user to configure (name, date, compare, swap, alternatives) instead of decide.

### The fastest path to value should be:
Occasion in, outfits out. One input (an occasion chip or a sentence), an immediate first result that streams in, then refinement on the result itself. Everything else (photos, wardrobe, profile, sign-in) should appear at the moment it would visibly change what is on screen.

### The Praxis "aha moment" is:
Seeing yourself dressed correctly for a specific moment before you have done any work. Concretely: three wearable outfits that answer the exact occasion, and for a returning or photographed user, the recognition that the system remembered them (their coloring, their pieces, their face in the outfit). Today the first half arrives late and the second half is fabricated.

### The new experience should make the user feel:
Calm and decided. Like a knowledgeable friend answered in one breath and is standing by if you want to argue. Not like filling out a form, not like being sold to, not like the app is apologising.

### Things the redesign should preserve:
- The warm-neutral and sage base palette, and the quiet tone of the marketing page.
- The three-outfit structure with tiers (safe / sharper / relaxed) and a hero pick.
- One-line "why" per outfit, expandable to more.
- The occasion vocabulary (Wedding, Work, Dinner, Date, Party) as the primary input.
- Save to History, favorite, share, the try-on capability, the Style DNA concept as a persistent profile.
- Clerk auth and Supabase persistence, dark mode, the PWA install path.

### Things the redesign should eliminate:
- The mode fork as the first screen.
- The mandatory context and priorities screens before any result.
- The photo upsell that penalises skipping.
- Name and date fields, compare, alternatives, thumbs, and "friend's opinion" as visible defaults on the results page.
- The "Complete Your Look" step with fake retailers, and confetti.
- Dashboard, Favorites and Settings as separate routes.
- The header tagline, the duplicate header, the unlabelled progress dots.
- Kibbe, season, radar, and percentage-confidence labels in user-facing copy.
- Global 300 ms transitions, dark-mode image dimming, synthesised serif weights.
- All dead controls: swap, more options, show alternatives, buy, fit feedback, retail mode, delete account, early access.

### Things that may need to be completely rethought:
- **The shape of the home.** Whether Praxis has a landing page at all, or whether the home is the occasion prompt with live output and the marketing story lives beneath or beside it.
- **Where personalisation lives.** Whether Style DNA is a separate journey or an invisible accumulation that surfaces as "because of you" notes on every result.
- **The input model.** Chips, a single sentence, a photo of the invitation, or all three in one field.
- **The result model.** Three static cards, or one hero outfit with two alternates, or an interactive canvas where changing a variable re-renders the look.
- **Sign-in.** When it is asked, and what the anonymous session is worth.
- **The wait.** Whether generation is streamed piece by piece, shown as a visible "thinking" state, or replaced by an instant library result that upgrades in place when the generated image arrives.
- **Commerce.** Whether "buy the missing piece" is a first-class outcome or a footnote, which depends on the business answer in section 5.

---

## 4. What the research adds to the product

Points the founder's own documents make that the product does not yet honour (`research/04`):

- "Tell, don't ask. No endless options." The product asks 7 questions and shows 30 controls.
- "Present 3 ready-to-wear options immediately upon opening, opt-out not opt-in." The product opens on a fork.
- "The greatest barrier to adoption is the Data Entry Wall." Flow 2 is a data entry wall.
- "Silent failure erodes trust." Style DNA is a confident constant.
- "Under 5 s p95 with streaming." Generation is 25 to 50 s, blocking, unstreamed.
- "Masculine, outcome-focused language: this projects competence." The product says "Archetype unlocked" and "Deep Winter".
- "Success is user confidence, not conversion." The flow's terminal reward is a fake store.
- "Wardrobe-first: prioritise items the user owns before recommending purchases." Wardrobe photos only add a "Your piece" badge.

Tensions the research leaves open, which the three questions below target: the Google-native and Pixel-first vision vs a web V1 in Lebanon; womenswear-heavy frameworks vs a men-only launch; "under a minute" vs photo-gated onboarding; confidence as the metric vs retailer conversion as the revenue.

---

## 5. Redesign constraints and starting position

- Stack stays: React 18, Vite, Tailwind 3, Radix and shadcn primitives, Clerk, Supabase, Vercel functions. The design lab will live under an isolated route prefix and reuse the engine and library only where safe.
- The base palette is worth keeping; typography, density, hierarchy, motion and layout are open.
- Redesign mode: overhaul of the app surfaces with content and capability preservation; the marketing page is a separate decision.
- taste-skill declares multi-step product UI out of its scope; it will govern the home, results presentation, motion and anti-slop discipline, while ui-ux-pro-max governs the design-system definitions and responsive and accessibility rules.
- Impeccable is not installed in this environment and was not used.

---

## 6. Production hygiene to fix before any redesign ships

These were observed in the shipped bundle and network traffic, not exploited. They are outside the redesign scope but block a credible launch.

1. **An OpenAI secret key (`sk-proj-…`) is embedded in the production JS bundle** and the browser calls api.openai.com directly with it (`openaiService.ts:3-9`, `dangerouslyAllowBrowser`). Rotate the key now and move the call server-side or delete it; it only produces one italic sentence.
2. **Clerk publishable key is a `pk_test_` dev instance** in production, hence the "Development mode" badge in the sign-in modal.
3. **Supabase is queried with the anon key and no Clerk token** (`supabase.ts:11-13`); row ownership is only a client-side `.eq('user_id')`. Verify RLS or pass the Clerk JWT.
4. `/api/generate-trend-outfits` returns a 500 on every request whose body includes the upstream billing message verbatim.
5. Biometric sessions are an in-memory `Map` on serverless (`biometricSessionStore.ts:26`) and will 404 across instances.
6. Any `VITE_*` variable (Gemini, Runway keys are present in the env) is public by construction.

---

## Appendix: evidence

- `research/01-core-flow.md` – step map, interaction costs, AI and latency map, state, terminology, top 10 flow problems.
- `research/02-system-ia.md` – routes, navigation, design tokens, component patterns, secondary pages, auth, data model, API surface, responsive and accessibility, performance.
- `research/03-live-product.md` – live walkthrough at four viewports, timings, accessibility measurements, screenshot index.
- `research/04-research-docs.md` – per-document takeaways, product thesis, ranked pain points, prescribed UX principles, glossary, tensions.
- `screenshots/` – eight reference captures of the live product.
