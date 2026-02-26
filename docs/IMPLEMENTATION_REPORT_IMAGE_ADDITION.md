# Image Addition (PRAXIS) — Implementation Report

Summary of what was **added** or **updated** to implement the IMAGE ADDITION - PRAXIS.docx spec. No frontend flow changes were made; backend and types are in place for the two flows (Style a moment / Build Fashion DNA).

---

## 1. Image quality gate (real logic)

**Updated**
- **`src/lib/imageQualityGate.ts`**
  - Extended `ImageQualityResult` with `reason`: added `channel_correlation_high` and `instruction?: string`.
  - Stub `checkImageQuality()` still used for client; now includes `instruction` for consistency.
  - `getImageQualityMessage()` now prefers `result.instruction` when present (server-side reject copy).

**Added**
- **`src/lib/imageQualityGateServer.ts`** (new)
  - **`checkImageQualityFromBuffer(buffer: Buffer): Promise<ImageQualityResult>`**:
    - Uses **sharp** to decode image and read metadata + raw pixels.
    - **Resolution**: reject if width or height < 200px.
    - **Clipping**: reject if > 5% of pixels at 0 or 255 in any channel.
    - **Channel correlation**: reject if any of R–G, R–B, G–B correlation > 0.9.
    - **Laplacian variance** (blur): reject if < 100.
    - Returns structured reject with `reason` and `instruction` (how_to_fix) per failure.
  - If `sharp` is unavailable, returns `unsupported_format`.

**Dependency**
- **`sharp`** added to `package.json` for server-side image checks.

---

## 2. Face pipeline + color season

**Added**
- **`src/lib/facePipelineService.ts`** (new)
  - **`runFacePipeline(imageBuffer: Buffer): Promise<FaceProfile>`**:
    - Runs `checkImageQualityFromBuffer`; on reject returns `FaceProfile` with `status: 'rejected'`, `confidence: 0`, `reject_reason`, `how_to_fix`.
    - On pass returns placeholder **FaceProfile**: `color_season`, `undertone`, `contrast_ratio`, `hair_cluster`, `eye_cluster`, `skin_lab_mean`, `quality_gates`. Ready for future radiometric calibration + real 12‑season extraction.

**Updated**
- **`api/analyze-color.ts`**
  - Accepts POST body `{ image: base64 }`. Decodes to buffer, calls `runFacePipeline(buffer)`, returns full **FaceProfile** (or legacy stub shape when no image).

---

## 3. Body pipeline + Kibbe cluster

**Added**
- **`src/lib/bodyPipelineService.ts`** (new)
  - **`runBodyPipeline(imageBuffer: Buffer): Promise<BodyProfile>`**:
    - Same quality gate; on pass returns placeholder **BodyProfile**: `kibbe_cluster` (e.g. `{ Natural: 0.78, Classic: 0.22 }`), `measurements` (vertical_ratio, shoulder_angle_deg, curve_score, width_ratio), `confidence`. Ready for future Gemini agentic loop.

**Updated**
- **`api/analyze-body.ts`**
  - Accepts POST body `{ image: base64 }`. Decodes to buffer, calls `runBodyPipeline(buffer)`, returns full **BodyProfile** (or legacy stub when no image).

---

## 4. Biometric session API

**Added**
- **`src/lib/biometricSessionStore.ts`** (new)
  - In-memory session store: **`createSession(userId, flow)`**, **`getSession(sessionId)`**, **`setFaceProfile`** / **`setBodyProfile`**, **`clearSessionRawImages`**, **`pruneSessionsOlderThanMs`**.
  - Sessions hold only `FaceProfile` / `BodyProfile` and status; no raw image buffers persisted (privacy).

- **`api/biometrics/session/start.ts`** — POST `{ user_id, flow }` → returns `session_id`, `face_status`, `body_status`, `created_at`.
- **`api/biometrics/session/face.ts`** — POST `{ session_id, image (base64) }` → runs face pipeline, stores FaceProfile, returns `accepted`, `next: 'body'`, `status`, `confidence`, optional `reject_reason` / `how_to_fix`.
- **`api/biometrics/session/body.ts`** — POST `{ session_id, image (base64) }` → runs body pipeline, stores BodyProfile, returns `accepted`, `next: 'finalize'`, etc.
- **`api/biometrics/session/finalize.ts`** — POST `{ session_id }` → clears any raw refs, returns `face_profile`, `body_profile`, `overall_confidence`.
- **`api/biometrics/session/result.ts`** — GET `?session_id=...` → returns same result payload.

---

## 5. Style DNA integration (identity_core)

**Updated**
- **`src/types/praxis.ts`**
  - **`StyleDNA`**: added optional **`identity_core?: IdentityCore`**.
  - New types: **`FaceProfile`**, **`BodyProfile`**, **`BodyMeasurements`**, **`KibbeCluster`**, **`QualityGateReport`**, **`IdentityCore`** (kibbe, color_season, assessed_date, provisional).

**Added**
- **`src/lib/biometricStyleDnaIntegration.ts`** (new)
  - **`identityCoreFromBiometrics(faceProfile, bodyProfile): IdentityCore`** — builds identity_core; only sets kibbe/color_season when confidence >= 0.7, otherwise marks **provisional**.
  - **`mergeBiometricsIntoStyleDNA(existing, faceProfile, bodyProfile): StyleDNA`** — merges biometric identity_core into existing Style DNA without overwriting primaryStyle/secondaryStyle.
  - **`BIOMETRIC_CONFIDENCE_THRESHOLD = 0.7`** exported.

---

## 6. SSE "thinking" stream

**Updated**
- **`api/generate-outfits-stream.ts`**
  - Request body may include optional **`biometrics_session_id`**. When present, sends extra **reasoning_step** events: "Matching silhouettes to your lines…", "Finalizing palette + structure…" before existing steps.

**Added**
- **`api/events/stream.ts`** (new)
  - GET **`/api/events/stream?session_id=...`** — SSE stream with events: "Extracting color signals…", "Running quality checks…", "Computing season confidence…", "Measuring shoulder geometry…", "Clustering body lines…", "Generating your Style DNA…", then **`biometrics_status`** (face_status, body_status) when session_id given, then **`done`**.

---

## 7. Privacy

**Implemented**
- Raw images are **not stored** in the session store; only FaceProfile/BodyProfile and status.
- Face/body handlers process the buffer in the request and then call **`setFaceProfile`** / **`setBodyProfile`**, which do not persist buffers.
- **`clearSessionRawImages`** used in finalize to clear any refs.
- **`docs/BIOMETRIC_PRIVACY.md`** added: in-memory processing, delete raw after extraction, store only features/measurements.

---

## 8. OpenAPI + flow/UX docs

**Added**
- **`docs/openapi-praxis.yaml`** — OpenAPI 3.0 spec for intent, biometrics session (start, face, body, finalize, result), FaceProfile, BodyProfile, BiometricsResult, QualityGateReport, events/stream, feedback.
- **`docs/IMAGE_ADDITION_FLOWS_AND_UX.md`** — Flow 1 (Style a moment: optional photos, placement, copy) and Flow 2 (Build DNA: required photos, gate copy); Critical Friend tone; backend endpoints and SSE usage.

**Updated**
- **`docs/PRAXIS_ENGINE_ARCHITECTURE.md`** — analyze-body / analyze-color now describe real behavior (body + image, FaceProfile/BodyProfile); added biometric session and events/stream; generate-outfits-stream optional biometrics_session_id.

---

## 9. Tests

**Updated**
- **`src/test/imageQualityGate.test.ts`** — relaxed message assertion; added test for **`getImageQualityMessage`** preferring **`instruction`** when present.

**Added**
- **`src/test/biometricStyleDnaIntegration.test.ts`** — tests for **`identityCoreFromBiometrics`** (provisional when below threshold, full identity when above), **`mergeBiometricsIntoStyleDNA`**, and **`BIOMETRIC_CONFIDENCE_THRESHOLD`**.

---

## 10. Not implemented (future)

- **Inter-ocular distance** check (e.g. < 100px reject): documented in spec; can be added later with face detection.
- **Radiometric calibration** (sclera anchor, learning-based WB) and **real 12‑season** extraction in face pipeline.
- **Gemini agentic Think–Act–Observe** loop for body measurements and Kibbe clustering.
- **Frontend flow changes**: no new screens or step order changes; backend and types ready for Flow 1 (optional photos after intent) and Flow 2 (required photos after questionnaire).
- **Fallback when user skips body**: manual shoulder width, height slider, body confidence questionnaire (documented in IMAGE_ADDITION_FLOWS_AND_UX.md for future).

---

## Quick reference — New/updated files

| Path | Change |
|------|--------|
| `src/lib/imageQualityGate.ts` | Extended result + instruction; getImageQualityMessage prefers instruction |
| `src/lib/imageQualityGateServer.ts` | **New** — server-side quality gate (sharp) |
| `src/lib/facePipelineService.ts` | **New** — face pipeline → FaceProfile |
| `src/lib/bodyPipelineService.ts` | **New** — body pipeline → BodyProfile |
| `src/lib/biometricSessionStore.ts` | **New** — in-memory biometric sessions |
| `src/lib/biometricStyleDnaIntegration.ts` | **New** — identity_core from biometrics, merge into Style DNA |
| `src/types/praxis.ts` | IdentityCore, FaceProfile, BodyProfile, etc.; StyleDNA.identity_core |
| `api/analyze-color.ts` | Uses runFacePipeline, returns FaceProfile |
| `api/analyze-body.ts` | Uses runBodyPipeline, returns BodyProfile |
| `api/biometrics/session/start.ts` | **New** |
| `api/biometrics/session/face.ts` | **New** |
| `api/biometrics/session/body.ts` | **New** |
| `api/biometrics/session/finalize.ts` | **New** |
| `api/biometrics/session/result.ts` | **New** |
| `api/generate-outfits-stream.ts` | Optional biometrics_session_id + extra reasoning_step events |
| `api/events/stream.ts` | **New** — GET SSE for DNA build "thinking" |
| `docs/BIOMETRIC_PRIVACY.md` | **New** |
| `docs/IMAGE_ADDITION_FLOWS_AND_UX.md` | **New** |
| `docs/openapi-praxis.yaml` | **New** |
| `docs/PRAXIS_ENGINE_ARCHITECTURE.md` | Updated API section |
| `src/test/imageQualityGate.test.ts` | New assertion + instruction test |
| `src/test/biometricStyleDnaIntegration.test.ts` | **New** |
| `package.json` | Added **sharp** |

All tests pass (`npm run test`).
