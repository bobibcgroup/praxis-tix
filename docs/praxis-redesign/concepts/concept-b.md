# Concept B: Brief

## 1. Name
Brief.

## 2. Philosophy
A tailor takes a brief, not a questionnaire: the whole journey is one page where the brief writes itself as you tap, and the looks resolve beside it the moment it is complete.

## 3. Core interaction model
Declarative and in place. The left side of the screen is a structured brief with six lines: For, Where, When, Feel, Spend, With you. Each line is a control. Tapping a line expands its options inline (chips inside the line, nothing navigates away); choosing one collapses the line to its value and opens the next line automatically. Required lines are the first five; the sixth ("With you") holds two optional switches: "your face" and "one of your pieces". When the five required lines are filled, a single action appears at the foot of the brief: "Resolve the looks". The guided build prints its stages as lines that tick beneath the brief, then the right side fills with the three looks. Editing any brief line after results re-runs a short build and the looks update in place. Try-on replaces the hero image on the right with the user's rendering, inside the same frame.

Style DNA is a saved header on the brief ("Your DNA: cool, high contrast, slim, mostly office") that pre-fills Feel and Spend, and pins the user's face into "With you". A returning user's brief therefore needs two taps (For, Where) to resolve.

## 4. Navigation model
None. The brief is the navigation. Two quiet text links in the top right: Looks (a right-edge drawer of saved looks) and You (the DNA header expanded). New brief resets the lines. Sub-state is in the URL query so reload and Back restore the brief.

## 5. Primary journey
ENTRY: the brief with all lines empty and the first line open, a single sentence above it: "Tell me the moment." Nothing else on the page.
→ INTENT: taps Dinner. Line collapses to "For: Dinner", Where opens with venues for dinner.
→ ACTION: Where, When, Feel, Spend, each one tap. With you: optional, one tap each to add face or a piece (each opens a small inline capture area).
→ RESPONSE: "Resolve the looks" appears. Tapping it prints four stage lines under the brief, each ticking as it completes, and the right column fades in the hero look first, then the two alternates as smaller frames beneath.
→ RESULT: the right column shows the hero at large, with the why and the pieces listed in a tabular block (piece, vendor, price) and the total; the two alternates below as small frames with one line each.
→ NEXT ACTION: "See it on you" swaps the hero frame into the rendering; "Save" adds to Looks; "Buy the pieces" opens the vendor list in the drawer.

## 6. Screen architecture
- Page: two columns above 1024 px: brief 42%, looks 58%. Both fit 100dvh; the looks column scrolls internally only if the pieces list overflows.
- Brief: title line, six brief lines, stage lines, action.
- Looks column: empty state (a single line, "Your three looks will appear here"), building state (frames appear as they resolve), result state, try-on state.
- Drawer: Looks library, Buy list, Share.
- Mobile: the brief is the whole screen with one line open at a time and the rest collapsed to values; after resolve, the looks slide up as a full-height sheet with a handle; the brief remains one swipe below.
- DNA journey: the same brief mechanism with different lines: Face, Fit, Week, Inspiration. Resolve builds the DNA and writes the header.

## 7. Visual language
- Typography: "Geist" for everything (400, 500) with "Geist Mono" 400 for brief values, prices and stage lines. The mono is the personality: values look typed onto an order form. Display line 28 px desktop / 24 px mobile, brief labels 13 px, values 17 px mono, pieces 15 px.
- Type scale: 12, 13, 15, 17, 20, 28, 36.
- Spacing: 8 px base; page gutter 40 px desktop, 20 px mobile; brief line height 56 px collapsed.
- Radii: 6 px everywhere (chips, frames, drawer). One radius.
- Color: paper `#F7F6F2`, ink `#1A1B1E`, secondary `#6A6D72`, rule `#D8D6CF`, and one accent: ink blue `#1F3A93` for the open line, the action and ticks. Selected chip: ink fill with paper text. No green.
- Surfaces: paper only. The brief lines are separated by 1 px rules. The looks frames have a 1 px rule border. No shadows anywhere except the drawer (a 1 px rule and a 24 px paper-tinted shadow).
- Photography: hero 4:5 in a bordered frame; alternates 3:4 small frames.
- Icons: a 1.5 px check for ticks, a chevron for the open line, nothing else.
- Density: 5. Tight but legible.
- Color behavior: dark mode defined (paper `#141517`, ink `#ECEBE6`, rule `#2A2C30`, accent `#8FA7F5`), prototype locks light.

## 8. Motion language
Motion shows cause and effect. Choosing a value collapses the line in 200 ms and opens the next line with a 200 ms height expand. Stage lines appear one by one with a 120 ms fade and the check draws in (stroke) over 240 ms. Looks frames fade and rise 8 px (280 ms) in sequence. Editing a line after results dims the looks to 60% while the short rebuild runs and restores them. Try-on crossfades in the same frame (500 ms). No springs; everything is ease-out and precise. Reduced motion: all fades become cuts.

## 9. Luxury mechanism
Precision. Everything aligned to a strict grid, mono values, a single blue, generous rules. It looks like a bespoke order, which is the fantasy of a personal tailor.

## 10. Immersion mechanism
The page is alive: every tap changes the brief text and, once results exist, changes the looks. The user is composing an order and watching it be fulfilled, not navigating screens.

## 11. Scroll strategy
Desktop: zero scroll, both columns fit the viewport. Mobile: the brief fits one screen; results are a sheet that fits one screen with the pieces list collapsed to a total until tapped.

## 12. Strengths
Fewest taps for returning users. Editing after results is native to the model. Desktop uses the whole width. Strong, distinct identity without decoration.

## 13. Risks
Higher density can read as a form if the type is not handled well. The two-column model needs a deliberate mobile answer (the sheet) or it becomes a scroll. Mono can feel technical rather than luxurious if used beyond values.

## Design system summary
| Token | Value |
|---|---|
| Fonts | Geist 400/500; Geist Mono 400 for values, prices, stages |
| Scale | 12 / 13 / 15 / 17 / 20 / 28 / 36 |
| Spacing | 8 base, 20 mobile gutter, 40 desktop gutter, 56 line height |
| Radii | 6 everywhere |
| Color | paper #F7F6F2, ink #1A1B1E, muted #6A6D72, rule #D8D6CF, accent #1F3A93 |
| Controls | brief lines with inline chips; selected chip ink-filled; one primary action in accent |
| Navigation | none; brief is the nav; two text links; drawer |
| Motion | 200 ms line, 240 ms tick, 280 ms frames, 500 ms try-on crossfade |
| Imagery | bordered 4:5 hero, 3:4 alternates |
| Responsive | 42/58 columns above 1024; single brief with results sheet below |
