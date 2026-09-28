# 03 — Live product walkthrough: https://www.trypraxis.ai

Date: 2026-09-27. Method: Playwright 1.63 / Chromium 1243 (headless), anonymous visitor, no account created, no personal data entered, no forms submitted. Viewports 1440x900, 1280x800, 768x1024, 390x844 (mobile emulation with touch). Scripts + raw JSON live in `scratchpad/live/`, screenshots in `scratchpad/live/shots/`.

Everything below was observed, not inferred, unless marked *(caveat)*.

---

## 0. Executive summary

- `/` is **not a marketing page**; it is the app shell: one screen, no scroll, two cards ("Style a moment" → *Get an outfit*, "Build my personal style" → *Sign in to personalize*). The marketing page lives at `/landing` and is not linked from `/`.
- The quick flow is fully usable anonymously end-to-end: **11 clicks** from landing to "Complete Your Look", 12 to the external store link. **No Clerk gate is ever hit** in the quick flow. Sign-in is only reachable via the header button (Apple/Google only, shows a red "Development mode" badge).
- The "AI" results are a **lookup table keyed on occasion only**. Wedding/Hotel/Night/Safe/Considered returns byte-identical outfits, text and images to Wedding/Garden/Day/Sharp/Elevated. 15 static JPGs = 5 occasions x 3 tiers, all the same white male model. The flow never asks gender, size, or body.
- Half the result-page actions are dead ends: *Swap this one* → "No alternative for this tier right now", *More options* → "No other options for this tier right now", *Show alternatives* permanently disabled, *Share my looks* / *Take your friend's opinion* → "Share failed" / "Failed to share" *(caveat: headless has no `navigator.share`; the clipboard fallback also failed)*, *Buy this* → opens `https://example.com/buy-top` at "Example Store $89".
- Two production-hygiene problems surface directly in the UI: (1) an **OpenAI `sk-proj-…` key is hardcoded in the JS bundle** and the browser calls `api.openai.com` directly, and (2) `/api/generate-trend-outfits` fails on every request with a 500 whose body leaks "You exceeded your current quota", surfacing as a toast "Trend looks unavailable. Showing curated looks." on every single result page.
- Perf is fine on the shell (FCP ~230 ms, 295 KB brotli main bundle) but the generate call is a cold-start lottery: 0.64 s to 7.8 s across 7 runs.

---

## 1. Landing (`/`) at four viewports

| Viewport | Page height | Viewport-heights | Horizontal overflow | h1 size | Screenshot |
|---|---|---|---|---|---|
| 1440x900 | 900 | 1.0 (no scroll) | no | 30px | `shots/landing-1440.png` |
| 1280x800 | 800 | 1.0 | no | 30px | `shots/landing-1280.png` |
| 768x1024 | 1024 | 1.0 | no | 30px | `shots/landing-768.png` |
| 390x844 | 844 | 1.0 | no | 24px | `shots/landing-390.png` |

- **Title:** `Praxis — Smart Styling, Instantly`. Meta description: "Instant outfits for any moment. Or let Praxis Agent handle everything for you." (mentions an "Agent" that does not exist in the UI). `lang=en`, viewport has `viewport-fit=cover`.
- **Headings:** only one — `h1 "Let's style your next look."`. No h2/h3.
- **Hero copy:** "Let's style your next look." / "One-tap outfits, or a style built just for you."
- **Header/nav items:** `Praxis` (logo button, with tagline "Get dressed right, in under a minute." underneath), `Toggle theme` (icon; opens Light/Dark/System menu), `Sign In` (primary filled button). No footer, no links (`<a>` count = 0), no images.
- **Buttons/labels:** `Praxis`, `Toggle theme`, `Sign In`, card 1 `Style a moment / Occasion-based. No setup. / Get an outfit`, card 2 `Build my personal style / Smarter recommendations over time. / Sign in to personalize`. Both cards are one big `<button>` each (448x156 and 448x140 at desktop; 358 wide on mobile). The inner "Get an outfit" and "Sign in to personalize" pills are `<span>`s inside the card button, not separate controls.
- **Sections:** effectively 1 (header + one centered stack). This is an app home, not a landing page.
- **Fonts (computed):** body `Inter, system-ui, sans-serif` 16px; h1 `"Instrument Serif", Georgia, serif` 500. Loaded via CSS `@import` of Google Fonts (`display=swap`) — a render-blocking chain CSS → @import → fonts CSS → woff2, so Instrument Serif swaps in from Georgia (FOUT) on cold loads. 63 KB of fonts.
- **Colors (computed):** body bg `rgb(251,250,249)` (#FBFAF9 warm off-white); body text `rgb(24,29,37)` (#181D25); muted text `rgb(123,129,142)` (#7B818E); primary button bg `rgb(57,86,71)` (#395647 deep green) with text #FBFAF9; focus ring `rgb(69,115,88)`. Card 1 bg `rgba(57,86,71,0.05)`, card 2 `rgba(251,250,249,0.5)`.
- **Radii:** primary button 8px; header/logo buttons 12px; landing cards 12px; result cards 16px; badges pill.
- **Dark mode:** works via the header toggle (`shots/flow-misc2-390-s2.png`) — near-black bg, sage green CTA. Choice appears to persist (theme class on `<html>`).
- **Theme dropdown** stays open and intercepts the next click anywhere (observed: subsequent clicks on the card failed until Escape). Minor.

## 2. Other routes (anonymous)

| Route | HTTP | What you see | 1440 shot | 390 shot |
|---|---|---|---|---|
| `/landing` | 200 | Full marketing page, 3675px (4.1 vp) desktop, 4345px (5.1 vp) mobile. h1 "From indecision to confidence, in minutes." Sections: hero (Try It Now / Request Early Access), "Choosing shouldn't be this hard", "How it works" (3 steps), "Why it's different", "Who it's for" (+ "COMING SOON For retailers"), "Get early access" (email form), footer (Privacy, Contact, © 2026). | `route-landing-1440.png` | `route-landing-390.png` |
| `/dashboard` | 200 | **Renders without auth.** h1 "Dashboard / Quick access to style recommendations", 4 tiles Meeting/Wedding/Dinner/Date + "Other Occasion". Not linked from anywhere; different occasion set than the flow (Meeting vs Work, no Party). | `route-dashboard-1440.png` | `route-dashboard-390.png` |
| `/history` | 200 | Silent client-side redirect to `/` (URL rewritten). No message. | `route-history-1440.png` | `route-history-390.png` |
| `/favorites` | 200 | Same silent redirect to `/`. | `route-favorites-1440.png` | `route-favorites-390.png` |
| `/profile` | 200 | Same silent redirect to `/`. | `route-profile-1440.png` | `route-profile-390.png` |
| `/settings` | 200 | Same silent redirect to `/`. | `route-settings-1440.png` | `route-settings-390.png` |
| `/nonexistent-route` | **200** (soft 404) | "404 / Oops! Page not found / Return to Home". Title changes to "Praxis — Get Dressed Right". Page bg is a flat grey (#E6E6E3-ish) unlike the rest of the app; no header. | `route-nonexistent-route-1440.png` | `route-nonexistent-route-390.png` |
| `/sign-in`, `/onboarding`, `/style`, `/wardrobe`, **`/app`** | 200 | Same 404 page. | `route-sign-in-1440.png`, `route-app-1440.png` | `…-390.png` |

Marketing-page CTAs: **"Try It Now" links to `/app`, which is a 404.** "Request Early Access" scrolls to the email form (scrollY 2775) but does not focus the input. Footer "Privacy" and "Contact" are `href="#"`. Early-access form is JS-handled (button flips to "Joining…"); not submitted.

## 3. Primary CTA flow (anonymous), step by step

Route never changes (`/` throughout; wizard state is in memory only). Each step animates in ~180–200 ms. "Fits" = `documentElement.scrollHeight <= viewport`.

| # | Screen (h1) | Asks | Controls | Fits 1440 / 390 | Time | Shots (1440 / 390) |
|---|---|---|---|---|---|---|
| 0 | Let's style your next look. | pick mode | Get an outfit, Sign in to personalize | yes / yes | — | `flow-full-1440-s0.png` / `flow-full-390-s0.png` |
| 1 | What's the occasion? | 1 of 5 | Wedding, Work, Dinner, Date, Party (full-width 72px rows); Back, Start over; 6-segment progress bar | yes / yes | 195 ms | `flow-full-1440-s1.png` / `flow-full-390-s1.png` |
| 2 | Set the context | Location (5 chips) + Time of day (2 chips); both required, Next disabled until both | Hotel, Outdoor venue, Beach resort, Garden, Private estate; Day, Night; Back, Next | yes / yes | 173 ms | `flow-full-1440-s2.png` / `flow-full-390-s2.png` |
| 3 | Your priorities | Vibe (3) + Investment (3); both required | Safe & clean, Sharp & confident, Relaxed & easy; Considered, Elevated, Unrestricted; Back, Show my looks | yes / yes (844/844 exactly) | 179 ms | `flow-full-1440-s5.png` / `flow-full-390-s5.png` |
| 4 | Got it. | "2 quick photos will make this accurate for your body lines and coloring." | Add photos for precision / Skip (lower accuracy) | yes / yes | 179 ms | `flow-full-1440-s8.png` / `flow-full-390-s8.png` |
| 4b | Face photo (color accuracy) *(explored, not completed)* | upload or camera; "We extract measurements and delete raw photos unless you choose to save them." | Upload photo, Take photo, Back | yes / — | 177 ms | `flow-photo-1440-s9.png` |
| 5 | Styling your moment… | loading | spinner + 3-step "PROCESSING" checklist, "This usually takes a few seconds." | yes / yes | appears 180 ms after Skip | `loading-1440-300ms.png`, `loading-390-300ms.png` |
| 6 | Choose your outfit | tap a card; optional "Name this look" + date | 3 cards (image + Top/Bottom/Shoes + badge + reason + Take your friend's opinion + thumbs + Swap this one + More options); Share my looks, Compare outfits, Show alternatives (disabled), Select an outfit (disabled) | **no** 1934/900 (2.1 vp) / **no** 3402/844 (4.0 vp) | results 0.64–7.8 s; toast + motivational line later (see §5) | `flow-skip-1440-s9.png` / `flow-skip-390-s9.png` |
| 7 | (card selected) | CTA relabels to "Choose this look" | — | — | 186 ms | `flow-brA-1440-s10.png` |
| 8 | Complete Your Look | "You can shop pieces individually." | 3 x "Buy this" ($89/$129/$159, "Example Store"), Style another moment, Back to outfit selection | **no** 1379/900 / **no** 1188/844 | 184 ms | `flow-brD-1440-s11.png` / `flow-brD-390-s11.png` |
| 9 | Buy this | — | opens new tab `https://example.com/buy-top` | — | — | `flow-buy-1440.png` |

**Sign-in gate:** none reached in this flow. The only Clerk UI is the header "Sign In" → modal "Sign in to Praxis / Welcome back! Please sign in to continue", buttons **Apple, Google** only (Clerk env: email off, password off, phone off), "Don't have an account? Sign up", footer "Secured by Clerk — **Development mode**" (orange). Shot: `flow-signin-1440-s1.png`. The second landing card "Build my personal style / Sign in to personalize" does **not** open sign-in; it goes straight to an "Optional: refine the fit / CALIBRATION" photo screen (Start scan, Upload photo, Skip this step) — `flow-misc2-390-s4.png`.

**Click count:** landing → results = 9 clicks (Get an outfit, Wedding, Garden, Day, Next, Sharp & confident, Elevated, Show my looks, Skip). → Complete Your Look = 11. → external store = 12. Minimum possible with the photo step skipped is the same 9/11 (context and priorities each require two choices).

## 4. Intent → action → response → decision (per step reached)

1. **Intent:** "I need something to wear." **Action:** click *Get an outfit*. **Response:** occasion list, 195 ms. **Decision:** which of 5 occasions (no free-text, no "other" — although `/dashboard` has one).
2. **Intent:** tell it it's a wedding. **Action:** click *Wedding*. **Response:** context screen. **Decision:** location + day/night, both mandatory; Next stays disabled with no hint about why.
3. **Intent:** be done with setup. **Action:** Garden, Day, *Next*. **Response:** priorities. **Decision:** vibe + budget, both mandatory; "Show my looks" disabled until both.
4. **Intent:** see looks. **Action:** *Show my looks*. **Response:** an interstitial asking for 2 photos ("Got it. I can recommend now, but…"). **Decision:** upload or "Skip (lower accuracy)". The skip is labelled as a penalty; the flow promised "No setup".
5. **Intent:** skip. **Action:** *Skip*. **Response:** loading screen ("Styling your moment…", 3 fake progress rows), then 3 cards; 2–4 s later a toast "Trend looks unavailable. Showing curated looks." and ~3.5 s later an italic AI line appears under the subtitle, pushing cards down. **Decision:** which card. Not obvious that the whole card is the tap target; the big "Select an outfit" CTA is disabled and 2–4 screens below.
6. **Intent:** react/adjust. **Action:** *Swap this one* / *More options* / *Show alternatives* / thumbs. **Response:** "No alternative for this tier right now" / sheet "No other options for this tier right now" / disabled / thumbs both disable silently (POST `/api/log-feedback`, once 8.0 s). **Decision:** none — every adjustment path is a dead end.
7. **Intent:** share. **Action:** *Share my looks* / *Take your friend's opinion*. **Response:** toast "Share failed" / "Failed to share" *(caveat above)*. **Decision:** none.
8. **Intent:** commit. **Action:** tap card → *Choose this look*. **Response:** "Complete Your Look" with confetti code path, 3 placeholder products from "Example Store". **Decision:** Buy (→ example.com), *Style another moment* (→ landing, all state cleared), or back.
9. **Browser back** at any step leaves the site (no history entries pushed). **Reload** at any step returns to the landing with progress lost.

## 5. Perceived performance

Landing (`/`), 1440x900, warm Vercel edge (`x-vercel-cache: HIT`, `server: Vercel`, brotli):

- TTFB 50–88 ms; `first-paint` 208–256 ms; **FCP 224–264 ms**; DOMContentLoaded ~210 ms; `load` ~210 ms; `page.goto(load)` 570–640 ms wall; network idle ~2.2 s (Clerk chunks).
- **21 requests** (22 on mobile). Decoded bytes 3.39 MB: script 3.13 MB (main `index-DoTlNjgx.js` 1.04 MB decoded / **295 KB brotli**; `@clerk/clerk-js@5` 330 KB + 4 lazy chunks), CSS 175 KB decoded / 14 KB br, fonts 63 KB, HTML 5 KB.
- Largest JS bundle: `/assets/index-DoTlNjgx.js` — one monolithic chunk; includes the full `openai` SDK, Supabase client, Clerk bootstrap, confetti, and an image catalogue.
- `cache-control: public, max-age=0, must-revalidate` on hashed assets (they could be immutable).
- Fonts: Google Fonts via CSS `@import` with `display=swap` → FOUT on the serif h1 on cold cache. 25 `@font-face` entries declared, 4 actually used.
- **AI/API timings (7 runs):** `POST /api/generate-outfits` 644, 663, 690, 3385, 7768 ms (+2 runs where results landed at ~2.3 s and ~9 s). Response byte-identical per occasion (3217 B for Wedding). `POST /api/generate-trend-outfits` **500 every time** in 350–420 ms. Three sequential browser→`api.openai.com` `gpt-4o-mini` calls (~1.2 s each) after results. `POST /api/log-feedback` 8000 ms (cold) then 275 ms.
- Loading UI: "Styling your moment…" with spinner + 3 fake progress rows; visible 0.9–8.4 s depending on cold start. The rows animate on a timer, not on real progress. No skeleton for cards; the page jumps from spinner to full content. Toast persists ~6 s. Motivational line inserts ~3.5 s after results (CLS ~28 px).

## 6. Accessibility quick check

- Images without alt: **0** (landing has no images; result images alt = outfit name, `loading=lazy`, 1024x1024 JPEG ~44 KB each).
- Buttons without accessible name: **0** on landing/results; **1** in the Compare overlay (icon-only close, 40x36) — `flow-brB-1440-s13.png`. "More options" sheet close is 16x16 (`flow-brC-1440-s15.png`).
- Focus ring: **visible** on Tab (2px offset ring `rgb(69,115,88)` via box-shadow; 5.2:1 vs bg) — `shots/landing-1440-focus.png`.
- Smallest tap targets (mobile): thumbs up/down **28x28**; "Back" 55x20; "Start over" 51x40; header "Praxis" 44x28; toggle theme 29x36 (mobile) / 36x36; footer Privacy/Contact 49x22 on `/landing`. All below the 44x44 guideline.
- Horizontal overflow at 390px: **none** on `/`, `/landing`, results, or complete-look.
- Contrast (computed): body text #181D25 on #FBFAF9 = **16.2:1**; muted #7B818E on #FBFAF9 = **3.75:1** (fails AA 4.5:1 for normal text; used at 14px and 12px — e.g. header tagline at 12px on mobile, "Tap the one that feels right", card reasons); muted on card #F2F2F1 ≈ 3.5:1; primary button text 7.8:1.
- Outfit cards are `<div>`s with no `role`, no `tabindex`; a keyboard user cannot select a card, so "Select an outfit" can never be enabled by keyboard.
- "Name this look" and date inputs have no associated `<label>` / `aria-label`.
- Compare overlay and More-options sheet are not `role=dialog`; Escape does close them.
- Occasion/context chips are plain buttons, not `radiogroup`/`aria-pressed` (selection state is colour-only).
- Wizard state is not in the URL: no deep links, back button exits, reload loses everything.

## 7. Mobile experience (390x844)

- Landing collapses sensibly to a single column; both cards fit in one screen with ~200 px of empty space below. No bottom nav; no hamburger; header stays fixed.
- Header is cramped once inside the flow: "Start over" wraps to two lines, the 12px tagline wraps to two lines (`flow-full-390-s2.png`).
- Context/priorities steps fit in exactly one screen (priorities = 844/844; the sticky bottom "Back / Show my looks" bar sits right at the fold).
- Results page is **4.0 viewports** tall: each card's 1:1 image is 358 px square, so one card ≈ one screen; the toast lands on top of the first image (`flow-skip-390-s9.png`); the primary CTA is at the very bottom and disabled.
- Complete Your Look is 1.4 viewports; product rows are 308-px wide "Buy this" buttons.
- Nothing overflowed horizontally on any page.

## 8. Design observations (for the redesign brief)

- Visual language: warm off-white, deep green primary, Inter + Instrument Serif display, 8–16 px radii, hairline borders, generous whitespace. It is tasteful but generic-"calm SaaS"; nothing on the home screen says *clothes*.
- The home screen has no imagery, no example output, no proof; "Sign in to personalize" is a lie (it opens a photo calibration step).
- Result imagery is 15 static, identical-model, male-only photos. A first-time female user gets suits.
- Copy inconsistency: title says "Smart Styling, Instantly", meta says "Praxis Agent", marketing says "Get 3 clear choices" and "Add your preferences … We listen" while preferences have zero effect.
- Two occasion vocabularies (`/dashboard`: Meeting/Wedding/Dinner/Date/Other; flow: Wedding/Work/Dinner/Date/Party).

## 9. Screenshot index (`scratchpad/live/shots/`)

- `landing-1440.png`, `landing-1280.png`, `landing-768.png`, `landing-390.png` — `/` full page at each viewport (all single-screen).
- `landing-*-fold.png` — same, above-the-fold only. `landing-*-focus.png` — after two Tabs, showing focus ring on the theme toggle.
- `route-landing-1440.png` / `-390.png` — `/landing` marketing page full length.
- `landing-page-390-fold.png` — `/landing` hero on mobile (h1 48px).
- `landing-page-early-access-1440.png` — after "Request Early Access" (scrolled to form, input not focused).
- `route-dashboard-1440.png` / `-390.png` — unauthenticated `/dashboard`.
- `route-history-*`, `route-favorites-*`, `route-profile-*`, `route-settings-*` — all show `/` after silent redirect.
- `route-nonexistent-route-*`, `route-sign-in-*`, `route-onboarding-*`, `route-style-*`, `route-wardrobe-*`, `route-app-*` — the soft-404 page.
- `flow-signin-1440-s1.png` — Clerk modal (Apple/Google, "Development mode").
- `flow-full-1440-s0..s9.png`, `flow-full-390-s0..s9.png` — landing → occasion → context (selected states) → priorities → "Got it." photo prompt.
- `flow-photo-1440-s9.png` — "Face photo (color accuracy)" upload/camera screen.
- `loading-1440-{300,1000,2500,5000,8000}ms.png`, `loading-390-*.png` — generation loading state over time, then results + toast + motivational line.
- `flow-skip-1440-s9.png`, `flow-skip-390-s9.png` — results page ("Choose your outfit") with the "Trend looks unavailable" toast.
- `flow-brA-1440-s10.png` — card selected, CTA relabelled "Choose this look".
- `flow-brB-1440-s10.png` — "Share failed" toast; `flow-brB-1440-s13.png` — Compare Outfits overlay.
- `flow-brC-1440-s10.png` — "Failed to share" toast; `-s13.png` thumbs disabled after "Good pick"; `-s15.png` — "More options" sheet: "No other options for this tier right now."
- `flow-swap-1440-s10.png` — "No alternative for this tier right now" toast after Swap.
- `flow-brD-1440-s11.png`, `flow-brD-390-s11.png` — "Complete Your Look" with Example Store placeholders.
- `flow-buy-1440.png` — after "Buy this" (new tab to example.com opened).
- `flow-brE-1440-s14.png` — "Style another moment" returns to landing.
- `flow-misc2-390-s2.png` — dark mode landing; `flow-misc2-390-s4.png` — "Build my personal style" → calibration screen (no sign-in).
- `variant-wedding-hotel-night-safe-considered-1440.png`, `variant-dinner-default-1440.png`, `variant-work-default-1440.png` — results for other inputs (identical wedding output; Dinner/Work catalogues).

## 10. TOP 10 observed UX problems (ranked)

1. **Preferences and context have no effect on the output.** Two wedding runs with opposite location/time/vibe/budget produced identical titles, items, reasons and images. Eight taps of "personalisation" are theatre; users will notice on the second run.
2. **Every "adjust" affordance on the results page is a dead end** (Swap → none, More options → none, Show alternatives disabled, thumbs silent). The page advertises control it does not have.
3. **No gender/body/size question, single male model in all 15 images.** Half the audience gets the wrong wardrobe with no way to say so.
4. **An error toast on 100% of result pages** ("Trend looks unavailable. Showing curated looks.") because `/api/generate-trend-outfits` always 500s (quota). Users see the product apologising on its best screen; on mobile the toast covers the first outfit.
5. **Marketing CTA is broken:** `/landing` "Try It Now" → `/app` → 404; Privacy/Contact are `#`. The one page a new visitor is likely to land on from ads cannot get them into the product.
6. **Results page is 2–4 screens long with the only primary CTA disabled at the bottom;** the tap target (whole card) is not signposted and is not keyboard-operable. "Tap the one that feels right" competes with 7 secondary controls per card.
7. **Shop step is placeholder** ("Example Store", $89/$129/$159, example.com). The flow's terminal reward is visibly fake.
8. **Sign-in is Apple/Google-only, shows Clerk "Development mode" in red, and "Sign in to personalize" doesn't open sign-in** (it opens a photo calibration step). Trust and expectation are both broken at the one conversion moment.
9. **"No setup" promise vs. a mandatory-looking photo interstitial** ("Skip (lower accuracy)") after 8 taps; plus wizard state is not in the URL — back exits the site, reload wipes progress, no deep links or shareable results.
10. **Silent redirects and soft 404s:** `/history`, `/favorites`, `/profile`, `/settings` bounce to `/` with no message; `/dashboard` is reachable without auth and disconnected from the flow; unknown routes return HTTP 200 with a differently-styled 404.

Honourable mentions: muted text at 3.75:1 (fails AA) used at 12–14px; 28x28 thumbs and 20px-tall "Back"/"Start over" targets; header wraps on mobile; unlabelled name/date inputs; theme menu intercepts the next click; motivational line inserts late and shifts layout; `meta description` promises a "Praxis Agent" that doesn't exist.

## 11. What felt slow

- **Generation cold start:** `/api/generate-outfits` 0.64 s warm but 3.4 s and 7.8 s on cold runs; the loading screen's three "processing" rows are timer-driven, so they finish out of step with the real request.
- **Three sequential browser→OpenAI calls after results** (~3.5 s total) just to insert one italic sentence, which then shifts the cards down.
- **Toast lingering ~6 s** over content on every result page.
- **`/api/log-feedback` 8.0 s** on first thumbs click (cold), with no UI acknowledgement either way.
- **Network idle at ~2.2 s** on the landing because Clerk loads 5 chunks (~2 MB decoded) on a page where the only Clerk UI is a modal nobody has opened yet.
- Serif h1 font swap on cold cache (Google Fonts via `@import`).
- Everything else (step transitions ~180–200 ms, TTFB <90 ms, FCP <300 ms) felt instant.

## 12. Non-UX findings that must be escalated (observed, not exploited)

- **OpenAI API key shipped to the browser.** The main bundle contains `const E6="sk-proj-…"` (164 chars) and the page sends `Authorization: Bearer sk-proj…` directly to `https://api.openai.com/v1/chat/completions` (model `gpt-4o-mini`) — 3 calls per result page. Anyone can lift and bill against it. Rotate immediately and move the call server-side.
- **Clerk publishable key is `pk_test_…`** (dev instance `premium-jaybird-48.clerk.accounts.dev`) in production; hence the "Development mode" badge and `dev_browser` JWT flow.
- **Server error leaks upstream billing state:** `/api/generate-trend-outfits` 500 body includes OpenAI's "You exceeded your current quota, please check your plan and billing details" verbatim.
- Supabase project URL is in the bundle (expected for anon-key usage; noted for completeness). Additional API routes referenced in the bundle: `/api/replicate-generate`, `/api/broadcast`, `/api/log-feedback`.

## 13. What could not be observed

- Whether `navigator.share` works on a real desktop/mobile browser (headless Chromium has none; the clipboard fallback also failed, so the toast is at least reachable).
- Anything behind Apple/Google OAuth (no account created).
- The camera/upload photo path and whatever `/api/replicate-generate` produces (no photo uploaded).
- Real-device font flash and scroll feel (emulated only).
- Whether the early-access form actually persists (not submitted).
