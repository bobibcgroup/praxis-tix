# Concept D: Atelier. Build notes

## What it is
One page, zero route changes. The brief of B on the left (six lines visible from the first second, the open line's chips inline, auto-open of the next line, values collapsing into the line, edits after results re-running a short build in place with the print dimmed to 60%, DNA header prefill, When from the clock for a returning user) and the living print of A on the right (occasion strip, chosen occasion, night veil, feel ghost, guided build on the print with the stages ticking under the brief, result in the print, try-on wipe). Brief, build, results, try-on, DNA, Looks, You, Buy and Share all happen on the same page; drawers open from the right edge and never change the page behind. The Frame is never remounted.

## Brand and element system (craft pass)
Brand "Forest and Bone" and element system "Hairline" from `src/design-lab/system/` are the single theme. `d.css` holds the two palettes on `[data-mode]` and the control rules; `d-layout.css` holds the structure.
- Fonts: Source Serif 4 at 600 with optical sizing (`opsz,wght@8..60,600`) for the brief title, the welcome headline, the look title, "Done. Where next?", the wordmark and drawer titles; Geist 400/500 for text; Geist Mono 400 for prices and stage lines. Body text is 16 px on a phone and 15 px on a desktop (the root font size switches at 1024). Muted is `#5A5E56` light, `#9A9B95` dark. `brands.ts` Forest carries the same display face and weight so the specimen matches.
- Controls (`.d-control`): 44 px, `inline-flex; align-items:center; padding:0 16px; line-height:1`, 15 px medium, hint 13 px muted 8 px after the label on the same baseline, 2 px corners, 1 px rule border, selected = ink fill, hover = surface, pressed = scale 0.98, focus = 2 px accent ring with a 2 px gap. Primary = accent fill, min-width 120. Secondary = 1 px text border. Tertiary = muted text. `.d-wrap` lets a tertiary label take two 16 px lines inside the 44 px box.
- Brief lines (`.d-line`): grid `96px 1fr 24px`, 52 px rows (44 px below 1024), label 13 px muted, value 16 px, 16 px chevron, 1 px rule between rows. Open line: chips at the 96 px edge, 8 px gaps, 8 px above, 16 px below; one column with hints on desktop.
- Progress: six 2 px segments with 4 px gaps and the tabular count on the left; one continuous line during a build. Thumbnails 64 x 85 at 12 px gaps, active underline 2 px flush, 6 px below. Detail rows on the baseline, prices Geist Mono tabular on one right edge. 8 px grid; gutters 48 desktop, 20 mobile.

## Orientation (founder pass 4)
- Welcome whenever there is no brief in progress, no saved looks and no DNA. No "seen" flag; starting, answering, resolving, "New moment" and entering DNA mark the session as started so it does not come back mid-session. Saved content is read synchronously from `localStorage["praxis_lab_d"]` so a returning user never sees it flash.
- While the brief is unresolved the column is headed "Where are you going?" (desktop) with the 16 px line "Answer five lines. I build three looks from the catalog and show them on you." on every width, pinned above the scrolling lines (`BriefHeader.tsx`, inside the body crossfade). A DNA user sees the same line above the "Your DNA" row. During a build the title reads "Three looks for dinner, forming." and the line steps aside for the stages.
- The empty print's hairline caption reads "Your three looks appear here" until the first answer, on the welcome too.
- Action row before the five required lines are answered: no disabled button; a 13 px muted line, "Answer the five lines to build your looks. 2 of 5 answered." (44 px box on desktop so the row does not jump). "Build the looks" fades in over 200 ms when ready; the DNA brief does the same with "four lines". Completion state and "New moment" unchanged.

## Layout (founder pass 4)
- Desktop: the top bar and the two-column stage (`.d-max`) stop at 1600 px, centred; beyond that the gutters grow and the surface field stays full-bleed under the print column via a stage gradient whose edge is `max(40%, 50% - 160px)`. The print is sized from the height it is given: `--room-h` (viewport minus the 56 px bar and the canvas paddings) minus the reserve under it (40 hairline, 120 thumbnails, 168 with caption), width following 3:4, never wider than the column; container units refine it where supported. The brief column is a flex column: pinned header, scrolling body, action row under one rule.
- Phone: the print band is 38% of the stage under the top bar while the brief is answered (`data-band="brief"`), 50% once looks, a build, a completion or the DNA need it. Below 640 the open line's chips take the full width (the 96 px indent left 123 px columns, too narrow for "Launch or gallery") and lines whose labels are 8 characters or fewer sit three across, so an open line is never more than two rows; the open line's bottom padding is 8 px there. If the body must scroll, an opened line scrolls its options fully into view without pushing its own row off the top (`BriefLine.reveal`). The lab mode button is hidden below 640 px while a line is open.
- Try-on: "A rendering, not a photograph." sits under the thumbnails on every width; the column no longer repeats it.

## Measured (pass 4, light)
`scrollHeight <= innerHeight` and the primary action (or the muted count) fully inside the viewport in every shot: 1440x900 and 390x844 (welcome, brief-empty with For open, With you open, results, try-on, after-save), and 2000x1120, 1920x1080, 1280x720, 375x667 (brief-empty, results). Internal body scroll: none at 1440x900 or 390x844 in the brief states (390 brief-empty: 377 of 382 px); 390 With you open scrolls (549/356) with the line revealed; 1280x720 For open scrolls (589/435, one-column chips with hints); 375x667 For open scrolls (377/254) with the options in view; results at 1280x720 and 375x667 scroll the details, action pinned. Print: 684x912 at 2000x1120, 519x692 at 1440x900, 183x243 at 390x844 (brief), 194x258 (results).

## Params
`for, where, when, feel, spend, face (sample|own|dna|none), piece (slot), pieceSrc, hero, resolved=1, tryon=1, drawer (looks|you|buy|share), done (saved|reserved|dna)`; DNA: `dna=1, dface, fit, week, inspo, dresolved=1`; `mode`. Always replaced, never pushed. Camera and upload images live in session state only.

## Deviations, and why
- Rows are 44 px below 1024 px (spec: 52 px) so the six lines fit under the 38% band; chips there are full-width and up to three across (see Layout). Chip hints are hidden below 640 px.
- Night veil is applied before results only. When is prefilled from the clock only for a DNA user. The DNA result is shown before it is saved.

## Known gaps
- The try-on rendering is the shared stand-in; the DNA result always uses `SAMPLE_TONES`.
- The specimen page (`SystemLab.tsx`) does not load Source Serif 4 in its font href, so the Forest card falls back to the system serif until that href is updated; it is outside this directory.
- A DNA user with For open at 1440x900 scrolls the body by about 26 px (the extra row); the open line stays in view. The lab mode button still sits over the action row's empty right side on a phone when no line is open.

## Screenshots
Pass 4: `/private/tmp/claude-501/-Users-clawdbob-ClaudeProjects-praxis/b10c2996-0a9b-4c53-b840-da7463e7f7e4/scratchpad/lab-shots/d4/` with `measurements.json`. `light-{welcome, brief-empty, brief-with-you-open, results, tryon, after-save}-{1440,390}.png`, `light-{brief-empty, results}-{2000,1920,1280,375}.png`, `light-brief-dna-1440.png`. Earlier passes: `lab-shots/d3/`, `lab-shots/d2/`, `lab-shots/d/`.
