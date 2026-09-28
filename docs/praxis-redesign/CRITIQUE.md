# Critique of the three concepts

Each concept was reviewed against the design DNA (minimal, luxurious, straight to the point, least scrolling, live, immersive, easy), the anti-pattern list, the taste-skill pre-flight rules (no em-dashes, no hand-rolled decorative SVG, no glow, no pure black, one accent, motivated motion, reduced motion honoured) and the ui-ux-pro-max checklist (contrast, 44 px targets, focus, radiogroup semantics, no horizontal scroll, 16 px mobile body). Findings below are what was found, what was fixed, and what remains.

Common verification across all three: lab typecheck clean, lint clean (one react-refresh warning in A), zero em or en dashes in source, no `console` calls, no `any`, largest file under 300 lines, every journey state measured at 1440, 1280, 768 and 390 with no vertical scroll and no horizontal overflow. The production build excludes the lab; it is only bundled with `VITE_DESIGN_LAB=1` or in development.

## Concept A: Stage

**Clarity.** Excellent. One question, one action, one frame. The progress spine names the steps in five words. Interaction cost to results: 7 taps from cold, 6 with a saved DNA; try-on is one more.

**Emotional quality.** The calmest of the three. Light serif at 40 px on bone with a single 3:4 print reads as a printed lookbook rather than an app.

**Distinctiveness.** The living canvas is a genuine idea: the frame previews the occasion strip, then the chosen occasion, then darkens for night, then previews the feel tier, then holds the result, then wipes to the rendering. No competitor does this.

**Found and fixed.** Looks gallery rendered one print per viewport (now 3 across, capped at 56dvh). The empty canvas at home was a blank field with a caption (now a muted five-occasion strip that crossfades into the chosen one). The face inset sat on top of the hero image and read as a second model pasted on (removed from results; face is now a 44 px thumbnail beside the primary action). Home block sat dead centre (moved to the upper 40%).

**Remaining.** Desktop asks the question in a 40% column, which is generous but leaves the left column quiet during the wait. Time of day is asked, not inferred. Try-on is a wipe to the stand-in with a different crop, since no compositing exists in the lab.

**Scores.** Clarity 9, emotion 9, distinctiveness 8, hierarchy 9, cognitive load 9, journey efficiency 7, interaction cost 7, scrolling 10, accessibility 8, responsiveness 9, consistency 9, perceived performance 8, premium 9, immersion 8, motion usefulness 9.

## Concept B: Brief

**Clarity.** Very high. The brief is legible at a glance and every value is editable in place. Interaction cost to results: 6 taps from cold, 3 with a saved DNA (For, Where, Resolve); try-on is one more.

**Emotional quality.** Precise and confident, closer to a bespoke order form than a lookbook. Mono values give it a voice without decoration. It is the least warm of the three.

**Distinctiveness.** Editing after results and the DNA header that pre-fills the brief are the strongest product mechanics in the set. The two-tap returning journey is the fastest path to value of any concept.

**Found and fixed.** The right column was blank for the first five taps (now the hero frame holds the occasion mood image once "For" is chosen, darkens for night, and swaps to the matching tier when "Feel" is chosen). "Looks You" ran together in the header (spaced). Tablet used the phone layout, leaving the hero as a thumbnail (now a two-column sheet from 640 px). Sheet handle lacked an accessible name and a 44 px hit area (added).

**Remaining.** On a first visit, the desktop still reads as a form until the frame fills, and the concept depends on the user understanding that lines are editable. The ink-blue accent breaks from the brand's green; that is a decision to confirm, not a defect.

**Scores.** Clarity 9, emotion 7, distinctiveness 8, hierarchy 8, cognitive load 8, journey efficiency 9, interaction cost 9, scrolling 10, accessibility 9, responsiveness 9, consistency 9, perceived performance 9, premium 7, immersion 6, motion usefulness 8.

## Concept C: Mirror

**Clarity.** High once the user has stepped in. The dial asks one thing at a time and the frame answers. Interaction cost to result rendered on him: 7 taps from cold (including "Use the stand-in" and "Not now" for the piece), 2 with a saved DNA (occasion, then build with defaults). Try-on is the result, so zero extra.

**Emotional quality.** The most immersive and the most cinematic. One lit object on charcoal, one luminous accent. It feels like a product about him.

**Distinctiveness.** Try-on-first inverts the current product's structure, where the rendering sits at step 18. The signature strip makes the DNA visible and cumulative.

**Found and fixed.** Dial chips clipped at the viewport edge on desktop with only three visible (now a wrapped row in the rail above 1024 px). The alternate peek was a bare grey slab (now the real next look tucked under the frame at 0.6 opacity). The progress ring was drawn as an offset rectangle cut at two thirds height (now traces the frame's exact rounded path with real progress). The vibe preview was a hand-drawn vector silhouette, a banned pattern (now a photographic ghost of the matching look at 45% over the dimmed portrait). Looks deck showed a single frame with no sign of others (now peeks plus a count). Night veil made the portrait muddy (reduced to 12% with a cool shift; the occasion wash dropped from 55% to 35%).

**Remaining.** The ghost preview during the vibe step shows two overlapping men when the stand-in and the catalog image differ; with a real user portrait and real compositing this becomes the intended effect, but in the lab it is the least convincing frame. Camera-first can intimidate, and the concept leans on the stand-in path to soften that. Desktop has a large empty left field by design; the dock and rail use it, but a wide monitor still shows a lot of stage. Dark only.

**Scores.** Clarity 8, emotion 9, distinctiveness 10, hierarchy 8, cognitive load 8, journey efficiency 8, interaction cost 8, scrolling 10, accessibility 8, responsiveness 8, consistency 8, perceived performance 8, premium 8, immersion 10, motion usefulness 9.

## Cross-cutting observations

- All three eliminate the mode fork, the results-page clutter, the fake store, confetti, the compare mode, name and date fields, Kibbe and season labels, and the five secondary routes. All three put the "why" on one line and the pieces with vendor and price in view.
- All three choreograph the wait with named stages and a real progress value; none shows a bare spinner.
- The shared stand-in portrait is also the Dinner sharper catalog image, so "Rendered on you" on that exact look shows no visible change in any concept. This is a lab data limitation, not a design one.
- None of the three has been tested with a real user capture composited onto a look. The rendering pipeline is the biggest technical unknown behind every concept and should be prototyped next regardless of the direction chosen.
