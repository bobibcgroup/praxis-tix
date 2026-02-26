# Testing the New Implementations (Main targets v2)

How to manually and automatically test the features added in the Main targets (1) update.

---

## 1. Run the app locally

**Frontend only (no API routes):**
```bash
npm run dev
```
Open http://localhost:8080. The UI will work; API calls go to your deployed backend (Vercel) unless you set `VITE_API_BASE` or run the full stack below.

**Full stack (frontend + API routes):**
```bash
npx vercel dev
```
Or install Vercel CLI once: `npm i -g vercel` then `vercel dev`.  
This runs the Vite app and the `api/` serverless functions locally. Use the URL Vercel prints (e.g. http://localhost:3000).

**Env for AI/trend features:**  
Create `.env.local` with:
```
VITE_GEMINI_API_KEY=your_key
# or set GEMINI_API_KEY for server-side (generate-outfits, interpret-intent, generate-style-dna)
```

**Production (Vercel):** Set `GEMINI_API_KEY` (or `VITE_GEMINI_API_KEY`) in your project's **Environment Variables** in the [Vercel dashboard](https://vercel.com/dashboard) (Project → Settings → Environment Variables). Without it, `/api/generate-trend-outfits` returns 500 and the app falls back to library images.

---

## 2. Manual UI testing

### Intent + Score breakdown + Granular confidence

1. Go to **Style a Moment** (quick or personal flow).
2. Pick **occasion** (e.g. Date), **context** (location, time, setting), **preferences** (budget, priority).
3. Submit to get outfit recommendations.
4. **Check:**
   - **Intent:** Backend now includes `domain` (e.g. `advisory`) and optionally `psychological_goal` / `mood` when using AI (Gemini key set).
   - **Outfit cards:** Each card shows **Praxis confidence: X%** and, when score breakdown exists, **Event X% · Vibe X% · Color X%**.
   - **“Why this works”** (expand): You should see a **Score:** line with Event, Color, Vibe, Weather percentages.

### Style DNA drift

1. Complete the **personal** flow through to **Style DNA** (inspiration, wardrobe, etc.).
2. Save your profile (sign in and save).
3. **Check:** In Supabase (or network tab), `style_dna` in `profiles` should have `version` and `updatedAt` when the drift helper ran (profile save merges with existing via `applyStyleDNAWithDrift`).

### Log feedback (evaluation)

- Use the app as normal; when you have a **log-feedback** client call (e.g. on outfit shown/accepted/rejected), the API is `POST /api/log-feedback`. You can add a temporary button or rely on any existing event logging that you wire to this endpoint.

---

## 3. API testing (curl)

Run these with the app (and API) running locally, e.g. `npx vercel dev`, or against your deployed base URL. Replace `BASE` with `http://localhost:3000` or `https://your-app.vercel.app`.

**FlowData body (reused):**
```json
{
  "occasion": { "event": "DATE" },
  "context": { "location": "RESTAURANT", "when": "NIGHT", "setting": "INDOOR" },
  "preferences": { "budget": "MID_RANGE", "priority": "SHARP" }
}
```

### Generate outfits (score_breakdown + retailer_ids)

```bash
curl -s -X POST "$BASE/api/generate-outfits" \
  -H "Content-Type: application/json" \
  -d '{"occasion":{"event":"DATE"},"context":{"location":"RESTAURANT","when":"NIGHT","setting":"INDOOR"},"preferences":{"budget":"MID_RANGE","priority":"SHARP"}}' \
  | jq '.outfits[0] | {confidence, score_breakdown, retailer_ids}'
```

Expect `confidence`, `score_breakdown` (event_appropriateness, color_harmony, etc.), and `retailer_ids` on each outfit.

### Interpret intent (domain + psychological_goal)

```bash
curl -s -X POST "$BASE/api/interpret-intent" \
  -H "Content-Type: application/json" \
  -d '{"occasion":{"event":"DATE"},"context":{},"preferences":{"priority":"SHARP"}}' \
  | jq '.intent | {domain, occasion, psychological_goal, mood}'
```

With no Gemini key you get rule-based intent with `domain: "advisory"`. With `GEMINI_API_KEY` set you may get AI-filled `psychological_goal` and `mood`.

### Log feedback

```bash
curl -s -X POST "$BASE/api/log-feedback" \
  -H "Content-Type: application/json" \
  -d '{"event":"outfit_accepted","outfit_id":1,"time_to_decision_ms":5000}' \
  | jq .
```

Expect `{"success":true}`.

### Analyze body / analyze color (stubs)

```bash
curl -s -X POST "$BASE/api/analyze-body" -H "Content-Type: application/json" -d '{}' | jq .
curl -s -X POST "$BASE/api/analyze-color" -H "Content-Type: application/json" -d '{}' | jq .
```

Expect `status: "low_confidence"`, `reason: "insufficient_resolution"`, and a `message` string.

### SSE streaming (generate-outfits-stream)

```bash
curl -s -N -X POST "$BASE/api/generate-outfits-stream" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"occasion":{"event":"DATE"},"context":{},"preferences":{}}'
```

You should see SSE lines: `event: reasoning_step`, `event: intent_classified`, `event: analysis_complete`, `event: outfit_1`, `outfit_2`, `outfit_3`, then `event: done` with full JSON payload.

---

## 4. Unit tests (Vitest)

Run once:
```bash
npm run test
```

Watch mode:
```bash
npm run test:watch
```

Existing tests: `src/test/example.test.ts`. Added: `src/test/styleDnaDrift.test.ts` and `src/test/imageQualityGate.test.ts` to test drift helpers and image quality stub (see below). For the decision engine (mapping, intent), you can add tests in `src/lib/decisionEngine/*.test.ts` that call `flowDataToIntent`, `mapIntentToOutfitIds`, etc., with fixed `FlowData` and assert on `score_breakdown` and `retailer_ids`.

---

## 5. Quick checklist

| Feature | How to verify |
|--------|----------------|
| Intent domain / psychological_goal | Run flow → check network response for `/api/generate-outfits` or call `/api/interpret-intent`; see `intent.domain`, `intent.psychological_goal`. |
| Score breakdown + retailer_ids | Same response: `outfits[].score_breakdown`, `outfits[].retailer_ids`. |
| Granular confidence UI | Outfit cards show Event% · Vibe% · Color%; expand “Why this works” for full score line. |
| log-feedback | `POST /api/log-feedback` with `event`, optional `outfit_id`, `time_to_decision_ms` → 200 + `{ success: true }`. |
| Style DNA drift | Save profile with Style DNA → check stored object has `version` and `updatedAt`. |
| interpret-intent API | `POST /api/interpret-intent` with FlowData → `{ intent }`. |
| analyze-body / analyze-color | POST to each → `status: "low_confidence"`, `reason: "insufficient_resolution"`. |
| SSE stream | `POST /api/generate-outfits-stream` with `Accept: text/event-stream` → streamed events then `done`. |
| Image quality gate | Unit test or call code: `checkImageQuality("")` returns `ok: false`, `reason: "insufficient_resolution"`. |
