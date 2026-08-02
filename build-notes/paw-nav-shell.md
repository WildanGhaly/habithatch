# Fork Guide — The Pawductivity Nav Shell (tab / screen / overlay)

Scope: the **custom** navigation shell layered *inside* one react-navigation screen.
react-navigation (`@react-navigation/native-stack`) is used only for the three top-level
routes (Splash / Onboarding / Main). Everything the user actually interacts with —
tab switching, full-screen slide-up overlays, and bottom sheets — is a hand-rolled
shell driven by the zustand store, **not** by react-navigation.

Files covered:
- `src/navigation/RootNavigator.tsx`
- `src/screens/MainScreen.tsx`
- `src/components/TabBar.tsx`
- `src/components/OverlayHost.tsx`
- `src/components/OverlayScreen.tsx`

Supporting pieces this shell leans on (read but not owned by this guide):
`src/store/store.ts` (overlay + tab slice), `src/components/BottomSheet.tsx`,
`src/theme/tokens.ts`, `src/db/persistence.ts`, `src/components/Icon.tsx`,
`src/components/ui.tsx` (`Bounded`, `Txt`), `src/assets/registry.ts`.

---

## 1. WHAT'S HERE

### `RootNavigator.tsx` — the only real react-navigation usage
A 3-route native-stack. This is the *outer* shell; the custom shell lives entirely
under the `Main` route.

```ts
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export function RootNavigator(): JSX.Element
```

- `screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}` — every
  top-level route slides up, matching the prototype's slide-up feel.
- `SplashRoute` waits for **both** a timer (`onDone`) and store hydration
  (`useStore(s => s.hydrated)`), then `navigation.replace('Main')` if a saved profile
  exists (`!!s.state`) else `'Onboarding'`.
- Onboarding renders `<OnboardingScreen onComplete={() => navigation.replace('Main')} />`.

### `MainScreen.tsx` — the custom shell root
The single screen that hosts the tab body + tab bar + overlay host + toast. No exported
types; one exported component.

```ts
export function MainScreen(): JSX.Element
```

Reads four things from the store and renders an inner presentational component:
```ts
const state      = useStore((s) => s.state);
const tab        = useStore((s) => s.state?.tab ?? 'home');
const setTab     = useStore((s) => s.setTab);
const openOverlay= useStore((s) => s.openOverlay);
```

Two lifecycle effects (both are **Pawductivity-specific and get replaced** — see §4):
1. **State-wiped guard** — if `state` becomes null mid-session (Reset all data), it
   `navigation.reset(... 'Onboarding')` so the user isn't stranded on a blank Main.
2. **Focus-resume** — on first mount, if `state.activeSession` exists it reopens the
   focus timer (`openOverlay('focus', { resume: true })`); else `clearOngoingFocus()`.

`MainInner` is where the **tab-switch animation** lives — a single `Animated.Value`
that re-runs a fade+8px-lift every time `tab` changes:
```ts
const anim = useRef(new Animated.Value(0)).current; // start hidden so first frame doesn't flash
useEffect(() => {
  anim.setValue(0);
  Animated.timing(anim, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
}, [tab]);
```
The body is a `switch` on `tab` (`home | pet | quests | cal`), then `<TabBar>`,
`<OverlayHost>`, `<Toast>` stacked as siblings. The tab body is a plain conditional —
inactive tabs are unmounted, not hidden.

### `TabBar.tsx` — the bottom bar + center capture FAB
```ts
export type TabKey = 'home' | 'quests' | 'pet' | 'cal';

export function TabBar(props: {
  active: TabKey;
  onTab: (t: TabKey) => void;
  onCapture: () => void;
}): JSX.Element
```
- Static `TABS` array of `{ key, label, icon }` (icons are PNGs from `img.nav*`).
- Layout: `left = TABS.slice(0,2)`, then a center `fabSlot`, then `right = TABS.slice(2)`
  — so the FAB sits between tab 2 and tab 3.
- The FAB is a circular orange `Pressable` that renders `<Icon name="plus" .../>` and
  **lifts above the bar** with a negative `translateY` (`-18`, `-14` when pressed).
  `accessibilityLabel="Add a quest"`, `onPress={onCapture}`.
- `TabButton` renders an active "pill" behind the icon (`activePill`, teal `#E4EFF3`),
  dims inactive icons to `opacity 0.45`, and colors the label teal/muted.
- Height comes from `NAV_H` (74) + `useSafeAreaInsets().bottom`; absolutely positioned,
  `zIndex: 30`, white with a top hairline and an upward shadow.

### `OverlayHost.tsx` — the overlay/sheet stack renderer + animator
No exported types; one component. This is the heart of the shell.

```ts
export function OverlayHost(): JSX.Element
```
It reads the overlay **stack** from the store (`s.overlays: OverlayState[]`) and the
`closeOverlay` action, then classifies the top entry into one of three render paths via
two lookup maps:

```ts
// Full-screen slide-up overlays
const FULL: Partial<Record<OverlayName, React.ComponentType<{ param?: any }>>> = {
  focus, shop, premium, referral, insights, journey,
  achievements, recap, sync, profile,
};
// Bottom-sheet overlays (each renders its own <BottomSheet>, driven by `visible`)
const SHEET: Partial<Record<OverlayName, React.ComponentType<{ param?: any; visible?: boolean }>>> = {
  capture, goal, plan, appearance, buy, feed,
};
// `reward` is neither — it mounts directly and animates itself.
```

Animation constants (proto-matched — copy verbatim):
```ts
const H         = Dimensions.get('window').height;
const SLIDE_IN  = Easing.bezier(0.2, 0.8, 0.2, 1);   // 320ms open
const SLIDE_OUT = Easing.bezier(0.4, 0, 0.9, 0.5);   // 260ms close
```

Key behaviors:
- **Push (open):** a new full overlay sets `translateY = H` then animates to `0` over
  320ms with `SLIDE_IN`. The `focus` overlay is the one exception — it uses a subtle
  fade (`opacity 0→1` + 8px lift, 280ms) instead of a slide.
- **Pop to parent (nested back):** it reveals the parent *instantly at rest* and slides
  the **outgoing** child down on a layer above it (`closing` state + `closeY`, `zIndex: 51`),
  so you see the parent beneath the whole slide-down, not the bare Main screen.
- **Close to tab:** slides the current full overlay down to `H` (260ms) then unmounts it.
- **Sheets:** mount on open, stay mounted through the exit; on close it flips
  `sheetVisible=false` and unmounts after a 320ms timeout (the `BottomSheet` plays its own
  slide-down driven by the `visible` prop).
- **Android back:** `BackHandler` hardware-back subscription calls `closeOverlay()` while
  any overlay is open.
- **`reward`** mounts `<RewardOverlay>` directly (no slide container) — it fades its own
  scrim and pops its card.

### `OverlayScreen.tsx` — shared chrome for full overlays
The reusable header+body wrapper every full overlay screen renders inside.
```ts
export function OverlayScreen(props: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;        // default true
  onBack?: () => void;     // default closeOverlay
  belowHeader?: ReactNode; // fixed non-scrolling bar under the header
}): JSX.Element
```
- Sheet header = back chevron (`Icon name="chevL"`) + centered title + optional right slot,
  over a white bar with a bottom hairline; `paddingTop = insets.top + 14`.
- Back defaults to `closeOverlay` (pops the stack).
- Body scrolls inside a `<Bounded pad>` column; bottom padding reserves
  `NAV_H + insets.bottom + 20` so content clears the tab bar.

### Supporting: the store's overlay + tab slice (`store.ts`)
```ts
export type OverlayName =
  | 'focus' | 'shop' | 'premium' | 'referral' | 'insights' | 'journey'
  | 'achievements' | 'recap' | 'sync' | 'profile' | 'appearance' | 'reward'
  | 'capture' | 'goal' | 'plan' | 'buy' | 'feed';

export interface OverlayState { name: OverlayName; param?: any }

// on StoreShape:
overlays: OverlayState[];
openOverlay: (name: OverlayName, param?: any) => void;
closeOverlay: () => void;
closeAllOverlays: () => void;
setTab: (tab: AppState['tab']) => void;
```
`openOverlay` is a **stack push with dedupe** and one special case:
```ts
openOverlay: (name, param) => set((store) => {
  if (name === 'reward') return { overlays: [{ name, param }] };      // terminal: replaces stack
  const existing = store.overlays.findIndex((o) => o.name === name);
  if (existing >= 0) {                                                 // already open: bring to front
    const trimmed = store.overlays.slice(0, existing + 1);
    trimmed[existing] = { name, param };
    return { overlays: trimmed };
  }
  return { overlays: [...store.overlays, { name, param }] };           // push
}),
closeOverlay: () => set((store) => ({ overlays: store.overlays.slice(0, -1) })),
setTab: (tab) => set((store) => (store.state ? { state: { ...store.state, tab } } : store)),
```

### Supporting: `BottomSheet.tsx`
```ts
export function BottomSheet(props: {
  visible: boolean;
  onClose: () => void;
  title?: string; subtitle?: string;
  children: ReactNode;
  align?: 'center' | 'left';
}): JSX.Element | null
```
Self-contained slide-up dialog: a native `<Modal transparent animationType="none">`, a
scrim that fades with `anim`, and a dialog that slides `translateY: [H → 0]`. It keeps a
local `render` flag so the **exit** slide-down (240ms) completes before it returns `null`.
Open easing/duration match `SLIDE_IN`/320ms; close matches `SLIDE_OUT`/240ms. Every sheet
screen (e.g. `CaptureSheet`) wraps its content in `<BottomSheet visible={visible} onClose={closeOverlay}>`.

---

## 2. HOW IT CONNECTS

Control/data flow, top to bottom:

```
App root
 └─ RootNavigator (react-navigation stack)         ← ONLY real navigation
     ├─ Splash → replace('Main' | 'Onboarding')    ← gated on store.hydrated + !!state
     ├─ Onboarding → replace('Main')
     └─ Main = MainScreen                           ← the custom shell starts here
         └─ MainInner
             ├─ tab body   ← switch(store.state.tab): Home | Pet | Quests | Calendar
             ├─ TabBar     ← active=tab, onTab=setTab, onCapture=openOverlay('capture')
             ├─ OverlayHost← renders store.overlays stack (FULL / SHEET / reward)
             └─ Toast      ← store.toast
```

- **Tabs are store state, not routes.** `MainScreen` reads `state.tab`; `TabBar.onTab`
  calls `store.setTab(key)`, which mutates `state.tab`; `MainInner`'s `anim` effect
  re-fires on the change and the `switch` swaps the body. `tab` is the one field
  **stripped before persistence** (see `serialize()` in §5), so it always resets to
  `'home'` on relaunch.
- **Overlays are a store stack, not routes.** Anything can call
  `openOverlay(name, param)` from anywhere (a tab body, another overlay, the FAB). The
  single `OverlayHost` instance mounted in `MainInner` observes `store.overlays` and
  renders/animates the top entry. `closeOverlay()` pops one; the header back button,
  Android hardware back, and each sheet's scrim all call it.
- **The FAB is wired straight to an overlay.** `TabBar.onCapture` →
  `openOverlay('capture')` → `OverlayHost` sees `capture ∈ SHEET` → mounts `CaptureSheet`
  in a `BottomSheet`.
- **Cross-overlay navigation** is just nested pushes: e.g. Profile → Appearance pushes a
  second entry; `closeOverlay` pops back to Profile, and `OverlayHost`'s pop branch slides
  Appearance down over a settled Profile.
- **Persistence loop:** every store `mutate()` (which `setTab` deliberately bypasses)
  calls `scheduleSave()` → debounced 250ms → `persistence.save(state)`. Hydration happens
  once at launch (`store.hydrate()`), and `RootNavigator`'s Splash blocks routing on the
  resulting `hydrated` flag.

---

## 3. REUSE VERBATIM

Copy these across essentially unchanged — they are pure shell mechanics with no
focus-specific logic:

| File / piece | Why it's safe verbatim |
|---|---|
| **`OverlayScreen.tsx`** | Pure chrome (back + title + scroll body). Only the `title`/`children` you pass in differ. |
| **`BottomSheet.tsx`** | Generic slide-up modal. No app concepts inside. |
| **`OverlayHost.tsx` animation engine** | The push/pop/slide-down state machine, `FULL`/`SHEET` classification, `SLIDE_IN`/`SLIDE_OUT` easings, nested-pop `closing`/`closeY` layer, `BackHandler` wiring, and the `reward` direct-mount path. **Keep the machinery; only edit the two component maps** (§4). |
| **`TabBar.tsx` structure** | The left/FAB/right layout, active pill, lifted circular FAB, safe-area padding. **Keep the structure; only edit `TabKey`, the `TABS` array, and the FAB label/target** (§4). |
| **`MainScreen.tsx` `MainInner` tab-switch anim** | The 280ms fade+lift on `tab` change is generic. |
| **Store overlay slice** | `OverlayState`, `overlays`, `openOverlay` (incl. dedupe + `reward` terminal case), `closeOverlay`, `closeAllOverlays`, `setTab`. Only the `OverlayName` union members change. |
| **`RootNavigator.tsx`** | Splash→Main/Onboarding gating and `slide_from_bottom` are theme-agnostic. Keep as-is (Onboarding now hands out an egg, but that's inside `OnboardingScreen`, not the navigator). |
| **`tokens.ts`, `Bounded`/`Txt`, `NAV_H`, `shadow`** | Design system, reused wholesale per PLAN §10/§12. |

---

## 4. CHANGE FOR HABITHATCH

The shell mechanics stay; the **contents** of the maps, the tab set, the FAB target, and
the two Pawductivity-specific `MainScreen` effects change. All names below reference
PLAN.md concepts.

### 4.1 `store.ts` — the `OverlayName` union
Swap focus-era names for habit-era ones. Suggested union:
```ts
export type OverlayName =
  // full-screen slide-ups
  | 'shop' | 'premium' | 'referral' | 'insights' | 'garden'   // journey → garden (PLAN §7.5)
  | 'achievements' | 'recap' | 'sync' | 'profile' | 'appearance'
  | 'nursery'                                                   // the hatch overlay (PLAN §5 Nursery)
  // sheets / dialogs
  | 'habit' | 'goal' | 'buy' | 'feed';                          // 'habit' = Habit Editor sheet
```
- Drop `'focus'` (no focus timer in v1; a `'routine'` overlay is a v3 concern per PLAN §4).
- Drop `'capture'`/`'plan'` (quest capture) → replace with a single **`'habit'`** Habit
  Editor sheet (PLAN §5 "Habit Editor"; create/edit name, category icon, good/bad,
  schedule, reminder).
- Rename `'journey'` → **`'garden'`** (PLAN Habit Garden reframe).
- Keep `'reward'`'s terminal behavior but use it (or a parallel `'nursery'`) for the
  **egg-hatch** moment — PLAN §12 risk #2 explicitly says stage the Nursery on the reused
  `RewardOverlay`. The simplest fork keeps `reward` as the mechanism and adds `nursery` as
  the hatch's semantic entry, both mounting directly (no slide container).

### 4.2 `OverlayHost.tsx` — the two maps only
Edit imports + the `FULL` / `SHEET` objects to match the new union; **do not touch the
animation code**.
```ts
const FULL = {
  shop: ShopScreen, premium: PremiumScreen, referral: ReferralScreen,
  insights: InsightsScreen, garden: GardenScreen /* was JourneyScreen */,
  achievements: AchievementsScreen, recap: RecapScreen, sync: SyncScreen,
  profile: ProfileScreen,
};
const SHEET = {
  habit: HabitEditorSheet /* was CaptureSheet/PlanSheet */,
  goal: GoalSheet, appearance: AppearanceScreen, buy: BuySheet, feed: FeedSheet,
};
// reward → RewardOverlay stays as the direct-mount hatch/celebration path (add `nursery` here
// if you split it out).
```
The `focus`-only fade-in branch in the push effect can be deleted (no focus overlay), or
repurposed to give the **Nursery** its own entrance if you route it through `FULL`.

### 4.3 `TabBar.tsx` — tab set, labels, FAB
```ts
export type TabKey = 'home' | 'habits' | 'pet' | 'cal';  // rename 'quests' → 'habits' if desired
```
- `TABS` labels/icons: `Home` → **"Today"** (the daily habit driver, PLAN §5), keep `Pet`
  → **"Companion"**, `Calendar` can stay (per-habit history) or map to Insights. Icons are
  reused PNGs (`img.navHome/navPet/navCal`); relabel text, swap icon only if art changes.
- **FAB:** `accessibilityLabel="Add a quest"` → **"Add a habit"**, and `onCapture` should
  `openOverlay('habit')` (the Habit Editor sheet) instead of `'capture'`.

### 4.4 `MainScreen.tsx` — replace the two focus effects
- **Delete the focus-resume effect** entirely (the `resumedRef` / `state.activeSession` /
  `openOverlay('focus', { resume: true })` / `clearOngoingFocus()` block, and its import).
  There is no running-session-to-resume in a habit tracker.
- **Add the deterministic day-rollover on launch** in its place (PLAN §6, §7.2, §7.4, §8).
  On first mount with hydrated `state`, run the pure
  `rollover(state, lastSeenDate, today)` that walks each elapsed local `YYYY-MM-DD` and:
  applies per-day health decay, evaluates per-habit + overall streaks, writes
  `day_summary`, advances the egg `hatch_progress`, and does the Streak-Freeze refill/consume.
  Then, if `pet.hatch_state` just reached `'hatched'`, `openOverlay('nursery')` (mirrors the
  old code's "open an overlay on launch based on persisted state" shape — you're swapping
  *which* overlay and *why*).
- Keep the **state-wiped guard** effect verbatim (still valid for Reset all data).
- The tab-body `switch` swaps its screens to the habit set (Today / Companion / etc.) but
  the surrounding `MainInner` animation stays.

### 4.5 New persisted shape (PLAN §6) — lives inside the snapshot, see §5 gotcha
The new domain the shell will open overlays over. These are added to `AppState` (the
existing single snapshot document), conceptually mirroring this schema:
```sql
CREATE TABLE habits (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  category TEXT NOT NULL,            -- water|exercise|read|meditate|run|hygiene|nophone|wake|sleep|medicine|custom
  icon TEXT NOT NULL,               -- cat-*.svg filename
  type TEXT NOT NULL,               -- 'good' | 'bad'
  schedule_kind TEXT NOT NULL,      -- 'daily' | 'weekdays' | 'times_per_week'
  weekdays TEXT, target_per_wk INTEGER, reminder_time TEXT, color TEXT NOT NULL,
  cur_streak INTEGER NOT NULL DEFAULT 0, best_streak INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE TABLE habit_logs (
  id TEXT PRIMARY KEY, habit_id TEXT NOT NULL, date TEXT NOT NULL,   -- 'YYYY-MM-DD' local
  status TEXT NOT NULL,             -- 'done' | 'skipped' | 'slipped' | 'frozen'
  coins INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, UNIQUE(habit_id, date)
);
CREATE TABLE day_summary (
  date TEXT PRIMARY KEY, due_count INTEGER NOT NULL, done_count INTEGER NOT NULL,
  all_clear INTEGER NOT NULL DEFAULT 0, coins INTEGER NOT NULL DEFAULT 0,
  health_end INTEGER NOT NULL       -- companion health at day close, for deterministic decay replay
);
CREATE TABLE garden_plots ( id TEXT PRIMARY KEY, planted INTEGER NOT NULL DEFAULT 0, planted_at INTEGER );
-- pet: + hatch_state 'egg'|'crack'|'hatched', + hatch_progress 0..3, + species
-- profile: + overall_streak, + overall_best_streak, + freezes, + last_freeze_refill, + daily_goal
```
In TS these become slices on `AppState`: `habits: Habit[]`, `habitLogs: HabitLog[]`,
`daySummary: Record<string, DaySummary>`, `gardenPlots: Record<string, {planted, plantedAt}>`,
plus the `pet`/`profile` field additions. The shell doesn't read these directly — the tab
bodies and overlays do — but the `hydrate()` backfill/migration block in `store.ts` must be
extended to default each new slice (it currently backfills `quests`, `reminders`, `plan`,
etc.; add `habits`, `habitLogs`, `daySummary`, `gardenPlots` the same way so an older saved
state never leaves a slice `undefined`).

### 4.6 Copy reframes (shell-visible strings)
- FAB a11y: "Add a quest" → "Add a habit".
- Onboarding success toast in `finishOnboarding` ("Finish a focus session to earn…") →
  egg framing ("Keep your habits 3 days to hatch your companion.").
- `OverlayScreen` titles are passed per-screen — Journey→"Habit Garden", etc.

### 4.7 Economy note tied to the shell (PLAN §10, §12)
The Shop overlay (reused `FULL.shop`) surfaces the SPECIES catalog. HabitHatch **overrides
`catalogs.ts` SPECIES to 5 species** (remove `rabbit` — no art), re-flagging dog/cat free,
fox/penguin coin-unlock, axolotl premium. This is not a shell edit, but the shell's Shop
overlay will render whatever the catalog holds, so the override must land or the reused
Companions tab shows an unshippable rabbit.

---

## 5. GOTCHAS

**1. "SQLite tables" are a fiction — it's one JSON snapshot in a `kv` table.**
`persistence.ts` does **not** create `habits`/`habit_logs`/`day_summary`/`garden_plots`
tables. Native persistence is a single row:
```ts
await database.execAsync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
// save: INSERT OR REPLACE INTO kv (key, value) VALUES ('app_state', <JSON.stringify(state minus tab)>)
```
The PLAN §6 SQL is a **conceptual data model**; in reality every new "table" is a nested
array/record inside the serialized `AppState` document. Consequences you must respect:
- No `JOIN`s, no `UNIQUE(habit_id,date)` enforcement — you enforce uniqueness in JS
  (dedupe by `habit_id+date` before push).
- No SQL migrations — schema growth is handled by the **`hydrate()` backfill** merge in
  `store.ts` (loaded values win, defaults fill gaps). Extend that block for the new slices
  (§4.5) or a screen that spreads a missing slice will crash.
- `serialize()` **strips `tab`** before persisting; the overlay stack (`overlays`) is
  runtime state on the store *outside* `AppState`, so it is never persisted at all — a
  relaunch always starts with `overlays: []` on the `home` tab. Do **not** try to persist
  an open overlay; instead reconstruct intent from `AppState` on launch (that's exactly how
  §4.4's hatch-on-launch works).

**2. Snapshot flush is debounced and whole-document — keep writes going through `mutate`.**
Saves are `scheduleSave()` → 250ms debounce → `persistence.save(entireState)`. `setTab`
intentionally uses a raw `set` (no save/no achievement pass) because it's ephemeral. Any
habit check-off, streak change, or rollover result **must** flow through `store.mutate()`
so it (a) runs the achievement grant pass and (b) schedules the flush. A direct `set` that
bypasses `mutate` will not persist. The whole document is rewritten each flush, so keep the
snapshot lean (the new habit-log ledger grows unbounded — consider pruning old
`habit_logs`/`day_summary` beyond the 8-week Insights window, PLAN §5).

**3. Fabric + reanimated-4 vs. the shell's Animated API — two different animation systems coexist.**
The shell (`MainInner`, `OverlayHost`, `BottomSheet`, `TabBar` FAB) uses the classic
**`react-native` `Animated` API with `useNativeDriver: true`** — this is fine on the New
Architecture/Fabric and needs no worklets. Separately, `PetSprite.tsx` uses
**reanimated-4's UI-thread `matrix` engine** (PLAN §10: "reanimated-4 UI-thread matrix
engine … Zero changes needed"). Don't conflate them: don't port the pet's `matrix`
transforms into the shell, and don't switch the shell's `Animated` calls to reanimated —
they already run on the native driver. The app targets Expo SDK 57 / RN 0.86 / Fabric with
New Architecture on (no `newArchEnabled:false` in `app.json`); the shell's transforms
(`translateY`, `opacity`, `scale`) are all native-driver-safe.

**4. Babel: never add the reanimated/worklets plugin yourself.**
```js
// babel.config.js
presets: ['babel-preset-expo'],  // that's it
```
`babel-preset-expo` (SDK 57) **auto-appends `react-native-worklets/plugin`** (required by
reanimated 4). Adding `react-native-reanimated/plugin` or the worklets plugin a second time
double-applies and breaks worklets. Copy `babel.config.js` verbatim.

**5. SVG consumption — the `Icon` component only holds *inline path strings*, not files.**
`Icon.tsx` is an `ICONS` map of `[kind, innerSvgString]` rendered through
`react-native-svg`'s `SvgXml` with a synthesized `<svg viewBox="0 0 24 24">…</svg>` and
`color`/`currentColor` theming. It does **not** import `.svg` files. The 20 new HabitHatch
SVGs (`egg-whole/crack/hatch`, `garden-sprout/tree/orchard`, the 11 `cat-*.svg`,
`habit-ring`, `streak-flame`, etc., PLAN §11) are **file assets**, so they can't just be
dropped into `ICONS`. Two supported paths:
- Small monochrome glyphs (e.g. the Garden plot list-icons) already map to existing `Icon`
  keys via the PLAN §7.5 `ic` column (`heart/shield/bolt/sparkle/trophy/note/crown`) — reuse
  `Icon` as-is, no new files.
- Multi-color / hero SVGs (egg, garden scenes, category icons) must be consumed either by
  reading their raw XML into `SvgXml xml={...}`, or by adding **`react-native-svg-transformer`**
  to `metro.config.js` to `import Egg from '.../egg-whole.svg'` as a component. The reused
  `Icon` path won't cover them. Pick one and be consistent; the shell itself only uses
  `Icon name="plus"` (FAB) and `Icon name="chevL"` (back), both already inline.

**6. `Dimensions.get('window').height` is captured once at module load.**
`OverlayHost` (`const H = …`) and `BottomSheet` read window height at import time, not per
render. Fine because the app is `orientation: 'portrait'` (locked in `app.json`). If you
ever unlock rotation or target foldables, the slide distances go stale — but for the 1:1
fork, leave it; portrait lock is part of the reused spine.

**7. Android hardware back + predictive back.**
`OverlayHost` subscribes `BackHandler` to `closeOverlay` only while an overlay is open;
when the stack is empty, back falls through to react-navigation (exits Main). `app.json`
sets `predictiveBackGestureEnabled: false` — keep it, or the Android 14 predictive-back
animation fights the overlay slide-down.

---

_End of guide. The mechanical shell (RootNavigator, MainInner anim, OverlayHost state
machine, BottomSheet, OverlayScreen, TabBar layout, store overlay slice) forks verbatim;
the fork surface is the `OverlayName` union, the two `OverlayHost` maps, the `TabKey`/`TABS`
set, the FAB target, and MainScreen's launch effect (focus-resume → day rollover + hatch)._
