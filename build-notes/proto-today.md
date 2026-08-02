# Build Spec — Today / Home screen (`renderToday`)

Source of truth: `prototype/habithatch_v1.html`
Primary functions: `renderToday()` (L2112–2216), `eggBanner()` (L2217–2228), `openHatchInfo()` (L2229–2238), `allClearCard()` (L2239–2245), `nextDueDay()` (L2247–2255), `restLine()` (L2256–2259), `emptyToday()` (L2262–2280), `quickStart()` (L2282–2287), `completionPct()` (L2288–2292), `weekCard()` (L2293–2318), `weekBlurb()` (L2319–2325).

The screen is rendered into the host element `#tabToday` (`$('tabToday').innerHTML = h`). The bottom tab bar (`.tabbar`) is **static markup outside** this render and is NOT produced by `renderToday`. The host lives inside `.screen#main`. When the tab activates, `switchTab('today')` sets `host.style.display='block'` and re-triggers the `fade-in` animation on the host.

This is the "daily driver" home tab. It renders in two macro-modes driven by `S.pet.hatchState`: **egg (pre-hatch)** vs **hatched (post-hatch)**, and by `noHabits` (whether any non-archived habit exists).

---

## 1. VISUAL TREE

Legend: `class(es)` — "verbatim copy". `${...}` marks dynamic values; conditional subtrees are labelled. All copy strings are transcribed verbatim (emoji/punctuation included; there are no emoji in this screen — all iconography is inline SVG).

```
#tabToday  (host; not part of the template string)
└─ (fragment returned by renderToday)
   ├─ div.topbar
   │  ├─ button.hi-av                       onclick="openProfile()"
   │  │  └─ span.avwrap > span.avin > [avatarArt()]   ← 44px pet/egg art in a circle
   │  ├─ div.hello  (inline style flex:1)
   │  │  ├─ div.k    → "${greeting()}"       ("Still up" | "Good morning" | "Good afternoon" | "Good evening" | "Winding down")
   │  │  └─ div.n    → "Hi, ${esc(P.name)}"  (verbatim prefix "Hi, ")
   │  ├─ span.flamepill    → [flameSVG(19)] "${P.streak}"
   │  └─ span.coinpill     → img[src=ASSETS.coin] "${money(P.coins)}"
   │
   └─ div.pad  (inline style padding-top:6px)
      │
      ├─ div.card  (inline: border-radius:22px; overflow:hidden; padding:0)   onclick="switchTab('pet')"
      │  └─ [roomStage(238)]   ← the companion "room" stage, 238px tall (see §Data: roomStage)
      │
      ├─ ══ CONDITIONAL A: hatched ? (post-hatch care card) : eggBanner() ══
      │
      │  ── A1. hatched === true ──
      │  div.card  (inline: padding:14px 16px; margin-top:-26px; position:relative; z-index:6)
      │  ├─ div.row.spread   (inline: margin-bottom:10px)
      │  │  ├─ div  (inline: font-weight:800; color:var(--teal-ink))  → "${esc(S.pet.name)}"
      │  │  └─ CONDITIONAL: bonusPct() > 0 ?
      │  │        span.bonuspill → [ic('bolt',14)] "+${bonusPct()}% coins"
      │  │     : span.muted (inline: font-size:12px; font-weight:600) → "Feed to earn a bonus"
      │  ├─ div.health  (adds class "low" when S.pet.health < 40)
      │  │  ├─ span.heart → [ic('heart',16)]
      │  │  ├─ div.bar → div.fill (inline: width:${S.pet.health}%)
      │  │  └─ span.hval → "${S.pet.health}/100"
      │  └─ div.carerow
      │     ├─ button.carebtn   onclick="event.stopPropagation();openFeed()"
      │     │   ├─ img.cic[src=ASSETS.apple]   └─ span.clbl → "Feed"
      │     ├─ button.carebtn   onclick="event.stopPropagation();openShop('clothes')"
      │     │   ├─ img.cic[src=ASSETS.wardrobe] └─ span.clbl → "Dress"
      │     └─ button.carebtn   onclick="event.stopPropagation();openShop('food')"
      │         ├─ img.cic[src=ASSETS.shop]    └─ span.clbl → "Shop"
      │
      │  ── A2. hatched === false → eggBanner() ──
      │  button.eggbanner   onclick="event.stopPropagation(); READY ? startHatch() : openHatchInfo()"
      │      (READY = S.pet.hatchProgress >= 3)
      │  ├─ span.eb-ic → READY ? [ART.eggCrack] : [ART.eggWhole]
      │  ├─ span  (inline: flex:1; min-width:0)
      │  │  ├─ span.eb-h → READY ? "Your egg is ready to hatch!"
      │  │  │                    : "Egg warming · ${p} of 3 days"        (p = S.pet.hatchProgress; middle dot U+00B7)
      │  │  ├─ span.eb-s → READY ? "Tap to meet your companion."
      │  │  │                    : "Finish every habit due today to warm it another stage."
      │  │  └─ span.eggsegs → 3 × <i> ; i-th gets class "on" when i < p   ([0,1,2].map)
      │  └─ span.chev → [ic('chevR',16)]
      │
      ├─ ══ CONDITIONAL B: noHabits ? "" : (day-hero card + garden strip) ══   (whole block omitted when no habits)
      │
      │  div.card  (inline: margin-top:14px)
      │  └─ div.dayring
      │     ├─ div.dayringwrap
      │     │  └─ CONDITIONAL: due.length ?
      │     │        [ringSVG(88, pct, null, goal, doneCount(d))]
      │     │        + div.dayctr → b "${doneCount(d)}"  span "of ${goal}"
      │     │     : div.restring → [ic('moon',30)]
      │     └─ div.dayinfo
      │        ├─ div.dayh   → due.length ? "Today's habits" : "A day off"
      │        ├─ div.daysub → (see §Data: daysub copy matrix)
      │        └─ div.daychips
      │           ├─ span.gchip → [flameSVG(13)] " ${P.streak} day streak"
      │           ├─ CONDITIONAL: P.freezes>0 ?
      │           │     span.gchip → [ic('snow',12)] " ${P.freezes} freeze" + ("s" if P.freezes>1)
      │           └─ span.gchip   onclick="openGoal()" → [ic('target',12)] " Goal: " + (P.dailyGoal>0 ? "${P.dailyGoal} / day" : "all due")
      │
      │  button.jstrip   onclick="switchTab('garden')"
      │  ├─ span.jstrip-ic → [ic( nx ? (nx.ic||'sprout') : 'crown', 18 )]   (nx = nextPlot())
      │  ├─ span.jstrip-main
      │  │  ├─ span.jstrip-h → nx ? "Growing next: ${nx.name}" : "Your garden is fully grown"
      │  │  └─ span.jprogbar.jstrip-bar → span.jprogfill (inline: width:${gardenPct()}%)
      │  └─ span.chev → [ic('chevR',15)]
      │
      ├─ ══ CONDITIONAL C: due.length ? "Due today" section header : "" ══
      │  div.shead
      │  ├─ h3 → "Due today"
      │  └─ span.muted (inline: font-size:12.5px; font-weight:700) → "${done.length}/${due.length}"
      │
      ├─ ══ CONDITIONAL D: pending list vs empty states ══
      │  pending.length ?
      │     pending.map((x,i) => habitRow(x, d, {first: i===0}))     ← one .habit row each
      │  : due.length ? allClearCard() : emptyToday()
      │
      │  ── habitRow(h,d,opts) structure ──
      │  div.habit  (adds "done" when h.logs[d]==='done')
      │  ├─ div.h-ic → [catArt(h.cat)]
      │  ├─ div.h-main
      │  │  ├─ div.h-name → "${esc(h.name)}" + (opts.first && !done ? span.starthere "next up" : "")
      │  │  └─ div.h-sub
      │  │     ├─ span.hflame (adds "cold" when h.cur===0) → [flameSVG(15)] "${h.cur}"
      │  │     ├─ span.tag → "${schedLabel(h)}"   ("Every day" | "Weekdays" | "Weekends" | "Sun, Mon…" | "N× a week")
      │  │     └─ CONDITIONAL: h.remind ? span.h-meta → [ic('bell',12,'metaic')] " ${h.remind}"
      │  └─ [habitBox(h,done)]  → button.hbox   onclick="toggleHabit(${h.id},event)"
      │        done ? [ART.habitCheck] : an SVG progress ring (see §Data: habitBox)
      │
      │  ── allClearCard() ──   (shown when due.length>0 and pending.length===0)
      │  div.card (inline: padding:22px; text-align:center)
      │  ├─ div (inline: color:var(--good); display:flex; justify-content:center) → [ic('checkCircle',32)]
      │  ├─ div (inline: font-weight:800; color:var(--teal-ink); margin-top:8px) → "Everything's done"
      │  └─ div.muted (inline: font-size:13px; margin-top:3px; line-height:1.5) →
      │        hatched ? "${esc(S.pet.name)} is fed and your streak is safe."
      │                : "The egg moved up a stage."
      │
      │  ── emptyToday() → two variants ──
      │  (B-i) live habits exist but none due today:
      │    div.empty
      │    ├─ div.em-ic → [ic('moon',40)]
      │    ├─ div.em-t → "Enjoy the day off"
      │    └─ div.em-s → "Rest counts too. Your streak is safe<br>on days with nothing scheduled."
      │  (B-ii) no live habits at all:
      │    div.startercard
      │    ├─ div.em-ic → [ic('sprout',36)]
      │    ├─ div.em-t → "Add your first habit"
      │    ├─ div.em-s → "One is enough to start. Every check-off warms the egg<br>and pays out coins."
      │    ├─ div.starterchips → 4 buttons for picks=['water','read','exercise','meditate']:
      │    │     button.starterchip  onclick="quickStart('${c}')"
      │    │       └─ span.scart [catArt(c)] + "${esc((STARTER[c]||{}).name||catOf(c).name)}"
      │    │       (labels: "Drink 8 glasses of water", "Read before bed", "Move for 20 minutes", "Five quiet minutes")
      │    └─ button.btn.sm  (inline: margin-top:4px)  onclick="openEditor()" → [ic('plus',15)] " Something else"
      │
      ├─ ══ CONDITIONAL E: done.length ? "Done today" section ══
      │  div.shead
      │  ├─ h3 → "Done today"
      │  └─ span.muted (inline: font-size:12.5px; font-weight:700) → "+${SUM}" + " earned"
      │        SUM = done.reduce((a,x)=>a + coinsForCheck(x).core, 0)
      │  + done.map(x => habitRow(x, d))   ← each rendered with .habit.done styling
      │
      └─ ══ CONDITIONAL F: noHabits ? "" : (week + tiles + dashboard strip) ══
         div.shead
         ├─ h3 → "This week"
         └─ span.see   onclick="openInsights()" → "Insights"

         [weekCard()]   → div.card.wkcard   onclick="openInsights()"
         ├─ div.row.spread
         │  ├─ div
         │  │  ├─ div.muted (inline: font-size:12px; font-weight:700) → "Habits kept this week"
         │  │  └─ div.wkbig → "${total}"      (total = Σ r.done over the 7 week days)
         │  └─ div.wktag → [ic('flame',13)] " ${N} all-clear " + (N===1 ? "day" : "days")
         │        (N = count of cells whose history has ac truthy)
         ├─ div.wkbars (inline: height:112px) → 7 × div.wkcol
         │     ├─ div.wkbar  + classes:  fut (future) | miss (pct===0, past) | (none) ; + "hi" when c.ac
         │     │     (inline: height:${Math.max(10, c.pct)}%)
         │     └─ span (adds "on" when c.today) → "${WD1[(i+1)%7]}"   → labels M T W T F S S
         └─ div.wksub → "${weekBlurb(cells)}"   (see §Data: weekBlurb)

         div.tiles  (inline: margin-top:12px)
         ├─ button.tile  onclick="openInsights('overview')"
         │    ├─ div.tileic [ic('chart',20)]  ├─ div.v "${completionPct(28)}%"  └─ div.l "28d rate"
         ├─ button.tile  onclick="openInsights('streaks')"
         │    ├─ div.tileic [ic('flame',20)]  ├─ div.v "${P.best}"  └─ div.l "Best streak"
         └─ button.tile  onclick="openAchievements()"
              ├─ div.tileic [ic('trophy',20)] ├─ div.v "${S.achievements.length}" └─ div.l "Badges"

         button.jstrip  (inline: margin-top:12px)  onclick="openInsights('overview')"
         ├─ span.jstrip-ic  (inline: background:var(--tint-2); color:var(--teal)) → [ic('bars',18)]
         ├─ span.jstrip-main
         │  ├─ span.jstrip-h → "Your dashboard"
         │  └─ span.setsub (inline: display:block; margin-top:2px)
         │        → "30 metrics across consistency, habits, streaks, coins and care"
         └─ span.chev → [ic('chevR',15)]
```

### roomStage(238) sub-tree (rendered inside the first `.card`)
`roomStage(height)` (L1901) builds:
```
div.room  (inline: height:238px)                       ← .room CSS forces overflow:hidden, has a ::after cream gradient
├─ [roomArt()]  → svg.roomart   (green wall #A0B559 + floor band #DCC79A; viewBox 0 0 220 132, preserveAspectRatio slice)
├─ CONDITIONAL hatched ?
│    div.moodtag → span.mooddot.<mood.k> + "${mood.t}"     (mood.k ∈ happy|content|tired|hungry; mood.t ∈ Happy|Content|Tired|Hungry)
│    div.stagetag → [ic('sparkle',12)] " ${stageName(petStage())}"   (Baby|Young|Grown|Prime|Legend)
│  : div.moodtag → [ic('egg',14)] " Eggbound"
├─ CONDITIONAL hatched ? petBlock(round(238*0.80)=190) : eggBlock()
│    eggBlock(): div.petshadow + div.eggstage > div.eggart(+"ready" when hatchProgress>=3) > [egg art]
│       egg art = hatchProgress>=3 ? ART.eggHatch : hatchProgress>=1 ? ART.eggCrack : ART.eggWhole
└─ CONDITIONAL hatched ? coinPile() : ""     (idle-coin pile overlay; renders only if idlePending()>0)
```
The whole `.room` card is one big tap target → `switchTab('pet')`. `coinPile`'s own button calls `event.stopPropagation();collectIdle()`.

---

## 2. STYLE TABLE

Declarations copied verbatim from the `<style>` block (L8–965). CSS custom properties resolve against `:root` (Hatch theme, default) unless a `data-theme` is set on `:root` — see §5 THEME.

### Design tokens (`:root`, L9–24) — default "Hatch" theme
```
--teal:#0C4C60; --teal-2:#12667F; --teal-ink:#0B2530;
--orange:#E28A4B; --orange-2:#C9773A;
--yellow:#FFDA7C; --yellow-2:#F4B942;
--coin-ink:#1E4B5F; --ink:#2D2F41; --muted:#8B897E;
--cream:#FBF6EC; --card:#FFFFFF; --line:#EFE6D6; --line-2:#E4D8C2;
--grass:#A7C34F; --sky:#BFE3F3; --room-bg:#A0B559; --floor:#DCC79A;
--good:#1E7F91; --danger:#E5654B; --pink:#E68FB0;
--tint:#FFF7EF;             /* selected-chip wash */
--tint-2:var(--tint-2);     /* cool wash paired with --good (see note*) */
--glow:rgba(226,138,75,.5); /* accent drop shadow */
--shadow:0 10px 16px rgba(12,76,96,.10);
--shadow-sm:0 4px 12px rgba(12,76,96,.08);
--r-sm:12px; --r-md:16px; --r-lg:20px; --r-pill:999px;
--nav-h:74px;
```
\*Note: on `:root` (Hatch) `--tint-2` is self-referential (`var(--tint-2)`) so it is effectively **undefined/invalid** for the default theme — any `background:var(--tint-2)` (e.g. `.jstrip-ic` on the dashboard strip, `.restring` uses `--cream`) falls back to `transparent`/inherited unless a `data-theme` is active. Each themed `:root[data-theme=...]` sets a real `--tint-2`. Reproduce this quirk only if matching Hatch-theme pixels exactly; otherwise treat `--tint-2` as a pale cool tint (`#E1F0F3`-ish).

### Layout containers
```
.scroll  {flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}
.pad     {padding:16px 16px calc(var(--nav-h) + 20px);}      /* = 16 16 (74+20=94) */
.card    {background:var(--card);border-radius:var(--r-lg);box-shadow:var(--shadow);border:1px solid var(--line);}
.row     {display:flex;align-items:center;}
.spread  {justify-content:space-between;}
.muted   {color:var(--muted);}
h3       {margin:0;font-weight:700;color:var(--teal-ink);}   /* from h1..h4 rule */
```

### Top bar
```
.topbar {padding:max(20px, calc(12px + env(safe-area-inset-top))) 16px 8px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.hello .k {font-size:12px;color:var(--muted);font-weight:600;line-height:1;}
.hello .n {font-size:20px;font-weight:800;color:var(--teal-ink);line-height:1.15;}
.hi-av {flex:none;}
.hi-av:active {transform:scale(.94);}
.avwrap {display:inline-flex;border-radius:50%;overflow:hidden;border:2.5px solid #fff;background:#DDEDE9;box-shadow:var(--shadow-sm);flex:none;align-items:flex-end;justify-content:center;}
.avwrap .avin {display:flex;align-items:flex-end;height:122%;}
.avwrap svg,.avwrap img {height:100%;width:auto;display:block;}
.flamepill {display:inline-flex;align-items:center;gap:3px;background:#FFF4E7;border:1px solid #F6DFC4;color:var(--orange-2);font-weight:800;font-size:12.5px;padding:5px 11px 5px 6px;border-radius:var(--r-pill);}
.flamepill svg {width:19px;height:19px;flex:none;}
.coinpill {display:inline-flex;align-items:center;gap:6px;background:#fff;border:1.5px solid var(--line-2);padding:6px 12px 6px 7px;border-radius:var(--r-pill);font-weight:700;color:var(--coin-ink);box-shadow:var(--shadow-sm);}
.coinpill img {width:22px;height:22px}
.coinpill.bump {animation:bump .5s ease;}                    /* added transiently by bumpCoins() */
@keyframes bump {0%,100%{transform:none}30%{transform:scale(1.16)}}
```

### Room / companion stage
```
.room {position:relative;height:270px;overflow:hidden;background:var(--room-bg);}   /* inline height:238px overrides */
.roomart {position:absolute;inset:0;width:100%;height:100%;}
.room::after {content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 74%,rgba(251,246,236,.35) 90%,var(--cream) 100%);}
.petstage {position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;justify-content:center;z-index:2;padding-bottom:44px;}
.petwrap {position:relative;height:100%;display:flex;align-items:flex-end;justify-content:center;}
.petart {position:relative;height:100%;display:flex;align-items:flex-end;justify-content:center;filter:drop-shadow(0 12px 10px rgba(0,0,0,.14));animation:breathe 3.4s ease-in-out infinite;transform-origin:50% 100%;}
.petart>svg{display:block;height:100%;width:auto;}
.petart>img{display:block;height:100%;width:auto;object-fit:contain;}
@keyframes breathe {0%,100%{transform:translateY(0) scaleY(1) scaleX(1)}50%{transform:translateY(-5px) scaleY(1.028) scaleX(.988)}}
.petart.happy{animation-duration:2.6s}
.petart.tired{animation-duration:4.4s}
.petart.hungry{animation-duration:5s;filter:drop-shadow(0 12px 10px rgba(0,0,0,.14)) saturate(.78);}
.petshadow {position:absolute;bottom:48px;left:50%;transform:translateX(-50%);width:118px;height:20px;border-radius:50%;background:rgba(0,0,0,.16);filter:blur(5px);z-index:1;}
.moodtag {position:absolute;top:12px;left:12px;z-index:5;background:rgba(255,255,255,.92);backdrop-filter:blur(4px);padding:6px 12px;border-radius:var(--r-pill);font-weight:700;font-size:12.5px;color:var(--teal-ink);box-shadow:var(--shadow-sm);display:flex;gap:6px;align-items:center;}
.mooddot {width:8px;height:8px;border-radius:50%;flex:none;}
.mooddot.happy{background:#1E7F91} .mooddot.content{background:#E9B24C} .mooddot.tired{background:#C79350} .mooddot.hungry{background:#D98C6A}
.stagetag {position:absolute;top:12px;right:12px;z-index:5;background:rgba(12,76,96,.9);color:#fff;padding:5px 11px;border-radius:var(--r-pill);font-weight:800;font-size:11px;letter-spacing:.2px;display:flex;gap:5px;align-items:center;}
/* idle coin pile */
.coinpile {position:absolute;inset:0;z-index:6;border:none;background:transparent;padding:0;cursor:pointer;}
.pilecoin {position:absolute;}
.pilecoin img {display:block;filter:drop-shadow(0 3px 3px rgba(0,0,0,.22));animation:coinpop .42s ease-out backwards, coinbob 2.6s ease-in-out infinite;}
@keyframes coinpop {from{opacity:0;transform:translateY(10px) scale(.5)}}
@keyframes coinbob {0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.pilebadge {position:absolute;top:52px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:5px;background:rgba(12,76,96,.92);color:#fff;font-weight:800;font-size:11.5px;padding:5px 11px;border-radius:var(--r-pill);box-shadow:var(--shadow-sm);white-space:nowrap;}
.pilebadge img {width:15px;height:15px;}
/* egg in room */
.eggstage {position:absolute;left:0;right:0;bottom:0;height:200px;display:flex;align-items:flex-end;justify-content:center;z-index:2;padding-bottom:38px;}
.eggart {height:168px;animation:eggwobble 2.8s ease-in-out infinite;transform-origin:50% 92%;filter:drop-shadow(0 10px 8px rgba(0,0,0,.16));}
.eggart svg {height:100%;width:auto;display:block;}
@keyframes eggwobble {0%,100%{transform:rotate(0)}20%{transform:rotate(-3.5deg)}40%{transform:rotate(3deg)}60%{transform:rotate(-2deg)}80%{transform:rotate(1.4deg)}}
.eggart.ready {animation-duration:.9s;}
```

### Post-hatch care card
```
.health {display:flex;align-items:center;gap:9px;}
.health .bar {flex:1;height:13px;border-radius:9px;background:#EFE7D6;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.06);}
.health .fill {height:100%;border-radius:9px;background:linear-gradient(90deg,var(--yellow-2),var(--yellow));transition:width .5s cubic-bezier(.2,.8,.2,1);}
.health.low .fill {background:linear-gradient(90deg,#E5654B,#F09A6E);}     /* applied when health < 40 */
.health .heart {display:flex;color:#E5654B;}
.hval {font-weight:800;color:var(--teal-ink);font-size:13px;min-width:52px;text-align:right;}
.bonuspill {display:inline-flex;align-items:center;gap:6px;background:#FFF4E7;border:1px solid #F6DFC4;color:var(--orange-2);font-weight:800;font-size:12px;padding:5px 11px 5px 9px;border-radius:var(--r-pill);}
.bonuspill .ic {color:var(--orange);}
.carerow {display:flex;gap:10px;margin-top:14px;}
.carebtn {flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-radius:var(--r-md);background:#fff;box-shadow:var(--shadow-sm);border:1px solid var(--line);}
.carebtn:active {transform:scale(.97);}
.carebtn .cic {width:34px;height:34px;object-fit:contain;}
.carebtn .clbl {font-size:11.5px;font-weight:700;color:var(--teal-ink);}
```

### Egg banner (pre-hatch)
```
.eggbanner {display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#0C4C60,#12667F);border-radius:var(--r-lg);padding:14px 15px;box-shadow:var(--shadow);color:#fff;margin-top:-26px;position:relative;z-index:6;width:100%;text-align:left;}
.eggbanner:active {transform:scale(.99);}
.eggbanner .eb-ic {width:42px;height:42px;flex:none;display:flex;align-items:center;justify-content:center;}
.eggbanner .eb-ic svg {width:34px;height:auto;}
.eggbanner .eb-h {font-weight:800;font-size:14.5px;line-height:1.2;}
.eggbanner .eb-s {font-size:11.5px;color:#BFE3F3;margin-top:3px;line-height:1.4;}
.eggsegs {display:flex;gap:5px;margin-top:8px;}
.eggsegs i {flex:1;height:7px;border-radius:9px;background:rgba(255,255,255,.2);}
.eggsegs i.on {background:var(--yellow);}
.eggbanner .chev {margin-left:auto;color:#BFE3F3;flex:none;}
```
Note: the post-hatch care card carries the same `margin-top:-26px; position:relative; z-index:6` via INLINE style (not `.eggbanner`) so both overlap the room card by 26px.

### Day-hero card (ring + info + chips)
```
.dayring {display:flex;align-items:center;gap:15px;padding:15px 16px;}
.dayringwrap {position:relative;flex:none;line-height:0;}
.dayctr {position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.dayctr b {font-size:21px;font-weight:800;color:var(--teal-ink);line-height:1;letter-spacing:.2px;}
.dayctr span {font-size:10px;font-weight:700;color:var(--muted);margin-top:5px;letter-spacing:.3px;}
.dayinfo {flex:1;min-width:0;}
.dayh {font-weight:800;color:var(--teal-ink);font-size:15px;}
.daysub {font-size:12.5px;color:var(--muted);font-weight:600;margin-top:2px;line-height:1.4;}
.daychips {display:flex;gap:7px;margin-top:9px;flex-wrap:wrap;}
.gchip {display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--teal);background:var(--cream);border:1px solid var(--line-2);padding:4px 9px;border-radius:var(--r-pill);}
.gchip svg {color:var(--orange);}
.restring {width:88px;height:88px;border-radius:50%;background:var(--cream);border:1.5px dashed var(--line-2);display:flex;align-items:center;justify-content:center;color:var(--line-2);}
```

### Garden strip (`.jstrip`) — used twice (garden + dashboard)
```
.jstrip {display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:18px;padding:13px 14px;box-shadow:var(--shadow-sm);margin-top:14px;}
.jstrip:active {transform:scale(.99);}
.jstrip-ic {width:36px;height:36px;border-radius:12px;background:#EDF3E4;color:#6E8C31;display:flex;align-items:center;justify-content:center;flex:none;}
   /* dashboard-strip variant overrides via inline style: background:var(--tint-2); color:var(--teal) */
.jstrip-main {flex:1;min-width:0;}
.jstrip-h {display:block;font-weight:700;font-size:13.5px;color:var(--teal-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.jprogbar {height:8px;border-radius:9px;background:#EFE7D6;overflow:hidden;display:block;}
.jstrip-bar {margin-top:7px;}
.jprogfill {height:100%;border-radius:9px;background:linear-gradient(90deg,var(--grass),#C2DA75);display:block;transition:width .5s;}
.chev {color:var(--line-2);display:flex;flex:none;}
.setsub {font-size:11px;color:var(--muted);font-weight:500;margin-top:1px;}   /* reused for the dashboard sub-line */
```

### Section headers
```
.shead {display:flex;align-items:center;justify-content:space-between;margin:18px 2px 10px;}
.shead h3 {font-size:16px;}
.shead .see {font-size:12.5px;font-weight:700;color:var(--orange);}
```

### Habit rows
```
.habit {display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:18px;background:#fff;box-shadow:var(--shadow-sm);border:1px solid var(--line);margin-bottom:10px;transition:.14s;position:relative;overflow:hidden;}
.habit:active {transform:scale(.99);}
.habit.done {background:#F7FAF9;border-color:#E1EDEF;}
.habit.done .h-name {color:#5D7B84;}
.habit .h-ic {width:42px;height:42px;border-radius:14px;background:var(--cream);border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;flex:none;}
.habit .h-ic svg {width:28px;height:28px;}
.h-main {flex:1;min-width:0;}
.h-name {font-weight:700;font-size:14.5px;color:var(--teal-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.h-sub {display:flex;align-items:center;gap:7px;margin-top:4px;flex-wrap:wrap;}
.h-meta {font-size:11.5px;font-weight:600;color:var(--muted);display:flex;align-items:center;gap:3px;}
.metaic {color:#9A968A;}                       /* applied to the bell icon */
.hflame {display:inline-flex;align-items:center;gap:2px;font-size:11.5px;font-weight:800;color:var(--orange-2);}
.hflame svg {width:15px;height:15px;flex:none;}
.hflame.cold {color:#B9B4A6;filter:saturate(.15);}     /* when h.cur===0 */
.tag {display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 9px 3px 8px;border-radius:var(--r-pill);letter-spacing:.2px;background:var(--cream);color:#5C6B72;border:1px solid var(--line-2);}
.starthere {font-size:9.5px;font-weight:800;background:var(--orange);color:#fff;padding:2px 7px;border-radius:var(--r-pill);margin-left:6px;vertical-align:2px;letter-spacing:.3px;}
/* the big tappable check control */
.hbox {width:48px;height:48px;flex:none;position:relative;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .12s;}
.hbox svg {width:48px;height:48px;display:block;}
.hbox:active {transform:scale(.9);}
.hbox.pop {animation:hpop .45s cubic-bezier(.2,1.5,.4,1);}     /* added transiently on check */
@keyframes hpop {0%{transform:scale(1)}40%{transform:scale(1.22)}100%{transform:scale(1)}}
.hbox .hring-prog {transition:stroke-dashoffset .5s cubic-bezier(.2,.8,.2,1);}
```

### Empty / starter states
```
.empty {text-align:center;padding:34px 20px;color:var(--muted);}
.empty .em-ic {margin-bottom:8px;display:flex;justify-content:center;color:var(--line-2);}
.empty .em-t {font-weight:700;color:var(--teal-ink);font-size:15px;margin-bottom:4px;}
.empty .em-s {font-size:13px;line-height:1.5;}
.startercard {margin-top:14px;text-align:center;padding:26px 18px 20px;color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow-sm);}
.startercard .em-ic {margin-bottom:8px;display:flex;justify-content:center;color:var(--line-2);}
.startercard .em-t {font-weight:800;color:var(--teal-ink);font-size:16px;margin-bottom:4px;}
.startercard .em-s {font-size:13px;line-height:1.5;}
.starterchips {display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0 12px;}
.starterchip {display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:var(--r-sm);background:var(--cream);border:1.5px solid var(--line-2);font-size:12px;font-weight:700;color:var(--teal-ink);text-align:left;line-height:1.25;transition:.14s;}
.starterchip:active {transform:scale(.97);}
.starterchip .scart {width:26px;height:26px;flex:none;display:flex;align-items:center;justify-content:center;}
.starterchip .scart svg,.starterchip .scart img {width:100%;height:100%;object-fit:contain;}
```

### Buttons used here
```
.btn {display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;}
.btn:active {transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);}
.btn.block {display:flex;width:100%;}
.btn.sm {padding:9px 14px;border-radius:var(--r-sm);font-size:13px;box-shadow:0 4px 0 var(--orange-2);}
.btn.sm:active {box-shadow:0 1px 0 var(--orange-2);}
```

### Stat tiles + week card + week bars
```
.tiles {display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.tile {background:#fff;border-radius:var(--r-md);padding:12px 10px;text-align:center;box-shadow:var(--shadow-sm);border:1px solid var(--line);}
.tile .v {font-size:20px;font-weight:800;color:var(--teal-ink);line-height:1;}
.tile .l {font-size:10.5px;font-weight:700;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:.3px;}
.tile .tileic {margin-bottom:5px;display:flex;justify-content:center;color:var(--teal);}
.wkcard {padding:15px 16px;}
.wkbig {font-weight:800;color:var(--teal-ink);font-size:22px;margin-top:2px;}
.wktag {display:inline-flex;align-items:center;gap:5px;background:var(--cream);border:1px solid var(--line-2);color:var(--muted);font-weight:700;font-size:11px;padding:5px 10px;border-radius:var(--r-pill);}
.wktag svg {color:var(--orange);}
.wksub {font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.45;}
.wkbars {display:flex;align-items:flex-end;gap:6px;height:112px;margin:16px 0 6px;padding-bottom:20px;position:relative;}
.wkbars::after {content:"";position:absolute;left:0;right:0;bottom:20px;height:1.5px;background:var(--line-2);border-radius:2px;}
.wkcol {flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;position:relative;min-width:0;}
.wkbar {width:100%;max-width:26px;background:linear-gradient(180deg,var(--teal-2),var(--teal));border-radius:5px 5px 0 0;transition:height .45s;position:relative;z-index:1;}
.wkbar.hi {background:linear-gradient(180deg,#B7D25E,#8FB94E);}
.wkbar.miss {height:4px!important;background:#F0C7BC;border-radius:2px;}
.wkbar.fut {height:4px!important;background:#EFE7D6;border-radius:2px;}
.wkcol span {position:absolute;bottom:-19px;z-index:2;font-size:9.5px;font-weight:700;color:#BFB7A5;white-space:nowrap;}
.wkcol span.on {color:var(--orange);}
```
Note: inline `.wkbars` here overrides height to 112px (same as CSS). The bar height is inline `height:Math.max(10,c.pct)%`; `.miss`/`.fut` force `height:4px!important` regardless.

### Icon primitive
```
.ic {display:inline-block;vertical-align:middle;flex:none;}
.ic.stroke {fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ic.fill {fill:currentColor;stroke:none;}
```
`ic(name,size,cls)` → `<svg class="ic <stroke|fill> <cls>" width height viewBox="0 0 24 24">`. Icon type per name used on this screen:
`moon`=fill, `target`=stroke, `snow`=stroke, `bolt`=fill, `heart`=fill, `checkCircle`=stroke, `sprout`=stroke, `plus`=stroke, `chart`=stroke, `flame`=fill, `trophy`=stroke, `bars`=stroke, `chevR`=stroke, `bell`=stroke, `sparkle`=fill, `egg`=stroke, `crown`=fill, `leaf`=stroke, `note`=stroke.
Color always resolves from the parent's `color` (currentColor).

### Screen host / animation
```
.screen {position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--cream);}
.screen.active {display:flex;}
.fade-in {animation:fade .28s ease both;}
@keyframes fade {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
```

### Bottom tab bar (static; not rendered by renderToday but framing this screen)
```
.tabbar {position:absolute;left:0;right:0;bottom:0;height:calc(var(--nav-h) + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);background:#fff;border-top:1px solid var(--line);display:flex;z-index:30;box-shadow:0 -6px 20px rgba(12,76,96,.06);}
.tabbar button.on .ni {opacity:1;color:var(--teal);}
.tabbar .capbtn {flex:none;width:62px;height:62px;border-radius:50%;background:var(--orange);border:5px solid var(--card);transform:translateY(-18px);box-shadow:0 10px 22px var(--glow),0 5px 0 var(--orange-2);...}
```
(Full rules L195–212; the "Today" tab button gets `.on` when `S.tab==='today'`.)

### Toast (fired by quickStart)
```
#toast {position:absolute;left:50%;bottom:calc(var(--nav-h) + 26px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);background:rgba(11,37,48,.95);color:#fff;font-weight:600;font-size:13.5px;padding:11px 16px;border-radius:var(--r-md);display:flex;align-items:center;gap:8px;z-index:80;opacity:0;transition:.25s;pointer-events:none;max-width:86%;text-align:left;line-height:1.35;}
#toast.show {opacity:1;transform:translateX(-50%) translateY(0);}
#toast.high {bottom:auto;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%) translateY(-20px);}
#toast img {width:20px;height:20px}
```

### Dialog (openHatchInfo uses this)
```
.scrim {position:absolute;inset:0;background:rgba(11,37,48,.5);z-index:60;display:flex;align-items:flex-end;justify-content:center;animation:fade .2s both;}
.scrim.closing {animation:fadeout .24s both;}
.scrim.closing .dialog {animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
.dialog {background:#fff;border-radius:26px 26px 0 0;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;padding:22px 20px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.2);animation:slideup .3s cubic-bezier(.2,.8,.2,1) both;}
.dialog .grip {width:40px;height:5px;border-radius:9px;background:var(--line-2);margin:0 auto 16px;}
.dialog h3 {text-align:center;font-size:19px;margin-bottom:4px;}
.dialog .d-sub {text-align:center;color:var(--muted);font-size:13.5px;margin-bottom:16px;line-height:1.5;}
.d-line {display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-top:1px solid var(--line);font-size:14px;}
.d-line .lbl {color:var(--muted);font-weight:600;}
.d-line .val {font-weight:800;color:var(--teal-ink);display:flex;align-items:center;gap:5px;}
.d-actions {display:flex;gap:10px;margin-top:16px;}
.fit {display:flex;align-items:flex-end;justify-content:center;}       /* used for the egg art at top of dialog */
.fit>svg {height:100%;width:auto;display:block;}
@keyframes slideup {from{transform:translateY(100%)}to{transform:none}}
@keyframes slidedown {from{transform:none}to{transform:translateY(100%)}}
@keyframes fadeout {from{opacity:1}to{opacity:0}}
```

### @keyframes referenced by animated nodes on this screen
`breathe`, `cheer` (pet), `eggwobble` (egg), `coinpop`+`coinbob` (idle coins), `bump` (coin pill), `hpop` (habit check), `fade` (host fade-in), `slideup`/`slidedown`/`fadeout` (dialog). Reduced-motion: `@media (prefers-reduced-motion: reduce){ .petart,.eggart,.gardensun,.gardencloud,.pilecoin img{animation:none!important;} }`.

---

## 3. DATA / LOGIC

### Values computed at the top of `renderToday` (L2113–2120)
```
d        = today()                                   // local 'YYYY-MM-DD'
P        = S.profile
due      = dueList(d)                                // habits due today, sorted by id ASC
done     = due.filter(h => h.logs[d]==='done')       // subset of due that is checked
pending  = due.filter(h => h.logs[d]!=='done')       // subset of due not yet checked
goal     = Math.max(1, dayGoal(d))
noHabits = !S.habits.filter(h => !h.archived).length // true when zero live habits
pct      = Math.min(1, doneCount(d) / goal)          // ring fill fraction, capped at 1
hatched  = S.pet.hatchState === 'hatched'
nx       = nextPlot()                                // first GARDEN plot not yet planted, or undefined
```

### Scheduling / counting formulas (L1471–1498)
```
isDue(h,d):
  false if h.archived
  false if h.created && daysBetween(h.created,d) < 0
  'daily'    → true
  'weekdays' → (h.days||[]).includes(dow(d))          // dow: 0=Sun … 6=Sat
  'weekly'   → h.logs[d]==='done' ? true : weekDone(h,d) < (h.perWeek||3)
  else true

weekDone(h,d): count of h.logs[k]==='done' for k in the Monday-started week up to and including d
dueList(d)  = S.habits.filter(isDue).sort((a,b)=>a.id-b.id)
doneCount(d)= S.habits.filter(h=>h.logs[d]==='done').length   // ALL habits, not only due
dayGoal(d):
  g = S.profile.dailyGoal; due = dueList(d).length
  return g>0 ? Math.min(g, Math.max(1,due)) : due
```
Subtlety: the ring center uses `doneCount(d)` (every checked habit) while the "Due today" header uses `done.length/due.length` (only the due ones). They coincide unless a habit is checked that is no longer "due" — but weekly habits keep `isDue===true` once done, so they normally match.

### Ring (`ringSVG(88, pct, null, goal, doneCount(d))`, L2088–2107)
```
r = size/2-6 = 38, c = 44, C = 2πr
If total>1 && total<=10  → SEGMENTED ring: `total` arcs (total = goal).
   gap = total<=8 ? 16 : 11 ; step = 360/total ; arc = step-gap
   i-th arc stroke = i<done ? col : var(--line) ; stroke-width 8, round caps
   (done = doneCount(d); col defaults to var(--teal))
Else → single arc: grey track (var(--line)) + orange/teal progress arc when pct>0,
   stroke-dasharray=C, stroke-dashoffset=C*(1-pct), rotate(-90).
```
`.restring` (88×88 dashed circle w/ moon) replaces the ring when `due.length===0`.

### `.daysub` copy matrix (L2167–2169)
```
pending.length === 0 ?
    due.length ? "All clear for today." : restLine()
  : `${pending.length} still to go` + (pending.length<=2 ? ", nearly there." : ".")
```
`restLine()` (L2256): `nextDueDay()` → if a due day exists in the next 7 days:
`"Nothing scheduled. Back at it ${nd}."` where `nd` = `'tomorrow'` (i===1) else `WD[dow(k)]` (e.g. "Wed"); else `"Nothing scheduled today."`.
`nextDueDay()` returns null if there are no live habits.

### `.dayh`: `due.length ? "Today's habits" : "A day off"`.

### Goal chip (L2173): `"Goal: " + (P.dailyGoal>0 ? P.dailyGoal+" / day" : "all due")`.
Freeze chip only shows when `P.freezes>0`; pluralized `"freeze"`/`"freezes"` by `P.freezes>1`.
Streak chip always: `"${P.streak} day streak"`.

### Garden strip (L2179–2186)
```
icon      = ic( nx ? (nx.ic||'sprout') : 'crown', 18 )
heading   = nx ? "Growing next: ${nx.name}" : "Your garden is fully grown"
fill width= gardenPct()% = round(S.garden.length / GARDEN.length * 100)   // GARDEN.length = 8
```
GARDEN plots in order (id/name/ic used): sprout "First Sprout"(bolt), herbs "Herb Patch"(leaf), can "Watering Can"(shield), berry "Berry Bush"(heart), sapling "Young Sapling"(sprout), flowers "Flower Bed"(sparkle), fruit "Fruit Tree"(trophy), orchard "Orchard"(crown, final).

### "Due today" header count = `done.length/${due.length}` (L2188).

### habitRow / habitBox (L2069–2084, L2056–2067)
- `.hflame` shows `h.cur` (current streak); gets `.cold` when `h.cur===0`.
- `.tag` = `schedLabel(h)`:
  - daily → "Every day"
  - weekdays → days==[1,2,3,4,5] "Weekdays"; days==[0,6] "Weekends"; else `WD` joined "Sun, Mon…"
  - weekly → `${h.perWeek||3}× a week`  (multiplication sign U+00D7)
- reminder chip only if `h.remind` truthy → bell icon + `h.remind` string (e.g. "09:00").
- `habitBox`:
  - done → `button.hbox` containing `ART.habitCheck` (a filled check SVG).
  - not done → `button.hbox` with an SVG progress ring:
    `tier = h.cur % 3`, `pct = tier/3`, `C = 2π·38`.
    grey track `#EFE6D6` sw 11; orange progress `#E28A4B` sw 11 round-cap, dasharray=C, dashoffset=C·(1-pct), rotate(-90); inner circle r24 fill `#FBF6EC` stroke `#E4D8C2`; faint check path stroke `#DCCDB4` sw 6.

### "Done today" earned total (L2191)
`"+" + done.reduce((a,x)=>a + coinsForCheck(x).core, 0) + " earned"`.
```
coinsForCheck(h) (L1564):
  base=5
  streakBonus = min(floor(h.cur/3), 5)
  hardBonus   = h.sched==='daily' ? 1 : 0
  core = base + streakBonus + hardBonus          // 5..11
  perks p = perks()
  extra = p.perCheck + round(core * (moodOf(S.pet.health).bonus + p.all))
  total = core + extra
```
The "+N earned" label uses **core only** (not extra/perk/mood coins).

### Mood & bonus (L1518–1524)
```
moodOf(h): h>=75 → {Happy,happy,bonus .25} ; h>=45 → {Content,content,.10} ;
           h>=20 → {Tired,tired,0} ; else → {Hungry,hungry,0}
bonusPct() = round(moodOf(S.pet.health).bonus*100)   // 25 | 10 | 0 | 0
```
`.bonuspill` shows only when `bonusPct()>0`, text `"+${bonusPct()}% coins"`; else muted "Feed to earn a bonus".

### Stage (L1525–1530)
```
petStage(): b=max(best,streak); s=1; for i in STAGE_GATE(1..): if b>=gate s=i+1; hatched? s : 1
STAGES=["Baby","Young","Grown","Prime","Legend"]; STAGE_GATE=[0,7,21,50,100]
stageName(n)=STAGES[clamp(n-1,0,4)]
```

### Stat tiles (L2199–2204)
```
tile1: completionPct(28) + "%"   label "28d rate"
tile2: P.best                    label "Best streak"
tile3: S.achievements.length     label "Badges"

completionPct(days): sum r.due & r.done over last `days` history entries; return due? round(done/due*100):0
```

### weekCard() (L2293–2318)
```
ws = weekStart(today())            // Monday of current week
for i in 0..6: k=dstrOff(i,ws); r=S.history[k]||{due:0,done:0,ac:0}
   future = k>today(); pct = r.due? round(r.done/r.due*100):0; total += r.done
   cell = {k,pct,future,ac:r.ac,due:r.due,today:k===today()}
"Habits kept this week" big number = total (Σ r.done)
wktag: "${cells.filter(c=>c.ac).length} all-clear " + (===1?"day":"days")
bars: height = max(10, c.pct)% ; class fut(future)/miss(pct0,past)/none ; +hi when c.ac
labels WD1[(i+1)%7] → M T W T F S S ; label .on when c.today
```
`weekBlurb(cells)` (L2319):
- no past days with due>0 → "A fresh week. Tap for the full breakdown."
- else → `"${WD[dow(best.k)]} was your strongest day. You're averaging ${avg}% of what's due. Tap for the full breakdown."`
  (best = past cell with max pct; avg = round(mean of past pct)).

### Dashboard strip static copy: heading "Your dashboard", sub "30 metrics across consistency, habits, streaks, coins and care".

### Constants referenced
```
WD  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
WD1 = ['S','M','T','W','T','F','S']
STARTER map (for emptyToday chips & quickStart):
  water→"Drink 8 glasses of water"(daily,09:00), read→"Read before bed"(daily,21:30),
  exercise→"Move for 20 minutes"(weekdays,17:30,days12345), meditate→"Five quiet minutes"(daily,08:00)
money(n) = Number(n||0).toLocaleString('en-US')   // thousands separators, e.g. 1,240
esc(s) = HTML-escape & < > "
```

### Demo-seed values you'll see on first paint (freshState(demo=true), L1355–1374)
```
profile.name="Haryanto"; pet {species:'fox', name:"Pip", hatchState:'hatched', hatchProgress:3, health via sim,
  food:{1:2,2:1,3:0,4:1,5:0}, lastCollect = now - 3.4h}
6 seeded habits (ids 1..6): water(daily), exercise(weekdays), read(daily), sleep(daily), nophone(daily), run(weekly ×2).
history simulated over SEED_DAYS=56 days.
```
A brand-new (non-demo) account: name "Friend", coins 0, streak 0, pet hatchState 'egg', hatchProgress 0, no habits → the pre-hatch + startercard path.

### openHatchInfo() dialog (L2229–2238) — data lines
```
top art: fit box height 120px → hatchProgress>=1 ? ART.eggCrack : ART.eggWhole
h3: "How the egg hatches"
d-sub: "Every day you finish all the habits that were due, the egg advances one stage. Three of those days and it cracks open."
d-line: "Stages warmed"  →  "${S.pet.hatchProgress} / 3"
d-line: "Due today"      →  "${doneCount(today())} / ${Math.max(1,dayGoal(today()))}"
d-line: "Waiting inside" →  "${spec(S.pet.species).name}"   (e.g. "Fox")
d-actions: button.btn.block "Got it"  onclick="closeDialog()"
```

---

## 4. INTERACTIONS

Every tap handler on the Today screen (and reachable dialog):

| Element | Handler | Effect |
|---|---|---|
| `button.hi-av` (avatar) | `openProfile()` | `renderProfile(); openScreen('profile')` — slides in the Profile overlay screen. |
| room `.card` | `switchTab('pet')` | Switches main tab to Pet (`S.tab='pet'`, shows `#tabPet`, `renderAll()`, `save()`). |
| `.coinpile` button (inside room, hatched + idle coins) | `event.stopPropagation(); collectIdle()` | Adds `idlePending()` coins (`addCoins(amt,'idle')`), resets `S.pet.lastCollect=Date.now()`, `S.stats.idleCollected+=amt`, fires `toast('${S.pet.name} foraged ${amt} coins', ASSETS.coin)`, `confetti()`, `bumpCoins()`, `save()`, `renderAll()`. If empty: `toast('The jar is still empty. Check back later.')`. |
| care `Feed` btn | `event.stopPropagation(); openFeed()` | Opens the Feed dialog (feed the pet, raise health). |
| care `Dress` btn | `event.stopPropagation(); openShop('clothes')` | Opens Shop screen on the clothes tab. |
| care `Shop` btn | `event.stopPropagation(); openShop('food')` | Opens Shop screen on the food tab. |
| `.eggbanner` (pre-hatch) | `event.stopPropagation(); hatchProgress>=3 ? startHatch() : openHatchInfo()` | READY → `startHatch()` runs the nursery hatch animation (opens `#nursery` overlay, timed steps at 1500/3400/5300ms, then `doHatch()`); NOT READY → `openHatchInfo()` bottom-sheet. |
| Goal chip `.gchip` | `openGoal()` | Opens the daily-goal picker dialog (sets `S.profile.dailyGoal`). |
| garden `.jstrip` | `switchTab('garden')` | Switches main tab to Garden. |
| habit `.hbox` | `toggleHabit(h.id, event)` | Core action: if not done → check off (writes `h.logs[today]='done'`, grants coins via `coinsForCheck`/records in `h.rec`, bumps `h.cur`/streak, health, may fire reward card + confetti + `.hbox.pop`); if already done → `uncheckHabit` (exact reversal via the undo ledger). Re-renders. |
| starter chip `.starterchip` | `quickStart('${cat}')` | Builds a fully-configured habit from `STARTER[cat]` (or category default), pushes to `S.habits`, `rollupDay`, `save`, `renderAll`, `checkAch`, then `toast('"${name}" added')`. |
| starter `.btn.sm` "Something else" | `openEditor()` | Opens the habit editor sheet (blank new habit). |
| `.shead .see` "Insights" | `openInsights()` | `renderInsights(); openScreen('insights')`. |
| `.wkcard` | `openInsights()` | Same as above. |
| tile 1 | `openInsights('overview')` | Insights, overview subtab. |
| tile 2 | `openInsights('streaks')` | Insights, streaks subtab. |
| tile 3 (Badges) | `openAchievements()` | `renderAchievements(); openScreen('achievements')`. |
| dashboard `.jstrip` | `openInsights('overview')` | Insights, overview subtab. |
| dialog "Got it" (openHatchInfo) | `closeDialog()` | Adds `.closing` to the scrim, removes after 250ms. Scrim backdrop click (`event.target===this`) also closes. |

Notes on the animations/toasts fired FROM this screen:
- `switchTab` re-adds `.fade-in` to the tab host (0.28s fade+rise).
- `quickStart` fires a bottom `#toast` (or `.high` top toast if a scrim/reward is open).
- `collectIdle` fires toast + confetti + a `.coinpill.bump` pulse.
- Idle-coin `.pilecoin img` animate continuously (`coinpop` in, `coinbob` loop) unless reduced-motion.

---

## 5. NOTES (subtleties / conditional rendering / theme)

1. **Two macro-modes (pre-hatch vs post-hatch)** keyed on `S.pet.hatchState==='hatched'`:
   - Post-hatch: room shows the pet + moodtag (Happy/Content/Tired/Hungry dot) + stagetag; below it a **care card** (pet name, bonus pill / "Feed to earn a bonus", health bar, Feed/Dress/Shop row).
   - Pre-hatch: room shows the egg (whole/crack/hatch art by `hatchProgress` 0/1-2/3) + "Eggbound" moodtag; below it the **eggBanner** (dark teal gradient). Banner has its own two states: READY (`hatchProgress>=3`) "Your egg is ready to hatch!" vs warming "Egg warming · N of 3 days".
   - Both the care card and eggBanner overlap the room card upward by **-26px** (care card via inline style, banner via `.eggbanner` rule) and sit at `z-index:6`.

2. **`noHabits` gate** wraps the entire day-hero card + garden strip (Conditional B) AND the This-week/tiles/dashboard block (Conditional F). With zero live habits, both disappear; the body is just topbar + room + eggBanner/care + `emptyToday()`'s **startercard**.

3. **Empty-state fork** (`emptyToday`): live habits exist but none due today → `.empty` "Enjoy the day off" (moon). Zero live habits → `.startercard` "Add your first habit" with 4 quick-start chips + "Something else". Distinct designs on purpose (per the code comment: an entry point vs reassurance).

4. **Due vs done vs all-clear rendering** (Conditional D):
   - `pending.length>0` → list pending habit rows (first pending, if not done, gets a **"next up"** `.starthere` badge).
   - `pending.length===0 && due.length>0` → `allClearCard()` "Everything's done" with hatch-aware subline ("`${petName}` is fed and your streak is safe." vs "The egg moved up a stage.").
   - `due.length===0` → `emptyToday()`.

5. **"Due today" / "Done today" section headers** appear independently: the "Due today" header shows only when `due.length>0`; the "Done today" header + rows only when `done.length>0`. On an all-clear day both may show (empty pending → allClearCard replaces the pending list, but done rows still list below "Done today").

6. **Ring segmentation quirk**: with 2–10 due habits the ring is drawn as individual rounded arcs (one per goal unit), lit up to `doneCount`. Outside that range (1, or >10) it's a single sweeping arc. When nothing is due it's replaced by a dashed `.restring` with a moon.

7. **`--tint-2` self-reference on the default Hatch theme** makes it an invalid value; the dashboard-strip icon (`background:var(--tint-2)`) therefore falls back to transparent under Hatch. Every non-default theme defines a real `--tint-2`. Flag this for the RN port — pick an explicit pale cool tint (e.g. `#E1F0F3`) rather than reproducing the bug.

8. **Coin pile only when hatched AND `idlePending()>0`.** `idlePending` = `min(idleCap(), floor(hoursSinceLastCollect * idleRate()))`, `idleCap=50+perks.cap`, `idleRate=1*(1+perks.rate)`. Number of coin sprites = `min(12, max(1, ceil(pending/4)))`, positioned by the fixed `COIN_SPOTS` table. Badge text `"${pending} to collect"`.

9. **THEME behavior**: five themes (`hatch` default free, plus `dusk/forest/ocean/ember` premium) set on `:root[data-theme=...]` and applied by `applyTheme()`. Each theme **only shifts the accent family** (`--teal*`, `--orange*`, `--good`, `--tint*`, `--sky`, `--glow`, shadows). Paper/card/line/cream and all artwork stay identical, so this screen recolors (pills, ring, chips, gradients, tab bar) but keeps layout. There is no per-OS dark mode — theme is user-chosen state in `S.profile.theme`.

10. **Safe areas**: `.topbar` top padding is `max(20px, 12px + env(safe-area-inset-top))`; `.pad` bottom padding reserves `var(--nav-h)+20` for the floating tab bar. Port must respect notch/home-indicator insets equivalently.

11. **Numbers are localized**: coin counts via `money()` → `toLocaleString('en-US')` (comma thousands). Streak/health/counts are raw integers. Health always rendered `${health}/100`.

12. **Reduced motion**: pet/egg/idle-coin/garden animations are disabled under `prefers-reduced-motion: reduce`; interactive `:active` transforms and confetti are also gated (`confetti()` early-returns under reduced motion).
