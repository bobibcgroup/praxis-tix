# Concept D: Atelier (the final direction: A plus B)

## 1. Name
Atelier. The stage of Concept A with the brief of Concept B, on one page that never leaves.

## 2. Philosophy
A tailor's brief on the left that shows the whole plan, a living frame on the right that shows the look forming, and nothing ever loads or navigates: the same page carries the entire experience.

## 3. What is taken from each
- From A: the living canvas (occasion strip, chosen occasion, night light, feel ghost, build on the frame with a progress hairline, result in the frame, try-on wipe), the serif calm, the one-tap answers, the filmstrip idea.
- From B: the six-line brief that is visible from the first second so the user knows exactly how many steps remain and when it ends; inline chips inside the open line; auto-open of the next line; values collapsing into the line; editing any line after results triggers a short in-place rebuild; Looks and You as right-edge drawers; the DNA header that pre-fills lines; time from the clock.
- The founder's additions: on results, all three looks stay visible as small thumbnails under the frame at all times, and the one currently shown large is highlighted. Swapping never removes a thumbnail; it moves the highlight. The user must always know where he is in the process, so the brief and a segmented progress hairline under the frame both say "3 of 6".

## 4. Core interaction model
One page. Desktop above 1024 px: brief column 40%, canvas column 60%. The brief has six lines: For, Where, When, Feel, Spend, With you. All six are visible from the start with empty values, so the plan is known. The first line is open; choosing a chip fills the value, collapses the line and opens the next. The canvas reacts to each answer exactly as in A. When the five required lines are filled, the sixth (With you: your face, one of your pieces, each optional with camera, upload and sample) is open, and a single action "Build the looks" sits under the brief. The build runs on the canvas with the guided stages (names printed as ticking lines under the brief, as in B, and the hairline under the frame filling, as in A). Results: the frame shows the hero; three thumbnails sit under the frame, hero highlighted; the brief collapses to values and stays editable; the left column shows the title, why, pieces with vendor and price, total, "See it on you", Save, Share. Tapping a thumbnail crossfades the frame and moves the highlight. Editing a brief line dims the frame to 60%, re-runs a short build, and updates the three looks in place. Try-on: the wipe in the same frame, thumbnails remain, "Rendered on you" caption, actions become Buy the pieces, Save, Share, Back to looks.

Mobile below 1024 px: the canvas is the top 50% of the viewport (3:4 frame with the thumbnails below it once results exist); the brief is the bottom 50% as a compact list of six one-line rows, all visible, the open row expanding its chips inline (the panel scrolls internally only if it must; the rows never leave). After the build the bottom panel becomes the result details with the brief collapsed to a single editable line at the top ("Dinner, restaurant, night, sharp, elevated") that reopens the brief when tapped.

Style DNA uses the same page and the same mechanics: the brief lines become Face, Fit, Week, Inspiration, the build runs on the canvas with the DNA stages, the result (undertone, contrast, palette, one line of advice) replaces the left column, and saving writes the DNA header above the brief. Looks and You are drawers from the right edge; opening them never changes the page behind.

## 5. Navigation model
None. The brief is the navigation. Two quiet text links top right: Looks, You. State lives in URL search params (replaced, not pushed) so reload restores the page; the page never routes.

## 6. Screen architecture
- Page: top bar (wordmark, Looks, You), brief column, canvas column.
- Brief states: empty, in progress, ready to build, building, resolved (collapsed and editable), rebuilding.
- Canvas states: strip, occasion, night, feel ghost, building (hairline segmented 1 to 6, then continuous during the build), result with thumbnails, try-on.
- Drawers: Looks, You, Buy, Share.
- DNA mode: same page with the four DNA lines.

## 7. Visual language: three directions to choose from
The layout, behaviour and copy are identical across the three. Only tokens change: fonts, colours, radii, control style, rules. Each direction defines light and dark. The prototype carries all three and both modes behind a lab-only switcher so they can be compared on the same screens.

### Direction 1: Bone (editorial)
- Fonts: Cormorant Garamond 300/400 for the brief title, question and look title; Geist 400/500 for everything else.
- Light: background #F4F1EA, text #15181C, muted #5D6168, rule #DCD7CC, accent #2E4A3D, accent tint #E4EBE5, canvas field #E9E5DC.
- Dark: background #121417, text #ECE8DF, muted #9A9B96, rule #2A2D31, accent #8FB59F, accent tint #1E2A24, canvas field #1A1D21.
- Elements: radius 0 on frames and drawers, 2 px on chips and buttons; 1 px hairlines; selected chip fills with the accent tint; the primary action is a filled accent rectangle; thumbnails are 3:4 prints with a 4 px inset, the active one carries a 2 px accent underline.

### Direction 2: Graphite (precision)
- Fonts: Geist 400/500 for all text; Geist Mono 400 for brief values, prices, stage lines and captions.
- Light: background #F7F6F2, text #1A1B1E, muted #6A6D72, rule #D8D6CF, accent #1F3A93, accent tint #E6EAF7, canvas field #ECEBE6.
- Dark: background #141517, text #ECEBE6, muted #9C9EA3, rule #2A2C30, accent #8FA7F5, accent tint #1C2237, canvas field #1B1C1F.
- Elements: radius 6 everywhere; 1 px rules between brief lines; selected chip is ink-filled with paper text; primary action is a filled accent rounded rectangle; thumbnails carry a 1 px rule border, the active one a 2 px accent border.

### Direction 3: Stone (warm cinematic)
- Fonts: Bricolage Grotesque 500 for the brief title, question and look title; Manrope 400/500 for everything else.
- Light: background #F2EFE8, text #17181A, muted #6F716C, rule #DAD6CC, accent #2E7A55, accent tint #E1EEE6, canvas field #E8E4DB.
- Dark: background #141516, text #EDE9E1, muted #9A9891, rule #2A2C2F, accent #8ED1A6, accent tint #1C2A22, canvas field #1C1D1F.
- Elements: frames and drawers 20 px radius, chips and buttons full pill; no rules between brief lines, spacing does the grouping; selected chip fills with accent and dark text; primary action is a filled accent pill; thumbnails are rounded 12 px, the active one carries a 2 px accent ring.

## 8. Motion language
As A for the canvas (400 ms crossfades, 240 ms question fades, 900 ms try-on wipe, spring for thumbnails arriving), as B for the brief (200 ms line collapse and open, 240 ms tick draw, 60% dim during rebuild). Thumbnail highlight moves with a 200 ms ease. Reduced motion: cuts and fades.

## 9. Luxury mechanism
Scale, silence and precision at once: one large print, one editable brief, hairlines or air, nothing else.

## 10. Immersion mechanism
The frame reacts to every answer and never leaves; the whole experience happens in one place the user can see end to end.

## 11. Scroll strategy
None on desktop. Mobile: the canvas panel never scrolls; the brief panel scrolls internally only if the open line's chips do not fit.

## 12. Strengths
Known end, visible plan, live feedback, no loading, editable after the fact, three looks always in view.

## 13. Risks
Two columns doing a lot on desktop; the mobile lower panel must stay disciplined; three visual directions on one codebase must stay strictly token-only or they will drift.
