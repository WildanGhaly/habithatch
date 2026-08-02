# Pawductivity — Reusable Asset & System Inventory

The single source of truth for what every spin-off concept may reuse. Pawductivity is a
gamified focus-timer + virtual-pet app (Expo/React Native, Android-first, offline-first,
local SQLite). Everything below already exists and is production-quality.

## 1. Tech stack (reuse wholesale)
- Expo SDK 57, React Native 0.86, React 19, Hermes, TypeScript, New Architecture (Fabric).
- **State**: zustand + immer (`src/store/store.ts`), a single `AppState` persisted to SQLite.
- **Persistence**: expo-sqlite, offline-first. Snapshot-of-state model.
- **Pet animation engine**: react-native-reanimated 4.5 + react-native-svg 15. Pets animate
  on the UI thread via a single frame-clock + detuned sine oscillators writing the SVG `<G>`
  native `matrix` prop (`src/components/PetSprite.tsx`). Buttery, seamless, never janks.
- **Notifications**: expo-notifications (channels, scheduled RTC_WAKEUP alarms, ongoing
  sticky notification, session persistence that survives app kill).
- **Audio**: expo-audio (loopable soundscapes).
- Nav is a custom tab/screen/overlay system (`MainScreen`, `TabBar`, `OverlayHost`), NOT
  react-navigation.

## 2. Design tokens (`tokens.ts`, copy verbatim)
```
teal #0C4C60  teal2 #12667F  tealInk #0B2530
orange #E28A4B  orange2 #C9773A
yellow #FFDA7C  yellow2 #F4B942
ink #2D2F41  muted #8B897E
cream #FBF6EC (app bg)  card #FFFFFF  line #EFE6D6  line2 #E4D8C2
grass #A7C34F  sky #BFE3F3  wall #A0B559 (room bg)  floor #DCC79A
good #1E7F91  danger #E5654B  pink #E68FB0
radius: sm 12, md 16, lg 20, pill 999
shadow.card: teal, opacity .10, radius 16, y+10, elevation 4
font: Poppins-Regular / Poppins-Bold (weight >=600 -> Bold)
mood dots: happy #1E7F91, content #E9B24C, tired #C79350, hungry #D98C6A
```
Visual language: warm cream background, white rounded cards with a soft teal shadow, an
olive-green "room" panel (#A0B559) where the pet lives on a sandy floor (#DCC79A), orange
CTAs, teal headings, Poppins. Everything is soft, rounded, friendly, flat (no gradients
except subtle), hand-drawn.

## 3. Pet system (the crown jewel — reuse in ALL concepts)
- **6 companions**: dog, cat, rabbit (Lottie JSON in `lottie/`), fox, penguin, axolotl
  (hand-drawn SVG in `pets/*.svg` + the animated `PetSprite.tsx`). Standalone SVGs are in
  `_shared-assets/pets/`. PNGs `dog.png`, `cat.png` for thumbnails.
- **5 growth stages**: Baby -> Young -> Grown -> Prime -> Legend (`STAGES`, STAGE_GOAL=4).
- **Health / mood**: pet has 0-100 health that DECAYS over time and is restored by feeding.
  Mood tiers (happy/content/tired/hungry) drive the idle animation speed. This decaying-need
  loop is the reusable heart: map ANY activity to "the thing that keeps the pet healthy."
- **Outfits/wardrobe**: 5 clothes rendered as a tinted vest overlay on the pet.

## 4. Economy (reuse verbatim)
- **Coins** (`coin.png`): the single currency, earned by the core activity, spent in the shop.
- **Foods** (`economy/food/*.png` = apel/ayam/pizza/semangka/wortel): 5 treats with a `heal`
  value and price; pizza is premium. Feeding restores pet health.
- **Clothes** (`economy/clothes/*.png`): 5 outfits with prices; some premium.
- **Shop** with Food / Companions / Wardrobe tabs; premium items gated.

## 5. Gamification systems (reuse & reframe)
- **XP + levels** (profile.level/xp/needed).
- **Streaks** (current / longest) — daily-consistency engine.
- **Daily goal** (today.min vs goalMin) with a progress ring.
- **Quests**: user-authored tasks shaped into to-dos with tags (Work/School/Sport/Personal/
  Project) and repeats (once/daily/weekdays).
- **Journey** (`JOURNEY`, 9 milestones): build the pet's home room-by-room; each milestone
  costs coins and grants a perk (+coins/hr, slower health decay, bigger idle-coin jar). A
  perfect "long-term progression + coin sink" system — reframe the milestone theme per app.
- **Achievements** (`ACHIEVEMENTS`, 47): grouped badges (getting started, sessions, time,
  streaks, goals, growth, home, care, coins, habits). Reframe the triggers per app.
- **Idle "jar"**: the pet passively earns coins while you're away, up to a cap you raise via
  the Journey — a re-engagement hook.

## 6. Screens that exist (reuse the shells)
Home, Quests, Calendar, Pet, Focus, Shop, Insights, Achievements, Journey, Onboarding,
Profile, Premium, Referral, Recap; sheets: Buy, Feed, Goal, Plan, Capture. Components:
BottomSheet, CoinPile, Icon, OverlayHost, PetSprite/PetView, QuestRow, SpeciesThumb, TabBar,
Toast, RewardOverlay.

## 7. Icons available (`icons/*.svg`)
back, bone, chart, check, hanger, pause, paw, play, star1-3, plus nav icons.

## 8. Reuse doctrine for spin-offs
The reusable spine is: **core activity -> earn coins -> keep a decaying-need pet healthy +
dress/grow it + build a themed "home/journey" + streaks/achievements/idle-jar, all offline
in SQLite with the exact design tokens and the reanimated pet engine.** A new app only needs
to (a) define its "core activity" and how it earns coins, (b) reframe the Journey theme and
achievement triggers, (c) add a handful of domain-specific SVG icons in the style above.

---

## PLAN.md required outline (every concept plan MUST cover, deeply)
1. **One-liner + elevator pitch** and the emotional hook.
2. **Target user, problem, why-a-pet-helps** (behavioral-psychology rationale).
3. **Core loop** diagram in words: activity -> coins -> pet care -> progression. Explicitly
   map to Pawductivity's loop.
4. **Full feature list**: MVP (v1) vs later (v2/v3), each feature 1-2 lines.
5. **Screen-by-screen**: every screen/sheet, its purpose, key UI elements, and which
   Pawductivity screen shell it reuses.
6. **Data model**: SQLite tables/fields (extend the `AppState` shape), with the new
   domain entities.
7. **Gamification design**: exactly how coins are earned (formula), how the pet's need
   decays & is restored, XP/levels, streaks, the reframed Journey (list 6-9 milestones with
   costs+perks), and 8-12 reframed achievements.
8. **Notifications design**: what fires, when, and the kill-survival needs.
9. **Monetization**: premium items/subscription, ethically.
10. **Tech notes**: what reuses Pawductivity as-is, what is new, any new native dep
    (sensors, etc.), Android permissions.
11. **Asset inventory**: a TABLE mapping every screen/feature to the exact reused
    Pawductivity asset (by filename) AND the NEW assets to create (by filename), with the
    new SVG assets actually authored into `assets/new/`.
12. **Reuse scorecard**: rough % reused vs new, and the top 3 build risks.
13. **4-week build roadmap** (what ships each week for a solo dev).

## Asset creation style guide (for NEW SVGs)
- Flat, rounded, friendly, hand-drawn; match the palette above; no gradients (flat fills or
  a single soft shadow ellipse `rgba(0,0,0,0.12)`).
- Icons: `viewBox="0 0 100 100"` (or 0 0 24 24 for small UI glyphs), single clear silhouette,
  2-3 tone. Hero/scene art: `viewBox="0 0 100 118"` like the pets.
- Reuse the pet palette for pet-adjacent props; use teal/orange/cream for UI props.
- Name files descriptively (e.g. `water-drop.svg`, `piggy-bank.svg`, `flashcard.svg`).
