# Praxis rebrand: three directions and a recommendation

Live specimen page: `/__design/system` (dev server). Any brand can be viewed with any element system, in light and dark, with an 8 px grid overlay for alignment checks. Tokens live in `src/design-lab/system/brands.ts`.

## What the brand has to do

Praxis is a stylist, not a store and not a feed. The interface's first job is to make the clothes look right and the decision feel easy. That sets three rules for any palette:

1. The chrome is neutral. Garment colour must never fight the interface, so backgrounds are near-neutral, greys are one family, and there is exactly one accent.
2. The accent means action and progress, nothing else. It marks the chosen option, the primary button and the progress element. It is never decorative.
3. The type carries the personality. With a neutral palette, the display face is what makes Praxis recognisable.

The target is "The Considered Man": direct, practical, wants to look put together without appearing vain. The tone is a critical friend, not a fashion magazine and not a gadget.

## Direction 1: Chalk and Ink

Mood: decisive, editorial, cold luxury. A tailor's chalk mark on dark cloth.
Words: direct, sharp, quiet, certain.

| Role | Light | Dark |
|---|---|---|
| Background (Chalk) | #F2F1EC | #131416 |
| Surface | #E8E7E1 | #1C1D20 |
| Text (Ink) | #16181B | #EDEBE4 |
| Grey | #6B6D6A | #9A9993 |
| Rule | #D3D1C9 | #2B2C30 |
| Mark (accent) | #D9482B | #E8593B |

Type: Instrument Sans 600 for display, tight tracking; Geist for text; Geist Mono for values and prices.
Why: the most neutral chrome of the three, so every garment carries its own colour; the single red mark is unmistakably "this is the decision". Reads as editorial menswear, not as software. Photography looks best against it.
Risk: red must be rationed hard or it turns into alarm; the palette gives nothing to hide behind, so alignment and type have to be exact.

## Direction 2: Forest and Bone

Mood: grounded, confident, heritage made modern. The current green, taken seriously.
Words: assured, warm, classic, trusted.

| Role | Light | Dark |
|---|---|---|
| Background (Bone) | #EFEAE0 | #121614 |
| Surface | #E4DED2 | #1A201C |
| Text | #1B1F1C | #ECE7DC |
| Grey | #646860 | #98998F |
| Rule | #D0C9BA | #263029 |
| Forest (accent) | #1F3A2E | #7FB090 |

Type: Cormorant Garamond 500 for display (never 300; the light weight reads grey); Geist for text; Geist Mono for values.
Why: keeps the equity of the existing green and serif but commits to them. A true forest instead of a washed sage, bone instead of off-white, a serif at a weight that prints.
Risk: green on bone is a well-worn "quiet luxury" combination; without discipline it slides into the generic calm-SaaS look the audit flagged. Dark mode's lifted green must stay desaturated.

## Direction 3: Stone and Terracotta

Mood: warm, human, Mediterranean. Sun on limestone, one clay accent.
Words: approachable, warm, contemporary, regional.

| Role | Light | Dark |
|---|---|---|
| Background (Stone) | #F1EFEA | #16171A |
| Surface | #E6E3DC | #1F2024 |
| Text (Slate) | #24262A | #EAE8E2 |
| Grey | #6E7077 | #979A9F |
| Rule | #D3D0C8 | #2C2E33 |
| Terracotta (accent) | #B4573A | #D9785B |

Type: Bricolage Grotesque 600 for display; Manrope for text; Geist Mono for values.
Why: speaks to Beirut and the Gulf without cliché (no gold, no sand gradients): cool stone greys carry the interface, one terracotta gives it a pulse, and a grotesk with character keeps it from feeling like every other app.
Risk: terracotta sits close to skin tones and to many garments (camel, tan, rust), so it can clash on the results screen; the warmest option and the least "luxury" of the three.

## Element systems (independent of brand)

| | Hairline | Soft | Pill |
|---|---|---|---|
| Corners | 0 frames, 2 px controls | 12 px frames, 8 px controls | 16 px frames, full-radius controls |
| Edges | 1 px rules | none, surface fills | 1 px rules |
| Selected | ink fill | accent tint fill, accent text | accent fill |
| Progress | 6 segments, 2 px, count on the left | 6 numbered discs on a line | 40 px ring plus dots |
| Active thumbnail | 2 px underline flush to the print | 2 px border on the print | 2 px ring offset 3 px |
| Feel | editorial, exact | calm, modern | tactile, friendly |

Rules shared by all three: 44 px control height, text centred by the box, label and hint on one baseline 8 px apart, 96 px label column and 52 px rows for brief lines, tabular figures on one right edge for prices, vendor 2 px under the piece at 13 px grey, focus ring 2 px accent with a 2 px background gap, 8 px spatial grid.

## Recommendation

**Chalk and Ink with the Hairline system.**

It is the only combination where the interface disappears behind the clothes, which is the job. It matches the product's voice (tell, don't ask; one decision; no vanity) better than a warm or heritage palette, and it survives dark mode without inventing a second identity: chalk on ink and ink on chalk are the same brand. Instrument Sans gives it a face without the "calm SaaS" serif that every AI-generated interface reaches for, and it pairs with photography of any colour. The red mark is the one risk, and it is a discipline, not a design problem: it appears on the selected option, the primary action and the progress element, and nowhere else.

If the founder wants continuity with today's green, Forest and Bone with the Hairline system is the credible second choice, on the condition that the sage becomes a true forest and the serif is set at 500 or heavier.

## Decision

On 2026-09-27 the founder chose **Forest and Bone** with the **Hairline** element system. Concept D is rebuilt with that as its single theme (light and dark), every control constructed to the rules above. Cormorant Garamond is set at 500 for display and never lighter.
