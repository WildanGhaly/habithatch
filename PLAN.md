# HabitHatch — Product & Build Plan

A spin-off of Pawductivity. Same warm, offline-first, SQLite + reanimated-pet spine; a
completely different core activity. Where Pawductivity sells *focus sessions*, HabitHatch
sells *daily consistency* — a companion literally hatches out of an egg the first time you
string 3 days together.

---

## 1. One-liner + elevator pitch

**One-liner:** *Check off your daily habits and watch an egg crack, hatch, and grow into a
companion that thrives on your streaks.*

**Elevator pitch:** HabitHatch is a habit tracker for people who bounce off spreadsheet-y
apps. You define a small set of daily habits — good ones to build, bad ones to avoid — and
tick them off each day. Every check-off earns coins and feeds a living companion. New users
don't start with a pet; they start with an **egg**. The egg visibly cracks stage by stage
and **hatches into your first companion the moment you complete a 3-day streak**. From then
on, the companion's health decays daily and is topped back up only by keeping your habits;
your overall streak drives its mood and pushes it through five growth stages. A **Habit
Garden** grows a plant for every habit you keep alive, turning weeks of small wins into a
visible landscape.

**Emotional hook:** the hatch. It converts the hardest part of habit-building — surviving
the first three days — into a suspenseful, adorable payoff you *cannot* get any other way.
The egg is a promise; the streak is how you keep it. After that, loss-aversion ("my
companion is getting hungry / my 24-day streak is on the line") carries the habit.

---

## 2. Target user, problem, why-a-pet-helps

**Target user.** 18–35, phone-native, has tried Habitica / Streaks / Notion habit trackers
and abandoned them. Wants to drink water, move daily, read, sleep on time, quit doom-
scrolling — but "willpower + a checklist" hasn't stuck. Responds to cute, low-friction,
emotionally warm software, not productivity dashboards.

**Problem.** Habit apps fail at two seams: (1) the **cold-start valley** — the first week
has no visible reward, so users quit before the habit compounds; (2) **streak fragility** —
one missed day feels like total failure ("all-or-nothing" collapse), so a single slip ends
the app relationship. Most trackers are also emotionally inert: a broken streak is just a
number going to zero.

**Why a pet helps (behavioral psychology).**
- **Loss aversion & a caretaking obligation.** People will act to protect a dependent
  creature far more reliably than to protect an abstract number. A companion that gets
  *hungry* when you skip converts "I should" into "I don't want to let it down." (Tamagotchi
  effect / parasocial attachment.)
- **The hatch bridges the cold-start valley.** By gating the reward behind a *3-day* streak
  — not day 1 — we place the first dopamine hit exactly where the drop-off cliff is, giving
  users a concrete reason to survive to day 3. Variable, anticipated reward beats a flat one.
- **Streaks as commitment device + endowed progress.** A visible streak count and a garden
  that only grows are sunk-cost in the user's favour: the longer the chain, the higher the
  cost of breaking it. The garden gives *endowed progress* — you can always see how far
  you've come, which sustains motivation better than a reset-to-zero counter.
- **Immediate, embodied feedback.** A check-off produces coins, a flame tick, and a visibly
  happier animated companion within one second — closing the habit loop (cue → routine →
  reward) that a plain checkbox leaves open.
- **Forgiveness prevents the collapse.** A companion whose health *decays* (rather than
  instantly dying) plus an earnable **Streak Freeze** turns a missed day into "it's a bit
  hungry, feed it back up," not "you failed, uninstall." This is the single most important
  retention lever versus classic all-or-nothing streaks.

---

## 3. Core loop (mapped to Pawductivity)

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  CHECK OFF a daily habit  (good = do it • bad = avoided it)      │
   │            │                                                     │
   │            ▼                                                     │
   │     EARN COINS  + advance that habit's per-habit STREAK          │
   │            │                                                     │
   │            ▼                                                     │
   │  COMPANION CARE: coins buy food; completing your day's habit     │
   │  set restores companion HEALTH (which decays every day)          │
   │            │                                                     │
   │            ▼                                                     │
   │  PROGRESSION: overall streak drives MOOD → 5 GROWTH STAGES;      │
   │  coins fund the HABIT GARDEN (Journey) → perks → easier care     │
   └─────────────────────────────────────────────────────────────────┘
        (miss a day → health decays, companion gets hungry, streak
         at risk unless a Streak Freeze is spent → loop pulls you back)
```

**Explicit map to Pawductivity's loop** (`activity → coins → pet care → progression`):

| Pawductivity | HabitHatch |
|---|---|
| Core activity = run a **focus/pomodoro session** | Core activity = **check off daily habits** (recurring, per-habit streaks) |
| Coins earned per focus minute | Coins earned per habit check-off (+ streak & all-clear bonuses) |
| Pet health decays over real time; feed with food | Pet health decays **per day**; restored by completing your habit set + food |
| Daily-goal ring (minutes) | Daily-goal ring (**habits completed / due today**) |
| Streak = consecutive days you hit the goal | **Two-tier streaks**: per-habit streak + overall daily streak |
| Journey = build the pet's home room-by-room | **Habit Garden** = grow plants/trees as habits accumulate |
| Idle jar earns coins while away | Idle jar unchanged (companion forages while you're gone) |
| Onboarding hands you a pet | Onboarding hands you an **egg** that hatches after a 3-day streak |

The reusable spine is untouched; only the *core activity* and two *themes* (Journey →
Garden, achievement triggers) change.

---

## 4. Full feature list

### MVP (v1) — the shippable core
- **Habit list (Today):** user-defined habits, each with a category icon, type (good/bad),
  schedule (daily / specific weekdays / X-times-per-week), and its own streak. One-tap
  check-off with an animated ring + coin reward.
- **Good vs. bad habits:** good = "did it" earns coins; bad = "avoided it today" earns coins
  (checking a bad habit means you slipped → no coin, streak breaks for that habit).
- **The Egg & hatch onboarding:** every new account starts eggbound. Egg art advances
  whole → crack → hatch as the first streak climbs; hatches into the chosen species on the
  first **3-day overall streak**.
- **Companion (pet) screen:** the reanimated companion in its room; health bar, mood, growth
  stage, feed action.
- **Per-day health decay + feeding:** completing the day's due habits restores health;
  missing lets it decay; food from the Shop tops it up.
- **Two-tier streaks:** per-habit streak (shown on each row as the flame) + overall daily
  streak (drives growth & the flame headline).
- **Coins + Shop:** Food / Companions / Wardrobe tabs (reused). Buy treats, unlock species,
  buy outfits.
- **Habit Garden (Journey reframe):** 8 milestones; each planted patch costs coins and grants
  a care/earn perk.
- **Insights:** per-habit history heatmap (last 8 weeks), completion %, best streak.
- **Achievements:** 12 reframed badges (10 core + 2 stretch).
- **Notifications:** per-habit reminders, evening "habits still due," hunger warning, streak-
  at-risk, hatch-ready ping.
- **Idle jar:** companion forages coins while away, cap raised via the Garden.
- **Onboarding, Profile, Premium, Referral, Recap** shells reused.

### v2 — deepen
- **Streak Freeze** consumable (earned + purchasable) that saves a streak for one missed day.
- **Habit templates** ("Morning routine," "Hydrate," "Digital detox") to seed habits fast.
- **Weekly Recap** card: habits kept, coins, garden growth, longest streak; shareable.
- **Multiple companions / a small flock** as the garden matures.
- **Bad-habit "avoid timer"** (days since last slip) with its own milestone rewards.
- **Home-screen widget** (Android) showing today's rings + streak flame.

### v3 — expand
- **Guided routine mode:** chain a few habits into a timed morning/evening flow (reuses the
  `play`/`pause` timer bits — the only place a timer appears, and it's optional).
- **Friends & garden visits** (still offline-first; export/import garden snapshots).
- **Seasonal garden events** (limited-time plants/outfits).
- **Adaptive reminders** that learn when you actually complete each habit.

---

## 5. Screen-by-screen

| Screen / Sheet | Purpose | Key UI elements | Reused Pawductivity shell |
|---|---|---|---|
| **Onboarding** | Pick 2–4 starter habits + a species preview; explain the egg | Category grid (new cat-*.svg icons), species carousel (dog/cat/fox/penguin/axolotl), egg-whole hero | `Onboarding` |
| **Today (Home)** | The daily driver: check off habits | Header streak flame + overall daily ring; habit rows (`QuestRow` reshaped) each with category icon, per-habit flame, `habit-ring`/`habit-checkbox`; coin balance; egg-progress banner pre-hatch | `Home` + `QuestRow` |
| **Habit Editor (sheet)** | Create/edit a habit | Name, category icon picker (11 `cat-*.svg`, `cat-custom.svg` as the default/fallback glyph), good/bad toggle, schedule picker, reminder time | `Plan`/`Capture` sheet |
| **Companion** | See & care for the pet | Companion in room (`pet_home.png`) — `PetSprite` for fox/penguin/axolotl, reused `PetView` (Lottie) for dog/cat; health bar, mood dots, growth-stage label, Feed button (`bone.svg`), Wardrobe button (`hanger.svg`) | `Pet` |
| **Feed (sheet)** | Spend coins on treats | Food cards (`economy/food/*.png`) with heal + price, health preview | `Feed` sheet |
| **Nursery / Hatch (overlay)** | The signature moment | egg-whole → egg-crack → egg-hatch sequence, star burst (`star1-3.svg`), reveal of species, name-your-companion input | `RewardOverlay` |
| **Habit Garden (Journey)** | Long-term progression + coin sink | Scroll of garden plots; each shows `garden-sprout`→`garden-tree`, cost in coins, perk, locked/`lock.png` state | `Journey` |
| **Shop** | Spend coins | Food / Companions / Wardrobe tabs; premium gated with `lock.png` | `Shop` |
| **Insights** | Prove progress | 8-week per-habit heatmap, completion %, longest streak, coins earned | `Insights` |
| **Achievements** | Badges | Grid of 12 badges (10 core + 2 stretch), rarity via `star1-3.svg` | `Achievements` |
| **Profile** | Account, stats, settings | Level/XP, totals, notification prefs, theme | `Profile` |
| **Premium** | Upsell | HabitHatch+ benefits, restore purchases | `Premium` |
| **Referral** | Growth | Invite → both get a Streak Freeze | `Referral` |
| **Recap** | Weekly summary | Habits kept, garden growth, streak, shareable card | `Recap` |
| **Buy (sheet)** | Confirm a purchase | Item, price, coin balance, buy CTA | `Buy` sheet |
| **Goal (sheet)** | Set daily target | "How many habits/day counts as a win?" ring config | `Goal` sheet |

---

## 6. Data model (SQLite, extends `AppState`)

Persisted as the existing snapshot-of-state model. New/extended tables below; existing
Pawductivity tables (`profile`, `pet`, `inventory`, `journey`, `achievements`, `settings`)
are reused with the noted field additions.

```sql
-- A user-defined habit (the new core entity)
CREATE TABLE habits (
  id            TEXT PRIMARY KEY,          -- uuid
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,             -- 'water'|'exercise'|'read'|'meditate'|'run'
                                           -- |'hygiene'|'nophone'|'wake'|'sleep'|'medicine'|'custom'
  icon          TEXT NOT NULL,             -- cat-*.svg filename
  type          TEXT NOT NULL,             -- 'good' | 'bad'
  schedule_kind TEXT NOT NULL,             -- 'daily' | 'weekdays' | 'times_per_week'
  weekdays      TEXT,                      -- e.g. '1,2,3,4,5' when schedule_kind='weekdays'
  target_per_wk INTEGER,                   -- when 'times_per_week' (e.g. 3)
  reminder_time TEXT,                      -- 'HH:MM' local, nullable
  color         TEXT NOT NULL,             -- token key for the row accent
  cur_streak    INTEGER NOT NULL DEFAULT 0,
  best_streak   INTEGER NOT NULL DEFAULT 0,
  coins_earned  INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  archived      INTEGER NOT NULL DEFAULT 0,-- 0/1
  created_at    INTEGER NOT NULL           -- epoch ms
);

-- One row per habit per day it was due/acted on (the completion ledger)
CREATE TABLE habit_logs (
  id         TEXT PRIMARY KEY,
  habit_id   TEXT NOT NULL REFERENCES habits(id),
  date       TEXT NOT NULL,                -- 'YYYY-MM-DD' local
  status     TEXT NOT NULL,               -- 'done' | 'skipped' | 'slipped' (bad habit) | 'frozen'
  coins      INTEGER NOT NULL DEFAULT 0,   -- coins granted for this log
  created_at INTEGER NOT NULL,
  UNIQUE(habit_id, date)
);

-- Daily rollup that drives overall streak, growth, and the hatch gate
CREATE TABLE day_summary (
  date        TEXT PRIMARY KEY,            -- 'YYYY-MM-DD'
  due_count   INTEGER NOT NULL,            -- habits scheduled that day
  done_count  INTEGER NOT NULL,            -- good done + bad avoided
  all_clear   INTEGER NOT NULL DEFAULT 0,  -- 1 if done_count >= due goal
  coins       INTEGER NOT NULL DEFAULT 0,  -- total coins that day
  health_end  INTEGER NOT NULL             -- companion health at day close (0-100)
);

-- Garden plots (Journey reframe). Seeded from JS constant, progress persisted.
CREATE TABLE garden_plots (
  id          TEXT PRIMARY KEY,            -- 'plot_sprout', 'plot_orchard', ...
  planted     INTEGER NOT NULL DEFAULT 0,  -- 0/1 (purchased)
  planted_at  INTEGER
);

-- EXTEND pet table (reused) with hatch state
ALTER TABLE pet ADD COLUMN hatch_state TEXT DEFAULT 'egg';    -- 'egg'|'crack'|'hatched'
ALTER TABLE pet ADD COLUMN hatch_progress INTEGER DEFAULT 0;  -- 0..3 (streak days toward hatch)
ALTER TABLE pet ADD COLUMN species TEXT;                      -- chosen at onboarding, revealed at hatch

-- EXTEND profile (reused): overall streak lives here alongside level/xp
ALTER TABLE profile ADD COLUMN overall_streak      INTEGER DEFAULT 0;
ALTER TABLE profile ADD COLUMN overall_best_streak INTEGER DEFAULT 0;
ALTER TABLE profile ADD COLUMN freezes             INTEGER DEFAULT 0;  -- Streak Freeze token count
ALTER TABLE profile ADD COLUMN last_freeze_refill  TEXT;               -- ISO-week id ('YYYY-Www') the weekly freeze was last granted
ALTER TABLE profile ADD COLUMN daily_goal          INTEGER DEFAULT 0;  -- habits/day = win (0 = "all due")
```

`day_summary.health_end` lets the app recompute decay deterministically after the device is
off for days (compute elapsed local dates on launch, apply decay per missed day, cap at 0).
All writes go through the zustand+immer store and flush to SQLite exactly as Pawductivity does.

**Streak-Freeze persistence & rollover (deterministic, idempotent).** The freeze economy is
two fields: `profile.freezes` (token count) + `profile.last_freeze_refill` (the ISO-week id
of the last weekly grant). The launch-time rollover, walking each elapsed local date in order:
1. **Refill** — if Garden plot 5 (*Young Sapling*) is planted and the date's ISO week differs
   from `last_freeze_refill`, grant `freezes += 1` (cap **1 per ISO week**) and set
   `last_freeze_refill` to that week id. Because the grant is keyed to the ISO week and guarded
   by the stored id, replaying launches never double-mints. (The v2 *weekly login* freeze uses
   the same field/guard; the referral freeze is a one-off direct grant, not weekly.)
2. **Consume** — when a day would break an active streak (per-habit or overall) and `freezes > 0`,
   spend one (`freezes -= 1`), write that day's `habit_logs.status='frozen'`, hold the streak,
   and queue the "Freeze reminder" notification. If `freezes == 0`, the streak resets normally.

---

## 7. Gamification design

### 7.1 Coins (exact formulas)
Per check-off:
```
base            = 5                                   // any good-habit done / bad-habit avoided
streakBonus     = min(floor(habit.cur_streak / 3), 5) // +1 coin per 3-day tier, capped +5
hardBonus       = (schedule_kind == 'daily') ? 1 : 0  // daily habits pay a touch more
coins(checkoff) = base + streakBonus + hardBonus       // 5..11 coins
```
End-of-day bonuses (written at first launch of the next day, or at local midnight rollover).
The **effective goal** derives from `profile.daily_goal` (0 = "all due"), and `all_clear`
requires at least one habit to have been due — a day with nothing scheduled is never a "win":
```
dayGoal       = (daily_goal > 0) ? daily_goal : due_count
all_clear     = (due_count > 0) && (done_count >= dayGoal)   // false when nothing was due
allClearBonus = all_clear ? 15 : 0                           // completed your set today
overallBonus  = min(overall_streak, 30)                      // +1/day of overall streak, capped 30
```
Because `all_clear` is the sole driver of the overall streak, growth stages, and the 3-day
hatch gate, guarding it on `due_count > 0` prevents an empty-schedule day (or `daily_goal=0`
read as `done_count >= 0`) from silently advancing the streak or hatching the egg.

So a committed day with, say, 5 daily habits at a 12-day streak yields roughly
`5×(5+4+1) + 15 + 12 = 77` coins — enough for a treat, with the Garden as the long sink.
Coin art: `economy/coin.png`.

**Economy calibration.** The reused Shop **prices are kept as-is** (foods 5–15, outfits
80–400, and the SPECIES override's species 0 / free-unlock / premium); we calibrated the
**faucet**, not the prices. Target earn is **~60–90 coins on a committed day** (~450/week).
That lands the time-to-earn sensibly: a treat = a single good day, a coin-unlock species =
~1–3 weeks, and the Garden plots (120 → 4,800, §7.5) are the deliberate long sink spanning
~2–3 months of consistency. **Idle jar base rate:** the companion forages **1 coin/hr** into
a jar that defaults to a **50-coin cap**; Garden "rate"/"cap" perks add to that base (so plot
6's *forage rate +25%* means 1.25 coin/hr, and the cap perks stack onto the 50 base).

### 7.2 Pet need: decay & restore
- Health is `0–100`, starts at 100 on hatch.
- **Decay:** at each local-day rollover, `health -= DECAY` where
  `DECAY = 12 − gardenSlowdown` (Garden perks reduce it; floor 6). A fully missed day thus
  drops ~12; a couple of skipped days makes the companion visibly *hungry*.
- **Restore (free, the intended path):** completing the day's due set restores
  `+ (18 × done_count / due_count)` up to +18, so keeping your habits net-*raises* health
  above the day's decay. Partial days partially restore.
- **Restore (paid):** Shop food (`economy/food/*.png`) heals its existing `heal` value.
- **Mood tiers** (drive idle animation speed via the reused engine): health ≥75 happy
  (`#1E7F91`), 45–74 content (`#E9B24C`), 20–44 tired (`#C79350`), <20 hungry (`#D98C6A`).
- Health can't kill the pet (no death) — it just gets sad/slow, preserving the forgiving,
  non-punitive tone.

### 7.3 XP / levels & growth stages
- **XP** = total lifetime coins earned (mirrors Pawductivity `profile.xp/needed`); level
  curve reused unchanged. Level is cosmetic prestige + unlocks premium-adjacent flair.
- **Growth stages** (reused `STAGES`, Baby→Young→Grown→Prime→Legend, `STAGE_GOAL=4`) are
  gated by **overall best streak** milestones, not minutes:
  `Baby (hatch) → Young (7-day) → Grown (21-day) → Prime (50-day) → Legend (100-day)`.
  This makes the companion's body a lifelong record of your consistency.

### 7.4 Streaks (two-tier)

**"Due today?" resolver** (pure function of a habit + a local date; feeds `due_count`):
- `daily` — due every day.
- `weekdays` — due iff the date's weekday is in `habits.weekdays`.
- `times_per_week` — due **only until** the habit's completed logs within the *current local
  week* (Mon-anchored ISO week) reach `target_per_wk`. Once the weekly quota is met the habit
  **drops out of `due_count`** for the rest of that week (so an already-satisfied weekly habit
  neither inflates the day's goal nor blocks `all_clear`); the counter resets at the ISO-week
  boundary in the launch-time rollover. A `times_per_week` completion counts toward
  `done_count` on the day it happens, exactly like any other check-off.

- **Per-habit streak** (`habits.cur_streak`): +1 each scheduled day you complete it (for
  `times_per_week`, +1 per completed week that hit its quota); resets to 0 on a miss (or a
  slip, for bad habits), unless a Freeze covers it. Rendered as the `streak-flame.svg` on the
  row with the number.
- **Overall daily streak** (`profile.overall_streak`): +1 for each day `all_clear` is true;
  drives growth stages, the hatch gate, and the headline flame.
- **The hatch gate:** while `pet.hatch_state != 'hatched'`, each `all_clear` day increments
  `pet.hatch_progress`; the egg art steps `egg-whole (0) → egg-crack (1–2) → egg-hatch (3)`,
  firing the Nursery overlay at 3.

### 7.5 Habit Garden — Journey reframe (8 milestones)
Each plot costs coins (the primary sink) and grants a lasting perk. Ordered, unlock-gated.

| # | Plot | Cost | Perk | `ic` |
|---|------|------|------|------|
| 1 | **First Sprout** — your starter seedling | 120 | +1 coin per check-off | `bolt` |
| 2 | **Herb Patch** | 300 | Idle-jar cap +50 (→100) | `sparkle` |
| 3 | **Watering Can** | 550 | Health decay −2/day (12→10) | `shield` |
| 4 | **Berry Bush** | 900 | +10% coins on all-clear days | `heart` |
| 5 | **Young Sapling** | 1,400 | Grants **1 Streak Freeze / ISO week** (auto-refills, §6) | `note` |
| 6 | **Flower Bed** | 2,100 | Idle-jar cap +100 (→200); forage rate +25% (→1.25/hr) | `sparkle` |
| 7 | **Fruit Tree** — `garden-tree.svg` | 3,200 | Health decay −2 more (→ floor 6) | `trophy` |
| 8 | **Orchard** — the mature garden | 4,800 | +20% coins everywhere; garden fully in bloom | `crown` |

Each milestone maps to an **asset that exists**: its scroll-row icon renders via the reused
`Icon` from the `ic` key above (existing keyset `heart/shield/bolt/sparkle/trophy/note/crown`),
and the plot scene is drawn as **evolving stages of one garden landscape** — locked plots show
a mound + `lock.png`; early owned plots show `garden-sprout.svg`, mid plots `garden-tree.svg`,
and the Orchard (#8) fills the scene with `garden-orchard.svg`.

### 7.6 Achievements (12 reframed badges — 10 core + 2 stretch)
Reusing the `ACHIEVEMENTS` framework + `star1-3.svg` rarity.

| Badge | Trigger |
|---|---|
| **First Crack** | Complete your first habit check-off ever. |
| **It's Alive!** | Hatch your companion (first 3-day overall streak). |
| **Green Thumb** | Plant your first Garden plot. |
| **Week Warrior** | Reach a 7-day overall streak. |
| **Iron Month** | Reach a 30-day overall streak. |
| **Centurion** | Reach a 100-day overall streak (Legend stage). |
| **Habit Stacker** | Keep 5+ active habits alive on the same day. |
| **Clean Break** | 14-day streak on a *bad* habit (avoided it 14 days running). |
| **Perfect Week** | 7 consecutive all-clear days. |
| **Well-Fed** | Keep companion health ≥75 for 10 straight days. |
| *(stretch)* **Full Bloom** | Purchase every Garden plot. |
| *(stretch)* **Coin Farmer** | Earn 10,000 lifetime coins. |

---

## 8. Notifications design

Reuses expo-notifications (channels, RTC_WAKEUP scheduled alarms, kill-survival).

| Trigger | When | Channel | Kill-survival need |
|---|---|---|---|
| **Per-habit reminder** | At each habit's `reminder_time` | `reminders` | Scheduled RTC alarm re-armed on boot & on app launch from `habits.reminder_time`. |
| **Evening sweep** | 20:00 local if habits still due | `reminders` | Daily repeating alarm; content computed at fire time from today's logs. |
| **Hunger warning** | Companion health drops below 40 at day rollover | `care` | Rollover job runs on launch; if headless (v2 background task) also fires. |
| **Streak at risk** | 21:30 if `all_clear` not yet met and an active streak exists | `streak` | Conditional daily alarm; cancels itself if the day already cleared. |
| **Hatch ready** | Instantly when `hatch_progress` hits 3 | `celebrate` | Local immediate notification + in-app overlay next open. |
| **Freeze reminder** | Morning after a Freeze auto-saved a streak | `streak` | Written at rollover, delivered next morning. |
| **Re-engagement** | 2 days of no opens | `nudge` | Scheduled on last close; "your companion misses you — 3 habits due." |

Because the daily rollover (decay, streak evaluation, day_summary write) is **recomputed
deterministically from local dates on every launch**, correctness never depends on a
notification actually firing — notifications are nudges, not the source of truth. This
mirrors Pawductivity's session-persistence-survives-kill guarantee.

---

## 9. Monetization (ethical)

**HabitHatch+ (subscription, ~monthly + annual):**
- Unlimited habits (free tier caps at 5 active good + 2 bad — plenty for real habit-building).
- Full **5-species roster** + premium wardrobe (per the SPECIES override in §10, rabbit
  removed): dog/cat free starters; fox/penguin free-unlock via coins; axolotl + premium
  outfits are HabitHatch+ or premium coin bundles.
- Extra Garden decoration skins (cosmetic only — **never** a decay/coins advantage that free
  users can't earn; all *functional* Garden perks remain coin-purchasable).
- Weekly Recap export as a nice shareable card; extended 1-year Insights history.

**One-time / consumable (coins, all earnable free):**
- Streak Freeze packs (also earned via Garden plot 5, referrals, and a weekly login).
- Premium treats (`pizza.png`) already priced high in the reused economy.

**Ethics guardrails:**
- No "your pet will die / lose progress unless you pay" dark pattern — health never kills,
  and a Freeze is *earnable*. Paying only ever buys convenience or cosmetics.
- No ads interrupting the loop. No pay-to-win on the actual habit mechanics.
- Free tier is a genuinely complete habit tracker; + is for cosmetics, headroom, and history.

---

## 10. Tech notes

**Reused as-is (no changes):**
- Expo SDK 57 / RN 0.86 / React 19 / Hermes / Fabric; zustand+immer store; expo-sqlite
  snapshot persistence; expo-notifications; expo-audio (only if v3 routine mode ships).
- **`PetSprite.tsx`** reanimated-4 UI-thread `matrix` engine — renders the SVG species
  **fox / penguin / axolotl** across all 5 stages, mood-driven speed. Zero changes needed.
  The two Lottie species **dog / cat** render through the reused **`PetView`** from their
  Lottie JSON (copied into `assets/reused/lottie/{dog,cat}/`, one clip per growth stage);
  both renderers are already wired behind the same Companion screen, so a hatch of any of the
  five is fully animated. No species renders as a static PNG (the PNGs are picker thumbnails).
- Economy (coins/food/clothes/shop), XP/level curve, idle-jar, achievements framework,
  Journey engine (retitled Garden), daily-goal ring, most screen shells (§5), `tokens.ts`.

**New (HabitHatch-specific):**
- **SPECIES override of `catalogs.ts`** (a small economy edit, *not* reused verbatim): the
  reused catalog ships 6 species with `rabbit` (1200, premium) and `axolotl` free. HabitHatch
  has **no rabbit art**, so the roster is overridden to **5 species** — `rabbit` is removed —
  and the premium flags are re-set: `dog`/`cat` free (starter, price 0), `fox`/`penguin`
  free-unlock via coins, `axolotl` **premium: true** (HabitHatch+ / premium coin bundle). This
  keeps the reused Shop "Companions" tab from surfacing an unshippable rabbit.
- `habits`, `habit_logs`, `day_summary`, `garden_plots` tables + the `ALTER`s in §6.
- Habit-scheduling logic (daily/weekdays/times-per-week "due today?" resolver).
- Two-tier streak evaluator + deterministic day-rollover recompute (decay + streaks +
  day_summary) run on launch.
- Egg/hatch state machine + Nursery overlay driving `egg-whole/crack/hatch.svg`.
- Habit Editor sheet + category-icon system (the 10 `cat-*.svg`).
- Garden plot definitions (JS constant) mapping to `garden-plots` rows.

**New native deps:** none required for MVP. (v2 Android home-screen widget would add a
widget module; v2 hunger notifications that fire while the app is fully closed would add
`expo-task-manager` / `expo-background-fetch`.) No sensors.

**Android permissions:** `POST_NOTIFICATIONS` (13+), `SCHEDULE_EXACT_ALARM` / exact-alarm
handling (already used by Pawductivity), `RECEIVE_BOOT_COMPLETED` to re-arm reminders after
reboot. Nothing new beyond what Pawductivity already declares.

---

## 11. Asset inventory

| Screen / Feature | Reused Pawductivity asset | New asset (in `assets/new/`) |
|---|---|---|
| Companion render (SVG species) | `PetSprite.tsx` + `pets/fox.svg` `penguin.svg` `axolotl.svg`, `pet_home.png` | — |
| Companion render (Lottie species) | `PetView` + `lottie/dog/*.json` `lottie/cat/*.json` (copied into `assets/reused/lottie/`); `pets/dog.png` `cat.png` = picker thumbnails only | — |
| Currency everywhere | `economy/coin.png` | — |
| Feed sheet treats | `economy/food/apel|ayam|pizza|semangka|wortel.png` | — |
| Wardrobe | `economy/clothes/*.png`, `icons/hanger.svg` | — |
| Shop tabs | `economy/food.png` `pet.png` `wardrobe.png` `shop-icon.png`, `lock.png` | — |
| Streak Freeze consumable | `economy/potion.png` | — |
| Today habit rows — completion | `icons/check.svg` | `habit-ring.svg`, `habit-checkbox.svg` |
| Today / row — streaks | — | `streak-flame.svg` |
| Egg onboarding + Nursery hatch | `icons/star1.svg` `star2.svg` `star3.svg` (burst) | `egg-whole.svg`, `egg-crack.svg`, `egg-hatch.svg` |
| Habit category icons (editor, rows, onboarding) | — | `cat-water.svg`, `cat-exercise.svg`, `cat-read.svg`, `cat-meditate.svg`, `cat-run.svg`, `cat-hygiene.svg`, `cat-nophone.svg`, `cat-wake.svg`, `cat-sleep.svg`, `cat-medicine.svg`, `cat-custom.svg` (default/fallback for `category='custom'`) |
| Habit Garden (Journey) plots | `economy/lock.png` (locked), `pet_home.png` backdrop; milestone list-icons via reused `Icon` (`ic` keys, §7.5) | `garden-sprout.svg`, `garden-tree.svg`, `garden-orchard.svg` |
| Nav / tabs | `icons/paw.svg` (companion), `chart.svg` (insights), `back.svg`, `bone.svg` | — |
| Achievements | `icons/star1-3.svg` | (reuses `streak-flame`, `egg-hatch` thumbnails) |

**New assets authored (20):** `egg-whole.svg`, `egg-crack.svg`, `egg-hatch.svg`,
`habit-ring.svg`, `habit-checkbox.svg`, `streak-flame.svg`, `garden-sprout.svg`,
`garden-tree.svg`, `garden-orchard.svg`, `cat-water.svg`, `cat-exercise.svg`, `cat-read.svg`,
`cat-meditate.svg`, `cat-run.svg`, `cat-hygiene.svg`, `cat-nophone.svg`, `cat-wake.svg`,
`cat-sleep.svg`, `cat-medicine.svg`, `cat-custom.svg`. All flat, rounded, hand-drawn,
palette-matched, valid standalone `<svg>` with viewBoxes (`0 0 100 100` icons; `0 0 100 118`
egg/garden hero scenes).

---

## 12. Reuse scorecard

**Rough split:** ~**80% reused / 20% new.**
- Reused wholesale: tech stack, store, persistence, notifications, pet engine, economy,
  XP/level/idle systems, Journey/achievements frameworks, ~14 screen shells, all design
  tokens (~80%).
- New: habit/schedule/streak domain logic, egg-hatch state machine, Habit Editor, Garden
  content, and 20 SVG props (~20%).

**Top 3 build risks:**
1. **Streak/decay correctness across time gaps & timezones.** The deterministic launch-time
   rollover (device off for days, DST, midnight edge cases) is the trickiest logic. *Mitigate:*
   pure, unit-tested `rollover(state, fromDate, toDate)` function; store local `YYYY-MM-DD`
   strings, never UTC timestamps, for day boundaries.
2. **The hatch moment must land emotionally.** If the egg→crack→hatch transition feels cheap,
   the whole hook fails. *Mitigate:* stage the Nursery overlay with the reused `RewardOverlay`
   + star burst + reanimated wobble on the egg SVGs; test the 3 egg frames as a real sequence.
3. **Bad-habit modeling ambiguity.** "Avoided it" vs "slipped" is conceptually slippery for
   users and for streak math. *Mitigate:* keep bad habits opt-in, default the day to
   "avoided" and require an explicit "I slipped" tap; clear copy in the editor.

---

## 13. Four-week build roadmap (solo dev)

**Week 1 — Data & the daily loop.**
- Fork the Pawductivity shell; strip focus/pomodoro screens.
- Add `habits`, `habit_logs`, `day_summary` tables + store slices.
- Build **Today** screen: habit rows, one-tap check-off, coin reward, per-habit streak,
  daily ring. Habit Editor sheet with the 10 category icons + schedule picker.
- "Due today?" resolver. *Ships:* you can create habits and tick them for coins.

**Week 2 — The pet, decay, and the hatch.**
- Wire the reused `PetSprite` + Companion screen; health bar, mood tiers, Feed sheet.
- Implement per-day decay + free-restore; deterministic launch-time rollover (unit-tested).
- Egg/hatch state machine + Nursery overlay (egg-whole/crack/hatch + star burst).
- Growth stages gated on overall streak. *Ships:* the emotional core — hatch after 3 days,
  a companion that reacts to your consistency.

**Week 3 — Progression & economy.**
- Habit Garden (Journey) with the 8 plots, costs, and perks wired to decay/coins/idle-jar.
- Shop (Food/Companions/Wardrobe) + species unlocks + wardrobe overlays (reused).
- Insights heatmap + the 10 achievements. Idle-jar tuning.
- *Ships:* long-term goals, a coin sink, and proof-of-progress.

**Week 4 — Notifications, polish, monetization, ship.**
- All notification channels (§8) + boot re-arm; hunger/streak-at-risk/hatch pings.
- HabitHatch+ paywall, restore purchases, referral (Freeze reward), Weekly Recap card.
- Onboarding flow (pick habits → species → egg), Profile settings, empty/edge states.
- QA the rollover across date gaps; store listing, screenshots, R8 smoke-test (per memory).
- *Ships:* v1 on the Play Store.
