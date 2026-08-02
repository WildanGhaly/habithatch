# Proto Spec — Nursery / Hatch Overlay (`renderHatch` flow)

Build contract for the signature **egg → crack → hatch → star burst → name-your-pet**
moment. Extracted verbatim from `prototype/habithatch_v1.html`.

Source lines: overlay markup `1066-1068`; logic `3030-3119`; CSS `760-788` (nursery),
`734-758` (toast/reward/confetti), `115-128 / 118-125` (screen stack), `241-244` (input),
`149-160` (buttons); data/helpers `1082-1226`, `1291-1307`, `1801-1815`, `4161-4209`.

This screen is `#nursery`, a full-screen `.screen.overlay` (z-index 40 base, `#nursery`
raises it to **72**). It is NOT re-rendered by `renderAll()`; its inner HTML is imperatively
swapped by `renderHatch()` (pre-hatch steps) and `doHatch()` (reveal). There are **two
distinct visual states** inside the same overlay plus a **follow-on reward modal** (`#reward`).

---

## 0. FLOW OVERVIEW / TIMELINE

Entry: `startHatch()` (lines 3034-3043). Reached from the home egg banner
(`renderEggBanner`, line 2219 — `onclick="…startHatch()"` when `hatchProgress>=3`) or the
pet-room "It's time. Hatch it" button (line 2714). Also auto-fired 400 ms after the 3rd
all-clear day is logged (line 1676: `setTimeout(()=>startHatch(), 400)`).

```
startHatch()                      guard: returns immediately if hatchState==='hatched'
  hatchStep = 0
  clear all pending hatchTimers
  openScreen('nursery')           adds .active .slide-up  (0.32s slide-up from bottom)
  nursSkip.style.display='block'  "Skip" button visible top-right
  renderHatch()                   → STATE A, step 0

  t = 1500ms : hatchStep=1; renderHatch()   → STATE A, step 1 (egg starts shaking + cracks)
  t = 3400ms : hatchStep=2; renderHatch()   → STATE A, step 2 (glow on + burst pop)
  t = 5300ms : hatchStep=3; doHatch()       → STATE B (reveal + name input)
```

`hatchSkip()` (line 3044, bound to the Skip button): clears all timers, sets
`hatchStep=3`, calls `doHatch()` immediately — jumps straight to STATE B.

Module-scope state: `let hatchStep=0, hatchTimers=[];` (line 3033).

---

## 1. VISUAL TREE

### Overlay shell (static markup, lines 1066-1068)
```
section.screen.overlay#nursery                       [z-index 72; radial teal bg]
├── button.nursskip#nursSkip   onclick=hatchSkip()   text: "Skip"
└── div.nurs#nursBody                                 ← innerHTML swapped by JS
```

### STATE A — pre-hatch stepping (`renderHatch`, lines 3052-3058)
`hatchStep` ∈ {0,1,2}. Classes toggled by threshold.
```
div.nurs#nursBody
├── div.nursstage
│   ├── div.nursglow  [+ "on" when hatchStep>=2]
│   ├── div.starburst#nursStars          ← 14 <i> stars, but NO ".go" here so opacity:0 (invisible)
│   │   └── i × 14   style="--sx:_px;--sy:_px;animation-delay:_s"  → inline SVG star art
│   └── div.nursegg  [+ "shake" when hatchStep>=1] [+ "burstout" when hatchStep>=2]
│       └── {ART.eggWhole | ART.eggCrack}            ← inline egg SVG (see §3)
└── div.nurstxt
    ├── h2   text = copy.h  (per-step, see §3)
    └── p    text = copy.p  (per-step, see §3)
```
Art per step: step 0 → `ART.eggWhole`; step 1 → `ART.eggCrack`; step 2 → `ART.eggCrack`
(step 2 reuses the cracked egg, adds the burst-pop animation).

### STATE B — hatched reveal + name input (`doHatch`, lines 3078-3092)
Skip button hidden (`nursSkip.style.display='none'`).
```
div.nurs#nursBody
├── div.nursstage
│   ├── div.nursglow.on                              ← always on, pulsing gold
│   ├── div.starburst.go                             ← ".go" ⇒ 14 stars fly outward (starfly)
│   │   └── i × 14  (same --sx/--sy/delay formula)   → inline SVG star art
│   └── div.nurspet                                  ← reveal-scale-in animation
│       └── {inline species SVG  |  <img src=ASSETS[img] style="height:230px">}
├── div.nurstxt
│   ├── h2   text: "It's a {species.name.toLowerCase()}!"      e.g. "It's a fox!"
│   └── p    text: "Born from a three day streak.<br>What should we call {her|them}?"
│            └── pronoun = "her" if species is Fox or Cat, else "them"
└── div.nursfoot
    ├── input.field#hatchName  maxlength=16  placeholder="e.g. Pip"
    │        style="text-align:center;font-size:17px"  oninput=hatchNameLive(this.value)
    ├── button.btn.block  style="margin-top:12px"  onclick=finishHatch()   text: "That's the one"
    └── div  style="text-align:center;margin-top:10px"
        └── button  style="color:#8FC0CC;font-size:12.5px;font-weight:700"  onclick=surpriseName()
                 content: {sparkle icon @13px} + " Surprise me"
```
`confetti()` is called **twice** on entering STATE B. Input is auto-focused after 500 ms.

### FOLLOW-ON — reward modal (`showReward`, fires from `finishHatch` after nursery closes)
Separate global overlay `#reward` (z-index 70). Built by `showReward(o)` lines 4185-4202.
```
div#reward.show
└── div.rewardcard
    ├── div.burst                                    ← spinin animation
    │   └── div.fit  style="height:120px"  → species SVG or <img>
    ├── h2   text: "Meet {name}"                     (name HTML-escaped via esc())
    ├── p    text: "Your {species.name.toLowerCase()} is home."
    ├── div.rewardbonus.muted-bonus                  (no coins ⇒ muted variant)
    │        text: "{name} starts at full health. Keep your habits and it stays that way.
    │               Miss a day and it just gets a little hungry."
    ├── div.rewardgoal  text: "Growth stage: Baby · reach a 7 day streak for Young"
    └── button.btn.block  style="margin-top:16px"  onclick=closeReward()  text: "Continue"
```
Note: this reward has **no** `coins`, `right`, or `stars`, so `.rewardstats` and the star
row are NOT rendered. `showReward` also calls `confetti()` internally (a 3rd burst).

---

## 2. STYLE TABLE (verbatim declarations)

### CSS custom properties used (default `hatch` theme, `:root` lines 9-24)
| var | value |
|---|---|
| `--orange` | `#E28A4B` |
| `--orange-2` | `#C9773A` |
| `--cream` | `#FBF6EC` |
| `--line` | `#EFE6D6` |
| `--line-2` | `#E4D8C2` |
| `--ink` | `#2D2F41` |
| `--muted` | `#8B897E` |
| `--teal-ink` | `#0B2530` |
| `--r-sm` | `12px` · `--r-md` `16px` · `--r-lg` `20px` · `--r-pill` `999px` |
| `--nav-h` | `74px` |
| `--shadow-sm` | `0 4px 12px rgba(12,76,96,.08)` |

Themes (`dusk`/`forest`/`ocean`/`ember`, lines 28-55) only re-point the accent family
(`--orange`, `--orange-2`, etc.). See §5 for what that affects on this screen.

### Nursery classes (lines 760-788)
| selector | declarations |
|---|---|
| `#nursery` | `background:radial-gradient(circle at 50% 38%, #16657D 0%, #0C4C60 55%, #08394A 100%);z-index:72;` |
| `.nurs` | `flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:26px 24px calc(26px + env(safe-area-inset-bottom));position:relative;` |
| `.nursstage` | `position:relative;width:250px;height:280px;display:flex;align-items:center;justify-content:center;` |
| `.nursegg` | `height:250px;z-index:3;position:relative;` |
| `.nursegg svg` | `height:100%;width:auto;display:block;filter:drop-shadow(0 16px 20px rgba(0,0,0,.35));` |
| `.nursegg.shake` | `animation:eggshake .42s ease-in-out 3;` |
| `.nursegg.burstout` | `animation:eggburst .5s cubic-bezier(.2,1.5,.4,1) both;` |
| `.nurspet` | `height:230px;z-index:3;position:relative;animation:revealpet .8s cubic-bezier(.2,1.4,.4,1) both;` |
| `.nurspet svg` | `height:100%;width:auto;display:block;filter:drop-shadow(0 16px 20px rgba(0,0,0,.35));` |
| `.starburst` | `position:absolute;inset:-30px;z-index:1;pointer-events:none;` |
| `.starburst i` | `position:absolute;left:50%;top:50%;width:38px;height:38px;margin:-19px 0 0 -19px;opacity:0;` |
| `.starburst i svg` | `width:100%;height:100%;` |
| `.starburst.go i` | `animation:starfly 1.1s cubic-bezier(.2,.8,.3,1) forwards;` |
| `.nursglow` | `position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle, rgba(255,218,124,.55) 0%, rgba(255,218,124,0) 66%);z-index:1;opacity:0;transition:opacity .5s;` |
| `.nursglow.on` | `opacity:1;animation:glowpulse 2.4s ease-in-out infinite;` |
| `.nurstxt` | `text-align:center;margin-top:6px;z-index:4;position:relative;` |
| `.nurstxt h2` | `color:#fff;font-size:25px;line-height:1.2;` (also inherits `h1..h4{margin:0;font-weight:700}`) |
| `.nurstxt p` | `color:#BFE3F3;font-size:14px;font-weight:600;margin:8px 0 0;line-height:1.5;` |
| `.nursfoot` | `width:100%;max-width:330px;margin-top:22px;z-index:4;position:relative;` |
| `.nursskip` | `position:absolute;top:calc(16px + env(safe-area-inset-top));right:16px;color:#BFE3F3;font-size:12.5px;font-weight:700;z-index:6;padding:8px 12px;border-radius:var(--r-pill);background:rgba(255,255,255,.1);` |

### Input field (lines 241-244)
| selector | declarations |
|---|---|
| `.field` | `width:100%;background:#fff;border:2px solid var(--line);border-radius:var(--r-md);padding:15px 16px;font-size:16px;color:var(--ink);font-weight:600;outline:none;transition:.15s;` (inline overrides: `text-align:center;font-size:17px`) |
| `.field:focus` | `border-color:var(--orange);` |
| `.field::placeholder` | `color:#BDB8AB;font-weight:500;` |

### Primary button (lines 149-160)
| selector | declarations |
|---|---|
| `.btn` | `display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;` |
| `.btn:active` | `transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);` |
| `.btn.block` | `display:flex;width:100%;` |
| (Surprise-me button has NO class) | inline only: `color:#8FC0CC;font-size:12.5px;font-weight:700` |

### Screen stack / slide transitions (lines 115-128)
| selector | declarations |
|---|---|
| `.screen` | `position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--cream);` |
| `.screen.active` | `display:flex;` |
| `.screen.overlay` | `z-index:40;` (overridden by `#nursery` → 72) |
| `.slide-up` | `animation:slideup .32s cubic-bezier(.2,.8,.2,1) both;` |
| `.slide-down` | `animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;` |
| `.fade-in` | `animation:fade .28s ease both;` |
| `.fade-out` | `animation:fadeout .2s both;` |

### Reward modal (lines 741-755)
| selector | declarations |
|---|---|
| `#reward` | `position:absolute;inset:0;z-index:70;background:rgba(11,37,48,.55);display:none;align-items:center;justify-content:center;padding:24px;` |
| `#reward.show` | `display:flex;animation:fade .25s both;` |
| `.rewardcard` | `background:#fff;border-radius:26px;padding:26px 22px;text-align:center;width:100%;max-width:330px;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:pop .45s cubic-bezier(.2,1.3,.4,1) both;max-height:88vh;overflow-y:auto;` |
| `.rewardcard .burst` | `display:flex;justify-content:center;margin-bottom:2px;animation:spinin 1.2s ease;` |
| `.rewardcard h2` | `font-size:23px;margin:6px 0 3px;` |
| `.rewardcard p` | `color:var(--muted);font-size:14px;margin:0 0 18px;line-height:1.45;` |
| `.rewardbonus` | `display:inline-flex;align-items:center;gap:6px;background:#FFF4E7;border:1px solid #F6DFC4;color:var(--orange-2);font-weight:700;font-size:12.5px;padding:8px 13px;border-radius:var(--r-sm);line-height:1.3;` |
| `.rewardbonus.muted-bonus` | `background:var(--cream);border-color:var(--line-2);color:var(--muted);font-weight:600;` |
| `.rewardgoal` | `font-size:11.5px;color:var(--muted);font-weight:700;margin-top:12px;` |
| `.fit` | `display:flex;align-items:flex-end;justify-content:center;` · `.fit>svg{height:100%;width:auto;display:block;}` · `.fit>img{height:100%;width:auto;object-fit:contain;display:block;}` |

### Confetti + toast (lines 734-758)
| selector | declarations |
|---|---|
| `#confetti` | `position:absolute;inset:0;pointer-events:none;z-index:75;overflow:hidden;` |
| `.conf` | `position:absolute;width:9px;height:14px;top:-20px;border-radius:2px;animation:fall linear forwards;` (per-piece inline: random `left`, `background`, `animation-duration` 1.6–3.0s, `animation-delay` 0–0.4s, `width` 6–12px, `height` 10–18px) |
| `#toast` | `position:absolute;left:50%;bottom:calc(var(--nav-h) + 26px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);background:rgba(11,37,48,.95);color:#fff;font-weight:600;font-size:13.5px;padding:11px 16px;border-radius:var(--r-md);display:flex;align-items:center;gap:8px;z-index:80;opacity:0;transition:.25s;pointer-events:none;max-width:86%;text-align:left;line-height:1.35;` |
| `#toast.show` | `opacity:1;transform:translateX(-50%) translateY(0);` |
| `#toast.high` | `bottom:auto;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%) translateY(-20px);` |
| `#toast.high.show` | `transform:translateX(-50%) translateY(0);` |
| `#toast img` | `width:20px;height:20px` |

### @keyframes referenced by this screen
| name | definition |
|---|---|
| `eggshake` | `0%,100%{transform:rotate(0) translateX(0)}25%{transform:rotate(-7deg) translateX(-5px)}75%{transform:rotate(7deg) translateX(5px)}` |
| `eggburst` | `0%{transform:scale(1)}45%{transform:scale(1.13)}100%{transform:scale(1)}` |
| `revealpet` | `from{transform:scale(.3) translateY(40px);opacity:0}to{transform:none;opacity:1}` |
| `starfly` | `0%{opacity:0;transform:translate(0,0) scale(.2) rotate(0)} 25%{opacity:1} 100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(1.1) rotate(220deg)}` |
| `glowpulse` | `0%,100%{transform:scale(.94)}50%{transform:scale(1.06)}` |
| `slideup` | `from{transform:translateY(100%)}to{transform:none}` |
| `slidedown` | `from{transform:none}to{transform:translateY(100%)}` |
| `fade` | `from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}` |
| `fadeout` | `from{opacity:1}to{opacity:0}` |
| `pop` (reward + splash) | `from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}` |
| `spinin` (reward burst) | `from{transform:rotate(-20deg) scale(.5)}to{transform:none}` |
| `fall` (confetti) | `to{transform:translateY(960px) rotate(720deg);opacity:.3}` |

`@media (prefers-reduced-motion: reduce)` (line 802) disables `.petart,.eggart,.gardensun,
.gardencloud,.pilecoin img` — note it does **not** list the nursery/starburst animations,
so those still play; however `confetti()` early-returns under reduced motion (see §4).

---

## 3. DATA / LOGIC (verbatim)

### Step copy array (`renderHatch`, lines 3046-3050)
Indexed by `hatchStep`; fallback `{h:'',p:''}` for out-of-range.
```js
[
 {h:"Something is moving", p:"Three days of showing up. The egg can feel it."},   // step 0
 {h:"A first crack",       p:"Whatever is in there really wants to meet you."},    // step 1
 {h:"Almost…",             p:"Hold on."},                                          // step 2
][hatchStep] || {h:'',p:''}
```
Note the ellipsis in "Almost…" is a single `…` glyph (U+2026), not three dots.

### Egg art selection (line 3051)
```js
const art = hatchStep===0 ? ART.eggWhole : hatchStep===1 ? ART.eggCrack : ART.eggCrack;
```
`ART.eggWhole` and `ART.eggCrack` are inline SVG string literals in the `ART` map
(lines 1119-1120). They render at 250px tall inside `.nursegg`.

### Star field (`starField`, lines 3060-3067)
```js
const n = 14;
for i in 0..13:
  a    = (i/n) * Math.PI*2                        // evenly around a circle
  dist = 110 + Math.random()*60                   // 110–170px throw distance
  art  = [ART.star1, ART.star2, ART.star3][i%3]   // cycles 3 star glyphs
  → `<i style="--sx:${(cos(a)*dist).toFixed(0)}px;
               --sy:${(sin(a)*dist).toFixed(0)}px;
               animation-delay:${(i*0.045).toFixed(2)}s">${art}</i>`
```
14 stars; each flies to `(--sx,--sy)` via `starfly`; stagger 0.045 s per index (0.00–0.585 s).
`--sx/--sy` are randomized each render (star burst is non-deterministic).

### Species data (`SPECIES`, lines 1218-1225; `spec()` line 1226)
`spec(id)` returns the matching species or `SPECIES[0]` (Dog) as fallback.
| id | name | price | premium | kind | art / img |
|---|---|---|---|---|---|
| `dog` | Dog | 0 | false | img | `img:'dogthumb'` |
| `cat` | Cat | 0 | false | img | `img:'catthumb'` |
| `fox` | Fox | 600 | false | svg | `art:'fox'` |
| `penguin` | Penguin | 900 | false | svg | `art:'penguin'` |
| `axolotl` | Axolotl | 1200 | true | svg | `art:'axolotl'` |

Reveal renders: `sp.kind==='svg' ? ART[sp.art] : <img src="${ASSETS[sp.img]}" style="height:230px">`.
`ASSETS.*` values are base64 `data:image/webp` URIs (e.g. `ASSETS.coin`, `ASSETS.dogthumb`,
`ASSETS.catthumb`). `ART.*` values are raw inline `<svg>…</svg>` strings.

Pronoun rule (line 3086): `sp.name==='Fox' || sp.name==='Cat' ? 'her' : 'them'`.
(Fox/Cat → "her"; Dog/Penguin/Axolotl → "them".)

### Names for "Surprise me" (`NAMES`, line 3096)
```
["Pip","Sprig","Moss","Juniper","Bramble","Nori","Clover","Tuck",
 "Willow","Fern","Hazel","Poppy","Ember","Cricket"]
```
`surpriseName()`: picks `NAMES[Math.floor(Math.random()*NAMES.length)]`, writes it into
`#hatchName.value` and `S._pendingName`.

### State mutated by `doHatch()` (lines 3068-3074)
```js
S.pet.hatchState = 'hatched';
S.pet.hatchProgress = 3;
S.pet.hatchedOn = today();          // today() = 'YYYY-MM-DD' (local, noon-normalized)
S.pet.health = 100;
S.pet.lastCollect = Date.now();
if(!S.pet.ownedSpecies.includes(S.pet.species)) S.pet.ownedSpecies.push(S.pet.species);
save();                              // localStorage under SAVE_KEY
```

### Name commit (`finishHatch`, lines 3103-3119)
```js
v = (S._pendingName||'').trim()  ||  (#hatchName.value||'').trim();
if(!v){ toast('Give them a name first'); focus #hatchName; return; }
S.pet.name = v;
S.pet.seenHatch = true;
delete S._pendingName;
save();
closeSlide('nursery', () => {        // 0.25s slide-down, then:
  renderAll();
  showReward({ … see below … });
  checkAch();                        // re-evaluate achievements
});
```
Reward payload:
```js
title: `Meet ${esc(v)}`
sub:   `Your ${spec(S.pet.species).name.toLowerCase()} is home.`
icon:  `<div class="fit" style="height:120px">${species svg or <img>}</div>`
note:  `${esc(v)} starts at full health. Keep your habits and it stays that way. Miss a day and it just gets a little hungry.`
goal:  `Growth stage: Baby · reach a 7 day streak for Young`
```
`esc()` HTML-escapes `& < > "`. Growth thresholds referenced: `STAGES = ["Baby","Young","Grown","Prime","Legend"]` (line 1281); stages unlock at **7, 21, 50, 100** days (line 1948).

### Hatch-progress model (context, not on this screen)
- `S.pet.hatchState`: `'egg'` → `'hatched'` (blank-state line 1322).
- `S.pet.hatchProgress`: `0…3`, counts **all-clear days**. Incremented on an all-clear day
  (line 1672, `Math.min(3,…+1)`), decremented on a miss (line 1654). At `>=3` the egg is
  "ready"; logging the 3rd triggers `startHatch()` after 400 ms (line 1676).
- The egg banner shows `ART.eggCrack` once `hatchProgress>=1`, else `ART.eggWhole`
  (lines 2231, 2847). Pre-ready banner tap → `openHatchInfo()`; ready → `startHatch()`
  (line 2219).

---

## 4. INTERACTIONS

| Trigger | Handler | Effect |
|---|---|---|
| Egg banner tap (ready) / pet-room "Hatch it" / auto 400 ms after 3rd all-clear | `startHatch()` | Opens `#nursery` (slide-up), shows Skip, begins the 0/1500/3400/5300 ms step timeline. Guard: no-op if already hatched. |
| **"Skip"** button (`#nursSkip`) | `hatchSkip()` | Clears pending timers, sets `hatchStep=3`, calls `doHatch()` immediately → jumps to reveal. |
| (auto, timeline) | `renderHatch()` ×3 then `doHatch()` | Advances egg whole → crack+shake → glow+burst → reveal. |
| **Name input** (`#hatchName`) `oninput` | `hatchNameLive(v)` | `S._pendingName = v`. |
| **"Surprise me"** button | `surpriseName()` | Random `NAMES` entry → fills input + `S._pendingName`. |
| **"That's the one"** button | `finishHatch()` | If name empty → `toast('Give them a name first')` + refocus, abort. Else commit name, `seenHatch=true`, `save()`, close nursery (slide-down 250 ms), `renderAll()`, fire reward modal, `checkAch()`. |
| **"Continue"** (reward) | `closeReward()` | `#reward` fade-out 200 ms, clears innerHTML, `renderAll()`; drains any queued achievements after 260 ms. |

Animation/feedback fired during the flow:
- `doHatch()` → `confetti()` called **twice** (line 3093); input auto-focus after 500 ms.
- `showReward()` → `confetti()` a **third** time (line 4201).
- `confetti()` (lines 4168-4183): early-returns if `prefers-reduced-motion: reduce`.
  Otherwise appends **70** `.conf` divs to `#confetti`, colors cycling
  `['#E28A4B','#FFDA7C','#0C4C60','#1E7F91','#E68FB0','#12667F','#A7C34F']`,
  each removed after 3400 ms.
- `toast(msg,img)` (lines 4161-4167): sets text (+ optional 20px img), adds `.high` when a
  scrim or reward is open (so it floats to top), shows for **2400 ms**.
- `openScreen`/`closeSlide` (lines 1808-1813): open = add `.active .slide-up`; close =
  add `.slide-down`, then after 250 ms remove `.active` and run the `after` callback
  (guarded by a per-id token so a re-open cancels a pending close).

---

## 5. NOTES / SUBTLETIES

1. **Two innerHTML states in one container.** `#nursBody` is fully rewritten by
   `renderHatch()` (STATE A) and `doHatch()` (STATE B). A RN rebuild should model these as
   conditional render branches keyed on `hatchStep` (0–2 = stepping, 3 = reveal), not as a
   persistent tree with class toggles alone — the DOM shape differs (`.nursegg`+`.nurstxt`
   only, vs `.nurspet`+`.nurstxt`+`.nursfoot`).

2. **Star burst only animates in STATE B.** In STATE A the `.starburst` has NO `.go` class,
   and `.starburst i` is `opacity:0` — the 14 stars exist in the DOM but are invisible/static.
   Only `doHatch()` adds `.go`, which triggers `starfly` on all 14. So the burst is a
   one-shot on reveal, staggered 0.045 s apart, 1.1 s each, throwing 110–170px out to
   `--sx/--sy`. Positions are re-randomized every render (not stable).

3. **Skip parity.** `hatchSkip()` produces the *same* end state as letting the timers run —
   it just fast-forwards to `doHatch()`. No copy or reward differences.

4. **Empty-name guard.** `finishHatch()` blocks on an empty/whitespace name with a toast and
   refocus; it never advances with a blank name. Whitespace-only is trimmed to empty.
   `_pendingName` takes priority over the live input value, then falls back to it.

5. **Pronoun & species-specific copy.** Reveal headline lowercases the species name
   ("It's a fox!"). Pronoun is "her" for Fox/Cat only, else "them". Reveal art is inline SVG
   for fox/penguin/axolotl and a webp `<img>` (height 230px) for dog/cat.

6. **Reward is a distinct overlay, not part of `#nursery`.** It renders on `#reward` (z 70)
   *after* the nursery has slid away. This reward instance has no coins/stats/stars, so it
   uses the muted `.rewardbonus.muted-bonus` styling and omits the `.rewardstats` block.

7. **Theme behavior.** The nursery stage is largely theme-independent: `#nursery`
   background gradient, `.nurstxt` colors (`#fff`, `#BFE3F3`), `.nursglow` gold
   (`rgba(255,218,124,…)`), Skip color, and the Surprise-me `#8FC0CC` are all hard-coded.
   The **only** themed elements on this screen are the CTA button (`.btn` uses
   `--orange`/`--orange-2`) and the focused input border (`--orange`). Under `dusk`/`forest`/
   `ocean`/`ember` themes the "That's the one" button and the reward card accent shift, but
   the egg/star/glow/text visuals stay teal-and-gold. `applyTheme()` sets/removes
   `data-theme` on `<html>`.

8. **Reduced motion.** `confetti()` no-ops under `prefers-reduced-motion: reduce`. The
   nursery's own keyframes (`eggshake`, `eggburst`, `revealpet`, `starfly`, `glowpulse`) are
   NOT in the reduced-motion suppression list, so they still play — replicate that behavior
   (or make an explicit product decision to gate them in RN).

9. **Persistence side effects.** `doHatch()` writes 6 pet fields + `ownedSpecies` and
   `save()`s before the name is chosen; `finishHatch()` writes `name`+`seenHatch` and
   `save()`s again. If the user backgrounds the app between reveal and naming, the pet is
   already "hatched" but unnamed — the RN port must handle a hatched-but-unnamed resume.

10. **Fonts/sizing gotchas for 1:1.** Headline `.nurstxt h2` is 25px/1.2 weight 700;
    subcopy 14px/1.5 weight 600. Name input overrides the base 16px to **17px**, centered.
    Reward headline 23px, body 14px. Egg 250px tall, pet 230px tall, stage box 250×280px,
    glow 300×300px, star `<i>` 38×38px. All shadows/radii are transcribed verbatim in §2.
