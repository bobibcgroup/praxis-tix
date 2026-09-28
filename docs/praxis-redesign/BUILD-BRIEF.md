# Design lab: shared build brief

This brief applies to all three concepts. Each concept document adds its own visual language, interaction model and motion on top of it. Where they conflict, the concept document wins.

## Product decisions these prototypes embody

From the founder (2026-09-27):

1. Output is catalog outfits from integrated vendors. If the user uploads one wardrobe item, outfits are built around it. Face capture reads tones and enables virtual try-on "as himself".
2. Nobody sees outfits on open. The user goes through "Style a moment" or builds a Style DNA. Photo capture is in V1 because it powers try-on. Style DNA exists so a returning user can generate quickly.
3. Men only. No voice, no chat. The interface is quiet and visual. Feel: easy, minimal, immersive, luxurious, fast, lively. No random waiting, everything guided, no unknown moments.

## Design DNA (non-negotiable)

Minimal (remove what does not deserve to exist), luxurious through restraint and typography rather than decoration, straight to the point (one obvious next action per screen), least scrolling (workflows fit one viewport or at most 1.5), live and engaged (motion that communicates), immersive (an experience, not CRUD).

Banned: card grids as a default, card inside card, sidebars, dashboard layouts, gradients as decoration, purple or "AI" aesthetics, glassmorphism unless the concept demands it, oversized hero text inside app screens, endless vertical sections, meaningless statistics, icon boxes above headings, pills everywhere, unnecessary shadows, five buttons where one interaction works, em-dashes anywhere in visible text, lorem ipsum, emoji as icons, placeholder brand names like Acme, exclamation marks in success copy, "Oops" in errors, the words elevate, seamless, unleash, next-gen.

## Surfaces every concept must ship

1. **Home**: what a first-time man sees. Must present the two ways in (Style a moment, Build my Style DNA) without a two-card fork if the concept can do better. A returning user with a saved DNA sees a faster entry.
2. **Style a moment**: occasion, venue, day or night, vibe, spend. Then two optional inputs: **your face** (camera or upload; provide "Use a sample" so the prototype works without a webcam) and **one wardrobe item** (upload or "Use a sample"; choose which slot it fills). Order and grouping are the concept's call, but every question must be answerable in one tap and the whole journey must feel guided.
3. **Guided build**: the wait is choreographed with the shared `useGuidedBuild` stages, showing real stage names and progress. Never a bare spinner.
4. **Results**: three looks (hero, sharper, relaxed) with one-line "why", the pieces with vendor and price, the total, and the actions: try it on, save, share, swap the hero for an alternate. The hero must be obvious. No compare mode, no name or date fields, no thumbs before a choice.
5. **Try-on**: a guided reveal of "you" wearing the look. Use the shared stand-in portrait when no capture exists. Label it as a rendering ("Rendered on you", not a claim of accuracy). Actions: save, share, buy the pieces, back to looks.
6. **Style DNA**: capture face (or sample), fit, lifestyle, up to two inspiration presets, then a guided DNA build that ends in a plain-language result (undertone, contrast, palette, one line of advice). No Kibbe, no season names, no radar chart, no percentages. Saving the DNA changes the home for the returning user.
7. **Looks**: saved looks, viewable, removable. Not a page with filters and bulk select; a quiet library.
8. **You**: the saved DNA and a way to redo it. Can be part of Looks or Home if the concept prefers.

## Technical rules

- Stack: React 18, TypeScript, Vite, Tailwind 3, `motion/react` (installed), Radix primitives from `@/components/ui/*` are allowed but must be restyled, never default. Lucide is the icon library already in the project; use it with a fixed `strokeWidth={1.5}` and size, or use no icons.
- Each concept lives entirely in `src/design-lab/<letter>/` and is mounted at `/__design/<letter>/*` by `src/design-lab/DesignLab.tsx` (already wired). The default export of `src/design-lab/<letter>/Concept<Letter>.tsx` must render the concept, own its sub-routing with `react-router-dom` `Routes` relative to its mount, and set `data-lab` and `data-concept="<letter>"` on its root element.
- Shared modules (read-only, do not edit): `src/design-lab/shared/catalog.ts` (occasions, venues, times, vibes, spend, looks, pieces, presets, tones, stand-in portrait), `src/design-lab/shared/guided.ts` (`useGuidedBuild`, stage lists), `src/design-lab/shared/fonts.ts` (`useConceptFonts`), `src/design-lab/shared/store.ts` (`useLabStore` for saved looks and DNA). Real outfit images are at `/images/*.jpg` (public) and style images come from the catalog module.
- Do not touch anything outside `src/design-lab/<letter>/`. Do not edit production pages, `index.css`, `tailwind.config.ts`, `App.tsx`, or shared lab files.
- Tokens: define your colors as CSS custom properties on the concept root (`[data-concept="a"] { --bg: ...; }`) and use Tailwind arbitrary values (`bg-[var(--bg)]`) or inline styles. Do not rely on production tokens like `bg-primary`.
- Fonts: call `useConceptFonts(id, googleFontsHref)` once in the concept root. `font-display=swap`.
- Motion: `motion/react` only (`import { motion, AnimatePresence, useReducedMotion } from "motion/react"`). Animate transform and opacity only. Honor `useReducedMotion`. Every animation must be justifiable in one sentence (hierarchy, feedback, state change, sequence).
- Viewports: 1440, 1280, 768, 390. Explicit mobile layout per surface; never a shrunk desktop. Use `min-h-[100dvh]`, never `h-screen`. Touch targets at least 44 px on mobile. Body text at least 16 px on mobile.
- Accessibility: every control is a `button` or `a` with a visible focus ring; option groups are `role="radiogroup"` with `aria-checked`; images have alt text; contrast at least 4.5:1 for text; dialogs and sheets have accessible names; Escape closes overlays.
- State: component state plus `useLabStore`. Steps must be reflected in the URL (sub-routes or search params) so Back works and reload does not lose the journey where reasonable.
- Copy: sentence case, plain words, no jargon, no percentages, no "AI". Write the real copy; no placeholders.
- No `console.log`. No `any`. Files under 400 lines; split components.
- Camera: use `getUserMedia` behind a button, with upload and "Use a sample" alternatives and a plain error message if the camera is unavailable. Never auto-start the camera.
- Sharing: use `navigator.share` when available, else copy a link and confirm quietly.
- Buying: vendor and price come from the catalog; "Buy" opens a non-functional confirmation state inside the prototype, never `example.com`.

## Definition of done per concept

- All eight surfaces reachable and working on the four viewports, with journeys that fit 1 to 1.5 viewports.
- `npm run build` passes, `npx tsc --noEmit -p tsconfig.app.json` passes for your files, `npm run lint` shows no new errors in your directory.
- A `NOTES.md` in your concept directory (under 60 lines): what was built, the routes, any deviation from the concept doc and why, known gaps.
