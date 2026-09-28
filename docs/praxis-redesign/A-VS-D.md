# Concept A versus Concept D, after the same fixes

Both prototypes now carry the same brand (Forest and Bone, Hairline), the same display face (Source Serif 4 at 600), light by default with dark available, permanent orientation on arrival, three thumbnails always visible on results, a completion state with "Style another moment", a "New moment" link during a journey, and a pinned primary action verified inside the viewport at 1440x900, 1920x1080, 2000x1120, 1280x720, 390x844 and 375x667. Screenshots for both, at the same states, are in `concepts/shots/compare/` (files prefixed A- and D-).

Open both: `/__design/a` and `/__design/d` on the dev server.

## What differs

| | A: Stage | D: Atelier |
|---|---|---|
| How you answer | One question per screen, large, with the answers as a stacked list. Tap and it advances. | Six lines on one page. Tap a line, choose inline, the next line opens. |
| How you know where you are | A progress spine naming the steps (Occasion, Room, Feel, You, Looks) plus "3 of 6" under the question | All six lines visible at once with their values, plus "n of 5 answered" |
| Changing an answer | Tap a step name in the spine; that question returns | Tap the line; it reopens in place and the looks rebuild |
| The print while answering | Reacts to every answer and fills the screen | Reacts to every answer, shares the screen with the brief |
| Mobile while answering | Print band 40%, one question with five answers, no scroll | Print band 38%, six lines with the open one expanded, fits at 390 with no scroll, scrolls at 375 |
| Taps to results | 6 (occasion, venue, time, feel, spend, build) plus optional You | 6 (five lines plus build) plus optional With you |
| Returning user with DNA | Occasion chips on the home, then venue, then build: 3 taps | Feel and spend pre-filled, When from the clock: For, Where, build: 3 taps |
| Reading | Calm. One thing at a time. | Dense. Everything at once. |
| Feel | A guided lookbook | A tailor's order form that fills itself in |

## Where each one is stronger

A is stronger for the first visit and for the phone. Each screen has one job, the type can be large, and there is nothing to scan. The spine answers "where am I" without reading.

D is stronger for editing and for the returning user. Every answer is visible and reopenable in place, and the page never changes shape. On a desktop it uses the width; on a phone it is a list.

## What is unresolved in both

- Try-on is the stand-in with a different crop; the DNA result is sample tones. Both wait on real pipelines.
- The Dinner mood image is the same file as the Dinner "sharper" look, so one preview swap shows no change.
- A: results at 375x667 scroll the column by a few pixels; "New moment" lives in the menu on mobile.
- D: the welcome headline breaks to three lines at 1440; a DNA user with a line open at 1440x900 scrolls the body slightly.

## Recommendation

Choose by the audience's first minute. If the man arriving is new and on a phone, A. If he is returning and adjusting, D. Given V1 is an acquisition product with most first visits on mobile, A is the safer first release, with D's in-place editing added to A's results screen later (the brief-as-a-line idea from the earlier recommendation).
