# Image Addition — Flow Placement & UX Copy

## Flow 1: Style a moment (high intent, low patience)

- **Placement**: Ask for photos *after* intent capture, *before* final recommendation.
- **Optional**: User can skip; show lower confidence and "Add photos to increase accuracy."
- **Copy**:
  - Screen: "I can recommend now, but 2 quick photos will make this accurate for your body lines and coloring."
  - Primary CTA: "Add photos for precision" | Secondary: "Skip (lower accuracy)"
  - Face: "Face photo (color accuracy)" — "Natural light is best. No filters. No strong shadows."
  - Body: "Full-body photo (fit + silhouette)" — "Stand straight. Against a plain wall if possible."
  - Privacy line: "We extract measurements and delete raw photos unless you choose to save them."

## Flow 2: Build my personal style (onboarding, deeper setup)

- **Placement**: After Style Discovery Questionnaire; before final Style DNA seed.
- **Required**: Photos are mandatory for identity calibration.
- **Copy**:
  - Gate: "Lock in your Style DNA (2 photos)" — "This is what makes Praxis personal. Two photos let me calibrate: your color season (palette) and your body lines (silhouettes)."
  - CTA: "Start calibration"
  - Same face/body capture steps as Flow 1; no skip.

## Tone

- Use **Critical Friend** voice: direct, practical.
- **Avoid** clinical language (e.g. "skeletal geometry extraction").
- **Prefer** e.g. "Stand straight against a wall so I can understand your natural lines."

## Backend

- **Biometric session**: `POST /api/biometrics/session/start` → then `.../face`, `.../body`, `.../finalize`, `GET .../result`.
- **Recommendation stream**: When `biometrics_session_id` is sent with `POST /api/generate-outfits-stream`, SSE includes steps like "Matching silhouettes to your lines…", "Finalizing palette + structure…".
- **SSE for DNA build**: `GET /api/events/stream?session_id=...` for "Extracting color signals…", "Clustering body lines…", etc.
