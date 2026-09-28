# Concept C: Mirror

## 1. Name
Mirror.

## 2. Philosophy
You are the interface: a single portrait frame that is always yours, and every question and every outfit happens on it.

## 3. Core interaction model
A dark stage with one object: a 3:4 portrait frame in the centre. On first visit the frame shows a stand-in with a single line inviting the user to "Step in" (camera or upload) or "Use the stand-in for now". Questions do not take him to screens; they appear as a horizontal dial of chips beneath the frame, one question at a time, and each answer changes the frame: the occasion sets the backdrop tone and a small caption, day or night changes the light, the vibe swaps the silhouette preview drawn over the portrait, and the wardrobe item appears as a small tile pinned to the frame's corner. The build happens on the frame: a thin ring of progress around it and the stage captions. Results are the frame showing the hero look rendered on him first (try-on is not a later step, it is the result), with two alternates reached by swiping the frame sideways or tapping the dots. Details live in a sheet that slides up over the lower third when he taps the frame.

Style DNA is a "signature": a thin strip of his tones and fit under the frame that accumulates as he answers the DNA questions and stays there forever. A returning user opens straight to his own frame with the signature; one dial spin (occasion) and one tap resolve the looks.

## 4. Navigation model
A three-item dock at the bottom on mobile and at the bottom-left on desktop: Mirror, Looks, You. That is all. Steps inside the mirror are in the URL so Back works.

## 5. Primary journey
ENTRY: the frame, dark stage, one line: "Step in." Two actions on the dial: Camera, Upload, and a quiet third: Use the stand-in.
→ INTENT: the frame now holds him (or the stand-in). Dial shows occasions.
→ ACTION: Dinner. Backdrop warms, caption "Dinner". Dial: venue. Then time, feel, spend, each on the dial, each one tap. Then "Add one of your pieces?" with Upload or Not now.
→ RESPONSE: the ring around the frame fills through four stages with captions; the frame crossfades to the hero look rendered on him.
→ RESULT: hero on him. Under the frame: the title, the one-line why, two dots for alternates, and one primary action "This one". Swiping the frame shows the alternates rendered on him.
→ NEXT ACTION: "This one" opens the sheet: pieces with vendor and price, total, Save, Share, Buy the pieces.

## 6. Screen architecture
- Stage (root): dark field, centred frame (max 62dvh tall on mobile, 78dvh on desktop), dial beneath, dock.
- Frame states: stand-in, captured, previewing (backdrop and silhouette), building (ring), result (swipeable), detail (sheet open).
- Dial: a single-row, horizontally scrollable radiogroup with snap; the selected chip is centred.
- Sheet: details and actions, 40% height, drag to dismiss.
- Looks: the frame becomes a horizontal deck of saved renderings on him; swipe, tap to reopen.
- You: the frame with his capture, the signature strip expanded into the DNA result (undertone, contrast, palette swatches drawn as a strip, one line), Redo.
- DNA journey: the same dial with Face, Fit, Week, Inspiration; the signature strip grows with each answer; the ring builds the DNA.

## 7. Visual language
- Typography: display "Bricolage Grotesque" 500 (a condensed-feeling grotesk with character, used only for the caption and the result title at 26 px desktop / 22 px mobile), body and dial "Manrope" 400 and 500. Dial chips 16 px. Nothing above 26 px inside the app.
- Type scale: 12, 14, 16, 18, 22, 26.
- Spacing: 8 px base; the frame has 24 px of stage around it on mobile, 64 px on desktop.
- Radii: frame 20 px, chips full pill, sheet 20 px top corners. Pill controls on a rounded frame is the documented rule.
- Color: stage charcoal `#141516` (never pure black), bone text `#EDE9E1`, secondary `#9A9891`, one accent: luminous moss `#8ED1A6` for the ring, the selected chip and the primary action. Backdrop tones per occasion are desaturated washes behind the portrait (dinner `#3A2F28`, work `#2B2F36`, date `#3A2A33`, wedding `#2E332B`, party `#1F2530`).
- Surfaces: the stage and the sheet only. The sheet is opaque charcoal `#1C1D1F` with a 1 px `#2A2C2F` edge. No glass, no blur.
- Photography: the portrait fills the frame, `object-cover`; the result look is composited by showing the look image inside the same frame with a 600 ms crossfade (the prototype's stand-in for a real render). A small "Rendered on you" caption sits on the frame's lower edge.
- Icons: dock uses three 1.5 px Lucide glyphs with labels; nothing else.
- Density: 3.
- Color behavior: light mode defined (stage `#F2EFE8`, text `#17181A`, accent `#2E7A55`), prototype locks dark because the mirror metaphor needs it.

## 8. Motion language
Motion is physical. The dial snaps with a spring (stiffness 300, damping 30). The frame crossfades on every answer (350 ms). The build ring is an SVG stroke that fills with the real progress value. Results swipe with drag physics and a 0.96 scale on the outgoing frame. The sheet springs up. Nothing loops except the ring while building. Reduced motion: snapping becomes instant, crossfades become 120 ms fades, drag becomes tap-only with the dots.

## 9. Luxury mechanism
Cinematic focus. One lit object on a dark stage, nothing competing, a single luminous accent. The absence of chrome is the luxury.

## 10. Immersion mechanism
It is him. From the first second the frame is his reflection, every answer changes what he sees on himself, and the result is himself dressed. The product never shows a model unless he declines to step in.

## 11. Scroll strategy
None. The dial scrolls horizontally, results swipe horizontally, details are a sheet. Every state fits the viewport by construction.

## 12. Strengths
The most immersive and the most distinctive; try-on becomes the product rather than a reward at the end. Mobile-native. The signature strip makes DNA visible and cumulative.

## 13. Risks
Camera-first can intimidate; the stand-in path must feel first-class. Desktop needs a reason to exist beyond a centred phone. Dark and pill-heavy can slide toward "app store aesthetic" if the type is not restrained. Swipe results need clear affordance (dots and edge peeks).

## Design system summary
| Token | Value |
|---|---|
| Fonts | Bricolage Grotesque 500 display; Manrope 400/500 body |
| Scale | 12 / 14 / 16 / 18 / 22 / 26 |
| Spacing | 8 base, 24 stage on mobile, 64 on desktop |
| Radii | frame 20, chips pill, sheet 20 top |
| Color | stage #141516, text #EDE9E1, muted #9A9891, accent #8ED1A6, sheet #1C1D1F, edge #2A2C2F |
| Controls | dial chips (pill, hairline, accent fill when selected); one primary pill action |
| Navigation | three-item dock; steps in URL |
| Motion | springs on dial and sheet, 350 ms frame crossfade, SVG ring |
| Imagery | portrait frame, occasion washes, look composited in frame |
| Responsive | frame 62dvh mobile / 78dvh desktop; dock bottom / bottom-left |
