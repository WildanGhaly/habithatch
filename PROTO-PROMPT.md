# Claude.ai build prompt — HabitHatch interactive prototype

## How to use
In a **claude.ai Project** (or a single chat), attach these files, then paste the prompt below:
1. `pawductivity_v1.html` — the reference prototype (the fidelity/architecture bar to match).
2. `01-habithatch/PLAN.md` — the full HabitHatch spec.
3. Every file in `01-habithatch/assets/new/` and `01-habithatch/assets/reused/` (the SVGs, pet art, coin/food PNGs, icons).

Then send the prompt. Use a Claude 4+ model with extended thinking on. If it stops before finishing, reply "continue, keep the same single file."

---

## THE PROMPT (copy everything below)

You are a senior front-end engineer + product designer. Build **HabitHatch**, a gamified daily-habit-tracker mobile app, as a **single self-contained interactive HTML prototype** — clickable end-to-end, at the **exact same fidelity and architecture as the attached `pawductivity_v1.html`**. Study that file first: it is the quality bar, the design language, and the code pattern you must match. The attached `PLAN.md` is the product spec. The attached SVG/PNG files are the art you must use.

### Non-negotiable architecture (mirror the reference)
- **One single `.html` file**, fully self-contained. Inline **all** CSS in one `<style>` and **all** JS in one `<script>`. **Inline every SVG's source directly** into the markup; embed any PNG as a **base64 data URI**. No external files, no CDNs, no build step, no frameworks — **vanilla JS only** (the reference uses no React/Vue). It must run by opening the file.
- **Phone-frame device mockup** centered on a dark backdrop, exactly like the reference (same frame, status bar, safe-area, `--nav-h` bottom nav).
- **Screen model**: each screen is a `<section class="screen">`; the active one has `.active`; navigation toggles that class (reuse the reference's `go()/show()` pattern and overlay screens). Include the same transition polish.
- **Bottom tab bar with a central circular FAB** (the `.tabbar` + `.capbtn` pattern from the reference).
- **State machine**: a single `S` state object, a `freshState()` seed, render functions per screen, and a re-render on every action — same structure as the reference (`freshState`, `moodOf`, `idleRate`, `coinPile`, `checkAch`, etc.). Persist to `localStorage` so a reload keeps progress; add a hidden "reset demo" control.
- **Seed a realistic mid-journey demo state** so the app looks alive on first open (a companion already hatched, ~5 habits with a few checked, a 6-day streak, ~340 coins, 2 garden plots grown, a couple of achievements). Also include a way to experience the fresh **egg → hatch** flow (a "new game" path from onboarding).
- Match the reference's **polish**: splash → onboarding, coin-fly animations, toast messages, a full-screen **reward/confetti overlay**, empty states, disabled/locked states, micro-interactions on tap. No dead buttons — everything is wired.

### Design system (identical tokens to the reference — put these in `:root`)
```
--teal:#0C4C60; --teal-2:#12667F; --teal-ink:#0B2530;
--orange:#E28A4B; --orange-2:#C9773A;
--yellow:#FFDA7C; --yellow-2:#F4B942;
--coin-ink:#1E4B5F; --ink:#2D2F41; --muted:#8B897E;
--cream:#FBF6EC (app bg); --card:#FFFFFF; --line:#EFE6D6; --line-2:#E4D8C2;
--grass:#A7C34F; --sky:#BFE3F3; --room-bg:#A0B559 (the pet "room"); --floor:#DCC79A;
--good:#1E7F91; --danger:#E5654B; --pink:#E68FB0;
radius: sm 12 / md 16 / lg 20 / pill 999;  card shadow: 0 10px 16px rgba(12,76,96,.10)
font: Poppins (700/800 for headings, 400/500 for body) — load from Google Fonts is OK ONLY if you must; otherwise system-ui fallback stack.
mood dots: happy #1E7F91, content #E9B24C, tired #C79350, hungry #D98C6A
```
Look and feel: warm cream background, white rounded cards with a soft teal shadow, an olive-green room where the pet lives on a sandy floor, orange CTAs, teal headings, generous rounding, friendly and soft. Flat, hand-drawn, no heavy gradients.

### The app — concept & core loop
HabitHatch: you check off your **daily habits**; every check-off earns **coins**; coins keep your **companion** fed, dressed, and growing; a brand-new player starts with an **egg that hatches into their companion after their first 3-day streak**; long-term you grow a **Habit Garden** (the reframed "Journey"). Build this exact loop:

1. **Check off a habit** → coins fly to the balance. `coins = 5 (base) + min(floor(habitStreak/3),5) + (schedule=='daily'?1:0)` → range 5–11. Bump that habit's per-habit streak.
2. **End-of-day "all clear"** (all due habits done) → `+15` bonus `+ min(overallStreak,30)`, advance the overall daily streak, and (pre-hatch) advance hatch progress.
3. **Egg hatch**: while unhatched, show egg progress; on reaching a 3-day streak, play the **egg-whole → egg-crack → egg-hatch** reveal in the reward overlay with a star burst, then let the user **name** their companion and see it in its room.
4. **Companion care**: the pet has 0–100 **health** that decays a little each day and is topped up by completing habits and by **feeding treats** (spend coins). Mood tiers (happy/content/tired/hungry) change its idle look and a small "focus/earn bonus". 5 growth stages (Baby→Young→Grown→Prime→Legend) as the garden grows.
5. **Habit Garden (Journey)**: 8 plots to grow with coins — First Sprout, Herb Patch, Watering Can, Berry Bush, Young Sapling, Flower Bed, Fruit Tree, Orchard — each with a cost and a perk (extra coins/day, slower health decay, bigger idle-jar cap, a weekly Streak Freeze). Mirror the reference's Journey costs (~60 → ~2000) and locked/unlocked states.
6. **Idle jar**: the companion trickles a base **1 coin/hr** (cap ~50, raised by garden perks) — "tap to collect", exactly like the reference's idle coin pile.
7. **Shop**: Food / Companions / Wardrobe tabs; buy treats, outfits, and extra species with coins; premium items gated behind a lock.
8. **Streaks & achievements**: an overall daily streak (with a **Streak Freeze** grace token), and **12 achievements** (grid of badges with rarity stars). Fire a reward overlay when one unlocks.

Follow `PLAN.md` for exact numbers, the data model, the 8 garden plots, and the 12 achievements. Where the plan and this summary agree, they are authoritative.

### Screens to build (all clickable, adapted from the reference)
Tabs (bottom nav): **Today (Home)**, **Habits**, **[FAB = add habit]**, **Companion (Pet)**, **Garden**. Plus overlay screens reached from within.

- **Splash** → **Onboarding**: pick 2–4 starter habits from a category grid (use the `cat-*.svg` icons), preview the species carousel (fox / penguin / axolotl animated inline-SVG; dog / cat as static thumbs), and introduce the **egg**.
- **Today (Home)**: header with avatar, coin balance, an overall **daily ring** + **streak flame**; the pet's room card up top (companion or the egg with a hatch-progress banner) with the tap-to-collect idle jar; then the list of today's **habit rows** — each row = category icon + name + per-habit flame + a big tappable **habit-ring / habit-checkbox** that fills and flings coins when tapped.
- **Habits**: manage all habits (reorder, edit, archive), see per-habit streaks and weekly dots.
- **Habit Editor (sheet, opened by the FAB)**: name, category icon picker (the 11 `cat-*.svg`, with `cat-custom.svg` as the fallback), good/bad-habit toggle, schedule (daily / weekdays / times-per-week), reminder time.
- **Companion (Pet)**: the pet in its room (`pet_home` backdrop), health bar, mood dots, growth-stage label, **Feed** and **Wardrobe** buttons.
- **Feed (sheet)**: food cards (the reused food art) with heal + price and a health preview.
- **Nursery / Hatch (overlay)**: the signature egg→crack→hatch reveal + name-your-companion.
- **Garden (Journey)**: scroll of plots (sprout → tree art), each with cost, perk, and locked state.
- **Shop** + **Buy (sheet)**: Food / Companions / Wardrobe, premium gated.
- **Insights**: an 8-week per-habit heatmap, completion %, longest streak, coins earned.
- **Achievements**: grid of 12 badges with rarity stars.
- **Profile / Premium / Referral / Recap / Goal (sheet)**: match the reference's versions, reskinned for habits (Premium = "HabitHatch+", Recap = weekly habits-kept + garden growth + shareable card, Goal = "how many habits/day is a win").

### How to use the attached assets (reference them by name; inline them)
- **Companion art**: inline `pets/fox.svg`, `pets/penguin.svg`, `pets/axolotl.svg` directly and give them a gentle CSS breathe/bob (subtle `transform: translateY` + `scaleY` keyframes). Use `pets/dog.png` / `pets/cat.png` as static thumbnails only. Do **not** require Lottie.
- **Egg / hatch**: `egg-whole.svg` → `egg-crack.svg` → `egg-hatch.svg` for the reveal sequence.
- **Habit categories**: `cat-water, cat-exercise, cat-read, cat-meditate, cat-run, cat-hygiene, cat-nophone, cat-wake, cat-sleep, cat-medicine`, and `cat-custom.svg` as the default.
- **Habit control**: `habit-ring.svg` (empty) and `habit-checkbox.svg` (done); `streak-flame.svg` for streaks.
- **Garden**: `garden-sprout.svg`, `garden-tree.svg`, `garden-orchard.svg` for plot growth stages.
- **Economy / UI**: `economy/coin.png`, `economy/food/*.png` (treats), `economy/clothes/*.png` (outfits), `economy/wardrobe.png`, `economy/shop-icon.png`, `economy/lock.png`; icons `icons/check, back, bone, hanger, chart, paw, play, pause, star1-3`.
Keep every asset on the palette above; if you need a glyph that isn't provided, draw a tiny inline SVG in the same flat style.

### Quality bar / acceptance
- Opens to a **living, mid-journey demo**; every tab, button, sheet, and overlay works; checking a habit visibly earns coins, updates the ring/streak, and nudges the pet's mood.
- The **egg→hatch** moment is genuinely delightful (staged animation + confetti + naming).
- Visually **indistinguishable in polish from `pawductivity_v1.html`** — same frame, spacing, type scale, shadows, rounding, motion.
- No external network dependency required to run; no dead controls; no lorem-ipsum — write real, warm microcopy.
- **Deliver the complete single HTML file end-to-end. Do not stub screens or leave "TODO"s.** If you run long, continue in the next message in the same file.

Build it now.
