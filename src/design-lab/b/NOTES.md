# Concept B: Brief

## What was built
One page. The brief on the left writes itself as you tap; the looks resolve on the right. All eight surfaces:
home (empty brief + one text link to DNA), style a moment (six lines with inline chips, auto-open of the next line,
"With you" with face and piece capture: camera behind a button, upload, sample), guided build (MOMENT_STAGES tick as
lines under the brief while empty frames take their places on the right), results (hero 4:5, why, pieces table with
vendor and price, total, alternates with "Swap in"), try-on (TRYON_STAGES in the actions slot, 500 ms crossfade inside
the same frame, "Rendered on you"), Style DNA (Face, Fit, Week, Inspiration on the same line mechanism, DNA_STAGES,
plain-language result, saved to the store), Looks (right-edge drawer, quiet rows, Remove), You (the DNA header on the
brief, expands to palette, Redo, Remove). Editing any line after results runs a short rebuild (REBUILD_STAGES) with the
looks dimmed to 60 percent, then updates them in place. Buy and Share also live in the drawer. Mobile: one open line at a
time, results as a full-height sheet with a drag handle, "Show the looks" bar when the sheet is down.

## Routes and params
- `/__design/b` the brief. `for`, `where`, `when`, `feel`, `spend`, `face` (sample|camera|upload|dna|none),
  `piece` (top|bottom|shoes|extras), `pieceSrc`, `hero` (look id), `resolved=1`, `tryon=1`, `drawer` (buy|share), `you=1`.
- `/__design/b/looks` the brief with the Looks drawer open (same params carried).
- `/__design/b/dna` the DNA journey. `face`, `fit`, `week`, `inspo` (comma list, max two), `resolved=1`, `drawer=looks`.
Reload and Back restore the brief; a resolved URL shows results at once without replaying the stages.

## Deviations from the concept doc
- Returning user: the doc says DNA prefills Feel and Spend. It does (Feel from lifestyle, Spend from presets), and to reach
  the promised two taps When is also prefilled from the clock (audit 2.7 "automate time of day"). Prefilled lines carry a
  12 px note ("from your DNA", "from the clock") and remain editable.
- Try-on stages print in the actions slot beside the hero, not under the brief, so cause and effect sit together.
- The alternates on mobile stack as rows rather than two columns; two columns did not leave room for the why.
- Share opens in the drawer first (preview, link, one button) rather than firing straight from the results.

## Critique pass (changes)
- Looks column before results is alive: the hero frame sits at its final position from the first tap, holding the single
  line; choosing For fills it with the occasion's catalog mood image at 0.7 opacity with a mono caption; When: Night lays
  an 18 percent ink veil over it; Feel swaps the image to that occasion's matching tier (Safe, Sharp, Relaxed) and the
  caption reads "Dinner, Relaxed". During the build the frame keeps the mood image while the alternates appear as outlines.
  Note: the Dinner mood image is the sharper catalog file, so Feel: Sharp on Dinner shows no visible swap.
- Header: 24 px between Looks and You; the saved count is a 12 px mono figure 6 px after Looks.
- 768 wide uses the mobile model on purpose (single brief, results as the sheet) with a 32 px gutter from 640 to 1023 px;
  two columns start at 1024. Columns never squeeze.
- Sheet handle: the region is a labelled group, the handle button has a visually hidden name and a 44 px hit area;
  the "Show the looks" bar is a real button and Tab reaches it (verified at 390 and 768).
- No em or en dashes in source or in rendered text (checked on every screenshot).
- Tablet results (640 to 1023 px): the sheet lays out in two columns. Hero frame at 40 percent width (4:5, capped at
  60dvh) left; title, why, full pieces table (piece, vendor, price, total) and actions right; the two alternates as a
  row of two beneath. At 768x1024 the sheet content is 967 px in a 967 px viewport: nothing scrolls, nothing collapses.
  `LookResult` now takes `layout: "full" | "tablet" | "compact"`; the phone keeps the collapsed pieces row.

## Known gaps
- The shared stand-in portrait is the Dinner sharper image, so try-on on that exact look shows no visible change.
- Camera and upload images live in session state only; a reload falls back to the sample for that slot.
- Dark tokens are defined on `[data-theme="dark"]` but never switched on (the doc locks light).
- The looks column can scroll internally on very short desktop viewports (under about 780 px); at 1440x900 and
  1280x900 nothing scrolls.

## Screenshots
`/private/tmp/claude-501/-Users-clawdbob-ClaudeProjects-praxis/b10c2996-0a9b-4c53-b840-da7463e7f7e4/scratchpad/lab-shots/b/`
`d-*` 1440x900, `m-*` 390x844, `l-*` 1280x800, `t-*` 768x1024. Numbers: 01 empty, 02 partial, 02b partial with feel,
03 filled, 04 building, 05 results (05b sheet, 05c sheet hidden with the bar focused), 06-07 try-on, 08 buy drawer,
09-10 rebuild, 11 looks drawer, 12-15 DNA, 16 returning home, 17 You expanded, 18 reload of a resolved link.
