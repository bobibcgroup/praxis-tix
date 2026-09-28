# Praxis redesign: three directions

Prototypes run in the isolated design lab. Start the dev server (`npm run dev`) and open:

- `/__design` index
- `/__design/a` Stage
- `/__design/b` Brief
- `/__design/c` Mirror

Design systems: `concepts/concept-a.md`, `concept-b.md`, `concept-c.md`. Critique: `CRITIQUE.md`. Screenshots at four viewports: `concepts/shots/`.

All three embody the same product decisions: catalog outfits from vendors, the user's face and one wardrobe item as optional inputs, try-on as the payoff, Style DNA as the returning-user accelerator, men only, quiet and visual, no chat, no unmanaged waiting.

---

## Concept A: Stage

**Philosophy.** One question, one frame, and a look that assembles beside you as you answer.

**Best characteristic.** The living canvas. The frame previews, reacts, builds and reveals in one place, so the user watches the look form instead of filling a form.

**Primary UX innovation.** The canvas is the progress indicator, the preview and the result. Try-on is a wipe across the same frame the user has been watching.

**Aha-moment path.** About 7 interactions from cold to three looks, 8 to the rendering; 6 with a saved DNA.

**Scroll behavior.** None in the journey at any viewport. Looks scroll horizontally.

**Emotional feel.** Calm, editorial, printed. A lookbook that listens.

**Main compromise.** One question per screen adds a tap versus grouping, and desktop leaves the question column quiet during the build.

## Concept B: Brief

**Philosophy.** A tailor takes a brief, not a questionnaire: the brief writes itself as you tap and the looks resolve beside it.

**Best characteristic.** Everything is editable in place, before and after results. Change "Feel" and the looks rebuild in two seconds without leaving the page.

**Primary UX innovation.** The DNA header pre-fills the brief, so a returning user resolves three looks in three taps. Time of day comes from the clock.

**Aha-moment path.** About 6 interactions from cold, 7 to the rendering; 3 with a saved DNA.

**Scroll behavior.** Zero on desktop. On phones the brief fits one screen and results arrive as a sheet that fits one screen.

**Emotional feel.** Precise, confident, bespoke. The most "tool-like" of the three.

**Main compromise.** It is the least immersive and reads as a form until the frame fills. Its accent departs from the brand's green.

## Concept C: Mirror

**Philosophy.** You are the interface: a single portrait frame that is always yours, and every question and every outfit happens on it.

**Best characteristic.** Try-on is the result, not a reward at step 18. The first thing the user sees after the build is himself dressed.

**Primary UX innovation.** The frame reacts to every answer (occasion wash, evening light, a ghost of the feel, the pinned wardrobe piece) and the signature strip makes Style DNA visible and cumulative.

**Aha-moment path.** About 7 interactions from cold to the rendering; 2 with a saved DNA.

**Scroll behavior.** None. The dial and the results move sideways; details are a sheet.

**Emotional feel.** Cinematic, personal, quiet. One lit object on a dark stage.

**Main compromise.** Camera-first can intimidate and the experience depends on a rendering pipeline that does not exist yet; dark only; wide desktops show a lot of empty stage.

---

## Comparison

| Attribute | A: Stage | B: Brief | C: Mirror |
|---|---|---|---|
| Simplicity | High. One question, one action, one frame | High. Six labelled lines, all visible | High once stepped in; the entry adds a decision |
| Immersion | Strong. The frame is always alive | Moderate. The page is alive, but it is a page | Strongest. It is him from the first second |
| Speed to value | 7 taps cold, 6 returning | 6 taps cold, 3 returning | 7 taps cold, 2 returning, rendering included |
| Luxury | Highest. Serif, bone, silence, print | High. Precision and restraint | High. Cinematic focus, single accent |
| Learning curve | Lowest | Low, once "lines are editable" is understood | Low on mobile; the desktop rail needs a glance |
| Scrolling | None in journey | None on desktop; one sheet on mobile | None |
| Mobile adaptability | Natural 55/45 stack | Good; sheet model, two-column at tablet | Native; designed for the phone first |
| Implementation complexity | Medium. One layout, many frame states | Lowest. Declarative state, one page | Highest. Compositing, drag physics, camera |

---

## Recommendation

**Build Concept A as the spine, with two mechanics lifted from B and one from C.**

Why A: it satisfies the design DNA most completely. It is the most legible for a first-time man, the most premium in feel, it has no scroll anywhere, its wait is a visible build on the frame he is already watching, and it adapts to the phone without changing its model. It preserves the brand's green and serif lineage while replacing the generic parts. It is also the direction whose value does not depend on a technology that is not yet built: the living canvas works with catalog images today, and the try-on wipe gets better as compositing arrives, rather than being the whole product.

Why not B alone: it is the fastest and the easiest to build, but it is the least immersive and the founder asked for immersive. Its best ideas are portable.

Why not C alone: it is the most distinctive and the most exciting, and it is where Praxis should be heading once real rendering exists. Today it stakes the entire first impression on a stand-in or a camera, and on a compositing pipeline that returns constants. Shipping it before the pipeline is real would recreate the current product's core problem: a promise the system cannot yet keep.

What to lift into A:

1. **From B, the editable brief after results.** Once the looks exist, show the five answers as one editable line above the pieces ("Dinner, restaurant, night, sharp, elevated"). Tapping a word re-asks only that question on the stage and rebuilds in place.
2. **From B, the DNA pre-fill.** A saved DNA should pre-answer feel and spend, infer time from the clock, and keep the face on file, so the returning journey is two taps: occasion and venue.
3. **From C, try-on as the default for returning users with a face on file.** When the user has stepped in before, the build should land directly on the rendering, with "See the catalog view" as the secondary, inverting the first-visit order.

Sequencing for V1: ship A with the results-line editing and DNA pre-fill; treat the try-on wipe as a first-class state fed by whatever rendering exists; add the try-on-first landing when compositing quality clears the bar.

Before any of this ships, fix the four production-hygiene items in the audit (rotate the exposed OpenAI key, move Clerk off the dev instance, pass the Clerk token to Supabase, stop the trend endpoint leaking upstream errors), and prototype real compositing against three real portraits, because every concept's payoff depends on it.
