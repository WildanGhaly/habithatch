# Prototype Spec — Recap + Dialog + Toast + Confetti + Reward overlays, Nav shell, Boot

Build contract extracted verbatim from `prototype/habithatch_v1.html`.
Source lines: script `renderRecap`…`showReward`/boot = **4020–4260**; recap helpers `openRecap`/`weekAgg` = **4010–4019**; CSS = **8–965**; data/formulas = **1078–1957**.
All strings, hex colors, px values and numbers below are copied exactly from source — do **not** paraphrase them when rebuilding.

The app is a single fixed-size phone frame (`#device`, max 440×940). Everything here lives inside that frame. There is **no dark mode** — the palette is a fixed cream/teal light theme (see NOTES §5.10). "Themes" only swap the accent family, and even that does **not** touch the recap card's hardcoded blues (NOTES §5.9).

---

## 1. VISUAL TREE

### 1.A The Recap overlay screen (`#recap`) — static shell (body markup, lines 1057–1063)

```
section.screen.overlay #recap
└─ div.sheethead
   ├─ button.iconbtn  [onclick="closeScreen('recap')"]
   │   └─ svg (back chevron)  <path d="M15 18l-6-6 6-6">
   ├─ h2            "Weekly recap"
   └─ div [style="width:40px"]        (spacer to balance the back button)
└─ div.scroll #recapBody             (innerHTML injected by renderRecap())
```

`openRecap()` (line 4013) does: `renderRecap(); openScreen('recap')` → screen slides up (`.slide-up`).

---

### 1.B `#recapBody` — EMPTY variant (lines 4037–4048)
Rendered when `!w.due && !w.kept` (no habits were due AND none kept this week).

```
div.pad-flat
└─ div.empty [style="padding:52px 22px"]
   ├─ div.em-ic                       → ic('gift',44)   (44px gift glyph)
   ├─ div.em-t   "No recap for this week yet"
   ├─ div.em-s   (conditional, contains a literal <br>):
   │     • if user has ≥1 non-archived habit:
   │         "Nothing has been due yet this week. Your card fills in<br>as the days go by, and it is worth sharing by Sunday."
   │     • else (no habits at all):
   │         "Add a habit and check it off. The weekly card starts<br>building from your very first day."
   └─ button.btn.sm [style="margin-top:16px"]
         [onclick="closeScreen('recap');setTimeout(()=>switchTab('today'),240)"]
         → ic('chevR',15) + text " Back to today"
```

---

### 1.C `#recapBody` — FULL variant (lines 4049–4125)

```
div.pad-flat
├─ div.recapcard                                    (teal gradient hero card)
│  ├─ div [inline: font-size:11px;font-weight:800;color:#BFE3F3;letter-spacing:.5px;text-transform:uppercase;position:relative;z-index:2]
│  │     text = `${prettyDate(ws)} to ${prettyDate(dstrOff(6,ws))}`     e.g. "Jul 28 to Aug 3"
│  ├─ div [inline: font-size:23px;font-weight:800;margin-top:4px;position:relative;z-index:2]
│  │     text = `${esc(S.profile.name)}'s week`                          e.g. "Dustin's week"
│  ├─ div [inline: font-size:13px;color:#D6EEF7;margin-top:4px;line-height:1.5;position:relative;z-index:2]
│  │     text = verdict (see §3 for the 4 exact strings)
│  ├─ div.recapgrid                                  (2×2 stat grid)
│  │  ├─ div.rcell → div.rv `${w.kept}`        + div.rl "Habits kept"
│  │  ├─ div.rcell → div.rv `${w.ac}`          + div.rl "All-clear days"
│  │  ├─ div.rcell → div.rv `${S.profile.streak}` + div.rl "Streak now"
│  │  └─ div.rcell → div.rv `${money(w.coins)}`  + div.rl "Coins earned"
│  └─ div.recappet                                   (avatar + progress rows)
│     ├─ div.fit [style="height:60px;flex:none"]  → avatarArt()  (egg SVG pre-hatch, species art post-hatch)
│     └─ POST-HATCH variant (S.pet.hatchState==='hatched'):
│        div.rpmain
│        ├─ div.rpname   `${esc(S.pet.name)} is ${moodOf(S.pet.health).t.toLowerCase()}`   e.g. "Mochi is happy"
│        ├─ div.rprow    (Health)
│        │  ├─ span.rpk   "Health"
│        │  ├─ span.rpbar → i [style="width:${S.pet.health}%"]
│        │  └─ span.rpv    `${S.pet.health}` + <small>/100</small>
│        └─ div.rprow    (Stage)
│           ├─ span.rpk   "Stage"
│           ├─ span.rppips → 5× i, class "on" when index < petStage()
│           └─ span.rpv    `${petStage()}` + <small>/5</small>
│     └─ PRE-HATCH variant (egg):
│        div.rpmain
│        ├─ div.rpname   "Your egg is warming"
│        ├─ div.rprow    (Warmth)
│        │  ├─ span.rpk   "Warmth"
│        │  ├─ span.rppips.wide → 3× i, class "on" when index < S.pet.hatchProgress
│        │  └─ span.rpv    `${S.pet.hatchProgress}` + <small>/3</small>
│        └─ div.rprow    (Hatches)
│           ├─ span.rpk   "Hatches"
│           ├─ span.rpnote `after ${3-S.pet.hatchProgress} more all-clear day${plural}`   (plural="" if 1 remains, else "s")
│           └─ span.rpv    (empty)
│
├─ div.d-actions [style="margin:16px 0 22px"]
│  ├─ button.btn.ghost.block [onclick="copyRecap()"]  → ic('note',15)  + " Copy text"
│  └─ button.btn.block       [onclick="shareRecap()"] → ic('gift',15)  + " Share card"
│
├─ PANEL 1  panel({ic:'scale', title:'This week against last', body, foot})   ── see §1.C.1
├─ PANEL 2  panel({ic:'note',  title:'Habit by habit', body})                 ── see §1.C.2
├─ PANEL 3  panel({ic:'calendar', title:'Day by day', body})                  ── see §1.C.3
├─ PANEL 4  panel({ic:'sprout', title:'What grew this week', body, foot})     ── see §1.C.4
│
└─ if NOT premium (S.profile.premium falsy):
   div.callout.warn
   ├─ ic('crown',14)
   └─ span "HabitHatch+ exports this as an image you can post. The numbers are yours either way."
```

**`panel(o)` wrapper (lines 3218–3232)** — every PANEL renders as:
```
div.panel
├─ div.panel-h  → ic(o.ic||'chart',16) + h4{o.title} + (o.right||'')
├─ if o.sub:  div.panel-s{o.sub}
├─ body   (o.body, or a .locked/.lockover blur wrapper if o.locked && !premium — NOT used by recap)
└─ if o.foot: div.panel-f{o.foot}
```

#### 1.C.1 PANEL 1 body — `div.sgrid` with four `statCard`s (lines 4090–4096)
`statCard(o)` (lines 3211–3216) renders:
```
div.scard
├─ div.sk  → ic(o.ic,13) + " " + o.k
├─ div.sv  → o.v + (o.unit ? <small>{o.unit}</small> : '')
├─ (o.delta || '')          ← the .delta chip
└─ (o.s ? div.ss{o.s} : '')  ← not used here
```
The four cards (k / v / unit / delta source):
| ic | k | v | unit | delta = deltaChip(now, prev, unit) |
|----|----|----|----|----|
| `target` | "Completion" | `w.pct` | `%` | `deltaChip(w.pct, pv.due?pv.pct:null, 'pt')` |
| `check` | "Habits kept" | `w.kept` | — | `deltaChip(w.kept, pv.due?pv.kept:null)` |
| `checkCircle` | "All-clear" | `w.ac` | ` days` (leading space) | `deltaChip(w.ac, pv.due?pv.ac:null)` |
| `bolt` | "Coins" | `money(w.coins)` | — | `deltaChip(w.coins, pv.due?pv.coins:null)` |

PANEL 1 `foot`:
- if `bestDay && bestDay.r.done`: `<b>${WD[dow(bestDay.k)]}</b> was your strongest day at ${bestDay.r.done} of ${bestDay.r.due}.` e.g. "**Wed** was your strongest day at 4 of 4."
- else: `"Nothing kept yet this week. There is still time."`

#### 1.C.2 PANEL 2 body — "Habit by habit" (lines 4098–4107)
If `perHabit.length`, one row per habit (already sorted by pct descending):
```
div.hstack
├─ div.hstop
│  ├─ span.hsic   → catArt(x.h.cat)   (category SVG)
│  ├─ span.hsn [title="{name}"]  → esc(x.h.name)
│  └─ span.hsv  (adds class "na" when x.n===0)
│        text = x.n ? `${x.d} of ${x.n}` : "not due"
└─ span.hst
   └─ span.hsf   classes: "g" if x.pct>=80, "o" if x.pct<50, else none
                 [style="width:${x.n ? x.pct : 0}%"]
```
Empty fallback (no scheduled habits): `div.empty[style="padding:10px"] → div.em-s "No habits scheduled this week."`

#### 1.C.3 PANEL 3 body — "Day by day" (lines 4109–4114)
Seven rows, one per weekday (`days[]`):
```
div.hlrow
├─ div.hlic   → d.r.ac ? ic('checkCircle',17) : d.future ? ic('clock',17) : ic('circle',17)
├─ div.hlt    → `${WD[dow(d.k)]}` + (d.k===today() ? " · today" : "")
└─ div.hlv    [style="color:${d.r.ac ? 'var(--good)' : 'var(--muted)'}"]
      text = d.future ? "not yet" : d.r.due ? `${d.r.done}/${d.r.due}` : "nothing due"
```

#### 1.C.4 PANEL 4 body — "What grew this week" (lines 4116–4122)
```
div.tl                                            (vertical timeline w/ rail)
├─ for each g in plantedThisWeek:
│   div.tlrow.on
│   ├─ div.tlt  `Planted ${g.name}`
│   └─ div.tld  `${g.perk} · ${prettyDate(S.gardenLog[g.id])}`
├─ for each a in badgesThisWeek:
│   div.tlrow.on
│   ├─ div.tlt  `Badge: ${a.name}`
│   └─ div.tld  `${a.desc} · ${prettyDate(S.achLog[a.id])}`
└─ if BOTH lists empty:
    div.tlrow           (note: NO .on → hollow dot)
    ├─ div.tlt  "Nothing new planted yet"
    └─ div.tld  nextPlot()
                 ? `${nextPlot().name} needs ${money(Math.max(0,nextPlot().cost-S.profile.coins))} more coins`
                 : "The garden is complete"
```
PANEL 4 `foot`: `Garden is <b>${gardenPct()}%</b> grown, ${grown.length} of ${GARDEN.length} plots.` (`GARDEN.length` = 8) e.g. "Garden is **25%** grown, 2 of 8 plots."

---

### 1.D Dialog (`openDialog(html)` → `#dialogHost`, lines 4149–4152)

```
#dialogHost (innerHTML)
└─ div.scrim  [onclick="if(event.target===this)closeDialog()"]     (dim backdrop, bottom-anchored)
   └─ div.dialog                                                    (white bottom sheet)
      └─ {html}
```

Concrete instance — the `shareRecap()` non-premium upsell (lines 4135–4140), passed as `html`:
```
div.grip
div [inline: color:var(--yellow-2);display:flex;justify-content:center]  → ic('crown',44)
h3   "Share as an image"
p.d-sub  "Card export is a HabitHatch+ extra. You can always copy the text version for free."
div.d-actions
├─ button.btn.ghost.block [onclick="closeDialog();copyRecap()"]  "Copy text"
└─ button.btn.block       [onclick="closeDialog();openPremium()"] "See HabitHatch+"
```

### 1.E Toast (`#toast`, `toast(msg,img)`, lines 4160–4167)
```
#toast   (device-level layer)
├─ (img ? <img src="{img}"> : nothing)
└─ <span>{msg}</span>
```
State classes: `.show` (visible), `.high` (repositions to top — added when a live non-closing `.scrim` OR an open reward exists).

### 1.F Confetti (`#confetti`, `confetti()`, lines 4168–4183)
70 dynamically-created `div.conf` children appended to `#confetti`, each removed after 3400 ms. See §3 for the exact randomization.

### 1.G Reward overlay (`#reward`, `showReward(o)`, lines 4185–4202)
```
#reward   (adds .show; full-frame dim overlay)
└─ div.rewardcard
   ├─ div.burst      → o.icon || ic('trophy',52)
   ├─ if o.stars:
   │    div.startrow [style="justify-content:center;margin:4px 0 2px"]
   │      → o.stars × span[style="display:inline-flex;width:20px;height:20px"] containing ART['star'+o.stars]
   │        (NOTE: count = o.stars, and every star uses the SAME art keyed by o.stars — see NOTES §5.7)
   ├─ h2  {o.title}
   ├─ p   {o.sub || ''}
   ├─ if (o.coins!=null || o.right):
   │    div.rewardstats
   │    ├─ if o.coins!=null:  div.rs → div.rv(<img src=ASSETS.coin> + `+${money(o.coins)}`) + div.rl "Bonus coins"
   │    └─ if o.right:        div.rs → div.rv{o.right.v} + div.rl{o.right.l}
   ├─ if o.note:  div.rewardbonus  (adds class "muted-bonus" when o.coins==null) → {o.note}
   ├─ if o.goal:  div.rewardgoal → {o.goal}
   └─ button.btn.block [style="margin-top:16px"] [onclick="closeReward()"]  "Continue"
```
After injection: `r.classList.add('show'); confetti();`

### 1.H Nav shell — `#main` + `.tabbar` (body lines 985–1007)
```
section.screen #main
├─ div.scroll #tabToday                                  (visible tab host)
├─ div.scroll #tabHabits  [style="display:none"]
├─ div.scroll #tabPet     [style="display:none"]
├─ div.scroll #tabGarden  [style="display:none"]
└─ nav.tabbar
   ├─ button [data-tab="today"].on  [onclick="switchTab('today')"]
   │   ├─ span.ni → svg (calendar-with-check, 24×24 stroke)
   │   └─ span.lbl "Today"
   ├─ button [data-tab="habits"]    [onclick="switchTab('habits')"]
   │   ├─ span.ni → svg (checklist)
   │   └─ span.lbl "Habits"
   ├─ button.capbtn  [onclick="openEditor()"] [aria-label="Add a habit"]   (raised orange FAB, center)
   │   └─ svg <path d="M12 5v14M5 12h14">   (plus)
   ├─ button [data-tab="pet"]       [onclick="switchTab('pet')"]
   │   ├─ span.ni → svg (paw)
   │   └─ span.lbl "Companion"          ← label text differs from data-tab key "pet"
   └─ button [data-tab="garden"]    [onclick="switchTab('garden')"]
       ├─ span.ni → svg (sprout)
       └─ span.lbl "Garden"
```
Device-level sibling layers (outside `#main`, lines 1072–1076): `#toast`, `#reward`, `#confetti`, `#dialogHost`, `button.dev` (invisible triple-tap reset strip).

---

## 2. STYLE TABLE

All rules copied verbatim. `:root` custom properties they resolve to are listed first.

### 2.0 Root tokens used here (lines 9–24)
```
--teal:#0C4C60; --teal-2:#12667F; --teal-ink:#0B2530;
--orange:#E28A4B; --orange-2:#C9773A;
--yellow:#FFDA7C; --yellow-2:#F4B942;
--ink:#2D2F41; --muted:#8B897E;
--cream:#FBF6EC; --card:#FFFFFF; --line:#EFE6D6; --line-2:#E4D8C2;
--grass:#A7C34F; --sky:#BFE3F3;
--good:#1E7F91; --danger:#E5654B; --pink:#E68FB0;
--tint:#FFF7EF; --tint-2 (see note); --glow:rgba(226,138,75,.5);
--shadow:0 10px 16px rgba(12,76,96,.10);  --shadow-sm:0 4px 12px rgba(12,76,96,.08);
--r-sm:12px; --r-md:16px; --r-lg:20px; --r-pill:999px;
--nav-h:74px;
```
Note: line 18 literally declares `--tint-2:var(--tint-2)` (self-referential → resolves to nothing on default theme, so `.tint-2` backgrounds are effectively transparent unless a theme sets it). Each HabitHatch+ theme (dusk/forest/ocean/ember, lines 28–55) redefines the accent family AND sets a concrete `--tint-2` (e.g. dusk `#EDE7F6`).

### 2.1 Screen stack / animation (lines 115–128)
```
.screen{position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--cream);}
.screen.active{display:flex;}
.screen.overlay{z-index:40;}
.fade-in{animation:fade .28s ease both;}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.slide-up{animation:slideup .32s cubic-bezier(.2,.8,.2,1) both;}
.slide-down{animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
.fade-out{animation:fadeout .2s both;}
@keyframes slideup{from{transform:translateY(100%)}to{transform:none}}
@keyframes slidedown{from{transform:none}to{transform:translateY(100%)}}
@keyframes fadeout{from{opacity:1}to{opacity:0}}
.scroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}
.pad-flat{padding:16px 16px 26px;}
```
(Scrollbars hidden inside `#device` via lines 101–103: `scrollbar-width:none` etc.)

### 2.2 Sheet header (lines 500–503)
```
.sheethead{display:flex;align-items:center;gap:12px;padding:14px 16px;padding-top:calc(14px + env(safe-area-inset-top));background:#fff;border-bottom:1px solid var(--line);}
.sheethead h2{flex:1;font-size:18px;}
.iconbtn{width:40px;height:40px;border-radius:14px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);flex:none;}
.iconbtn svg{width:18px;height:18px;stroke:var(--teal);stroke-width:2.5;fill:none;}
```

### 2.3 Buttons (lines 149–160)
```
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;
  box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;}
.btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);}
.btn.ghost{background:#fff;color:var(--teal);box-shadow:0 0 0 1.5px var(--line-2) inset;font-weight:600;}
.btn.ghost:active{transform:translateY(2px);}
.btn.block{display:flex;width:100%;}
.btn.sm{padding:9px 14px;border-radius:var(--r-sm);font-size:13px;box-shadow:0 4px 0 var(--orange-2);}
.btn.sm:active{box-shadow:0 1px 0 var(--orange-2);}
.btn[disabled]{opacity:.5;box-shadow:none;pointer-events:none;filter:saturate(.6);}
```

### 2.4 Recap hero card (lines 699–704)
```
.recapcard{background:linear-gradient(160deg,var(--teal),var(--teal-2));border-radius:24px;padding:20px;color:#fff;box-shadow:var(--shadow);position:relative;overflow:hidden;}
.recapcard::after{content:"";position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,218,124,.14);}
.recapgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;position:relative;z-index:2;}
.rcell{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:var(--r-md);padding:12px;}
.rcell .rv{font-size:22px;font-weight:800;line-height:1;}
.rcell .rl{font-size:10.5px;font-weight:700;color:#BFE3F3;text-transform:uppercase;letter-spacing:.3px;margin-top:4px;}
```

### 2.5 Recap pet row (lines 682–697)
```
.recappet{display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:15px;position:relative;z-index:2;
  border-top:1px solid rgba(255,255,255,.14);}
.rpmain{min-width:0;flex:1;}
.rpname{font-size:13px;font-weight:800;color:#fff;letter-spacing:.1px;margin-bottom:9px;}
.rprow{display:grid;grid-template-columns:50px 1fr 52px;align-items:center;gap:9px;margin-top:7px;}
.rpk{font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:#8FBACB;}
.rpbar{height:7px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden;}
.rpbar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--yellow-2),var(--yellow));}
.rppips{display:flex;align-items:center;gap:4px;}
.rppips i{flex:1;max-width:26px;height:7px;border-radius:999px;background:rgba(255,255,255,.18);}
.rppips.wide i{max-width:46px;}
.rppips i.on{background:var(--yellow);}
.rpnote{font-size:11px;font-weight:600;color:#9FC9D8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rpv{text-align:right;font-size:14px;font-weight:800;color:#fff;line-height:1;white-space:nowrap;}
.rpv small{font-size:10px;font-weight:700;color:#9FC9D8;}
```

### 2.6 SVG fitter (lines 278–280)
```
.fit{display:flex;align-items:flex-end;justify-content:center;}
.fit>svg{height:100%;width:auto;display:block;}
.fit>img{height:100%;width:auto;object-fit:contain;display:block;}
```

### 2.7 Panel + stat cards + delta (lines 824–844)
```
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.sgrid.g3{grid-template-columns:1fr 1fr 1fr;}
.scard{background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:12px 13px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;}
.scard .sk{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;}
.scard .sk .ic{color:var(--teal);}
.scard .sv{font-size:23px;font-weight:800;color:var(--teal-ink);line-height:1.05;margin-top:6px;display:flex;align-items:baseline;gap:4px;}
.scard .sv small{font-size:12px;font-weight:700;color:var(--muted);}
.scard .ss{font-size:11px;font-weight:600;color:var(--muted);margin-top:3px;line-height:1.35;}       /* + line 964: white-space:nowrap;overflow:hidden;text-overflow:ellipsis; */
.delta{display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:800;padding:2px 7px 2px 5px;border-radius:var(--r-pill);margin-top:6px;}
.delta.up{background:#E7F2E4;color:#4C7A32;}
.delta.down{background:#FDECE8;color:#B9553C;}
.delta.flat{background:var(--cream);color:var(--muted);}
.delta svg{width:11px;height:11px;}
.panel{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow-sm);padding:15px 16px;margin-bottom:12px;position:relative;}
.panel-h{display:flex;align-items:center;gap:8px;margin-bottom:3px;}
.panel-h h4{font-size:14.5px;font-weight:800;color:var(--teal-ink);flex:1;}
.panel-h .ic{color:var(--teal);}
.panel-s{font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.4;margin-bottom:12px;}
.panel-f{font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.45;margin-top:11px;padding-top:11px;border-top:1px solid var(--line);}
.panel-f b{color:var(--teal-ink);}
```
(Locked-panel variant, used only when `o.locked && !premium` — NOT by recap, kept for completeness, lines 847–855: `.locked`, `.lockbody{filter:blur(4.5px);opacity:.5;…}`, `.lockover{…background:linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,.93));…}`, `.lockover .lb{…background:var(--yellow);color:#7A4B00;…}`, `.lockover .lt`, `.lockover .ls`, `.lockover .btn`.)

### 2.8 Habit-by-habit stacked bars (lines 865–878)
```
.hstack{padding:10px 0;border-bottom:1px solid var(--line);}
.hstack:last-child{border-bottom:none;padding-bottom:2px;}
.hstop{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
.hsic{width:20px;height:20px;flex:none;display:flex;align-items:center;justify-content:center;}
.hsic svg,.hsic img{width:100%;height:100%;object-fit:contain;}
.hsn{flex:1;min-width:0;font-size:12.5px;font-weight:700;color:var(--teal-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hsv{flex:none;font-size:12px;font-weight:800;color:var(--teal-ink);}
.hsv.na{font-size:10.5px;font-weight:700;color:var(--muted);}
.hst{display:block;height:10px;border-radius:999px;background:var(--cream);border:1px solid var(--line);overflow:hidden;}
.hsf{display:block;height:100%;border-radius:999px;min-width:0;transition:width .5s;background:linear-gradient(90deg,var(--teal-2),var(--teal));}
.hsf.g{background:linear-gradient(90deg,#8FB94E,#B7D25E);}
.hsf.o{background:linear-gradient(90deg,var(--orange),#EEA872);}
```

### 2.9 Day-by-day rows (lines 641–645)
```
.hlrow{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid var(--line);}
.hlrow:last-child{border-bottom:none;}
.hlic{width:32px;height:32px;border-radius:10px;flex:none;background:var(--cream);color:var(--teal);display:flex;align-items:center;justify-content:center;}
.hlt{flex:1;font-size:13.5px;font-weight:600;color:var(--teal-ink);}
.hlv{font-size:13px;font-weight:800;color:var(--teal-ink);}
```
(`.hlv` inline `color` from JS overrides the base `color` → `var(--good)` when all-clear, else `var(--muted)`.)

### 2.10 Timeline (lines 937–945)
```
.tl{position:relative;padding-left:26px;}
.tl::before{content:'';position:absolute;left:8px;top:6px;bottom:6px;width:2px;background:var(--line);}
.tlrow{position:relative;padding:8px 0;}
.tlrow::before{content:'';box-sizing:border-box;position:absolute;left:-17px;top:17px;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:50%;background:#fff;border:2.5px solid var(--line-2);}
.tlrow.on::before{border-color:var(--orange);background:var(--orange);}
.tlt{font-size:12.5px;font-weight:700;color:var(--teal-ink);line-height:18px;}
.tld{font-size:10.5px;font-weight:600;color:var(--muted);margin-top:1px;}
```

### 2.11 Callout (lines 917–923)
```
.callout{display:flex;gap:9px;align-items:flex-start;background:var(--cream);border:1px solid var(--line-2);border-radius:var(--r-sm);padding:10px 12px;margin-top:11px;font-size:11.5px;font-weight:600;color:var(--muted);line-height:1.45;}
.callout .ic{color:var(--orange);flex:none;margin-top:1px;}
.callout b{color:var(--teal-ink);}
.callout.warn{background:#FFF4E7;border-color:#F6DFC4;}
```

### 2.12 Empty state (lines 707–710)
```
.empty{text-align:center;padding:34px 20px;color:var(--muted);}
.empty .em-ic{margin-bottom:8px;display:flex;justify-content:center;color:var(--line-2);}
.empty .em-t{font-weight:700;color:var(--teal-ink);font-size:15px;margin-bottom:4px;}
.empty .em-s{font-size:13px;line-height:1.5;}
```

### 2.13 Icon primitive (lines 168–170)
```
.ic{display:inline-block;vertical-align:middle;flex:none;}
.ic.stroke{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ic.fill{fill:currentColor;stroke:none;}
```
(`ic(name,size,cls)` line 1196 → `<svg class="ic {stroke|fill} {cls}" width height viewBox="0 0 24 24">…paths…</svg>`. Icon glyph paths used here: `gift`, `chevR`, `note`, `scale`, `target`, `check`, `checkCircle`, `circle`, `bolt`, `calendar`, `clock`, `sprout`, `crown`, `trophy`, `minus`, `arrUp`, `arrDn` — all in the `ICONS` map, lines 1146–1195. Each is `['stroke'|'fill', innerSVG]`.)

### 2.14 Dialog / scrim (lines 526–540)
```
.scrim{position:absolute;inset:0;background:rgba(11,37,48,.5);z-index:60;display:flex;align-items:flex-end;justify-content:center;animation:fade .2s both;}
.scrim.closing{animation:fadeout .24s both;}
.scrim.closing .dialog{animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
.dialog{background:#fff;border-radius:26px 26px 0 0;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;padding:22px 20px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.2);animation:slideup .3s cubic-bezier(.2,.8,.2,1) both;}
.dialog .grip{width:40px;height:5px;border-radius:9px;background:var(--line-2);margin:0 auto 16px;}
.dialog .d-art{width:96px;height:96px;object-fit:contain;margin:0 auto 12px;}
.dialog h3{text-align:center;font-size:19px;margin-bottom:4px;}
.dialog .d-sub{text-align:center;color:var(--muted);font-size:13.5px;margin-bottom:16px;line-height:1.5;}
.dialog h3.left,.dialog .d-sub.left{text-align:left;}
.d-actions{display:flex;gap:10px;margin-top:16px;}
```
(`h1..h4` base rule line 140: `margin:0;font-weight:700;color:var(--teal-ink);`.)

### 2.15 Toast (lines 734–740)
```
#toast{position:absolute;left:50%;bottom:calc(var(--nav-h) + 26px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);
  background:rgba(11,37,48,.95);color:#fff;font-weight:600;font-size:13.5px;padding:11px 16px;border-radius:var(--r-md);
  display:flex;align-items:center;gap:8px;z-index:80;opacity:0;transition:.25s;pointer-events:none;max-width:86%;text-align:left;line-height:1.35;}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
#toast.high{bottom:auto;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%) translateY(-20px);}
#toast.high.show{transform:translateX(-50%) translateY(0);}
#toast img{width:20px;height:20px}
```

### 2.16 Reward (lines 741–755) + `pop`/`spinin` keyframes (222, 745)
```
#reward{position:absolute;inset:0;z-index:70;background:rgba(11,37,48,.55);display:none;align-items:center;justify-content:center;padding:24px;}
#reward.show{display:flex;animation:fade .25s both;}
.rewardcard{background:#fff;border-radius:26px;padding:26px 22px;text-align:center;width:100%;max-width:330px;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:pop .45s cubic-bezier(.2,1.3,.4,1) both;max-height:88vh;overflow-y:auto;}
.rewardcard .burst{display:flex;justify-content:center;margin-bottom:2px;animation:spinin 1.2s ease;}
@keyframes spinin{from{transform:rotate(-20deg) scale(.5)}to{transform:none}}
@keyframes pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
.rewardcard h2{font-size:23px;margin:6px 0 3px;}
.rewardcard p{color:var(--muted);font-size:14px;margin:0 0 18px;line-height:1.45;}
.rewardstats{display:flex;gap:12px;justify-content:center;margin-bottom:18px;}
.rewardstats .rs{background:var(--cream);border-radius:var(--r-md);padding:12px 18px;border:1px solid var(--line);}
.rewardstats .rs .rv{font-size:22px;font-weight:800;color:var(--teal-ink);display:flex;align-items:center;gap:5px;justify-content:center;}
.rewardstats .rs .rv img{width:20px;height:20px}
.rewardstats .rs .rl{font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-top:2px;}
.rewardbonus{display:inline-flex;align-items:center;gap:6px;background:#FFF4E7;border:1px solid #F6DFC4;color:var(--orange-2);font-weight:700;font-size:12.5px;padding:8px 13px;border-radius:var(--r-sm);line-height:1.3;}
.rewardbonus.muted-bonus{background:var(--cream);border-color:var(--line-2);color:var(--muted);font-weight:600;}
.rewardgoal{font-size:11.5px;color:var(--muted);font-weight:700;margin-top:12px;}
.startrow{display:flex;gap:2px;}    /* line 792 */
```

### 2.17 Confetti (lines 756–758)
```
#confetti{position:absolute;inset:0;pointer-events:none;z-index:75;overflow:hidden;}
.conf{position:absolute;width:9px;height:14px;top:-20px;border-radius:2px;animation:fall linear forwards;}
@keyframes fall{to{transform:translateY(960px) rotate(720deg);opacity:.3}}
```
(Each `.conf` also gets per-element inline `left`, `background`, `animation-duration`, `animation-delay`, `width`, `height` from JS — see §3.)

### 2.18 Tab bar / nav (lines 196–212)
```
.tabbar{position:absolute;left:0;right:0;bottom:0;height:calc(var(--nav-h) + env(safe-area-inset-bottom));
  padding-bottom:env(safe-area-inset-bottom);
  background:#fff;border-top:1px solid var(--line);display:flex;z-index:30;
  box-shadow:0 -6px 20px rgba(12,76,96,.06);}
.tabbar button{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;position:relative;}
.tabbar button[data-tab]::before{content:'';position:absolute;top:50%;left:50%;width:62px;height:50px;border-radius:var(--r-md);background:var(--tint-2);opacity:0;transform:translate(-50%,-50%) scale(.82);transition:opacity .22s ease, transform .22s ease;z-index:0;}
.tabbar button.on::before{opacity:1;transform:translate(-50%,-50%) scale(1);}
.tabbar .ni{display:flex;align-items:center;justify-content:center;position:relative;z-index:1;color:var(--muted);opacity:.5;transition:opacity .2s ease,color .2s ease;}
.tabbar .ni svg{width:24px;height:24px;}
.tabbar .lbl{font-size:10.5px;font-weight:700;color:var(--muted);transition:color .2s ease;position:relative;z-index:1;}
.tabbar button.on .ni{opacity:1;color:var(--teal);}
.tabbar button.on .lbl{color:var(--teal);}
.tabbar .capbtn{flex:none;width:62px;height:62px;border-radius:50%;background:var(--orange);border:5px solid var(--card);
  transform:translateY(-18px);box-sizing:border-box;
  box-shadow:0 10px 22px var(--glow),0 5px 0 var(--orange-2);display:flex;align-items:center;justify-content:center;}
.tabbar .capbtn:active{transform:translateY(-14px);box-shadow:0 6px 14px var(--glow),0 2px 0 var(--orange-2);}
.tabbar .capbtn svg{width:28px;height:28px;stroke:#fff;stroke-width:3;fill:none;}
```

### 2.19 Reduced motion (lines 802–804)
```
@media (prefers-reduced-motion: reduce){
  .petart,.eggart,.gardensun,.gardencloud,.pilecoin img{animation:none!important;}
}
```
(`confetti()` and `coinFly()` also self-guard on `matchMedia('(prefers-reduced-motion:reduce)')` in JS.)

---

## 3. DATA / LOGIC (transcribed formulas & numbers)

### 3.1 Week aggregation — `weekAgg(offset)` (lines 4014–4019)
```
ws = dstrOff(-7*offset, weekStart(today()))          // week-start date string (Monday)
for i in 0..6:
  r = S.history[dstrOff(i,ws)]; if !r continue
  kept += r.done;  due += r.due;  if r.ac: ac++;  coins += (r.coins||0)
return { ws, kept, due, ac, coins, pct: due ? Math.round(kept/due*100) : 0 }
```
`weekStart(s)` (line 1306): `dstr(dOff(-((d.getDay()+6)%7), s))` → **Monday-based** week start.
In `renderRecap`: `w = weekAgg(0)` (this week), `pv = weekAgg(1)` (previous week). `ws = w.ws`.

### 3.2 Derived collections (lines 4023–4033)
```
grown            = GARDEN.filter(g => planted(g.id))                                  // planted() = S.garden.includes(id)
plantedThisWeek  = GARDEN.filter(g => S.gardenLog[g.id] && daysBetween(ws, S.gardenLog[g.id]) >= 0)
badgesThisWeek   = ACHIEVEMENTS.filter(a => S.achLog[a.id] && daysBetween(ws, S.achLog[a.id]) >= 0)

perHabit = S.habits.filter(h => !h.archived).map(h => {
  let d=0, n=0
  for i in 0..6: k = dstrOff(i,ws); if k>today() break; if !isDue(h,k,S) continue; n++; if h.logs[k]==='done' d++
  return { h, d, n, pct: n ? Math.round(d/n*100) : 0 }
}).sort((a,b) => b.pct - a.pct)                         // highest completion first

days = for i in 0..6: { k: dstrOff(i,ws), r: S.history[k]||{due:0,done:0,ac:0}, future: k>today() }

bestDay = days.filter(d => !d.future && d.r.due)
              .sort((a,b) => (b.r.done/b.r.due) - (a.r.done/a.r.due))[0]     // highest done/due ratio
```
`daysBetween(a,b)` = `Math.round((parseD(b)-parseD(a))/86400000)`. `isDue` respects archived / created-date / schedule (`daily` | `weekdays` w/ `h.days` | `weekly` w/ `h.perWeek` default 3).

### 3.3 Verdict string (lines 4034–4036)
```
hadLast = pv.due > 0
verdict = !hadLast              ? "Your first week on the board."
        : w.pct > pv.pct + 5    ? "Ahead of last week."
        : w.pct >= pv.pct - 5   ? "About level with last week."
        :                         "A lighter week than the last one."
```

### 3.4 Empty-state gate (line 4037): `if (!w.due && !w.kept)` → render empty variant, return early.

### 3.5 Mood — `moodOf(h)` (lines 1518–1523), h = `S.pet.health`
```
h >= 75 → { t:"Happy",   k:"happy",   bonus:.25 }
h >= 45 → { t:"Content", k:"content", bonus:.10 }
h >= 20 → { t:"Tired",   k:"tired",   bonus:0   }
else    → { t:"Hungry",  k:"hungry",  bonus:0   }
```
Recap name line uses `moodOf(S.pet.health).t.toLowerCase()` → "happy"/"content"/"tired"/"hungry".

### 3.6 Pet stage — `petStage()` (lines 1525–1528)
```
b = Math.max(S.profile.best, S.profile.streak)
s = 1; for i in 1..4: if b >= STAGE_GATE[i] then s = i+1
return (S.pet.hatchState==='hatched') ? s : 1
STAGE_GATE = [0,7,21,50,100]        // stage thresholds (best-streak days)
STAGES     = ["Baby","Young","Grown","Prime","Legend"]
```
Health bar `i` width = `${S.pet.health}%` (0–100). Stage pips: 5 total, `on` when `index < petStage()`. Warmth pips (egg): 3 total, `on` when `index < S.pet.hatchProgress` (0–3).

### 3.7 Garden helpers
```
nextPlot()  = GARDEN.find(g => !planted(g.id))       // first unplanted plot (line 1512)
gardenPct() = Math.round(S.garden.length / GARDEN.length * 100)   // GARDEN.length = 8 (line 1513)
```

### 3.8 Delta chip — `deltaChip(now, prev, unit, invert)` (lines 3203–3210)
```
if prev == null || undefined → return ''       // (recap passes null when pv.due is 0 → chip omitted)
d = now - prev
cls   = d===0 ? 'flat' : ((d>0) !== !!invert ? 'up' : 'down')
arrow = d===0 ? ic('minus',11) : (d>0 ? ic('arrUp',11) : ic('arrDn',11))
v     = Math.abs(Math.round(d*10)/10)          // 1-decimal magnitude
→ <span class="delta {cls}">{arrow}{v}{unit||''}</span>
```
Recap never passes `invert`. `pt` is the only explicit unit (Completion delta shows e.g. "6pt").

### 3.9 Number/date formatters
```
money(n)      = Number(n||0).toLocaleString('en-US')          // e.g. 1234 → "1,234"  (line 1801)
prettyDate(s) = ['Jan'..'Dec'][month] + ' ' + day             // e.g. "Aug 3"          (line 1307)
WD            = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']    // dow(s)=getDay()       (lines 1284,1298)
esc(s)        = HTML-escape & < > "                            // (line 1802)
```

### 3.10 `copyRecap()` clipboard text (lines 4128–4129)
```
w = weekAgg(0)
txt = `HabitHatch, week of ${prettyDate(w.ws)}\n`
    + `${w.kept} habits kept (${w.pct}%) · ${w.ac} all-clear days · ${S.profile.streak} day streak\n`
    + `${money(w.coins)} coins earned. ${S.pet.name} is stage ${petStage()} of 5.`
```

### 3.11 Confetti randomization (lines 4168–4183)
```
guard: if prefers-reduced-motion:reduce → return (no confetti)
colors = ['#E28A4B','#FFDA7C','#0C4C60','#1E7F91','#E68FB0','#12667F','#A7C34F']
70 pieces; per piece:
  left               = random 0..100 %
  background         = colors[i % 7]
  animationDuration  = (1.6 + random*1.4) s          // 1.6–3.0s
  animationDelay     = (random*0.4) s                // 0–0.4s
  width              = (6 + random*6) px             // 6–12px
  height             = (10 + random*8) px            // 10–18px
each removed after 3400 ms
```

### 3.12 GARDEN catalog (lines 1244–1253) — feeds §1.C.4 names/perks/costs and `nextPlot().cost`
| id | name | perk (shown in `.tld`) | cost |
|----|------|------|------|
| sprout | First Sprout | +1 coin per check-off | 120 |
| herbs | Herb Patch | Idle jar cap +50 | 300 |
| can | Watering Can | Health drops 2 slower / day | 550 |
| berry | Berry Bush | +10% coins on all-clear days | 900 |
| sapling | Young Sapling | 1 Streak Freeze every week | 1400 |
| flowers | Flower Bed | Jar cap +100 and forage +25% | 2100 |
| fruit | Fruit Tree | Health drops 2 slower again | 3200 |
| orchard | Orchard | +20% coins everywhere | 4800 |

### 3.13 ACHIEVEMENTS catalog (lines 1266–1279) — feeds `badgesThisWeek` (name/desc) and reward "Badge unlocked"
`{id,name,desc,rar}`: first_crack "First Crack"/"Check off your first habit ever"/1 · alive "It's Alive!"/"Hatch your companion"/2 · green_thumb "Green Thumb"/"Plant your first Garden plot"/1 · stacker "Habit Stacker"/"Keep 5 habits alive on the same day"/1 · week "Week Warrior"/"Reach a 7 day streak"/1 · perfect "Perfect Week"/"7 all-clear days in a row"/2 · iron "Iron Month"/"Reach a 30 day streak"/2 · centurion "Centurion"/"Reach a 100 day streak"/3 · comeback "Comeback"/"Build a new 7 day streak after losing one"/2 · wellfed "Well-Fed"/"Keep health at 75+ for 10 days"/2 · bloom "Full Bloom"/"Plant every Garden plot"/3 · farmer "Coin Farmer"/"Earn 10,000 coins in total"/3. (`rar` = star rarity 1/2/3 used by reward `stars`.)

---

## 4. INTERACTIONS

| Trigger | Handler | Effect |
|---|---|---|
| Open recap (from Insights/elsewhere) | `openRecap()` → `renderRecap(); openScreen('recap')` | Injects recapBody; `#recap` gains `.active .slide-up` (0.32s slide up). |
| Recap header back button | `closeScreen('recap')` | `closeSlide` adds `.slide-down` (0.26s), removes `.active` after 250ms, then `renderAll()`. |
| **Copy text** (`.btn.ghost.block`) | `copyRecap()` (4127) | Builds §3.10 text, `navigator.clipboard.writeText(txt)` (silent catch), `toast('Recap copied to your clipboard')`. |
| **Share card** (`.btn.block`) | `shareRecap()` (4133) | If `!S.profile.premium` → `openDialog(...)` upsell (§1.D). Else → `toast('Recap image saved to your device')`. |
| Empty-state **Back to today** | inline | `closeScreen('recap'); setTimeout(()=>switchTab('today'),240)`. |
| Non-premium callout | none | Static informational strip. |
| Dialog **Copy text** | inline | `closeDialog(); copyRecap()`. |
| Dialog **See HabitHatch+** | inline | `closeDialog(); openPremium()` (opens premium screen). |
| Dialog backdrop tap | inline | `if(event.target===this) closeDialog()` — tap outside sheet only. |
| `closeDialog()` (4153) | — | Sets `pendingBuy=null`; adds `.closing` to the live scrim; removes node after 250ms. |
| Reward **Continue** (`.btn.block`) | `closeReward()` (4203) | Adds `.fade-out`; after 200ms removes `.show`+`.fade-out`, clears innerHTML, `renderAll()`; if `achQueue.length` → `setTimeout(drainAch,260)` (chains queued badge popups). |
| `showReward(o)` (4185) | — | Fills `.rewardcard`, adds `.show`, fires `confetti()`. **Callers:** `maybeAllClear()` "Day complete" reward (line 1677, includes `coins`, `right:{v:streak,l:'Day streak'}`, `note`, `goal`); `drainAch()` "Badge unlocked" reward (line 1787, includes `stars:a.rar`, `note:a.desc`, `goal`). |
| Any `toast(msg,img)` (4161) | — | innerHTML = optional `<img>` + `<span>`; toggles `.high` if a non-closing `.scrim` OR `rewardOpen()`; adds `.show`; auto-hides after **2400 ms**. |
| **Escape** key (4252) | — | If a `#dialogHost .scrim` exists → `closeDialog()`; else if `rewardOpen()` → `closeReward()`. |
| Tab buttons (Today/Habits/Companion/Garden) | `switchTab(t)` (1843) | Sets `S.tab`, toggles `.on` on `[data-tab]` buttons, hides all four `#tab*` hosts, shows `map[t]`, replays `.fade-in`, `renderAll()`, `save()`. |
| Center FAB (`.capbtn`) | `openEditor()` | Opens the habit editor sheet (out of this scope). |

`renderAll()` (1831) re-renders whichever main tab/overlay is active — includes `if($('insights').classList.contains('active')) renderInsights()` etc., but **not** recap (recap is only (re)built by `openRecap`/`renderRecap`).

---

## 5. NOTES (subtleties & conditionals)

1. **Empty vs full recap.** Gate is `!w.due && !w.kept`. The empty `.em-s` copy branches on whether the user has any non-archived habit at all. Both empty copies contain a hard `<br>`.

2. **Pre-hatch vs post-hatch `recappet`.** `S.pet.hatchState==='hatched'` selects the Health+Stage layout (yellow health bar `.rpbar i`, 5 stage pips); otherwise the egg layout (Warmth = 3 wide pips `.rppips.wide`, plus a "Hatches after N more all-clear day(s)" note). Pluralization: `3-hatchProgress===1 ? 'day' : 'days'`.

3. **Delta chips are conditional.** Each `deltaChip` receives `pv.due ? pv.<metric> : null`; with a `null` previous value the function returns `''`, so on a user's first week (no prior data) **no delta chips render** and the verdict is "Your first week on the board."

4. **statCard coins mismatch is intentional.** The Coins card's `v` is `money(w.coins)` (comma-formatted string) but its delta is computed from the **raw** integers `w.coins` vs `pv.coins`. Completion uses unit `'%'` on the value and `'pt'` on the delta.

5. **Habit bar color thresholds** (`.hsf`): `g` (green) when `x.pct>=80`, `o` (orange) when `x.pct<50`, else default teal gradient. Width is `x.pct%` only when due (`x.n>0`), else `0%` and the value shows "not due" via `.hsv.na`.

6. **Day-by-day icon/color logic:** all-clear day → `checkCircle` + `var(--good)`; future day → `clock` + "not yet" + `var(--muted)`; past due day → `circle` + `done/due`; past no-due day → `circle` + "nothing due".

7. **Reward stars quirk.** `showReward` renders `o.stars` copies of `ART['star'+o.stars]` — so the star **count equals the rarity** AND all use the single art variant keyed by that rarity: `star1` teal (#4EA59A), `star2` orange (#E28A4B), `star3` gold (#FFDA7C). A 3-star badge shows three gold stars; a 1-star badge shows one teal star.

8. **Reward bonus muting.** `.rewardbonus` gets `.muted-bonus` (grey, lighter weight) when `o.coins==null` — i.e. badge popups (no coins) show a muted note, while day-complete popups (with coins) show the orange note.

9. **Recap card blues are hardcoded, not themed.** `.recapcard` background uses `var(--teal)`/`var(--teal-2)` (so it DOES recolor per theme), but the inline date/verdict text colors `#BFE3F3`/`#D6EEF7`, `.rcell .rl` `#BFE3F3`, `.rpk` `#8FBACB`, `.rpnote`/`.rpv small` `#9FC9D8` are **literal hex** — they stay teal-blue even under dusk/forest/ocean/ember themes. `.rpbar i` and `.rppips i.on` use `var(--yellow*)` (fixed yellow, not themed).

10. **No dark mode / fixed light UI.** There is no `prefers-color-scheme` handling anywhere; the app is a single cream/teal light theme inside `#device`. Overlays darken via translucent scrims (`rgba(11,37,48,.5)` dialog, `.55` reward, `.95` toast). Themes only shift the accent family (see line 26 comment).

11. **`--tint-2` self-reference.** On the default `hatch` theme, `--tint-2:var(--tint-2)` resolves to nothing → the tab-active pill (`.tabbar button.on::before background:var(--tint-2)`) and `.delta` don't get that wash unless a HabitHatch+ theme is active (which sets a concrete value). Rebuild with a real default (the app visually reads the active-tab pill as a pale teal on themed builds).

12. **`.pad-flat` bottom padding is 26px** (no nav bar under the recap overlay), vs `.pad` which reserves `var(--nav-h)+20px`. Recap is a `.screen.overlay` (z-index 40) above `#main`; its `.sheethead` is a normal (non-sticky) header and `#recapBody` is the scroller.

13. **Tab label vs key.** The Companion tab's visible label is "Companion" but its `data-tab`/state key is `pet`. `switchTab`'s hide loop keys off capitalized names `['Today','Habits','Pet','Garden']` → element ids `tabToday/tabHabits/tabPet/tabGarden`.

14. **Boot / init sequence** (lines 4214–4257):
    - IIFE `init()`: if `!load()` (no valid v2 save) → `S=freshState(true)` (seeds a demo mid-journey save), `applyTheme()`, `save()`, then after **2500ms**: `show('main'); switchTab('today'); checkAch(true)`, and after a further **900ms**: `toast(\`${S.pet.name} saved up some coins while you were away\`, ASSETS.coin)`. Else → `boot()`.
    - `boot()`: `S=load()`, `applyTheme()`, forward-compat fill of any missing top-level/`profile`/`stats` keys from `blankState()`, `rollover()` (deterministic day-catch-up, returns days moved), `show('main'); switchTab(S.tab||'today'); checkAch(true)`. If `moved>0`, after **700ms** one of: Streak-Freeze toast (`'A Streak Freeze saved your streak. Welcome back.'`), or `'New day, clean slate. Nothing was lost.'` (streak 0), or `\`Day ${streak} of your streak. Let's keep it.\``. If pet not hatched, `hatchProgress>=3`, `!seenHatch` → after **900ms** `startHatch()`.
    - `boot()`'s `else` (no save) branch shows onboarding after 2500ms, but is unreachable via `init()` (which only calls `boot()` when a save exists) — defensive dead path.
    - Global keydown Escape closes dialog then reward (§4).

15. **`applyTheme()`** (1818): reads `S.profile.theme` (default `'hatch'`); for `hatch` removes `data-theme`, otherwise sets `document.documentElement[data-theme]=id`. Called on every `renderAll()` and boot.
