# Final direction: Concept D, Atelier

Concept D merges what the founder chose from A and B. Open it at `/__design/d` with `npm run dev`. Spec: `concepts/concept-d.md`. Screenshots for every visual direction in both modes: `concepts/shots/d/`.

## What it is

- **A's living frame.** The print on the right previews the five occasions, becomes the chosen one, shifts for night, ghosts the feel, builds the three looks in place, holds the result, and wipes to the rendering.
- **B's visible plan.** All six brief lines are on screen from the first second with empty values, so the end is known. A segmented hairline under the frame reads "3 of 6, Feel" and turns continuous during the build with the stage name.
- **One page, no loading.** Nothing routes. Brief, build, results, try-on, Style DNA, Looks and You all happen on the same page; Looks, You, Buy and Share are drawers. State is mirrored into the URL so reload restores it, but the frame is never remounted.
- **Three looks always visible.** From the build onward, three thumbnails sit under the frame in a stable order; the one shown large is highlighted; tapping another swaps the frame and moves the highlight. They persist through rebuilds and try-on.
- **Editable after the fact.** Any brief line can be reopened after results; the frame dims to 60%, a short rebuild runs, and the three looks update in place.
- **Returning user.** A saved DNA becomes a header above the brief, pre-fills Feel, Spend and the face, and fills When from the clock, so the next moment is two taps.


## Orientation and continuity (added 2026-09-28)

- **First visit.** A welcome state precedes the brief: "Know what to wear. Every time.", one line on what will happen, "Dress me for a moment" and "Or build my Style DNA first". It shows once and never again after the first answer.
- **Completion.** After Save, after reserving pieces, and after saving a DNA, the column shows "Done. Where next?" with "Style another moment", "Open my looks" and "Build" or "Update my Style DNA". "New moment" sits in the top bar from the first answered line; results keep "Back to the brief" and try-on keeps "Back to looks".
- **Light by default.** Dark only by saved preference or `?mode=dark`.
- **Primary action always visible.** The brief column and the mobile panel are flex columns; the lines scroll inside them and the action row is pinned at the bottom under a rule, verified with the sixth line open at 1440x900, 1280x720, 390x844 and 375x667.

## Visual direction (superseded)

The three-theme switcher below was an exploration. The founder chose the rebrand direction Forest and Bone with the Hairline element system (see `REBRAND.md`); Concept D now carries that single theme in light and dark.

## Three visual directions (exploration record)

The layout, behaviour and copy are identical. Only tokens change. Use the switcher in the bottom-right corner of the prototype (1, 2, 3 and Light or Dark), or add `?theme=bone|graphite|stone&mode=light|dark` to the URL.

| | 1. Bone | 2. Graphite | 3. Stone |
|---|---|---|---|
| Character | Editorial, printed, calm | Precise, bespoke, technical | Warm, cinematic, soft |
| Display font | Cormorant Garamond 300/400 | Geist 500 | Bricolage Grotesque 500 |
| Text font | Geist | Geist, Geist Mono for values and prices | Manrope |
| Light | Bone #F4F1EA, ink #15181C, sage #2E4A3D | Paper #F7F6F2, ink #1A1B1E, cobalt #1F3A93 | Stone #F2EFE8, ink #17181A, moss #2E7A55 |
| Dark | #121417, #ECE8DF, sage #8FB59F | #141517, #ECEBE6, cobalt #8FA7F5 | #141516, #EDE9E1, moss #8ED1A6 |
| Shapes | Sharp: 0 on frames, 2 px on controls | Soft: 6 px everywhere | Round: 20 px frames, pill controls |
| Rules | 1 px hairlines | 1 px rules, ink-filled selected chips | No rules, spacing groups; accent-filled chips |
| Active thumbnail | 2 px accent underline | 2 px accent border | Accent ring |
| Continuity with today's brand | Highest (serif and green kept) | Lowest (new accent, no serif) | Medium (green kept, new type) |

## Recommendation on the visual direction

Bone, if the brand's current serif and green identity should carry forward and the product should feel like a printed lookbook. Stone, if the brand wants to feel warmer and more contemporary and is willing to drop the serif. Graphite is the sharpest tool and the least fashion-like; it suits the brief mechanic best but reads more like software than a stylist.

## Before production

1. Fix the four hygiene items in `AUDIT.md` section 6 (exposed OpenAI key, Clerk dev instance, Supabase without user identity, leaking error bodies).
2. Prototype real compositing of a user portrait onto a catalog look; every payoff in this concept depends on it.
3. Replace the lab's sample tones with the real face pipeline once it returns real values.
4. Port `src/design-lab/d/` into production surfaces, replacing `Flow.tsx` and the five secondary routes.
