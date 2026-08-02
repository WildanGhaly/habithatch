# HabitHatch — Constants, State Model, Formulas & Helpers (build contract)

Source: `prototype/habithatch_v1.html`.
Scope: the **DATA + LOGIC core**, lines **1078–1957** (`ASSETS`, `ART`, `ICONS`, `CATS`, `SPECIES`, `FOODS`, `CLOTHES`, `GARDEN`, `THEMES`, `ACHIEVEMENTS`, `STAGES`, date helpers, state model, formulas, art builders), plus the CSS classes those builders emit (resolved from the `<style>` block, lines 8–965).

This document is **authoritative for logic parity**. Every number, threshold, cap, string and field is transcribed verbatim from the source. Where the JS builds DOM (the art builders), the exact tree + classes + copy are given. Do not paraphrase numbers or copy.

---

## 1. VISUAL TREE (DOM emitted by this section's builders)

This section is mostly pure logic, but it contains the **art/DOM builders** that every screen reuses. Their output trees are below. `{…}` = interpolated value; verbatim literal text is quoted.

### 1.1 `ic(name,size=16,cls='')` → line 1196
Returns an inline SVG. Empty string if `name` unknown.
```
<svg class="ic {mode} {cls}" width="{size}" height="{size}" viewBox="0 0 24 24" aria-hidden="true">
  {inner}          ← ICONS[name][1] (raw path/rect/circle markup)
</svg>
```
`{mode}` is `stroke` or `fill` = `ICONS[name][0]`.

### 1.2 `roomStage(height, extra)` → line 1901  (the companion room / home hero)
```
div.room                       style="height:{height}px"
├─ svg.roomart                 (the drawn background scene — see roomArt() below)
├─ IF hatched:
│   ├─ div.moodtag
│   │   ├─ span.mooddot.{mood.k}          (.happy / .content / .tired / .hungry)
│   │   └─ text: {mood.t}                 ("Happy" | "Content" | "Tired" | "Hungry")
│   └─ div.stagetag
│       ├─ {ic('sparkle',12)}
│       └─ text: {stageName(petStage())}  ("Baby" | "Young" | "Grown" | "Prime" | "Legend")
│  ELSE (pre-hatch):
│   └─ div.moodtag
│       ├─ {ic('egg',14)}
│       └─ text: " Eggbound"
├─ IF hatched: petBlock(round(height*0.80))   ELSE: eggBlock()
├─ IF hatched: coinPile()                       (only when idle coins pending)
└─ {extra}                     (caller-supplied extra HTML, optional)
```

### 1.3 `petBlock(h)` → line 1889  (post-hatch companion)
```
div.petshadow
div.petstage                   style="height:{h||190}px"
└─ div.petwrap
   └─ speciesArt(species, mood.k, true):
      div.petart.{mood.k}       (mood class = happy|content|tired|hungry)
      ├─ IF species.kind==='svg': {ART[species.art]}         (inline <svg>)
      │  ELSE:                    <img src="{ASSETS[species.img]}" alt="{species.name}">
      └─ IF clothesId set: <img class="petoutfit" src="{ASSETS[outfit.img]}"
                                 style="width:{wear.w}%;top:{wear.t}%" alt="">
```

### 1.4 `eggBlock()` → line 1896  (pre-hatch egg)
```
div.petshadow
div.eggstage
└─ div.eggart[.ready]           (.ready added only when hatchProgress>=3)
   └─ {egg SVG}                 hatchProgress>=3 → ART.eggHatch
                                hatchProgress>=1 → ART.eggCrack
                                else             → ART.eggWhole
```

### 1.5 `coinPile()` → line 1553  (idle-coin jar on the room floor)
Renders **only if** `idlePending() > 0`; otherwise returns `''`.
```
button.coinpile   onclick="event.stopPropagation();collectIdle()"  aria-label="Collect coins"
├─ span.pilecoin  style="left:{l}%;bottom:{b}px;transform:rotate({r}deg)"    (×n coins)
│   └─ img  src="{ASSETS.coin}"  style="width:{s}px;animation-delay:{i*0.05}s"
└─ span.pilebadge
    ├─ img  src="{ASSETS.coin}"
    └─ text: "{pending} to collect"          e.g. "37 to collect"
```
`n = min(12, max(1, ceil(pending/4)))`. Coin positions come from `COIN_SPOTS` (§3.10).

### 1.6 `roomArt()` → line 1854  (static drawn scene inside `.room`)
```
svg.roomart  viewBox="0 0 220 132"  preserveAspectRatio="xMidYMid slice"  aria-hidden="true"
  → grass field #A0B559, speckles #8E9F4C, wood floor #DCC79A with plank lines,
    a moon/window (#F2EADA / #BFE3F3 / #A9D8ED), a framed picture, a potted plant,
    floor rug ellipses. (Pure decoration; full path data in source lines 1855–1876.)
```

### 1.7 `flameSVG(size)` → line 1914
```
span  style="display:inline-flex;width:{size}px;height:{size}px"
└─ {ART.flame}                  (inline flame <svg>)
```

### 1.8 `coinFly(fromEl, amount)` → line 1917  (transient reward animation)
Appends `n = min(8, max(3, round(amount/2)))` bare `<img src=ASSETS.coin>` elements (no class; inline-styled, `position:absolute;width:22px;height:22px;z-index:78;pointer-events:none`) into `#device`, tweens them from the tapped control to `.coinpill`, then removes them. Skipped entirely under `prefers-reduced-motion: reduce`.

---

## 2. STYLE TABLE (verbatim CSS for every class the builders emit)

Copied verbatim from the `<style>` block. CSS custom properties resolve to (default "hatch" theme, `:root`): `--room-bg:#A0B559`, `--floor:#DCC79A`, `--cream:#FBF6EC`, `--yellow:#FFDA7C`, `--yellow-2:#F4B942`, `--pink:#E68FB0`, `--r-pill:999px`, `--r-md:16px`, `--shadow-sm:0 4px 12px rgba(12,76,96,.08)`, `--teal-ink:#0B2530`. (Themes only re-map the accent family — see §5 Theme behavior.)

### Room / companion stage
```css
.room{position:relative;height:270px;overflow:hidden;background:var(--room-bg);}
.roomart{position:absolute;inset:0;width:100%;height:100%;}
.room::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,transparent 74%,rgba(251,246,236,.35) 90%,var(--cream) 100%);}
.petstage{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;justify-content:center;z-index:2;padding-bottom:44px;}
.petwrap{position:relative;height:100%;display:flex;align-items:flex-end;justify-content:center;}
.petart{position:relative;height:100%;display:flex;align-items:flex-end;justify-content:center;
  filter:drop-shadow(0 12px 10px rgba(0,0,0,.14));animation:breathe 3.4s ease-in-out infinite;transform-origin:50% 100%;}
.petart>svg{display:block;height:100%;width:auto;}
.petart>img{display:block;height:100%;width:auto;object-fit:contain;}
.petart.happy{animation-duration:2.6s}
.petart.tired{animation-duration:4.4s}
.petart.hungry{animation-duration:5s;filter:drop-shadow(0 12px 10px rgba(0,0,0,.14)) saturate(.78);}
.petart.cheer{animation:cheer .8s cubic-bezier(.2,1.4,.4,1) 2;}
.petart>img.petoutfit{position:absolute;left:50%;transform:translateX(-50%);pointer-events:none;z-index:3;
  height:auto;object-fit:fill;filter:drop-shadow(0 2px 2px rgba(0,0,0,.16));}
.petshadow{position:absolute;bottom:48px;left:50%;transform:translateX(-50%);width:118px;height:20px;border-radius:50%;background:rgba(0,0,0,.16);filter:blur(5px);z-index:1;}
.moodtag{position:absolute;top:12px;left:12px;z-index:5;background:rgba(255,255,255,.92);backdrop-filter:blur(4px);
  padding:6px 12px;border-radius:var(--r-pill);font-weight:700;font-size:12.5px;color:var(--teal-ink);box-shadow:var(--shadow-sm);display:flex;gap:6px;align-items:center;}
.stagetag{position:absolute;top:12px;right:12px;z-index:5;background:rgba(12,76,96,.9);color:#fff;
  padding:5px 11px;border-radius:var(--r-pill);font-weight:800;font-size:11px;letter-spacing:.2px;display:flex;gap:5px;align-items:center;}
/* NOTE: .stagetag background is a literal rgba(12,76,96,...) teal, NOT re-themed. */
```
Note: `moodtag`/`stagetag` are `position:absolute` inside `.room`; the `petstage`/`eggstage` are anchored to the room bottom. `.moodtag` (`top:12px;left:12px`) vs `.stagetag` (`top:12px;right:12px`).

### Mood dots (colors are literal, not themed)
```css
.mooddot{width:8px;height:8px;border-radius:50%;flex:none;}
.mooddot.happy{background:#1E7F91}
.mooddot.content{background:#E9B24C}
.mooddot.tired{background:#C79350}
.mooddot.hungry{background:#D98C6A}
```

### Idle coin pile
```css
.coinpile{position:absolute;inset:0;z-index:6;border:none;background:transparent;padding:0;cursor:pointer;}
.pilecoin{position:absolute;}
.pilecoin img{display:block;filter:drop-shadow(0 3px 3px rgba(0,0,0,.22));animation:coinpop .42s ease-out backwards, coinbob 2.6s ease-in-out infinite;}
.pilebadge{position:absolute;top:52px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:5px;background:rgba(12,76,96,.92);color:#fff;font-weight:800;font-size:11.5px;padding:5px 11px;border-radius:var(--r-pill);box-shadow:var(--shadow-sm);white-space:nowrap;}
.pilebadge img{width:15px;height:15px;}
```

### Egg in room
```css
.eggstage{position:absolute;left:0;right:0;bottom:0;height:200px;display:flex;align-items:flex-end;justify-content:center;z-index:2;padding-bottom:38px;}
.eggart{height:168px;animation:eggwobble 2.8s ease-in-out infinite;transform-origin:50% 92%;filter:drop-shadow(0 10px 8px rgba(0,0,0,.16));}
.eggart svg{height:100%;width:auto;display:block;}
.eggart.ready{animation-duration:.9s;}
```

### Icons (`ic()` output)
```css
.ic{display:inline-block;vertical-align:middle;flex:none;}
.ic.stroke{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ic.fill{fill:currentColor;stroke:none;}
.ic.pink{color:var(--pink);}
```

### Coin pill (target of `bumpCoins()` / `coinFly()`)
```css
.coinpill{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1.5px solid var(--line-2);
  padding:6px 12px 6px 7px;border-radius:var(--r-pill);font-weight:700;color:var(--coin-ink);box-shadow:var(--shadow-sm);}
.coinpill img{width:22px;height:22px}
.coinpill.bump{animation:bump .5s ease;}
.coinmini{width:16px;height:16px;vertical-align:-3px;margin-right:5px;}
```

### Overlays fired by this section's logic
`collectIdle()` fires `confetti()`; `maybeAllClear()` fires `showReward(...)` (or `startHatch()`); `checkAch()`→`drainAch()` fires `showReward(...)`; `toast()` shows the toast. Their surfaces:
```css
#toast{position:absolute;left:50%;bottom:calc(var(--nav-h) + 26px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);
  background:rgba(11,37,48,.95);color:#fff;font-weight:600;font-size:13.5px;padding:11px 16px;border-radius:var(--r-md);
  display:flex;align-items:center;gap:8px;z-index:80;opacity:0;transition:.25s;pointer-events:none;max-width:86%;text-align:left;line-height:1.35;}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
#toast.high{bottom:auto;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%) translateY(-20px);}
#toast.high.show{transform:translateX(-50%) translateY(0);}
#toast img{width:20px;height:20px}
#reward{position:absolute;inset:0;z-index:70;background:rgba(11,37,48,.55);display:none;align-items:center;justify-content:center;padding:24px;}
#reward.show{display:flex;animation:fade .25s both;}
.rewardcard{background:#fff;border-radius:26px;padding:26px 22px;text-align:center;width:100%;max-width:330px;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:pop .45s cubic-bezier(.2,1.3,.4,1) both;max-height:88vh;overflow-y:auto;}
#confetti{position:absolute;inset:0;pointer-events:none;z-index:75;overflow:hidden;}
.conf{position:absolute;width:9px;height:14px;top:-20px;border-radius:2px;animation:fall linear forwards;}
```

### @keyframes referenced by the emitted DOM
```css
@keyframes breathe{0%,100%{transform:translateY(0) scaleY(1) scaleX(1)}50%{transform:translateY(-5px) scaleY(1.028) scaleX(.988)}}
@keyframes cheer{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-16px) rotate(-5deg)}60%{transform:translateY(-4px) rotate(4deg)}}
@keyframes coinpop{from{opacity:0;transform:translateY(10px) scale(.5)}}
@keyframes coinbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes eggwobble{0%,100%{transform:rotate(0)}20%{transform:rotate(-3.5deg)}40%{transform:rotate(3deg)}60%{transform:rotate(-2deg)}80%{transform:rotate(1.4deg)}}
@keyframes bump{0%,100%{transform:none}30%{transform:scale(1.16)}}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes fall{to{transform:translateY(960px) rotate(720deg);opacity:.3}}
/* accessibility: animations killed on the pet/egg/coins */
@media (prefers-reduced-motion: reduce){
  .petart,.eggart,.gardensun,.gardencloud,.pilecoin img{animation:none!important;}
}
```

---

## 3. DATA / LOGIC (catalogs + formulas + state, verbatim)

### 3.0 Asset & art registries (keys only — payloads are inlined art)
`ASSETS` (line 1082) = base64 WebP data URIs, keys:
`coin, lock, wardrobe, shop, petIcon, potion, foodIcon, apple, chicken, pizza, melon, carrot, c1, c2, c3, c4, c5, catthumb, dogthumb, room`.

`ART` (line 1107) = inline SVG strings, keys:
`water, exercise, read, meditate, run, hygiene, nophone, wake, sleep, medicine, custom, eggWhole, eggCrack, eggHatch, gSprout, gTree, gOrchard, habitRing, habitCheck, flame, fox, penguin, axolotl, star1, star2, star3, pawIc, boneIc, hangerIc, chartIc, checkIc, backIc, playIc`.
- Egg viewBoxes are `0 0 100 118`; habit icons `0 0 100 100`; pets `0 0 100 118`.
- `catArt(id) = ART[id] || ART.custom` (line 1215). Habit-category art keys match the first 11 `CATS` ids.

### 3.1 `ICONS` (24×24 stroke/fill icon set) — line 1146
Each entry is `key:[mode, innerSVG]`. `mode` ∈ `stroke`|`fill`. Rendered by `ic()` at `viewBox="0 0 24 24"`. Full inner markup verbatim:

| key | mode | inner SVG |
|---|---|---|
| clock | stroke | `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>` |
| calendar | stroke | `<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3.2v3.6M15.5 3.2v3.6"/>` |
| repeat | stroke | `<path d="M4.5 9.2 7 6.6l2.6 2.6"/><path d="M7 6.6h7.5a4.2 4.2 0 0 1 4.2 4.2"/><path d="M19.5 14.8 17 17.4l-2.6-2.6"/><path d="M17 17.4H9.5a4.2 4.2 0 0 1-4.2-4.2"/>` |
| flame | fill | `<path d="M12.8 2.4c.4 2.7 2.7 3.7 3.4 6.1.9 3.1-1.2 6.6-4.6 6.6-2.9 0-5-2.2-4.6-5.1.2-1.4 1-2.2 1.7-3 .2 1.3.9 2 1.7 2.2-.5-2.3.9-4.6 2-6.8z"/><path d="M11 15.5c1.6 0 2.9 1 2.9 2.6 0 1.7-1.3 2.9-2.9 2.9s-2.7-1.2-2.7-2.7c0-1 .5-1.7 1.1-2.2.1.9.6 1.3 1.1 1.4-.3-1.1.1-1.6 .4-2z"/>` |
| check | stroke | `<path d="M8 12.5 11 15.5 16.5 6.5"/>` |
| checkCircle | stroke | `<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2 11 15l5-5.6"/>` |
| circle | stroke | `<circle cx="12" cy="12" r="8.5"/>` |
| bolt | fill | `<path d="M13.5 2 5 13h5.2l-1 9L19 10.5h-5.4z"/>` |
| heart | fill | `<path d="M12 20.7C6.5 17 3 13.8 3 9.9 3 7.2 5 5.4 7.4 5.4c1.7 0 3 .9 3.9 2.2.9-1.3 2.2-2.2 3.9-2.2 2.4 0 4.4 1.8 4.4 4.5 0 3.9-3.5 7.1-9 10.8z"/>` |
| note | stroke | `<rect x="4.5" y="4" width="15" height="16" rx="3"/><path d="M8 9h8M8 12.5h8M8 16h5"/>` |
| plus | stroke | `<path d="M12 5.5v13M5.5 12h13"/>` |
| minus | stroke | `<path d="M5.5 12h13"/>` |
| close | stroke | `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>` |
| chevL | stroke | `<path d="M14.5 5.5 8 12l6.5 6.5"/>` |
| chevR | stroke | `<path d="M9.5 5.5 16 12l-6.5 6.5"/>` |
| chevU | stroke | `<path d="M5.5 14.5 12 8l6.5 6.5"/>` |
| chevD | stroke | `<path d="M5.5 9.5 12 16l6.5-6.5"/>` |
| arrUp | stroke | `<path d="M12 19V6M6.2 11.8 12 6l5.8 5.8"/>` |
| arrDn | stroke | `<path d="M12 5v13M6.2 12.2 12 18l5.8-5.8"/>` |
| bell | stroke | `<path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 5.5 1.8 5.5H4.2S6 14 6 9.5z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>` |
| edit | stroke | `<path d="M4 20h4L18.5 9.5l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>` |
| gift | stroke | `<rect x="4" y="9.5" width="16" height="10.5" rx="1.6"/><path d="M4 13h16M12 9.5V20"/><path d="M12 9.5C11 7 9 5.5 7.6 6.6 6.4 7.6 8.6 9.5 12 9.5z"/><path d="M12 9.5c1-2.5 3-4 4.4-2.9 1.2 1-.9 2.9-4.4 2.9z"/>` |
| shield | stroke | `<path d="M12 3.2 19 6v5.2c0 4.8-3 7.7-7 9.6-4-1.9-7-4.8-7-9.6V6z"/><path d="M9 12l2.2 2.2L15.4 10"/>` |
| snow | stroke | `<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M12 6.6 9.8 4.8M12 6.6l2.2-1.8M12 17.4l-2.2 1.8M12 17.4l2.2 1.8"/>` |
| offline | stroke | `<rect x="6.5" y="3" width="11" height="18" rx="2.5"/><path d="M10.5 18h3"/>` |
| trash | stroke | `<path d="M5 7h14M9.5 7V4.8h5V7M6.5 7l1 12.5h9L17.5 7"/>` |
| crown | fill | `<path d="M4.6 16.4 3.1 8.6a.55.55 0 0 1 .86-.56l3.9 2.66 3.62-5.02a.62.62 0 0 1 1.02 0l3.62 5.02 3.9-2.66a.55.55 0 0 1 .86.56l-1.5 7.8z"/><rect x="4.5" y="17.7" width="15" height="2.7" rx="1.35"/><circle cx="3.6" cy="7.6" r="1.5"/><circle cx="20.4" cy="7.6" r="1.5"/><circle cx="12" cy="4.3" r="1.6"/>` |
| sparkle | fill | `<path d="M12 3.5c1 5.8 2.7 7.5 8.5 8.5-5.8 1-7.5 2.7-8.5 8.5-1-5.8-2.7-7.5-8.5-8.5 5.8-1 7.5-2.7 8.5-8.5z"/>` |
| sprout | stroke | `<path d="M12 20v-7M12 13c0-3 2.5-5 6-5 0 3-2.5 5-6 5zM12 13c0-2.6-2.2-4.5-5.5-4.5C6.5 11 8.7 13 12 13z"/>` |
| trophy | stroke | `<path d="M7 4.5h10v3.5a5 5 0 0 1-10 0z"/><path d="M9.5 14.5h5M10.5 18.5h3M12 14.5v4M7 6H4.5v1a3 3 0 0 0 3 3M17 6h2.5v1a3 3 0 0 1-3 3"/>` |
| target | stroke | `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>` |
| bag | stroke | `<path d="M6 8h12l-.9 12H6.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>` |
| shirt | stroke | `<path d="M8 4 5 7l2 2 1-1v11h8V8l1 1 2-2-3-3-2 1.5a3 3 0 0 1-4 0z"/>` |
| egg | stroke | `<path d="M12 3.2c3.9 0 6 5.7 6 10.6 0 4.2-2.7 6.9-6 6.9s-6-2.7-6-6.9C6 8.9 8.1 3.2 12 3.2z"/>` |
| chart | stroke | `<path d="M4 4v16h16"/><path d="M7.5 15.5l3.5-4 3 2.6L19 8"/>` |
| bars | stroke | `<path d="M5 20V11M12 20V4.5M19 20v-6"/>` |
| pulse | stroke | `<path d="M3 12.5h4l2.4-6 4 12.5 2.6-8 1.6 3.2H21"/>` |
| archive | stroke | `<rect x="3.5" y="4.5" width="17" height="4.5" rx="1.4"/><path d="M5.4 9v9.5a1.6 1.6 0 0 0 1.6 1.6h10a1.6 1.6 0 0 0 1.6-1.6V9"/><path d="M10 13h4"/>` |
| leaf | stroke | `<path d="M5 19c0-8 5-13 14-13 0 9-5 13-14 13z"/><path d="M8.5 15.5C11 12 13.5 10 16.5 8.8"/>` |
| moon | fill | `<path d="M20 14.4A8.6 8.6 0 0 1 9.6 4 8.8 8.8 0 1 0 20 14.4z"/>` |
| sun | stroke | `<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.6M12 18.8v2.6M4.4 4.4l1.9 1.9M17.7 17.7l1.9 1.9M2.6 12h2.6M18.8 12h2.6M4.4 19.6l1.9-1.9M17.7 6.3l1.9-1.9"/>` |
| users | stroke | `<circle cx="9" cy="8" r="3.4"/><path d="M3 19.5c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.4M17.5 14.6c2.1.6 3.5 2.3 3.5 4.9"/>` |
| info | stroke | `<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.9v.1"/>` |
| lock | stroke | `<rect x="5" y="10.4" width="14" height="9.6" rx="2.4"/><path d="M8.2 10.4V7.9a3.8 3.8 0 0 1 7.6 0v2.5"/>` |
| medal | stroke | `<circle cx="12" cy="14.6" r="5.4"/><path d="M8.4 9.6 6 3.6h12l-2.4 6"/><path d="M12 12.6l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 14.7l2-.3z" fill="currentColor" stroke="none"/>` |
| flag | stroke | `<path d="M6 21V4"/><path d="M6 5h11l-2 3.4 2 3.4H6"/>` |
| scale | stroke | `<path d="M12 4.5v15M6 8h12"/><path d="M4 15.4 6.6 9l2.6 6.4a2.9 2.9 0 0 1-5.2 0zM14.8 15.4 17.4 9l2.6 6.4a2.9 2.9 0 0 1-5.2 0z"/>` |

### 3.2 `CATS` (habit categories) — line 1201
`catOf(id) = CATS.find(c=>c.id===id) || CATS[last]` (last = `custom`).

| id | name | hint |
|---|---|---|
| water | Water | Hydration |
| exercise | Exercise | Strength |
| read | Read | Books |
| meditate | Meditate | Calm |
| run | Move | Cardio |
| hygiene | Hygiene | Self-care |
| nophone | No phone | Focus |
| wake | Wake early | Mornings |
| sleep | Sleep | Rest |
| medicine | Medicine | Health |
| custom | Your own | Anything |

### 3.3 `SPECIES` — line 1218  (`spec(id) = find || SPECIES[0]`)
`wear` = garment `{w:width%, t:top%}` relative to the body art box. `kind:'img'` uses `ASSETS[img]`; `kind:'svg'` uses `ART[art]`.

| id | name | price | premium | kind | art/img | meta | wear |
|---|---|---|---|---|---|---|---|
| dog | Dog | 0 | false | img | img:`dogthumb` | Loyal and easygoing | {w:58,t:59} |
| cat | Cat | 0 | false | img | img:`catthumb` | Curious and cozy | {w:56,t:57} |
| fox | Fox | 600 | false | svg | art:`fox` | Clever and quick | {w:54,t:60} |
| penguin | Penguin | 900 | false | svg | art:`penguin` | Steady and social | {w:54,t:58} |
| axolotl | Axolotl | 1200 | **true** | svg | art:`axolotl` | Rare and unbothered | {w:46,t:58} |

Default `wear` fallback when a species has none: `{w:54,t:53}` (line 1881); `wearLayer` fallback `{w:54,t:53}`.

### 3.4 `FOODS` — line 1228
| id | name | price | heal | premium | img |
|---|---|---|---|---|---|
| 1 | Apple | 5 | 10 | false | apple |
| 2 | Chicken | 5 | 10 | false | chicken |
| 3 | Pizza | 15 | 20 | true | pizza |
| 4 | Watermelon | 8 | 10 | false | melon |
| 5 | Carrot | 10 | 15 | false | carrot |

### 3.5 `CLOTHES` — line 1235  (outfit shop; equipped via `pet.clothesId`)
| id | name | price | premium | img |
|---|---|---|---|---|
| 1 | Cyan T-shirt | 80 | false | c1 |
| 2 | Green Shirt | 150 | false | c2 |
| 3 | Tuxedo | 320 | true | c3 |
| 4 | Star Shirt | 250 | true | c4 |
| 5 | Pink Dress | 400 | true | c5 |

### 3.6 `GARDEN` (8 plots, ordered; the progression spine) — line 1244
`nextPlot()` = first unplanted (owned check via `S.garden.includes(id)`). Costs are the exact escalating gate. Perk fields feed `perks()` (§3.9).

| id | name | desc | cost | perk (copy) | ic | art | perk field |
|---|---|---|---|---|---|---|---|
| sprout | First Sprout | Your very first seedling | 120 | +1 coin per check-off | bolt | gSprout | `perCheck:1` |
| herbs | Herb Patch | Something to snack on | 300 | Idle jar cap +50 | leaf | gSprout | `cap:50` |
| can | Watering Can | Keeps the whole plot alive | 550 | Health drops 2 slower / day | shield | gSprout | `decay:2` |
| berry | Berry Bush | Sweet reward for a full day | 900 | +10% coins on all-clear days | heart | gSprout | `allClear:.10` |
| sapling | Young Sapling | Small tree, big shelter | 1400 | 1 Streak Freeze every week | sprout | gTree | `freeze:true` |
| flowers | Flower Bed | The garden starts to bloom | 2100 | Jar cap +100 and forage +25% | sparkle | gTree | `cap:100, rate:.25` |
| fruit | Fruit Tree | Shade, fruit, and a full belly | 3200 | Health drops 2 slower again | trophy | gTree | `decay:2` |
| orchard | Orchard | The garden, fully grown | 4800 | +20% coins everywhere | crown | gOrchard | `all:.20, final:true` |

### 3.7 `THEMES` — line 1257  (`sw` = swatch preview colors)
| id | name | premium | sw |
|---|---|---|---|
| hatch | Hatch | false | ['#0C4C60','#E28A4B'] |
| dusk | Dusk | true | ['#3E2E5E','#D9628F'] |
| forest | Forest | true | ['#1E4632','#D19A2E'] |
| ocean | Ocean | true | ['#123A5C','#2FA0AE'] |
| ember | Ember | true | ['#4A2A20','#DE5B39'] |

### 3.8 `ACHIEVEMENTS` (12; `rar` 1=common 2=rare 3=legendary) — line 1266
| id | name | desc | badge | rar | group |
|---|---|---|---|---|---|
| first_crack | First Crack | Check off your first habit ever | ic:`check` | 1 | Getting started |
| alive | It's Alive! | Hatch your companion | art:`eggHatch` | 2 | Getting started |
| green_thumb | Green Thumb | Plant your first Garden plot | ic:`sprout` | 1 | Getting started |
| stacker | Habit Stacker | Keep 5 habits alive on the same day | ic:`note` | 1 | Getting started |
| week | Week Warrior | Reach a 7 day streak | art:`flame` | 1 | Streaks |
| perfect | Perfect Week | 7 all-clear days in a row | ic:`target` | 2 | Streaks |
| iron | Iron Month | Reach a 30 day streak | art:`flame` | 2 | Streaks |
| centurion | Centurion | Reach a 100 day streak | ic:`crown` | 3 | Streaks |
| comeback | Comeback | Build a new 7 day streak after losing one | ic:`pulse` | 2 | Care and growth |
| wellfed | Well-Fed | Keep health at 75+ for 10 days | ic:`heart` | 2 | Care and growth |
| bloom | Full Bloom | Plant every Garden plot | ic:`trophy` | 3 | Care and growth |
| farmer | Coin Farmer | Earn 10,000 coins in total | img:`coin` | 3 | Care and growth |

Achievement completion logic (`achMet`, `achProg`, §3.14).

### 3.9 Stage / schedule / week constants — lines 1281–1286
```js
STAGES     = ["Baby","Young","Grown","Prime","Legend"];
STAGE_GATE = [0,7,21,50,100];        // overall best streak needed per stage index
SCHEDULES  = [['Daily','daily'],['Weekdays','weekdays'],['X / week','weekly']];
WD  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
WD1 = ['S','M','T','W','T','F','S'];
SEED_DAYS = 56;                      // 8 weeks of demo history
SAVE_KEY  = 'habithatch_v2';
```

### 3.10 Date helpers (all day boundaries are **local** `YYYY-MM-DD`) — lines 1291–1307
```js
pad2 = n => String(n).padStart(2,'0');
noon(d)        → new Date(d) with setHours(12,0,0,0)           // avoids DST edges
dstr(d)        → `${yyyy}-${MM}-${dd}` from noon(d)
today()        → dstr(new Date())
dOff(n,from)   → noon(from?new Date(from+'T12:00:00'):new Date()); +n days
dstrOff(n,from)→ dstr(dOff(n,from))
parseD(s)      → new Date(s+'T12:00:00')
dow(s)         → parseD(s).getDay()                            // 0=Sun..6=Sat
daysBetween(a,b)→ round((parseD(b)-parseD(a))/86400000)
isoWeek(s)     → 'YYYY-Www' ISO week label (Mon-based)
weekStart(s)   → dstr(dOff(-((getDay()+6)%7), s))              // Monday of s's week
prettyDate(s)  → 'Mon D' using ['Jan'..'Dec'][month]
```

### 3.11 STATE SHAPE — `blankState()` line 1315
Exact object written to `localStorage['habithatch_v2']` by `save()`:
```js
{
  v:2, tab:'today', nextId:1, day:today(),
  profile:{
    name:"Friend", coins:0, premium:false,
    streak:0, best:0, freezes:0, freezeWeek:null, dailyGoal:0,
    lifetimeCoins:0, theme:'hatch', code:'HATCH-4K9Q'
  },
  pet:{
    species:'fox', name:"", health:100, clothesId:0,
    ownedSpecies:['dog','cat'], ownedClothes:[],
    food:{1:1, 2:1, 3:0, 4:0, 5:0},        // FOODS id -> qty
    lastCollect:Date.now(),                // ms epoch; idle-coin anchor
    hatchState:'egg', hatchProgress:0, seenHatch:false, hatchedOn:null
  },
  habits:[], history:{}, garden:[], gardenLog:{}, achievements:[], achLog:{},
  settings:{notif:true, sound:true, evening:true, hunger:true},
  stats:{
    mealsFed:0, idleCollected:0, outfitChanges:0, healthy:0, bestHealthy:0, checkoffs:0,
    freezesUsed:0, undos:0,
    src:{check:0, clear:0, idle:0, gift:0},          // lifetime coin sources
    spent:{food:0, clothes:0, species:0, garden:0}   // lifetime coin sinks
  }
}
```
`history[date]` shape (written by `rollupDay`/`toggleHabit`/`maybeAllClear`/`rollover`):
`{due, done, ac:0|1, paid?:1, bonus?, coins, h?:health, hatched?:1, frozen?:1}`.
`garden` = array of owned plot ids; `gardenLog[id]` = date planted.
`achievements` = array of unlocked ids; `achLog[id]` = date unlocked.

`newHabit(o)` (line 1333) — per-habit shape, `Object.assign(defaults, o)`:
```js
{
  id:0, name:'', cat:'custom', sched:'daily', days:[1,2,3,4,5],
  perWeek:3, remind:'', cur:0, best:0, coins:0, archived:false, created:today(),
  logs:{},   // date -> 'done' (also 'frozen' written by rollover)
  rec:{},    // date -> {c: coins granted, hp: health granted}  (undo ledger)
  void:{}    // date -> grant of a check that was undone; replayed if re-checked
}
```

### 3.12 `levelInfo()` — XP/level derived from lifetime coins — line 1344
```js
xp = max(0, lifetimeCoins); lvl=1; need=160;
while(xp>=need){ xp-=need; lvl++; need = 10*lvl*lvl + 50*lvl + 100; }
return {lvl, xp, need};
// L1→L2 needs 160; then need(L)=10L²+50L+100 for L≥2 (L2→3 needs 240, L3→4 needs 340, …)
```

### 3.13 Demo seed — `freshState(demo)` + `simulateHistory` — lines 1355, 1379
`freshState(false)` = `blankState()`. `freshState(true)` sets up the mid-journey demo:
- `profile.name = "Haryanto"`.
- `pet`: `species:'fox', name:"Pip", hatchState:'hatched', hatchProgress:3, seenHatch:true, ownedSpecies:['dog','cat','fox'], ownedClothes:[1,2], clothesId:0, food:{1:2,2:1,3:0,4:1,5:0}, lastCollect:Date.now()-3.4*3600*1000, hatchedOn:dstrOff(-(SEED_DAYS-3))` (= -53 days).
- 6 seed habits, `nextId=7`:
  1. `Drink 8 glasses of water` cat:water daily remind 09:00 created -56d
  2. `Move for 20 minutes` cat:exercise weekdays days[1..5] remind 17:30 created -56d
  3. `Read before bed` cat:read daily remind 21:30 created -56d
  4. `Lights out by 11` cat:sleep daily remind 22:45 created -42d
  5. `No phone in bed` cat:nophone daily remind 21:00 created -35d
  6. `Long run` cat:run weekly perWeek:2 remind 07:00 created -28d

`simulateHistory(st)` replays SEED_DAYS through the **real** rules (deterministic RNG `rng(20260801)`), key numbers verbatim:
- `reliability = {1:.95, 2:.88, 3:.86, 4:.90, 5:.96, 6:.82}`; base fallback `.85`.
- `warmup = i>SEED_DAYS-12 ? .72 : 1` (first ~12 days).
- `slump = (i<=16 && i>=7) ? .18 : 1`.
- `peak = (i<=36 && i>=26)` (forced completion); `finish = i<=6` (forced completion).
- effective reliability `rel = min(.985, (reliability[id]||.85)+progress*.08) * warmup * slump`.
- per check-off coins: `core = 5 + min(floor(cur/3),5) + (sched==='daily'?1:0)`; `extra = (sprout?1:0) + round(core*(health>=75?.25:health>=45?.10:0)) + round(core*(orchard?.20:0))`.
- all-clear bonus: `bonus = round((15 + min(streak,30)) * (1 + (berry?.10:0) + (orchard?.20:0)))`; on all-clear `streak++`, `best=max`, `allClearCount++`; at `allClearCount===3` sets `pet.hatchedOn`.
- decay: `decay = max(6, 12 - (can?2:0) - (fruit?2:0))`; `health = clamp(0..100, health - decay + round(18*doneN/dueN))`.
- purchases along the way: fox at bank>1000 (−600), c1 at bank>500 (−80), c2 at bank>700 (−150), food treat every 3rd day (−8, mealsFed++), garden plots bought when `bank-cost>=120`.
- **Today** is left live & partly finished: first up-to-3 due habits are pre-checked. Then fixed injections: `idleCollected=640` (`src.idle=640`), `src.gift=100`, `profile.freezes=1`. Final garden top-up while `bank-cost>=340`. `profile.coins=round(bank)`, `lifetimeCoins=round(lifetime)`, `freezeWeek=isoWeek(today)`. `history[today].paid=0` (today's all-clear is NOT pre-paid → live). Runs `checkAch(true)` silently.

### 3.14 Scheduling — lines 1471–1498
```js
isDue(h,d,st):
  false if h.archived
  false if h.created && daysBetween(h.created,d) < 0     // not created yet
  'daily'    → true
  'weekdays' → (h.days||[]).includes(dow(d))
  'weekly'   → h.logs[d]==='done' ? true : weekDone(h,d) < (h.perWeek||3)
  else true
weekDone(h,d): count of 'done' logs from weekStart(d) through d (≤7 days, stops past d)
dueList(d,st)  = habits.filter(isDue).sort(by id asc)
doneCount(d,st)= habits.filter(h.logs[d]==='done').length
dayGoal(d,st)  = g=profile.dailyGoal; due=dueList.length;
                 g>0 ? min(g, max(1,due)) : due
rollupDay(st,d): writes history[d]={due, done, ac:(due>0 && done>=goal)?1:0} merged over prev
```

### 3.15 Garden perks — lines 1503–1513
```js
planted(id)  = S.garden.includes(id)
perks()      = accumulate over planted GARDEN entries:
   {perCheck:Σ, cap:Σ, rate:Σ, decay:Σ, allClear:Σ, all:Σ, freeze: any g.freeze}
nextPlot()   = first GARDEN entry not planted
gardenPct()  = round(S.garden.length / GARDEN.length * 100)
```

### 3.16 Pet mood / stage / health — lines 1518–1539
```js
moodOf(h):        h>=75 {t:"Happy",  k:"happy",  bonus:.25}
                  h>=45 {t:"Content",k:"content",bonus:.10}
                  h>=20 {t:"Tired",  k:"tired",  bonus:0}
                  else  {t:"Hungry", k:"hungry", bonus:0}
bonusPct()      = round(moodOf(pet.health).bonus * 100)     // 25 / 10 / 0
petStage():       b=max(profile.best,profile.streak); s=1;
                  for i in 1..4: if b>=STAGE_GATE[i] s=i+1;
                  return hatchState==='hatched' ? s : 1     // egg is always stage 1
stageName(n)    = STAGES[min(4,max(0,(n||1)-1))]
decayPerDay()   = max(6, 12 - perks().decay)
idleRate()      = 1 * (1 + perks().rate)          // coins per hour
idleCap()       = 50 + perks().cap
idlePending():    0 if not hatched;
                  hrs=(Date.now()-lastCollect)/3_600_000;
                  max(0, min(idleCap(), floor(hrs*idleRate())))
idleFull()      = idlePending() >= idleCap()
```
`COIN_SPOTS` (12 fixed positions, line 1547): `{l:%, b:px, s:sizePx, r:rotDeg}` —
`{26,48,28,0} {16,52,24,-12} {72,48,28,11} {80,54,23,-9} {20,62,21,14} {76,62,22,5} {33,44,20,-7} {64,44,21,16} {11,44,22,8} {86,44,22,-14} {29,58,18,0} {69,56,19,-5}`.
`coinPile()` shows `n = min(12, max(1, ceil(pending/4)))` coins; coin `i` gets `animation-delay:(i*0.05)s`.

### 3.17 Economy — lines 1564–1590
```js
coinsForCheck(h):
  base=5; streakBonus=min(floor(h.cur/3),5); hardBonus=(h.sched==='daily'?1:0);
  core=base+streakBonus+hardBonus;                       // 5..11
  extra = perks().perCheck + round(core*(moodOf(pet.health).bonus + perks().all));
  return {core, extra, total: core+extra}
allClearBonus():
  round((15 + min(profile.streak,30)) * (1 + perks().allClear + perks().all))
addCoins(n,src):  coins=max(0,coins+n); if n>0 { lifetimeCoins+=n; if src bucket exists stats.src[src]+=n }
spendCoins(n,bucket): coins=max(0,coins-n); stats.spent[bucket]+=n
refundCoins(n,src):   coins=max(0,coins-n); lifetimeCoins=max(0,-n); stats.src[src]=max(0,-n)  // exact reversal
```

---

## 4. INTERACTIONS (tap handlers defined in this section)

### 4.1 `toggleHabit(id, ev)` — line 1597  (the core check-off, wired to the habit ring)
- If already `done` today → delegates to `uncheckHabit(h,t)` and returns.
- Grant source: if `h.void[t]` exists (checked→undone earlier today) → **replay** the exact prior grant (`total=voided.c`, `hp=min(voided.hp, 100-health)`), then `delete h.void[t]`. Otherwise compute fresh: `total=coinsForCheck(h).total`; `hpWant = hatched ? round(18/max(1,dueList.length)) : 0`; `hp=min(hpWant, 100-health)`.
- Mutates: `logs[t]='done'`; `cur++`; `best=max`; `coins+=total`; `rec[t]={c:total,hp}`; `stats.checkoffs++`; `addCoins(total,'check')`; `health=min(100,health+hp)`; `rollupDay`; `history[t].coins+=total`.
- Effects fired: adds `.pop` class to the tapped ring (re-triggered via reflow) → `@keyframes hpop`; `coinFly(el, total)`; `save()`; `renderAll()`; `toast(\`+${total} coins for ${name}\`, ASSETS.coin)`; `bumpCoins()` (coin pill `@keyframes bump`); `checkAch()`; then `setTimeout(maybeAllClear, 620)`.

### 4.2 `uncheckHabit(h, t)` — line 1629  (undo a check)
- `refundCoins(rec.c,'check')`; `h.coins-=rec.c`; `health-=rec.hp`; `cur--`; `stats.checkoffs--`; `stats.undos++`.
- Records the undo in `h.void[t]={c:rec.c, hp:rec.hp}` for exact replay; deletes `rec[t]` & `logs[t]`; `history[t].coins-=rec.c`; `rollupDay`; `unpayDay(t)`.
- `save()`; `renderAll()`; `toast(rec.c ? \`Unchecked. ${rec.c} coins returned.\` : 'Unchecked.')`.

### 4.3 `unpayDay(t)` — line 1647  (revoke an already-paid all-clear if it no longer qualifies)
If `history[t].paid` and day no longer meets goal: `refundCoins(bonus,'clear')`; `coins-=bonus`; `streak=max(0,streak-1)`; if pre-hatch and `rec.hatched` → `hatchProgress=max(0,-1)`; delete `paid/bonus/hatched`.

### 4.4 `maybeAllClear()` — line 1658  (fired 620ms after a check)
- Guards: skip if `dueList.length===0` or `done<goal` or `history[t].paid` already set.
- `bonus=allClearBonus()`; `addCoins(bonus,'clear')`; `streak++`; `best=max`; `rollupDay`; sets `history[t]={paid:1, bonus, coins+=bonus}`.
- Pre-hatch: `hatchProgress=min(3, +1)`, `rec.hatched=1`; if reaches ≥3 → `hatched=true`.
- If `hatched` → `renderAll()`, `setTimeout(startHatch, 400)` (opens the hatch/nursery overlay).
- Else → `showReward({title:"Day complete", sub:\`Everything due today is done. Streak is now ${streak} days.\`, icon:trophy, coins:bonus, right:{v:streak, l:'Day streak'}, note:(hatched ? \`${name} is fed and your streak is safe.\` : \`The egg is warmer. ${3-hatchProgress} more all-clear day/days to go.\`), goal: nextPlot()? \`${money(coins)} of ${money(nextPlot().cost)} coins toward ${nextPlot().name}\` : 'Your garden is fully grown'})`, then `renderAll()`, `checkAch()`.

### 4.5 `collectIdle()` — line 1540  (tap the `.coinpile` button)
- `amt=idlePending()`; if `<=0` → `toast('The jar is still empty. Check back later.')` and return.
- Else `addCoins(amt,'idle')`; `lastCollect=Date.now()`; `stats.idleCollected+=amt`; `toast(\`${pet.name} foraged ${amt} coins\`, ASSETS.coin)`; `confetti()`; `bumpCoins()`; `save()`; `renderAll()`.
- Button markup includes `onclick="event.stopPropagation();collectIdle()"` so tapping the pile does not bubble to the room.

### 4.6 `rollover()` — line 1694  (deterministic catch-up, runs on every load)
Walks each missed day `cursor<today` (guarded ≤400 iterations):
- `rollupDay(d)`; for `due>0` days: if `ac` and not `paid` → `streak++`, `best=max`, `paid=1`, pre-hatch `hatchProgress=min(3,+1)`; else if a Streak Freeze is available (`freezes>0 && streak>0`) → consume one (`freezes--`, `stats.freezesUsed++`, `rec.frozen=1`, `S.frozeYesterday=d`); else `streak=0`.
- Per habit that day: if not done and `rec.frozen` → `logs[d]='frozen'`, else reset `cur=0`.
- If hatched: `health = clamp(0..100, health - decayPerDay() + round(18*done/due))`; update `stats.healthy`/`bestHealthy`; `rec.h=health`.
- Weekly perk: if `perks().freeze` and the ISO week advanced → `freezes=min(3,+1)`, update `freezeWeek`.
- Ends: `S.day=today`; `rollupDay(today)`; if pre-hatch and `hatchProgress>=3` → `seenHatch=false`; `save()`. Returns count of days moved.

### 4.7 `checkAch(silent)` / `drainAch()` — lines 1773, 1784
`checkAch` appends any newly-met achievement id to `S.achievements` + `achLog[id]=today()`; unless `silent`, queues it; if queue non-empty and no reward open, `setTimeout(drainAch, 760)`. `drainAch` shifts one and fires `showReward({title:"Badge unlocked", sub:name, icon:(art→ART[art] | img→ASSETS[img] | ic), stars:rar, note:desc, goal:\`${count} of ${total} badges collected\`})`.

### 4.8 `setTheme(id)` / `applyTheme()` — lines 1824, 1818
`setTheme`: premium theme while `!premium` → `closeScreen('profile')` then `setTimeout(openPremium,240)` (upsell). Else set `profile.theme`, `applyTheme()`, `save()`, `renderProfile()`, `toast(\`${name} theme applied\`)`. `applyTheme` sets/removes `data-theme` on `<html>` (`hatch` = remove attribute → default `:root`).

### 4.9 `switchTab(t)` / `renderAll()` — lines 1843, 1831
`switchTab` sets `S.tab`, toggles `.on` on `.tabbar button[data-tab]`, shows the matching `tab*` host (`tabToday/tabHabits/tabPet/tabGarden`) with a `.fade-in`, then `renderAll()` + `save()`. `renderAll` re-runs `applyTheme()` and the render fn for the active tab / any open overlay screen.

### 4.10 Screen show/close helpers — lines 1800–1815
`show(id)` (hard swap `.screen.active`), `openScreen(id)`/`prepOpen` (adds `.active .slide-up`), `closeSlide(id,after)` (adds `.slide-down`, removes `.active` after 250ms, token-guarded against races), `closeScreen(id)` = `closeSlide` then `renderAll()`.

---

## 5. NOTES (subtleties & conditional behavior)

1. **Pre-hatch vs post-hatch is the biggest fork.** `roomStage()` swaps whole subtrees:
   - Pre-hatch: `.moodtag` reads **"Eggbound"** (egg icon), renders `eggBlock()`, **no** coin pile (idle earning is disabled — `idlePending()` returns 0 unless `hatchState==='hatched'`), **no** `.stagetag`. `petStage()` forces stage 1.
   - Post-hatch: `.moodtag` shows live mood + colored `.mooddot`; `.stagetag` shows sparkle + stage name; `petBlock()` renders the species; `coinPile()` appears only when idle coins are pending.
2. **Egg art is progress-driven** (`eggBlock`): `hatchProgress>=3 → eggHatch (+.ready fast wobble)`, `>=1 → eggCrack`, else `eggWhole`. Hatch needs **3 all-clear days** (`hatchProgress` capped at 3).
3. **Health can never reach a fatal state in normal play** — `moodOf` floors at "Hungry" and health is clamped `0..100`; the seed line "Health never hits zero. Nothing here can die." is aspirational copy (health *can* mathematically hit 0 via decay, but nothing dies).
4. **Undo is exact & replay-safe.** Every check writes `rec[date]={c,hp}`; undo refunds precisely and stores the grant in `void[date]`; re-checking the same day replays the void grant instead of recomputing, so a check/uncheck loop nets to zero (wallet, lifetime, streak, hatch step, health all unwind via `refundCoins`/`unpayDay`).
5. **Coin math ranges.** Per-check `core` is **5–11** (`5 + min(floor(cur/3),5) + dailyBonus`). Mood multiplier applies only to `core` (0/10/25%), plus garden `perCheck` (+1 flat from Sprout) and global `all` (+20% from Orchard). All-clear bonus `= round((15+min(streak,30))*(1+allClear+all))` → base 15–45 before garden multipliers.
6. **Streak Freeze** has two sources: consumed automatically in `rollover` on a missed due-day (if `freezes>0 && streak>0`), and granted weekly when the Young Sapling perk (`freeze:true`) is planted (`freezes` capped at 3). `freezeWeek`/`isoWeek` gate the weekly grant. A frozen day writes `logs[d]='frozen'` and `history[d].frozen=1`; frozen days extend a run in `streakRuns()` without adding length.
7. **`dailyGoal` partial-goal mode.** When `profile.dailyGoal>0`, an "all-clear" needs only `min(goal, max(1,due))` done, not every due habit (`dayGoal`/`rollupDay`). Default `0` = must clear everything due.
8. **`weekly` schedule is self-healing:** a weekly habit stays due until `weekDone < perWeek`, but a day already `done` still reports due (so it renders checked). `dueList` sorts by `id` ascending — this fixes row order across the app.
9. **Theme behavior:** themes only remap the accent CSS custom-property family (`--teal*`, `--orange*`, `--good`, `--sky`, `--tint*`, `--glow`, shadows). Paper/cards/artwork (`--cream`, `--card`, room art hex, mood-dot hex, `.stagetag`/`.pilebadge`/`.moodtag` literal rgba backgrounds) are **fixed** and do not change with theme. Free "Hatch" theme removes the `data-theme` attribute; the other four are premium-gated and trigger the upsell in `setTheme`.
10. **Determinism/persistence.** `save()` serializes the whole `S` to `localStorage['habithatch_v2']`; `load()` only accepts objects with `v===2` (else returns null → fresh/onboarding). `rollover()` and `simulateHistory()` replay through the identical rules so the dashboard is always internally consistent; both are idempotent-safe (rollover is guarded and only advances `S.day` forward).
11. **Reduced motion.** `prefers-reduced-motion: reduce` kills the breathe/wobble/coin animations (`.petart,.eggart,.gardensun,.gardencloud,.pilecoin img`) and short-circuits `coinFly` entirely.
12. **`money(n)`** = `Number(n||0).toLocaleString('en-US')` → thousands separators (e.g. `10,000`). `esc()` HTML-escapes `& < > "` for any user text (habit/pet names) interpolated into markup.
13. **Splash quote** is a random pick from `SPLASH_LINES` (10 lines, line 1940) — they double as the canonical rules summary (coin range "5 to 11", "12 health" decay, "7, 21, 50 and 100" stage gates, etc.). `$('splashLogo').innerHTML = ART.eggWhole`.
14. **Onboarding state** (`ob = {step, picks, species:'fox', name:''}`, `OB_STEPS=4`) is separate from `S` and only materializes into a real state via `freshState`/`blankState` on completion.
