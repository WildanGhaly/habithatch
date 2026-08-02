# Claude Code build prompt — HabitHatch app (1:1 from the prototype)

Use this in the `habithatch` repo (Claude Code). It builds the real Android app 1:1 from the
HTML prototype, exactly as Pawductivity was built from its own prototype. **Self-sufficient:**
if `prototype/habithatch_v1.html` exists (e.g. generated via `PROTO-PROMPT.md`) it is used as the
pixel source of truth; if it does not exist, the prompt generates one first, so this can be pasted
and left to run overnight with nothing else prepared.

Suggested kickoff: `/orchestrate` wrapping `/full-auto` around `/fe-build` (mobile-adapted) +
expo-sqlite integration + `/bug-hunter` + `/auto-pr`. Or paste the prompt below directly.

---

## THE PROMPT (copy everything below)

AUTONOMY — UNATTENDED RUN (read this first, it governs everything below)
Work fully autonomously from here to done. The user is AWAY for 10+ hours (running for a full day
is completely fine) and CANNOT answer anything — so do NOT ask questions, do NOT wait for
confirmation, and do NOT stop for approval at any point. Resolve every ambiguity yourself with
pragmatic senior-engineer judgment and record it in a running decision log. You are pre-authorized
to do whatever the build needs locally: install dependencies, scaffold the Expo app, run prebuild,
builds, linters, type checks, tests, the Android emulator, Playwright/browser verification, start
background dev servers, and deliver via the PRs described under DELIVERY. When something genuinely
needs the user (a missing secret, a destructive action outside this scope, a hard external outage),
PARK it — write down what is blocked, why, what you tried, and the exact next step — then keep going
on everything else; never halt at the first obstacle. Spend the whole time budget on depth,
verification, edge cases, and polish, not on stopping early. Keep a live todo list and COMMIT at
every green milestone so hours of work can never be lost. Finish with ONE honest report: what
shipped, what was parked (with exact next steps), and every decision you made. (If the `/full-auto`
skill is available, run under it; the charter is this prompt.)

STEP 0 — ENSURE A PROTOTYPE EXISTS (do this before anything else)
If `prototype/habithatch_v1.html` already exists, it is the pixel + behavior source of truth —
match it exactly. If it does NOT exist, first AUTHOR it yourself: a single self-contained,
interactive HTML prototype of HabitHatch (phone-frame, vanilla JS, all screens clickable) built
from `PLAN.md` + the art in `assets/` + the Pawductivity design system (`assets/reused/tokens.ts`),
at the fidelity of Pawductivity's own `prototype/pawductivity_v1.html`. Save it to
`prototype/habithatch_v1.html` and commit it. Either way, the app is then built 1:1 from that file.

Build **HabitHatch**, a gamified daily-habit-tracker Android app, as a production-grade
Expo / React Native application, implemented **1:1 (pixel-perfect and behavior-for-behavior)
from `prototype/habithatch_v1.html`** (the file guaranteed to exist by Step 0), which is the single
source of truth for layout, visual design, screens, copy, and interactions. This mirrors exactly how
Pawductivity was built from its own `prototype/pawductivity_v1.html`.

### Inputs (all in this repo)
- **`prototype/habithatch_v1.html`** — the pixel + behavior SOT. Match it exactly. When it and
  the plan disagree on look, the prototype wins.
- **`PLAN.md`** — the full product spec: the 16 screens, the data model, the coin/health/streak
  formulas, the egg-hatch flow, the 8-plot Habit Garden, the 12 achievements, notifications, the
  4-week roadmap. This is authoritative for logic, numbers, and data.
- **`assets/new/`** — 20 concept SVGs (egg-whole/crack/hatch, 11 `cat-*` habit icons,
  habit-ring/checkbox, streak-flame, garden sprout/tree/orchard).
- **`assets/reused/`** — art + **code seeds** reused from Pawductivity:
  - `tokens.ts` — design tokens (colors, radii, shadow, Poppins). Port in verbatim.
  - `catalogs.ts` — the catalog shape (foods, clothes, species, JOURNEY, ACHIEVEMENTS). Reframe
    JOURNEY → the Habit Garden and the achievement triggers → habits, keeping the structure.
  - `PetSprite.tsx` — the **reanimated UI-thread pet engine** (single frame-clock + detuned sine
    oscillators writing the SVG `<G>` native `matrix` prop). Port it as-is for fox/penguin/axolotl;
    dog/cat animate via a `PetView` Lottie renderer using the JSON in `reused/lottie/`.
  - `pets/`, `economy/`, `icons/` — the shared art.

### Tech stack (match Pawductivity exactly)
- Expo SDK 57, React Native 0.86, React 19, TypeScript, Hermes, **New Architecture (Fabric) on**.
- **Offline-first**, no backend. Persistence: **expo-sqlite** (snapshot-of-state model). State:
  **zustand + immer**, a single `AppState` persisted to SQLite.
- Pet animation: **react-native-reanimated 4 + react-native-svg 15** (the `PetSprite.tsx` engine).
- **expo-notifications** (channels, scheduled RTC_WAKEUP alarms, kill-survival), expo-audio if a
  soundscape is used.
- Custom tab/screen/overlay navigation (NOT react-navigation) — mirror Pawductivity's
  `MainScreen` + `TabBar` + `OverlayHost` shell.

### Architecture reuse doctrine (this is a fork, not a rewrite)
If the Pawductivity source is available as a sibling folder, use it as the **template**: copy its
Expo scaffold, `tokens.ts`, `PetSprite.tsx`/`PetView`, and the reusable components
(`TabBar`, `BottomSheet`, `CoinPile`, `OverlayHost`, `Toast`, `RewardOverlay`, `SpeciesThumb`,
`QuestRow`), then swap the core activity. Otherwise scaffold a fresh Expo app on the stack above
and port the seeds in `assets/reused/`. Component mapping:
- Focus timer → **Habit list + check-off** (reshape `QuestRow` → `HabitRow` with the
  `habit-ring`/`habit-checkbox` + per-habit `streak-flame`).
- Focus session earn → **coins per check-off** (`5 + min(floor(habitStreak/3),5) + daily?1:0`) and
  the **end-of-day all-clear** bonus; guard `all_clear` so empty-schedule days don't advance the
  streak (see PLAN §7.1).
- Pixel's Journey → **Habit Garden** (8 plots, same cost/perk/idle-jar/decay machinery).
- Onboarding species pick → **starter-habits pick + the egg**; implement the signature
  **egg-whole → egg-crack → egg-hatch** reveal in the reused `RewardOverlay`.
- Keep the coin economy, shop (Food/Companions/Wardrobe), Feed sheet, achievements, insights,
  idle-jar, and streak-freeze mechanics; reframe copy for habits per PLAN.md.

### Fidelity requirement
Pixel-perfect 1:1 with `prototype/habithatch_v1.html`: spacing, type scale, colors, radii,
shadows, the phone-frame content, every screen, every state, every animation. Verify by
comparing the rendered app against the prototype (Expo web + Playwright, and the Android
emulator) — iterate until they are indistinguishable. Do NOT redesign; the prototype is law.

### Data & correctness
Implement the full PLAN.md data model in SQLite (`habits`, `habit_logs`, `day_summary`,
`garden_plots`, plus the `pet`/`profile` extensions incl. `hatch_state`, `overall_streak`,
`last_freeze_refill`). All day-rollover / streak / decay / hatch logic must be a pure,
unit-tested `rollover(state, fromDate, toDate)` using **local `YYYY-MM-DD` strings (never UTC)**,
correct across multi-day gaps, DST, and timezone changes. Notifications (habit reminders, evening
streak-save, the hatch nudge) must survive app kill via persisted schedule state.

### Known gotchas from the Pawductivity build (don't rediscover these)
- Animate the SVG `<G>` **`matrix`** prop from worklets, NOT `rotation`/`transform` — only `matrix`
  reaches native on Fabric; `GProps` needs a `matrix?: number[]` module augmentation.
- Drive all part motion from ONE `useFrameCallback` clock that **accumulates** speed-scaled
  `timeSincePreviousFrame` (not absolute time × speed), wrapped in `useCallback`, so a re-render or
  mood change can't zero or teleport the animation.
- `babel.config.js` = `presets: ['babel-preset-expo']` only (SDK 57 auto-adds the worklets plugin;
  don't add it twice). New Architecture must stay enabled.
- First release build recompiles reanimated native for 4 ABIs (~30 min cold, then cached) and can
  OOM the Gradle daemon — set `android/gradle.properties` `org.gradle.jvmargs=-Xmx5120m …`,
  `org.gradle.parallel=false`, and pass `--max-workers=2`. Enable R8 + ship the mapping file;
  smoke-test the minified build on-device.

### Delivery
Ship in **PRs into `main`** with squash-merge (auto-merge if the repo is configured for it),
self-assigned, short semantic English commit messages. If GPG signing hangs unattended, commit
with a per-command `git -c commit.gpgsign=false` override (scoped, never a global config change).
Branch per unit of work; never force-push.

### Definition of done
- All ~16 screens from the prototype implemented 1:1 and verified against it.
- Full offline SQLite persistence; the gamified loop works end-to-end (check habit → coins →
  feed/grow pet → egg hatch → streaks → garden → shop → achievements) with correct rollover.
- The reanimated pet animates smoothly on the UI thread (fox/penguin/axolotl), parts attached,
  no jank; dog/cat via Lottie.
- Typecheck clean; a signed release AAB builds and runs (R8) on the emulator; reminders survive
  app kill. Referral/premium can be stubbed with logic parked and documented.
- Deliver end-to-end; verify in a real browser and the Android emulator; no stubbed screens.

Build it 1:1 from the prototype now.
