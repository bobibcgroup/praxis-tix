# Concept A: Stage. Build notes

## What it is
A single full-viewport stage: one question on the left (bottom on mobile), a living 3:4 print on the right (top band on mobile). Every step is a route, answers ride in the URL, captured images live in session storage, saved looks and the DNA use the shared lab store. Surfaces: home, the six-step moment (occasion, venue, day or night, feel, spend, you), guided build on the print, results, try-on with the wipe, Buy sheet, Looks rail, the DNA journey and result, You.

## Brand and element system (rebuild, pass 2)
- Theme: "Forest and Bone" with the "Hairline" system from `src/design-lab/system/`, light and dark on `[data-mode]`. Light is the default; dark only from `localStorage["praxis_lab_a_mode"]` or `?mode=dark`. Controls: a Light / Dark radiogroup on the You surface and one 44 px lab button bottom right. Muted is `#5A5E56` light and `#9A9B95` dark.
- Type: "Source Serif 4" 600 with optical sizing for the question line, the home headline and the look title only (`.a-display`, 40 px desktop, 30 px mobile, line boxes on the 8 px grid); Geist 400/500 for everything else; Geist Mono for prices, the "n of 6" line and the stage names. Body 16 px on mobile, 15 px on desktop. `brands.ts` Forest entry updated to the same display face so the specimen page matches.
- Controls (`.a-control`): 44 px, inline-flex, `padding 0 16px`, `line-height 1`, 15 px medium, `.hint` 13 px muted 8 px after on one baseline, 2 px corners, 1 px rule border, ink-fill selected, surface hover, scale 0.98 pressed, 2 px accent ring with a 2 px gap on focus. Primary accent fill (min 120, `0 20px`), secondary text-colour border, tertiary text only. Answer rows are these controls at full column width, 8 px apart (`.a-answers`).
- Detail rows `.a-row` (`1fr auto` on the baseline, 8 px padding, vendor 13 px muted 2 px under) and `.a-total` (rule, 12 px above), prices in Geist Mono tabular on one right edge. Print, sheets and drawers at 0 radius. 8 px grid, 48 px desktop gutter, 20 px mobile.

## Orientation, thumbnails, continuity
- Home always says what this is (no one-time flag): "Know what to wear. Every time.", one 16 px line, "Dress me for a moment", "Or build my Style DNA first". With a saved DNA the headline is "Where are you going?" with the occasion chips under it and the same line beneath the headline. The print shows the five-occasion strip with the caption "Your three looks appear here". Every question keeps the spine and a 13 px "n of 6" under the question.
- Results and try-on: three 64 x 85 thumbnails in a stable order (safe, sharper, relaxed) centred under the print at 12 px gaps, inactive 0.7, active with a 2 px accent underline 6 px below; tapping crossfades the print (400 ms) and moves the underline. The old two-alternate filmstrip is gone.
- Completion (`?done=saved|reserved|dna`) after Save (results or try-on), after Reserve in the Buy sheet, and after Save my DNA: the muted line, "Done. Where next?", then stacked "Style another moment" (resets the journey, keeps the face and the DNA), "Open my looks", "Build my Style DNA" or "Update my Style DNA". The print keeps the look and its thumbnails; after a DNA save it shows the portrait. Any navigation clears `done`. From the first answered question the top bar shows "New moment" left of the monogram (desktop; the overlay menu carries it on mobile). Results keep "Back", try-on keeps "Back to looks".

## Account, Plus and the gate (pass 3)
- Account preview in `lib/user.ts`: `localStorage["praxis_lab_a_user"]` as `{ name, email, plus }`. No Stripe, Clerk or network; everything is a visual and interaction preview.
- Home: two paths of unequal weight in the pinned row: the primary "Dress me for a moment", then under a rule the Style DNA block (13 px label, 20 px display line "Know your colours and fit once. Two taps every time after.", 15 px line, secondary "Build my Style DNA" with the "Plus" marker). With a saved DNA the block is one line, "Your Style DNA is on file", with a tertiary "Update". The home band is 36% on mobile so the block sits above the fold at 390x844.
- Premium markers: `PlusMark` renders a 13 px muted "Plus" as the control's hint (8 px after the label, same baseline) on "See it on you", "Build my Style DNA", "Update my Style DNA" and "Redo" on the You surface; it disappears once `plus` is true. Results carry "Plus shows every look on you and saves your DNA." under the action row on desktop while the user has no Plus.
- Account presence: signed out, a tertiary "Sign in" left of the monogram on desktop and inside the overlay menu on mobile; signed in, a 32 px initial circle on desktop and the name with "Sign out" in the overlay and on the You surface.
- The gate (`ui/Gate.tsx`, `ui/GateSteps.tsx`): opened in place with `?gate=tryon|dna|save|buy|signin` (replace, no navigation), scrim, Escape closes, focus trapped and returned. Centred 440 px sheet on desktop, bottom sheet with a handle and safe-area inset on mobile. Steps are computed when it opens and frozen ("1 of 2, Sign in", "2 of 2, Praxis Plus"); satisfied steps are skipped. tryon and dna need sign-in then Plus; save and buy need sign-in only. Sign in: Apple (ink fill), Google, or email, each with a 900 ms "Signing you in" state, all signing in as Bob. Plus: three benefits, "$9 a month", Apple Pay (1.2 s "Confirming with Apple Pay") or the card form (grouped card number, expiry, CVC, "Pay $9" with a 1.2 s "Processing", non-empty validation), then "You are in." for 900 ms, then the sheet closes and the gated action runs. Screens hand the gate their local Save and Buy handlers through `useGateAction`; try-on and DNA fall back to navigation.
- Completion: "Build my Style DNA" is the secondary control directly under "Style another moment" with "Two taps next time" above it; with a DNA it stays "Update my Style DNA" as tertiary. The lab mode button hides while a gate is open.

## Layout guarantees
- The column is a flex column: `.a-body` scrolls only if it must, `.a-actions` is pinned at the bottom under one rule (24 px above on desktop; 16 px inset inside the safe area on mobile, with 80 px kept clear of the lab button). Questions with no primary have no row.
- The print sizes from the room the canvas leaves it (container query, minus the reserve for what sits under it) and never outgrows the column. The stage is capped at 1600 px and centred.
- Mobile band: 40% of the viewport while answering, 50% on build, results, try-on and saved-look detail (`data-band`).
- Measured with the You step fully filled and on results: primary inside the viewport and no page overflow at 1440x900, 1920x1080, 2000x1120, 1280x720, 390x844 and 375x667.

## Routes (under /__design/a)
`/`, `/moment/occasion|venue|time|feel|spend|you|you/face|you/item|build|results|tryon`, `/looks`, `/looks/:id`, `/dna`, `/dna/face|fit|lifestyle|inspiration|build|result`. Params: `occasion, venue, time, vibe, spend, face, item, hero, done, mode`; DNA: `face, fit, life, taste`.

## Deviations and gaps
- At 375x667 the signed-out home body scrolls by about 40 px (headline and line); the primary and the DNA block are pinned and visible. At 390x844 nothing scrolls.
- The Plus sheet's card fields scroll inside the sheet at 375x667; Apple Pay stays visible, as specified.
- "New moment" is desktop-only in the top bar (`.a-desktop`); on mobile the spine fills the bar and the overlay menu carries it.
- "Buy" as a text action on results is desktop-only; on mobile the pieces line opens the same sheet.
- Tailwind's `hidden` cannot hide an `.a-control` (the scoped display rule wins), so desktop-only controls use the scoped `.a-desktop` class.
- The try-on rendering is the shared stand-in with a different crop; the DNA result always uses `SAMPLE_TONES`; the Dinner mood image equals the Dinner sharper look.
- One eslint warning remains (react-refresh, `useJourney` beside its context). No errors.

## Screenshots
Pass 3: `/private/tmp/claude-501/-Users-clawdbob-ClaudeProjects-praxis/b10c2996-0a9b-4c53-b840-da7463e7f7e4/scratchpad/lab-shots/a3/`
`light-{home-signed-out, home-with-dna, results-signed-out, gate-signin, gate-plus, gate-success, after-plus-results, completion, topbar-signed-in}-{1440,390}.png`, plus `light-home-375.png`, `light-gate-plus-375.png`, `light-home-2000.png`.
Pass 2:
`/private/tmp/claude-501/-Users-clawdbob-ClaudeProjects-praxis/b10c2996-0a9b-4c53-b840-da7463e7f7e4/scratchpad/lab-shots/a2/`
`<mode>-<state>-<width>.png` for light and dark at 1440 and 390; states: home, home-returning, occasion, feel, you-open, build, results, results-swapped, tryon, after-save, dna-result, looks. Plus light home, you-open and results at 1920, 2000, 1280 (x720) and 375 (x667). Earlier passes remain in `lab-shots/a/`.
