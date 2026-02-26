# Praxis Decision Engine — Architecture (IP)

This document describes the intent model, decision architecture, and style reasoning used by Praxis. It serves as the basis for patentable IP and retailer/investor clarity.

## 1. Intent Model

User inputs from the "Style a Moment" flow are converted into a structured **Intent** object:

- **occasion**: Event type (WEDDING, WORK, DINNER, DATE, PARTY)
- **formality**: low | medium | high (derived from occasion and preferences)
- **temperature**: cool | mild | hot (from time of day / context)
- **vibe**: sharp | comfort | relaxed | classic | expressive (from priority)
- **risk**: low | medium | high (appetite for bolder vs safer looks)
- **location**, **when**, **setting**, **budget**, **priority**, **constraints**

The Intent is produced by `flowDataToIntent(flowData)` and is the single input to the Decision Engine.

## 2. Decision Architecture

```
User inputs (flow)
    → Intent (structured)
    → Context engine (location, time, setting)
    → Style reasoning layer (formality, vibe, risk)
    → Outfit matcher (scores library by metadata)
    → Mapping: abstract attributes → 3 outfit IDs (SAFEST, SHARPER, RELAXED)
    → Reasoning generator (per-outfit explanation)
    → Final 3 outputs (mapped to demo library)
```

- **Intent classifier**: Builds Intent from flow; can be extended with AI (GPT/Gemini) later.
- **Mapping engine**: Scores outfit metadata against Intent; selects one outfit per tier (SAFEST, SHARPER, RELAXED).
- **Reasoning engine**: Produces explanation strings (summary, silhouette, color logic, context logic) from Intent + abstract attributes—no hardcoded copy in frontend.

## 3. Style Reasoning Graph

- **Formality** drives which silhouettes and retailer compatibility are allowed.
- **Vibe** (sharp / comfort / relaxed / classic / expressive) aligns with tier and palette.
- **Risk** influences tier choice: low risk → prefer SAFEST; medium → SHARPER.
- **Temperature** (cool/mild/hot) affects fabric_weight and palette in metadata scoring.

Outfit metadata includes: formality, temperature_range, vibe, silhouette, retailer_compatibility, modular_parts (jacket, top, bottom, shoes with placeholder retailer_ids).

## 4. Data Layer

- **Outfit library**: Curated entries with consistent metadata (see `outfitMetadata.ts`).
- **Garment schema**: category, silhouette, fabric_weight, color_family, pattern, occasion_suitability, formality_score (see `decisionEngine.ts`).
- **Modular structure**: Each outfit is jacket / top / bottom / shoes (and optional extras) with inventory placeholder IDs for retailer integration.

## 5. API Contracts

- `POST /api/generate-outfits` — Body: FlowData. Returns: GenerateOutfitsResponse (intent, outfits with reasoning, confidence, score_breakdown, retailer_ids, thinkingSteps).
- `POST /api/generate-outfits-stream` — Same body; `Accept: text/event-stream`. Streams: intent_classified, reasoning_step, analysis_complete, outfit_1..3, done.
- `POST /api/interpret-intent` — Body: FlowData. Returns: { intent }.
- `POST /api/generate-trend-outfits` — Body: flowData, outfits (concepts). Returns: trend-generated image URLs (primary path for demo).
- `POST /api/generate-style-dna` — Body: lifestyle, inspirationPreset, skinToneBucket, contrastLevel. Returns: AI-generated Style DNA copy.
- `POST /api/log-feedback` — Body: FeedbackPayload (event, outfit_id, time_to_decision_ms, etc.).
- `POST /api/analyze-body` — Body: `{ image: base64 }`. Quality gate + body pipeline; returns BodyProfile (kibbe_cluster, measurements, confidence). Rejects with reason + how_to_fix when gate fails.
- `POST /api/analyze-color` — Body: `{ image: base64 }`. Quality gate + face pipeline; returns FaceProfile (color_season, undertone, confidence). Rejects with reason + how_to_fix when gate fails.
- **Biometric session** (optional): `POST /api/biometrics/session/start` (body: user_id, flow) → session_id; `POST .../face`, `.../body` (session_id + image); `POST .../finalize`; `GET .../result?session_id=`. Raw images are not stored; only FaceProfile/BodyProfile kept in memory.
- `GET /api/events/stream?session_id=...` — SSE stream for progressive reasoning (e.g. "Extracting color signals…", "Clustering body lines…").
- `POST /api/generate-outfits-stream` — Body may include optional `biometrics_session_id`; when present, stream includes extra reasoning steps (e.g. "Matching silhouettes to your lines…").

## 6. Retail Readiness

- **Demo mode**: Uses Praxis curated outfits and trend-generated images.
- **Retail mode**: Toggle in Settings; backend prepared for partner inventory (placeholder); same Intent and mapping flow, different data source when wired.

---

*Document version: 1.0. Generated as part of Praxis product layer.*
