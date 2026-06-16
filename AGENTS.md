# BrainShelf — Agent Guide

> **BrainShelf** is a personal **Android** app to play Google Drive video courses in a premium,
> distraction-free player (for me + family; sideloaded APK, no launch/monetization).
> `CLAUDE.md` imports this file. Full detailed plan: `~/.claude/plans/all-right-hey-so-crystalline-moler.md`

## ⚠️ Expo version

This project is **Expo SDK 54** (downgraded from 56 so Expo Go could run 0–1 — see rules). Read the
**v54** docs before writing Expo code → https://docs.expo.dev/versions/v54.0.0/ (Expo APIs change
between versions). **From Phase 2 the app runs as an EAS dev build, NOT Expo Go** (native modules).

## 📍 Status & Progress

**Current phase:** Phase 4 — v1 **code-complete** ✅ (icon/splash + standalone APK live; PiP dropped) · **➡️ NEXT SESSION: rebuild final `preview` APK (folds in the button fix) → install + confirm the "Complete" button on Motorola → distribute to family → mark Phase 4 ✅** · **Updated:** 2026-06-15

- [x] **M1 spike** — Drive streaming proven on **Android** (expo-video + Bearer + Range) ✅
- [x] **Phase 0 — Foundation** (A install libs · B Expo Router · C theme/fonts/UI kit) ✅
- [x] **Phase 1 — Premium player** (A foundation · B controls/gold scrubber · C gestures · D landscape) ✅ (E → Phase 2.4)
- [x] **Phase 2 — Google auth + live Drive library** (EAS dev build) ✅ (PiP deferred)
  - [x] 2.0 EAS dev build · 2.1 Google Cloud OAuth · 2.2 Google Sign-In · **401 mid-stream refresh** · 2.3 live adaptive Drive library · 2.4 background audio — all ✅ **verified on-device 2026-06-13**
  - [x] 2.5 **close-out** — quality gate passed: `tsc` clean (strict + noUnusedLocals/Params), DRY extractions applied, no dead code ✅ 2026-06-14
  - [x] **★ Pin folders** (added during close-out) — `lib/pinnedFolders.ts` + `PinnedRail` + star toggle on folder rows; persisted ✅ verified on-device 2026-06-14
  - [x] 2.4 **PiP — DROPPED for v1** (per user 2026-06-15). Config is correct (`supportsPictureInPicture: true`) but the window won't pop on-device even in the standalone build → likely a vendor restriction (Samsung/Motorola). Background audio works and is enough; not worth chasing.
- [x] **Phase 3 — Resume/progress · mark-complete · offline downloads** ✅
  - [x] **Progress/resume + mark-complete** — per-lesson position+completion (AsyncStorage), silent auto-resume + "Resumed at" pill, 90% auto-complete + manual ✓ toggle, ring+% / ✓ on lesson rows ✅ verified on-device 2026-06-14
  - [x] **Offline downloads** — per-lesson download (Bearer + live %), play local when present, Downloads tab (size · total · delete), size label + confirm on the download tap ✅ verified on-device 2026-06-14
- [~] **Phase 4 — Polish + APK** ← IN PROGRESS
  - [x] **Icon + splash** — custom Obsidian icon (gold books+play): `assets/icon.png` (full) + adaptive foreground (transparent symbol) on `#050505` + `expo-splash-screen` (symbol on `#050505`) ✅ live on-device 2026-06-15
  - [x] **Standalone APK** — `eas.json` `preview` (internal + `buildType: apk`) → installable APK built + running on Samsung / Motorola / Realme (full app, standalone) ✅ 2026-06-15
  - [x] **Button no-wrap fix** — `Button` label `numberOfLines={1}` + shortened "Complete" (it wrapped to 2 lines on some devices); tsc clean — **ships in the next rebuild**
  - [ ] **Final APK + family (next session)** — rebuild `preview` (folds in the button fix) → install + confirm the "Complete" button on Motorola → share the APK (each signs in with their own Google + sets their folder). **PiP dropped** for v1.

## ▶️ Current state (what exists right now)

- Expo **SDK 54** + TS + **Expo Router**, runs as an **EAS dev build** (expo-dev-client) on Android. tsc clean. (Expo Go no longer usable — native Google Sign-In + AsyncStorage.)
- **Entry:** `package.json` `main` = `expo-router/entry`. `babel.config.js` = `babel-preset-expo` + `react-native-worklets/plugin` (last).
- **Routes (`app/`):**
  - `app/_layout.tsx` — root Stack, `GestureHandlerRootView`, dark bg `#050505`, headers off. Calls `restoreSession()` (silent Google sign-in) on launch.
  - `app/(tabs)/_layout.tsx` — bottom tabs **Library / Downloads / Settings**, gold active tint.
  - `app/(tabs)/index.tsx` (**Library**) — gated: not signed in → Connect Google · no root folder → "set it in Settings" · else → `<FolderView>` of the root folder.
  - `app/(tabs)/settings.tsx` — Google account (email + Sign out / Connect) + **Course folder** paste-input (Drive link/ID → saved, shows resolved name).
  - `app/(tabs)/downloads.tsx` — **Downloads** manager: lists downloaded + in-flight lessons (size · total · delete); tap a finished one → plays the local file.
  - `app/folder/[id].tsx` — folder route (back header + name) rendering `<FolderView>` (the adaptive browser at any depth).
  - `app/player/[id].tsx` — player route. Fetches a fresh token via `getAccessToken()` (loading + error states); fileId via param, token never in the URL.
- **Adaptive browser (2.3):** `components/FolderView.tsx` — the **one reusable component**: lists a folder's subfolders (tap → push `/folder/[id]`) + `video/*` (tap → push `/player/[id]`), pull-to-refresh, skeletons. Library = FolderView at the root; every deeper level is the same component. In-memory cache → instant back-nav.
- **Design system:** `theme/obsidian.ts` (colors/space/radius/font/text/motion) · `components/ui/` = `Screen`, `Text`, `Button`, `Card`, `ProgressRing`, `Skeleton` (+ barrel).
- **Player (Phase 1 + 2):** `components/player/` = `VideoPlayer` (expo-video + Bearer + `progressive` + `preservesPitch`; **401 recovery** — on `error`, refresh token → `player.replace()` → resume at last position, capped at 2 + "Reconnecting…"; **2.4** `staysActiveInBackground` + `startsPictureInPictureAutomatically`), `PlayerControls`, `Scrubber`, `SettingsSheet`. Gestures: double-tap ∓10s, hold-to-2×. Fullscreen = landscape `Modal` via `expo-screen-orientation`.
- **Stores (shared):** `lib/createStore.ts` (reactive `useSyncExternalStore` core) + `lib/createPersistedStore.ts` (AsyncStorage-backed: lazy-load + persist) — the single store pattern behind `auth`, `rootFolder`, `pinnedFolders`.
- **Auth (2.2):** `lib/auth.ts` — Google Sign-In via `@react-native-google-signin`, built on `createStore` (`useAuth()` → `{user, ready}`) + `signIn`/`signOut`/`restoreSession` + `getAccessToken()`. webClientId + `drive.readonly`.
- **Drive (2.3):** `lib/drive.ts` — `listFolder(id)` (paginated, Bearer, splits folders vs `video/*`, numeric sort, strips "Copy of "), `extractFolderId(link|id)`, `getFolderName(id)`, shared `driveFetch()` helper, cached `useDriveFolder()` hook. `lib/rootFolder.ts` — root course folder persisted via `createPersistedStore` (`useRootFolder`/`setRootFolder`; migration-safe raw-id codec).
- **Pinned folders (★):** `lib/pinnedFolders.ts` (`usePinnedFolders()` → `{pinned, ready}` + `togglePin`, persisted via `createPersistedStore`) · `components/PinnedRail.tsx` (fixed-height horizontal rail atop Library; tap → open, long-press → unpin) · star toggle on folder rows in `FolderView`.
- **Progress (Phase 3):** `lib/progress.ts` — per-lesson `{position, duration, completed}` keyed by fileId, persisted via `createPersistedStore` (`getProgress`/`saveProgress`/`toggleComplete` + `useLessonProgress` selector). `VideoPlayer` silently auto-resumes (skip <5s / restart if ~finished) + saves throttled (5s) & on unmount + 90% auto-complete; `FolderView` lesson rows show a gold ring+% (in-progress) or ✓ (done); player route has a Back / Mark-complete toggle row.
- **Downloads (Phase 3):** `lib/downloads.ts` — `startDownload`/`deleteDownload` + `useDownload`/`useDownloadsMap`/`getDownload`; in-memory live progress + completed records persisted (AsyncStorage); saved to `documentDirectory/downloads/<fileId>.mp4` via **`expo-file-system/legacy`** `createDownloadResumable` (Bearer + progress callback — the new `File` API has `headers` but no progress). Lesson rows have a download control + size label + confirm; `VideoPlayer`/player route play the **local file** when downloaded (no token, 401-recovery skipped). `lib/format.ts` = shared `formatBytes`.
- **Fonts:** **Inter** only — display 700/800 + body 400/500/600, loaded in `_layout`; splash held until ready.
- **Branding (Phase 4):** custom app icon `assets/icon.png` (gold books+play on dark) · Android adaptive = transparent foreground `assets/android-icon-foreground.png` on `#050505` · `expo-splash-screen` shows `assets/splash-icon.png` (the symbol) on `#050505`. (Expo default `android-icon-background/monochrome.png` removed.)
- **Reference (not entry):** `App.tsx` = M1 spike player.
- **Installed (SDK-54-aligned):** expo-router, react-native-reanimated@4.1.1 (+worklets@0.5.1, **exact-pinned**), gesture-handler, moti, @shopify/flash-list, expo-image, expo-font, expo-haptics, expo-linear-gradient, expo-blur, @expo/vector-icons, react-native-svg@15.12.1, @expo-google-fonts/inter, expo-splash-screen, expo-screen-orientation@9.0.9.
  **Phase 2 added:** expo-dev-client (~6.0.21) · @react-native-google-signin/google-signin (^16.1.2, config plugin auto-added) · **@react-native-async-storage/async-storage**.
  **Phase 3 added:** expo-file-system (~19.0.23) — autolinked; **no rebuild was needed** (native already bundled via Expo core — see gotcha).
  Core: react@19.1.0, react-native@0.81.5, typescript@5.9.3.

## ⏭️ Remaining work — PLAN

**⏸️ PiP — DEFERRED to the very end (after all phases, per user 2026-06-14).** Code is in (`staysActiveInBackground` + `startsPictureInPictureAutomatically`; expo-video plugin flags baked into the build). Background audio ✅ works, but the floating window never appeared on-device even with **Settings → Apps → BrainShelf → Picture-in-picture** enabled. When revisited (with the Phase 4 rebuild): confirm a **PiP entry exists** for the app (else the manifest flag didn't land → check `expo-video` plugin config + rebuild), then play → **Home** → expect the floating window.

**2.5 — Close-out ✅ (2026-06-14).** Quality gate passed: `tsc` clean (strict + noUnusedLocals/Params). DRY extractions applied — `lib/createStore.ts` + `lib/createPersistedStore.ts` (shared by auth/rootFolder/pinnedFolders) and `driveFetch()` in `lib/drive.ts`. No dead code. KISS: `VideoPlayer` (~348 lines) left as-is — cohesive, flagged for a future hook-extraction if it grows. **Added ★ pin-folders feature** during close-out.

**Phase 3 ✅ DONE (2026-06-14).** Progress/resume + mark-complete (`lib/progress.ts`) and offline downloads (`lib/downloads.ts` + Downloads tab + local playback). Decisions taken: AsyncStorage (not expo-sqlite) · silent resume · per-lesson watch UI · **per-lesson downloads** (not per-course/queue) · `expo-file-system/legacy` for its progress callback · confirm-on-download showing size. **No EAS rebuild was needed** (native already present — see gotcha). v1 limitations kept: downloads run while the app is open (no background/queue/auto-resume).

**Phase 4 — IN PROGRESS (polish + APK).**
- [x] **Icon + splash ✅ (2026-06-15)** — custom gold-on-dark icon (books+play) wired in `app.json`: `icon` + adaptive (transparent foreground on `#050505`) + `expo-splash-screen`. Live on-device.
- [x] **Standalone APK ✅ (2026-06-15)** — `eas.json` `preview` (`distribution: internal` + `android.buildType: apk`) → installable APK via `npx eas-cli build --profile preview --platform android`. Built + running on Samsung/Motorola/Realme.
- [x] **Button no-wrap fix ✅** — `Button` `numberOfLines={1}` + "Complete" label; awaiting the next rebuild to reach the phones.
- [ ] **Final APK + family (NEXT SESSION — start here)** — rebuild `preview` (folds in the button fix) → install + confirm the "Complete" button on Motorola → distribute (EAS link / share the APK); each signs in with their own Google + sets their folder → then mark Phase 4 ✅.
- [x] **PiP — DROPPED for v1** (per user 2026-06-15): config is correct but it won't pop on-device (vendor restriction); background audio works and is enough.
- v1 essentially shippable. Future-only (out of v1): search, notes/bookmarks, iOS, casting, per-course download queue, background downloads.

## Key decisions & rules (don't re-litigate)

- **Android-only for now.** iOS deferred: AVPlayer can't send auth headers ([expo #29436](https://github.com/expo/expo/issues/29436)) → "cannot open". Fix later via on-device proxy.
- **No backend.** App talks **directly to Google Drive** on-device.
- **Aesthetic:** Obsidian Vault (dark + gold). **Expo SDK 54** — do NOT upgrade to 56. Node 24.
- **Dev build (EAS)** required from Phase 2 (native). Expo Go was fine for 0–1 only.
- **v1 scope:** browse + player(hold-2×) + resume/progress + mark-complete + offline. **Deferred:** search, notes/bookmarks, iOS, casting.
- **Adaptive folder browser, NOT fixed Course→Section→Lesson.** The real Drive is heterogeneous (videos-directly, section subfolders, and a "Tech Courses" *category* of sub-courses). One `FolderView` recurses via routing → handles any depth.
- **Auth = Google Sign-In** (`@react-native-google-signin`), not expo-auth-session. `webClientId` = the **Web** OAuth client; Android client matched natively by package + SHA-1 (not in code).
- **OAuth tokens are NOT stored by us** — Google Play Services holds the grant + refreshes the ~1h token. `getAccessToken()` fetches fresh per request. `signOut()` keeps the grant (easy re-login); `revokeAccess()` (unused) would force re-consent.
- **Unverified-app screen accepted** (sensitive scope `drive.readonly`). One-time per account (Advanced → Go to BrainShelf). Internal isn't viable on a personal @gmail.com (Workspace-only + blocks family); Production keeps it one-time (Testing re-triggers every 7 days). Verification deferred.
- **Drive data layer = plain hooks + in-memory cache** (`useDriveFolder`), not TanStack Query. Freshness via cache-clears-on-restart + pull-to-refresh. **Migration trigger:** adopt `@tanstack/react-query` if we hit real pain with caching/dedup/retries/pagination or scale up (fetch fns stay identical → wrap in `useQuery`; pure-JS, no rebuild).
- **EAS project:** `@kurana/BrainShelf` · `projectId` `ecf7b904-d8b4-4caa-a1c1-ca7e446d1d28` (in `app.json`) · `android.package` `com.brainshelf.app` · keystore SHA-1 `28:47:E1:67:8A:23:3A:A0:D3:FC:78:FA:80:1E:C6:50:17:1D:04:02`.

## 🪤 Gotchas learned (save yourself the pain)

- A custom `babel.config.js` needs **`babel-preset-expo` as a direct devDependency** (transitive isn't enough). Same with **`@expo/vector-icons`** (direct dep). Symptom: Metro "Cannot find module 'X'".
- After babel/config/entry changes → **`npx expo start -c`** (clear Metro cache).
- **Reanimated 4** babel plugin = **`react-native-worklets/plugin`** (last in babel.config).
- Install ANY new dep with **`npx expo install <pkg>`**. **NEVER `npm audit fix --force`** — jumps to expo@56, breaks everything. The **17** moderate vulns are dev-only Expo tooling (postcss + uuid roots) — leave them.
- **Reanimated ↔ Worklets must match Expo Go/native (SDK 54 = worklets 0.5.1).** Keep `react-native-reanimated@4.1.1` + `react-native-worklets@0.5.1` **exact-pinned** (`--save-exact`) or npm floats them → TurboModule install crash. `expo install --check` misses it (worklets is transitive).
- **expo-video `preservesPitch`** defaults true but isn't applied on Android until set explicitly (`player.preservesPitch = true`) — else chipmunk audio at >1×.
- **expo-video `useEvent(player, 'timeUpdate', initial)`** needs ALL payload fields in the initial value, else it types as `… | null` and destructuring fails (tsc error).
- **Custom player controls:** `nativeControls={false}`; fullscreen via `expo-screen-orientation` + landscape `Modal` (native `enterFullscreen()` drops the custom overlay).
- **Native deps need a dev-build rebuild** (Google Sign-In, AsyncStorage, expo-video background/PiP config). JS-only changes just reload over Metro. `expo install` auto-adds config plugins to app.json.
- **…but `expo-file-system` needed NO rebuild on SDK 54** — its native module is already bundled via Expo core (`expo-asset` → `expo-file-system`), so `expo install expo-file-system` only added the JS layer and a Metro reload ran it. The rule above only forces a rebuild for native code **not already** transitively in the build. Use **`expo-file-system/legacy`** for `createDownloadResumable` (the new `File`/`Directory` API has `headers` but **no progress callback**).
- **`eas build:configure` & first `eas build` prompt interactively** (create project / generate keystore) — run yourself, or `eas build … --non-interactive` (auto-generates keystore).
- **Standalone APK = the `preview` profile** (`distribution: internal` + `android.buildType: apk`) via `npx eas-cli build --profile preview --platform android` (no global eas-cli needed). Reuses the project keystore → Google SHA-1 still matches. The trailing **"Install on an emulator? no"** prompt is just an optional local-emulator install — **no** is correct; install on the phone via the printed **EAS link / QR**. `preview` builds are standalone (no Metro) → a JS fix only reaches them via another rebuild.
- **Asset filenames must be clean** (no spaces/commas) — Metro/EAS choke on paths like `ChatGPT Image ….png`; use `icon.png` etc. Adaptive icon: drop `backgroundImage` so the dark `backgroundColor` shows, and give a **transparent** foreground.
- **Android PiP permission is a manual per-app toggle** (Settings → Apps → BrainShelf → Picture-in-picture) — Android does **NOT** runtime-prompt for it; auto-PiP won't fire until it's on. Background audio is independent (`staysActiveInBackground` + `supportsBackgroundPlayback`).
- **Opening the dev-server URL in a browser** → `Unable to resolve "react-native-web/…"` in Metro. Harmless (web target isn't installed; Android-only). Connect via the **BrainShelf app**, not a browser.

## Working agreement (from the user — IMPORTANT)

- **Plan → user approves → then act.** Show every concrete command/file **before** running/writing. **No silent actions** (including read-only `ls`/reads). The user is deliberate — wait for an explicit "yes / go ahead" before each action.
- Run **`npm audit`** after installs and report (package-safety matters).
- Keep this **Status** section updated as steps complete (the user relies on it for continuity).

## End-of-phase quality gate (run before closing EVERY phase)

Before marking any phase ✅, do a code-quality pass over that phase's surface and apply the quick wins:
- **`npx tsc --noEmit` clean**, with `noUnusedLocals` + `noUnusedParameters` on.
- **DRY** — no duplicated logic/constants; extract shared helpers/hooks.
- **KISS** — small, focused components; split a file when it does too much.
- **Dead code** — delete unused files/exports/imports; no leftover scaffolding shipped.
- **Structure** — files in the right folder per Conventions; barrels consistent.
- **Standards** — typed, clear names, consistent styling.

Record findings + fixes in the Status section, then close the phase.

## How to run / test

- **Dev build (Phase 2 on):** `npx expo start --dev-client -c` → open the **BrainShelf** app (auto-discovers the server on the same Wi-Fi, or enter `http://<mac-lan-ip>:8081`). **Not Expo Go**, **not a browser**. Rebuild (`eas build --profile development --platform android --non-interactive`) **only** when native config/deps change.
- **Auth:** Settings (or Library) → **Connect Google** → first time only, tap *Advanced → Go to BrainShelf* past the unverified-app screen.
- **Set the course folder:** Settings → **Course folder** → paste the root link/ID → Save (shows the resolved name).
- **Test root folder** (user's Drive): `Courses(tele)` = `https://drive.google.com/drive/folders/1oSFO1QMIRKPim2VNCJzvZ8M14ZikLDaX`.

## Proven facts & gotchas — Google Drive

- **Stream URL:** `GET https://www.googleapis.com/drive/v3/files/{FILE_ID}?alt=media` + header `Authorization: Bearer <token>`. Honors **Range → 206**. Works on Android.
- **List a folder:** `GET /drive/v3/files?q='<id>' in parents and trashed = false&fields=...&orderBy=name` + Bearer; folder mime = `application/vnd.google-apps.folder`, lessons = `video/*`. Paginate via `nextPageToken` (we fetch all pages).
- **iOS:** "cannot open" — AVPlayer drops the header. Deferred.
- **Token-in-URL** (`?access_token=`): Drive returns **403** — don't use.
- **OAuth:** scope `drive.readonly`; consent screen **External + Production** (avoids 7-day token expiry). Real auth is live (`lib/auth.ts`). Debug fallback token: https://developers.google.com/oauthplayground.
- **Real library shape (`Courses(tele)`, owner ranakushaal@gmail.com, ~26 courses):** **heterogeneous depth** — some courses hold videos directly (e.g. "System Design Beginners" = 36 mp4s, no sections), some have section subfolders, and "Tech Courses" is a *category* of sub-courses. (Why the adaptive browser, not fixed levels.) Also a couple of non-course items (loose Google Docs, "Iphone BackUp Photos") sit in the root — app ignores non-videos; non-course folders just open empty.
- **Lesson filenames** like `Copy of 32. Designing URL Shortner.mp4` → strip "Copy of " + **numeric sort** (2 before 10) — handled in `lib/drive.ts`.
- **Test files:** 142 MB lesson → `1PRXn3LY6IXj0EEF8_b9QeRPz7M7LM4CD` · ~2.1 GB → `1hFKe7NaVwfqcsXUB-s4xETzzGUsQ0Gud`.

## Design tokens — Obsidian Vault

- bg `#050505` · surface `#1A1A1A` · elevated `#2A2A2A` · **gold `#D4AF37`** · text `#F5F5F5` · muted `#A1A1AA` · hairline `#27272A` · danger `#E5484D`
- Fonts: **Inter** — display/titles (700/800) + body/UI (400/500/600) · mono for timecodes.
- Motion: tactile press `scale 0.97` (spring), gold progress rings, skeleton shimmer, haptics.

## Conventions

- `app/` (Expo Router screens) · `components/` (UI kit in `ui/`, feature components like `FolderView`/`PinnedRail`, player in `player/`) · `lib/` (`auth`, `drive`, `rootFolder`, `pinnedFolders`, `progress`, `downloads`, `format`, `createStore`/`createPersistedStore`) · `theme/obsidian.ts` (tokens).
- TypeScript throughout. **`react-native-worklets/plugin` must be last** in `babel.config.js` (Reanimated 4).
- Type-check with `npx tsc --noEmit` before declaring a step done.
