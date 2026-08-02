# Fork guide — `domain/mechanics.ts` + `domain/catalogs.ts`

Source of truth: `Pawductivity/src/domain/mechanics.ts` and `Pawductivity/src/domain/catalogs.ts`.
These two files are the **pure game core**: coins, the xp/level curve, growth stages, the idle
jar, home/journey perks, mood, achievements, plus every catalog table (foods, clothes, species,
`JOURNEY`, `ACHIEVEMENTS`) and the loose game constants. No React, no SQLite, no I/O — every
function takes explicit state slices, so they are store-agnostic and unit-testable. That purity is
exactly why ~90% of this ports to HabitHatch by copy-paste + a handful of number/table edits.

This guide maps each export to the HabitHatch concepts in `PLAN.md` (habits / habit_logs /
day_summary / garden_plots, the egg-hatch gate, two-tier streaks, the Habit Garden, the 5-species
override).

---

## 1. WHAT'S HERE

### `mechanics.ts` — pure game logic

Imports only `AppState, Pet` (from `./types`) and `JOURNEY, STAGES` (from `./catalogs`). Every
export, with its exact signature:

| Export | Signature | Responsibility |
|---|---|---|
| `Mood` (interface) | `{ t: string; k: string; spd: number; bonus: number }` | Mood descriptor: label, key, idle **spd** multiplier, coin **bonus** fraction. |
| `moodOf` | `(h: number) => Mood` | Health→mood. Thresholds **80 / 40 / 15**: Happy(1.25,0.25) · Content(1,0.1) · Tired(0.7,0) · Hungry(0.6,0). |
| `bonusPct` | `(h: number) => number` | `round(moodOf(h).bonus*100)` — the mood coin bonus as a percent for UI. |
| `shieldActive` | `(h: number) => boolean` | `h >= 60` — "streak shield" visual gate. |
| `petStage` | `(pet: Pet) => number` | `min(5, 1 + floor(pet.home.length / 2))` — **stage is derived from home items built**, capped 5. |
| `moodRate` | `(h: number) => number` | Health→idle earn multiplier (1 / 0.7 / 0.4 / 0.25). |
| `homePerks` | `(pet: Pet) => { rate: number; cap: number; decay: number }` | Sums `rate`/`cap` and takes the **min** `decay` across every `JOURNEY` milestone the pet owns. |
| `idleRate` | `(pet: Pet) => number` | `max(1, round((6 + homePerks(pet).rate) * moodRate(pet.health)))` — coins/hr the jar earns. |
| `idleCap` | `(pet: Pet) => number` | `8 + homePerks(pet).cap` — max hours the jar accrues. |
| `idlePending` | `(pet: Pet, now = Date.now()) => number` | Floor of `min(cap, elapsedHrs) * rate` since `pet.lastCollect`. |
| `idleFull` | `(pet: Pet, now = Date.now()) => boolean` | Whether the jar has hit its cap. |
| `homeOwned` | `(pet: Pet, id: string) => boolean` | `pet.home.includes(id)`. |
| `nextMilestone` | `(pet: Pet) => Milestone \| undefined` | First `JOURNEY` entry not yet built. |
| `homePct` | `(pet: Pet) => number` | `round(home.length / JOURNEY.length * 100)`. |
| `stageName` | `(n: number) => string` | Index into `STAGES` (clamped). |
| `clothesKey` | `(pet: Pet) => string` | `clothesId>0 ? String(clothesId) : 'default'` — Lottie/asset key. |
| `reward` | `(est: number) => number` | `floor(est / 60)` — **coins == xp == whole minutes of the estimate** (the focus faucet). |
| `isDone` | `(q: { done: number; est: number }) => boolean` | `q.done >= q.est`. |
| `fmt` | `(sec: number) => string` | Human duration (`"25m"`, `"1h 5m"`). |
| `mmss` | `(sec: number) => string` | `"M:SS"` clock (focus timer only). |
| `money` | `(n: number) => string` | `n.toLocaleString('en-US')`. |
| `achProgress` | `(s: AppState, id: string) => [number, number] \| null` | `[current, target]` for a countable badge, else `null`. |
| `achMet` | `(s: AppState, id: string) => boolean` | Whether a badge is earned now (countables via `achProgress`, plus a few one-off `switch` cases). |

Plus a private helper `achStats(s: AppState)` that rolls `AppState` into the numbers the badge map
reads: `sessions, hrs, strk, gdays, stg, hc, outs, coins`.

```ts
// mechanics.ts — the two faucet/curve lines you will retune
export const reward = (est: number) => Math.floor(est / 60);        // coins==xp==minutes
export const idleRate = (pet: Pet) =>
  Math.max(1, Math.round((6 + homePerks(pet).rate) * moodRate(pet.health)));
export const idleCap  = (pet: Pet) => 8 + homePerks(pet).cap;
```

### `catalogs.ts` — data tables + constants

| Export | Shape / value | Notes |
|---|---|---|
| `FoodItem` | `{ id:number; name:string; price:number; heal:number; premium:boolean }` | |
| `ClothesItem` | `{ id:number; name:string; price:number; premium:boolean }` | |
| `SpeciesItem` | `{ id:number; key:Species; name:string; price:number; premium:boolean }` | **`key` is the `Species` union** — the load-bearing shape for the 5-species override. |
| `FOODS` | 5 items, price 5–15, heal 10–20 | Apple/Chicken/Watermelon/Carrot free; Pizza premium. |
| `CLOTHES` | 5 items, price 80–400 | |
| `SPECIES` | **6 items** | dog(500,free) · cat(800,free) · **rabbit(1200,premium)** · fox(1600,free) · penguin(2400,free) · axolotl(3600,free). |
| `Milestone` | `{ id; name; desc; cost; perk; rate?; cap?; decay?; final?; ic }` | The Journey/Garden row shape. `ic` is an `Icon` name. |
| `JOURNEY` | 9 milestones, cost 60–2000 | Each grants a `rate` (coins/hr), `cap` (idle hrs), and/or `decay` perk; last has `final:true`. |
| `Achievement` | `{ id; group; name; desc; ic?; imgFood? }` | |
| `ACHIEVEMENTS` | 46 badges, grouped | IDs are matched by `achMet`/`achProgress`. |
| `STAGES` | `['Baby','Young','Grown','Prime','Legend']` | |
| `STAGE_GOAL` | `4` | |
| `DURS` | `[label, seconds][]` (15m–2h) | Focus capture only. |
| `TAGS` | `['Work','School','Sport','Personal','Project']` | Quest tags. |
| `CAP_REPS` / `REM_REPS` | `[label, key][]` | Repeat options. |
| `SOUNDS` | `[name, id, free][]` | Focus soundscapes. |
| `ACCENTS` | `{name,a,b,premium}[]` | Premium accent themes. |
| `POMO_WORK` / `POMO_BREAK` | `1500` / `300` | Pomodoro. |
| `DISCORD_URL` | string | |

```ts
// catalogs.ts — the SPECIES table you will override (see §4)
export interface SpeciesItem { id: number; key: import('./types').Species; name: string; price: number; premium: boolean; }
export const SPECIES: SpeciesItem[] = [
  { id: 1, key: 'dog',     name: 'Dog',     price: 500,  premium: false },
  { id: 2, key: 'cat',     name: 'Cat',     price: 800,  premium: false },
  { id: 3, key: 'rabbit',  name: 'Rabbit',  price: 1200, premium: true  }, // ← removed in HabitHatch
  { id: 4, key: 'fox',     name: 'Fox',     price: 1600, premium: false },
  { id: 5, key: 'penguin', name: 'Penguin', price: 2400, premium: false },
  { id: 6, key: 'axolotl', name: 'Axolotl', price: 3600, premium: false },
];
```

The `Species` union lives in `domain/types.ts`:
```ts
export type Species = 'dog' | 'cat' | 'rabbit' | 'fox' | 'penguin' | 'axolotl';
```

---

## 2. HOW IT CONNECTS

Both files are **leaf modules**: they import from `./types` and each other, nothing else imports
into them. Everything above them consumes them.

```
        catalogs.ts  ──►  mechanics.ts
             │                 │
             └────────┬────────┘
                      ▼
          store/store.ts  (zustand + immer)
                      │  mutate(fn) → grantAchievements() → scheduleSave()
                      ▼
        db/persistence.ts  (single-row SQLite/localStorage JSON snapshot)
                      │
                      ▼
   screens/*  ·  components/PetView, PetSprite, Icon, QuestRow, SpeciesThumb
```

- **Store (`store/store.ts`)** is the primary consumer. It imports `FOODS, CLOTHES, SPECIES,
  JOURNEY, ACHIEVEMENTS` and `idlePending, petStage, achMet, moodOf, stageName`. The gameplay
  actions read the catalogs and call the mechanics:
  - `collectIdle()` → `idlePending(pet)`.
  - `buyFood/buyClothes/buyPet` → look up the catalog row, check `premium`/`price`, mutate coins.
  - `buildMilestone(id)` → `JOURNEY.find`, spend `m.cost`, push to `pet.home`, recompute
    `pet.stage = petStage(d.pet)`, toast a stage-up via `stageName`.
  - `completeFocus()` → the **coin/xp faucet**: `base = floor(est/60)`, `bonus =
    round(base * moodOf(health).bonus)`, both added to `xp` and `coins`, then the level-up loop
    `needed = 10*level² + 50*level + 100`.
  - `mutate()` runs `grantAchievements()` after every state change: it loops `ACHIEVEMENTS` and
    toasts any whose `achMet(s, id)` newly returns true.
- **Persistence (`db/persistence.ts`)** stores the **entire `AppState` as one JSON document** in a
  single `kv(key,value)` row (native: expo-sqlite `pawductivity.db`; web: `localStorage`). It does
  **not** mirror the per-table SQL schema in `PLAN.md §6`. Writes are debounced 250ms
  (`scheduleSave`). See §5.
- **Screens** read catalogs + mechanics directly for rendering: `JourneyScreen` maps `JOURNEY` and
  calls `nextMilestone`/`homePct`; `AchievementsScreen` maps `ACHIEVEMENTS` + `achProgress`;
  `ShopScreen`/`BuySheet` map `FOODS`/`CLOTHES`/`SPECIES`; `FeedSheet` uses `FOODS`; `HomeTab`,
  `PetTab`, `InsightsScreen`, `RecapScreen`, `ProfileScreen`, `CaptureSheet`, `QuestRow` pull
  various helpers (`moodOf`, `fmt`, `money`, `idlePending`, `stageName`, …).
- **Rendering bridges**: `SpeciesItem.key` (Species) routes the companion renderer — `dog`/`cat`
  (and `rabbit`) go through **`PetView`** (Lottie in `assets/registry.lottiePet`); `fox`/`penguin`/
  `axolotl` go through **`PetSprite`** (reanimated SVG). `Milestone.ic` and `Achievement.ic` are
  keys into the inline **`Icon`** map (`heart/shield/bolt/sparkle/trophy/note/crown/…`).

---

## 3. REUSE VERBATIM

Copy these **unchanged** — they are activity-agnostic:

**From `mechanics.ts`:**
- `homePerks`, `idlePending`, `idleFull`, `homeOwned`, `nextMilestone`, `homePct` — the whole
  Journey→Garden perk/progress engine works as-is once `JOURNEY` is renamed to the garden table
  (they read `pet.home` + the milestone list generically).
- `moodRate` — the idle-speed curve (still keyed on health).
- `stageName`, `clothesKey` — pure lookups.
- `fmt`, `money` — formatting (`money` is used all over; `fmt` for any duration copy you keep).
- `isDone` — reusable for "habit satisfied" checks if you keep `{done, est}`-shaped rows.

**From `catalogs.ts`:**
- `FOODS`, `CLOTHES` (and their interfaces) — the Shop economy prices are **kept as-is**
  (`PLAN §7.1`: we recalibrated the faucet, not the prices).
- `STAGES`, `STAGE_GOAL` — Baby→Young→Grown→Prime→Legend is the HabitHatch growth ladder.
- `Milestone`, `Achievement` interfaces — same shapes; only the row data changes.
- `ACCENTS`, `DISCORD_URL` — theme + community link (swap the invite URL).
- `CAP_REPS`/`REM_REPS` — schedule/repeat label pairs are reusable as habit-schedule options.

**From the surrounding spine (context, not these two files but load-bearing):**
- `PetSprite.tsx`, `PetView.tsx`, `Icon.tsx`, `store.ts` mutate→grant→save plumbing,
  `persistence.ts`, `babel.config.js` — all reused; see §5 for the gotchas that make them work.

---

## 4. CHANGE FOR HABITHATCH

The core activity changes from *focus minutes* to *daily habit check-offs*, so the **faucet, the
stage gate, the mood thresholds, the idle base numbers, the achievement set, and the SPECIES
table** all move. The perk/idle/formatting scaffolding does not.

### 4.1 SPECIES override (the one required `catalogs.ts` edit)
HabitHatch ships **no rabbit art**, so drop rabbit and re-flag premium per `PLAN §9/§10`
(dog/cat free starters at price 0; fox/penguin free coin-unlocks; axolotl premium):

```ts
export const SPECIES: SpeciesItem[] = [
  { id: 1, key: 'dog',     name: 'Dog',     price: 0,    premium: false }, // starter, free
  { id: 2, key: 'cat',     name: 'Cat',     price: 0,    premium: false }, // starter, free
  { id: 3, key: 'fox',     name: 'Fox',     price: 1600, premium: false }, // coin unlock
  { id: 4, key: 'penguin', name: 'Penguin', price: 2400, premium: false }, // coin unlock
  { id: 5, key: 'axolotl', name: 'Axolotl', price: 3600, premium: true  }, // HabitHatch+
];
```
Then keep the union + asset maps in sync (see §5 "species/asset sync"): remove `'rabbit'` from the
`Species` type, and delete the `rabbit` entries from `assets/registry.ts` `speciesThumb` and
`lottiePet` — otherwise TS breaks and the Shop surfaces an unshippable rabbit.

### 4.2 Coin faucet — `reward` → habit check-off formula
Replace the minutes faucet. `reward(est)` and `completeFocus`'s `floor(est/60)` become the
per-check-off formula from `PLAN §7.1`:

```ts
// coins for a single good-done / bad-avoided check-off (5..11)
export function checkoffCoins(habit: { cur_streak: number; schedule_kind: string }): number {
  const base        = 5;
  const streakBonus = Math.min(Math.floor(habit.cur_streak / 3), 5); // +1 per 3-day tier, cap +5
  const hardBonus   = habit.schedule_kind === 'daily' ? 1 : 0;
  return base + streakBonus + hardBonus;
}
// end-of-day, written at rollover (see 4.6)
export const allClearBonus = (allClear: boolean) => (allClear ? 15 : 0);
export const overallBonus  = (overallStreak: number) => Math.min(overallStreak, 30);
```
Keep the **xp/level curve verbatim** (`needed = 10*level² + 50*level + 100`); `PLAN §7.3` sets
`xp = total lifetime coins`, so just feed coin gains into `xp` the way `completeFocus` already does.

### 4.3 Growth stages — `petStage` reframed to streak, not home items
Today `petStage = min(5, 1 + floor(home.length/2))`. `PLAN §7.3` gates stages on **overall best
streak** (Baby hatch → Young 7d → Grown 21d → Prime 50d → Legend 100d):

```ts
export function petStage(overallBestStreak: number, hatched: boolean): number {
  if (!hatched) return 0;              // still an egg
  if (overallBestStreak >= 100) return 5;
  if (overallBestStreak >= 50)  return 4;
  if (overallBestStreak >= 21)  return 3;
  if (overallBestStreak >= 7)   return 2;
  return 1;                            // Baby, at hatch
}
```
Update every caller: `store.buildMilestone` no longer recomputes stage from home; `achStats.stg`
reads the new source. Note the signature changes from `(pet)` to a streak number — grep callers.

### 4.4 Mood thresholds + colors — `moodOf`
`PLAN §7.2` uses different cutoffs and palette (≥75 happy / 45–74 content / 20–44 tired / <20
hungry). Retune `moodOf` (keep `spd`/`bonus` semantics; the `k`/color feeds the animation + UI):

```ts
export function moodOf(h: number): Mood {
  if (h >= 75) return { t: 'Happy',   k: 'happy',   spd: 1.25, bonus: 0.25 };
  if (h >= 45) return { t: 'Content', k: 'content', spd: 1,    bonus: 0.10 };
  if (h >= 20) return { t: 'Tired',   k: 'tired',   spd: 0.7,  bonus: 0 };
  return          { t: 'Hungry',  k: 'hungry',  spd: 0.6,  bonus: 0 };
}
```
`moodRate` and `shieldActive` can stay unless you want to align `shieldActive`'s `60` to the new
tiering.

### 4.5 Idle jar base numbers — `idleRate` / `idleCap`
`PLAN §7.1` sets the base to **1 coin/hr into a 50-coin cap** (garden perks stack on top). Retune
the two literals (the perk-summing structure via `homePerks` stays identical):

```ts
export const idleRate = (pet: Pet) =>
  Math.max(1, Math.round((1 + homePerks(pet).rate) * moodRate(pet.health)));  // 6 → 1
export const idleCap  = (pet: Pet) => 50 + homePerks(pet).cap;                // 8 → 50
```
(`idlePending`/`idleFull` need no change — they read these two.)

### 4.6 New: per-day decay + deterministic launch-time rollover
`mechanics.ts` has **no real-time decay** function (Pawductivity health only moves on focus/leave
events). HabitHatch needs a new pure module (`PLAN §7.2`, §6, build-risk #1) — keep it here, pure
and unit-tested:

```ts
// DECAY = 12 - gardenSlowdown, floor 6. Restore = +18*(done/due), cap +18.
export const DECAY_BASE = 12, DECAY_FLOOR = 6;
export function dayDecay(gardenSlowdown: number) {
  return Math.max(DECAY_FLOOR, DECAY_BASE - gardenSlowdown);
}
export function dayRestore(doneCount: number, dueCount: number) {
  return dueCount === 0 ? 0 : Math.min(18, Math.round(18 * doneCount / dueCount));
}
// rollover(state, fromDate, toDate): walk each elapsed local YYYY-MM-DD, apply decay/restore,
// evaluate all_clear (guarded on due_count>0), advance/reset streaks, spend freezes, write
// day_summary, step hatch_progress. Health never kills (floor 0). Pure → testable.
```
This is where `habits` / `habit_logs` / `day_summary` / `garden_plots` and the egg-hatch state
machine live. `day_summary.health_end` lets rollover recompute deterministically after days off.
Store local `YYYY-MM-DD` strings, never UTC, for day boundaries.

### 4.7 Journey → Habit Garden (data swap, engine kept)
Rename `JOURNEY` → `GARDEN` and replace the 9 rows with the **8 garden plots** from `PLAN §7.5`.
The `Milestone` shape is unchanged, so `homePerks`/`nextMilestone`/`homePct`/`buildMilestone` all
keep working. Map each plot's perk to the existing fields (`rate` = coins/hr, `cap` = idle hrs,
`decay` = decay reduction) and reuse the `ic` keyset (`bolt/sparkle/shield/heart/note/trophy/crown`):

```ts
export const GARDEN: Milestone[] = [
  { id: 'sprout',  name: 'First Sprout', desc: '…', cost: 120,  perk: '+1 coin / check-off', rate: 1, ic: 'bolt' },
  { id: 'herb',    name: 'Herb Patch',   desc: '…', cost: 300,  perk: 'Idle cap +50',        cap: 50, ic: 'sparkle' },
  { id: 'can',     name: 'Watering Can', desc: '…', cost: 550,  perk: 'Decay -2/day',        decay: 2, ic: 'shield' },
  { id: 'berry',   name: 'Berry Bush',   desc: '…', cost: 900,  perk: '+10% all-clear coins',           ic: 'heart' },
  { id: 'sapling', name: 'Young Sapling',desc: '…', cost: 1400, perk: '1 Streak Freeze / week',         ic: 'note' },
  { id: 'flowers', name: 'Flower Bed',   desc: '…', cost: 2100, perk: 'Idle cap +100, rate +25%', cap: 100, rate: 0.25, ic: 'sparkle' },
  { id: 'tree',    name: 'Fruit Tree',   desc: '…', cost: 3200, perk: 'Decay -2 more',       decay: 2, ic: 'trophy' },
  { id: 'orchard', name: 'Orchard',      desc: '…', cost: 4800, perk: '+20% coins everywhere', final: true, ic: 'crown' },
];
```
Note `homePerks` currently treats `decay` as a **min-multiplier** (`decay: 0.6`). The garden uses
**additive slowdown** (`-2/day`). Either change `Milestone.decay` semantics to additive and adjust
`homePerks` to `sum`, or express plot decay perks as multipliers — pick one and keep the rollover
in `4.6` consistent. `pet.home[]` can stay as the "planted plot ids" array (simplest reuse); the
`garden_plots` table in `PLAN §6` is the same data if you split it out.

### 4.8 Achievements — 46 → the 12 reframed badges
Replace `ACHIEVEMENTS` with the `PLAN §7.6` list and rewrite `achStats`/`achProgress`/`achMet` to
the new sources. The framework (map of `[current,target]`, `achMet`, the store's grant loop) is
reused verbatim; only IDs, thresholds, and the stat mapping change:

| Badge id | Kind | Source in `achStats`/trigger |
|---|---|---|
| `first_crack` | event | first check-off ever (granted by the check-off action) |
| `its_alive` | event | hatch fires (granted by the hatch state machine) |
| `green_thumb` | count | `garden plots planted >= 1` |
| `week_warrior` / `iron_month` / `centurion` | count | `overall best streak >= 7 / 30 / 100` |
| `habit_stacker` | count | `active habits alive same day >= 5` |
| `clean_break` | count | `bad-habit streak >= 14` |
| `perfect_week` | count | `consecutive all_clear days >= 7` |
| `well_fed` | count | `health>=75 for 10 straight days` |
| `full_bloom` | count | `plots planted == GARDEN.length` |
| `coin_farmer` | count | `coinsLifetime >= 10000` |

Rewrite `achStats` to read HabitHatch fields: `strk` from `profile.overall_best_streak`, `stg` from
the new `petStage`, `hc` from planted garden plots, `coins` from `insights.coinsLifetime`; drop the
focus-only stats (`sessions`/`hrs`). Keep the two-branch pattern (countables via `achProgress`,
event badges granted by their triggers and short-circuited in `achMet`).

### 4.9 Loose constants
- **Drop** `DURS`, `SOUNDS`, `POMO_WORK`, `POMO_BREAK`, `mmss` — focus/pomodoro only.
- **Replace** `TAGS` with the 11 habit categories (`water/exercise/read/meditate/run/hygiene/
  nophone/wake/sleep/medicine/custom`) matching the `cat-*.svg` set (`PLAN §11`).
- **Add** a `SCHEDULE_KINDS` constant (`daily / weekdays / times_per_week`) for the editor, and
  reuse `CAP_REPS`/`REM_REPS` shapes for the pickers.
- Keep `ACCENTS`; update `DISCORD_URL`.

---

## 5. GOTCHAS

- **Persistence is a JSON snapshot, not the SQL schema in `PLAN §6`.** `db/persistence.ts` stores
  the whole `AppState` as one row in `kv(key,value)` (`INSERT OR REPLACE`, key `'app_state'`; native
  `pawductivity.db`, web `localStorage`). The `CREATE TABLE habits/habit_logs/day_summary/
  garden_plots` in the plan are a **conceptual/relational description** — the reuse-true path is to
  add `habits: Habit[]`, `habitLogs: HabitLog[]`, `daySummary: Record<string,DaySummary>`,
  `gardenPlots` as **arrays/records on `AppState`**, serialized in the same snapshot. Only refactor
  `persistence.ts` to real tables if you deliberately want relational queries; the store/immer/save
  plumbing assumes one document. Also rename the DB file (`pawductivity.db` → `habithatch.db`) and
  the `deviceId` prefix if you want a clean install identity.
- **Snapshot flush is debounced 250ms.** `store.scheduleSave` waits 250ms after the last `mutate`
  before writing; `finishOnboarding` and the sync-pull path `persistence.save` **synchronously**.
  A kill within 250ms of a mutate can lose that write — fine for Pawductivity (next mutate reschedules,
  and `hydrate` re-saves the migrated state on load), but the HabitHatch **launch-time rollover**
  (decay/streak/day_summary) must run *after* hydrate and its result must be flushed. Save right
  after rollover (like `finishOnboarding` does) rather than trusting the debounce, so a fast kill
  can't drop a day's rollover. Rollover must also be **idempotent** (re-running a launch never
  double-decays or double-mints freezes — key freeze grants to the ISO-week id per `PLAN §6`).
- **Fabric + reanimated `matrix` escape-hatch (don't touch `PetSprite.tsx`).** `PetSprite`
  augments `react-native-svg`'s `GProps` with `matrix?: number[]` and animates the **native
  `matrix` prop on the UI thread** (`[a,b,c,d,tx,ty]`), because the discrete rotation/transform
  props are JS-resolved and would be bypassed by `useAnimatedProps`. Copy the file verbatim
  including the `declare module 'react-native-svg' { interface GProps { matrix?: number[] } }`
  block and the `'worklet'` matrix builders. `SpriteSpecies = 'fox'|'penguin'|'axolotl'` and
  `isSpriteSpecies` gate which species render here vs Lottie — they must match the SPECIES override.
- **Babel: do NOT add the reanimated/worklets plugin.** `babel.config.js` uses only
  `babel-preset-expo`, which (SDK 57) auto-appends `react-native-worklets/plugin` (required by
  reanimated 4). Adding it again double-applies and breaks worklets. HabitHatch's `babel.config.js`
  is already identical — leave it.
- **SVG consumption is two different paths.** `Icon.tsx` builds icons from **inline XML strings**
  via `SvgXml` (`viewBox 0 0 24 24`, `currentColor`) — `Milestone.ic`/`Achievement.ic` index this
  map, so garden/badge row icons are free as long as you reuse the existing keyset. But the **20 new
  `.svg` files** (`egg-*`, `habit-*`, `streak-flame`, `garden-*`, `cat-*`) are standalone assets and
  there is **no `react-native-svg-transformer` in `package.json`** — you cannot `require('*.svg')`
  as a component. Load them as SvgXml strings (read the file text) or via `expo-asset`, matching how
  `Icon` already inlines XML. Don't assume a metro SVG loader exists.
- **Species/asset maps must stay in lock-step with the union.** `Species` (types.ts),
  `SPECIES` (catalogs), `speciesThumb` + `lottiePet` (assets/registry), and
  `SpriteSpecies`/`isSpriteSpecies` (PetSprite) are four places that must agree. Removing `rabbit`
  means editing all of them; `PetView` falls back to `speciesThumb[species]` when no Lottie exists,
  so a dangling `rabbit` key silently renders a thumbnail instead of erroring. Per `PLAN §10`, copy
  the dog/cat Lottie into `assets/reused/lottie/{dog,cat}/`, keep fox/penguin/axolotl on `PetSprite`,
  and the PNGs are picker thumbnails only.
- **`petStage`'s signature change ripples.** Switching stage from `pet.home.length` to overall
  streak (§4.3) changes the argument type; `store.buildMilestone`, `achStats`, and any screen
  showing the stage all call it. Grep `petStage(` before you ship — the compiler will catch the
  type change, but the semantic change (building a garden plot no longer levels the companion) is
  the part to verify against the plan.
