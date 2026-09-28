# Concept C: Mirror. Build notes

## What was built
One portrait frame on a charcoal stage; every question and every look happens on it. Fourteen files under 250 lines each:
`ConceptC` (root, fonts, routes), `Mirror` (entry, questions, build, result in one mounted component so the frame never remounts),
`Frame` (image crossfade, occasion wash, day/night light, vibe silhouette, pinned wardrobe tile, caption, ring), `Dial` (horizontal
snap radiogroup with spring, drag, arrow keys), `Deck` (drag-to-swipe results and saved looks with edge peeks), `Sheet` (spring,
drag to dismiss, Escape, scrim), `LookDetails` (pieces, vendor, price, total, Save, Share, Buy confirmation), `Dock`, `Stage`,
`Signature` (accumulating DNA strip), `Dna`, `Looks`, `You`, `StepIn` (camera behind a button, upload, stand-in), `BuildRunner`
(fresh `useGuidedBuild` per run), `Ring` (SVG stroke driven by real progress), `journey` (sessionStorage), `content`.

## Routes (under /__design/c)
- `/` entry: Step in (Camera, Upload a photo, Use the stand-in) or, once he has stepped in or has a DNA, redirects to the occasion.
- `/step/face|occasion|venue|time|vibe|spend|piece|slot` one question per URL; guards redirect if earlier answers are missing.
- `/build` ring with MOMENT_STAGES, then replaces itself with `/result/0`.
- `/result/:index` swipeable looks rendered on him; `/result/:index/detail` opens the sheet.
- `/looks`, `/looks/:id` saved deck and its sheet (Remove instead of Save).
- `/you` DNA result, Redo, Forget me. `/dna/face|fit|week|inspiration|build` the DNA journey with DNA_STAGES.
- Returning user (saved DNA): `/` lands on the occasion dial with the signature strip; one tap builds with sensible defaults
  (time from the clock, vibe from lifestyle, first venue, elevated spend). "Change the details" on the result reopens the questions.

## Deviations from the concept document, and why
- Sheet height is min(52dvh, 470px) on mobile and 60% of the frame on desktop, not 40%: four pieces plus total and three
  actions do not fit 40% at 844px without inner scroll.
- Frame reactions accumulate in step order (venue caption only from the venue step on, light from time, silhouette from vibe,
  tile from piece) so Back to an earlier question visibly undoes later answers and a returning user's frame opens clean.
- Above 1024 px the dial wraps into rows inside the rail (max 420 px, 8 px gaps) so no chip is ever off screen; the
  horizontal snap dial is mobile and tablet only. The rail keeps 64 px of stage on its right at every desktop width.
- The vibe preview is not a drawing: the portrait drops to 40 percent under a 60 percent charcoal veil and the matching
  catalog look (the hero for that occasion and vibe) sits over it at 45 percent in the same crop. The same ghost stays during
  the build, so the result crossfades out of it. The DNA fit step ghosts a dinner look cut that way. Note the stand-in
  portrait is itself the Dinner sharper photo, so Dinner plus Sharp shows no visible ghost.
- The ring is drawn inside the frame, 3 px in from the edge with the matching 17 px radius, 2 px accent stroke.
- Result and Looks decks tuck the neighbours 38 percent under the current frame (0.96 scale, 0.6 opacity) so the 40 px peek
  (20 px on mobile) shows the next look's shoulder rather than the photo's plain backdrop.
- Night is a 12 percent veil plus a cool colour shift; the occasion wash is 35 percent so the portrait stays legible.
- Between 1024 and 1279 px the frame is 70dvh, not 78, so the frame, a 280 px rail and 64 px margins fit at 1024.
- Alternates are named by what they change ("Safer", "Sharper", "Relaxed"); the first is always "Our pick".
- Reduced motion: the dial becomes a native horizontal scroller (instant, tap only) rather than a wrapped row, which would push
  the six-chip inspiration step below the fold on mobile. Results become tap-only with dots, crossfades 120ms.
- Arrow keys move focus along the dial without selecting, because selecting auto-advances the question.
- The "You" heading states undertone and contrast, and the advice line drops its repeated opening sentence.
- The spend option label "Elevated" comes from the read-only shared catalog.

## Known gaps
- The rendered look is the catalog image crossfaded into the frame; no real compositing on the portrait.
- The DNA result uses SAMPLE_TONES for every capture.
- Vendor and price are catalog-generated; Buy shows an in-sheet confirmation only.
- Swipe is desktop-drag as well as touch; there are no arrow buttons beside the deck (dots and keyboard arrows cover it).
- Light mode tokens are defined in the concept but not implemented; the prototype locks dark.

## Verification
tsc clean for the directory, eslint clean, `npm run build` passes. Playwright walkthroughs at 1440x900, 1280x800 and 390x844 covered
all 17 states with no vertical scroll and no horizontal overflow; extra runs covered the camera path with a fake device,
reduced motion, and 768. No em or en dashes in any file.
Screenshots: /private/tmp/claude-501/-Users-clawdbob-ClaudeProjects-praxis/b10c2996-0a9b-4c53-b840-da7463e7f7e4/scratchpad/lab-shots/c/
