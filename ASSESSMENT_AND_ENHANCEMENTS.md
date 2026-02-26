# Praxis Tix – Assessment & Enhancement List

**Date:** Feb 26, 2025  
**Scope:** Full codebase after removing docs, test scripts, and temporary/debug code.

---

## 1. What Was Removed

| Category | Removed |
|----------|--------|
| **Docs** | Entire `docs/` folder (BIOMETRIC_PRIVACY, ENGINE_AND_TREND_ALGORITHM, IMAGE_ADDITION_*, IMPLEMENTATION_REPORT_*, openapi-praxis.yaml, PRAXIS_ENGINE_ARCHITECTURE, TESTING_*, TROUBLESHOOTING, DNA_CARD_AND_FLOW_REVAMP) |
| **Root** | `IMAGE ADDITION - PRAXIS.docx`, `test-app.js` (standalone route/API test script) |
| **Tests** | `src/test/example.test.ts` (example test only) |
| **Debug/temp** | `src/lib/testHistory.ts`, `src/lib/debugHistory.ts`, `src/lib/cleanupUserData.ts`, `src/lib/diagnoseHistory.ts`; all debug imports and window.* exposure from `main.tsx`; window.* exposure from `migrateLocalStorage.ts`; debug `useEffect` log in `Flow.tsx` |

**Kept:** Vitest config, `src/test/setup.ts`, `imageQualityGate.test.ts`, `styleDnaDrift.test.ts`, `biometricStyleDnaIntegration.test.ts`.  
**Kept:** `migrateLocalStorage.ts` (used by Settings “Migrate to cloud”) – only removed global attachment.

---

## 2. Does the Logic Serve a Purpose?

**Yes.** The app has a clear, coherent flow:

- **Quick flow:** Mode → Occasion → Context → Preferences → (optional Quick Photo) → Results (engine + trend API, with local library fallback) → Try-on → Complete.
- **Personal flow:** Mode → Photo → Fit calibration → Lifestyle → Inspiration → Wardrobe → Loading (client-side `generatePersonalOutfits`) → Personal Results → Try-on → Style DNA.
- **Engine:** Quick flow prefers `getOutfitsWithTrend()` (decision engine + trend images); on API failure it falls back to local `generateOutfits()` so the user still gets three outfits. Personal flow uses a fixed outfit library + scoring (color, proportions, face shape, lifestyle) to pick SAFEST / SHARPER / RELAXED – deterministic and purposeful.
- **Persistence:** History/favorites in Supabase; optional localStorage → Supabase migration in Settings; global `generation-complete` listener updates history with try-on image and clears local generation state.
- **Try-on:** Replicate-based virtual try-on via `/api/replicate-generate` with polling; errors are mapped to user-facing messages (rate limit, network, CORS, etc.).

So the core logic is purposeful and the fallbacks (engine → library, migration, error handling) are sensible.

---

## 3. Enhancement List (Prioritized)

### High priority (production readiness & correctness)

1. **Run tests in CI**  
   `.github/workflows/ci.yml` only runs `npm ci`, `npm run build`, and `npm run lint`. Add `npm run test` so regressions are caught on every push/PR.

2. **Route protection**  
   There is no `ProtectedRoute` or equivalent. History, Profile, Favorites, Settings, Dashboard rely on `if (!user) return` and similar, but the routes themselves are still reachable (empty or redirect behavior only). Add a route guard (e.g. redirect to landing or sign-in for `/history`, `/profile`, `/favorites`, `/settings`, `/dashboard`) so unauthenticated users cannot hit those paths.

3. **Secrets and env**  
   - API routes use `process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY` and `process.env.REPLICATE_API_TOKEN`. In production, use server-only env (e.g. `GEMINI_API_KEY`, `REPLICATE_API_TOKEN`); do not rely on `VITE_*` for secrets (they are embedded in the client bundle).
   - Document required env vars (e.g. in README or a single `.env.example`): `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE`, `GEMINI_API_KEY`, `REPLICATE_API_TOKEN`, optional `VITE_OPENAI_API_KEY`, `VITE_GEMINI_API_KEY` for dev.

4. **Lint in CI**  
   CI runs `npm run lint || true`, so lint failures do not fail the build. Prefer failing the build on lint errors (and optionally allow warnings via ESLint config) so style and obvious bugs are caught.

5. **Error handling and logging**  
   - Many `console.log` / `console.warn` / `console.error` remain in production code. For production, either remove non-essential logs or route them to a logging service and gate by env (e.g. `import.meta.env.DEV`).
   - Ensure all API calls (Supabase, Replicate, Gemini, trend/generate-outfits) have a consistent pattern: user-facing message, optional reporting, and no leaking of internal details.

### Medium priority (reliability & UX)

6. **Bundle size**  
   Build warns about chunks > 500 kB. Consider code-splitting by route (e.g. lazy-load Flow, History, Profile, Dashboard) to improve initial load and LCP.

7. **Offline / PWA**  
   Service worker is registered; clarify whether offline use is a goal and, if so, document cache strategy and test offline behavior for key flows.

8. **Retries and timeouts**  
   - Replicate try-on has long `maxDuration: 100` and polling; ensure client-side timeout and “generation taking longer than expected” messaging so users are not left hanging.
   - For `/api/generate-outfits` and trend calls, add explicit timeout and retry policy (e.g. one retry with backoff) and surface a clear error if the service is down.

9. **Personal flow generation**  
   Personal flow uses a single retry (and `generatePersonalOutfits` is synchronous). If the library or filters often yield &lt; 3 outfits, consider logging and/or a third fallback (e.g. relax filters) before showing “We’re refining your style.”

10. **History update on try-on**  
    When `generation-complete` fires, history is updated and `profile-should-refresh` is dispatched. If `updateOutfitHistoryTryOn` fails, the user is not notified (only console). Consider a non-intrusive toast or inline message so they know the try-on image may not be saved to history.

### Lower priority (maintainability & polish)

11. **Browserslist**  
    Build suggests updating caniuse-lite (`npx update-browserslist-db@latest`). Run periodically to keep target browsers accurate.

12. **TypeScript strictness**  
    Review `tsconfig` for `strict: true` and fix any remaining `any` or unsafe casts (e.g. in `(window as any)` usages that were removed; any remaining ones in other files).

13. **Duplicate / dead code**  
    - Quick flow uses both `getOutfitsWithTrend` and `generateOutfits` (intentional fallback). Ensure there is no other duplicated “generate outfits” logic that could drift.
    - Remove or repurpose the “App version: Testing auto-deploy…” comment in `App.tsx` for a single source of version (e.g. from package.json or env).

14. **API versioning and OpenAPI**  
    If you reintroduce API docs, consider a single OpenAPI spec (e.g. under a `/docs` or repo path) and optional version prefix for API routes (e.g. `/api/v1/...`) for future compatibility.

15. **Analytics and feedback**  
    `logEvent` and feedback endpoints exist; confirm events are sufficient for product decisions and that feedback is stored and used (e.g. for improving recommendations or debugging).

---

## 4. Is It Production Ready?

**Summary: Almost, with a few must-fixes.**

| Area | Status | Notes |
|------|--------|--------|
| **Core logic** | ✅ | Flows, engine, fallbacks, and persistence logic are coherent and purposeful. |
| **Auth** | ⚠️ | Clerk is integrated; routes are not protected – add guards. |
| **Secrets** | ⚠️ | Ensure no API keys in client; document and enforce server-only env for production. |
| **CI** | ⚠️ | Tests not run in CI; lint does not fail the build. |
| **Error handling** | ✅ | Try-on and key flows surface user-facing errors; some silent failures (e.g. history update) remain. |
| **Build & deploy** | ✅ | Vite + Vercel build and API copy work; build passes. |
| **Testing** | ⚠️ | Unit tests exist but are not run in CI. |
| **Docs** | ⚠️ | All internal docs removed; add minimal README + env example for onboarding and production. |

**Verdict:** Suitable for a controlled or beta production rollout after: (1) adding tests to CI, (2) protecting authenticated routes, (3) locking down and documenting env/secrets, and (4) optionally tightening lint and reducing console noise. The enhancements above will move it toward a fully production-ready state.

---

## 5. Flow feature ideas (what's nice to implement)

Features that would add clear value inside the **Quick** and **Personal** flows.

### Quick flow
- **Name / save look before try-on** — Let users name the moment (e.g. "Interview Tuesday") at Results; makes History and "use again" more meaningful.
- **Date or event picker** — Optional date/time for the occasion for "Remind me" or "Plan next look" later.
- **Replace one outfit** — "Swap this one" on a single card: re-run selection for that tier only, keep the other two.
- **Show alternatives without leaving** — "More options" per card using `generateAlternativeOutfits` in a drawer/modal.
- **Why this outfit** — Expand reasoning/confidence on tap to build trust and teach style.

### Personal flow
- **Use wardrobe in recommendations** — Pass wardrobe images/tags into scoring so "from your closet" or "works with what you have" appears when relevant.
- **Inspiration as strength** — Allow 1–3 inspiration presets with weights instead of a single pick.
- **Skip wardrobe with intent** — "I'll add my closet later" vs "I don't want to" and prompt later from Profile/Settings.
- **Resume later** — Persist flow state in Supabase for signed-in users; "Continue where you left off" on next visit.
- **Body/fit presets** — If no photo, let users pick Slim / Regular / Athletic / Relaxed so personal scoring still improves.

### Results (both flows)
- **Save all three** — One tap to save all three outfits to History/Favorites with one shared occasion/label.
- **Share result** — Shareable link or image (OG + deep link) to send "my three looks" to a friend or calendar.
- **Thumbs up/down per card** — Simple feedback to your API for ranking and A/B tests.
- **Where to buy** — Use `retailer_ids`; add "Shop similar" or product links per outfit.

### Try-on step
- **Download options** — Download in different sizes or "share to Instagram story" aspect.
- **Try another outfit** — From try-on, "Try different look" to pick another of the three without restarting.

### Complete / post-flow
- **Plan next look** — CTA back to Mode select (or occasion) with optional prefill.
- **Email summary** — Optional "Email my looks" (link + thumbnails) for signed-in users.
- **Add to calendar** — "Add to calendar" with event title + date from Quick flow.

**Priorities:** "Replace one outfit" and "Show alternatives" improve Quick flow without new backend. "Use wardrobe" and "Resume later" make Personal flow stickier. "Share result" and "Where to buy" help acquisition and conversion.
