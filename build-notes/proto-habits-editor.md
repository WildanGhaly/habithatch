# Build Spec — Habits list + Habit Editor + Goal sheet

Source of truth: `prototype/habithatch_v1.html`
Sections covered: `renderHabits` / `manageRow` / `moveHabit` (lines 2331–2412), Habit Editor sheet
`openEditor` / `editorHTML` + time-picker & save/archive/delete (lines 2417–2567), daily-goal sheet
`openGoal` / `setGoal` (lines 2569–2589). CSS resolved from lines 8–965; data/helpers from 1078–2055.

This is the rebuild contract. Every string, number, hex, px, radius and shadow below is transcribed
verbatim from the prototype. Do not paraphrase copy.

---

## 0. Design tokens (CSS custom properties this screen resolves)

Default theme = `hatch` (no `data-theme` attribute set; base `:root` values apply). Four HabitHatch+
themes (`dusk`, `forest`, `ocean`, `ember`) only re-map the accent family — paper/cards stay identical.
Values below are the base (`hatch`) theme.

| Token | Value (hatch) | Notes |
|---|---|---|
| `--teal` | `#0C4C60` | primary accent (themable) |
| `--teal-2` | `#12667F` | teal light (themable) |
| `--teal-ink` | `#0B2530` | headings / dark text |
| `--orange` | `#E28A4B` | accent, selected chips (themable) |
| `--orange-2` | `#C9773A` | accent-dark, `.pgval`/`.on` text (themable) |
| `--yellow` | `#FFDA7C` | crown/premium |
| `--yellow-2` | `#F4B942` | crown color in premium dialog |
| `--coin-ink` | `#1E4B5F` | coin pill text (themable) |
| `--ink` | `#2D2F41` | body text |
| `--muted` | `#8B897E` | secondary text |
| `--cream` | `#FBF6EC` | paper background / chip fills |
| `--card` | `#FFFFFF` | card background |
| `--line` | `#EFE6D6` | hairline border |
| `--line-2` | `#E4D8C2` | stronger border |
| `--good` | `#1E7F91` | done-dot green (themable) |
| `--danger` | `#E5654B` | delete/miss red |
| `--tint` | `#FFF7EF` | selected-chip wash (themable) |
| `--shadow` | `0 10px 16px rgba(12,76,96,.10)` | card shadow |
| `--shadow-sm` | `0 4px 12px rgba(12,76,96,.08)` | small shadow |
| `--r-sm` | `12px` | small radius |
| `--r-md` | `16px` | medium radius |
| `--r-lg` | `20px` | large radius |
| `--r-pill` | `999px` | pill radius |
| `--nav-h` | `74px` | bottom-nav height (affects `.pad` bottom pad) |

Theme accent overrides (only the moved vars):
- `dusk`: `--teal:#3E2E5E; --teal-2:#5A4487; --teal-ink:#241A38; --coin-ink:#3E2E5E; --orange:#D9628F; --orange-2:#BC4E78; --tint:#FDF0F5; --good:#7A5FA8`
- `forest`: `--teal:#1E4632; --teal-2:#2F6B49; --teal-ink:#132A1F; --coin-ink:#1E4632; --orange:#D19A2E; --orange-2:#B07F1E; --tint:#FBF4E3; --good:#3F7D4E`
- `ocean`: `--teal:#123A5C; --teal-2:#1D5A82; --teal-ink:#0B2135; --coin-ink:#123A5C; --orange:#2FA0AE; --orange-2:#238795; --tint:#E9F6F7; --good:#2E8FA8`
- `ember`: `--teal:#4A2A20; --teal-2:#6E4032; --teal-ink:#2C1710; --coin-ink:#4A2A20; --orange:#DE5B39; --orange-2:#BE452A; --tint:#FDEFEA; --good:#A8623F`

Icon helper `ic(name,size,cls)` emits `<svg class="ic <stroke|fill> [cls]" width=size height=size viewBox="0 0 24 24">`.
`.ic.stroke` = `fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round`.
`.ic.fill` = `fill:currentColor;stroke:none`. Icon color = inherited `currentColor`.
Icons used here (name → type): `plus` stroke, `chevR` stroke, `chevU` stroke, `chevD` stroke, `note`
stroke, `info` stroke, `edit` stroke, `sparkle` fill, `repeat` stroke, `bell` stroke, `clock` stroke,
`trash` stroke, `crown` fill, `target` stroke.

---

## 1. VISUAL TREE

### 1A. Habits tab — populated state (`renderHabits`, injected into `#tabHabits`)

```
#tabHabits
└─ .topbar
   ├─ button.hi-av            [onclick openProfile()]  → avatarImg(44): <span.avwrap><span.avin>{pet avatar SVG/img}</span></span>
   ├─ div.hello  [style="flex:1"]
   │   ├─ div.k               text: "{live} active · {dueToday} due today"   (middle dot = "·")
   │   └─ div.n               text: "Your habits"
   └─ span.coinpill           <img src=ASSETS.coin> + text money(S.profile.coins)  (e.g. "2,140")
└─ div.pad  [style="padding-top:6px"]
   ├─ button.eggbanner  [style="margin-top:0;background:linear-gradient(135deg,var(--teal),var(--teal-2))"]  [onclick openEditor()]   (only if live.length>0)
   │   ├─ span.eb-ic          ic('plus',26)
   │   ├─ span [style="flex:1;min-width:0"]
   │   │   ├─ span.eb-h        text: "Add a habit"
   │   │   └─ span.eb-s        text: "Name it, pick an icon, choose how often. Thirty seconds."
   │   └─ span.chev           ic('chevR',16)
   │
   ├─ (if live.length>0)  «ACTIVE»
   │   ├─ div.shead
   │   │   ├─ h3              text: "Active"
   │   │   └─ span.muted [style="font-size:12px;font-weight:700"]  text: "{live.length}"
   │   └─ {live.map(manageRow)}          ← see 1B
   │
   ├─ (else, live.length===0)  «EMPTY STATE»
   │   └─ div.empty [style="margin-top:20px"]
   │       ├─ div.em-ic       ic('note',40)
   │       ├─ div.em-t        text: "No habits yet"
   │       ├─ div.em-s        text: "Start with one or two you actually want.<br>Small beats ambitious every time."
   │       └─ button.btn.sm [style="margin-top:14px"] [onclick openEditor()]   ic('plus',15) + " Add your first"
   │
   ├─ (if arch.length>0)  «ARCHIVED»
   │   ├─ div.shead
   │   │   ├─ h3              text: "Archived"
   │   │   └─ span.see        [onclick "showArchived=!showArchived;renderHabits()"]  text: showArchived?"Hide":"Show {arch.length}"
   │   └─ (if showArchived) {arch.map(manageRow)}
   │
   └─ (if S.habits.length>0)  div.growthnote
       ├─ ic('info',14)
       └─ text: "Archiving keeps a habit's history and badges. It only stops appearing on Today."
```

### 1B. `manageRow(h,d)` — one habit row (used for both Active and Archived)

```
div.habit[.done if h.archived]  [style="align-items:flex-start"]
├─ div.h-ic                 catArt(h.cat)   → inline category artwork SVG (28×28 rendered)
├─ div.h-main
│   ├─ div.h-name           esc(h.name)                         (truncates with ellipsis)
│   ├─ div.h-sub
│   │   ├─ span.hflame[.cold if h.cur<=0]   flameSVG(15) + text "{h.cur}"
│   │   ├─ span.tag         schedLabel(h)   e.g. "Every day" / "Weekdays" / "2× a week"
│   │   └─ span.h-meta      text: "best {h.best}"
│   └─ div.wdots            7× <i>  ← one per weekday, Mon-first (see logic §3)
│       └─ i.{cls}[.today]  cls ∈ {"on","miss","na",""}; if done: inner <span>{weekday letter}</span>
└─ div.hactions  [style="flex-direction:column;gap:5px"]
    ├─ button.sortbtn  [disabled if li<=0 || h.archived]  [onclick moveHabit(h.id,-1)]  aria-label="Move up"    ic('chevU',15)
    ├─ button.sortbtn  [disabled if li<0||li>=live.length-1||h.archived] [onclick moveHabit(h.id,1)] aria-label="Move down" ic('chevD',15)
    └─ button.sortbtn  [onclick openEditor(h.id)]  aria-label="Edit"   ic('edit',15)
```

### 1C. Habit Editor sheet (`editorHTML`, rendered inside `.scrim > .dialog` via `openDialog`)

```
.scrim  [onclick closeDialog() when clicking backdrop]
└─ .dialog
   ├─ div.grip
   ├─ h3.left [style="margin-bottom:16px"]   text: ed._new?"New habit":"Edit habit"
   │
   ├─ div.pgroup  «NAME»
   │   ├─ div.pglbl            ic('edit',13) + " Name"
   │   └─ input.field #edName  [maxlength="42"] [placeholder="e.g. Drink a glass of water"] value=esc(ed.name) [oninput ed.name=this.value]
   │
   ├─ div.pgroup  «ICON»
   │   ├─ div.pglbl            ic('sparkle',13) + " Icon " + span.pgval{catOf(ed.cat).name}
   │   └─ div.iconpick         11× button[.on if ed.cat===c.id] [onclick edSet('cat',c.id)] title/aria=c.name → catArt(c.id)
   │
   ├─ div.pgroup  «SCHEDULE»
   │   ├─ div.pglbl            ic('repeat',13) + " Schedule " + span.pgval{schedLabel(ed)}
   │   ├─ div.pchips.g3        3× button.pchip[.on] labels: "Daily","Weekdays","X / week"  [onclick edSet('sched', 'daily'|'weekdays'|'weekly')]
   │   ├─ (if ed.sched==='weekdays') div.pchips.g7 [style="margin-top:8px"]
   │   │       7× button.pchip.sq[.on if days includes day]  labels S,M,T,W,T,F,S  [onclick edDay(day)]   (day mapping — see NOTES quirk)
   │   └─ (if ed.sched==='weekly')
   │       ├─ div.pchips.g5 [style="margin-top:8px"]  5× button.pchip[.on]  labels "1×"…"5×"  [onclick edSet('perWeek',n)]
   │       └─ div.hint         ic('info',12) + " Stops asking once you hit {ed.perWeek||3} this week."
   │
   ├─ div.pgroup  «REMINDER»
   │   ├─ div.pglbl            ic('bell',13) + " Reminder " + span.pgval#edRemVal{ed.remind||"Off"}
   │   ├─ div.timerow
   │   │   ├─ button.pchip[.on if !ed.remind]  text "Off"  [onclick edTime('')]
   │   │   └─ button.timebtn[.on if ed.remind][.open if ed._pick]  [onclick toggleTimePick()]
   │   │        ic('clock',15) + span{ed.remind||"Pick a time"} + ic(ed._pick?'chevU':'chevD',14)
   │   ├─ (if ed._pick) div.timepop
   │   │   ├─ div.twheel#twH    24× button.ti[.on if hour selected]  labels "00".."23"  [onclick setTimePart(0,hh)]
   │   │   ├─ span.tcolon       ":"
   │   │   └─ div.twheel#twM    12× button.ti[.on if min selected]  labels "00","05".."55"  [onclick setTimePart(1,mm)]
   │   └─ div.pchips.g4 [style="margin-top:8px"]  4× button.pchip[.on if ed.remind===t]  "07:00","12:00","18:00","21:30"  [onclick edTime(t)]
   │
   ├─ div.d-actions
   │   ├─ (if _new)  button.btn.ghost.block  "Cancel"  [onclick closeDialog()]
   │   │  (else)     button.btn.ghost.block  {ed.archived?"Restore":"Archive"}  [onclick archiveHabit(ed.id)]
   │   └─ button.btn.block  {ed._new?"Add habit":"Save"}  [onclick saveHabit()]
   │
   └─ (if not _new) button.btn.block.ghost [style="margin-top:10px;color:var(--danger)"] [onclick deleteHabit(ed.id)]  ic('trash',15) + " Delete permanently"
```

### 1D. Premium cap dialog (opened by `openEditor()` when NEW + not premium + ≥7 active habits)

```
.dialog
├─ div.grip
├─ div [style="color:var(--yellow-2);display:flex;justify-content:center"]  ic('crown',44)
├─ h3          text: "Room for more?"
├─ p.d-sub     text: "The free plan holds 7 active habits, enough for a real routine. HabitHatch+ lifts the cap entirely."
└─ div.d-actions
    ├─ button.btn.ghost.block  "Not now"  [onclick closeDialog()]
    └─ button.btn.block        "See HabitHatch+"  [onclick "closeDialog();openPremium()"]
```

### 1E. Delete confirm dialog (`deleteHabit(id)`)

```
.dialog
├─ div.grip
├─ h3          text: "Delete “{esc(h.name)}”?"        (curly quotes “ ”)
├─ p.d-sub     text: "This erases its {Object.keys(h.logs).length} logged days and its {h.best}-day best streak. Archiving keeps all of that instead."
├─ div.d-actions
│   ├─ button.btn.ghost.block  "Back"  [onclick "closeDialog();openEditor(id)"]
│   └─ button.btn.block [style="background:var(--danger);box-shadow:0 6px 0 #B84C36"]  "Delete"  [onclick doDelete(id)]
└─ button.btn.block.ghost [style="margin-top:10px"]  "Archive instead"  [onclick archiveHabit(id)]
```

### 1F. Daily-goal sheet (`openGoal`)

```
.dialog
├─ div.grip
├─ h3.left [style="margin-bottom:14px"]  text: "What counts as a win?"
└─ div.pgroup
    ├─ div.pglbl   ic('target',13) + " Habits per day " + span.pgval{ S.profile.dailyGoal>0 ? "{dailyGoal} / day" : "All due" }
    ├─ div.pchips.g4   opts.map → button.pchip[.on if dailyGoal===n]  label: n===0?"All due":"{n} / day"  [onclick setGoal(n)]
    │       opts = [0, 1, 2, … min(6, maxDue)]   (maxDue = max(1, active-habit count))
    └─ div.hint    ic('info',12) + " That is <b>{now||0}</b> habit{now===1?'':'s'} to clear today."
└─ div.d-actions
    └─ button.btn.block  "Done"  [onclick closeDialog()]
```

---

## 2. STYLE TABLE (verbatim declarations)

### Layout / scroll containers
```css
.pad{padding:16px 16px calc(var(--nav-h) + 20px);}   /* = 16 16 94 (nav-h 74 +20) */
.scroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}
.muted{color:var(--muted);}
h1,h2,h3,h4{margin:0;font-weight:700;color:var(--teal-ink);}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
input,textarea,select{font-family:inherit;}
img{display:block;}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
```
Body font family: `'Poppins','Segoe UI',Roboto,system-ui,-apple-system,sans-serif;`

### Top bar
```css
.topbar{padding:max(20px, calc(12px + env(safe-area-inset-top))) 16px 8px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.hello .k{font-size:12px;color:var(--muted);font-weight:600;line-height:1;}
.hello .n{font-size:20px;font-weight:800;color:var(--teal-ink);line-height:1.15;}
.hi-av{flex:none;}
.hi-av img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2.5px solid #fff;background:#DDEDE9;box-shadow:var(--shadow-sm);}
.hi-av:active{transform:scale(.94);}
```

### Coin pill
```css
.coinpill{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1.5px solid var(--line-2);
  padding:6px 12px 6px 7px;border-radius:var(--r-pill);font-weight:700;color:var(--coin-ink);box-shadow:var(--shadow-sm);}
.coinpill img{width:22px;height:22px}
.coinpill.bump{animation:bump .5s ease;}                    /* fired elsewhere on coin change */
@keyframes bump{0%,100%{transform:none}30%{transform:scale(1.16)}}
```

### Avatar wrapper (avatarImg output)
```css
.avwrap{display:inline-flex;border-radius:50%;overflow:hidden;border:2.5px solid #fff;background:#DDEDE9;
  box-shadow:var(--shadow-sm);flex:none;align-items:flex-end;justify-content:center;}
.avwrap .avin{display:flex;align-items:flex-end;height:122%;}      /* pet art bleeds 122% so it sits in the circle */
.avwrap svg,.avwrap img{height:100%;width:auto;display:block;}
```

### Section head
```css
.shead{display:flex;align-items:center;justify-content:space-between;margin:18px 2px 10px;}
.shead h3{font-size:16px;}
.shead .see{font-size:12.5px;font-weight:700;color:var(--orange);}
```

### Egg banner (repurposed as "Add a habit" CTA)
```css
.eggbanner{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#0C4C60,#12667F);border-radius:var(--r-lg);
  padding:14px 15px;box-shadow:var(--shadow);color:#fff;margin-top:-26px;position:relative;z-index:6;width:100%;text-align:left;}
.eggbanner:active{transform:scale(.99);}
.eggbanner .eb-ic{width:42px;height:42px;flex:none;display:flex;align-items:center;justify-content:center;}
.eggbanner .eb-ic svg{width:34px;height:auto;}
.eggbanner .eb-h{font-weight:800;font-size:14.5px;line-height:1.2;}
.eggbanner .eb-s{font-size:11.5px;color:#BFE3F3;margin-top:3px;line-height:1.4;}
.eggbanner .chev{margin-left:auto;color:#BFE3F3;flex:none;}
```
NOTE: on this screen the element carries inline overrides `margin-top:0` and
`background:linear-gradient(135deg,var(--teal),var(--teal-2))` — so it does NOT overlap upward and it
follows the active theme accent (base = same teal pair).

### Empty state
```css
.empty{text-align:center;padding:34px 20px;color:var(--muted);}
.empty .em-ic{margin-bottom:8px;display:flex;justify-content:center;color:var(--line-2);}
.empty .em-t{font-weight:700;color:var(--teal-ink);font-size:15px;margin-bottom:4px;}
.empty .em-s{font-size:13px;line-height:1.5;}
```

### Habit row
```css
.habit{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:18px;background:#fff;
  box-shadow:var(--shadow-sm);border:1px solid var(--line);margin-bottom:10px;transition:.14s;position:relative;overflow:hidden;}
.habit:active{transform:scale(.99);}
.habit.done{background:#F7FAF9;border-color:#E1EDEF;}
.habit.done .h-name{color:#5D7B84;}
.habit .h-ic{width:42px;height:42px;border-radius:14px;background:var(--cream);border:1px solid var(--line-2);
  display:flex;align-items:center;justify-content:center;flex:none;}
.habit .h-ic svg{width:28px;height:28px;}
.h-main{flex:1;min-width:0;}
.h-name{font-weight:700;font-size:14.5px;color:var(--teal-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.h-sub{display:flex;align-items:center;gap:7px;margin-top:4px;flex-wrap:wrap;}
.h-meta{font-size:11.5px;font-weight:600;color:var(--muted);display:flex;align-items:center;gap:3px;}
.hflame{display:inline-flex;align-items:center;gap:2px;font-size:11.5px;font-weight:800;color:var(--orange-2);}
.hflame svg{width:15px;height:15px;flex:none;}
.hflame.cold{color:#B9B4A6;filter:saturate(.15);}
```
Row is rendered with inline `style="align-items:flex-start"` (top-aligns the icon/actions to the name).

### Schedule tag chip
```css
.tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 9px 3px 8px;
  border-radius:var(--r-pill);letter-spacing:.2px;background:var(--cream);color:#5C6B72;border:1px solid var(--line-2);}
```

### Weekly dots
```css
.wdots{display:flex;gap:4px;margin-top:6px;}
.wdots i{width:15px;height:15px;border-radius:50%;background:var(--cream);border:1.5px solid var(--line-2);display:flex;align-items:center;justify-content:center;}
.wdots i.on{background:var(--good);border-color:var(--good);}
.wdots i.miss{background:#FBE6E0;border-color:#F0C7BC;}
.wdots i.na{opacity:.4;}
.wdots i.today{box-shadow:0 0 0 2px #fff,0 0 0 3.5px var(--orange);}
.wdots span{font-size:8px;font-weight:800;color:#fff;line-height:1;}
```

### Row actions / sort buttons
```css
.hactions{display:flex;gap:6px;flex:none;}                 /* overridden inline to column, gap:5px */
.sortbtn{width:30px;height:30px;border-radius:10px;background:var(--cream);border:1px solid var(--line-2);color:var(--teal);display:flex;align-items:center;justify-content:center;flex:none;}
.sortbtn:active{transform:scale(.92);}
.sortbtn[disabled]{opacity:.35;pointer-events:none;}
```

### Growth note
```css
.growthnote{display:flex;gap:7px;align-items:flex-start;margin-top:14px;padding:11px 12px;border-radius:var(--r-sm);background:var(--cream);color:var(--muted);font-size:11.5px;font-weight:600;line-height:1.45;}
.growthnote svg{flex:none;margin-top:1px;color:var(--orange);}
```

### Buttons
```css
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
Delete-confirm primary button overrides: `background:var(--danger);box-shadow:0 6px 0 #B84C36`.
Editor delete link overrides: `.btn.block.ghost` + `color:var(--danger)`.

### Dialog / sheet chrome
```css
.scrim{position:absolute;inset:0;background:rgba(11,37,48,.5);z-index:60;display:flex;align-items:flex-end;justify-content:center;animation:fade .2s both;}
.scrim.closing{animation:fadeout .24s both;}
.scrim.closing .dialog{animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
.dialog{background:#fff;border-radius:26px 26px 0 0;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;padding:22px 20px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.2);animation:slideup .3s cubic-bezier(.2,.8,.2,1) both;}
.dialog .grip{width:40px;height:5px;border-radius:9px;background:var(--line-2);margin:0 auto 16px;}
.dialog h3{text-align:center;font-size:19px;margin-bottom:4px;}
.dialog .d-sub{text-align:center;color:var(--muted);font-size:13.5px;margin-bottom:16px;line-height:1.5;}
.dialog h3.left,.dialog .d-sub.left{text-align:left;}
.d-actions{display:flex;gap:10px;margin-top:16px;}
```
Animations referenced: `@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`,
`@keyframes fadeout{from{opacity:1}to{opacity:0}}`,
`@keyframes slideup{from{transform:translateY(100%)}to{transform:none}}`,
`@keyframes slidedown{from{transform:none}to{transform:translateY(100%)}}`.

### Property group / labels / value pill
```css
.pgroup{margin-bottom:15px;}
.pglbl{font-size:12px;font-weight:700;color:var(--teal);margin:0 0 8px 2px;display:flex;align-items:center;gap:6px;}
.pgval{margin-left:auto;font-size:11.5px;font-weight:800;color:var(--orange-2);background:var(--tint);border:1px solid #F6DFC4;
  padding:2px 9px;border-radius:var(--r-pill);max-width:52%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hint{display:flex;gap:7px;align-items:center;font-size:11px;font-weight:600;color:var(--muted);margin-top:9px;
  padding:8px 10px;background:var(--cream);border:1px solid var(--line-2);border-radius:10px;line-height:1.35;}
.hint .ic{color:var(--orange);flex:none;}
```

### Text field
```css
.field{width:100%;background:#fff;border:2px solid var(--line);border-radius:var(--r-md);padding:15px 16px;
  font-size:16px;color:var(--ink);font-weight:600;outline:none;transition:.15s;}
.field:focus{border-color:var(--orange);}
.field::placeholder{color:#BDB8AB;font-weight:500;}
```

### Chips grid + chips
```css
.pchips{display:grid;gap:8px;}
.pchips.g3{grid-template-columns:repeat(3,1fr);}
.pchips.g4{grid-template-columns:repeat(4,1fr);}
.pchips.g5{grid-template-columns:repeat(5,1fr);}
.pchips.g7{grid-template-columns:repeat(7,1fr);}
.pchip{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 6px;border-radius:var(--r-sm);background:#fff;border:1.5px solid var(--line-2);font-weight:700;font-size:13px;color:var(--teal-ink);white-space:nowrap;}
.pchip.on{background:var(--tint);border-color:var(--orange);color:var(--orange-2);}
.pchip.sq{padding:9px 0;}
```

### Icon picker
```css
.iconpick{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;}
.iconpick button{aspect-ratio:1;border-radius:13px;background:#fff;border:1.5px solid var(--line-2);display:flex;align-items:center;justify-content:center;padding:5px;}
.iconpick button svg{width:100%;height:100%;}
.iconpick button.on{background:var(--tint);border-color:var(--orange);box-shadow:0 0 0 2px rgba(226,138,75,.16);}
```

### Reminder time controls
```css
.timerow{display:flex;gap:8px;align-items:stretch;}
.timerow .pchip{flex:none;padding:9px 20px;}
.timebtn{flex:1;min-width:0;display:inline-flex;align-items:center;justify-content:center;gap:7px;
  padding:9px 12px;border-radius:var(--r-sm);background:#fff;border:1.5px solid var(--line-2);
  font-weight:700;font-size:13px;color:var(--teal-ink);white-space:nowrap;transition:.14s;}
.timebtn.on{background:var(--tint);border-color:var(--orange);color:var(--orange-2);}
.timebtn.open{border-color:var(--orange);}
.timebtn .ic{opacity:.75;flex:none;}
.timebtn span{font-size:14px;font-weight:800;letter-spacing:.2px;}
.timepop{display:flex;align-items:stretch;justify-content:center;gap:4px;margin-top:8px;padding:7px;
  background:var(--cream);border:1.5px solid var(--line-2);border-radius:var(--r-sm);}
.twheel{position:relative;flex:1;max-width:118px;height:128px;overflow-y:auto;overscroll-behavior:contain;
  scroll-snap-type:y proximity;display:flex;flex-direction:column;gap:4px;padding:1px;
  scrollbar-width:none;-ms-overflow-style:none;
  -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 16%,#000 84%,transparent 100%);
  mask-image:linear-gradient(to bottom,transparent 0,#000 16%,#000 84%,transparent 100%);}
.twheel::-webkit-scrollbar{display:none;}
.twheel .ti{scroll-snap-align:center;flex:none;padding:8px 0;border-radius:var(--r-sm);background:#fff;
  border:1.5px solid var(--line-2);font-weight:700;font-size:13px;color:var(--teal-ink);transition:.12s;}
.twheel .ti.on{background:var(--tint);border-color:var(--orange);color:var(--orange-2);}
.twheel .ti:active{transform:scale(.97);}
.tcolon{display:flex;align-items:center;font-weight:800;font-size:16px;color:#BFB7A5;}
```

### Fade-in wrapper (tab host)
`.fade-in{animation:fade .28s ease both;}` — applied to the tab host on `switchTab`.

---

## 3. DATA / LOGIC (transcribed)

### Header counts
```
live      = S.habits.filter(h=>!h.archived).sort((a,b)=>a.id-b.id)
arch      = S.habits.filter(h=>h.archived)
dueToday  = live.filter(x=>isDue(x,today())).length
.k text   = `${live.length} active · ${dueToday} due today`
coinpill  = money(S.profile.coins)     // money = n => Number(n||0).toLocaleString('en-US')
```

### `isDue(h,d,st)`
```
if h.archived            → false
if h.created && daysBetween(h.created,d) < 0 → false   // not yet created
if h.sched==='daily'     → true
if h.sched==='weekdays'  → (h.days||[]).includes(dow(d))     // dow = getDay(): 0=Sun … 6=Sat
if h.sched==='weekly'    → h.logs[d]==='done' ? true : weekDone(h,d) < (h.perWeek||3)
else true
weekDone: counts h.logs[k]==='done' for k from weekStart(d) up to & including d
```
`weekStart(s)` = Monday of that week: `dstr(dOff(-((getDay()+6)%7), s))`.

### `schedLabel(h)` (drives `.tag` and editor `.pgval`)
```
'daily'    → "Every day"
'weekdays' → sorted days: "1,2,3,4,5"→"Weekdays"; "0,6"→"Weekends"; else days.map(WD[x]).join(', ')
'weekly'   → `${h.perWeek||3}× a week`
WD  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
```

### Weekly dots (`manageRow`) — 7 iterations, `ws = weekStart(d)` (Mon-first)
```
for i in 0..6:
  k       = dstrOff(i, ws)          // i=0 → Monday … i=6 → Sunday
  dueDay  = isDue(h,k)
  st      = h.logs[k]               // 'done' or undefined
  future  = k > d
  cls = !dueDay ? 'na'
      : st==='done' ? 'on'
      : (!future && !st) ? 'miss'
      : 'na'
  if (future && dueDay) cls = ''    // due & upcoming → plain empty dot
  <i class="{cls} {k===d?'today':''}"> {if st==='done'} <span>{WD1[(i+1)%7]}</span> </i>
WD1 = ['S','M','T','W','T','F','S']
```
Meaning: `on`=done (green, shows weekday letter), `miss`=due-but-missed past/today (red),
`na`=not due (dimmed 40%), `''`=due & future (plain cream), `today`=ring on the current day.

### Editor draft object `ed`
On open: `ed = h ? deep-copy(h) : newHabit({id:0,name:'',cat:'custom',sched:'daily',days:[1,2,3,4,5],perWeek:3,remind:''})`.
Extra flags: `ed._new = !h`, `ed._pick = false` (time-picker open?).
`newHabit` defaults: `{id:0,name:'',cat:'custom',sched:'daily',days:[1,2,3,4,5],perWeek:3,remind:'',cur:0,best:0,coins:0,archived:false,created:today(),logs:{},rec:{},void:{}}`.

### Categories (`CATS`, 11 entries — order = icon-picker order)
```
water "Water" | exercise "Exercise" | read "Read" | meditate "Meditate" | run "Move" |
hygiene "Hygiene" | nophone "No phone" | wake "Wake early" | sleep "Sleep" | medicine "Medicine" | custom "Your own"
catOf(id) → matching CATS entry, else last (custom). catArt(id) → ART[id] || ART.custom (inline SVG).
```

### Schedules (`SCHEDULES`)
`[['Daily','daily'],['Weekdays','weekdays'],['X / week','weekly']]` (label, value).

### Reminder time picker
```
HOURS = 24 strings '00'..'23'         (Array {length:24} → String(i).padStart(2,'0'))
MINS  = 12 strings '00','05'..'55'    (Array {length:12} → String(i*5).padStart(2,'0'))
curTime()      = (ed.remind||'08:00').split(':')
edTime(v)      : ed.remind = v||''; if !v → ed._pick=false; refresh
toggleTimePick(): ed._pick=!ed._pick; if opening & no remind → ed.remind='08:00'; refresh
setTimePart(i,v): p=curTime(); p[i]=v; ed.remind=p.join(':'); refresh
Quick chips     : ['07:00','12:00','18:00','21:30']
syncTimeWheels(): after every render, scroll each wheel so its .ti.on is vertically centered
                  (scrollTop = on.offsetTop - clientHeight/2 + on.offsetHeight/2)
```

### `edDay(day)` (weekdays multi-select)
```
i = ed.days.indexOf(day)
if i>=0: if ed.days.length<=1 → toast('Pick at least one day') & return; else remove
else: push day
refresh
```
Weekday chips loop (weekdays sched): `WD1.map((w,i)=> day=(i+1)%7 …)` → labels S,M,T,W,T,F,S mapped to
day values 1,2,3,4,5,6,0. (See NOTES — label/value are offset by one.)

### Save (`saveHabit`)
```
name = ed.name.trim(); if empty → toast('Give it a name first'), focus #edName, return
NEW:  h = newHabit({...ed, id:S.nextId++}); delete _new/_pick; S.habits.push(h);
      rollupDay; closeDialog; save; renderAll; switchTab(S.tab==='habits'?'habits':'today')
      toast(`“${name}” added${isDue(h,today())?", and it's due today":''}`)
EDIT: copy only ['name','cat','sched','days','perWeek','remind'] onto the live habit;
      rollupDay; closeDialog; save; renderAll; toast('Habit updated')
then checkAch()
```

### Premium cap gate (`openEditor` for a NEW habit)
Triggers when `!h && !S.profile.premium && (active-habit count) >= 7`. Free plan cap = **7 active habits**.

### Archive / Delete
```
archiveHabit(id): h.archived = !h.archived; rollupDay; closeDialog; save; renderAll;
   toast archived → `“${name}” archived, history kept`
   toast restored → `“${name}” is back on Today`
deleteHabit(id): opens confirm dialog (§1E). Copy interpolates Object.keys(h.logs).length + h.best.
doDelete(id):    S.habits = S.habits.filter(x=>x.id!==id); rollupDay; closeDialog; save; renderAll; toast('Habit deleted')
```

### Reorder (`moveHabit(id,dir)`)
```
i = index of habit; j = i+dir; bail if i<0||j<0||j>=S.habits.length
swap S.habits[i] ↔ S.habits[j], THEN swap their .id values too (ids drive ordering elsewhere)
save; renderHabits
```
Row up/down disabled states are computed on `li` = index within `live` list.

### Daily goal (`openGoal` / `setGoal`)
```
maxDue = Math.max(1, active-habit count)
opts   = [0].concat(1..Math.min(6,maxDue))            // 0 = "All due", else n = "{n} / day"
now    = S.profile.dailyGoal>0 ? dailyGoal : dueList(today()).length
pgval  = dailyGoal>0 ? `${dailyGoal} / day` : "All due"
hint   = `That is <b>${now||0}</b> habit${now===1?'':'s'} to clear today.`
setGoal(n): S.profile.dailyGoal=n; rollupDay; save;
            clear .on from all #dialogHost .pchip, add .on to clicked chip;
            renderAll; setTimeout(maybeAllClear, 200)
```
`dayGoal(d)` used by rollup: `dailyGoal>0 ? min(dailyGoal, max(1,dueCount)) : dueCount`.
`rollupDay` sets `history[d].ac = (due>0 && done>=goal) ? 1 : 0`.
All-clear bonus (fired if goal met via `maybeAllClear`): `round((15 + min(streak,30)) * (1 + perk.allClear + perk.all))`.

---

## 4. INTERACTIONS (every tap handler)

| Element | Handler | Effect |
|---|---|---|
| `.hi-av` (avatar) | `openProfile()` | opens Profile screen |
| `.eggbanner` "Add a habit" | `openEditor()` | opens editor sheet in NEW mode (or premium-cap dialog if at 7-habit limit) |
| Empty-state `.btn.sm` "Add your first" | `openEditor()` | same as above |
| `.shead .see` (Archived toggle) | `showArchived=!showArchived; renderHabits()` | show/hide archived rows; label flips "Show N" ↔ "Hide" |
| Row `.sortbtn` up | `moveHabit(id,-1)` | swap with previous, swap ids, save, re-render |
| Row `.sortbtn` down | `moveHabit(id,1)` | swap with next, swap ids, save, re-render |
| Row `.sortbtn` edit | `openEditor(id)` | opens editor sheet in EDIT mode |
| Editor `#edName` | `oninput ed.name=this.value` | live-updates draft name (no re-render on keystroke) |
| Editor icon button | `edSet('cat',id)` | `ed.cat=id; refreshEditor()` — updates pgval + selected icon |
| Editor schedule chip | `edSet('sched',v)` | switches schedule; reveals weekdays (g7) or weekly (g5) sub-controls |
| Weekday chip | `edDay(day)` | toggle day in `ed.days` (min 1 enforced with toast) |
| "N×" weekly chip | `edSet('perWeek',n)` | sets target; updates hint copy |
| Reminder "Off" chip | `edTime('')` | clears reminder, closes picker |
| Reminder time button | `toggleTimePick()` | opens/closes wheel picker; defaults 08:00 when first opened |
| Hour `.ti` | `setTimePart(0,hh)` | set hour; picker stays open; wheels re-center |
| Minute `.ti` | `setTimePart(1,mm)` | set minute |
| Quick-time chip | `edTime(t)` | set reminder to 07:00/12:00/18:00/21:30 |
| Editor "Cancel" (new) | `closeDialog()` | dismiss sheet |
| Editor "Archive"/"Restore" (edit) | `archiveHabit(ed.id)` | toggle archived, toast, close |
| Editor "Add habit"/"Save" | `saveHabit()` | validate name → push new or patch existing, toast, re-render |
| Editor "Delete permanently" (edit) | `deleteHabit(ed.id)` | opens delete-confirm dialog |
| Delete dialog "Back" | `closeDialog();openEditor(id)` | returns to editor |
| Delete dialog "Delete" | `doDelete(id)` | remove habit, toast "Habit deleted" |
| Delete dialog "Archive instead" | `archiveHabit(id)` | archive rather than delete |
| Premium-cap "Not now" | `closeDialog()` | dismiss |
| Premium-cap "See HabitHatch+" | `closeDialog();openPremium()` | open premium screen |
| Goal chip | `setGoal(n)` | set daily goal; after 200ms `maybeAllClear()` may fire streak bonus + reward |
| Goal "Done" | `closeDialog()` | dismiss |
| Scrim backdrop | `closeDialog()` (only when target === backdrop) | dismiss sheet |

**Toasts** (`toast(msg)` → `#toast` bubble, `.show` for 2400ms, `.high` when a dialog/reward is open):
`Give it a name first`, `Pick at least one day`, `“{name}” added[, and it's due today]`, `Habit updated`,
`“{name}” archived, history kept`, `“{name}” is back on Today`, `Habit deleted`.

**Reward path**: `setGoal` → `maybeAllClear()`; if the day's goal is now met and unpaid it awards the
all-clear bonus, increments `S.profile.streak`, may advance egg hatch progress (`showReward{title:"Day
complete", sub:"Everything due today is done. Streak is now {streak} days.", coins:bonus, …}`) or trigger
`startHatch()`. This is downstream of the goal sheet, not part of the screen's own chrome.

---

## 5. NOTES (subtleties, conditionals, quirks)

1. **Conditional blocks in the list**
   - The "Add a habit" `.eggbanner` renders **only when `live.length>0`**. With zero active habits the
     empty-state card is shown instead (which has its own "Add your first" button).
   - The Active `.shead` + rows render only when `live.length>0`; otherwise the `.empty` block.
   - The Archived `.shead` renders only when `arch.length>0`; the rows themselves render only while
     `showArchived===true` (module-level `let showArchived=false`, resets to false on full reload).
   - The bottom `.growthnote` renders only when `S.habits.length>0` (any habit, archived or not).

2. **Archived rows** reuse `manageRow` but get `.habit.done` (background `#F7FAF9`, border `#E1EDEF`,
   name color `#5D7B84`). All three sort buttons are `disabled` for archived rows (up: `h.archived`
   truthy; down: `h.archived`; edit is not disabled — edit stays available so you can Restore).

3. **Weekly-dots letter/day quirk**: dots iterate Monday-first (`ws=weekStart`), but the inner letter
   uses `WD1[(i+1)%7]` (Sunday-based array). For i=0 (Monday) it prints `WD1[1]='M'`, i=1→'T'… i=6
   (Sunday)→`WD1[0]='S'`. So the printed letters read M,T,W,T,F,S,S — correct for a Mon-first week.

4. **Weekday PICKER label/value offset (real prototype quirk)**: in the editor the weekday chips are
   built from `WD1.map((w,i)=> day=(i+1)%7)`. The visible letters are S,M,T,W,T,F,S but the toggled day
   values are 1,2,3,4,5,6,0 (Mon…Sun). So the first chip **shows "S"** yet toggles **Monday**. Faithful
   rebuild should reproduce this mapping (chip[0]→day1, chip[6]→day0) unless intentionally fixing it.
   Default new habit has `days:[1,2,3,4,5]` = Mon–Fri selected.

5. **Flame "cold" state**: `.hflame.cold` (grey `#B9B4A6`, `saturate(.15)`) applies when `h.cur<=0`
   (`h.cur>0 ? '' : 'cold'`). The number shown is the current streak `h.cur`.

6. **`h.cur` streak & `h.best`**: streak count comes straight from the habit object (`cur` current,
   `best` all-time). `.h-meta` always prints `best {h.best}`.

7. **Editor re-render model**: every draft change calls `refreshEditor()`, which re-renders the whole
   sheet inner HTML, preserves `scrollTop`, and — if `#edName` was focused — restores focus and caret
   position (`setSelectionRange`). Name input uses `oninput` (no full re-render per keystroke). On open,
   a `setTimeout(160ms)` focuses `#edName` for new habits only.

8. **`.pgval` truncation**: value pill is capped at `max-width:52%` with ellipsis — long schedule labels
   (e.g. custom day lists) clip.

9. **Reminder default**: opening the wheel picker with no existing reminder seeds `08:00`. `curTime()`
   also falls back to `08:00`. Choosing "Off" clears `ed.remind` to `''` and closes the picker.

10. **Time wheels** are masked scroll columns (soft fade top/bottom via `mask-image`), no scrollbar,
    `scroll-snap-type:y proximity`; JS re-centers the selected value after each render.

11. **Premium cap = 7 active habits** for non-premium users; the gate is checked only when creating a
    NEW habit (editing an existing one is always allowed). HabitHatch+ removes the cap.

12. **Theme behavior**: this screen never hardcodes accent hex except the base `.eggbanner` gradient
    (`#0C4C60,#12667F`) — but the instance here overrides it inline to `var(--teal),var(--teal-2)`, so
    it follows the active theme. All selected states (`.pchip.on`, `.iconpick .on`, `.timebtn.on`,
    `.pgval`, `.sortbtn` color, `.shead .see`) resolve through `--orange`/`--orange-2`/`--tint`/`--teal`
    and thus recolor per theme. `--good` drives the green done-dots and also themes.

13. **Sheet lifecycle**: `openDialog(html)` writes `#dialogHost` = `.scrim > .dialog`. `.scrim` fades in
    (`fade .2s`), `.dialog` slides up (`slideup .3s`). `closeDialog()` adds `.closing` (fadeout + slide
    down) then removes the node after 250ms. Backdrop tap closes only if the click target is the scrim
    itself. Editor/goal/delete/premium dialogs all share this chrome; only the goal & editor titles use
    `h3.left` (left-aligned); delete & premium titles are centered.

14. **`renderHabits` target**: output is assigned to `$('tabHabits').innerHTML`. The habits tab host is
    shown by `switchTab('habits')`, which also toggles the bottom-nav `.on` state and applies `.fade-in`.

15. **Curly quotes**: all name interpolations in copy use typographic quotes `“ ”` (U+201C/U+201D), not
    straight quotes — preserve them (added toast, archive toast, delete title).
