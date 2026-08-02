# Build contract — Feed sheet + Habit Garden

Extracted verbatim from `prototype/habithatch_v1.html`.
Scope: `openFeed` / `renderFeed` / `feed` (lines 2748-2794) and `renderGarden` / `plant` / `doPlant` (lines 2799-2903), plus every CSS class they touch (lines 8-965) and every data/helper they reference (lines 1078-1957).

All strings, numbers, colors, and sizes below are copied exactly from source. Do not paraphrase copy or round numbers.

Two distinct surfaces are documented:
- **A. Feed sheet** — a bottom-sheet dialog rendered into `#dialogHost .dialog` (reuses `.scrim`/`.dialog` chrome).
- **B. Habit Garden** — the full-screen `#tabGarden` tab body.

---

## 0. Assets & art keys referenced

Image assets are base64 **WebP data URIs** on the `ASSETS` map. Keys used by these screens:
- `ASSETS.coin`, `ASSETS.lock`
- Food images: `ASSETS.apple`, `ASSETS.chicken`, `ASSETS.pizza`, `ASSETS.melon`, `ASSETS.carrot`
- Species thumbnails (garden hero, img-kind species): `ASSETS.dogthumb`, `ASSETS.catthumb`

Inline-**SVG** art strings live on the `ART` map (rendered as raw markup, not `<img>`). Keys used:
- Egg stages: `ART.eggWhole`, `ART.eggCrack`, `ART.eggHatch`
- Garden plants: `ART.gSprout`, `ART.gTree`, `ART.gOrchard`
- Species SVGs: `ART.fox`, `ART.penguin`, `ART.axolotl`

Icon helper: `ic(name,size=16,cls='')` returns `<svg class="ic {stroke|fill} {cls}" width height viewBox="0 0 24 24">…</svg>`. Icons referenced here: `heart` (fill), `bag` (stroke), `bolt` (fill), `sparkle` (fill), `check` (stroke), `sprout` (stroke), `leaf` (stroke), `shield` (stroke), `trophy` (stroke), `crown` (fill).

---

# A. FEED SHEET

## A1. Visual tree

Entry: `openFeed()` gates, then `renderFeed()` builds HTML and injects it into an existing `.dialog` (or opens a new one via `openDialog`, which wraps it in `.scrim > .dialog`).

```
.scrim  (onclick: if(event.target===this) closeDialog())        ← only when opened fresh via openDialog
└── .dialog
    ├── .grip
    ├── h3                         "Feed {petName}"            (petName HTML-escaped via esc)
    ├── p.d-sub                    "Health {health}/100 · {moodLabel} · check-off bonus +{bonusPct}%"
    │
    ├── ── IF anyFood (any food qty > 0): ──
    │   ├── .feedgrid
    │   │   └── button.fooditem[.empty]   × 5 (one per FOODS entry)   onclick: feed({f.id})
    │   │       ├── span.fq               "×{qty}"     ← only when qty > 0
    │   │       ├── img[src=ASSETS[f.img]]
    │   │       ├── .fn                   "{f.name}"
    │   │       └── .fh                   "+{f.heal}"
    │   └── .healthprev
    │       ├── span                      → ic('heart',15)
    │       ├── .pbar
    │       │   ├── .pnow  [style width:{health}%]
    │       │   └── .padd  [style left:{health}%; width:{add}%]
    │       └── span                      "{health} → {health+add}"
    │
    ├── ── ELSE (pantry empty): ──
    │   └── .empty  [style padding:14px]
    │       ├── .em-ic                    → ic('bag',34)
    │       ├── .em-t                     "The pantry is empty"
    │       └── .em-s                     "Grab a treat from the shop, or just keep your habits, which heals for free."
    │
    └── .d-actions
        ├── button.btn.ghost.block        "Close"        onclick: closeDialog()
        └── button.btn.block              "Buy food"     onclick: closeDialog();openShop('food')
```

Exact template copy (verbatim from `renderFeed`):
- `<h3>Feed ${esc(S.pet.name)}</h3>`
- `<p class="d-sub">Health ${S.pet.health}/100 · ${moodOf(S.pet.health).t} · check-off bonus +${bonusPct()}%</p>`
- Food button: `<button class="fooditem ${qty<=0?'empty':''}" onclick="feed(${f.id})"> ${qty>0?`<span class="fq">×${qty}</span>`:''} <img src="${ASSETS[f.img]}"><div class="fn">${f.name}</div><div class="fh">+${f.heal}</div></button>`
- Health preview right label: `${S.pet.health} → ${S.pet.health+add}`
- Empty title `The pantry is empty`, sub `Grab a treat from the shop, or just keep your habits, which heals for free.`

## A2. Data / logic (Feed)

`FOODS` (id order is render order — 5 tiles):

| id | name | price | heal | premium | img (ASSETS key) |
|----|------|-------|------|---------|------|
| 1 | Apple | 5 | 10 | false | apple |
| 2 | Chicken | 5 | 10 | false | chicken |
| 3 | Pizza | 15 | 20 | true | pizza |
| 4 | Watermelon | 8 | 10 | false | melon |
| 5 | Carrot | 10 | 15 | false | carrot |

Per-tile quantity: `qty = S.pet.food[f.id] || 0`. Initial state `pet.food = {1:1, 2:1, 3:0, 4:0, 5:0}` (starts with 1 Apple + 1 Chicken).

Derived values shown:
- `anyFood = FOODS.some(f => (S.pet.food[f.id]||0) > 0)` — controls grid vs empty state.
- `best = FOODS.filter(qty>0).sort((a,b)=>b.heal-a.heal)[0]` — the highest-heal owned food (drives the preview delta).
- `add = best ? Math.min(best.heal, 100 - S.pet.health) : 0` — preview heal amount (clamped so it never overshoots 100).
- Health preview: `.pnow` width = current `health%`; `.padd` starts at `left:{health}%` and is `width:{add}%` wide; text = `{health} → {health+add}`.

Mood / bonus (`moodOf(h)`, thresholds verbatim):

| health `h` | `t` (label) | `k` (key/class) | `bonus` | `bonusPct()` shown |
|---|---|---|---|---|
| h ≥ 75 | Happy | happy | 0.25 | +25% |
| h ≥ 45 | Content | content | 0.10 | +10% |
| h ≥ 20 | Tired | tired | 0 | +0% |
| else | Hungry | hungry | 0 | +0% |

`bonusPct() = Math.round(moodOf(S.pet.health).bonus * 100)`.

`feed(id)` mutation (verbatim):
```
f = FOODS.find(id); qty = S.pet.food[id]||0
if qty <= 0            → return (no-op)
if S.pet.health >= 100 → toast('Already full'); return
before = bonusPct()
gained = Math.min(f.heal, 100 - S.pet.health)
S.pet.health += gained
S.pet.food[id] = qty - 1
S.stats.mealsFed++
after = bonusPct()
save()
toast( after>before ? `+${gained} health · bonus now +${after}%` : `+${gained} health`, ASSETS[f.img] )
// cheer the background pet:
el = document.querySelector('.petart'); el.classList.remove('cheer'); void el.offsetWidth; el.classList.add('cheer')
if S.pet.health >= 100 → closeDialog()  else → renderFeed()   // re-render sheet in place
renderAll(); checkAch()
```

## A3. Interactions (Feed)

| Trigger | Handler | Effect |
|---|---|---|
| Entry point (elsewhere) | `openFeed()` | Guard 1: if `S.pet.hatchState!=='hatched'` → `toast('Your egg does not eat. Keep habits to warm it.')` and abort. Guard 2: if `S.pet.health>=100` → `` toast(`${S.pet.name} is completely full`) `` and abort. Else `renderFeed()`. |
| Tap food tile | `feed(f.id)` | See A2. Adds `gained` health, decrements that food, fires toast (with food image), plays `.cheer` on `.petart`, re-renders sheet or closes if full. `.fooditem.empty` has `pointer-events:none` so 0-qty tiles are untappable. |
| Tap "Close" | `closeDialog()` | Slides sheet down and removes it. |
| Tap "Buy food" | `closeDialog();openShop('food')` | Closes sheet, opens Shop on the `food` tab. |
| Tap scrim backdrop | `if(event.target===this)closeDialog()` | Only present when opened fresh (not on in-place re-render). |

---

# B. HABIT GARDEN  (`renderGarden` → innerHTML of `#tabGarden`)

## B1. Visual tree

```
(#tabGarden innerHTML)
├── .topbar
│   ├── button.hi-av              → avatarImg(44)   onclick: openProfile()
│   ├── .hello  [style flex:1]
│   │   ├── .k                    "{grown} of {total} plots grown"   (grown=grown.length, total=GARDEN.length=8)
│   │   └── .n                    "Habit Garden"
│   └── span.coinpill
│       ├── img[src=ASSETS.coin]
│       └── (text)                "{money(S.profile.coins)}"
│
├── .gardenhero                                            (212px scenic banner)
│   ├── .gardensun
│   ├── .gardencloud  [style top:34px; width:52px; animation-delay:-4s]
│   ├── .gardencloud  [style top:62px; width:38px; animation-duration:30s; animation-delay:-14s; opacity:.7]
│   ├── .gardenground.g2
│   ├── .gardenground
│   └── .gardenscene
│       └── .gplant[.p0]  [style height:{h}px]  × N     (.p0 = ghosted/next; content = ART[art])
│
└── .pad  [style padding-top:14px]
    ├── .jhero
    │   ├── .jheropet.fit         → hatched: species art (SVG ART[sp.art] or <img ASSETS[sp.img]>)
    │   │                           pre-hatch: hatchProgress>=1 ? ART.eggCrack : ART.eggWhole
    │   └── div [style min-width:0]
    │       ├── .jherolabel       nx ? "The long game" : "Complete"
    │       ├── .jheroh           nx ? "Grow {name-or-companion} a real garden" : "The garden is in full bloom"
    │       └── .jherosub         "Coins from your habits plant permanent perks here. Nothing in the garden ever wilts."
    │
    ├── .jprog
    │   ├── .jprogbar
    │   │   └── .jprogfill  [style width:{pct}%]
    │   └── .jprogmeta
    │       ├── span              "Garden {pct}% grown"
    │       └── span              "{grown.length} / {GARDEN.length}"
    │
    ├── ── IF nx (a next unplanted plot exists): "Next" card ──
    │   .card [style padding:14px 16px; margin-bottom:14px]
    │   ├── .row.spread > div[min-width:0]
    │   │   ├── .jcardh           "Next: {nx.name}"
    │   │   └── .jcards           "{nx.perk} · {remaining>0 ? '{remaining} coins to go' : 'you can afford it now'}"
    │   ├── .jprogbar [style margin-top:11px]
    │   │   └── .jprogfill [style width:{min(100, round(coins/nx.cost*100))}%]
    │   └── button.btn.block[.ghost]  [style margin-top:12px]   onclick: plant('{nx.id}')
    │       ├── img.coinmini[src=ASSETS.coin]
    │       └── (text)  coins>=cost ? "Plant {nx.name} for {money(nx.cost)}" : "{nx.name} needs {money(nx.cost)} coins"
    │
    ├── .shead
    │   ├── h3                    "Plots"
    │   └── span.muted [style font-size:12px; font-weight:700]   "perks are permanent"
    │
    ├── .jrow[.owned|.next|.locked]   × 8 (one per GARDEN plot)
    │   ├── .jic                  owned → .fit[height:34px] ART[g.art] ;  next → ic(g.ic||'sprout',24) ;  locked → <img src=ASSETS.lock>
    │   ├── .jmain
    │   │   ├── .jname            "{g.name}"  + (g.final ? ` <span class="jfinal">goal</span>` : '')
    │   │   ├── .jdesc            "{g.desc}"
    │   │   └── .jperk            ic('bolt',11) + " {g.perk}"
    │   └── (right slot):
    │       owned  → span.jdone            → ic('check',16)
    │       next   → button.jbuild[.off]   onclick: plant('{g.id}')   img.coinmini + "{money(g.cost)}"    (.off when NOT affordable)
    │       locked → span.jlock            img.coinmini + "{money(g.cost)}"
    │
    └── .growthnote               ic('sparkle',13) + " Every perk here is buyable with coins you earn for free. HabitHatch+ only ever adds decoration, never an advantage."
```

Verbatim copy strings:
- `.n` = `Habit Garden`; `.k` = `` `${grown.length} of ${GARDEN.length} plots grown` ``
- `.jherolabel` = `` `${nx?'The long game':'Complete'}` ``
- `.jheroh` = `` `${nx?`Grow ${esc(S.pet.hatchState==='hatched'?(S.pet.name||'your companion'):'your companion')} a real garden`:`The garden is in full bloom`}` ``  → when hatched uses pet name (falls back to `your companion` if name empty); pre-hatch always literal `your companion`.
- `.jherosub` = `Coins from your habits plant permanent perks here. Nothing in the garden ever wilts.`
- `.jprogmeta` spans = `` `Garden ${pct}% grown` `` and `` `${grown.length} / ${GARDEN.length}` ``
- Next card `.jcardh` = `` `Next: ${nx.name}` ``; `.jcards` = `` `${nx.perk} · ${money(Math.max(0,nx.cost-S.profile.coins))>0?`${money(Math.max(0,nx.cost-S.profile.coins))} coins to go`:'you can afford it now'}` ``
- Next button text = `` `${S.profile.coins>=nx.cost?`Plant ${nx.name} for ${money(nx.cost)}`:`${nx.name} needs ${money(nx.cost)} coins`}` ``
- `.shead` right label = `perks are permanent`
- `.jfinal` badge text = `goal`
- `.growthnote` = `Every perk here is buyable with coins you earn for free. HabitHatch+ only ever adds decoration, never an advantage.`

## B2. Data — the 8 garden plots (GARDEN, verbatim, in order)

`money(n)` renders numbers with `toLocaleString('en-US')` (thousands separator: `1,400`, `4,800`).

| # | id | name | desc | cost | perk (shown text) | ic (next-icon) | art (plant SVG) | perk data field |
|---|----|------|------|------|-------------------|-----|-----|-----------------|
| 1 | sprout | First Sprout | Your very first seedling | 120 | +1 coin per check-off | bolt | gSprout | `perCheck:1` |
| 2 | herbs | Herb Patch | Something to snack on | 300 | Idle jar cap +50 | leaf | gSprout | `cap:50` |
| 3 | can | Watering Can | Keeps the whole plot alive | 550 | Health drops 2 slower / day | shield | gSprout | `decay:2` |
| 4 | berry | Berry Bush | Sweet reward for a full day | 900 | +10% coins on all-clear days | heart | gSprout | `allClear:.10` |
| 5 | sapling | Young Sapling | Small tree, big shelter | 1400 | 1 Streak Freeze every week | sprout | gTree | `freeze:true` |
| 6 | flowers | Flower Bed | The garden starts to bloom | 2100 | Jar cap +100 and forage +25% | sparkle | gTree | `cap:100, rate:.25` |
| 7 | fruit | Fruit Tree | Shade, fruit, and a full belly | 3200 | Health drops 2 slower again | trophy | gTree | `decay:2` |
| 8 | orchard | Orchard | The garden, fully grown | 4800 | +20% coins everywhere | crown | gOrchard | `all:.20, final:true` |

Notes on fields:
- `g.final` is `true` only for **orchard** → renders the `goal` badge (`.jfinal`) after its name.
- The `.jperk` row icon is **always** `ic('bolt',11)` (hardcoded), regardless of `g.ic`. `g.ic` is used **only** for the `.jic` when the plot is the next/unlocked one.
- Plant art is shared: plots 1-4 use `gSprout`, plots 5-7 use `gTree`, plot 8 uses `gOrchard`.

## B3. Logic / formulas (Garden)

```
planted(id)   = S.garden.includes(id)              // owned check
nextPlot()    = GARDEN.find(g => !planted(g.id))    // first unplanted plot in order (undefined when all 8 owned)
gardenPct()   = Math.round(S.garden.length / GARDEN.length * 100)
grown         = GARDEN.filter(g => planted(g.id))    // owned plots
```

Per-row derived state in `renderGarden`:
```
owned  = planted(g.id)
isNext = nx && nx.id === g.id
afford = S.profile.coins >= g.cost         // controls .jbuild .off class
```

Next-card progress fill: `width = Math.min(100, Math.round(S.profile.coins / nx.cost * 100))%`.
Next-card "coins to go": `remaining = Math.max(0, nx.cost - S.profile.coins)`.

Cumulative perks (`perks()` sums every planted plot's fields — this is what the perk copy promises):
```
p = {perCheck:0, cap:0, rate:0, decay:0, allClear:0, all:0, freeze:false}
for each planted plot g:
  p.perCheck += g.perCheck||0
  p.cap      += g.cap||0
  p.rate     += g.rate||0
  p.decay    += g.decay||0
  p.allClear += g.allClear||0
  p.all      += g.all||0
  if g.freeze → p.freeze = true
```
Where those perks are consumed (for context, so RN wiring matches the copy):
- `perCheck` → `coinsForCheck`: `extra = p.perCheck + Math.round(core*(moodBonus + p.all))`.
- `cap` → `idleCap() = 50 + perks().cap`.
- `rate` → `idleRate() = 1*(1 + perks().rate)`.
- `decay` → `decayPerDay() = Math.max(6, 12 - perks().decay)`.
- `allClear` → `allClearBonus() = Math.round((15+Math.min(streak,30))*(1 + p.allClear + p.all))`.
- `all` → global multiplier in both `coinsForCheck` and `allClearBonus`.
- `freeze` → weekly Streak Freeze top-up (in `rollover`).

### Garden hero scene stacking (`renderGarden`, verbatim)
```
const grown = GARDEN.filter(g => planted(g.id));
const stack = [];
const H = [74,112,92,132,84];
if (planted('orchard')) stack.push({art:'gOrchard', h:158, ghost:false});
grown.filter(g => g.id !== 'orchard').slice(-4).forEach((g,i) =>
    stack.push({art:g.art, h:H[i % H.length], ghost:false}));
if (nx) stack.push({art:nx.art, h:78, ghost:true});
if (!stack.length) stack.push({art:'gSprout', h:70, ghost:true}, {art:'gTree', h:88, ghost:true});
scene = stack.map(s => `<div class="gplant ${s.ghost?'p0':''}" style="height:${s.h}px">${ART[s.art]}</div>`).join('');
```
Meaning: orchard (if owned) is drawn first at 158px full-color; then up to the last 4 non-orchard owned plots at heights cycling through `[74,112,92,132,84]`; then the next unplanted plot is appended **ghosted** (`.p0`, height 78px). If nothing at all is in the stack (fresh account, `nx` also falsy would only happen when complete — but on a brand new empty garden `nx` exists so this branch is effectively the "no owned + used when stack empty" guard) it shows a ghosted `gSprout` (70px) + `gTree` (88px) preview.

## B4. Interactions (Garden)

| Trigger | Handler | Effect |
|---|---|---|
| Tap avatar (`.hi-av`) | `openProfile()` | `renderProfile(); openScreen('profile')`. |
| Tap "Next" card button / row `.jbuild` | `plant('{id}')` | Opens confirm dialog (see below) **iff** affordable; otherwise toasts shortfall and does nothing. |
| Confirm dialog "Not yet" | `closeDialog()` | Dismiss. |
| Confirm dialog "Plant it" | `doPlant('{id}')` | Executes purchase (see below). |

### `plant(id)` (opens confirm sheet)
```
g = GARDEN.find(id); if (!g || planted(id)) return;                       // guard: unknown/already owned
if (S.profile.coins < g.cost) { toast(`${money(g.cost-S.profile.coins)} more coins to go`); return; }  // not affordable → toast only
openDialog(`
  <div class="grip"></div>
  <div class="fit" style="height:110px;margin-bottom:10px">${ART[g.art]}</div>
  <h3>Plant ${g.name}?</h3>
  <p class="d-sub">${g.desc}</p>
  <div class="d-line"><span class="lbl">Perk</span><span class="val" style="font-size:13px">${g.perk}</span></div>
  <div class="d-line"><span class="lbl">Cost</span><span class="val"><img src="${ASSETS.coin}">${money(g.cost)}</span></div>
  <div class="d-line"><span class="lbl">Your balance</span><span class="val"><img src="${ASSETS.coin}">${money(S.profile.coins)}</span></div>
  <div class="d-actions">
    <button class="btn ghost block" onclick="closeDialog()">Not yet</button>
    <button class="btn block" onclick="doPlant('${g.id}')">Plant it</button>
  </div>`);
```
Confirm-sheet copy: title `` `Plant ${g.name}?` ``, sub = `g.desc`, rows labeled `Perk` / `Cost` / `Your balance`, buttons `Not yet` / `Plant it`.

### `doPlant(id)` (commits the purchase)
```
g = GARDEN.find(id); if (!g || planted(id)) return;
if (S.profile.coins < g.cost) { closeDialog(); toast('Not enough coins'); return; }
spendCoins(g.cost, "garden");            // coins -= cost, S.stats.spent.garden += cost (clamped ≥0)
S.garden.push(id);                        // mark owned
S.gardenLog[id] = today();                // record plant date (local YYYY-MM-DD)
if (g.freeze && S.profile.freezes < 1) {  // sapling grants an immediate freeze if none held
    S.profile.freezes = 1;
    S.profile.freezeWeek = isoWeek(today());
}
closeDialog(); save(); renderAll(); confetti(); bumpCoins();
showReward({
  title: "Planted!",
  sub:   g.name,
  icon:  `<div class="fit" style="height:110px">${ART[g.art]}</div>`,
  note:  `${g.perk}, permanently.`,
  goal:  nextPlot() ? `Next up: ${nextPlot().name} · ${money(nextPlot().cost)} coins` : 'Your garden is complete'
});
checkAch();
```
Reward-overlay copy: title `Planted!`, sub = plot name, note = `` `${g.perk}, permanently.` ``, goal = `` `Next up: {name} · {money(cost)} coins` `` or `Your garden is complete`. `showReward` also always fires `confetti()` internally. Because `doPlant` passes **no `coins` and no `stars`**, the reward's `.rewardbonus` gets the extra `.muted-bonus` class and there is no `.rewardstats` block.

Side effects that fire on plant: `spendCoins` (wallet + spend stat), `S.garden`/`S.gardenLog` mutation, optional freeze grant, `confetti()` (70 pieces), `bumpCoins()` (coin-pill pop animation), `showReward` overlay, `checkAch()` (can unlock `green_thumb` at ≥1 plot and `bloom` at all 8). `renderAll()` re-renders whichever tab is active.

---

# STYLE TABLE  (verbatim CSS declarations)

## Design tokens — `:root` (default "Hatch" theme)
```
--teal:#0C4C60; --teal-2:#12667F; --teal-ink:#0B2530;
--orange:#E28A4B; --orange-2:#C9773A;
--yellow:#FFDA7C; --yellow-2:#F4B942;
--coin-ink:#1E4B5F; --ink:#2D2F41; --muted:#8B897E;
--cream:#FBF6EC; --card:#FFFFFF; --line:#EFE6D6; --line-2:#E4D8C2;
--grass:#A7C34F; --sky:#BFE3F3; --room-bg:#A0B559; --floor:#DCC79A;
--good:#1E7F91; --danger:#E5654B; --pink:#E68FB0;
--tint:#FFF7EF;
--tint-2:var(--tint-2);
--glow:rgba(226,138,75,.5);
--shadow:0 10px 16px rgba(12,76,96,.10);
--shadow-sm:0 4px 12px rgba(12,76,96,.08);
--r-sm:12px; --r-md:16px; --r-lg:20px; --r-pill:999px;
--nav-h:74px;
```
Note: base `:root` sets `--tint-2:var(--tint-2)` (self-referential → effectively unset/`initial` on Hatch, resolving to nothing where used with a `#CFE2E8`-style border pairing; the four premium themes below give it a real value). On Hatch, `.jperk`/`.chip.good`/`.benval.on`/`.jdone` backgrounds use `--tint-2`.

### Theme overrides (each only moves the accent family; only `data-theme` on `<html>` differs)
```
[data-theme="dusk"]{   --teal:#3E2E5E; --teal-2:#5A4487; --teal-ink:#241A38; --coin-ink:#3E2E5E;
  --orange:#D9628F; --orange-2:#BC4E78; --tint:#FDF0F5; --good:#7A5FA8; --sky:#DCD2EF;
  --tint-2:#EDE7F6; --glow:rgba(217,98,143,.5);
  --shadow:0 10px 16px rgba(62,46,94,.12); --shadow-sm:0 4px 12px rgba(62,46,94,.09); }
[data-theme="forest"]{ --teal:#1E4632; --teal-2:#2F6B49; --teal-ink:#132A1F; --coin-ink:#1E4632;
  --orange:#D19A2E; --orange-2:#B07F1E; --tint:#FBF4E3; --good:#3F7D4E; --sky:#CFE4D2;
  --tint-2:#E3EFE4; --glow:rgba(209,154,46,.5);
  --shadow:0 10px 16px rgba(30,70,50,.12); --shadow-sm:0 4px 12px rgba(30,70,50,.09); }
[data-theme="ocean"]{  --teal:#123A5C; --teal-2:#1D5A82; --teal-ink:#0B2135; --coin-ink:#123A5C;
  --orange:#2FA0AE; --orange-2:#238795; --tint:#E9F6F7; --good:#2E8FA8; --sky:#CDE9F3;
  --tint-2:#E1F0F3; --glow:rgba(47,160,174,.5);
  --shadow:0 10px 16px rgba(18,58,92,.12); --shadow-sm:0 4px 12px rgba(18,58,92,.09); }
[data-theme="ember"]{  --teal:#4A2A20; --teal-2:#6E4032; --teal-ink:#2C1710; --coin-ink:#4A2A20;
  --orange:#DE5B39; --orange-2:#BE452A; --tint:#FDEFEA; --good:#A8623F; --sky:#F1D9CC;
  --tint-2:#F5E5DC; --glow:rgba(222,91,57,.5);
  --shadow:0 10px 16px rgba(74,42,32,.12); --shadow-sm:0 4px 12px rgba(74,42,32,.09); }
```

## Shared chrome / generic
```
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
img{display:block;}
.row{display:flex;align-items:center;}
.spread{justify-content:space-between;}
.muted{color:var(--muted);}
h1,h2,h3,h4{margin:0;font-weight:700;color:var(--teal-ink);}

.pad{padding:16px 16px calc(var(--nav-h) + 20px);}

.coinpill{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1.5px solid var(--line-2);
  padding:6px 12px 6px 7px;border-radius:var(--r-pill);font-weight:700;color:var(--coin-ink);box-shadow:var(--shadow-sm);}
.coinpill img{width:22px;height:22px}
.coinpill.bump{animation:bump .5s ease;}
@keyframes bump{0%,100%{transform:none}30%{transform:scale(1.16)}}
.coinmini{width:16px;height:16px;vertical-align:-3px;margin-right:5px;}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;
  box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;}
.btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);}
.btn.ghost{background:#fff;color:var(--teal);box-shadow:0 0 0 1.5px var(--line-2) inset;font-weight:600;}
.btn.ghost:active{transform:translateY(2px);}
.btn.block{display:flex;width:100%;}
.btn[disabled]{opacity:.5;box-shadow:none;pointer-events:none;filter:saturate(.6);}

.card{background:var(--card);border-radius:var(--r-lg);box-shadow:var(--shadow);border:1px solid var(--line);}

.ic{display:inline-block;vertical-align:middle;flex:none;}
.ic.stroke{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ic.fill{fill:currentColor;stroke:none;}

.fit{display:flex;align-items:flex-end;justify-content:center;}
.fit>svg{height:100%;width:auto;display:block;}
.fit>img{height:100%;width:auto;object-fit:contain;display:block;}

.shead{display:flex;align-items:center;justify-content:space-between;margin:18px 2px 10px;}
.shead h3{font-size:16px;}

.growthnote{display:flex;gap:7px;align-items:flex-start;margin-top:14px;padding:11px 12px;border-radius:var(--r-sm);
  background:var(--cream);color:var(--muted);font-size:11.5px;font-weight:600;line-height:1.45;}
.growthnote svg{flex:none;margin-top:1px;color:var(--orange);}
```

## Top bar (garden header)
```
.topbar{padding:max(20px, calc(12px + env(safe-area-inset-top))) 16px 8px;display:flex;align-items:center;
  justify-content:space-between;gap:10px;}
.hello .k{font-size:12px;color:var(--muted);font-weight:600;line-height:1;}
.hello .n{font-size:20px;font-weight:800;color:var(--teal-ink);line-height:1.15;}
.hi-av{flex:none;}
.hi-av img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2.5px solid #fff;background:#DDEDE9;box-shadow:var(--shadow-sm);}
.hi-av:active{transform:scale(.94);}
```
Avatar art wrapper (`avatarImg` → `.avwrap > .avin`):
```
.avwrap{display:inline-flex;border-radius:50%;overflow:hidden;border:2.5px solid #fff;background:#DDEDE9;
  box-shadow:var(--shadow-sm);flex:none;align-items:flex-end;justify-content:center;}
.avwrap .avin{display:flex;align-items:flex-end;height:122%;}
.avwrap svg,.avwrap img{height:100%;width:auto;display:block;}
```

## Garden scenic banner
```
.gardenhero{position:relative;height:212px;overflow:hidden;
  background:linear-gradient(180deg,#CFEAF6 0%,#E4F2E0 62%,#DCE9C4 100%);}
.gardenground{position:absolute;left:-6%;right:-6%;bottom:-30px;height:104px;border-radius:50% 50% 0 0;background:#C6DA8E;}
.gardenground.g2{bottom:-42px;height:112px;background:#B9D07C;left:-18%;right:-18%;}
.gardenscene{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding-bottom:20px;z-index:2;}
.gardenscene .gplant{transition:.4s;transform-origin:50% 100%;margin:0 -12px;display:flex;align-items:flex-end;}
.gardenscene .gplant>svg{height:100%;width:auto;display:block;}
.gardenscene .gplant.p0{opacity:.3;filter:grayscale(.85);}
.gardensun{position:absolute;top:16px;right:28px;width:40px;height:40px;border-radius:50%;background:var(--yellow);
  box-shadow:0 0 0 12px rgba(255,218,124,.28);animation:sunpulse 4s ease-in-out infinite;}
@keyframes sunpulse{0%,100%{box-shadow:0 0 0 12px rgba(255,218,124,.24)}50%{box-shadow:0 0 0 18px rgba(255,218,124,.16)}}
.gardencloud{position:absolute;background:rgba(255,255,255,.85);border-radius:var(--r-pill);height:16px;
  animation:drift 22s linear infinite;}
@keyframes drift{from{transform:translateX(-120px)}to{transform:translateX(460px)}}
```
(Inline overrides: cloud #1 `top:34px;width:52px;animation-delay:-4s`; cloud #2 `top:62px;width:38px;animation-duration:30s;animation-delay:-14s;opacity:.7`. `.gplant` heights set inline per scene item.)

## Garden hero card + progress
```
.jhero{display:flex;gap:13px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);
  padding:14px;box-shadow:var(--shadow);}
.jheropet{width:76px;height:76px;flex:none;border-radius:var(--r-md);background:#EDF3E4;
  display:flex;align-items:flex-end;justify-content:center;overflow:hidden;}
.jheropet svg{height:74px;width:auto;}
.jherolabel{font-size:10.5px;font-weight:800;color:var(--orange);text-transform:uppercase;letter-spacing:.4px;}
.jheroh{font-weight:800;font-size:15px;color:var(--teal-ink);margin-top:2px;}
.jherosub{font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.45;margin-top:3px;}
.jprog{margin:16px 0 12px;}
.jprogbar{height:8px;border-radius:9px;background:#EFE7D6;overflow:hidden;display:block;}
.jprogfill{height:100%;border-radius:9px;background:linear-gradient(90deg,var(--grass),#C2DA75);display:block;transition:width .5s;}
.jprogmeta{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--muted);margin-top:7px;}
```

## Next-plot card
```
.jcardh{font-weight:800;color:var(--teal-ink);font-size:14.5px;}
.jcards{font-size:11.5px;color:var(--muted);font-weight:600;margin-top:2px;line-height:1.35;}
```
(Card is `.card` with inline `padding:14px 16px;margin-bottom:14px`; inner progress bar reuses `.jprogbar`/`.jprogfill` with inline `margin-top:11px`; CTA is `.btn.block` [+`.ghost` when unaffordable] with inline `margin-top:12px`.)

## Plot rows
```
.jrow{display:flex;align-items:center;gap:12px;padding:13px;border-radius:18px;background:#fff;border:1px solid var(--line);
  box-shadow:var(--shadow-sm);margin-bottom:10px;}
.jrow.locked{opacity:.62;}
.jrow.next{border-color:#F0D9BC;box-shadow:0 6px 16px rgba(226,138,75,.15);}
.jic{width:44px;height:44px;border-radius:14px;background:var(--cream);border:1px solid var(--line-2);
  display:flex;align-items:center;justify-content:center;flex:none;color:var(--teal);overflow:hidden;}
.jrow.owned .jic{background:#EDF3E4;border-color:#D6E3BC;color:#6E8C31;}
.jic svg{width:30px;height:30px;}
.jic img{width:22px;height:22px;object-fit:contain;opacity:.75;}
.jmain{flex:1;min-width:0;}
.jname{font-weight:700;font-size:14px;color:var(--teal-ink);}
.jfinal{font-size:9.5px;font-weight:800;background:var(--yellow);color:#7A4B00;padding:1px 6px;border-radius:var(--r-pill);
  vertical-align:2px;margin-left:4px;}
.jdesc{font-size:11.5px;color:var(--muted);font-weight:500;line-height:1.35;margin-top:2px;}
.jperk{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--good);background:var(--tint-2);
  border:1px solid #CFE2E8;padding:3px 8px;border-radius:var(--r-pill);margin-top:6px;}
.jdone{width:32px;height:32px;border-radius:50%;background:var(--tint-2);color:var(--good);
  display:flex;align-items:center;justify-content:center;flex:none;}
.jbuild{display:flex;align-items:center;gap:2px;background:var(--orange);color:#fff;font-weight:800;font-size:13px;
  padding:9px 13px;border-radius:var(--r-sm);box-shadow:0 4px 0 var(--orange-2);flex:none;}
.jbuild:active{transform:translateY(2px);box-shadow:0 2px 0 var(--orange-2);}
.jbuild.off{background:#EDE6D8;color:#A8A08E;box-shadow:none;}
.jlock{display:flex;align-items:center;gap:2px;font-weight:800;font-size:12.5px;color:var(--muted);flex:none;}
```
(Note `.jic img` — the lock — sets `width:22px` explicitly, overriding the 30px svg rule; `.jic` for owned uses `.fit` with inline `height:34px` so the plant SVG scales to 34px tall.)

## Feed sheet — dialog chrome + food grid + preview
```
.scrim{position:absolute;inset:0;background:rgba(11,37,48,.5);z-index:60;display:flex;align-items:flex-end;
  justify-content:center;animation:fade .2s both;}
.scrim.closing{animation:fadeout .24s both;}
.scrim.closing .dialog{animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
.dialog{background:#fff;border-radius:26px 26px 0 0;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;
  padding:22px 20px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.2);
  animation:slideup .3s cubic-bezier(.2,.8,.2,1) both;}
.dialog .grip{width:40px;height:5px;border-radius:9px;background:var(--line-2);margin:0 auto 16px;}
.dialog h3{text-align:center;font-size:19px;margin-bottom:4px;}
.dialog .d-sub{text-align:center;color:var(--muted);font-size:13.5px;margin-bottom:16px;line-height:1.5;}
.d-line{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-top:1px solid var(--line);font-size:14px;}
.d-line .lbl{color:var(--muted);font-weight:600;}
.d-line .val{font-weight:800;color:var(--teal-ink);display:flex;align-items:center;gap:5px;}
.d-line .val img{width:18px;height:18px}
.d-actions{display:flex;gap:10px;margin-top:16px;}

.feedgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:6px;}
.fooditem{background:var(--cream);border-radius:var(--r-md);padding:10px 6px;text-align:center;border:2px solid var(--line);position:relative;}
.fooditem:active{transform:scale(.96);}
.fooditem img{width:46px;height:46px;object-fit:contain;margin:0 auto 4px;}
.fooditem .fn{font-size:11px;font-weight:700;color:var(--teal-ink);}
.fooditem .fh{font-size:10.5px;font-weight:700;color:var(--good);}
.fooditem .fq{position:absolute;top:4px;right:4px;background:#fff;border:1px solid var(--line-2);font-size:10px;
  font-weight:800;color:var(--teal);padding:1px 6px;border-radius:var(--r-pill);}
.fooditem.empty{opacity:.4;pointer-events:none;}
.healthprev{display:flex;align-items:center;gap:8px;background:var(--cream);border:1px solid var(--line-2);border-radius:var(--r-sm);
  padding:10px 12px;margin-top:12px;font-size:12px;font-weight:700;color:var(--teal-ink);}
.healthprev .pbar{flex:1;height:10px;border-radius:9px;background:#EFE7D6;overflow:hidden;position:relative;}
.healthprev .pnow{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--yellow-2),var(--yellow));border-radius:9px;}
.healthprev .padd{position:absolute;top:0;bottom:0;
  background:repeating-linear-gradient(45deg,#A7C34F,#A7C34F 4px,#BBD16A 4px,#BBD16A 8px);opacity:.85;}
```

## Empty state (empty pantry)
```
.empty{text-align:center;padding:34px 20px;color:var(--muted);}
.empty .em-ic{margin-bottom:8px;display:flex;justify-content:center;color:var(--line-2);}
.empty .em-t{font-weight:700;color:var(--teal-ink);font-size:15px;margin-bottom:4px;}
.empty .em-s{font-size:13px;line-height:1.5;}
```
(In the feed template `.empty` carries an inline `padding:14px` that overrides the `34px 20px` above.)

## Reward overlay + confetti (fired by `doPlant` → `showReward`/`confetti`)
```
.rewardcard{background:#fff;border-radius:26px;padding:26px 22px;text-align:center;width:100%;max-width:330px;
  box-shadow:0 20px 60px rgba(0,0,0,.3);animation:pop .45s cubic-bezier(.2,1.3,.4,1) both;max-height:88vh;overflow-y:auto;}
.rewardcard .burst{display:flex;justify-content:center;margin-bottom:2px;animation:spinin 1.2s ease;}
@keyframes spinin{from{transform:rotate(-20deg) scale(.5)}to{transform:none}}
.rewardcard h2{font-size:23px;margin:6px 0 3px;}
.rewardcard p{color:var(--muted);font-size:14px;margin:0 0 18px;line-height:1.45;}
.rewardbonus{display:inline-flex;align-items:center;gap:6px;background:#FFF4E7;border:1px solid #F6DFC4;color:var(--orange-2);
  font-weight:700;font-size:12.5px;padding:8px 13px;border-radius:var(--r-sm);line-height:1.3;}
.rewardbonus.muted-bonus{background:var(--cream);border-color:var(--line-2);color:var(--muted);font-weight:600;}
.rewardgoal{font-size:11.5px;color:var(--muted);font-weight:700;margin-top:12px;}
#reward{position:absolute;inset:0;z-index:70;background:rgba(11,37,48,.55);display:none;align-items:center;justify-content:center;padding:24px;}
#reward.show{display:flex;animation:fade .25s both;}
#confetti{position:absolute;inset:0;pointer-events:none;z-index:75;overflow:hidden;}
.conf{position:absolute;width:9px;height:14px;top:-20px;border-radius:2px;animation:fall linear forwards;}
@keyframes fall{to{transform:translateY(960px) rotate(720deg);opacity:.3}}
```

## Toast (all these screens use it)
```
#toast{position:absolute;left:50%;bottom:calc(var(--nav-h) + 26px + env(safe-area-inset-bottom));
  transform:translateX(-50%) translateY(20px);background:rgba(11,37,48,.95);color:#fff;font-weight:600;font-size:13.5px;
  padding:11px 16px;border-radius:var(--r-md);display:flex;align-items:center;gap:8px;z-index:80;opacity:0;transition:.25s;
  pointer-events:none;max-width:86%;text-align:left;line-height:1.35;}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
#toast.high{bottom:auto;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%) translateY(-20px);}
#toast.high.show{transform:translateX(-50%) translateY(0);}
#toast img{width:20px;height:20px}
```
(`toast()` adds `.high` when a `.scrim` sheet or the reward overlay is open, so the feed/confirm toasts appear at the top.)

## Background pet "cheer" (fired by `feed()` on the room's `.petart`)
```
.petart{position:relative;height:100%;display:flex;align-items:flex-end;justify-content:center;
  filter:drop-shadow(0 12px 10px rgba(0,0,0,.14));animation:breathe 3.4s ease-in-out infinite;transform-origin:50% 100%;}
@keyframes breathe{0%,100%{transform:translateY(0) scaleY(1) scaleX(1)}50%{transform:translateY(-5px) scaleY(1.028) scaleX(.988)}}
.petart.cheer{animation:cheer .8s cubic-bezier(.2,1.4,.4,1) 2;}
@keyframes cheer{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-16px) rotate(-5deg)}60%{transform:translateY(-4px) rotate(4deg)}}
```

## Shared keyframes referenced by dialog / overlay
```
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes fadeout{from{opacity:1}to{opacity:0}}
@keyframes slideup{from{transform:translateY(100%)}to{transform:none}}
@keyframes slidedown{from{transform:none}to{transform:translateY(100%)}}
@keyframes pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
```

## Reduced motion
```
@media (prefers-reduced-motion: reduce){
  .petart,.eggart,.gardensun,.gardencloud,.pilecoin img{animation:none!important;}
}
```
Additionally `confetti()` and `coinFly()` early-return entirely when `prefers-reduced-motion: reduce` matches.

---

# NOTES (subtle behaviors, states, gotchas)

1. **Feed is hatch-gated (pre-hatch vs post-hatch).** `openFeed` refuses to open the sheet while `hatchState !== 'hatched'` (toast: `Your egg does not eat. Keep habits to warm it.`), and refuses when already at 100 health (toast: `` `${name} is completely full` ``). The sheet only ever appears for a hatched, non-full pet.

2. **Two feed layouts.** With any owned food → 3-column `.feedgrid` + `.healthprev` bar. With an empty pantry (`anyFood===false`) → `.empty` block titled **"The pantry is empty"**. The "Buy food" / "Close" action row shows in both cases.

3. **In-place re-render of the sheet.** `renderFeed` looks for an existing `#dialogHost .dialog`; if present it swaps `innerHTML` (no re-animate), else it calls `openDialog` (fresh slide-up + scrim). After each `feed()` the sheet re-renders in place unless health hit 100, in which case it closes.

4. **0-qty food tiles are inert.** They get class `.empty` (opacity .4, `pointer-events:none`) and `feed()` also guards `if(qty<=0) return`.

5. **Health/heal clamping.** Heal preview and applied heal both use `Math.min(heal, 100 - health)` — never overshoot 100. The preview delta (`add`) is driven by the single **highest-heal owned** food, which may differ from whichever tile the user actually taps.

6. **Bonus toast is conditional.** `feed()` shows `` `+${gained} health · bonus now +${after}%` `` only when eating pushed the mood into a higher bonus tier (`after > before`); otherwise just `` `+${gained} health` ``. Mood tiers cross at health 20/45/75.

7. **Garden hero adapts to hatch state.** `.jheropet` shows the live species art when hatched (SVG for fox/penguin/axolotl, `<img>` for dog/cat), else the egg: `ART.eggCrack` if `hatchProgress>=1` else `ART.eggWhole`. The hero heading uses the pet's name only when hatched (fallback `your companion` if name blank); pre-hatch it's always `your companion`.

8. **Complete-garden variant.** When every plot is owned, `nextPlot()` is `undefined`, so: the "Next" card is omitted entirely; `.jherolabel` = **"Complete"**, `.jheroh` = **"The garden is in full bloom"**; the plant confirm/reward goal reads **"Your garden is complete"**. Every row renders as `.owned` with a `.jdone` check.

9. **Row tri-state.** Exactly one plot at a time is `isNext` (the first unowned). Owned rows → `.owned` + check chip. The single next row → `.next` (peach border/glow) + `.jbuild` button (greyed `.off` when unaffordable but still tappable — `plant()` re-checks and just toasts the shortfall). All later rows → `.locked` (opacity .62) + non-interactive `.jlock` price.

10. **Perk-row icon is hardcoded.** `.jperk` always uses `ic('bolt',11)`; the per-plot `g.ic` (leaf/shield/heart/…) only appears as the `.jic` glyph while that plot is the next one. Locked rows show the lock image; owned rows show the plant SVG at 34px.

11. **Affordability copy bug (transcribe as-is).** The next-card subtitle test is `money(Math.max(0,nx.cost-S.profile.coins)) > 0`. `money()` returns a comma-grouped **string**; for gaps ≥ 1000 (`"1,400"`) the numeric coercion is `NaN`, so `NaN > 0` is false and the subtitle wrongly reads **"you can afford it now"** even though the CTA button (which compares numbers, `coins >= cost`) correctly says "needs …". Only affects plots whose remaining-cost is ≥ 1000. Preserve or fix deliberately per product call.

12. **Scene stack is capped & ordered.** Orchard (if owned) draws first at 158px; then only the **last 4** non-orchard owned plots (heights cycle `[74,112,92,132,84]`); then the next plot appended **ghosted** (`.p0`: opacity .3 + `grayscale(.85)`, 78px). Empty fresh garden falls back to ghosted `gSprout`(70px)+`gTree`(88px). Plants overlap via `margin:0 -12px`.

13. **Plant is a two-step commit.** `plant()` opens a confirm sheet **only if affordable** (else toast `` `${money(shortfall)} more coins to go` ``). `doPlant()` re-guards, spends, pushes to `S.garden`, stamps `S.gardenLog[id]=today()`, and — for the sapling (`freeze:true`) — grants 1 Streak Freeze immediately if the user holds none (`freezes=1`, `freezeWeek=isoWeek(today())`). Then: `save → renderAll → confetti → bumpCoins → showReward → checkAch`.

14. **Reward card variant on plant.** `doPlant`'s `showReward` passes no `coins`/`stars`, so there is no `.rewardstats` row and the note chip gets `.muted-bonus` (cream, muted). Note text is `` `${g.perk}, permanently.` ``. `showReward` fires `confetti()` again internally (so a plant fires confetti twice: once from `doPlant`, once inside `showReward`).

15. **Achievements can chain off a plant.** `checkAch()` after `doPlant` can unlock `green_thumb` (first plot, `S.garden.length>=1`) and `bloom` (`S.garden.length >= GARDEN.length`, i.e. all 8), which queue their own reward overlays after the plant reward closes.

16. **Theme behavior.** Only the accent family moves. `<html data-theme>` is set by `applyTheme()` from `S.profile.theme` (removed entirely for the free `hatch` theme). All garden/feed colors here are token-driven (`--orange`, `--good`, `--tint`, `--tint-2`, `--teal-ink`, shadows), so they recolor automatically per theme — paper/card/art stay put. The 5 themes: `hatch` (free), `dusk`/`forest`/`ocean`/`ember` (premium). Base `:root` leaves `--tint-2` self-referential (unset) on Hatch; the four premium themes define it.

17. **Money formatting.** All coin figures render via `money(n) = Number(n||0).toLocaleString('en-US')` → thousands separators (e.g. `1,400`, `2,100`, `4,800`).

18. **`renderGarden` writes the whole tab.** It sets `$('tabGarden').innerHTML` wholesale each call; `renderAll()` invokes it only when `S.tab==='garden'`. The `#tabGarden` host itself is toggled `display:block/none` by `switchTab`.
