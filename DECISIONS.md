# HabitHatch build — decision log & run journal

Autonomous unattended build. This file records every non-obvious decision, what was
shipped, and what was parked. Newest entries at the bottom of each section.

## Environment (verified at start)
- Repo: `habithatch` on `main`, remote `github.com/WildanGhaly/habithatch` (viewer = ADMIN).
- `main` is **not** branch-protected (no required approvals) and squash-merge is allowed →
  delivery = feature branch → PR → self-review → squash-merge into `main` (per BUILD-PROMPT).
- Toolchain: node v24.14.1, npm 11.11.0, Java 21.0.4, Android SDK at
  `C:\Users\wilda\AppData\Local\Android\Sdk`, adb 1.0.41, AVDs incl. `pawductivity_x64`,
  `Medium_Phone_API_35`. gh authed as WildanGhaly.
- Template: `../Pawductivity` — a complete Expo SDK 57 / RN 0.86 app (the fork source).
- SOT: `prototype/habithatch_v1.html` (4260 lines, vanilla-JS single file).

## Key decisions
- **D1 — Fork, not rewrite.** Copy the Pawductivity Expo scaffold (config, `src/`, `android/`,
  reused assets) into the repo, then swap the core activity (focus timer → habit tracking) and
  reframe Journey → Garden. Per BUILD-PROMPT "Architecture reuse doctrine".
- **D2 — Prototype is law for pixels; PLAN.md is law for logic/numbers.** On conflict about
  *look*, the prototype wins; on conflict about *formulas/data*, PLAN.md wins. (They were
  authored to agree; the prototype's JS formulas were cross-checked against PLAN §7.)
- **D3 — Delivery via squash-merged PRs into main.** main is unprotected & solo-owned, and the
  charter explicitly authorizes it. GPG: use per-command `git -c commit.gpgsign=false` only if
  signing hangs.
- **D4 — Prototype's own JS is the behavioral SOT.** The prototype ships a complete `S` state
  model + formulas (`freshState`, `rollover`, `toggleHabit`, `coinsForCheck`, `isDue`, decay,
  hatch, garden, achievements). Transcribe these to TypeScript in `src/domain/*`; cross-check
  numbers against PLAN §7. Persistence is a **single-JSON snapshot** in a `kv` table (not
  per-entity tables) — so PLAN's "tables" (habits/habit_logs/day_summary/garden_plots) become
  arrays/maps inside `AppState`, exactly as the prototype's `S` holds them. This matches both
  the prototype and Pawductivity's real persistence.
- **D5 — Selective fork, not wholesale copy.** Reuse Pawductivity *infrastructure* verbatim/
  adapted: config (package/app/babel/tsconfig), nav shell (RootNavigator/Splash/MainScreen),
  generic components (ui, Icon, TabBar, OverlayHost, OverlayScreen, Toast, BottomSheet, CoinPile,
  PetSprite, PetView, SpeciesThumb), persistence, notifications, asset registry, `node_modules`.
  Write HabitHatch's `domain/`, `store/`, and every `screens/*` fresh from the prototype.
  Pawductivity stays a sibling read-only reference. Networked features (api/billing/auth: sync,
  referral, premium) kept as-is; they degrade offline and are parked per DoD.

## Parked / blocked
- (none yet)

## Milestones shipped
- **M1 — Domain layer + tests green.** `src/domain/{dates,types,catalogs,mechanics,actions,state}.ts`
  transcribe the prototype's `S` model + every formula 1:1 (refactored to pure functions taking
  `st` explicitly; `now` injected for testability). 18 unit tests pass via a
  `tsc → CommonJS → node --test` harness (`npm test`, no jest needed — Node 24). Covers
  rollover replay-safety, streak reset/freeze, multi-day decay, weekly freeze refill, hatch gate,
  coin formulas, idle jar, purchases, and the demo seed. This is the #1 build risk (PLAN §12), cleared.

- **D6 — Theme system.** `ThemeContext` + `useC()` hook returns the active palette
  (`paletteFor(profile.theme)`); screens compute styles from it. Prototype's 5 themes only
  remap the accent family. Default/free = `hatch`.
- **D7 — First run = real Onboarding (eggbound), not the demo seed.** The prototype's default
  seeds a mid-journey demo on first run (a reviewer convenience); PLAN §5 makes Onboarding a real
  screen and "every new account starts eggbound", and the egg→hatch journey is the core hook. So
  fresh installs go through Onboarding → `blankState` (eggbound). The mid-journey **demo seed**
  (`freshState(true)`) stays reachable via a triple-tap on the splash (proto dev-tap) for
  parity comparison against the prototype's demo Today and for showcasing.
- **D8 — Web phone-frame.** `DeviceFrame` renders the app inside a centered 440×940 rounded
  frame on the dark backdrop on web (≥480px), mirroring the prototype's `#device`, so Playwright
  parity shots line up. On device it fills the screen. Sheets/overlays render as absolute Views
  (not RN Modal) so they stay inside the frame on web.

## Testing
- `npm test` = `tsc -p tsconfig.test.json && node --test ".test-build/**/*.test.js"`. Domain
  compiled to CJS in `.test-build/` (gitignored) then run with Node's built-in test runner.
  Metro/app imports stay extensionless; only the test build uses CJS resolution. `@types/node`
  already in node_modules.

## Milestones shipped (cont.)
- **M2 — Scaffold boots + Today screen 1:1.** Forked Pawductivity infra (config, nav shell,
  components, PetSprite→PetView, tokens, assets, node_modules), wrote HabitHatch domain + store +
  theme + shell. Expo **web boots with 0 console errors**; verified via Playwright: Splash →
  Onboarding (category grid + species pick) and the full demo-seeded **Today** (fox rendered via
  SvgXml, segmented ring "3 of 6", mood/stage tags, idle-coin pile, care card + health, garden
  strip, habit rows w/ streak flame + reminder, week card, tiles, tab bar). Typecheck clean, 18
  domain tests pass. Placeholder stubs for the not-yet-built screens (editor/nursery/companion/
  garden/shop/insights/etc.). → PR1.
