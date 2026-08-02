# Fork Guide — Store, State, Types & Persistence (the data spine)

Covers the four files that make up Pawductivity's data spine, and exactly how to extend
them for HabitHatch. Source root: `d:/Documents/Work/Project/Pawductivity`.

| Pawductivity file | Role |
|---|---|
| `src/domain/types.ts` | The `AppState` TypeScript shape (all slice interfaces). |
| `src/domain/state.ts` | `freshState()` factory (blank new-user state) + `newDeviceId()`. |
| `src/store/store.ts` | The zustand+immer store: shape, `mutate`, overlay nav, all gameplay actions. |
| `src/db/persistence.ts` | Snapshot persistence to expo-sqlite (native) / localStorage (web). |

The spine is **~80% reusable verbatim** (PLAN.md §12). Only the *core activity* (focus
session → habit check-off) and the *AppState slices that model it* change. The store
plumbing (`mutate` → grant-achievements → debounced save), the persistence adapter, the
migration/backfill on hydrate, and the overlay stack are all reused as-is.

---

## 1. WHAT'S HERE

### 1.1 `src/domain/types.ts` — the AppState shape

Pure type declarations, no runtime code. The top-level document:

```ts
export interface AppState {
  profile: Profile;
  pet: Pet;
  streak: Streak;
  quests: Quest[];
  reminders: Reminder[];
  completedDays: number[];
  settings: Settings;
  cloud: Cloud;
  insights: Insights;
  today: Today;
  plan: number[];              // quest ids chosen for "today's plan" (max 3)
  lifetime: Lifetime;
  achievements: string[];      // unlocked badge ids
  nextId: number;              // monotonic quest id source
  nextRem: number;             // monotonic reminder id source
  activeSession?: ActiveSession | null; // a running focus session, persisted to survive kill
  deviceId: string;            // stable per-install id; only sent to referral/sync backend
  onboarded: boolean;          // runtime-only
  tab: 'home' | 'quests' | 'pet' | 'cal'; // runtime-only, NOT persisted (stripped on save)
}
```

Key exported slice types (names + salient fields):

- `type Species = 'dog' | 'cat' | 'rabbit' | 'fox' | 'penguin' | 'axolotl'` — **note `rabbit`; HabitHatch drops it (see §4.6).**
- `type QuestTag = 'Work' | 'School' | 'Sport' | 'Personal' | 'Project'`
- `type ReminderRep = 'once' | 'daily' | 'weekdays' | 'weekly' | 'monthly'`
- `Profile { name; avatar; avatarCustom?; level; xp; needed; coins; premium }`
- `Pet { species; name; health /*0..100*/; stage /*1..5*/; clothesId; home: string[] /*built milestone ids*/; lastCollect; food: Record<number,number>; ownedClothes: number[] }`
- `Streak { current; longest }`
- `Quest { id; name; tag: QuestTag; est /*sec*/; done /*sec*/; due?; repeat?; rlabel?; focus? }` — **this is the row entity HabitHatch replaces with `Habit`.**
- `Reminder { id; name; time /*HH:MM*/; rep: ReminderRep; doneOn: string[] /*'y-m-d' keys*/; y?; mo?; day? }`
- `Settings { notif; sound; accent; room; notifAsked }`
- `Cloud { signedIn; email; lastSync; pending; status: 'idle'|'syncing'|'synced'|'error'|'offline'; auto; wifiOnly; lastError; device }`
- `Insights { weekly; categories; sessions; hours; heat; monthly; yearly; petHealth; coinsLifetime; mealsFed; idleCollected; outfitChanges; ... }` — a wide, mostly-numeric analytics slice.
- `Today { min; sessions; goalMin }` — the daily-goal-ring source (minutes-based).
- `Lifetime { sessions; minutes }`
- `ActiveSession { questId; bankQid; questName; startDone; sessionTarget; mode: 'standard'|'pomodoro'; phase: 'work'|'break'; phaseLen; base; startedAt; workDone; cycle }` — **focus-timer-specific; HabitHatch does not need it for MVP (no timer).**

### 1.2 `src/domain/state.ts` — blank-state factory

Two exports:

```ts
export function newDeviceId(): string          // `dev_<random><random>`, per-install id
export function freshState(): AppState          // the genuine zero state for a new user
```

`freshState()` is the single source of the new-user template **and** the backfill default
used on hydrate (see §2.2). Design intent (from its own doc comment): *everything is earned*
— zero coins/food/quests/insights — the **only** non-zero is `pet.health: 100` (a freshly
adopted pet must not start in an unrecoverable low-health dead end). Notable seeds:

```ts
profile: { name: 'Friend', avatar: 0, level: 1, xp: 0, needed: 160, coins: 0, premium: false },
pet: { species: 'cat', name: 'Pixel', health: 100, stage: 1, clothesId: 0,
       home: [], lastCollect: Date.now(), food: {}, ownedClothes: [] },
today: { min: 0, sessions: 0, goalMin: 60 },
onboarded: true, tab: 'home',
// species + name overwritten by onboarding; insights slice is a big zeros(n) block
```

### 1.3 `src/store/store.ts` — the zustand+immer store

One store created with `create<StoreShape>((set, get) => …)`. `StoreShape` = the persisted
`state: AppState | null` plus **runtime UI state and every action**.

Runtime (non-persisted) fields on the store:
- `state: AppState | null` — `null` until hydrated (and after `resetData`).
- `hydrated: boolean` — set true when hydrate finishes (gates the splash → app transition).
- `toast: ToastMsg | null` — transient toast; `ToastMsg { id; text; coin? }`.
- `overlays: OverlayState[]` — an **overlay navigation stack**; `OverlayState { name: OverlayName; param? }`. `OverlayName` is a union of ~26 overlay/sheet names (`'focus' | 'shop' | 'premium' | … | 'feed'`).

The central mutation primitive — **every gameplay write goes through this**:

```ts
mutate: (fn: (s: AppState) => void, opts?: { silent?: boolean }) => void
```

```ts
const mutate: StoreShape['mutate'] = (fn) => {
  set((store) => {
    if (!store.state) return store;
    const next = produce(store.state, fn);   // immer: mutate a draft, get a new immutable state
    return { ...store, state: next };
  });
  grantAchievements(set, get);               // auto-grant any newly-met badges, toast each once
  scheduleSave(get);                         // debounced 250ms flush to persistence
};
```

Lifecycle / infra actions:
- `hydrate(): Promise<void>` — load from persistence, **backfill missing fields** against `freshState()`, re-save, set `{ state, hydrated: true }`, re-arm reminder notifications. (Full body in §2.2.)
- `finishOnboarding(species, petName)` — build a `freshState()`, set species+name, `set` it and **`persistence.save(s)` immediately** (not debounced).
- `resetData(): Promise<void>` — `persistence.wipe()` then `set({ state: null, overlays: [], toast: null })`.
- `showToast`, `openOverlay`, `closeOverlay`, `closeAllOverlays` — pure UI stack ops.

Gameplay actions (the focus-domain ones HabitHatch reframes): `setTab`, `collectIdle`,
`feed`, `equip`, `buildMilestone`, `buyFood`, `buyClothes`, `buyPet`, `addQuest`,
`addQuests`, `setGoal`, `togglePlan`, **`completeFocus`**, **`leaveFocus`**,
`setActiveSession`, plus settings/profile setters, reminder CRUD, and the only networked
ones (`redeemReferral`, `fetchReferralCode`, `runSync`, `purchasePremium`, `restorePremium`).

Two module-level helpers + a dev hook:
- `scheduleSave(get)` — the debounce (§1.5 / §2.3).
- `grantAchievements(set, get)` — after every `mutate`, diff `ACHIEVEMENTS` against `state.achievements` via `achMet(s, id)`, push newly-met ids, toast each.
- `if (__DEV__ && window) (window as any).__store = useStore` — exposes the store for automated verification.

The canonical write pattern (read-guard outside, mutate inside, toast after) — copy this shape for habit actions:

```ts
feed: (foodId) => {
  const s = get().state;
  if (!s) return;
  if ((s.pet.food[foodId] || 0) <= 0) { get().showToast('You have none of that treat'); return; }
  const f = FOODS.find((x) => x.id === foodId); if (!f) return;
  mutate((d) => {
    d.pet.food[foodId] = (d.pet.food[foodId] || 0) - 1;
    d.pet.health = Math.min(100, d.pet.health + f.heal);
    d.insights.mealsFed += 1;
  });
  get().showToast(`${s.pet.name} enjoyed the ${f.name.toLowerCase()}`);
},
```

### 1.4 `src/db/persistence.ts` — snapshot persistence

The whole domain state is stored as **one JSON document** in a single-row key-value table —
no relational schema, no JOINs (see the file's own header and docs/SPEC.md D6). Exports:

```ts
export interface Persistence {
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
  wipe(): Promise<void>;
}
export const persistence: Persistence =
  Platform.OS === 'web' ? new WebPersistence() : new SqlitePersistence();
```

The **native (expo-sqlite) schema and I/O** — this is the "table/schema" to extend
conceptually (the `habits`/`habit_logs`/etc. tables in PLAN.md are *logical* slices of the
same JSON document, not new SQL tables — see §4.1):

```ts
const KEY = 'app_state';

// lazy singleton db, table created on first touch
const database = await SQLite.openDatabaseAsync('pawductivity.db');
await database.execAsync(
  'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
);

// load
const row = await database.getFirstAsync('SELECT value FROM kv WHERE key = ?;', KEY);
return deserialize(row?.value);

// save (upsert the single document)
await database.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?);', KEY, serialize(state));

// wipe
await database.runAsync('DELETE FROM kv WHERE key = ?;', KEY);
```

Serialization strips the runtime-only `tab` before persisting and re-defaults it on load:

```ts
function serialize(state: AppState): string {
  const { tab, ...rest } = state;   // drop runtime-only tab
  return JSON.stringify(rest);
}
function deserialize(raw: string | null | undefined): AppState | null {
  if (!raw) return null;
  try { return { tab: 'home', ...JSON.parse(raw) } as AppState; } catch { return null; }
}
```

All adapter methods swallow their errors (`console.warn` + return `null`/no-op) so a
storage failure degrades to "start fresh" rather than crashing.

### 1.5 The debounce (in store.ts, drives persistence cadence)

```ts
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(getState: () => StoreShape) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = getState().state;
    if (s) persistence.save(s);
  }, 250);
}
```

So writes coalesce: a burst of `mutate` calls results in **one** SQLite upsert 250ms after
the last one. Three paths bypass the debounce and save **immediately**: `hydrate` (post-
migration), `finishOnboarding`, and the `runSync` restore branch.

---

## 2. HOW IT CONNECTS

### 2.1 Boot → hydrate → render gate

```
App.tsx  useEffect(() => useStore.getState().hydrate())   // fire-and-forget on mount
   └─ hydrate(): persistence.load() → migrate vs freshState() → set({state, hydrated:true})
                                                          → Notif.syncReminders(...)
RootNavigator.tsx  const hydrated = useStore(s => s.hydrated)
                   const hasState = useStore(s => !!s.state)
   └─ once the splash timer is up AND hydrated: route to the app if hasState,
      else to Onboarding (state === null ⇒ new/never-onboarded user)
```

`hydrated` is the "loading finished" flag; `state === null` **after** hydration means "no
saved user → show onboarding". `finishOnboarding` creates the first real state; `resetData`
returns to `state: null` which bounces back to onboarding.

### 2.2 The migration/backfill on hydrate (critical for schema growth)

```ts
hydrate: async () => {
  const loaded = await persistence.load();
  if (loaded) {
    const def = freshState();
    const migrated: AppState = {
      ...def, ...loaded,                                   // loaded wins over defaults
      profile:  { ...def.profile,  ...(loaded.profile  || {}) },
      pet:      { ...def.pet,      ...(loaded.pet      || {}) },
      streak:   { ...def.streak,   ...(loaded.streak   || {}) },
      settings: { ...def.settings, ...(loaded.settings || {}) },
      cloud:    { ...def.cloud,    ...(loaded.cloud     || {}) },
      insights: { ...def.insights, ...(loaded.insights || {}) },
      today:    { ...def.today,    ...(loaded.today     || {}) },
      lifetime: { ...def.lifetime, ...(loaded.lifetime  || {}) },
      quests:   Array.isArray(loaded.quests) ? loaded.quests : def.quests,
      reminders: Array.isArray(loaded.reminders) ? loaded.reminders : def.reminders,
      plan:     Array.isArray(loaded.plan) ? loaded.plan : [],
      achievements: Array.isArray(loaded.achievements) ? loaded.achievements : [],
      completedDays: Array.isArray(loaded.completedDays) ? loaded.completedDays : def.completedDays,
      deviceId: loaded.deviceId || newDeviceId(),
    };
    persistence.save(migrated);                            // re-persist the upgraded doc
    set({ state: migrated, hydrated: true });
    Notif.syncReminders(migrated.reminders, migrated.settings.notif);
    return;
  }
  set({ state: null, hydrated: true });
},
```

**This is the migration story for the snapshot model.** There are no SQL migrations; instead,
every object slice is shallow-merged over its `freshState()` default and every array is
type-guarded. A state written by an older build that lacks a newly-added slice gets it
backfilled here, so no screen ever spreads an `undefined` slice and crashes. **Every new
slice you add (`habits`, `habitLogs`, `daySummaries`, `gardenPlots`, new `pet`/`profile`
fields) MUST be added both to `freshState()` and to this merge block**, or old saves won't
get it.

### 2.3 The write path (every mutation)

```
UI calls a store action  →  action reads via get().state (guard)  →  mutate(draft => …)
   mutate:  produce(state, fn)  →  set({ state: next })
            →  grantAchievements(set, get)   (may push badge ids + toast)
            →  scheduleSave(get)             (250ms debounce → persistence.save)
```

Components subscribe with selectors (`useStore(s => s.state.pet.health)`); immer's
structural sharing means only touched slices produce new references, so unrelated selectors
don't re-render.

### 2.4 Catalogs & mechanics (read-only collaborators)

`store.ts` imports data catalogs and pure functions rather than embedding rules:
- `src/domain/catalogs.ts` → `FOODS, CLOTHES, SPECIES, JOURNEY, ACHIEVEMENTS, STAGES, STAGE_GOAL, DURS, TAGS, …`.
- `src/domain/mechanics.ts` → pure helpers: `idlePending(pet)`, `petStage(pet)` (`= min(5, 1 + floor(home.length/2))`), `stageName(n) = STAGES[n-1]`, `moodOf(health)`, `achMet(state, id)`, `reward(est)`.

Actions call these but keep no logic of their own beyond wiring. **HabitHatch changes
happen mostly here** (new catalogs: garden plots, habit categories; new mechanics: due-today
resolver, two-tier streak evaluator, day-rollover), leaving `mutate`/persistence untouched.

### 2.5 The networked seam (leave alone)

Only `redeemReferral`, `fetchReferralCode`, `runSync`, and the billing actions talk to a
server, keyed by `deviceId`. Everything else is device-local. `runSync` push/pull uses the
**whole `AppState`** as the sync payload — so adding habit slices automatically syncs them,
no transport change needed.

---

## 3. REUSE VERBATIM

Copy these into HabitHatch essentially unchanged:

1. **`src/db/persistence.ts` — copy whole.** The only edit is cosmetic: the DB filename
   `'pawductivity.db'` → `'habithatch.db'` (line in `SqlitePersistence.db()`). The `kv`
   table, `KEY = 'app_state'`, serialize/deserialize (incl. stripping `tab`), the web
   fallback, and the swallow-errors posture all stay. Because it stores the entire `AppState`
   as one JSON blob, **it needs zero changes when you add habit slices** — new fields ride
   along automatically.

2. **The store scaffolding in `store.ts`:**
   - `mutate` (immer `produce` + `set` + grantAchievements + scheduleSave) — copy verbatim.
   - `scheduleSave` / `saveTimer` 250ms debounce — copy verbatim.
   - The overlay stack (`overlays`, `openOverlay`/`closeOverlay`/`closeAllOverlays`, the
     `'reward'`-is-terminal and "bring-to-front instead of duplicate" logic) — copy; only
     the `OverlayName` union membership changes (add `'nursery'`, `'garden'`, `'habitEditor'`;
     drop `'focus'` if no timer ships).
   - `showToast` / `ToastMsg` / `toastSeq` — copy verbatim.
   - `hydrated` flag + the `__DEV__ window.__store` hook — copy verbatim.
   - The **migration/backfill structure** in `hydrate` — copy the *pattern* (extend the
     merge with new slices, §4.4).

3. **`grantAchievements` machinery** — the diff-against-`ACHIEVEMENTS`/`achMet` loop and
   staggered toasts are reused; only the `ACHIEVEMENTS` catalog content and `achMet` rules
   change (PLAN.md §7.6: 12 reframed badges).

4. **`newDeviceId()`** (`state.ts`) — copy verbatim; the referral/sync backend contract is
   unchanged.

5. **The reused action bodies** that are already habit-agnostic: `collectIdle`, `feed`,
   `equip`, `buildMilestone` (→ plant a garden plot), `buyFood`, `buyClothes`, `buyPet`,
   settings/profile setters, reminder CRUD, `redeemReferral`, `fetchReferralCode`, `runSync`,
   billing. Their *copy strings* get reworded but their coin/health/immer logic stands.

---

## 4. CHANGE FOR HABITHATCH

Mental model first: **PLAN.md §6's `habits` / `habit_logs` / `day_summary` / `garden_plots`
"tables" are logical slices of the one JSON `AppState` document, not new SQL tables.** The
`kv`-single-row persistence is unchanged; you model them as arrays/records on `AppState` and
they serialize with everything else. Do **not** add real `CREATE TABLE`s — that would fork
the persistence model away from the reusable spine.

### 4.1 New entity types (add to `types.ts`)

Mirror PLAN.md §6 columns as interfaces:

```ts
export type HabitCategory =
  | 'water' | 'exercise' | 'read' | 'meditate' | 'run'
  | 'hygiene' | 'nophone' | 'wake' | 'sleep' | 'medicine' | 'custom';
export type HabitType = 'good' | 'bad';
export type ScheduleKind = 'daily' | 'weekdays' | 'times_per_week';
export type LogStatus = 'done' | 'skipped' | 'slipped' | 'frozen';

export interface Habit {
  id: string;                 // uuid
  name: string;
  category: HabitCategory;
  icon: string;               // cat-*.svg key
  type: HabitType;            // good | bad
  scheduleKind: ScheduleKind;
  weekdays?: number[];        // when 'weekdays' (e.g. [1,2,3,4,5])
  targetPerWk?: number;       // when 'times_per_week'
  reminderTime?: string;      // 'HH:MM' local, nullable
  color: string;              // token key for row accent
  curStreak: number;
  bestStreak: number;
  coinsEarned: number;
  sortOrder: number;
  archived: boolean;
  createdAt: number;          // epoch ms
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;               // 'YYYY-MM-DD' LOCAL (never UTC — see §5)
  status: LogStatus;
  coins: number;
  createdAt: number;
}                             // logical UNIQUE(habitId, date) — enforce in the store, not SQL

export interface DaySummary {
  date: string;               // 'YYYY-MM-DD', the key
  dueCount: number;
  doneCount: number;
  allClear: boolean;
  coins: number;
  healthEnd: number;          // companion health at day close (0-100) — enables deterministic decay replay
}

export interface GardenPlot {
  id: string;                 // 'plot_sprout', 'plot_orchard', …
  planted: boolean;
  plantedAt?: number;
}
```

### 4.2 Extend existing slice types (`types.ts`)

Per PLAN.md §6 `ALTER`s, add fields to the reused slices:

```ts
export interface Pet {           // + hatch state
  // …existing fields…
  hatchState: 'egg' | 'crack' | 'hatched';
  hatchProgress: number;         // 0..3 (overall-streak days toward hatch)
  // species stays; it's chosen at onboarding but only REVEALED at hatch
}

export interface Profile {       // + overall streak & freeze economy
  // …existing fields…
  overallStreak: number;
  overallBestStreak: number;
  freezes: number;               // Streak Freeze tokens
  lastFreezeRefill?: string;     // ISO-week id 'YYYY-Www' of last weekly grant (dedupe guard)
  dailyGoal: number;             // habits/day = win (0 = "all due")
}
```

Update `AppState` to carry the new collections and drop focus-only fields:

```ts
export interface AppState {
  // …reused slices (profile, pet, streak, settings, cloud, insights, lifetime, …)…
  habits: Habit[];               // NEW — the core entity (replaces quests as the row list)
  habitLogs: HabitLog[];         // NEW — completion ledger
  daySummaries: DaySummary[];    // NEW — daily rollups (or Record<string, DaySummary>)
  gardenPlots: GardenPlot[];     // NEW — Journey reframe progress
  // quests / plan / activeSession / today.min|sessions become vestigial:
  //   - drop `activeSession` (no persisted timer in MVP)
  //   - repurpose `today` to a habit-count ring: { done; due; goalCount } (see §4.5)
  nextId: number;                // keep as a monotonic source if you keep numeric ids anywhere
  deviceId: string;              // keep
  onboarded: boolean; tab: /* new tab union */;
}
```

`tab` union: swap `'quests'`/`'cal'` framing as your nav dictates (e.g. `'home' | 'pet' |
'garden' | 'insights'`). It stays **runtime-only and stripped on save** — don't touch
`serialize`.

### 4.3 `freshState()` (`state.ts`) — eggbound new user

The key semantic change: **a new user has no pet — they have an egg.** Set:

```ts
pet: {
  species: 'cat',            // chosen at onboarding, hidden until hatch
  name: 'Egg',               // no name until hatch (name-your-companion in the Nursery)
  health: 100,               // health only matters post-hatch, but keep the full-health invariant
  stage: 1, clothesId: 0, home: [], lastCollect: Date.now(), food: {}, ownedClothes: [],
  hatchState: 'egg', hatchProgress: 0,   // NEW
},
profile: { name: 'Friend', avatar: 0, level: 1, xp: 0, needed: 160, coins: 0, premium: false,
           overallStreak: 0, overallBestStreak: 0, freezes: 0, dailyGoal: 0 },  // + new fields
habits: [], habitLogs: [], daySummaries: [], gardenPlots: [],   // NEW empty collections
today: { done: 0, due: 0, goalCount: 0 },   // habit-count ring, not minutes
```

Keep the "everything earned, only health non-zero" invariant. Note `home: []` is now the
**garden-plot ids** you've planted (reused `pet.home` array drives `petStage` via
`mechanics.petStage`) — OR migrate that to `gardenPlots`; if you keep `pet.home` for
`petStage`, be aware PLAN.md §7.3 re-gates growth on **overall best streak**, not
`home.length`, so `petStage`/`STAGE_GOAL` logic must move to a streak-milestone check.

### 4.4 Extend the hydrate migration (`store.ts`) — do not forget this

For **every** new slice, add a line to the backfill in §2.2 or old installs crash:

```ts
const migrated: AppState = {
  ...def, ...loaded,
  profile: { ...def.profile, ...(loaded.profile || {}) },   // picks up overallStreak/freezes/dailyGoal
  pet:     { ...def.pet,     ...(loaded.pet     || {}) },    // picks up hatchState/hatchProgress
  // …existing merges…
  habits:       Array.isArray(loaded.habits) ? loaded.habits : def.habits,
  habitLogs:    Array.isArray(loaded.habitLogs) ? loaded.habitLogs : def.habitLogs,
  daySummaries: Array.isArray(loaded.daySummaries) ? loaded.daySummaries : def.daySummaries,
  gardenPlots:  Array.isArray(loaded.gardenPlots) ? loaded.gardenPlots : def.gardenPlots,
};
```

### 4.5 Swap the focus actions for habit actions (`store.ts`)

Delete/replace the timer domain; keep the `mutate` idiom identical. Concretely:

- **Remove** `completeFocus`, `leaveFocus`, `setActiveSession` (no timer in MVP).
- **Add** habit CRUD + the check-off, all via `mutate`:
  - `addHabit(spec) / editHabit(id, patch) / archiveHabit(id) / reorderHabits(...)`.
  - `checkOff(habitId, date)` — the new core loop action. Inside one `mutate`: write/lookup
    the `HabitLog` for `(habitId, date)` enforcing the logical `UNIQUE(habitId,date)`; grant
    coins per PLAN.md §7.1 `base(5) + streakBonus(min(floor(cur/3),5)) + hardBonus(daily?1:0)`;
    bump `habit.curStreak`/`bestStreak` and `habit.coinsEarned`; add to `profile.coins` and
    `profile.xp` (XP = lifetime coins, level curve reused). For **bad** habits, a check means
    "slipped" → no coin, streak resets (default the day to avoided; explicit "I slipped" tap,
    PLAN.md §12 risk 3).
  - After the check-off, recompute `today.done`/`due` and, at day close/rollover, `allClear`,
    `overallStreak`, `hatchProgress`, and the `DaySummary` row.
- **Reframe `buildMilestone` → plant a garden plot**: same coin-spend + `pet.home.push`
  shape, pointed at the `GARDEN` catalog (PLAN.md §7.5, 8 plots 120→4,800) instead of `JOURNEY`.
- **Reword** every `showToast` string from focus-speak to habit-speak ("Finish a focus
  session…" → "Check off a habit…", etc.), and `finishOnboarding`'s ready toast.
- The **daily rollover** (decay + streak eval + `DaySummary` write + Streak-Freeze refill/
  consume, PLAN.md §6/§7.2/§7.4) is a **new pure function** `rollover(state, fromDate,
  toDate)` called from `hydrate` (after migration, before the immediate save) so it runs on
  every launch and is deterministic across multi-day gaps. This is the highest-risk logic
  (PLAN.md §12 risk 1) — unit-test it; store local `YYYY-MM-DD`, never UTC.

### 4.6 SPECIES override (`catalogs.ts`) — the one economy edit, NOT reused verbatim

Pawductivity ships **6** species incl. `rabbit`; HabitHatch has **no rabbit art**. Override
to **5** and re-flag premiums (PLAN.md §10):

```ts
// Pawductivity (do NOT copy as-is):
export const SPECIES = [
  { id: 1, key: 'dog', name: 'Dog', price: 500, premium: false },
  { id: 2, key: 'cat', name: 'Cat', price: 800, premium: false },
  { id: 3, key: 'rabbit', name: 'Rabbit', price: 1200, premium: true },   // ← REMOVE (no art)
  { id: 4, key: 'fox', name: 'Fox', price: 1600, premium: false },
  { id: 5, key: 'penguin', name: 'Penguin', price: 2400, premium: false },
  { id: 6, key: 'axolotl', name: 'Axolotl', price: 3600, premium: false },
];

// HabitHatch (5 species; dog/cat free starters, fox/penguin coin-unlock, axolotl premium):
export const SPECIES = [
  { id: 1, key: 'dog',     name: 'Dog',     price: 0,    premium: false }, // starter
  { id: 2, key: 'cat',     name: 'Cat',     price: 0,    premium: false }, // starter
  { id: 4, key: 'fox',     name: 'Fox',     price: 1600, premium: false },
  { id: 5, key: 'penguin', name: 'Penguin', price: 2400, premium: false },
  { id: 6, key: 'axolotl', name: 'Axolotl', price: 3600, premium: true  }, // HabitHatch+
];
```

Also **narrow `type Species`** in `types.ts` to drop `'rabbit'` so `buyPet`/onboarding can't
reference unshippable art. Keep the reused Shop prices otherwise (PLAN.md §7.1: calibrate the
faucet, not prices).

---

## 5. GOTCHAS

1. **Local dates, never UTC — the whole streak/decay model depends on it.** `HabitLog.date`,
   `DaySummary.date`, and the rollover walk use `'YYYY-MM-DD'` / ISO-week ids computed in the
   device's local zone. Storing UTC timestamps for day boundaries breaks decay/streaks across
   DST and midnight edges (PLAN.md §12 risk 1). The reused `Reminder.doneOn` already uses
   `'y-m-d'` string keys — follow that convention.

2. **SQLite snapshot flush is debounced (250ms) and coalescing — mind the last-write.** A
   rapid burst of check-offs produces a single upsert 250ms after the *last* one. On a hard
   kill within that window the last mutation can be lost. Pawductivity accepts this for
   gameplay but bypasses it on the paths that must not lose data: `hydrate` (post-migration
   `persistence.save(migrated)`), `finishOnboarding`, and the `runSync` restore. **Call
   `persistence.save(get().state)` immediately after the launch-time `rollover`** for the same
   reason — you don't want a crash right after boot to re-run decay twice. The rollover must
   also be **idempotent** (guarded by `DaySummary` existence + `lastFreezeRefill` week id, per
   PLAN.md §6) so replayed launches never double-apply decay or double-mint freezes.

3. **The migration/backfill is your only "schema migration".** There is no SQL DDL versioning
   — growth is handled entirely by the shallow-merge-over-`freshState()` in `hydrate` (§2.2/
   §4.4). Add each new slice in **both** `freshState()` and that merge, and default new
   *scalar* fields inside the slice's `{ ...def.slice, ...loaded.slice }` (a `loaded.pet`
   from an old build simply won't have `hatchState`, so `def.pet.hatchState` fills it). Miss
   it and a screen that reads `state.habits.map(...)` throws on an old save.

4. **`tab` is runtime-only and stripped on save — keep it that way.** `serialize` does
   `const { tab, ...rest } = state`. If you add other purely-ephemeral UI fields to
   `AppState`, either strip them too or accept them persisting. Don't move `tab` into a
   persisted slice.

5. **Reanimated 4 / Fabric matrix engine (`PetSprite.tsx`) — leave the store out of the
   UI-thread path.** The SVG species (fox/penguin/axolotl) animate via a reanimated-4
   UI-thread `matrix` worklet driven by mood/health. The store just holds `pet.health`; the
   worklet reads a derived speed. Don't try to drive per-frame animation through zustand
   `set` — keep animation state in shared values, domain state in the store. No changes
   needed to the engine (PLAN.md §10).

6. **Babel: do NOT add the reanimated/worklets plugin.** `babel.config.js` is just
   `presets: ['babel-preset-expo']`; the Expo SDK 57 preset auto-appends
   `react-native-worklets/plugin` (required by reanimated 4). Adding it manually double-
   applies and breaks worklets. There is **no `metro.config.js`** in the repo — Expo's
   default metro is used. Copy both facts as-is.

7. **SVGs are consumed as raw XML strings via `SvgXml`, not imported as components.** There
   is **no `react-native-svg-transformer`** (absent from deps) and no metro SVG rule — `Icon`
   does `import { SvgXml } from 'react-native-svg'` and `return <SvgXml xml={xml} …/>`. So the
   20 new HabitHatch SVGs (egg-whole/crack/hatch, habit-ring, streak-flame, garden-sprout/
   tree/orchard, the `cat-*` category icons — PLAN.md §11) must be registered as **inline XML
   strings** in the asset registry / icon keyset, exactly like the existing icons — not
   `require('...svg')`. PNGs still go through `require()` (see `src/assets/registry.ts`).

8. **`petStage` currently derives from `pet.home.length`, but HabitHatch re-gates growth on
   overall streak.** `mechanics.petStage = min(5, 1 + floor(home.length/2))` and `STAGE_GOAL=4`
   are minutes/home-based. PLAN.md §7.3 wants stages gated on overall best-streak milestones
   (7/21/50/100 days). Repoint the stage computation at `profile.overallBestStreak` and keep
   `pet.home`/`gardenPlots` purely for the Garden, or the companion's body won't track
   consistency as designed.
