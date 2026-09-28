# Praxis — System, IA & Visual-System Audit (everything except the Flow page)

Repo: `/Users/clawdbob/ClaudeProjects/praxis` (branch v2). Read-only audit. All paths relative to repo root. Lovable scaffold (`package.json:2` name `vite_react_shadcn_ts`, `vite.config.ts:4` `lovable-tagger`), Vite 5 + React 18 + shadcn (`components.json` style `default`, baseColor `slate`) + Clerk + Supabase + Vercel functions.

---

## 1. INFORMATION ARCHITECTURE

### Route map (`src/App.tsx:37-45`)

| Route | Component | Responsibility | Reachable from |
|---|---|---|---|
| `/` | `pages/Flow.tsx` | **The real home.** Step 0 = `StepModeSelect` (quick vs personal); the whole product lives here as a numeric step machine (steps 0-4, 35, 36, 10-18; `Flow.tsx:402-819`) | Logo (`Header.tsx:21`), every "Back to flow" button, `afterSignOutUrl` |
| `/landing` | `pages/Landing.tsx` | Marketing page: Hero → Problem → HowItWorks → WhyDifferent → WhoItsFor → EarlyAccess → Footer | **Nothing.** Only `useSEO.ts:24` knows it exists. Orphan. |
| `/dashboard` | `pages/Dashboard.tsx` | Occasion shortcuts + "latest generated outfits" teaser + active-generation banner | Header nav (`Header.tsx:37`), mobile sheet (`MobileNavMenu.tsx:39`), Flow's own header (`Flow.tsx:932`), and the post-try-on redirect (`StepVirtualTryOn.tsx:323`) |
| `/history` | `pages/History.tsx` | Full outfit history: search, filter, sort, bulk delete, favorite, lightbox, detail modal | Header nav, Dashboard "View All"/"View History", Profile "View Outfit History" |
| `/favorites` | `pages/Favorites.tsx` | Filtered view of history entries whose `outfit_id` is favorited | Header nav only |
| `/profile` | `pages/Profile.tsx` ("My Style") | Style DNA report re-render + collapsibles + 3 CTAs | Header nav, Settings "Back to profile" |
| `/settings` | `pages/Settings.tsx` | Theme radio, Retail-mode switch, account info, export JSON, localStorage migration, fake delete | Header nav, Profile "Settings" button |
| `*` | `pages/NotFound.tsx` | 404 with raw `<a href="/">` (full reload) | Any typo — and the Landing hero CTA (see below) |

### Dead ends and orphans (evidence)
- **Landing hero CTA links to a route that does not exist.** `Hero.tsx:21` `<Link to="/app">Try It Now</Link>` → hits the `*` catch-all → 404 page. The one conversion button on the marketing page is broken.
- **`/landing` is unlinked.** No `navigate('/landing')` or `<Link to="/landing">` anywhere in `src/` (grep). It cannot be reached by clicking.
- **Early-access form is a stub.** `EarlyAccess.tsx:16-17` "Simulate API call" `setTimeout(800)` then shows "You're on the list." Nothing is stored or sent.
- **Footer links are `href="#"`.** `Footer.tsx:14,17` Privacy / Contact.
- **`Header.tsx` is not used by the Flow page.** Flow duplicates the entire header inline (`Flow.tsx:902-999`) with a second copy of the desktop nav + mobile sheet + theme toggle. Consequence: `Header.tsx:12,90` `isFlowPage` logic (hide Sign In on `/`) is dead — Flow shows its own Sign In (`Flow.tsx:989-995`).
- **`StepSignInPrompt.tsx` is orphaned.** Zero importers (grep). `Flow.tsx:135-136` comment says "Guard: Show sign-in prompt at step 10 (Photo) if not authenticated" but no code follows the comment.
- **`NavLink.tsx`, `ui/page-header.tsx`, `ui/section-header.tsx` are unused** (0 importers). Every page hand-rolls the exact same back-button + `text-3xl` h1 + muted subtitle block instead (`History.tsx:311-339`, `Favorites.tsx:78-92`, `Profile.tsx:165-194`, `Settings.tsx:138-152`).
- **Profile → "Reset Style"** does `navigate('/', {state:{editProfile:true}})` then `window.location.reload()` (`Profile.tsx:185-186`) — a hard reload of the SPA to force an effect.
- **Profile → "Try virtual try-on"** just `navigate('/')` (`Profile.tsx:433`) which lands on step 0 mode-select, not try-on; photo isn't persisted (`userService.ts:124` returns `hasPhoto:false`) so try-on requires redoing the personal flow.
- Back-button targets are inconsistent: History/Favorites/Profile → `/`, Settings → `/profile` (`Settings.tsx:140`), Dashboard has no back at all.

### Navigation graph (signed-in)
```
/ (Flow) ──header nav──▶ /dashboard ─▶ / (occasion preselected via location.state, Dashboard.tsx:231)
   │                       └▶ /history
   ├──▶ /history ◀──── /favorites (no link back to favorites from history)
   ├──▶ /favorites
   ├──▶ /profile ──▶ /history, /settings, / (reset / try-on)
   └──▶ /settings ──▶ /profile
StepVirtualTryOn (step 18) ──after starting generation──▶ /dashboard (StepVirtualTryOn.tsx:323)
```
Anonymous users: `/` only, plus whatever they type. No nav is rendered for them (see §2).

---

## 2. NAVIGATION MODEL

- **Persistent header**: fixed, 56px, `bg-background/95 backdrop-blur-sm border-b border-border/30` (`Header.tsx:16-17`; duplicate at `Flow.tsx:902-903`). Left: serif "Praxis" **plus a permanent tagline** "Get dressed right, in under a minute." stacked under the logo at `text-xs md:text-sm` on every screen (`Header.tsx:24-27`, `Flow.tsx:912-914`). Right cluster: nav → theme toggle → Clerk `UserButton` → Sign In (cta).
- **Desktop nav** (≥768px, signed-in only): five `Button variant="ghost" size="sm"` — Dashboard, History, Favorites, My Style, Settings (`Header.tsx:32-75`). They are `<button onClick={navigate}>`, not `<Link>`: no href, no middle-click/open-in-tab, **no active-page indication** (`NavLink.tsx` with `activeClassName` exists and is unused; no `aria-current` anywhere).
- **Mobile nav** (<768px, signed-in only): hamburger `Menu` icon opening a right-side `Sheet` w-300 (`MobileNavMenu.tsx:28-34`) listing the same five items with lucide icons, a separator, and **a second ThemeToggle** ("Theme / Appearance") — the header already shows one (`Header.tsx:83`, `MobileNavMenu.tsx:89`). Three ways to change theme total (header, sheet, Settings radio).
- **No bottom tab bar.** No "Start over"/"New look" affordance outside Flow (Flow shows "Start over" text in its own header when `showStartOver`, `Flow.tsx:918-925`).
- **Anonymous state**: no nav at all — only ThemeToggle + "Sign In" (`Header.tsx:81-96`). The information architecture is invisible until you sign in.
- **First-paint flicker**: `useIsMobile` initialises `undefined` → `!!undefined === false` (`use-mobile.tsx:6,17`), so on phones the first render commits the desktop `<nav>` then swaps to the hamburger after the effect runs (`Header.tsx:32,78`).
- **Current-page indication**: none. Page identity comes only from the h1 inside the content.

---

## 3. DESIGN TOKEN AUDIT

### Typography
- Loaded via CSS `@import` from Google Fonts inside `index.css:3` (render-blocking, after the CSS itself downloads; no `<link rel=preconnect>` / preload in `index.html`). Families: **Inter 400/500/600** and **Instrument Serif 400 regular+italic** — the serif ships no 500/600, yet `h1-h3 { font-family: 'Instrument Serif' }` is global (`index.css:174-176`) and pages set `text-3xl font-medium` on h1 (`Profile.tsx:177`, `History.tsx:323`, …) → synthesized weight. `CardTitle` is an `<h3>` at `text-2xl font-semibold` (`card.tsx:19`) → Settings card titles ("Appearance", "Retail mode") render in faux-bold serif. Radix `DialogTitle`/`AlertDialogTitle` render `<h2>` → also serif. The serif is applied by element, not by intent.
- Custom scale exists (`tailwind.config.ts:77-85`): `display` 64/1.1/-0.02em, `display-sm` 48, `heading` 36, `subheading` 24, `body-lg` 18/1.7, `body` 16/1.7, `small` 14/1.6. **Used only in the marketing components** (`Hero.tsx:9`, `Problem.tsx:12`, `HowItWorks.tsx:23`, …). App pages ignore it and use raw Tailwind: `text-sm` ×161, `text-xs` ×88, `text-3xl` ×14 (grep outside `ui/`). The app is a 12-14px interface with 30px page titles and almost nothing in between.

### Color
- Light (`index.css:12-40`): bg `40 20% 98%` (warm off-white), fg `220 20% 12%`, card `40 15% 96%`, **primary sage `150 20% 28%`**, accent `150 15% 93%`, muted-fg `220 8% 52%`, border `40 15% 88%`, ring `145 25% 36%`. Custom extras: `--text-secondary/tertiary`, `--surface-elevated/subtle`, `--accent-soft/medium` (`index.css:72-80`, `tailwind.config.ts:45-46,66-71`).
- Dark (`index.css:92-152`): bg `220 15% 7%`, card `220 12% 10%`, primary lifted to `150 25% 55%`. Thorough — every token has a dark value; `ThemeProvider attribute="class" defaultTheme="system"` (`App.tsx:27`).
- **Left at shadcn defaults**: `--destructive: 0 84.2% 60.2%` (`index.css:34`) — a saturated stock red that clashes with a desaturated warm/sage palette (used on Delete buttons and the Danger Zone border); all `--sidebar-*` tokens are stock slate (`index.css:82-89`) — harmless because `sidebar.tsx` is unused.
- **Off-palette hardcodes**: `bg-blue-500/10 … text-blue-900 dark:text-blue-100` for the localStorage-migration callout (`Settings.tsx:248-255`); `text-white` ×18, `bg-white` ×12, `text-black` ×2 outside `ui/` (dark-mode risk).
- **No purple / gradient "AI" aesthetic.** `bg-gradient` ×2 total. Saturation is low throughout. The palette is a real decision, not a template.
- `.dark img { filter: brightness(0.9) }` globally (`index.css:178-181`) — dims **every** photo, including try-on results and outfit imagery, in a fashion app.

### Radius / shadow / spacing
- Radius tokens `sm 6 / md 8 / lg 12 / xl 16 / 2xl 24`, default = lg (`index.css:53-56`, `tailwind.config.ts:86-93`). Buttons `rounded-lg`, `sm` size `rounded-md` (`button.tsx:8,23`) — so small buttons are 8px and default buttons 12px next to each other. Cards `rounded-xl` (16px). `rounded-full` ×49, `rounded-xl` ×43.
- Shadows: no custom tokens; stock `shadow-sm` ×16, `shadow-lg` ×10, `shadow-md` ×3. `<Card>` primitive carries `shadow-sm` (`card.tsx:6`); the 21 hand-rolled `bg-card rounded-xl border` divs mostly don't → two card weights on one page (Settings mixes both: `Settings.tsx:156,183` vs `205,232,276`).
- Spacing tokens (`xs…3xl`, `section`, `section-lg`, `header`, `page-top`; `index.css:44-50,68-69`, `tailwind.config.ts:94-106`) — again only the marketing sections use `py-section-lg`. Pages repeat the literal `container mx-auto px-4 md:px-6 pt-16 pb-8 max-w-{2xl|4xl}` (`History.tsx:310`, `Favorites.tsx:77`, `Profile.tsx:164`, `Settings.tsx:137`, `Dashboard.tsx:236`). `pt-16` under a 56px fixed header leaves 8px of breathing room before the back button.

### Motion
- Global 300ms transition on **every element** for bg/border/color/fill/stroke: `body *:not([class*="animate-"]):not([class*="transition-none"])` (`index.css:190-196`) plus `html`/`body` transitions (`163,170`). Every hover, focus ring colour, selection highlight and toast now eases over 300ms; it also fights Radix/`tailwindcss-animate` enter/exit states. `disableTransitionOnChange={false}` (`App.tsx:27`) compounds this on theme switch.
- Marketing-only keyframes `fade-up`/`fade-in` + `animation-delay-*` (`index.css:222-265`); `animate-fade*` ×8, all on Landing. App feedback = `animate-spin` Loader2 ×8 and `animate-pulse` ×8 (the try-on "person changing clothes" silhouette, `StepVirtualTryOn.tsx:326-340`).
- No `prefers-reduced-motion` rule anywhere in `index.css`.

### Icons
- `lucide-react@0.462` (32 importing files). One emoji as the "app icon" in the iOS install banner: `👔` (`IOSPrompt.tsx:46`).

### Verdict
Two visual languages share one repo. **Landing** (Instrument Serif display, warm paper, sage, generous `py-section-lg`, tokenized type) is a coherent, quiet, editorial direction — ~4/10 generic. **App pages** are stock shadcn composition on top of that palette: ghost-button nav, bordered `rounded-xl` cards with `p-6`, `text-3xl font-medium` h1 + `text-muted-foreground` subtitle, icon-left `text-xs uppercase tracking-wider` eyebrows, `AlertDialog` for every destructive action — ~7-8/10 generic. Blended: **6/10 generic**. The palette and serif are the only things carrying identity; layout, density, hierarchy and motion are defaults.

---

## 4. COMPONENT PATTERNS (grep counts, `src/` excluding `components/ui/`)

| Pattern | Count | Notes |
|---|---|---|
| Hand-rolled card `bg-card rounded-xl border` | 21 (9 files) | vs `<Card` 10, all in `Settings.tsx` — same page mixes both |
| Card-in-card | many | History entry card → `bg-muted/30 rounded-lg` Style DNA sub-box (`History.tsx:608`) → colour-swatch row; Settings card → `bg-blue-500/10` callout (`248`); Profile: page → 8 stacked cards → `<details>` cards; Dashboard: bordered cards inside a bordered grid |
| Icon-above-heading | Dashboard quick actions (`h-24 flex-col`, `Dashboard.tsx:247-282`); all 4 empty states (`History.tsx:412`, `Favorites.tsx:96`, `Profile.tsx:198`, `History.tsx:420`) | Standard "icon, grey line, CTA" empty-state template |
| Eyebrow labels `uppercase tracking` | 19 | "Biometric", "Identity", "Your season", "Your optimal palette", "Lean into", "Avoid" (`Profile.tsx:232,266,280,294,321,342`) |
| `<Badge` | 0 | badge primitive unused; pills are hand-rolled spans |
| `<AlertDialog` | 24 | History alone has 2 (single + bulk delete) |
| `<Dialog` | 18 | lightbox, detail modal, iOS instructions, crop… |
| `<Sheet` | 7 | mobile nav |
| `text-3xl` h1 in app screens | 14 | Profile has **two h1s** on one page (`Profile.tsx:177` "My Style" and `211` "Your Style DNA") |
| `variant="cta"` | 35 | `cta` = `default` + `shadow-sm hover:shadow-md` (`button.tsx:12,18`); effectively the default button under a different name |
| `toast.` (sonner) | 44 calls in 7 files | shadcn `<Toaster>` is ALSO mounted (`App.tsx:31-32`) but `use-toast` has 0 consumers → dead toast system |
| `bg-primary/5` + `border-primary/20` "info tile" | 16 / 3 | the house pattern for alerts (`Dashboard.tsx:300`, `StepSignInPrompt.tsx:39`) |
| `bg-gradient` | 2 | none in app chrome |
| `console.log` in pages/components | 20 | plus emoji-prefixed logs throughout `lib/` (`userService.ts:68,87,189…`) |
| `setTimeout` | 17 | mostly "wait 500ms for the DB" (`Dashboard.tsx:92,172`, `Profile.tsx:64,102,110`, `History.tsx:64,86`) |

**Primitive inventory**: 52 files in `ui/`; **34 have zero importers** (accordion, aspect-ratio, avatar, badge, breadcrumb, calendar, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu*, form, hover-card, input-otp, menubar, navigation-menu, page-header, pagination, popover, progress, resizable, scroll-area, section-header, sidebar, skeleton, slider, table, tabs, textarea, toggle, toggle-group). `button` is imported by 36 files; nothing else exceeds 4. (*dropdown-menu is used inside `theme-toggle.tsx` only.) `skeleton`, `drawer`(vaul), `tabs`, `checkbox` are all unused while the pages hand-roll text loaders, centered dialogs, and icon-button checkboxes.

---

## 5. SECONDARY PAGES

### Landing (`/landing`, 27 lines + 6 section components)
Shows: hero (`text-display` serif, two xl buttons), 4-bullet Problem list, 3-step HowItWorks, 4 check-tiles WhyDifferent, WhoItsFor + "Coming soon: For retailers", email capture, footer. States: none needed. Cost: n/a. **Verdict**: the only page with a distinct voice, but unreachable, with a 404 primary CTA (`Hero.tsx:21`), a fake form, and dead footer links. Also `useSEO.ts:22,26` describe "Praxis Agent" — a product name that appears nowhere in the UI except `Flow.tsx:395` document.title. Either become `/` for anonymous visitors or delete.

### Dashboard (`/dashboard`, 416 lines)
Shows: centered "Dashboard / Quick access to style recommendations"; 2×2 (4-col md) `h-24` outline buttons **Meeting→WORK, Wedding, Dinner, Date** plus full-width "Other Occasion"→**PARTY** (`Dashboard.tsx:248-294` — labels don't match the enum: Meeting≠Work, Other≠Party); active-generation banner; "Latest Generated Outfits" (≤6, 2/3-col grid, entries with try-on image) else "Recent Styles" (≤3). Loading: nothing rendered (sections gated on `!loading`) → a brand-new user sees 5 buttons and blank space; **no empty state**. Error: console only. No back link. Does NOT redirect anonymous users (`Dashboard.tsx:114-116`) — the only "protected" page that isn't. Fetches history **twice** (`loadRecentStyles` + `loadGeneratedOutfits`, `30,43`), runs `syncUserDataOnSignIn` on mount, polls `localStorage` every 2s (`196-221`), and registers a `generation-complete` handler that **duplicates** the global one in `main.tsx:10-55` (both call `updateOutfitHistoryTryOn`). **Verdict**: it is Flow step 1 (pick occasion) + a History teaser. Does not deserve a route; fold into the home screen for signed-in users.

### History (`/history`, 743 lines)
Shows: back, h1 + Refresh, search input, occasion `Select`, sort `Select`, select-all bar, bulk-action bar, list of entries (image 3:4 full-width on mobile / `md:w-40`, title, occasion, style name, Top/Bottom/Shoes rows, Style DNA sub-box, palette swatches, delete icon), single + bulk `AlertDialog`, lightbox `Dialog`, `HistoryDetailModal`. Loading: full-page "Loading your history..." text (`300`), no skeleton. Empty: icon + "No outfit history yet" + Start styling (`411-417`); filter-empty variant (`419-431`). Error: `console.error` + empty list (`141-142`). Interaction cost: **five tap targets per card** (checkbox `466`, enlarge `518`, favorite `554`, delete `647`, open-detail `481`), `e.stopPropagation()` ×6 to keep them from colliding; on a phone each card is ~500px tall (full-width 3:4 image + 8 text rows). Polls `localStorage` every 5s (`92-115`). **Verdict**: deserves to exist as the single "Looks" library — absorb Favorites (a filter) and drop bulk-select for a pre-launch app.

### Favorites (`/favorites`, 177 lines)
Shows: same card as History minus actions; heart button removes. Loading text; empty heart icon + "Looks you save will appear here."; error console-only. Card `onClick={() => {/* … could navigate to detail view */}}` with `cursor-pointer` (`Favorites.tsx:104-105`) — a hand cursor that does nothing. Data = history entries ∩ favorited `outfit_id`, deduped (`userService.ts:626-643`). **Verdict**: a filter chip on History. Not a page.

### Profile / "My Style" (`/profile`, 454 lines)
Shows: back, h1 "My Style" + "Reset Style" text button, then a second centered h1 "Your Style DNA"; identity card with **hardcoded** `"Understated. Refined. Effortless."` (`222-223`); Biometric card (undertone / vertical line / shoulder checks); Identity radar (`StyleDNARadarChart`); season swatches; "Your optimal palette" (4 swatches + metals); **hardcoded** "Lean into" (`325-336`) and "Avoid" (`346-353`) bullets; three native `<details>` (Style DNA details / Fit / Lifestyle) with `list-none` so no disclosure marker (`359-361`); closing line; 3 stacked full-width buttons. Loading text; empty state "No style profile yet" + CTA. Error console-only. Refetches on mount, on window focus (`83-93`), on `generation-complete`, on `profile-should-refresh`, and after a 500ms sleep post-sync. **Verdict**: the AI-generated copy from `/api/generate-style-dna` is displayed once in `StepStyleDNA` (`StepStyleDNA.tsx:87-98,235`) and never persisted (`profiles.style_dna` holds only `primaryStyle/secondaryStyle/confidence/identity_core` + smuggled `skinTone/contrastLevel`, `userService.ts:45-54`), so every user's profile reads identically. The page deserves to exist only if it renders the real DNA; today it is a static template with a radar chart.

### Settings (`/settings`, 322 lines)
Shows: Appearance radio (third theme control), Retail-mode `Switch` (`182-202`, see §12), Account info (email, **raw Clerk user ID in mono**, name; "managed by Clerk" note), Export My Data (JSON download, works: `53-91`), conditional "Local Storage Data Found" migration callout, Danger Zone → Delete Account → `AlertDialog` → **toast "Account deletion must be done through your account settings"** (`93-98`). Loading text. **Verdict**: two working controls (export, theme) and two placeholders. Could be a section of Profile or the Clerk `UserButton` menu.

### NotFound
`bg-muted`, `text-4xl font-bold` "404", "Oops! Page not found", `<a href="/">` (full reload; `NotFound.tsx:12-19`). No header, no theme consistency (font-bold on serif h1). Logs to console.

---

## 6. AUTH & ONBOARDING GATING

- **Provider**: `ClerkProvider publishableKey={clerkPublishableKey || ""}` (`App.tsx:28`) — empty string if the env var is missing; Clerk throws at runtime rather than degrading.
- **Where sign-in happens**: only the header `SignInButton mode="modal"` (`Header.tsx:91-95`, `Flow.tsx:990-994`). No `/sign-in`, `/sign-up` routes, no dedicated sign-up copy; Clerk's modal handles both. The purpose-built `StepSignInPrompt` (value prop + "Continue without signing in") is never mounted.
- **What is public**: everything on `/`. Anonymous users can run the quick flow, the full personal flow (photo upload, biometric session, fit, lifestyle, inspiration, wardrobe, DNA card, virtual try-on). Persistence silently no-ops: `saveOutfitToHistory` / `saveUserProfile` are wrapped in `if (user && …)` (`Flow.tsx:239,513,766`; `StepStyleDNA.tsx:161-162`). A user can spend 5+ minutes and 2 model calls and have nothing to come back to, with no warning.
- **What is "protected"**: History/Favorites/Profile/Settings each run `if (isLoaded && !user) navigate('/')` in a `useEffect` (`History.tsx:51`, `Favorites.tsx:19`, `Profile.tsx:48`, `Settings.tsx:43`) — a loading screen flashes, then a silent bounce to home, no message, no return-to after sign-in. Dashboard has no redirect. There is no route-guard component.
- **At sign-up/sign-in**: no onboarding. `UserButton afterSignOutUrl="/"`. The first signed-in visit to Dashboard/Profile/History triggers `syncUserDataOnSignIn` (`userSync.ts:286`): 3 email-lookups across tables (`340-402`), `backfillEmailForUser` (3 updates, `backfillEmail.ts:35-96`), then 3 reads, then per-row copy-inserts from any older Clerk user IDs with the same email (`migrateUserData`, `62-277`). Cooldown is an in-memory `Map` (`280`), so it re-runs on every full page load. `localStorage praxis_email_user_mapping` is the fallback index.
- **First-run detection**: none. Flow always opens on step 0 (`Flow.tsx:402`); it never calls `getUserProfile`, so a returning user with a saved Style DNA is treated as new. `location.state.editProfile` jumps to step 10 (`123-126`); `location.state.occasion` jumps to step 1 (`127-131`).
- **Security posture (HIGH)**: Supabase client is created with the anon key and **no Clerk token** (`supabase.ts:11-13`); all row scoping is a client-side `.eq('user_id', userId)`. Unless RLS is configured to trust nothing (which would also break the app), any visitor with the anon key can read/modify any user's `profiles`, `outfit_history`, `favorites`. Additionally `VITE_OPENAI_API_KEY` ships to the browser with `dangerouslyAllowBrowser: true` (`openaiService.ts:3-9`) to generate 8-15-word "motivational" lines; `VITE_GEMINI_API_KEY` and `VITE_RUNWAY_API_KEY` are also present in `.env.local` (names only inspected) and any `VITE_*` var is public.

---

## 7. DATA MODEL

Supabase (`src/lib/database.types.ts`), all JSON columns typed `any`:

| Table | Columns | Notes |
|---|---|---|
| `profiles` | `id, user_id, email, style_dna JSON, fit_calibration JSON, lifestyle, created_at, updated_at` | One row per Clerk user (`upsert onConflict user_id`, `userService.ts:77-79`). `style_dna` = `{primaryStyle, secondaryStyle?, confidence, version?, updatedAt?, identity_core?{kibbe, color_season, undertone, vertical_line, shoulder, provisional}}` **plus** `skinTone` and `contrastLevel` stuffed in and stripped back out on read (`userService.ts:45-54, 112-121`). Photo is not stored. AI DNA copy is not stored. |
| `outfit_history` | `id, user_id, email, outfit_id int, occasion, outfit_data JSON, try_on_image_url, animated_video_url, selected_at, created_at` | Code also writes/reads `style_name` (`userService.ts:200,519`) which is absent from the type file; code comments admit `style_dna`/`color_palette` columns "don't exist" (`191-202,353-358,521`) so `colorPalette` is always `null` from the DB. `outfit_data` is the full `Outfit` (`praxis.ts:266-288`: id, title, label, items{top,bottom,shoes,extras}, reason, imageUrl, reasoning?, confidence?, score_breakdown?, libraryId?, retailer_ids?). `try_on_image_url` stores the Replicate output URL as returned. |
| `favorites` | `id, user_id, email, outfit_id int, created_at` | Keyed on the **catalog** `outfit_id` (small ints from the static library / engine), not on a history row → "favorite" means "this catalog item", rendered via the newest matching history row. Toggling favorite on one history card favorites every entry with the same `outfit_id`. |

`email` on every table is a denormalised cross-device key (comments at `database.types.ts:11,43,81`).

Client types (`src/types/praxis.ts`): `FlowMode 'quick'|'personal'`; `OccasionType` = WEDDING/WORK/DINNER/DATE/PARTY (7); 12 `LocationType`s; `PersonalData` (197-224) carries base64 photos, skin tone, contrast, body proportions, face shape, face/body biometric profiles, fit calibration, lifestyle, inspiration presets with weights, wardrobe items, `styleDNA`.

localStorage keys in play (grep): `praxis_outfit_history` (fallback store, 19 refs), `praxis_active_generation` (17), `praxis_current_history_entry_id` (11), `praxis_favorites` (6), `praxis_style_dna` (written by `StepStyleDNA.tsx:152`, read by `Profile.tsx:147` as a fallback for palette copy), `praxis_style_dna_pending`, `praxis_selected_outfit`, `praxis_feedback`, `praxis_email_user_mapping`, `praxis_a2hs_state`, `praxis_retail_mode`. State is split three ways (Supabase, localStorage, React) and reconciled with `setTimeout(500)`s.

---

## 8. API SURFACE (`api/`, 37 files)

| Endpoint | Purpose | Provider / model | Streaming | maxDuration | Called from |
|---|---|---|---|---|---|
| `POST /api/generate-outfits` | Decision engine: rule intent → optional Gemini intent classify + explanation → 3 outfits | Gemini via `decisionEngine/aiIntentClassifier`, `aiExplanationGenerator` (`GEMINI_API_KEY`) | no | default | `engineOutfitService.ts:14` |
| `POST /api/generate-trend-outfits` | Gemini text "trend summary" then **3 sequential image generations**, returned as base64 data URIs in one JSON | `gemini-2.5-flash` text + `gemini-2.5-flash-image` (env `GEMINI_IMAGE_MODEL`), 3:4, 1K (`generate-trend-outfits.ts:53,87,98`) | no | **120** (`:3-5`) | `trendOutfitService.ts:12` |
| `POST /api/generate-style-dna` | JSON DNA copy (identity phrase, palette reasoning, lean-into, avoid, closing) | `gemini-2.5-flash` REST (`generate-style-dna.ts:70`), always 200 with canned fallback on any failure (`13-22,88-96,132-140`) | no | default | `styleDnaService.ts:16` |
| `POST /api/replicate-generate` | Sync try-on: resolve version, create prediction, **server-side poll ≤90s** | Replicate `ddvinh1/inswapper` face-swap (`virtualTryOnService.ts:83`) | no | **100** (`replicate-generate.ts:5-7`, also `vercel.json:8-10`) | `virtualTryOnService.ts:4` |
| `POST /api/replicate-proxy` | Async create-prediction (IDM-VTON, InstantID, faceswap, generic); `GET` = health | Replicate; client uses `anotherjesse/zeroscope-v2-xl` video (`videoGenerationService.ts:42`) | no | default | `videoGenerationService.ts:2` |
| `POST /api/replicate-status` | Poll a prediction | Replicate | no | default | **nobody** (grep) |
| `POST /api/biometrics` (action `start|face|body|finalize`), `GET ?session_id` | Face + body pipelines, session in an **in-memory `Map`** (`biometricSessionStore.ts`; see `api/biometrics.js:2-15`) | local `sharp` pipelines (`facePipelineService`, `bodyPipelineService`); no LLM in handler | no | default | `biometricApi.ts:18-65`, `StepQuickPhotoCapture.tsx:17-51` |
| `POST /api/biometrics/session/{start,face,body,finalize,result}` + flat `/api/biometrics-session-*` (10 files) | Same as above, split | same | no | default | **nobody** |
| `POST /api/analyze-body`, `/api/analyze-color` | Single-pipeline variants | same | no | default | **nobody** |
| `POST /api/generate-outfits-stream` | Same engine as SSE; emits canned "reasoning_step" lines **before** `await runDecisionEngine`, then all outfits after (`:35-50`) — progressive in name only | Gemini | SSE (`responseLimit:false`) | default | **nobody** |
| `GET /api/events/stream` | 6 canned reasoning steps + biometrics status, all written synchronously then `end()` | none | SSE | default | **nobody** |
| `POST /api/interpret-intent` | Intent only | Gemini optional | no | default | **nobody** |
| `POST /api/log-feedback` | `console.info` the payload ("in production wire to Supabase", `log-feedback.ts:19`) | none | no | default | `feedbackApi.ts:8` |

**Duplication**: `scripts/build-api.mjs` esbuild-bundles 14 `.ts` entries to sibling `.js` (so `../src` imports resolve on Vercel) and, when `VERCEL=1`, overwrites the `.ts` with a 1-line re-export stub (`:9-13,1004-1011`). The `.js` outputs are committed (`generate-outfits.js` 855 lines, `generate-outfits-stream.js` 889, `biometrics.js` 426, `biometrics-session-*.js`), so the repo carries source and artifact side-by-side, and `api/biometrics-session-*.ts` are 2-line shims re-exporting `./biometrics/session/*`. Net: 37 files, ~22 routable functions, **7 live endpoints**, 6+ dead. The biometric session store being a per-instance `Map` means a `face` call may land on a different function instance than `start` and 404 (the reason `biometrics.ts:5` documents "use this when multiple routes return 404"). Every handler sets `Access-Control-Allow-Origin: *`. The browser also calls OpenAI directly (`openaiService.ts:44` `gpt-4o-mini`) and `@google/genai` is a client dependency (`package.json:18`).

---

## 9. RESPONSIVE & ACCESSIBILITY (concrete)

- **Breakpoints**: one JS breakpoint 768 (`use-mobile.tsx:3`); Tailwind `md:` ×39, `sm:` some, `lg:` rare. Container `padding 1.5rem`, screens up to `xl 1200` (`tailwind.config.ts:9-17`). Pages cap at `max-w-2xl`/`4xl`.
- **Safe areas**: `viewport-fit=cover` + `apple-mobile-web-app-capable` (`index.html:5,40`) and `.safe-area-inset-*` utilities exist (`index.css:204-218`), but the fixed header is `top-0` with no top inset (`Header.tsx:16`) → in the installed PWA the logo sits under the notch/status bar. Only the A2HS banners use `safe-area-inset-bottom` (`IOSPrompt.tsx:35`).
- **Touch targets**: nav/back buttons `size="sm"` = 36px (`button.tsx:23`); icon actions are `p-2` + 16px icon = 32px (`History.tsx:559,653`, `Favorites.tsx:129`); theme toggle `h-9 w-9`; hamburger `size="sm" px-2` ≈ 36×28 (`MobileNavMenu.tsx:30`). Nothing hits 44px except `size="lg"`/`xl` CTAs and Dashboard tiles.
- **Keyboard**: clickable `<div onClick>` with no `role`/`tabIndex`: Dashboard outfit cards (`Dashboard.tsx:338-342,378-382`), History entry body (`481-487`), Favorites card (`102-105`). Checkbox-buttons have no `aria-pressed`/`aria-label` (`History.tsx:437-451,466-478`). `focus-visible` ring is applied consistently (×40) — good.
- **ARIA**: `aria-label` ×34 (icon buttons mostly covered); lightbox `DialogContent` has `DialogHeader className="sr-only"` text but no `DialogTitle` (`History.tsx:707-709`) → Radix warns, no accessible name. Native `<details>` with `list-none` hides the only affordance (`Profile.tsx:359-361`). A2HS banners set `role="dialog"` + labelledby (`IOSPrompt.tsx:37-39`, `AndroidPrompt.tsx:22-24`) — fine.
- **Contrast**: `muted-foreground` `220 8% 52%` on `40 20% 98%` ≈ 4.6:1 passes for body but is used at `text-xs` (12px) ×88; `text-muted-foreground/50` and `/60` (`Footer.tsx:23`, empty-state icons) fail.
- **Dialogs on mobile**: shadcn `DialogContent` is `sm:rounded-lg` centered (`dialog.tsx:39`) → phones get a square, centered modal; `drawer.tsx` (vaul) exists unused. `AlertDialog` ×24 follow the same shape.
- **Inputs**: `text-base md:text-sm` (`input.tsx:11`) avoids iOS zoom — good. Search field has an icon overlay (`History.tsx:374`).
- **Images**: history/dashboard `<img>` have `alt` but no `loading="lazy"`, `width/height` or aspect placeholder beyond the container's `aspect-[3/4]` (`History.tsx:512-516`, `Dashboard.tsx:344-348`). Dark mode dims them (§3).
- **Loading feedback**: three pages swap the entire screen to a text line (`History.tsx:294-305`, `Favorites.tsx:61-72`, `Profile.tsx:123-134`, `Settings.tsx:121-132`); no skeleton, no preserved header height → layout jump.

---

## 10. PERFORMANCE PERCEPTION

- **One bundle**: `dist/assets/index-*.js` 848 KB (243 KB gzip), CSS 78 KB (13.5 KB gzip); `React.lazy` ×0 (grep). Every route, Clerk, Supabase, the OpenAI SDK, TanStack Query (`App.tsx:4,19`, no `useQuery` anywhere), 18 imported JPGs and all 52 primitives that survive tree-shaking ship to `/landing` and to the first paint of `/`.
- **Fonts**: CSS `@import` (`index.css:3`) means HTML → CSS → Google CSS → woff2, no preconnect; serif headings FOUT into a fallback Georgia, then swap. Synthesized weights (§3) also cost render.
- **Timers**: `useAddToHomeScreen` ticks `setTimeSpent` every 1s **for the lifetime of the app** (`useAddToHomeScreen.ts:96-103`, mounted in `App.tsx:35`); Dashboard polls `localStorage` every 2s (`196-221`); History every 5s (`92-115`). Plus a global 300ms colour transition on every node (§3).
- **Chatty data layer**: Dashboard mount = sync (≥6 queries) + 2× full history fetch; Profile refetches on focus; sync re-runs on every reload because its cooldown is in memory.
- **The waits users actually feel**: quick flow → `/api/generate-trend-outfits` does 1 text call + 3 image calls **in series** and returns only when all are done (`:143-150`), as ~3 MB of base64 JSON, inside a 120s function; there is no partial result. Personal try-on → `/api/replicate-generate` blocks the client up to 90s+ (`replicate-generate.ts:115-118`). The SSE endpoints that could narrate these waits (`generate-outfits-stream`, `events/stream`) are unused, and even they emit everything at once.
- **PWA**: service worker precaches `/`, `/index.html`, `/manifest.json` only (`public/service-worker.js:8-12`), network-first; hashed assets are never precached, so "installed" Praxis is not offline-capable.
- **Try-on image persistence**: `try_on_image_url` stores whatever Replicate returned (`Flow.tsx:829-860`, `userService.ts:355`); `imageUploadService.ts` (137 lines) exists but was outside the read scope — verify whether outputs are re-hosted; if not, history thumbnails will rot.
- `window.location.reload()` on Reset Style; 500ms sleeps after writes; `console.log` with emoji in hot paths.

---

## 11. TOP 10 IA / VISUAL-SYSTEM PROBLEMS (ranked by impact)

1. **The marketing funnel is broken and unreachable.** `/landing` has no inbound link; its hero CTA goes to `/app` → 404 (`Hero.tsx:21`, `App.tsx:37-45`); Early Access is a `setTimeout` (`EarlyAccess.tsx:16-17`); footer links are `#` (`Footer.tsx:14,17`). Anonymous visitors land on step 0 of a wizard with no explanation and no nav.
2. **Data isolation and secrets.** Supabase is queried with the anon key and no Clerk identity (`supabase.ts:11-13`), so ownership is enforced only by client-side `.eq('user_id')`; `VITE_OPENAI_API_KEY` is embedded in the browser bundle with `dangerouslyAllowBrowser` (`openaiService.ts:3-9`). Fix before any real users.
3. **Gating is asserted, not implemented.** The sign-in guard is a comment (`Flow.tsx:135-136`); `StepSignInPrompt` has 0 importers; anonymous users complete photo/biometric/try-on flows whose results are silently discarded (`if (user &&`, `Flow.tsx:766`, `StepStyleDNA.tsx:161`); protected pages bounce with no message (`History.tsx:51`, …); Dashboard isn't protected at all.
4. **Five pages for two jobs.** Dashboard = Flow step 1 + History teaser (with mislabeled occasions, `Dashboard.tsx:248-294`); Favorites = a History filter (`userService.ts:626`); Profile = a re-render of `StepStyleDNA`; Settings = a third theme control + placeholders (`Settings.tsx:93-98,182-202`). Each re-implements the same page header instead of using `ui/page-header.tsx`.
5. **Two headers, no wayfinding.** `Header.tsx` and `Flow.tsx:902-999` are divergent copies; nav items are `<button>`s with no active state or `aria-current`; the tagline sits under the logo on every screen; theme toggle appears twice on mobile; `useIsMobile` flashes the desktop nav on phones first (`use-mobile.tsx:6,17`).
6. **The Style DNA page is a template.** Identity phrase, "Lean into" and "Avoid" are hardcoded strings (`Profile.tsx:222-223,325-336,346-353`); the Gemini-generated copy is shown once (`StepStyleDNA.tsx:87-98`) and never persisted (`database.types.ts` has no field). The product's signature artifact is identical for every user on return.
7. **Split-brain visual system.** Tokenized type/spacing (`tailwind.config.ts:77-106`) used only on Landing; app pages run on `text-sm`×161/`text-xs`×88 and raw `pt-16 pb-8`; 21 hand-rolled cards vs 10 `<Card>` (mixed inside `Settings.tsx`); serif forced on all h1-h3 including `CardTitle`/`DialogTitle` with weights the font doesn't ship (`index.css:174-176`, `card.tsx:19`); stock destructive red (`index.css:34`); off-palette `blue-500` callout (`Settings.tsx:248`).
8. **Waiting is unmanaged.** Trend outfits: 4 serial model calls, one 120s response, nothing shown until all three images exist (`generate-trend-outfits.ts:143-150`); try-on: ≤100s synchronous (`replicate-generate.ts:5-7`); loaders are text lines; three polling loops (1s/2s/5s) and `setTimeout(500)` reconciliations stand in for state. The SSE plumbing that exists is unused and non-progressive.
9. **Global motion and dark-mode rules degrade feel.** 300ms transition on every element (`index.css:190-196`) makes hover/focus/selection sluggish and fights Radix animations; `.dark img { brightness(0.9) }` (`178-181`) dims the fashion imagery the app is about; no reduced-motion handling.
10. **Mobile ergonomics.** 32-36px targets throughout (`button.tsx:23`, `History.tsx:559,653`); fixed header ignores the top safe area in standalone mode (`Header.tsx:16`); centered square dialogs instead of sheets (`dialog.tsx:39`, `drawer.tsx` unused); History cards ≈500px tall with five stacked tap targets and `stopPropagation` plumbing; clickable divs unreachable by keyboard (`Dashboard.tsx:338`, `History.tsx:481`, `Favorites.tsx:102`).

Honourable mentions: `api/` carries 37 files for 7 live endpoints, committed esbuild artifacts and an in-memory session store on serverless (`biometrics.js:2-15`); two toast systems mounted (`App.tsx:31-32`) with one unused; 34 of 52 ui primitives unused (skeleton, drawer, tabs, badge, checkbox among them) while their jobs are hand-rolled; `favorites.outfit_id` favorites a catalog item, not a look; TanStack Query is installed and never used.

---

## 12. RETAIL MODE (`src/lib/retailMode.ts`)

A 22-line localStorage boolean (`praxis_retail_mode`, `retailMode.ts:6-21`) toggled by a `Switch` in Settings (`Settings.tsx:183-202`, copy: "Demo uses Praxis curated looks. Retail will use partner inventory (coming soon)."). `getRetailMode()` is read nowhere else in `src/` except Settings itself — the switch changes a flag no code consumes. It is a placeholder for a B2B "partner inventory" mode referenced on Landing ("For retailers: better decisions, fewer returns", `WhoItsFor.tsx:19-25`) and in `Outfit.retailer_ids` (`praxis.ts:287`). Today it only fires a toast.
