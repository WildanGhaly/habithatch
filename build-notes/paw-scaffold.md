# Paw Scaffold — Fork Guide (Expo entry, New-Arch/Fabric config, fonts, splash, boot)

How the Pawductivity Expo/React-Native app **boots**, and exactly what to change when
forking it 1:1 into **HabitHatch**. Scope: the scaffold layer only — `index.ts`, `App.tsx`,
`app.json`, `babel.config.js`, `tsconfig.json`, `eas.json`, `package.json`, and the boot
partners it pulls in (`RootNavigator`, `SplashScreen`, `store`, `persistence`, `registry`,
`notifications`). Everything here is ~80% reuse-verbatim; the deltas are name/id strings and
one persistence DB name. The *domain* changes (habits, egg-hatch, garden) land in the store
and domain layers, which this scaffold merely wires up.

Source root: `d:/Documents/Work/Project/Pawductivity/`.
There is **no `metro.config.js`** — the repo uses Expo's default Metro config (nothing to fork).

---

## 1. WHAT'S HERE — file responsibilities + key exports

### `index.ts` — the native entry point
```ts
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App); // == AppRegistry.registerComponent('main', () => App)
```
Single statement. `registerRootComponent` normalizes the entry so the same `App` boots under
Expo Go and a native build. Referenced by `package.json` `"main": "index.ts"`. No exports.

### `App.tsx` — the React root, font gate, provider tree
Default export `App()` (no props). Responsibilities, in order:
1. **Font gate.** `const [loaded] = useFonts(fonts)` — blocks first paint until the two
   Poppins TTFs resolve. `fonts` comes from `src/assets/registry.ts`.
2. **One-shot launch effect** (`useEffect(..., [])`): `useStore.getState().hydrate()` loads
   persisted state; `initNotifications()` installs the foreground handler + Android channels.
3. **Pre-font placeholder:** returns a bare teal `View` (`colors.teal` = `#0C4C60`) so the gap
   before fonts load matches the splash gradient — no white flash.
4. **Provider tree once loaded:**
```tsx
<SafeAreaProvider>
  <StatusBar style="light" />
  <NavigationContainer>
    <RootNavigator />
  </NavigationContainer>
</SafeAreaProvider>
```
Key imports that define the boot graph: `RootNavigator`, `fonts`, `colors`, `useStore`,
`initNotifications`.

### `app.json` — Expo config (identity, icons, splash, native plugins, permissions)
Not code; the single source of app identity and native build config. Salient keys:
- `expo.name` `"Pawductivity"`, `expo.slug` `"pawductivity"`, `version` `1.0.0`.
- `icon` `./assets/icon/logo-paw.png`; `userInterfaceStyle` `"light"`.
- `android.package` / `ios.bundleIdentifier` both `"com.pawductivity.app"`;
  `android.versionCode` `4`; `adaptiveIcon.backgroundColor` `#0C4C60`.
- `android.permissions`: `BILLING`, `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`,
  `RECEIVE_BOOT_COMPLETED`, `VIBRATE`; `blockedPermissions`: `AD_ID`.
- `extra.eas.projectId` `27ed1726-…` and `extra.googleWebClientId` (both **fork-specific**).
- **`plugins`** (this is the New-Architecture / native-module manifest):
  `expo-sqlite`, `expo-font`, `expo-audio`, `expo-asset`,
  `expo-splash-screen` (image `logo-paw.png`, `resizeMode:"contain"`, bg `#0C4C60`),
  `expo-build-properties` (Android R8/Proguard: `enableProguardInReleaseBuilds`,
  `enableShrinkResourcesInReleaseBuilds`, and the **Nitro keep rule**
  `-keep class com.margelo.nitro.** { *; }`), `expo-image-picker` (photos permission copy that
  **names the app**), `expo-notifications` (monochrome icon + color `#0C4C60`),
  `@react-native-google-signin/google-signin`.

> New Architecture / Fabric note: **there is no `newArchEnabled` key** — SDK 57 defaults New
> Arch **on**, and reanimated 4 + the Nitro keep-rule presume it. Leave it defaulted.

### `babel.config.js` — transform config (one deliberate non-addition)
```js
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
```
`babel-preset-expo` (SDK 57) **auto-appends `react-native-worklets/plugin`** (required by
reanimated 4). The comment is load-bearing: **do not** also add the worklets/reanimated plugin
or it double-applies and breaks worklets. Copy verbatim.

### `tsconfig.json`
```json
{ "extends": "expo/tsconfig.base",
  "compilerOptions": { "strict": true },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "old", "dist", ".expo", "_pawductivity-assets"] }
```
Strict TS on top of Expo's base. Only fork-touch: the `_pawductivity-assets` exclude name.

### `eas.json` — build/submit profiles
CLI `>= 12.0.0`, `appVersionSource: "remote"`. Profiles: `development` (dev client, internal
APK), `preview` (internal APK), `production` (`autoIncrement`, Android app-bundle). `submit.production.android`
points at `./play-service-account.json`, track `internal`, `releaseStatus: "draft"`. No app
identity lives here (it's all in `app.json`) — reuse structurally unchanged.

### `package.json` — deps + scripts
`"main": "index.ts"`, `"name": "pawductivity"`, `private: true`. The **New-Arch-relevant deps**
(pin these exactly when forking):
```
expo ~57.0.8 · react 19.2.3 · react-native 0.86.0 · react-native-reanimated 4.5.0
react-native-svg 15.15.4 · lottie-react-native ~7.3.8 · react-native-screens ~4.26.0
react-native-safe-area-context ~5.7.0 · expo-sqlite ~57.0.1 · expo-font ~57.0.1
expo-splash-screen ~57.0.5 · expo-notifications ~57.0.7 · zustand ^5.0.14 · immer ^11.1.15
@react-navigation/native ^7.3.13 · @react-navigation/native-stack ^7.18.5
```
Scripts: `start/android/ios/web`, `typecheck` (`tsc --noEmit`), `doctor` (`expo-doctor`),
`build:check` (`expo export --platform android`), `test:server`, and `preflight` (chains
typecheck → doctor → test:server → build:check).

### Boot partners (pulled in by `App.tsx`)

**`src/navigation/RootNavigator.tsx`** — native-stack; slide-up transitions.
```ts
export type RootStackParamList = { Splash: undefined; Onboarding: undefined; Main: undefined };
export function RootNavigator(): JSX.Element
```
`SplashRoute` waits on **both** a timer (`SplashScreen onDone`) and store `hydrated`, then
`navigation.replace(hasState ? 'Main' : 'Onboarding')`. `Onboarding` completes to `Main`.

**`src/screens/SplashScreen.tsx`** — `export function SplashScreen({ onDone }: { onDone: () => void })`
plus `export { SPLASH_LINES }`. Animated logo/glow/loader over a `LinearGradient(['#0C4C60','#0a3d4e'])`;
calls `onDone` after **2600 ms**. Renders `img.logo`, `img.logoGlow`, the brand wordmark, tagline,
and a random quote from `SPLASH_LINES` (16 focus-themed strings).

**`src/store/store.ts`** — `export const useStore` (zustand). Boot-relevant surface:
`hydrate()` (loads + **migrates/backfills** persisted state against `freshState()`, re-saves,
sets `{ state, hydrated:true }`), `mutate(fn, opts?)` (immer producer → grant achievements →
debounced save), and a 250 ms debounced `scheduleSave` → `persistence.save`.

**`src/db/persistence.ts`** — `export interface Persistence { load; save; wipe }` and
`export const persistence` = `WebPersistence` (localStorage) on web else `SqlitePersistence`
(expo-sqlite). Single-row KV document model (`kv(key,value)`, key `'app_state'`), JSON blob,
strips runtime-only `tab` before persisting.

**`src/assets/registry.ts`** — `export const fonts` (the `useFonts` input), plus `img`,
`avatars`, `foodImg`, `clothesImg`, `speciesThumb`, `lottiePet`, `soundscapes`, and helper
`avatarSrc()`. Every asset is a literal `require()` (RN requirement).

**`src/notifications/notifications.ts`** — `initNotifications()` (foreground handler + Android
channels `focus`, `reminders`), plus `scheduleFocusEnd`, `showOngoingFocus`, `syncReminders`,
`requestNotifPermission`, etc. Native-only, lazily `require`'d and guarded so Expo Go/web can't crash.

**`src/theme/tokens.ts`** — `colors` (`teal:#0C4C60` etc.), `radius`, `shadow`, `font`,
`fontFor`, `NAV_H`, `MAX_CONTENT`. `App.tsx` uses `colors.teal` for the pre-font frame.

---

## 2. HOW IT CONNECTS — control/data flow

**Boot sequence:**
```
Native launch
  └─ index.ts registerRootComponent(App)
       └─ App() renders
            ├─ useFonts(fonts)  ──────────────► blocks; teal <View/> until loaded
            ├─ useEffect once:
            │     ├─ useStore.getState().hydrate()  ─► persistence.load()
            │     │        └─ deserialize JSON blob ─► backfill vs freshState() ─► set{state,hydrated}
            │     │                                     └─ Notif.syncReminders(...)
            │     └─ initNotifications()  ─► foreground handler + Android channels
            └─ once fonts loaded → provider tree → NavigationContainer → RootNavigator
                    └─ SplashRoute: await (timer 2600ms  AND  store.hydrated)
                          └─ navigation.replace( hasState ? 'Main' : 'Onboarding' )
```

**Two independent readiness gates converge at the splash:** fonts gate first paint in
`App.tsx`; the splash route gates navigation on `timeUp && hydrated`. Hydration runs *during*
the splash animation, so load time is hidden behind the 2.6 s splash. If a saved state exists
→ `Main`; first run → `Onboarding`.

**Persistence loop (steady state):** any `store.mutate(fn)` → immer produces next state →
`grantAchievements` → `scheduleSave` (250 ms debounce) → `persistence.save(state)` →
`serialize` strips `tab` → `INSERT OR REPLACE` into the `kv` row. On next launch `hydrate`
reads that row and backfills missing slices from `freshState()` (loaded values win), so schema
growth never leaves a slice `undefined`.

**Identity flow:** `app.json` is the sole owner of name/slug/bundle-id/scheme/icons/splash/
permissions/plugins → consumed by EAS at build time. `App.tsx`/screens read *display* strings
from their own code and `tokens.ts`, **not** from `app.json`. So renaming the app is an
`app.json` + copy-string job, not a code-graph refactor.

---

## 3. REUSE VERBATIM — copy unchanged into HabitHatch

- **`index.ts`** — identical (entry is app-agnostic).
- **`babel.config.js`** — identical. Keep the worklets comment; do not add plugins.
- **`eas.json`** — identical structure. (Regenerate `play-service-account.json` per the new
  Play listing; the path stays.)
- **`App.tsx`** — copy as-is. Its imports (`RootNavigator`, `fonts`, `colors`, `useStore`,
  `initNotifications`) all keep the same names in the fork; the launch effect (`hydrate()` +
  `initNotifications()`) and the font gate are activity-agnostic.
- **`RootNavigator.tsx`** — copy as-is. Splash → (Main | Onboarding) routing is unchanged; the
  egg/hatch flow lives *inside* Onboarding/Main, not in the router.
- **`persistence.ts`** — copy the whole KV-document adapter; **change only the DB filename**
  (see §4). The single-blob model already carries the new `habits`/`habit_logs`/`day_summary`/
  `garden_plots` slices for free — they serialize as part of the one JSON document.
- **`tokens.ts`** — copy as-is (warm palette is shared; `catColors`/`moodColors` extend, not replace).
- **`notifications.ts`** — copy the module + channel/guard machinery; only rename the two focus
  identifiers and add channels (see §4).
- **`tsconfig.json`** — copy; only the `_pawductivity-assets` exclude name is cosmetic.
- **New-Arch/Fabric/reanimated/Nitro setup** — reuse wholesale: the SDK-57 defaults, the
  `expo-build-properties` R8 block, and the Nitro keep-rule. No New-Arch flags to add.

---

## 4. CHANGE FOR HABITHATCH — the specific edits

### 4.1 `app.json` identity (the core rename)
| Key | Pawductivity | HabitHatch |
|---|---|---|
| `expo.name` | `Pawductivity` | `HabitHatch` |
| `expo.slug` | `pawductivity` | `habithatch` |
| `android.package` | `com.pawductivity.app` | `com.habithatch.app` |
| `ios.bundleIdentifier` | `com.pawductivity.app` | `com.habithatch.app` |
| `android.versionCode` | `4` | reset to `1` |
| `extra.eas.projectId` | `27ed1726-…` | **new** — `eas init` mints a fresh id |
| `extra.googleWebClientId` | (Paw OAuth id) | **new** — new OAuth client, or drop if no cloud sync at MVP |
| `icon` / `adaptiveIcon.foregroundImage` | `logo-paw.png` | new egg/companion brand mark |
| `expo-image-picker` `photosPermission` | "Pawductivity uses your photos…" | "HabitHatch uses your photos…" |

There is **no `scheme`** key in the current `app.json`; if HabitHatch adds deep links/OAuth
redirect, add `"scheme": "habithatch"`. Keep `userInterfaceStyle:"light"`, the splash/adaptive
`backgroundColor:#0C4C60` (or retint to the HabitHatch brand), the permission set (all still
needed — notifications/exact-alarm/boot for reminders; billing for HabitHatch+), and the
`expo-build-properties` Nitro keep-rule **unchanged**.

### 4.2 `package.json`
- `"name": "habithatch"`. Keep `"main": "index.ts"` and **every dependency pin identical** —
  the pet engine (reanimated 4 + svg 15 + lottie) depends on this exact matrix.
- MVP has **no new native deps** (PLAN §10). If you strip cloud sync/billing for MVP you *may*
  drop `@react-native-google-signin/google-signin` + `react-native-iap` (and the matching
  `app.json` plugin/permission), but reuse is simpler if you keep them dormant.

### 4.3 `persistence.ts` — the one real code edit
```ts
// change ONLY this line:
const database = await SQLite.openDatabaseAsync('pawductivity.db'); // → 'habithatch.db'
```
Rename to `'habithatch.db'` so a device that once held Pawductivity doesn't collide. The `kv`
table, `KEY='app_state'`, and serialize/deserialize stay. **All new HabitHatch tables from
PLAN §6 (`habits`, `habit_logs`, `day_summary`, `garden_plots`) are *logical* slices inside the
one JSON document — they are NOT separate SQLite tables here.** The `CREATE TABLE` SQL in
PLAN.md describes the *conceptual* shape; physically they persist as arrays/records on
`AppState` and flush through this same single-row KV blob.

### 4.4 `App.tsx` — no structural change, copy stays valid
`hydrate()` + `initNotifications()` + font gate are all reused. The only reason to touch it is
if you rename the `initNotifications` export or add a launch-time **day-rollover recompute**
(PLAN §8) — if so, call it right after `hydrate()` in the same `useEffect`:
```tsx
useEffect(() => {
  useStore.getState().hydrate();      // now also runs the deterministic rollover inside hydrate
  initNotifications();
}, []);
```
Prefer folding the rollover *into* `hydrate()` (after load/backfill, before `set`) so boot
stays a single ordered effect and the recompute always precedes first render.

### 4.5 `SplashScreen.tsx` — reframe copy (focus → habits)
Structure/animation reused; swap the strings:
- Wordmark `Pawductivity` → `HabitHatch`; tagline `Get things done. Grow a friend.` →
  something egg/streak-forward (e.g. *"Keep your streak. Hatch a friend."*).
- Replace the 16 `SPLASH_LINES` focus aphorisms with habit/consistency lines (they're
  cosmetic; the export name stays so `RootNavigator` needs no change).
- `img.logo`/`img.logoGlow` now resolve to the new brand mark via `registry.ts`.

### 4.6 `notifications.ts` — rename ids, add channels
- Rename constants `FOCUS_ID='pawductivity-focus-end'` / `ONGOING_ID='pawductivity-focus-ongoing'`
  → `habithatch-*` (they namespace scheduled notifications).
- Reminder title string `'Pawductivity reminder'` → `'HabitHatch reminder'`.
- Android channels: `focus`+`reminders` exist. PLAN §8 wants `reminders`, `care`, `streak`,
  `celebrate`, `nudge` — add the new `setNotificationChannelAsync` calls in `initNotifications`
  (the focus channel can be repurposed or dropped since there's no pomodoro core).

### 4.7 `registry.ts` — asset swaps (fonts stay)
- **Fonts:** `export const fonts` (Poppins Regular/Bold) is reused verbatim — do not touch the
  `useFonts` contract.
- Add egg/hatch, category, garden, and streak SVGs (PLAN §11: `egg-whole/crack/hatch.svg`,
  `habit-ring/checkbox.svg`, `streak-flame.svg`, `garden-sprout/tree/orchard.svg`, 11
  `cat-*.svg`). SVGs are consumed as React components (see §5), **not** `require()`'d as `img`.
- `lottiePet`/`speciesThumb`: the SPECIES override drops `rabbit` and keeps 5 species
  (dog/cat as Lottie; fox/penguin/axolotl as `PetSprite` SVG). Remove `rabbit` entries.

### 4.8 Domain types/state (`types.ts` + `state.ts`) — where the model actually grows
The scaffold consumes `freshState()`/`AppState` but doesn't define the model. For the fork:
- `type Species` currently `'dog'|'cat'|'rabbit'|'fox'|'penguin'|'axolotl'` → **drop `rabbit`**
  (5-species override, PLAN §10).
- Extend `AppState` with the new slices (persist through the same KV blob):
```ts
interface Habit {
  id: string; name: string;
  category: 'water'|'exercise'|'read'|'meditate'|'run'|'hygiene'|'nophone'|'wake'|'sleep'|'medicine'|'custom';
  icon: string; type: 'good'|'bad';
  scheduleKind: 'daily'|'weekdays'|'times_per_week';
  weekdays?: number[]; targetPerWk?: number; reminderTime?: string; color: string;
  curStreak: number; bestStreak: number; coinsEarned: number;
  sortOrder: number; archived: boolean; createdAt: number;
}
interface HabitLog { id: string; habitId: string; date: string; /* YYYY-MM-DD */
  status: 'done'|'skipped'|'slipped'|'frozen'; coins: number; createdAt: number; }
interface DaySummary { date: string; dueCount: number; doneCount: number;
  allClear: boolean; coins: number; healthEnd: number; }
interface GardenPlot { id: string; planted: boolean; plantedAt?: number; }
```
- Extend `Pet` with `hatchState:'egg'|'crack'|'hatched'`, `hatchProgress:number /*0..3*/`
  (species already present). Extend `Profile` with `overallStreak`, `overallBestStreak`,
  `freezes`, `lastFreezeRefill?`, `dailyGoal`. Add `habits/habitLogs/daySummary/gardenPlots`
  arrays to `AppState` and seed them in `freshState()` (and in `hydrate`'s backfill block so
  old saves gain the slices).
- `freshState()` starts the companion **eggbound**: `pet.hatchState='egg'`, `hatchProgress=0`,
  `health=100`; `Onboarding` sets chosen `species` but keeps it hidden until the 3-day hatch.
- The `store.ts` focus actions (`completeFocus`, `leaveFocus`, `setActiveSession`, quest CRUD)
  are replaced by habit check-off/streak/rollover actions — that's the domain work, out of
  scaffold scope, but note the scaffold's `hydrate` backfill list must be updated to include
  the new array slices so a partial save never leaves them `undefined`.

---

## 5. GOTCHAS

1. **New Architecture is implicit — don't "enable" it.** SDK 57 defaults New Arch/Fabric on;
   there is no `newArchEnabled` in `app.json`. reanimated 4's `matrix`/UI-thread `PetSprite`
   engine (PLAN §10) and the Nitro keep-rule assume it. Adding an explicit flag or downgrading
   any of `react-native@0.86 / reanimated@4.5 / react-native-svg@15.15 / react@19.2` risks the
   worklets ABI. **Fork the dep matrix verbatim.**

2. **Babel worklets double-apply trap.** `babel-preset-expo` (SDK 57) auto-appends
   `react-native-worklets/plugin`. If you "helpfully" add `react-native-reanimated/plugin` or
   `react-native-worklets/plugin` to `babel.config.js`, it applies twice and reanimated breaks
   at runtime with confusing worklet errors. Keep `presets: ['babel-preset-expo']` and nothing else.

3. **SQLite persistence is a single JSON blob, debounced 250 ms — not relational.** The `kv`
   table holds one row (`key='app_state'`). PLAN §6's `CREATE TABLE habits (...)` etc. are a
   *conceptual* schema; physically everything lives in that one document. Two consequences:
   (a) the deterministic day-rollover / streak recompute must run against the in-memory
   `AppState` at launch (fold into `hydrate`), not via SQL; (b) a **flush-timing risk** — saves
   are debounced 250 ms via `scheduleSave`, so a fast kill after a mutation can drop the last
   write. For the check-off → hatch moment, consider an immediate `persistence.save(get().state)`
   (as `finishOnboarding` already does) rather than relying on the debounce.

4. **`hydrate` backfill must list every new slice.** `hydrate()` spreads `freshState()` then the
   loaded state and re-defaults each slice (`profile:{...def.profile, ...loaded.profile}`,
   `quests: Array.isArray(...) ? ... : def.quests`). When you add `habits`/`habitLogs`/
   `daySummary`/`gardenPlots`, you **must** add matching `Array.isArray`/spread lines, or an old
   save (or a screen that spreads the slice) hits `undefined` and crashes — exactly the failure
   the comment there warns about.

5. **SVGs are components, not `img` requires.** The existing `registry.img` map is all raster
   `require('*.png')`. The 20 new HabitHatch props are SVG (PLAN §11) consumed via
   `react-native-svg` (import the `.svg` as a React component through the SVG transformer / as a
   `<Svg>` subtree), **not** added to the `img` object. Don't `require()` an `.svg` into `img`
   expecting an `Image` source — it won't render. Keep raster (coin, food, thumbnails, splash
   logo) in `img`; keep vector (egg, category, garden, flame) in the SVG component layer.

6. **`persistence` DB filename collision.** If a tester installs HabitHatch over a device that
   had Pawductivity (same dev build), the un-renamed `'pawductivity.db'` would load a
   *Pawductivity* document and the backfill would try to reconcile focus-era state. Renaming to
   `'habithatch.db'` (§4.3) is mandatory, not cosmetic.

7. **Splash timing is a fixed 2600 ms, gated with hydration.** `SplashScreen` calls `onDone`
   after a hard 2600 ms `setTimeout`; `SplashRoute` also waits on `hydrated`. If you move the
   heavier launch-time rollover into `hydrate`, keep it fast (it's pure date math over local
   `YYYY-MM-DD` strings) so it finishes well inside the splash window and never stalls the
   `timeUp && hydrated` gate. Don't do blocking I/O beyond the single KV read.

8. **Fonts gate the first frame; the pre-font frame color must match the splash.** `App.tsx`
   returns `<View backgroundColor={colors.teal}/>` before fonts load, deliberately matching the
   splash gradient's top stop (`#0C4C60`). If you retint HabitHatch's brand, update **both** the
   splash `LinearGradient` colors and this fallback `colors.teal` reference together, or a color
   seam flashes on cold start.
