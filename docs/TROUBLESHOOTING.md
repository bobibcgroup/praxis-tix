# Troubleshooting production errors

## "A server with the specified hostname could not be found" (Supabase)

**Symptom:** All Supabase requests fail with `TypeError: Load failed` and the browser reports that the hostname for `https://<project>.supabase.co` could not be found. This affects:

- Saving outfit history
- Saving favorites
- Saving Style DNA / profile
- Virtual try-on (photo upload to Storage)

**Cause:** The Supabase project is unreachable. Common reasons:

1. **Project paused (most common)**  
   Free-tier Supabase projects pause after a period of inactivity. The project URL stays the same but the service does not respond until you restore it.

2. **Wrong or old URL**  
   `VITE_SUPABASE_URL` in your deployment (e.g. Vercel) might point to a deleted or renamed project.

3. **DNS / network**  
   Rare; usually only in locked-down networks.

**What to do:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select the project (e.g. the one whose ref is in your URL: `sbydiytcfknkthjnlnwr`).
2. If you see **Project is paused** or **Restore project**, click **Restore**. Wait until the project is fully active.
3. In your deployment (e.g. Vercel), confirm env vars:
   - `VITE_SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = the project’s anon key from Settings → API.
4. Redeploy after changing env vars so the new URL/key are used.

After Supabase is reachable again, history, favorites, profile, and virtual try-on (with Storage) should work without code changes.

---

## "Origin ... is not allowed by Access-Control-Allow-Origin. Status code: 401" (OpenAI)

**Symptom:** Requests to `https://api.openai.com/v1/chat/completions` fail with 401 and a CORS error in the console.

**Cause:** The frontend is calling the OpenAI API directly (or via a proxy that returns 401). A 401 means the request is unauthorized: wrong or missing API key, or the key is revoked.

**What to do:**

1. **Do not put the OpenAI API key in the client.** Use a server-side proxy (e.g. Vercel serverless) that reads the key from env and calls OpenAI; the frontend calls your proxy.
2. If you already use a proxy, check that the server has the correct `OPENAI_API_KEY` (or equivalent) in the deployment env and that the key is valid in the OpenAI dashboard.
3. Redeploy after changing env vars.

---

## Virtual try-on: "Source image must be a hosted URL, not a data URL"

**Symptom:** Try-on fails with this message after “Using data URL” or “Supabase upload error” in the logs.

**Cause:** The user photo is only available as a data URL because uploading to Supabase Storage failed (usually because Supabase is unreachable; see above). The try-on pipeline requires a public URL for the source image, so data URLs are rejected.

**What to do:**

1. Fix Supabase reachability (see first section). Once Storage is reachable, the app will upload the photo and get a URL, and try-on can proceed.
2. Ensure the Storage bucket used for try-on (e.g. `images`) exists and has policies that allow uploads and public read for the generated URLs.

Improving the error message in-app for this case is tracked in the codebase so users see a clear “upload failed; check connection / Supabase” style message.
