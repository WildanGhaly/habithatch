# Proto Spec — Achievements screen

Build contract extracted from `prototype/habithatch_v1.html`.
- Screen container markup: lines 1031–1037
- Renderer `renderAchievements()`: lines 3707–3745
- CSS: `.achtop`…`.achstars` lines 596–614; `.sheethead`/`.iconbtn` lines 500–503; shared classes elsewhere (cited inline)
- Data/helpers: `ACHIEVEMENTS` 1266–1279, `achProg` 1735–1745, `achMet` 1763–1771, `checkAch`/`drainAch` 1772–1795, `money` 1801, `prettyDate` 1307, `ic` 1196, `GARDEN` 1244–1253, state shape 1315–1330

This screen is a **read-only** overlay. It renders a progress ring, a copy line, then 3 group sections, each a 2-column grid of badge cards (12 badges total). The only interactive element is the header back button.

---

## 1. VISUAL TREE

Verbatim text/copy is quoted. `${…}` marks interpolated values (formulas in section 3). Indentation = DOM nesting.

```
section#achievements  .screen .overlay
├─ div.sheethead
│  ├─ button.iconbtn            onclick="closeScreen('achievements')"
│  │   └─ svg (viewBox 0 0 24 24)  → path d="M15 18l-6-6 6-6"   (back chevron, no width/height attrs)
│  ├─ h2                        text: "Achievements"
│  └─ div                       inline style="width:40px"  (empty spacer to balance the back button)
└─ div.scroll #achievementsBody           ← innerHTML replaced by renderAchievements()
   └─ div.pad-flat
      ├─ div.achtop                                        ← summary card (always present)
      │  ├─ div.cring
      │  │  ├─ svg (width 66, height 66, viewBox 0 0 64 64)
      │  │  │  ├─ circle  cx32 cy32 r26 fill=none stroke="#EFE7D6" stroke-width=7          (track)
      │  │  │  └─ circle  cx32 cy32 r26 fill=none stroke="var(--orange)" stroke-width=7
      │  │  │              stroke-linecap=round
      │  │  │              stroke-dasharray="${C.toFixed(1)}"            (C = 2π·26 = 163.4)
      │  │  │              stroke-dashoffset="${(C*(1-got/total)).toFixed(1)}"
      │  │  │              transform="rotate(-90 32 32)"                 (progress arc)
      │  │  └─ div.cringv  inline style="font-size:15px"   text: "${got}"   (earned count, integer)
      │  └─ div (no class)
      │     ├─ div.achtopn                text: "${got} of ${total} badges"     (total = 12)
      │     └─ div.muted  inline style="font-size:12px;font-weight:600;line-height:1.4"
      │                                    text: "Earned by showing up, not by spending."
      │
      └─ [per group g, in ACHIEVEMENTS declaration order — 3 groups]      ← repeated block
         ├─ div.shead
         │  ├─ h3                          text: "${g.name}"   (group name, see §3)
         │  └─ span.muted  inline style="font-size:11px;font-weight:700"
         │                                 text: "${gg}/${g.items.length}"   (earned/total in group)
         └─ div.achgrid                                        ← 2-column grid
            └─ [per badge a in group — 4 cards each]           ← repeated card
               div.achcard  + ("got" | "locked")              ← second class depends on unlocked state
               ├─ div.achstars                                 ← rarity stars (a.rar of them)
               │  └─ [× a.rar] span  inline style="display:inline-flex;width:13px;height:13px;
               │                     <if NOT got:>filter:grayscale(1);opacity:.5"
               │                     └─ ART['star'+a.rar]  (inline SVG: circle + white star)
               ├─ div.achic  inline style="<if a.art && NOT got:>filter:grayscale(1);opacity:.55"
               │  └─ ONE of:
               │       • a.art :  div.fit  inline style="height:30px"  → ART[a.art]  (inline SVG)
               │       • a.img :  img  src=ASSETS[a.img]  style="width:24px;height:24px;object-fit:contain"
               │       • got   :  ic(a.ic, 24)      (24×24 svg, currentColor)
               │       • locked:  ic('lock', 21)    (21×21 lock svg)
               ├─ div.acht                       text: "${a.name}"
               ├─ div.achd                       text: "${a.desc}"
               ├─ [locked & has progress] div.achprog                 ← progress bar, only when applicable
               │     └─ i  inline style="width:${pc}%"
               │  [locked & has progress] div.achpt   text: "${money(p[0])} / ${money(p[1])}"
               └─ [got & has log date] div.achpt  inline style="margin-top:6px"
                                                  text: "${prettyDate(S.achLog[a.id])}"  e.g. "Aug 3"
```

Notes on the repeated blocks: exactly **3 groups**, **4 cards each = 12 cards**. `.achprog`+`.achpt` (progress) render only for locked badges whose `achProg(id)` is non-null (see §3). The date `.achpt` renders only for unlocked badges that have an entry in `S.achLog`.

---

## 2. STYLE TABLE

All declarations copied verbatim from the `<style>` block. CSS-variable values (default `hatch` theme) are resolved in the "Resolved vars" table at the end; theme overrides in §5.

### Screen shell / header

| Class | Rule (verbatim) |
|---|---|
| `.screen` (l.115) | `position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--cream);` |
| `.screen.active` (l.116) | `display:flex;` |
| `.screen.overlay` (l.117) | `z-index:40;` |
| `.scroll` (l.126) | `flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;` |
| `.sheethead` (l.500) | `display:flex;align-items:center;gap:12px;padding:14px 16px;padding-top:calc(14px + env(safe-area-inset-top));background:#fff;border-bottom:1px solid var(--line);` |
| `.sheethead h2` (l.501) | `flex:1;font-size:18px;` |
| `.iconbtn` (l.502) | `width:40px;height:40px;border-radius:14px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);flex:none;` |
| `.iconbtn svg` (l.503) | `width:18px;height:18px;stroke:var(--teal);stroke-width:2.5;fill:none;` |
| `h1,h2,h3,h4` (l.140) | `margin:0;font-weight:700;color:var(--teal-ink);` |
| `.muted` (l.139) | `color:var(--muted);` |
| `.pad-flat` (l.128) | `padding:16px 16px 26px;` |

### Achievements-specific (lines 597–614)

| Class | Rule (verbatim) |
|---|---|
| `.achtop` | `display:flex;align-items:center;gap:14px;background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);padding:14px;box-shadow:var(--shadow);` |
| `.cring` | `position:relative;display:inline-flex;line-height:0;flex:none;` |
| `.cringv` | `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--teal-ink);font-size:18px;` (overridden inline to `font-size:15px`) |
| `.achtopn` | `font-weight:800;color:var(--teal-ink);font-size:15px;` |
| `.achgrid` | `display:grid;grid-template-columns:1fr 1fr;gap:11px;` |
| `.achcard` | `background:#fff;border:1px solid var(--line);border-radius:18px;padding:13px 11px;text-align:center;box-shadow:var(--shadow-sm);position:relative;` |
| `.achcard.locked` | `opacity:.62;background:var(--cream);` |
| `.achic` | `width:46px;height:46px;margin:0 auto 8px;border-radius:50%;background:var(--cream);border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;color:var(--teal);` |
| `.achcard.got .achic` | `background:#FFF4E7;border-color:#F6DFC4;color:var(--orange);` |
| `.acht` | `font-weight:800;font-size:13px;color:var(--teal-ink);` |
| `.achd` | `font-size:10.5px;color:var(--muted);font-weight:600;line-height:1.35;margin-top:3px;min-height:28px;` |
| `.achprog` | `height:6px;border-radius:9px;background:#EFE7D6;overflow:hidden;margin-top:8px;` |
| `.achprog i` | `display:block;height:100%;background:var(--orange);border-radius:9px;` |
| `.achpt` | `font-size:10px;font-weight:800;color:var(--muted);margin-top:4px;` |
| `.achstars` | `position:absolute;top:8px;right:8px;display:flex;gap:1px;` |
| `.achstars svg` | `width:13px;height:13px;` |

### Shared helper classes used

| Class | Rule (verbatim) |
|---|---|
| `.fit` (l.278) | `display:flex;align-items:flex-end;justify-content:center;` |
| `.fit>svg` (l.279) | `height:100%;width:auto;display:block;` |
| `.fit>img` (l.280) | `height:100%;width:auto;object-fit:contain;display:block;` |
| `.ic` (l.168) | `display:inline-block;vertical-align:middle;flex:none;` |
| `.ic.stroke` (l.169) | `fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;` |
| `.ic.fill` (l.170) | `fill:currentColor;stroke:none;` |

`ic(name,size)` (l.1196) emits: `<svg class="ic ${kind} " width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>` where `kind` is `stroke` or `fill` per the ICONS entry.

### Open/close animations (state variants)

The overlay is shown/hidden via classes toggled by `openScreen`/`closeSlide` (l.1808–1813), not by CSS `:active`. There are **no** `:active`/hover states on any achievements element.

| Class / keyframes | Rule (verbatim) |
|---|---|
| `.slide-up` (l.120) | `animation:slideup .32s cubic-bezier(.2,.8,.2,1) both;` |
| `.slide-down` (l.121) | `animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;` |
| `.fade-in` (l.118) | `animation:fade .28s ease both;` |
| `@keyframes slideup` (l.123) | `from{transform:translateY(100%)}to{transform:none}` |
| `@keyframes slidedown` (l.124) | `from{transform:none}to{transform:translateY(100%)}` |
| `@keyframes fade` (l.119) | `from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}` |

On open: `openScreen('achievements')` adds `active slide-up`. On close: `closeSlide` removes `slide-up fade-in`, adds `slide-down`, and after 250ms removes `active slide-down`.

### Resolved CSS variables (default `hatch` theme, l.9–24)

| Var | Value |
|---|---|
| `--orange` | `#E28A4B` |
| `--orange-2` | `#C9773A` |
| `--teal` | `#0C4C60` |
| `--teal-ink` | `#0B2530` |
| `--muted` | `#8B897E` |
| `--cream` | `#FBF6EC` |
| `--card` | `#FFFFFF` |
| `--line` | `#EFE6D6` |
| `--line-2` | `#E4D8C2` |
| `--r-sm` | `12px` |
| `--r-lg` | `20px` |
| `--shadow` | `0 10px 16px rgba(12,76,96,.10)` |
| `--shadow-sm` | `0 4px 12px rgba(12,76,96,.08)` |

Literal hex used directly in rules (not themed): track circle `#EFE7D6`, got-icon bg `#FFF4E7`, got-icon border `#F6DFC4`, progress-bar track `#EFE7D6`, header bg `#fff`.

### Rarity star art (ART map, l.1131–1133)

All three are `<svg viewBox="0 0 53 53">` = a filled circle with a **white** 5-point star path on top. Only the **circle fill** differs by rarity:

| Key | Circle fill |
|---|---|
| `star1` (rarity 1, common) | `#4EA59A` (teal-green) |
| `star2` (rarity 2, rare) | `#E28A4B` (orange) |
| `star3` (rarity 3, legendary) | `#FFDA7C` (yellow) |

Rendered at 13×13 (`.achstars svg`). A badge with `rar=N` shows **N copies** of `star{N}`. When the badge is locked each star span also gets `filter:grayscale(1);opacity:.5`.

---

## 3. DATA / LOGIC

### Inputs (from state `S`, blankState l.1315–1330)
- `S.achievements` → array of unlocked badge ids (starts `[]`).
- `S.achLog` → `{ [id]: 'YYYY-MM-DD' }` date each badge was earned (starts `{}`).
- Other state read by `achProg`: `S.profile.streak`, `S.profile.best`, `S.profile.lifetimeCoins`, `S.history` (per-day `{done}`), `S.stats.healthy`, `S.stats.bestHealthy`, `S.garden`.

### Header summary (l.3709–3711)
```
un    = S.achievements
got   = ACHIEVEMENTS.filter(a => un.includes(a.id)).length     // earned count
total = ACHIEVEMENTS.length                                     // = 12
C     = 2*Math.PI*26                                            // = 163.362... → "163.4"
```
Progress ring:
- `stroke-dasharray = C.toFixed(1)` → `"163.4"`
- `stroke-dashoffset = (C*(1 - got/total)).toFixed(1)` → full circle empty at got=0, offset 0 at got=12.
- Center number = `got`.
- `.achtopn` = `"${got} of ${total} badges"`.

### Grouping (l.3712–3713)
Groups are built by first-seen `a.group` order across `ACHIEVEMENTS`. Result (3 groups, 4 each):

| # | Group name | Badge ids |
|---|---|---|
| 1 | `Getting started` | first_crack, alive, green_thumb, stacker |
| 2 | `Streaks` | week, perfect, iron, centurion |
| 3 | `Care and growth` | comeback, wellfed, bloom, farmer |

Per-group header count: `gg = g.items.filter(a=>un.includes(a.id)).length` → text `"${gg}/${g.items.length}"` (e.g. `"1/4"`).

### ACHIEVEMENTS catalog (l.1266–1279) — verbatim
> rarity comment (l.1265): `rarity 1=common 2=rare 3=legendary`

| id | name | desc | icon field | rar | group |
|---|---|---|---|---|---|
| `first_crack` | `First Crack` | `Check off your first habit ever` | `ic:'check'` | 1 | Getting started |
| `alive` | `It's Alive!` | `Hatch your companion` | `art:'eggHatch'` | 2 | Getting started |
| `green_thumb` | `Green Thumb` | `Plant your first Garden plot` | `ic:'sprout'` | 1 | Getting started |
| `stacker` | `Habit Stacker` | `Keep 5 habits alive on the same day` | `ic:'note'` | 1 | Getting started |
| `week` | `Week Warrior` | `Reach a 7 day streak` | `art:'flame'` | 1 | Streaks |
| `perfect` | `Perfect Week` | `7 all-clear days in a row` | `ic:'target'` | 2 | Streaks |
| `iron` | `Iron Month` | `Reach a 30 day streak` | `art:'flame'` | 2 | Streaks |
| `centurion` | `Centurion` | `Reach a 100 day streak` | `ic:'crown'` | 3 | Streaks |
| `comeback` | `Comeback` | `Build a new 7 day streak after losing one` | `ic:'pulse'` | 2 | Care and growth |
| `wellfed` | `Well-Fed` | `Keep health at 75+ for 10 days` | `ic:'heart'` | 2 | Care and growth |
| `bloom` | `Full Bloom` | `Plant every Garden plot` | `ic:'trophy'` | 3 | Care and growth |
| `farmer` | `Coin Farmer` | `Earn 10,000 coins in total` | `img:'coin'` | 3 | Care and growth |

Icon source precedence per card (l.3729–3731): `art` → `img` → (`got` ? `ic(a.ic,24)` : `ic('lock',21)`).
Icon SVGs used (`ic` names → ICONS map): `check` (stroke), `sprout` (stroke), `note` (stroke), `target` (stroke), `crown` (fill), `pulse` (stroke), `heart` (fill), `trophy` (stroke), `lock` (stroke). `art:'eggHatch'` and `art:'flame'` pull colored inline SVG from ART; `img:'coin'` pulls a raster/data-URI from `ASSETS.coin`.

### Unlocked state per badge (l.3728)
`isGot = un.includes(a.id)` → drives the `got`/`locked` class and the icon branch.

### Per-badge progress (l.3732–3734), only shown when `!isGot`
`achProg(a.id)` (l.1735–1745) returns `[current, target]` or `null`:

| id | `[current, target]` formula |
|---|---|
| `week` | `[Math.max(P.streak,P.best), 7]` |
| `iron` | `[Math.max(P.streak,P.best), 30]` |
| `centurion` | `[Math.max(P.streak,P.best), 100]` |
| `perfect` | `[bestPerfectRun(), 7]` |
| `stacker` | `[maxDone, 5]`  where `maxDone = Math.max(0, ...Object.values(S.history).map(r=>r.done||0), 0)` |
| `comeback` | `[bestComeback(), 7]` |
| `wellfed` | `[Math.max(S.stats.healthy, S.stats.bestHealthy), 10]` |
| `bloom` | `[S.garden.length, GARDEN.length]`  (**GARDEN.length = 8**, l.1244–1253) |
| `farmer` | `[P.lifetimeCoins, 10000]` |

(`P = S.profile`.) `bestPerfectRun()` = longest streak run length (l.1757). `bestComeback()` = longest run built after an earlier run was already broken; 0 if only one run (l.1759–1762). `achProg` returns `null` for **first_crack, alive, green_thumb** → those locked cards show no progress bar.

When non-null and locked:
```
pc = Math.min(100, Math.round(p[0]/p[1]*100))          // bar fill width %, clamped 0–100
bar text = `${money(p[0])} / ${money(p[1])}`
```
`money(n)` (l.1801) = `Number(n||0).toLocaleString('en-US')` → US thousands separators, e.g. `10000` → `"10,000"`, `1400` → `"1,400"`.

### Earned date (l.3735), only shown when `isGot && S.achLog[a.id]`
`prettyDate(S.achLog[a.id])` (l.1307) = `['Jan','Feb',…,'Dec'][month] + ' ' + day` → e.g. `"Aug 3"` (month abbreviation + day-of-month, **no leading zero, no year**).

### How a badge becomes earned (context — happens off this screen)
`achMet(id)` (l.1763–1771): if `achProg` non-null → met when `p[0] >= p[1]`; else special cases:
`first_crack` → `S.stats.checkoffs >= 1`; `alive` → `S.pet.hatchState === 'hatched'`; `green_thumb` → `S.garden.length >= 1`.
`checkAch(silent)` (l.1773) pushes newly-met ids into `S.achievements`, sets `S.achLog[id] = today()`, and (unless silent) queues a reward. This screen only reflects that state on next render.

---

## 4. INTERACTIONS

### Opening the screen
`openAchievements()` (l.3707) = `renderAchievements(); openScreen('achievements');`
`openScreen` (l.1808) adds classes `active slide-up` (slide-up animation, §2). No data is mutated on open.

Entry points that call `openAchievements()`:
- **Today** stat tile (l.2203–2204): `<button class="tile" onclick="openAchievements()">` — trophy icon + `${S.achievements.length}` + label `Badges`.
- **Profile** link row (l.3782): `linkRow('trophy','Achievements', "${S.achievements.length} of ${ACHIEVEMENTS.length} badges", "openAchievements()")`.
- **Ghost button** (l.3700): `<button class="btn ghost block" … onclick="openAchievements()">` with trophy icon + text `Open achievements`.

### Header back button
`button.iconbtn` (l.1033) `onclick="closeScreen('achievements')"`.
`closeScreen(id)` (l.1815) = `closeSlide(id, ()=>renderAll())`: plays `slide-down` (.26s), after 250ms removes `active`, then calls `renderAll()` (re-renders the underlying tab). No achievement state mutated.

### Badge cards
**No onclick / no tap handler.** `.achcard` and every child are display-only. Tapping a badge does nothing — no detail sheet, no toast, no reward.

### Reward animation (fires elsewhere, not on this screen)
For awareness: when `checkAch` marks a new badge (l.1772–1795), `drainAch` calls `showReward({ title:"Badge unlocked", sub:a.name, icon:<art 56px | img 52px | ic(a.ic,52)>, stars:a.rar, note:a.desc, goal:"${S.achievements.length} of ${ACHIEVEMENTS.length} badges collected" })` after a 760ms delay (skipped while another reward modal is open). This is the only "reward/toast" tied to achievements and it triggers from habit/streak/coin events, never from viewing this screen.

---

## 5. NOTES (subtle behaviors)

- **Conditional card branches** (per badge):
  - `.achcard` second class is `got` when earned, else `locked`. `locked` → `opacity:.62; background:var(--cream)`.
  - Icon: art badges (`alive`=eggHatch, `week`/`iron`=flame) always render their colored inline SVG; the `img` badge (`farmer`=coin) always renders the coin image; icon-only badges render their glyph **only when earned** — when locked they render a generic **lock** icon (21px) instead of their own glyph.
  - **Art badges when locked** get an extra inline filter on `.achic`: `filter:grayscale(1);opacity:.55` (so a locked egg/flame looks desaturated). Icon/img badges do not get this on `.achic` (the whole card is already dimmed via `.locked`).
  - **Stars**: N stars for rarity N, colored by rarity (teal/orange/yellow circle). When locked, each star span gets `filter:grayscale(1);opacity:.5` (grey stars).
  - **Progress bar** renders only for locked badges whose `achProg` is non-null (9 of 12). The 3 boolean badges (first_crack, alive, green_thumb) show a locked card with **no** progress bar and **no** number line.
  - **Earned date** renders only when earned AND `S.achLog[id]` exists.
- **Empty state**: With a fresh account (`S.achievements=[]`), the ring shows `0`, header reads `"0 of 12 badges"`, every group header reads `"0/4"`, and all 12 cards render as locked (lock icon, dimmed, greyscale stars, progress bars where applicable). There is no separate "no badges yet" placeholder — the grid always shows all 12.
- **`min-height` reservations** keep cards uniform: `.achd{min-height:28px}` reserves 2 lines for the description; longer descriptions (`Build a new 7 day streak after losing one`) will wrap and grow the card taller than neighbors in the same row (grid rows are not height-locked). Star row is absolutely positioned (`.achstars top:8px right:8px`) so it never affects layout.
- **Progress clamp**: `pc` is clamped to `Math.min(100, …)`, so an over-target-but-still-locked value can't overflow the bar. (A badge normally flips to earned once met, so a full locked bar is transient.)
- **`money()` formatting** uses `en-US` locale grouping — the `farmer` target renders `"10,000"` and its current value likewise gets separators; `bloom` renders `"${n} / 8"`.
- **`cringv` font override**: the center count is `font-size:15px` inline, overriding the class default of `18px`.
- **Theme behavior**: the accent variable `--orange` drives the ring progress arc, the progress-bar fill (`.achprog i`), and the got-icon color (`.achcard.got .achic`). Under the 4 premium themes (`dusk`/`forest`/`ocean`/`ember`, l.28–55) `--orange`, `--teal`, `--teal-ink`, `--good`, `--shadow*` shift, so those elements recolor. However the **rarity star colors are hardcoded inside the ART SVGs** (`#4EA59A` / `#E28A4B` / `#FFDA7C`) and do **not** follow the theme — star2's orange stays `#E28A4B` even in, say, the ocean theme where `--orange` is teal. Likewise the got-icon background `#FFF4E7` and border `#F6DFC4`, and the track colors `#EFE7D6`, are literal and theme-independent. Theme is applied by `applyTheme()` setting `data-theme` on `<html>` (default `hatch` removes the attribute).
- **No `:active`/press feedback** anywhere on this screen (unlike habit rows/buttons elsewhere). The screen is a static list; only the whole-overlay slide-up/slide-down transitions animate.
- **Re-render model**: `renderAchievements()` fully replaces `#achievementsBody.innerHTML` each open (l.3744). State is read fresh each time, so progress bars/counts reflect the latest `S` whenever the screen is opened. Closing calls `renderAll()` to refresh the tab underneath.
