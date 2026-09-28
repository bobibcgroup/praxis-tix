# 04 — Research Docs Audit: Praxis / Practis founder research corpus

Source: `/Users/clawdbob/ClaudeProjects/praxis/Praxis-Docs-Research/` (12 PDFs + 1 DOCX). Text extracted to `scratchpad/docs-text/`.
Extraction notes:
- `Codifying Fashion Styling Rules` and `Fashion Schema Development` PDFs are image-only AND truncated: the files embed only 3 raster images (pages 1-2); pages 3-16 / 3-13 are blank in the PDF itself. Only exec summaries + first section were recoverable.
- `Practis Technical Specification v1.2.pdf` is a 6-page Linear export that ends "Full document available as PDF/DOCX in project files." The `.docx` (47 KB) was skipped per instructions but is probably the fuller spec — worth opening if body/color analysis details are needed.
- Two of the founder docs use "Practis" (ModularCX, Linear, Feb 2026); the functional-requirements doc uses "Praxis". Same product.

---

## 1. Per-document summaries and audit takeaways

### 1.1 Praxis Philosophy (Product Overview & Functional Requirements v1) — FOUNDER, highest authority
Summary: One-page functional spec. Praxis is "an AI-powered personal styling platform designed to help users make better fashion decisions in under one minute." Not a retailer. Two V1 journeys (Style a Moment, Build My Personal Style), a Digital Wardrobe, and retailer integration. V1 scope: Lebanon, men only, 2-3 retailers, ~10k registered / ~1k active.
Takeaways:
- Speed is the headline promise: "better fashion decisions in under one minute." Every screen should be judged against a 60-second clock.
- Style a Moment: "The AI should ask only the minimum number of questions required" → output "three complete outfit recommendations" (Top, Bottom, Shoes, Jacket if applicable; accessories later). "Each recommendation should briefly explain why."
- Wardrobe-first ethic: "prioritize outfits using items the user already owns before recommending additional purchases... build trust by helping users maximize their existing wardrobe rather than encouraging unnecessary spending."
- AI wardrobe ingestion identifies Category, Color, Style, Material (where possible) for Tops/Bottoms/Shoes/Jackets only.
- Per-user objects: personal profile, style profile, digital wardrobe, saved outfits, favorite items, purchase history (future), recommendation history.
- Three placeholders read "(INCLUDED IN THE WEBSITE I SENT YOU)" — the occasion examples, the minimum question set, and what "Build My Personal Style" learns are defined by the live site, not by any doc. The audit must treat the site as the spec for those.

### 1.2 Practis: Project Concept & Problem Statement (Feb 2026, ModularCX) — FOUNDER
Summary: Positioning/market doc. "The AI Stylist for the Modern Man." Men are "underserved," want to "look competent and put-together without the social permission or practical knowledge." Defines target persona, JTBD, product philosophy, market sizing (GCC focus) and why-now (Gemini 3 Flash Agentic Vision).
Takeaways:
- Core insight: "Men don't have a fashion problem. They have a decision problem." Owns 85 items, wears 20%.
- Promise: "Know what to wear. Every day. Without thinking about it." Value props: "Outfit recommendations in 10 seconds," explainable "why," "Zero Judgment."
- Philosophy #1 "Tell, Don't Ask": "No endless options. Direct recommendations with confidence. 'Wear the navy chinos, white oxford, and your brown leather belt. Here's why.'"
- "Masculine Communication" table: replace "This look is giving modern sophistication" with "This projects competence for your industry"; "Add the brown belt and you're done."
- "The Critical Friend": honest, "won't validate poor choices."
- Target "The Considered Man": 25-45, knowledge worker, "put together without appearing vain," "Direct, practical, outcome-focused," WTP $15-50/month. Five barriers: knowledge deficit, decision fatigue, fear of judgment, hostile retail, language gap.

### 1.3 Understanding User Challenges in Getting Dressed and AI Stylist Opportunities
Summary: Secondary research synthesis (Trunk Club survey, Reddit, app reviews of Cladwell/Whering/Acloset). Covers pain points, willingness to pay, current coping strategies, why closet apps churn, AI-trust thresholds, and "hair-on-fire" moments.
Takeaways:
- 65% "overwhelmed" deciding what to wear for a simple dinner; 51% "staring blankly at a full closet"; 46% try on half the wardrobe; 32% not confident in their style; 31% worry others won't like the outfit; 25% have skipped an event because they couldn't decide.
- #1 churn cause is setup: "way too much work to log every item." #2 is bad output: outfits that "don't quite go together." Also early paywalls, no daily habit ("one in every two apps uninstalled within 30 days"), and AI/privacy aversion.
- Trust is context-dependent: fine for brunch, hesitant for interviews/first dates. Remedy: "explain why it chose an outfit or offer a few alternatives."
- Price sensitivity: $10-20/mo ceiling; "we do not need more subscription services"; must "feel like having a personal stylist on demand, not just a digital closet."
- MVP should target hair-on-fire moments: last-minute event, daily morning chaos, confidence crisis ("I won't even leave the house").

### 1.4 Cognitive Symbiosis: UX Design Philosophies for the Agentic AI Stylist — MOST UX-RELEVANT
Summary: Google-ecosystem-centric UX philosophy. Shift from "search-and-retrieve" to "sense-and-style." Defines Cognitive Symbiosis (AI does logistics, human keeps expression), Vibe-First Search, Chain of Style, passive wardrobe ingestion, contextual Awareness layer, proactive "At a Glance," Virtual Mirror, "Critical Friend" persona, Trust Pyramid, and learning-through-rejection.
Takeaways:
- "The user shouldn't have to ask 'What should I wear?' The answer should arrive before the question is formed." Resolve the outfit "during a low-stress window (the night before)."
- "Glass Box" not "Black Box": expose Chain of Style (Constraint → Inventory filter → Aesthetic match → Composition) so the user can "correct the premise."
- "The greatest barrier to adoption... is the 'Data Entry Wall.'" Acquisition "must be near-zero effort" (receipts, pile photo, generative restoration).
- Tone: "Subjective Expertise," not false intimacy. Bad: "You look amazing in this! It's so cute!" Good: "This emerald green complements your warm undertones..."
- Admit uncertainty: "navy or black? If navy, brown belt. If black, black leather."
- Rejection is data: "Is it the silhouette, the color, or the vibe?"
- "The ultimate metric for an AI Stylist is not 'Conversion Rate' or 'Daily Active Users.' It is User Confidence."

### 1.5 Beyond the Screen: The Cognitive Architecture of Multimodal & Agentic Experiences (2025-2030)
Summary: General agentic-UX treatise (not fashion-specific, with a fashion case study). Intent streams replace user flows; OOUX/ORCA as prerequisite for agents; Generative UI; liquid/ambient interfaces; multimodality and latency; RAG citation patterns; proactivity ethics.
Takeaways:
- Five Agentic UI principles: Goal Over Task; Balanced Transparency ("without overwhelming the user with technical logs"); Adaptive User Control (low-risk = delegate, high-risk = confirm); Recoverability & Undo ("Error handling is not an edge case; it is a core state"); Proactive Assistance as Default.
- "High Confidence = Action; Low Confidence = Suggestion" — the guard against the "Clippy problem."
- Search UI: "We no longer need 'Advanced Search' forms with twenty filters. We need a single, expansive input field."
- Latency: optimistic UI, skeleton screens, streaming; ">500ms breaks the illusion of conversation."
- VTO must be labelled "Generated Simulations." Ethics: no feigned empathy, explainability, privacy-favoring defaults.
- OOUX objects for a fashion app: Items, Outfits, Collections (Designers). Design every critical screen as a deep-linkable state.

### 1.6 Cognitive Couture: Architecting the Next Generation of AI Personal Styling Systems
Summary: Architectural blueprint. Three "ground truth" frameworks (Kibbe body architecture, Seasonal Color, Style Archetypes via the Three-Word Method) plus codified Outfit Formulas (Sandwich Method, Rule of Thirds, Wrong Shoe Theory). Layered architecture, cold-start strategies, hybrid recommender (content + knowledge graph + CSP), UX friction and trust, privacy.
Takeaways:
- First-gen closet apps "digitized chaos without resolving it."
- Smart Defaults: "present 3 'Ready-to-Wear' options immediately upon opening, based on the weather and calendar... 'opt-out' rather than 'opt-in' psychology."
- Tiered Complexity: "Hide advanced stats (cost-per-wear, color analysis graphs) in secondary tabs. The primary interface should be purely visual and actionable."
- Kibbe caveat in the doc itself: "even humans struggle to type themselves, and David Kibbe himself advises against automated typing."
- Onboarding without a wall: "Laundry Method" (photograph items as they come out of the wash), video pan of closet, receipt parsing.
- Closing line: "The key to success lies in invisibility — making the data entry invisible, the reasoning transparent, and the choice effortless."

### 1.7 The Cognitive Stylist: Architecture, Taxonomy, and Algorithmic Framework
Summary: Most technical of the research trio. Enclothed Cognition as basis; dual-tier vision (Flash "eyes," Pro "brain"); 4-level garment taxonomy; semantic vibe tags; the Intent Classification Tree Map (Advisory / Functional / Educational / Contextual); Kibbe + 12-season logic; recommendation engine with 8-Point Interest Score and Third Piece Rule; RAG architecture with structured JSON output.
Takeaways:
- Intent tree is the product's "central nervous system": event-driven (interview, date, wedding...), mood/body-driven ("I feel bloated," "I want to feel powerful"), weather-driven, manage/plan/pack, learn ("What is my body type?"), critique ("Does this match?").
- Cold start via "Ghost Wardrobe" (persona-inferred stock items) and "Predictive Basics" ("assumes the presence of universal staples... asks the user to confirm, rather than upload").
- Filter cascade → "Present Top 3 options to the user." Ranking includes Recency (prioritize items not worn recently).
- Probabilistic body typing: "85% Soft Natural." Color Clash flag with a soft fix ("style it away from the face").
- Client is a chat interface + visual closet (React Native). Examples are overwhelmingly womenswear (dresses, heels, "period days").

### 1.8 Practis Technical Specification v1.2 (Feb 2, 2026) — FOUNDER (summary export)
Summary: Strategic decisions (Google Cloud/Vertex; Gemini 3 Flash Agentic Vision; Neuro-Symbolic Hybrid; Style DNA; persona "Bob (Critical Friend)"), the Style DNA schema, Think-Act-Observe vision loop, Google-only stack, SSE streaming events, 4-week PoC roadmap, success metrics.
Takeaways:
- Style DNA = "persistent, evolving representation of a user's complete style identity... single source of truth for personalization." Components: Identity Core, Aesthetic Vectors, Trend Profile, Hard Constraints (incl. "Modest mode"), Contextual Profiles.
- "Chain-of-Style Transparency: Every recommendation includes visible reasoning."
- SSE events (`intent_classified`, `vision_thinking`, `vision_action`, `analysis_complete`) imply the UI streams the AI's thinking during body/color analysis.
- Success metrics: Kibbe 80% expert agreement; color season 75%; outfit latency <5s p95; 5 demo scenarios.
- Cost: agentic Kibbe analysis $0.008 vs human $50-200 — the economic case for "AI stylist for everyone."

### 1.9 Evaluation Framework for the AI Stylist Recommendation Engine
Summary: How to measure "good styling" without historical data. Outfit Quality Score rubric, expert blind review, user metrics (thumbs up/down, CTR, conversion, repeat use, 7/14-day retention), A/B testing, diversity/novelty, hallucination prevention, regression suite.
Takeaways:
- Rubric: Fashion Compatibility, User Preference Alignment, Novelty/Trend, Contextual Correctness, No Hallucinations (item must exist in inventory; advice must match the user's profile).
- Feedback UI is prescribed: "lightweight... thumbs-up or thumbs-down an outfit or item" (Stitch Fix Style Shuffle model). Target ≥70% like rate; CTR ~20%.
- Diversity guard: "no more than 3 of the top 5 suggestions should be of the same item type or the same color scheme"; 20-30% novel suggestions as starting target.
- "Reliability is non-negotiable": hallucination target 0 per 1000; any nonsensical output = failure.
- Short-term proxies lead; retention/revenue validate.

### 1.10 Improving Color Analysis Accuracy ("Engineering Computational Color Analysis")
Summary: Deep engineering treatment of selfie-based 12-season analysis. Diagnoses "silent failure," lighting as "the single point of failure," radiometric calibration via biological gray points (sclera/teeth), CIELAB metrics, Monk Skin Tone adaptive thresholds, a transparent decision cascade, and confidence-aware UX.
Takeaways:
- "Silent failure": a deterministic "You are an Autumn" without confidence signaling erodes trust when it's wrong.
- Mandatory quality gates (inter-ocular >100px, <5% clipping, uniform lighting, sharpness, spectral flatness): "the system must reject it and explain why to the user, guiding them to take a better photo."
- Inclusivity: adaptive thresholds so the system doesn't "lazily default all dark-skinned users to 'Autumn' or 'Winter.'"
- Prescribed UX: "Probabilistic UX" + "hybrid validation": CV should "radically narrow the search space (e.g., 'You are definitely Cool-toned')" then a "Virtual Draping UX" lets the user make the final call.
- Roadmap needs a 500-subject annotated dataset and 4 months — not a V1 accuracy you can promise.

### 1.11 Codifying Fashion Styling Rules ("The Algorithmic Aesthetic") — TRUNCATED (2 of 16 pages)
Summary: Proposes translating stylists' tacit "eye" into testable logic: garments as carriers of visual weight, texture density, formality scores and harmonic potential; pattern-scale compatibility matrix; texture harmony (silk+denim = "high-contrast harmony", linen+wool = "seasonal dissonance"); formality decomposed into structure/sheen/utility; codified "intentional rule-breaking."
Takeaways:
- Engine must distinguish "sophisticated dissonance of high fashion and the incoherence of error" — otherwise "its utility is limited to randomization."
- Visual Weight is "the bedrock": an outfit has a "center of gravity"; top-/bottom-heavy without counterbalance reads as "off."
- Purely backend; nothing here needs UI exposure beyond the explanation text.

### 1.12 Fashion Schema Development ("The Unified Fashion Ontology") — TRUNCATED (2 of 13 pages)
Summary: Argues retrieval quality is bounded by taxonomy precision ("blouse" vs "tops" drift). Synthesizes DeepFashion2, Fashionpedia, Google Product Taxonomy, GS1, Kibbe into a 3-level hierarchy (Super-Category → Category → Sub-Category/Silhouette) plus attributes mapped to visual effects ("V-neck" → "Elongation") and normalization of brand terms ("AIRism") and color names.
Takeaways:
- Schema is "a graph of inherited attributes and visual relationships," not a flat list.
- Retailer integration will need a normalization layer; local retailer catalogs will not arrive in this schema.
- Backend; the only UI consequence is that wardrobe item labels shown to users should be plain-language, not schema leaves.

### 1.13 Praxis_Technical_Specification_v1.2.docx — SKIPPED (PDF of same name exists). Likely the full spec behind 1.8.

---

## 2. Product thesis (founder's own words where possible)

- What Praxis believes it is: "the user's personal stylist" — "not a fashion retailer and not another online store" — that combines "AI, personal preferences, body characteristics, existing wardrobe, and retailer inventory into one intelligent recommendation engine." Technical framing: "a cognitive prosthetic that handles styling complexity while teaching transferable knowledge."
- Core problem: "Men don't have a fashion problem. They have a decision problem." "Millions of men who want to dress well but lack the knowledge, time, or confidence." Symptoms: 85 items / 20% worn; 26 hours/year in decision paralysis; $1,800/yr "Style Tax."
- Target user: "The Considered Man" — 25-45, knowledge worker/manager/entrepreneur, "owns decent clothes, underutilizes them," wants to be "put together without appearing vain," "direct, practical, outcome-focused." V1: men, Lebanon; strategic market: GCC.
- Intended aha moment (composited from the docs): the user states an occasion, answers the bare minimum, and within seconds sees three complete, wearable outfits — built first from clothes he already owns — each with a one-line reason that teaches him something ("These colors work with your skin tone — here's why"). Cognitive Symbiosis adds a second aha for wardrobe: seeing "a beautiful, curated gallery of their own items without having snapped a single photo."
- Intended primary journey: Style a Moment (occasion → minimal questions → 3 outfits with why → save/favorite → optionally buy the missing piece from a partner retailer). Secondary/permanent: Build My Personal Style (Style DNA: body, color, archetype, preferences) and Digital Wardrobe upload, which then "become part of every recommendation."
- Emotional promise: "Know what to wear. Every day. Without thinking about it." "Getting dressed is a moment of confidence, not stress." "Zero Judgment: AI doesn't raise eyebrows at basic questions." Success is "User Confidence," not conversion.
- Business objective (dual): "increase user confidence while helping retailers improve conversion and customer experience."

---

## 3. User pain points, ranked by emphasis across the corpus

1. Decision fatigue / choice overload — every doc. "Wardrobe paralysis," "750+ combinations," 65% overwhelmed for a dinner out, 51% stare blankly. The problem statement itself is "a decision problem."
2. Low confidence and fear of judgment — Concept (barrier #3), User Challenges (32%/31%, "won't even leave the house"), Symbiosis (metric = confidence), Cognitive Stylist (Enclothed Cognition, "I want to feel powerful").
3. Wardrobe under-use / "nothing to wear" with a full closet — 20/80 rule cited in five docs; 62% of purchases rarely worn; sustainability nudges; "Shop Your Closet."
4. Knowledge deficit / language gap — Concept barriers #1 and #5 ("Only 13% can explain their body type"; fashion vocabulary "excludes men"); Cognitive Couture "Keyword Gap"; education-through-use.
5. Occasion / dress-code uncertainty — hair-on-fire events (interview, date, client dinner, wedding), 25% skipped an event; the Intent Tree's largest branch is event-driven.
6. Time pressure (morning chaos) — "under one minute," "10 seconds," 4.5 min/day, "rushing and making choices [she's] not happy with."
7. Fit / body — Kibbe silhouettes, "That blazer's shoulders are too structured for your body type," bloating/comfort intents, body change ("old staples don't fit anymore"). Emphasized in the technical docs more than the user-research doc.
8. Color — Seasonal analysis is a pillar of Style DNA and has its own doc; user-research doc barely mentions it. Strong in the founder's framework, weak as a stated user pain.
9. Buying wrong / wasteful purchases — "Style Tax," wrong-size returns, "What blazer should I buy?" JTBD; hostile retail (barrier #4).
10. Weather / commute practicality — Symbiosis and Cognitive Stylist treat it as a hard constraint (Clo value, puddle risk); users list weather as a top morning input.
11. Packing / trip planning — a JTBD ("minimum for a 5-day trip") and Intent Tree branch; low emphasis elsewhere.
12. Privacy / AI aversion — noted once (some users want apps that "DON'T use AI"); technical docs answer with on-device inference and embeddings-only storage.

Adoption-blocking pains (about the app, not dressing), in order: setup effort (wardrobe logging), bad/gimmicky suggestions, early paywalls, no daily habit, price ("no more subscriptions").

---

## 4. UX principles the docs prescribe for an agentic stylist

Interaction model
- Tell, don't ask. Direct, confident recommendation with a one-line why. "No endless options." (Concept) Reconciled with V1's "three complete outfits" and the engine's "Top 3": three is the cap, and a hero pick is implied.
- Minimum questions. "Ask only the minimum number of questions required." (Praxis Philosophy) Infer from context (weather, calendar, past outfits) before asking. (Symbiosis, Couture)
- Smart defaults, opt-out not opt-in. Show 3 ready-to-wear options immediately on open, before any input. (Couture)
- Goal over task; one expansive input. Accept narrative intent ("dinner with investors, rainy, want to look sharp not stiff") rather than category filters or twenty dropdowns. (Beyond the Screen, Symbiosis "Vibe-First Search")
- Proactive by default, gated by confidence. Anticipate (night-before nudge for tomorrow's event). "High Confidence = Action; Low Confidence = Suggestion." Avoid the Clippy problem. (Beyond the Screen, Symbiosis)

Trust and explanation
- Glass box, balanced. Every recommendation carries a visible reason (Chain-of-Style), but "without overwhelming the user with technical logs." Reasoning is optionally expandable, not the default view. (Symbiosis, Beyond the Screen, Tech Spec)
- Trust Pyramid: Accuracy → Transparency ("I chose this because") → Controllability ("swap the shoes if you prefer comfort") → Empathy (reference the user's own history). (Symbiosis)
- Admit uncertainty; never silently fail. Ask a clarifying question when ambiguous (navy vs black); show confidence ("85% Soft Natural," "definitely Cool-toned") and let the user confirm via virtual draping. (Symbiosis, Color doc, Cognitive Stylist)
- Grounded only. Never recommend an item that doesn't exist in the wardrobe/catalog; cite sources for advice (citation chip). (Evaluation, Beyond the Screen)
- Label generated imagery as simulation. (Beyond the Screen)

Voice and persona
- "The Critical Friend" / "Bob": honest, "warm but honest," will say the blazer is wrong for your shoulders. No false intimacy ("I love this!"), no feigned emotion, "Subjective Expertise." (Concept, Symbiosis, Tech Spec)
- Masculine, outcome-focused language: "This projects competence for your industry." "Add the brown belt and you're done." (Concept)
- Zero judgment for basic questions. (Concept)

Input and wardrobe
- Multimodal input: photo of an item, screenshot of an influencer, selfie + garment "Vibe Check," video; text is not the only door. (Symbiosis, Couture, Beyond the Screen)
- Invisible / passive ingestion: receipts, pile photo, video pan, "Laundry Method," Predictive Basics ("confirm, don't upload"), Ghost Wardrobe. Never demand the full closet up front. (Symbiosis, Couture, Cognitive Stylist)
- Forgive bad photos; restore them; reject unusable selfies with a specific reason and guidance. (Symbiosis, Color doc)
- Wardrobe as editorial catalog, not spreadsheet or chaotic grid; dynamic clustering by occasion; surface forgotten items. (Symbiosis)

Learning and feedback
- One-tap thumbs up/down on every outfit and item; the feedback loop is a product feature, not analytics. (Evaluation)
- Learning through rejection: a "No" triggers a 3-option repair ("silhouette, color, or vibe?") and updates the profile. (Symbiosis)
- Memory: Style DNA persists and drifts with acceptance; contextual profiles (work/weekend/evening); "you've rated this suit highly for confidence." (Tech Spec, Symbiosis)
- Novelty budget: ~20-30% of suggestions should stretch the user, within his taste range; enforce diversity across the three outfits. (Evaluation)

Structure and performance
- Tiered complexity / progressive disclosure: primary surface "purely visual and actionable"; stats, color graphs, Kibbe detail in secondary tabs. (Couture)
- OOUX: model Items, Outfits, Collections/Occasions, Profile as first-class objects, each deep-linkable. (Beyond the Screen)
- Latency: <5s p95 for outfits (Tech Spec); stream reasoning/skeletons so the wait feels alive (Beyond the Screen, SSE events).
- Recoverability: undo/swap/regenerate is a core state, not an edge case. (Beyond the Screen)
- Privacy-forward defaults: body/selfie processing on-device where possible; store embeddings not raw photos. (Couture, Symbiosis)

---

## 5. Intended system capabilities — user-visible vs backend

| Capability | Source | User-visible surface | Backend |
|---|---|---|---|
| Style a Moment (occasion → 3 outfits + why) | Praxis Phil., Concept | Yes — the primary journey | Intent classification, CSP filter cascade, CoT prompt, structured JSON |
| Build My Personal Style / Style DNA | Praxis Phil., Tech Spec | Onboarding questionnaire; profile page | Identity Core, Aesthetic Vectors (-1..+1), Trend Profile, Hard Constraints, Contextual Profiles |
| Kibbe body analysis (5 families / 13 types) | Tech Spec, Couture, Cog. Stylist | Full-body photo capture; result shown as type + confidence (docs) | Gemini 3 Flash Agentic Vision Think-Act-Observe loop, shoulder geometry, vertical line |
| Seasonal color analysis (12 seasons) | Tech Spec, Color doc | Selfie capture with quality gates; season + palette; virtual draping to confirm | White balance via sclera, CIELAB, Monk-scale thresholds, decision cascade |
| Style archetypes / Three-Word Method | Couture, Tech Spec | Persona pick or "Style Workshop" from saved images | Archetype vectors feed weighting (e.g., Wrong Shoe rule for "Creative") |
| Digital Wardrobe | Praxis Phil., all research | Upload/photo items; catalog view; saved/favorite outfits | Segmentation, attribute extraction (category/color/style/material), embeddings in pgvector, 4-level taxonomy, vibe tags |
| Passive ingestion (receipts, video pan, Ghost Wardrobe, Predictive Basics) | Symbiosis, Couture, Cog. Stylist | Confirm-not-upload lists; "we found 14 items" | Document AI / email parsing, object tracking, generative fill |
| Outfit engine rules (Outfit Formulas, 8-Point Interest Score, Third Piece, Sandwich, Rule of Thirds, visual weight, texture/pattern harmony) | Cog. Stylist, Couture, Codifying | Only as explanation text ("balanced with a third piece") | Scoring and ranking |
| Wardrobe-first prioritization + retailer gap-fill | Praxis Phil. | Owned items shown first; "missing piece" links to partner retailer | Inventory joins, schema normalization |
| Context awareness (weather, venue vibe, commute, calendar) | Symbiosis, Cog. Stylist | Weather chip; event-linked suggestions; night-before nudge | Awareness/Maps/Calendar APIs, Clo thermal model |
| Chain-of-Style reasoning / streaming | Tech Spec, Symbiosis | Expandable "why"; live "analyzing shoulder geometry" progress | SSE events |
| Feedback loop (thumbs, rejection repair) | Evaluation, Symbiosis | Thumbs up/down; "what's off?" chips | Profile updates, RLHF-style tuning, A/B infra |
| Virtual try-on / Digital Twin / Vibe Check | Symbiosis, Couture, Beyond | "Mirror Mode" renders, labeled as simulation | TryOnDiffusion / IDM-VTON, NeRF twin, on-device edits |
| Planning / packing / utilization ("not worn in 6 months") | Cog. Stylist, Symbiosis | Trip planner; cost-per-wear; forgotten-items nudge | Calendar + weather + history queries |
| Critique ("Does this match?") | Cog. Stylist | Photo → verdict | Critique Agent |
| Evaluation & quality gates | Evaluation, Color doc | Photo rejection messages only | Expert review, hallucination log, regression suite, diversity metrics |

V1 per the founder: only rows 1, 2, 6 (upload only, four categories), 9 and a "briefly explain why" slice of 11 are in scope. Everything else is research vision.

---

## 6. Terminology glossary

| Term | Definition in the docs | Expose to users? (audit view) |
|---|---|---|
| Praxis / Practis | Product name; "Praxis" in functional spec, "Practis" in ModularCX docs | One name only |
| Style a Moment | V1 journey: dress for a specific occasion with minimal questions → 3 outfits | Yes — plain, action-oriented |
| Build My Personal Style | V1 journey: create the "permanent styling profile" | Yes |
| Digital Wardrobe | User-uploaded owned items the AI identifies and reuses in every recommendation; "core differentiator" | Yes (or "My Wardrobe") |
| Style DNA | "Persistent, evolving representation of a user's complete style identity... single source of truth for personalization" | Marketing-friendly; fine as a label if its parts stay hidden |
| Identity Core | Style DNA component: Kibbe type, Color Season, Archetypes; set at onboarding + periodic reassessment | No — internal |
| Aesthetic Vectors | Numeric preferences (-1 to +1) that drift with outfit acceptance | No |
| Trend Profile | Adoption timing and engaged trends, synced from "AI Fashionista" (undefined elsewhere) | No |
| Hard Constraints | Explicit settings: "Modest mode," avoid colors/fabrics | Yes, as settings |
| Contextual Profiles | Work/weekend/evening modifiers learned from usage | Maybe, as "modes" |
| Kibbe (body type system) | Yin/Yang bone-structure framework; 5 families (Dramatic, Natural, Classic, Gamine, Romantic), 13 types; dictates silhouettes | Show consequences ("structured shoulders suit you"), not the label |
| Seasonal Color Analysis / color season | 12-season classification by undertone, value, chroma; drives palette | Palette yes; season name optional with confidence |
| Style Archetype / Three-Word Method | Psychological "vibe" of the user: Practical + Aspirational + Emotional words | Yes, in the user's own words |
| Cognitive Symbiosis | Design state where "AI handles the logistical and computational heavy lifting... freeing the user to focus purely on the creative and expressive aspects" | No — internal philosophy |
| Cognitive prosthetic | Concept doc's framing of the product | No |
| Chain of Style / Chain-of-Style Transparency | Exposed sequential reasoning: constraints → inventory filter → aesthetic match → composition | Yes, as "Why this works" (collapsed) |
| Glass Box (vs Black Box) | Recommendations show their reasoning | No (principle) |
| The Critical Friend / Bob | Recommendation persona: "warm but honest," won't validate poor choices | Persona voice yes; name "Bob" is a decision |
| Vibe-First Search | Prompt for narrative intent instead of category filters | No (pattern) |
| Passive Ingestion / Invisible Wardrobe Management | Building the closet from receipts, photos, video with near-zero effort | No (pattern) |
| Data Entry Wall / Cold Start | The onboarding friction of digitizing a wardrobe | No |
| Ghost Wardrobe / Predictive Basics | Persona-inferred stock items; assumed staples the user confirms | No; the UI just says "Do you own these?" |
| Laundry Method | Photograph items as they are worn/washed to digitize gradually | No |
| Vibe Check | Low-fidelity selfie + garment composite preview | Possibly, as a feature name |
| Mirror Mode / Virtual Mirror / Digital Twin | Generative try-on on a photoreal representation of the user | Feature name if ever built |
| Outfit Formula | Slot template (Top + Bottom + Shoe + Third Piece) the engine fills | No |
| 8-Point Rule / Interest Score | 1 pt basics, 2 pts statement; target 6-8; <5 too simple, 9+ too busy | No; surface as "balanced" |
| Third Piece Rule | A finished look needs a third garment/accessory beyond top and bottom | Explanation text only |
| Sandwich Method / Rule of Thirds / Wrong Shoe Theory | Color bookending; 1/3-2/3 proportion; deliberate formality mismatch | Explanation text only |
| Enclothed Cognition | Clothing's symbolic meaning changes the wearer's cognition ("power" silhouettes) | No |
| Intent Classification Tree Map | Routing taxonomy: Advisory / Functional / Educational / Contextual | No; shapes the prompt chips |
| Think-Act-Observe / Agentic Vision | Gemini 3 Flash loop that crops/measures to refine body analysis | No; drives progress messages |
| Neuro-Symbolic Hybrid | Neural perception + symbolic (rule/CSP) reasoning | No |
| Outfit Quality Score | Evaluation rubric: compatibility, preference alignment, novelty, context, no hallucination | No |
| Silent failure | A confident wrong classification with no uncertainty signal | No; design against it |
| Trust Pyramid | Accuracy → Transparency → Controllability → Empathy | No (principle) |
| Style Tax | $1,800/yr cost of unworn purchases, returns, shopping time | Marketing only |
| The Considered Man | Target persona | Marketing only |

---

## 7. Gaps and tensions

Vision vs V1 scope
- The research trio assumes a Google/Pixel ecosystem (At a Glance widget, Gmail receipts, Maps vibe data, Circle to Search, NeRF digital twin, YouTube overlays). The founder's V1 is a web product in Lebanon with 2-3 retailers. Almost every "invisible ingestion" technique the docs rely on to beat the Data Entry Wall is unavailable in V1, yet the docs name that wall the #1 churn cause. V1 has only manual upload of four categories.
- Cognitive Stylist and Couture are written for womenswear (dresses, heels, "bloated / period days," wrap dresses, floral prints). V1 is men only. The taxonomy, Kibbe examples and outfit formulas need a menswear pass; "Wrong Shoe Theory" and Romantic-type advice will read as noise to "The Considered Man."
- Concept doc targets GCC and English-speaking SAM; Praxis Philosophy launches in Lebanon (not GCC). Arabic/French UI is never mentioned.

Speed vs depth
- "Under one minute" / "outfit in 10 seconds" vs a Style DNA onboarding that wants a full-body photo in fitted clothing, a quality-gated selfie (with rejection loops), a questionnaire, and wardrobe upload before personalization is meaningful. The docs never say which comes first. Cognitive Couture's own answer (smart defaults first, profile later) is the reconciliation the site needs.
- Chain-of-Style "visible reasoning" and SSE "vision_thinking" streams push toward showing the machine think; Beyond the Screen warns against "technical logs"; Praxis Philosophy wants only a brief why. A low-scroll product should default to one line and hide the chain.

Tell vs choose
- "Tell, Don't Ask... No endless options... 'Wear the navy chinos'" (Concept) vs three full outfits (Praxis Philosophy, engine Top 3). Three is defensible (users want alternatives to trust AI), but without a ranked hero pick the page reverts to browsing.
- Tell-don't-ask also collides with "Adaptive User Control" and the Trust Pyramid's Controllability level: the docs want swaps, undo and repair loops, which add UI.

Frameworks vs the audience
- Kibbe: the docs concede humans and Kibbe himself distrust automated typing; the spec targets only 80% expert agreement; Kibbe originates in womenswear. Telling a "direct, practical" man he is a "Soft Natural" contradicts Masculine Communication. Same for "Deep Autumn." The Concept's own language ("These colors work with your skin tone — here's why") is the right exposure level.
- Color analysis doc demands rejection gates, Monk-scale calibration, a 500-subject dataset and virtual draping before results are trustworthy; the Tech Spec's PoC schedules body+color analysis in weeks 2-3. Any confident season label in V1 is exactly the "silent failure" the color doc warns against.

Business model vs product ethic
- Symbiosis: success metric is "User Confidence," "not Conversion Rate or DAU." Praxis Philosophy: objective includes "helping retailers improve conversion." Evaluation Framework: CTR and conversion are core KPIs. Wardrobe-first ("before recommending additional purchases") is the stated ethic, but retailer conversion is the stated revenue. The UI has to decide how loudly the "buy the missing piece" CTA speaks.
- Monetization: Concept says $15-50/month; user research says $10-20 ceiling and "we do not need more subscription services"; retailer integration implies B2B2C/affiliate. No doc resolves it.

Persona and voice
- "Bob (Critical Friend), warm but honest" (Tech Spec) vs Symbiosis' selectable personas ("Direct & Editorial" to "Warm & Supportive") vs Concept's fixed masculine, direct register. Beyond the Screen forbids feigned empathy while Symbiosis places "Empathy" at the top of the Trust Pyramid ("I know you're nervous about the presentation"). Resolve: empathy via remembered facts, not feelings.
- Chat-first client (Cognitive Stylist: "chat interface for Intent Classification") vs "purely visual and actionable" primary surface (Couture) vs structured two-journey site (Praxis Philosophy). The docs never choose; the site must.

Proactivity
- Night-before nudges, calendar reading and ambient notifications are central to Symbiosis/Beyond the Screen but impossible without a native app, permissions and calendar access — none in V1. Proactivity in V1 can only be "smart defaults on open."

Internal inconsistencies
- Name: Praxis vs Practis. Persona name "Bob" appears only in the Tech Spec.
- Model: Symbiosis and Couture cite Gemini 1.5 Pro / "Gemini 3 Pro and Flash 3"; Tech Spec commits to Gemini 3 Flash only.
- Accessories: Praxis Philosophy defers accessories to "future versions," but the Third Piece Rule and 8-Point Rule depend on them; the Concept's example ("add the brown belt") is an accessory.
- "AI Fashionista" (Trend Profile sync source) is referenced but defined nowhere in the corpus.
- Cognitive Stylist's client is React Native mobile; Praxis Philosophy references "the website." Platform is unspecified.

---

## 8. Five questions the founder should answer

1. North star for V1: is Praxis a consumer product measured by confidence/return usage, or a retailer conversion channel measured by CTR and attributed sales? This decides how prominent "buy" is on the outfit card and whether wardrobe-first is a rule or a preference.
2. Time-to-first-outfit: what is the acceptable path before the first recommendation — occasion + 2-3 questions with no photos (progressive profiling later), or must body/color/wardrobe capture come first? Related: is body-photo analysis a V1 promise at all, given the accuracy caveats in your own docs?
3. Framework exposure: should users ever see the labels ("Kibbe Soft Natural," "Deep Autumn," "Style DNA," "Identity Core"), or only the consequences in plain masculine language? How much of Chain-of-Style is shown by default — one line, or the full chain?
4. Target and market: is V1 truly men-only Lebanon (Praxis Philosophy) or the GCC "Considered Man" (Concept)? Are women a roadmap item that the taxonomy and copy must not preclude? Which languages?
5. Platform and wardrobe seeding: web app vs native mobile (proactive notifications, camera flows, on-device privacy all assume native). With no Gmail-receipt ingestion in Lebanon, is the realistic cold-start "confirm the staples you own" plus partner-retailer purchase history, and are the 2-3 retailers already signed?

Also worth settling: the single product name (Praxis vs Practis), whether "Bob" is user-facing, price/monetization ($15-50 vs $10-20 vs retailer-funded), and what exactly "the website I sent you" specifies for occasions, the minimum question set, and the Build My Style inputs — since the functional spec defers all three to it.
