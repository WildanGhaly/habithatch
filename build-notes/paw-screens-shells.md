# Fork Guide — Pawductivity Screen Shells → HabitHatch

Subsystem: the 15 screen/sheet files under `src/screens/` of Pawductivity
(`d:/Documents/Work/Project/Pawductivity`). This is the **presentation shell** the
HabitHatch builder reuses. It catalogs each file, how it wires into the store/domain,
what to copy verbatim, and the exact edits to reframe *focus sessions* → *daily habits*
per `PLAN.md` (§5 screen map, §6 data model, §7 gamification).

**One truth to hold onto:** these screens are *thin, dumb views*. They read
`useStore((st) => st.state)` and call named store actions. Almost no game logic lives in
a screen — it lives in `domain/mechanics.ts` + `store/store.ts`. So the shells port with
**copy + rename-symbol + reword-copy**; the real HabitHatch work is the domain layer
underneath them (habits/streaks/decay/hatch), which these files only *display*.

---

## 0. Shared spine every screen sits on (read first)

- **Store**: `src/store/store.ts` — a single zustand `create()` store. `state: AppState | null`
  (null until hydrated). Screens subscribe with selectors: `const s = useStore((st) => st.state)!`.
  Every mutation goes through `mutate((d) => { ... })` (immer `produce`) which then
  `grantAchievements()` and `scheduleSave()`.
- **Overlay navigation**: an `overlays: OverlayState[]` stack, driven by
  `openOverlay(name, param)` / `closeOverlay()`. `OverlayName` union (store.ts:16):
  ```ts
  type OverlayName =
    | 'focus' | 'shop' | 'premium' | 'referral' | 'insights' | 'journey'
    | 'achievements' | 'recap' | 'sync' | 'profile' | 'appearance' | 'reward'
    | 'capture' | 'goal' | 'plan' | 'buy' | 'feed';
  ```
  `OverlayHost` (mounted in `MainScreen`) renders the top of the stack. The 4 tabs
  (`home`/`quests`/`pet`/`cal`) are switched by `setTab`, NOT the overlay stack.
- **Persistence**: `src/db/persistence.ts` — a **single-document snapshot**, not relational
  tables. Native = expo-sqlite `kv(key TEXT PRIMARY KEY, value TEXT)` with one row
  `app_state` holding `JSON.stringify(state)`; web = `localStorage`. Save is **debounced
  250 ms** (`scheduleSave`). `serialize()` strips the runtime-only `tab` field.
- **Domain**: `src/domain/types.ts` (the `AppState` shape), `catalogs.ts` (FOODS, CLOTHES,
  SPECIES, JOURNEY, ACHIEVEMENTS, STAGES), `mechanics.ts` (pure functions: `moodOf`,
  `bonusPct`, `petStage`, `stageName`, `homePct`, `nextMilestone`, `idlePending`, `fmt`,
  `money`, `isDone`, `achProgress`/`achMet`).
- **Shared UI**: `components/ui.tsx` (`Txt`, `Card`, `Btn`, `CoinPill`, `Bounded`),
  `Icon.tsx` (keyed SVG icon set), `OverlayScreen.tsx` (chrome for full-screen overlays),
  `BottomSheet.tsx` (chrome for sheets), `PetView.tsx` (companion renderer), `theme/tokens.ts`
  (colors/radius/shadow/`catColors`/`moodColors`).

---

## 1. WHAT'S HERE — per-file catalog

For each: **purpose · top-level layout · store slices read · components used · PLAN.md target**.

### `HomeTab.tsx` → **Today (Home)** (`PLAN §5`)
- **Export**: `HomeTab({ onTab }: { onTab: (t: TabKey) => void })` — a tab, not an overlay.
- **Purpose**: the daily driver. Top bar (avatar+name+`CoinPill`), a "capture" CTA into the
  brain-dump sheet, the **pet room** `ImageBackground` + `PetView` + idle `CoinPile`, a pet-care
  card (health bar + Feed/Dress/Shop buttons), a Journey strip, the **daily-goal ring** (SVG
  `Circle` dash-offset), a "Your week" bar chart, and "Today's focus" = a list of up to 3
  `QuestRow`s.
- **Slices read**: `state.profile` (coins/name/avatar), `state.pet` (health/species/name), `state.quests`,
  `state.plan`, `state.today` (`min`/`goalMin`/`sessions`), `state.streak.current`, `state.insights.weekly`,
  `state.settings.room`.
- **Actions**: `collectIdle`, `openOverlay` (`profile`/`capture`/`feed`/`shop`/`journey`/`goal`/`insights`/`plan`/`focus`), `showToast`.
- **Components**: `Txt`,`Card`,`CoinPill`,`Bounded`,`Icon`,`PetView`,`QuestRow`,`CoinPile`, `LinearGradient`, `Svg/Circle`.
- **Local subcomponents**: `CareBtn`, `GChip`.
- → **HabitHatch "Today"**: the flagship reframe. Ring becomes *habits completed / due today*;
  QuestRow → habit row with per-habit flame + checkbox; add an **egg-progress banner** pre-hatch.

### `PetTab.tsx` → **Companion** (`PLAN §5`)
- **Export**: `PetTab()` — a tab.
- **Purpose**: see & care for the pet. Large pet room, a "home/Journey" progress card with a
  build-next-milestone `Btn`, a Health card (Feed/Wardrobe/Adopt), an Earnings/idle-jar card,
  a "what your pet does for you" benefits list, and a wardrobe grid.
- **Slices read**: `state.pet` (health/species/clothesId/home/ownedClothes/lastCollect), `state.profile.coins`, `state.settings.room`.
- **Actions**: `collectIdle`, `buildMilestone`, `equip`, `openOverlay` (`profile`/`journey`/`feed`/`shop`), `showToast`.
- **Mechanics used**: `moodOf`,`bonusPct`,`shieldActive`,`petStage`,`stageName`,`homePct`,`nextMilestone`,`idleRate`,`idleCap`,`idlePending`,`idleFull`.
- **Components**: `Txt`,`Card`,`CoinPill`,`Btn`,`Bounded`,`Icon`,`PetView`,`CoinPile`; local `CareBtn`,`WearTag`,`BenRow`.
- → **HabitHatch "Companion"**: mostly verbatim. Add the **egg/hatch state** display, growth-stage
  label gated on overall streak, and swap the "focus reward boost" benefit copy to habit framing.

### `ShopScreen.tsx` → **Shop** (`PLAN §5`)
- **Export**: `ShopScreen({ param }: { param?: { tab?: 'food'|'pets'|'clothes' } })` — overlay.
- **Purpose**: 3-tab segmented store (Food / Companions / Wardrobe). Maps `FOODS`/`SPECIES`/`CLOTHES`
  to `ShopCard`s; buy actions route to the `buy` sheet; owned outfits call `equip`.
- **Slices read**: `state.pet.food`, `state.pet.species`, `state.pet.ownedClothes`, `state.pet.clothesId`, `state.profile.premium`, `state.profile.coins`.
- **Actions**: `openOverlay('buy', {kind,id})`, `equip`.
- **Catalogs**: `FOODS`, `CLOTHES`, `SPECIES`. **Components**: `OverlayScreen`, `CoinPill`, `Icon`, `SpeciesThumb`; local `ShopCard`, `BuyButton` (a 5-variant `BtnSpec` renderer).
- → **HabitHatch "Shop"**: reused nearly as-is. The **only economy edit** is the SPECIES
  override (5 species, no rabbit — see §4). Food/Wardrobe tabs unchanged.

### `JourneyScreen.tsx` → **Habit Garden** (`PLAN §5`, §7.5)
- **Export**: `JourneyScreen()` — overlay.
- **Purpose**: long-term progression + coin sink. A teal hero with `PetView`, a progress bar
  (`homePct` / `JOURNEY.length`), then a list of `JOURNEY` milestones — each row shows `Icon`
  (`m.ic` key), name/desc/perk, and an owned/next/locked buy state.
- **Slices read**: `state.pet` (home/species/clothesId), `state.profile.coins`.
- **Actions**: `buildMilestone(m.id)`. **Catalogs**: `JOURNEY`, `Milestone`. **Mechanics**: `nextMilestone`, `homePct`.
- **Components**: `OverlayScreen`, `PetView`, `Icon`, `LinearGradient`.
- → **HabitHatch "Habit Garden"**: reskin. Reuse the row/hero/progress shell verbatim; replace the
  `JOURNEY` constant with 8 **garden plots** (`PLAN §7.5`) and swap "home built" copy → "garden grown".

### `InsightsScreen.tsx` → **Insights** (`PLAN §5`)
- **Export**: `InsightsScreen()` — overlay.
- **Purpose**: prove progress. Range selector (Week/Month/Year), headline stat trio, a primary
  `VBars` bar chart, then a **premium-gated deep dashboard** (8-week `AreaChart`, `HeatGrid`
  day×time + heatmap, pet-health area, best-hours bars, category mix, session-length dist,
  consistency rings, all-time grid). Free users see the primary chart + an upsell `Card`.
- **Slices read**: `state.insights` (the whole 30-field slice), `state.pet`, `state.profile.premium`, `state.lifetime`, `state.achievements`.
- **Actions**: `openOverlay('premium')`, `showToast`. **Mechanics**: `fmt`, `money`. **Catalogs**: `ACHIEVEMENTS`.
- **Local charts (reusable, self-contained SVG/View)**: `VBars`, `HeatGrid`, `AreaChart`, `Ring`, `AtCard`.
- → **HabitHatch "Insights"**: reuse `HeatGrid` for the **8-week per-habit completion heatmap**;
  reframe stats to completion %, longest streak, coins earned. Heaviest content-rewire of the set.

### `AchievementsScreen.tsx` → **Achievements** (`PLAN §5`, §7.6)
- **Export**: `AchievementsScreen()` — overlay.
- **Purpose**: badge grid. Summary ring (`got`/`total`), then `ACHIEVEMENTS` grouped by `.group`
  into 2-up rows of `Badge` (locked shows a lock + progress bar from `achProgress`).
- **Slices read**: `state.achievements`, plus whatever `achProgress(s, id)` reads (lifetime/streak/pet).
- **Catalogs**: `ACHIEVEMENTS`, `Achievement`. **Mechanics**: `achProgress`, `money`. **Components**: `OverlayScreen`, `Card`, `Icon`; local `Badge`.
- → **HabitHatch "Achievements"**: reuse grid+`Badge`+ring shell verbatim; replace `ACHIEVEMENTS`
  with the **12 reframed badges** (`PLAN §7.6`) and rewrite `achProgress`/`achMet` triggers.

### `ProfileScreen.tsx` → **Profile** (`PLAN §5`)
- **Export**: `ProfileScreen()` — overlay.
- **Purpose**: account/stats/settings hub. Teal hero (avatar + BASIC/PREMIUM badge), XP/level
  card, "Go Premium" card, avatar picker (7 built-in + premium photo upload), and setting
  groups (Progress / Personalize / Settings / Your data / Community) built from `SetRow`.
- **Slices read**: `state.profile`, `state.cloud`, `state.settings`, `state.pet.name`, `state.achievements`.
- **Actions**: `openOverlay` (many), `setName`,`setAvatar`,`setAvatarCustom`,`toggleSetting`,`setNotif`,`resetData`,`showToast`.
- **Deps**: `expo-constants`, `expo-image-picker`, `expo-image-manipulator`, `requestNotifPermission`, `BottomSheet`.
- **Local**: `Group`, `SetRow`, `Toggle`, `LockChip`. **Constants**: `APP_VERSION`, `APP_ID` (from live app config).
- → **HabitHatch "Profile"**: reuse whole shell. Rewrite app name/id, the "Focus dashboard" row
  label, and the premium blurb ("Rabbit…" → the 5-species roster).

### `OnboardingScreen.tsx` → **Onboarding** (`PLAN §5`)
- **Export**: `OnboardingScreen({ onComplete }: { onComplete: () => void })` — standalone (navigator route, not an overlay).
- **Purpose**: 3-step intro (welcome → pick starter species → name it), then `finishOnboarding`.
- **State**: local `useState` (`step`, `speciesId` 1|2, `petName`). Only 2 species (dog/cat).
- **Actions**: `finishOnboarding(speciesKey, petName)`. **Components**: `Txt`,`Btn`,`Bounded`,`PetView`,`ImageBackground`,`TextInput`; local `PetPick`.
- → **HabitHatch "Onboarding"**: the biggest UX rebuild among the reused shells. Add a **habit
  category grid** (pick 2–4 starter habits) and an **egg-whole hero**; species carousel expands
  to 5. The step scaffolding + `PetPick` card pattern stay.

### `RewardOverlay.tsx` → **Nursery / Hatch overlay** (`PLAN §5`, build-risk #2)
- **Export**: `RewardOverlay({ param }: { param?: { coins?; bonus?; mins?; questName? } })` — overlay (`'reward'`, terminal in the stack).
- **Purpose**: a centered celebration card over a dim scrim, **NOT** built on `OverlayScreen`.
  Uses RN `Animated` (scrim fade + card scale-overshoot + trophy burst spin). Shows coins/minutes
  stats + a bonus line + goal progress + Continue.
- **Slices read**: `state.pet`, `state.profile.coins`. **Mechanics**: `nextMilestone`, `money`.
- → **HabitHatch "Nursery/Hatch"**: reuse the animation scaffold (scrim/card/burst refs & interpolations)
  as the **egg-hatch overlay** — swap the trophy burst for `egg-whole→crack→hatch.svg` sequence +
  `star1-3.svg` burst + a species reveal + name-your-companion input.

### `FeedSheet.tsx` → **Feed sheet** (`PLAN §5`)
- **Export**: `FeedSheet({ visible?, param? })` — bottom sheet.
- **Purpose**: spend food inventory on the pet. Grid of owned `FOODS` (or an empty state) + a
  "Buy food" shortcut into the shop. Opened identically from Home & Pet.
- **Slices read**: `state.pet` (food/health/name). **Actions**: `feed(id)`, `openOverlay('shop',{tab:'food'})`, `closeOverlay`.
- **Mechanics**: `bonusPct`. **Components**: `BottomSheet`, `Txt`,`Btn`,`Icon`.
- → **HabitHatch "Feed"**: near-verbatim. Only the subtitle copy ("focus reward" → habit framing).

### `PremiumScreen.tsx` → **Premium** (`PLAN §5`, §9)
- **Export**: `PremiumScreen()` — overlay; custom full-bleed teal header (own back button, not `OverlayScreen`).
- **Purpose**: paywall. Live Google Play price fetch (`billing/billing.ts`) with catalog fallback,
  an insights preview card, an `UNLOCKS` checklist, plan cards, Continue/Restore.
- **Slices read**: `state.profile.premium`. **Actions**: `openOverlay`,`closeOverlay`,`purchasePremium`,`restorePremium`,`buyPremium`.
- **Deps**: `billing/products.ts` (`PREMIUM_PLANS`), `billing/billing.ts`. **Local**: `PlanCard`.
- → **HabitHatch "Premium"**: reuse shell + billing wiring verbatim. Rewrite `UNLOCKS` copy
  (rabbit/outfits → 5-species roster + garden skins + freeze packs) and the app-name strings.

### `ReferralScreen.tsx` → **Referral** (`PLAN §5`, §9)
- **Export**: `ReferralScreen()` — overlay.
- **Purpose**: growth. Server-issued invite code (`fetchReferralCode`), a share card, and a
  redeem field (`redeemReferral`). The only screens besides Sync that hit the network.
- **Actions**: `fetchReferralCode`, `redeemReferral`, `showToast`. **Components**: `OverlayScreen`, `ImageBackground`, `TextInput`, `Btn`, `Icon`.
- → **HabitHatch "Referral"**: reuse verbatim. Reward becomes a **Streak Freeze** (both get one)
  instead of coins; reword the share message + app name.

### `RecapScreen.tsx` → **Recap** (`PLAN §5`, v2)
- **Export**: `RecapScreen()` — overlay.
- **Purpose**: shareable weekly summary card (`LinearGradient` + `PetView` + weekly bars +
  stats), then "versus last week", highlights, "what your pet got", and a "next week" target.
  `Share`/`Clipboard` export.
- **Slices read**: `state.insights` (weekly/lastWeekTotal/categories/weekCoins/etc.), `state.pet`, `state.streak.current`, `state.today.goalMin`.
- **Mechanics**: `fmt`,`money`,`stageName`,`petStage`. **Local**: `recapVerdict`,`recapRange`,`CmpRow`,`HlRow`.
- → **HabitHatch "Recap"**: reuse card/share shell; reframe "minutes focused" → "habits kept",
  "home built" → "garden grown", "day streak" → overall streak. (v2 per PLAN.)

### `GoalSheet.tsx` → **Goal sheet** (`PLAN §5`)
- **Export**: `GoalSheet({ visible?, param? })` — bottom sheet.
- **Purpose**: pick a daily target. Chips `[30,45,60,90,120]` minutes → `setGoal(min)`.
- **Slices read**: `state.today.goalMin`. **Actions**: `setGoal`, `closeOverlay`. **Components**: `BottomSheet`, `Btn`, `Txt`.
- → **HabitHatch "Goal"**: reuse verbatim shape; change the unit from **minutes → habits/day**
  ("How many habits/day counts as a win?"), wiring to `profile.daily_goal` (0 = "all due").

### `BuySheet.tsx` → **Buy sheet** (`PLAN §5`)
- **Export**: `BuySheet({ param?: { kind: 'food'|'clothes'|'pet'; id: number }, visible? })` — bottom sheet.
- **Purpose**: purchase confirmation. Resolves item from `FOODS`/`CLOTHES`/`SPECIES`, shows
  art + Price + Your-balance, and a Buy/GoPremium/too-poor branch. Nothing bought until confirmed.
- **Slices read**: `state.profile.coins`, `state.profile.premium`. **Actions**: `buyFood`,`buyClothes`,`buyPet`,`openOverlay('premium')`,`closeOverlay`.
- **Components**: `BottomSheet`, `SpeciesThumb`, `Btn`, `Image`.
- → **HabitHatch "Buy"**: reuse verbatim (the SPECIES override flows through automatically).

---

## 2. HOW IT CONNECTS — data & control flow

**Render tree (native):** `App → NavigationContainer → { Onboarding | Main }`. `MainScreen`
renders the active tab (`HomeTab`/`PetTab`/`QuestsTab`/`CalendarTab`), a `TabBar`, an
`OverlayHost`, and a `Toast`. Overlays are **not** navigator routes — `OverlayHost` reads
`overlays[last]` and renders the matching screen from the `OverlayName` switch. `Onboarding`
is the one reused screen that *is* a navigator route (mounted before Main).

**The universal data path (all 15 files identical):**
```
screen  --useStore((st)=>st.state)-->  reads AppState slices  -->  renders
screen  --openOverlay/closeOverlay-->  overlays[] stack        -->  OverlayHost swaps view
screen  --action(feed/buy/build/…)-->  store action            -->  mutate((d)=>…)
mutate  --immer produce-->  new state  -->  grantAchievements() -->  scheduleSave()  (250ms debounce)
scheduleSave  -->  persistence.save(state)  -->  SQLite kv row 'app_state' = JSON(state)
```

**Cross-screen links (who opens whom):**
- `HomeTab` / `PetTab` → `feed`, `shop`, `journey`, `goal`, `insights`, `plan`, `capture`, `focus`, `profile`.
- `ShopScreen` → `buy`; `BuySheet` → `premium` (when locked). `FeedSheet` → `shop`.
- `ProfileScreen` → `achievements`, `recap`, `appearance`, `insights`, `sync`, `referral`, `premium`.
- `InsightsScreen` (free) → `premium`; `PremiumScreen` → `insights` (mutual — the store dedupes
  the stack so this can't grow unbounded, store.ts:162).
- `RecapScreen` → `goal`. `RewardOverlay` is terminal (replaces the stack).

**Reads-only vs writes:** Insights/Achievements/Recap/Premium are **read-mostly** (they display
derived `insights`/`lifetime`/`achievements`). Home/Pet/Shop/Journey/Feed/Buy/Goal/Onboarding
**write** via actions. No screen mutates `state` directly — all through store actions.

**The `insights` slice is precomputed, not derived on the fly.** Screens read `state.insights.*`
fields (weekly[], heat[], categories[], coinsLifetime, weekCoins…) as-is. Something upstream
(session-completion / rollover code, outside these 15 files) fills that slice. In HabitHatch the
**day-rollover recompute** (PLAN §8) is what must populate the habit-equivalent insights.

---

## 3. REUSE VERBATIM — copy unchanged into HabitHatch

**Whole shells (structure + styles, only symbol renames & copy edits later):**
- `OverlayScreen.tsx`, `BottomSheet.tsx`, `components/ui.tsx`, `Icon.tsx`, `CoinPile.tsx`,
  `SpeciesThumb.tsx`, `theme/tokens.ts` (colors/radius/shadow/moodColors). **Zero changes.**
- `FeedSheet.tsx`, `BuySheet.tsx`, `GoalSheet.tsx` — copy; only reword one subtitle each (Feed,
  Goal) and change Goal's unit. Buy needs no logic change.
- `ReferralScreen.tsx`, `PremiumScreen.tsx` (+ `billing/*`) — copy; only reword `UNLOCKS`/share
  strings + app name. Billing plumbing is production-grade, keep it.
- `ProfileScreen.tsx` — copy the entire settings-group scaffold, `SetRow`/`Toggle`/`Group`,
  avatar picker, sync-status logic. Only edit labels/app-id.

**Reusable local building blocks (lift these out and reuse across HabitHatch screens):**
- From `InsightsScreen`: `VBars`, `HeatGrid`, `AreaChart`, `Ring`, `AtCard` — self-contained
  SVG/View chart primitives, no focus-specific logic. `HeatGrid` is exactly the per-habit heatmap
  widget PLAN §5 asks for.
- From `AchievementsScreen`: the summary-ring + grouped 2-up `Badge` grid + `rows()` chunker.
- From `JourneyScreen`: the hero + progress-bar + milestone-row layout (garden reskin).
- From `RewardOverlay`: the entire `Animated` scrim/card/burst choreography (hatch overlay).
- From `HomeTab`/`PetTab`: the pet-room `ImageBackground` + `PetView` + `CoinPile` block, the
  health-bar `LinearGradient`, and `CareBtn`.
- The **daily-goal ring** SVG (HomeTab:139–149) — reuse geometry, just re-source the numerator.

**Renderer (critical, DO NOT rewrite):** `PetView.tsx` + `PetSprite.tsx`. `PetView` dispatches
fox/penguin/axolotl → `PetSprite` (reanimated matrix engine) and dog/cat → Lottie. All 5
HabitHatch species render through this untouched (`PLAN §10`).

---

## 4. CHANGE FOR HABITHATCH — specific edits

### 4.1 Data model — extend `AppState` (`domain/types.ts`) + snapshot
Add the new tables from `PLAN §6` as **fields on `AppState`** (persistence is one JSON document,
so "tables" are arrays/records on state, NOT real SQL tables — see §5 gotcha):
```ts
// NEW slices on AppState
habits: Habit[];              // the new core entity
habitLogs: HabitLog[];        // completion ledger (or Record<string, HabitLog> keyed habitId:date)
daySummary: Record<string, DaySummary>;  // keyed 'YYYY-MM-DD'
gardenPlots: Record<string, { planted: boolean; plantedAt?: number }>;

// EXTEND existing slices
interface Pet {  /* …existing… */
  hatchState: 'egg' | 'crack' | 'hatched';   // was implicitly 'hatched' in Paw
  hatchProgress: number;                      // 0..3 streak days toward hatch
  species: Species;                           // chosen at onboarding, revealed at hatch
}
interface Profile {  /* …existing… */
  overallStreak: number;
  overallBestStreak: number;
  freezes: number;
  lastFreezeRefill?: string;   // ISO-week id 'YYYY-Www'
  dailyGoal: number;           // habits/day = win (0 = "all due")
}
```
New type defs (mirror `PLAN §6` SQL):
```ts
type HabitType = 'good' | 'bad';
type ScheduleKind = 'daily' | 'weekdays' | 'times_per_week';
interface Habit {
  id: string; name: string; category: string; icon: string; type: HabitType;
  scheduleKind: ScheduleKind; weekdays?: number[]; targetPerWk?: number;
  reminderTime?: string; color: string;
  curStreak: number; bestStreak: number; coinsEarned: number;
  sortOrder: number; archived: boolean; createdAt: number;
}
interface HabitLog { id: string; habitId: string; date: string;   // 'YYYY-MM-DD'
  status: 'done' | 'skipped' | 'slipped' | 'frozen'; coins: number; createdAt: number; }
interface DaySummary { date: string; dueCount: number; doneCount: number;
  allClear: boolean; coins: number; healthEnd: number; }
```
**Store `hydrate()` migration (store.ts:128–147):** it already backfills missing slices from
`freshState()`. Add the new slices there so an older snapshot never leaves `habits`/`daySummary`
undefined and crashes a screen that spreads them.

### 4.2 Species override — `catalogs.ts` (the ONE economy edit, `PLAN §10`)
The reused catalog ships **6** species with `rabbit` (1200, premium) and `axolotl` free.
HabitHatch has **no rabbit art** → override to **5**, remove rabbit, re-flag premium:
```ts
export const SPECIES: SpeciesItem[] = [
  { id: 1, key: 'dog',     name: 'Dog',     price: 0,    premium: false }, // starter (free)
  { id: 2, key: 'cat',     name: 'Cat',     price: 0,    premium: false }, // starter (free)
  { id: 4, key: 'fox',     name: 'Fox',     price: 1600, premium: false }, // coin free-unlock
  { id: 5, key: 'penguin', name: 'Penguin', price: 2400, premium: false }, // coin free-unlock
  { id: 6, key: 'axolotl', name: 'Axolotl', price: 3600, premium: true  }, // HabitHatch+
];
```
Also drop `'rabbit'` from `Species` union in `types.ts`. This flows automatically through
`ShopScreen`, `BuySheet`, `SpeciesThumb` — no screen edits needed. Keep FOODS/CLOTHES prices
as-is (`PLAN §7.1` calibrates the *faucet*, not prices).

### 4.3 Journey → Habit Garden — `catalogs.ts` + `JourneyScreen.tsx` (`PLAN §7.5`)
Replace the `JOURNEY` constant with **8 garden plots** (First Sprout 120 … Orchard 4,800),
reusing existing `ic` keys (`bolt/sparkle/shield/heart/note/trophy/crown`) and `rate`/`cap`/`decay`
perk fields — `mechanics.ts:homePerks` already sums those, so idle-jar/decay perks work unchanged.
In `JourneyScreen.tsx`/`PetTab`: retitle "home/journey" → "Habit Garden", swap the hero copy and
`garden-sprout/tree/orchard.svg` art. **Plot 5 (Young Sapling)** grants the weekly Streak Freeze —
that's new store logic, not a screen change.

### 4.4 Today (Home) — `HomeTab.tsx` (the deep reframe)
- **Ring**: numerator/denominator `today.min/goalMin` → *habits done / due today* (from `daySummary`
  or a live "due today?" resolver, `PLAN §7.4`).
- **Rows**: `QuestRow` → a **habit row** — category icon (`cat-*.svg`), per-habit `streak-flame.svg`
  + count, and `habit-ring.svg`/`habit-checkbox.svg` one-tap check-off (good = "did it", bad =
  "avoided it"). The `QuestRow` progress-ring geometry can be reused for the habit ring.
- **Header**: overall `streak.current` flame → `profile.overallStreak`.
- **Add**: an **egg-progress banner** shown while `pet.hatchState !== 'hatched'` (egg art steps
  with `hatchProgress`).
- **Check-off action**: new store action (coins per `PLAN §7.1`), not present in Paw.

### 4.5 Onboarding — `OnboardingScreen.tsx`
Insert a **habit-category step** (grid of `cat-*.svg`, pick 2–4 starters) and an **egg-whole hero**;
expand the species step from 2 → 5 (reuse `PetPick`). `finishOnboarding(species, name)` extends to
also seed the chosen habits and set `pet.hatchState='egg'`.

### 4.6 Hatch overlay — new file from `RewardOverlay.tsx`
Fork `RewardOverlay` into a Nursery overlay: keep the `Animated` scrim/card/burst refs; replace the
trophy `Icon` with the `egg-whole→egg-crack→egg-hatch.svg` sequence + `star1-3.svg` burst; add the
species reveal + a name-your-companion `TextInput`. Fire it when `hatchProgress` hits 3
(`PLAN §7.4`, build-risk #2). Register a new `OverlayName` (e.g. `'hatch'`) — or reuse `'reward'`.

### 4.7 Achievements & Insights content
- `ACHIEVEMENTS` → the **12 reframed badges** (`PLAN §7.6`: First Crack, It's Alive!, Green Thumb,
  Week Warrior, Iron Month, Centurion, Habit Stacker, Clean Break, Perfect Week, Well-Fed, +2 stretch).
  Rewrite `achProgress`/`achMet` triggers (streak/health/garden based).
- Insights: reframe stat labels (minutes → habits kept, sessions → check-offs), reuse `HeatGrid` for
  the 8-week per-habit heatmap. Keep the premium gate.

### 4.8 Copy/label sweep (mechanical)
"focus session/quest/minutes" → "habit/check-off/day"; "home/journey" → "garden"; app name
`Pawductivity`→`HabitHatch`, `com.pawductivity.app`→ the HabitHatch package (in `ProfileScreen`,
`PremiumScreen`, `ReferralScreen` share strings, `RewardOverlay`). `GoalSheet` minutes → habits.

---

## 5. GOTCHAS

1. **"SQLite tables" are a JSON snapshot, not real tables.** `persistence.ts` stores the *entire*
   `AppState` as one JSON string in a single `kv` row. The `CREATE TABLE habits/…` in `PLAN §6` is
   **conceptual** — implement them as arrays/records on `AppState`, not SQL DDL. All the deterministic
   rollover math (decay, streaks, `day_summary`) runs in JS over those in-memory structures, then the
   whole document is re-serialized. Don't reach for `expo-sqlite` JOINs.

2. **Save is debounced 250 ms — flush before backgrounding.** `scheduleSave()` (store.ts:90) waits
   250 ms after the last mutation. A rapid check-off-then-kill can lose the last write. The launch-time
   rollover being *deterministic from local dates* (PLAN §8) covers correctness, but for immediate UX
   (streak/coins visible on relaunch) add an `AppState`-change / background flush that calls
   `persistence.save` synchronously. `serialize()` strips `tab`; make sure new runtime-only fields are
   likewise excluded so they don't bloat the snapshot.

3. **Fabric + reanimated-4 matrix engine is load-bearing — copy `PetSprite.tsx` byte-for-byte.**
   It animates react-native-svg's `<G matrix>` **native** prop from UI-thread worklets because the
   discrete rotation/transform props are JS-resolved and would be bypassed by `useAnimatedProps`. It
   ships a `declare module 'react-native-svg' { interface GProps { matrix?: number[] } }` augmentation
   (PetSprite.tsx:18) and in-worklet matrix builders (`rotMatrix`/`bodyMatrix`). Any edit risks breaking
   the smooth idle. The 5-species render is already wired behind `PetView` → touch neither.

4. **Babel: do NOT add the reanimated/worklets plugin.** `babel.config.js` uses only
   `babel-preset-expo` (SDK 57), which auto-appends `react-native-worklets/plugin` (required by
   reanimated 4). Adding it manually double-applies and breaks worklets. Keep the config as the
   9-line file it is.

5. **SVG consumption is mixed — know which is which.** `Icon` renders a keyed internal set (garden
   plot icons reuse existing keys `heart/shield/bolt/sparkle/trophy/note/crown`). `PetSprite` hand-codes
   `<Path>/<Circle>` inline. Screens also draw raw `Svg`+`Circle` for rings (HomeTab, QuestRow,
   Insights, Achievements) and `Path`/`LinearGradient` for `AreaChart`. The **20 new HabitHatch SVGs**
   (`egg-*`, `cat-*`, `habit-*`, `streak-flame`, `garden-*`) are standalone `<svg>` files — they get
   imported through `assets/registry` + `react-native-svg-transformer` (as `Species`/food art already
   are), NOT added to the `Icon` keyset unless you want them tintable. Egg/garden heroes use a
   `0 0 100 118` viewBox; icons `0 0 100 100` (PLAN §11).

6. **`RewardOverlay` and `PremiumScreen` bypass `OverlayScreen` chrome.** They roll their own
   header/scrim. When forking the hatch overlay, don't wrap it in `OverlayScreen` — copy Reward's
   absolute-fill scrim pattern. `PremiumScreen` draws its own back button + full-bleed gradient
   header (title appears exactly once).

7. **Overlay stack de-dupes and `'reward'` is terminal.** `openOverlay` (store.ts:162) brings an
   already-open overlay to the front instead of pushing a duplicate (guards the Insights↔Premium
   upsell loop), and `'reward'` **replaces** the whole stack. If you add a `'hatch'` overlay that
   should sit over Today and be dismissible back to it, push normally; if it's a terminal celebration,
   mirror `'reward'`.

8. **`insights` slice is consumed as precomputed fields, not derived in-screen.** Insights/Recap/Home
   read `state.insights.weekly/heat/categories/weekCoins/…` directly. Nothing in these 15 files
   *computes* them. HabitHatch must populate the habit-equivalent insights in the day-rollover job, or
   those charts render empty. The screens already handle empty states (`hasFocus`/`hasData` guards) —
   reuse that pattern for the "no habits yet" cold start.

9. **`petStage` is currently gated on `home.length`, not streak.** `mechanics.ts:18`:
   `petStage = min(5, 1 + floor(home.length/2))`. PLAN §7.3 wants stages gated on **overall best
   streak** (7/21/50/100-day). That's a `mechanics.ts` change, but every screen that shows
   `stageName(petStage(pet))` (PetTab, Recap, Insights) will follow automatically — don't hardcode
   stage in the views.
