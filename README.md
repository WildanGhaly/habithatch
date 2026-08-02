# HabitHatch 🥚

A gamified daily-habit tracker for Android: check off your habits, earn coins, and raise a
companion that **hatches from an egg** after your first 3-day streak and thrives on your
consistency. A spin-off of [Pawductivity](https://github.com/WildanGhaly/pawductivity) that
reuses its virtual-pet engine, coin economy, care loop, and design system, retargeted from a
focus timer to habit tracking.

## Status: built ✅

The full Expo / React Native app is built **1:1 from `prototype/habithatch_v1.html`** and
delivered across PRs #1–#7. All ~16 screens, the offline SQLite gamified loop, the reanimated
UI-thread companion, notifications, and 5 themes are implemented. A **signed release AAB (R8)**
builds and the release APK runs standalone on the Android emulator. See
[`REPORT.md`](./REPORT.md) for the full build report and [`DECISIONS.md`](./DECISIONS.md) for the
decision log.

```bash
npm run web         # Expo web (the pixel-parity target)
npm test            # 18 domain unit tests (rollover / streaks / decay / hatch / coins)
npm run typecheck   # tsc --noEmit
npx expo run:android                          # dev build on device/emulator
cd android && ./gradlew :app:bundleRelease    # signed release AAB (needs the local keystore)
```

## App structure

```
App.tsx / index.ts          Expo entry; fonts, hydrate, ThemeProvider, nav
src/
  domain/                   Pure, unit-tested game logic ported from the prototype S-model:
                              dates, types, catalogs, mechanics, actions (rollover/check-off/
                              hatch/coins/garden), state (blank + demo seed), domain.test.ts
  store/store.ts            zustand + immer over a single-JSON expo-sqlite snapshot
  theme/                    tokens + ThemeContext (5 accent themes via useC())
  db/persistence.ts         kv-table snapshot persistence (native sqlite / web localStorage)
  art/                      inlined SVG icon + art registries (rendered via SvgXml)
  components/               ui, Icon, Art, TabBar, OverlayHost, BottomSheet, RoomStage, HabitRow,
                              Ring, RewardOverlay, Toast, PetSprite (reanimated), PetView, DeviceFrame
  screens/                  Splash, Onboarding, MainScreen (Today/Habits/Companion/Garden tabs),
                              Editor/Goal/Feed/Buy sheets, Shop/Insights/Achievements/Profile/
                              Premium/Referral/Recap/Appearance/Nursery overlays
  notifications/            per-habit reminders + evening/streak/hatch/hunger nudges
android/                    prebuilt native project (New Arch/Fabric, R8, release signing)
build-notes/               per-screen prototype specs + Pawductivity fork guides (build contract)
```

## Concept & spec (source material)

```
PLAN.md                     Full 13-section product spec (screens, data model, economy, roadmap)
PROTO-PROMPT.md / BUILD-PROMPT.md   The prompts that generated the prototype and this app
prototype/habithatch_v1.html        The 1:1 pixel + behavior source of truth
assets/
  new/                      20 concept-specific SVGs (egg stages, habit icons, garden, streak flame)
  reused/                   Art + code seeds reused from Pawductivity:
    pets/                     fox/penguin/axolotl SVG + dog/cat PNG + pet_home
    economy/                  coin, food, clothes, shop art
    icons/                    shared UI glyphs
    lottie/                   dog/cat Lottie companions
    tokens.ts                 design tokens (colors, radii, shadows, fonts) — copy in
    catalogs.ts               foods/clothes/species/journey/achievements catalog shape
    PetSprite.tsx             the reanimated UI-thread pet engine (matrix + sine oscillators)
reference/
  PAWDUCTIVITY-INVENTORY.md  what Pawductivity provides and how to reuse it
  concept-board.png          rendered board of the pet + all HabitHatch assets
```

## Tech target
Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · Hermes · New Architecture ·
offline-first `expo-sqlite` · zustand + immer · `react-native-reanimated` 4 +
`react-native-svg` (UI-thread pet engine) · `expo-notifications` · Android-first.

No backend — everything is local.
