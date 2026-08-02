# Companion / Pet screen — build contract (proto-companion)

Source: `prototype/habithatch_v1.html`. Renderers `renderPet()` (L2598-2695) and
`renderEggRoom()` (L2696-2737). This screen is the `pet` tab; both renderers write into
`$('tabPet').innerHTML`.

`renderPet()` is a fork on the very first line:

```js
function renderPet(){
  if(S.pet.hatchState!=='hatched'){ renderEggRoom(); return; }
  ...
}
```

- `hatchState !== 'hatched'`  → **EGG ROOM** variant (`renderEggRoom`).
- `hatchState === 'hatched'`  → **COMPANION** variant (rest of `renderPet`).

Initial/default state (L1320-1322): `hatchState:'egg'`, `hatchProgress:0`, `health:100`,
`clothesId:0`, `ownedClothes:[]`, `species:'fox'`, `name:""`, `lastCollect:Date.now()`.
Demo/seed override (L1359-1361): `hatchState:'hatched'`, `hatchProgress:3`, `name:"Pip"`,
`ownedClothes:[1,2]`, `clothesId:0`, `lastCollect:Date.now()-3.4h`.

---

## 1. VISUAL TREE

### 1a. COMPANION variant (`renderPet`, hatched)

Locals computed up front (L2600-2603):
`mood=moodOf(S.pet.health)`, `bp=bonusPct()`, `stg=petStage()`, `owned=S.pet.ownedClothes`,
`nextGate=STAGE_GATE[stg]||null`, `best=Math.max(S.profile.best,S.profile.streak)`.

```
div.topbar
├─ button.hi-av                     onclick="openProfile()"
│    └─ span.avwrap > span.avin > {avatarArt() svg/img}     (44px)
├─ div.hello  [style="flex:1"]
│    ├─ div.k                       text: "Your companion"
│    └─ div.n                       text: {esc(S.pet.name)}      e.g. "Pip"
└─ span.coinpill
     ├─ img[src=ASSETS.coin]
     └─ text: {money(S.profile.coins)}                          e.g. "1,240"

{roomStage(292)}  — see §1c (room, mood tag, stage tag, pet, coin pile)

div.pad  [style="padding-top:14px"]

  ── HEALTH CARD ──
  div.card  [style="padding:16px"]
  ├─ div.row.spread  [style="margin-bottom:10px"]
  │    ├─ div  [style="font-weight:800;color:var(--teal-ink)"]  text: "Health"
  │    └─ div.muted [style="font-size:12px;font-weight:600"]
  │         text: "−{decayPerDay()}/day · habits restore it"    default: "−12/day · habits restore it"
  │         (NOTE the character is U+2212 MINUS "−", middot "·")
  ├─ div.health {+ " low" if S.pet.health<40}
  │    ├─ span.heart > {ic('heart',16)}
  │    ├─ div.bar > div.fill  [style="width:{S.pet.health}%"]
  │    └─ span.hval  text: "{S.pet.health}/100"                 e.g. "100/100"
  ├─ div.carerow
  │    ├─ button.carebtn  onclick="openFeed()"
  │    │     ├─ img.cic[src=ASSETS.apple]
  │    │     └─ span.clbl  text: "Feed"
  │    ├─ button.carebtn  onclick="openShop('clothes')"
  │    │     ├─ img.cic[src=ASSETS.wardrobe]
  │    │     └─ span.clbl  text: "Wardrobe"
  │    └─ button.carebtn  onclick="openShop('pets')"
  │          ├─ img.cic[src=ASSETS.petIcon]
  │          └─ span.clbl  text: "Adopt"
  └─ div.growthnote  [style="margin-top:12px"]
       {ic('info',13)} + one of:
         health>=75 : "{esc(name)} is thriving. Nothing here can die. Health only changes the mood and your coin bonus."
         else       : "Finish today's habits and {esc(name)} recovers on its own. Treats are a shortcut, never a requirement."

  ── GROWTH ──
  div.shead
  ├─ h3  text: "Growth"
  └─ span.muted [style="font-size:12px;font-weight:700"]  text: "Stage {stg} of 5"

  div.card  [style="padding:16px"]
  ├─ div.row.spread  [style="margin-bottom:10px"]
  │    ├─ div
  │    │    ├─ div.jcardh  text: {stageName(stg)}              e.g. "Baby"
  │    │    └─ div.jcards
  │    │         nextGate ? "{nextGate-best} more streak days to {stageName(stg+1)}"
  │    │                  : "{esc(name)} has reached the final stage"
  │    └─ span.bonuspill  {flameSVG(14)} + text: "{best} best"   e.g. "12 best"
  ├─ {segbar(stg,5)}                                             div.segbar > 5×span.seg (first stg get .on)
  ├─ div.seglabels
  │    STAGES.map → <b class="{on if i<stg}">{s}</b>
  │    → "Baby" "Young" "Grown" "Prime" "Legend"
  └─ div.jgrowthnote
       {ic('sparkle',12)} "Growth is gated on your best overall streak, so {esc(name)}'s body is a permanent record of your most consistent run."

  ── FORAGING ──
  div.shead > h3  text: "Foraging"

  div.card.earncard
  ├─ div.earnlvl
  │    ├─ span.earnbadge > img[src=ASSETS.coin]
  │    └─ span
  │         ├─ span.bondh   text: "{idleRate()fmt} coins / hour"    default: "1 coins / hour"
  │         └─ span.bondsub text: "{esc(name)} forages while you're away, into a {idleCap()}-coin jar"
  │                                                                  default cap 50
  └─ (idlePending() > 0)
       ? button.btn.block  [style="margin-top:13px"]  onclick="collectIdle()"
           ├─ img.coinmini[src=ASSETS.coin]
           └─ text: "Collect {idlePending()} coins" + ({idleFull()} ? " · jar full" : "")
       : div.bondempty  text: "The jar is empty. {esc(name)} will keep gathering while you're gone."

  ── WHAT {name} DOES FOR YOU ──
  div.shead > h3  text: "What {esc(name)} does for you"

  div.card  [style="padding:4px 16px"]
  ├─ div.benrow                          (Foraging)
  │    ├─ div.benic  [style="color:var(--yellow-2)"] > img[src=ASSETS.coin, 22×22]
  │    ├─ div.benmain
  │    │    ├─ div.bent  text: "Forages while you're away"
  │    │    └─ div.bend  text: "Garden perks raise both the rate and the size of the jar."
  │    └─ div.benval.bonus  text: "{idleRate()fmt}/hr"          default: "1/hr"
  ├─ div.benrow                          (Check-off bonus)
  │    ├─ div.benic  [style="color:var(--orange)"] > {ic('bolt',20)}
  │    ├─ div.benmain
  │    │    ├─ div.bent  text: "Check-off bonus"
  │    │    └─ div.bend
  │    │         bp>0 : "{esc(name)} is {mood.t.toLowerCase()}, so every check-off pays extra."
  │    │         else : "Get health to 45+ and {esc(name)} starts adding a bonus."
  │    └─ div.benval.{bonus if bp>0 else off}  text: bp>0 ? "+{bp}%" : "0%"
  └─ div.benrow  [style="border-bottom:none"]   (Streak Freeze)
       ├─ div.benic  [style="color: {freezes>0 ? var(--good) : var(--muted)}"] > {ic('snow',20)}
       ├─ div.benmain
       │    ├─ div.bent  text: "Streak Freeze"
       │    └─ div.bend
       │         freezes>0            : "One missed day won't cost you the streak."
       │         else planted('sapling') : "Refills every week from your Young Sapling."
       │         else                 : "Plant the Young Sapling to earn one every week."
       └─ div.benval.{on if freezes>0 else off}  text: "{S.profile.freezes}"

  ── WARDROBE ──
  div.shead
  ├─ h3  text: "Wardrobe"
  └─ span.see  onclick="openShop('clothes')"  text: "Get more"

  div.shopgrid  [style="padding:0"]
  ├─ div.shopcard  onclick="equip(0)"          (the "no outfit" card, always present)
  │    ├─ img.art[src=ASSETS.petIcon, style="opacity:.7"]
  │    ├─ div.cn  text: "No outfit"
  │    ├─ div.cd  text: "Natural look"
  │    └─ div.buy.{equipped if clothesId===0 else equip}  text: clothesId===0 ? "Wearing" : "Wear"
  │
  ├─ owned.length
  │  ? owned.map(id): c=CLOTHES.find(id); skip if !c; on=(clothesId===id)
  │      div.shopcard  onclick="equip({id})"
  │        ├─ img.art[src=ASSETS[c.img]]
  │        ├─ div.cn  text: {c.name}            e.g. "Cyan T-shirt"
  │        ├─ div.cd  text: "Cosmetic"
  │        └─ div.buy.{equipped if on else equip}  text: on ? "Wearing" : "Wear"
  │  : (EMPTY STATE — single card)
  │      div.shopcard  onclick="openShop('clothes')"  [style="justify-content:center;min-height:150px"]
  │        ├─ div.benic  [style="color:var(--line-2)"] > {ic('shirt',30)}
  │        ├─ div.cn  [style="margin-top:6px"]  text: "No outfits yet"
  │        └─ div.cd  text: "Buy one in the shop"
```

### 1b. EGG ROOM variant (`renderEggRoom`)

Locals (L2697): `p=S.pet.hatchProgress` (0-3), `sp=spec(S.pet.species)`.

```
div.topbar
├─ button.hi-av  onclick="openProfile()"  > span.avwrap>span.avin>{avatarArt()}  (44px)
├─ div.hello  [style="flex:1"]
│    ├─ div.k  text: "The nursery"
│    └─ div.n  text: "Your egg"
└─ span.coinpill  > img[src=ASSETS.coin] + text: {money(S.profile.coins)}

{roomStage(292)}  — egg variant: "Eggbound" mood tag + egg art, NO stage tag, NO coin pile (see §1c)

div.pad  [style="padding-top:14px"]

  ── WARMING UP CARD ──
  div.card  [style="padding:18px 16px"]
  ├─ div.row.spread  [style="margin-bottom:12px"]
  │    ├─ div  [style="font-weight:800;color:var(--teal-ink);font-size:15px"]  text: "Warming up"
  │    └─ span.chip.warn  text: "{p} of 3 stages"                e.g. "0 of 3 stages"
  ├─ {segbar(p,3)}                                                div.segbar > 3×span.seg (first p .on)
  ├─ div.seglabels
  │    ├─ <b class="{on if p>=1}">Whole</b>
  │    ├─ <b class="{on if p>=2}">First crack</b>
  │    └─ <b class="{on if p>=3}">Hatching</b>
  ├─ div.jgrowthnote
  │    {ic('info',12)} "Each day you clear every habit that was due, the egg advances one stage. Miss a day and nothing is lost. The egg just waits."
  └─ (p>=3) ? button.btn.block  [style="margin-top:14px"]  onclick="startHatch()"
                {ic('sparkle',16)} + text: "It's time. Hatch it"
            : (nothing)

  ── WAITING INSIDE ──
  div.shead > h3  text: "Waiting inside"

  div.card  [style="padding:16px;display:flex;gap:14px;align-items:center"]
  ├─ div  [inline style below]  (blurred species preview box)
  │      style="width:74px;height:74px;flex:none;border-radius:16px;background:var(--cream);
  │             border:1px solid var(--line-2);display:flex;align-items:flex-end;
  │             justify-content:center;overflow:hidden;opacity:.35;filter:blur(1.5px)"
  │    └─ sp.kind==='svg' ? div.fit[style="height:70px"]>{ART[sp.art]}
  │                       : img[src=ASSETS[sp.img], style="height:70px"]
  └─ div
       ├─ div  [style="font-weight:800;color:var(--teal-ink)"]  text: "A {sp.name.toLowerCase()}, probably"
       └─ div.smallnote  [style="margin-top:2px"]  text: "{sp.meta}. You'll get to name it the moment the shell breaks."

  ── WHILE YOU WAIT ──
  div.shead > h3  text: "While you wait"

  div.card  [style="padding:4px 16px"]
  ├─ div.benrow
  │    ├─ div.benic  [style="color:var(--orange)"] > {ic('check',20)}
  │    ├─ div.benmain
  │    │    ├─ div.bent  text: "Coins still stack up"
  │    │    └─ div.bend  text: "Every check-off pays, hatched or not."
  │    └─ div.benval.bonus  text: {money(S.profile.coins)}
  └─ div.benrow  [style="border-bottom:none"]
       ├─ div.benic  [style="color:var(--grass)"] > {ic('sprout',20)}
       ├─ div.benmain
       │    ├─ div.bent  text: "The garden is already open"
       │    └─ div.bend  text: "Plant your first plot for a permanent perk."
       └─ button.benval.on  onclick="switchTab('garden')"  text: "Open"
```

### 1c. The room stage — `roomStage(292)` (L1901-1913)

Called identically by both variants: `roomStage(292)`.

```
div.room  [style="height:292px"]
├─ {roomArt()}                          → svg.roomart  (see §1d)
├─ (hatched)
│    ? div.moodtag                       {mooddot .{mood.k}} + text {mood.t}   e.g. "● Happy"
│      div.stagetag                      {ic('sparkle',12)} + {stageName(petStage())}   e.g. "✦ Baby"
│    : div.moodtag                       {ic('egg',14)} + text "Eggbound"
├─ (hatched) ? petBlock(Math.round(292*0.80)=234) : eggBlock()
├─ (hatched) ? coinPile() : ''
└─ {extra||''}                           (not passed here → empty)
```

`petBlock(h)` (L1889-1895), called `petBlock(234)`:
```
div.petshadow
div.petstage  [style="height:234px"]
└─ div.petwrap
   └─ {speciesArt(S.pet.species, mood.k, true)}
```
`speciesArt(id, cls, wear)` (L1884-1888) →
```
div.petart.{cls}         cls = mood.k ∈ {happy|content|tired|hungry}
  ├─ {ART[s.art]}  (kind svg)   OR   img[src=ASSETS[s.img], alt=s.name]  (kind img)
  └─ {wearLayer(id)}  if wear && clothesId != 0
```
`wearLayer(id)` (L1878-1883): if `S.pet.clothesId` set → outfit=CLOTHES.find(clothesId);
`w=spec(id).wear || {w:54,t:53}` →
`<img class="petoutfit" src="{ASSETS[outfit.img]}" style="width:{w.w}%;top:{w.t}%" alt="">`

`eggBlock()` (L1896-1900):
```
div.petshadow
div.eggstage
└─ div.eggart{+" ready" if p>=3}
   └─ {art}    art = p>=3?ART.eggHatch : p>=1?ART.eggCrack : ART.eggWhole
```

`coinPile()` (L1553-1559): renders only if `idlePending()>0`. `n=min(12, max(1, ceil(pending/4)))`
coin sprites placed from `COIN_SPOTS`:
```
button.coinpile  onclick="event.stopPropagation();collectIdle()"  aria-label="Collect coins"
  ├─ n × span.pilecoin [style="left:{l}%;bottom:{b}px;transform:rotate({r}deg)"]
  │      └─ img[src=ASSETS.coin, style="width:{s}px;animation-delay:{i*0.05}s"]
  └─ span.pilebadge  > img[src=ASSETS.coin,15×15] + text "{pending} to collect"
```
`COIN_SPOTS` (L1547-1552, `{l,b,s,r}` = left%, bottom px, size px, rotate deg):
`{26,48,28,0} {16,52,24,-12} {72,48,28,11} {80,54,23,-9} {20,62,21,14} {76,62,22,5} {33,44,20,-7} {64,44,21,16} {11,44,22,8} {86,44,22,-14} {29,58,18,0} {69,56,19,-5}`

### 1d. `roomArt()` (L1854-1877)

Fixed decorative SVG, `viewBox="0 0 220 132" preserveAspectRatio="xMidYMid slice"`, `aria-hidden`.
Contents (verbatim intent): full-bleed grass rect `#A0B559`; scattered dot cluster `#8E9F4C` @ .28;
wood floor rect `#DCC79A` (y=84 h=48) with trim lines; a window (sun/sky: `#F2EADA`, `#BFE3F3`,
`#A9D8ED`); a framed picture (`#3A2E1D` frame, `#F2EADA` mat, hill `#A7C34F`, sun dot `#F4B942`);
a potted plant (stem `#7FA23C`, leaves `#A7C34F`/`#B7D25E`, pot `#C9773A`); two dirt ellipses
`#D2BB8C`@.55 and `#C9B084`@.45. Transcribe the SVG verbatim from source for pixel fidelity.

---

## 2. STYLE TABLE

All values below are copied verbatim. CSS custom properties (default `hatch` theme, `:root` L9-24):
```
--teal:#0C4C60; --teal-2:#12667F; --teal-ink:#0B2530;
--orange:#E28A4B; --orange-2:#C9773A;
--yellow:#FFDA7C; --yellow-2:#F4B942;
--coin-ink:#1E4B5F; --ink:#2D2F41; --muted:#8B897E;
--cream:#FBF6EC; --card:#FFFFFF; --line:#EFE6D6; --line-2:#E4D8C2;
--grass:#A7C34F; --sky:#BFE3F3; --room-bg:#A0B559; --floor:#DCC79A;
--good:#1E7F91; --danger:#E5654B; --pink:#E68FB0;
--tint:#FFF7EF;  --tint-2:#EDE7F6 (see note*);  --glow:rgba(226,138,75,.5);
--shadow:0 10px 16px rgba(12,76,96,.10);
--shadow-sm:0 4px 12px rgba(12,76,96,.08);
--r-sm:12px; --r-md:16px; --r-lg:20px; --r-pill:999px;
--nav-h:74px;
```
\*`--tint-2` is declared as `var(--tint-2)` at :root (self-referential / effectively unset in the
default `hatch` theme; browsers treat it as invalid → falls back to initial). Every theme override
(dusk/forest/ocean/ember) sets a real value, e.g. dusk `#EDE7F6`, ocean `#E1F0F3`. Treat the base
`hatch` `--tint-2` as an unresolved cool wash; the visible values come from a theme. For a concrete
RN build use the per-theme values in §5 THEME BEHAVIOR.

### Shell / top bar

**.pad** — `padding:16px 16px calc(var(--nav-h) + 20px);`  (here overridden inline to `padding-top:14px`)

**.card** — `background:var(--card);border-radius:var(--r-lg);box-shadow:var(--shadow);border:1px solid var(--line);`

**.row** — `display:flex;align-items:center;`
**.spread** — `justify-content:space-between;`
**.muted** — `color:var(--muted);`

**.topbar** — `padding:max(20px, calc(12px + env(safe-area-inset-top))) 16px 8px;display:flex;align-items:center;justify-content:space-between;gap:10px;`
**.hello .k** — `font-size:12px;color:var(--muted);font-weight:600;line-height:1;`
**.hello .n** — `font-size:20px;font-weight:800;color:var(--teal-ink);line-height:1.15;`
**.hi-av** — `flex:none;`
**.hi-av img** — `width:44px;height:44px;border-radius:50%;object-fit:cover;border:2.5px solid #fff;background:#DDEDE9;box-shadow:var(--shadow-sm);`
**.hi-av:active** — `transform:scale(.94);`

**.avwrap** — `display:inline-flex;border-radius:50%;overflow:hidden;border:2.5px solid #fff;background:#DDEDE9;box-shadow:var(--shadow-sm);flex:none;align-items:flex-end;justify-content:center;`
**.avwrap .avin** — `display:flex;align-items:flex-end;height:122%;`
**.avwrap svg,.avwrap img** — `height:100%;width:auto;display:block;`
(avatar uses `.avwrap`/`.avin` via `avatarImg(44)`; size set inline `width/height:44px`.)

**.coinpill** — `display:inline-flex;align-items:center;gap:6px;background:#fff;border:1.5px solid var(--line-2);padding:6px 12px 6px 7px;border-radius:var(--r-pill);font-weight:700;color:var(--coin-ink);box-shadow:var(--shadow-sm);`
**.coinpill img** — `width:22px;height:22px`
**.coinpill.bump** — `animation:bump .5s ease;`  · `@keyframes bump{0%,100%{transform:none}30%{transform:scale(1.16)}}`
**.coinmini** — `width:16px;height:16px;vertical-align:-3px;margin-right:5px;`

### Section headers

**.shead** — `display:flex;align-items:center;justify-content:space-between;margin:18px 2px 10px;`
**.shead h3** — `font-size:16px;`  (h3 base: `margin:0;font-weight:700;color:var(--teal-ink);`)
**.shead .see** — `font-size:12.5px;font-weight:700;color:var(--orange);`

### Room / stage

**.room** — `position:relative;height:270px;overflow:hidden;background:var(--room-bg);` (height overridden inline 292px)
**.roomart** — `position:absolute;inset:0;width:100%;height:100%;`
**.room::after** — `content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 74%,rgba(251,246,236,.35) 90%,var(--cream) 100%);`
**.petstage** — `position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;justify-content:center;z-index:2;padding-bottom:44px;` (height set inline)
**.petwrap** — `position:relative;height:100%;display:flex;align-items:flex-end;justify-content:center;`
**.petart** — `position:relative;height:100%;display:flex;align-items:flex-end;justify-content:center;filter:drop-shadow(0 12px 10px rgba(0,0,0,.14));animation:breathe 3.4s ease-in-out infinite;transform-origin:50% 100%;`
**.petart>svg** — `display:block;height:100%;width:auto;`
**.petart>img** — `display:block;height:100%;width:auto;object-fit:contain;`
**.petart.happy** — `animation-duration:2.6s`
**.petart.tired** — `animation-duration:4.4s`
**.petart.hungry** — `animation-duration:5s;filter:drop-shadow(0 12px 10px rgba(0,0,0,.14)) saturate(.78);`
  (`.content` has no override → uses base 3.4s breathe.)
**.petart.cheer** — `animation:cheer .8s cubic-bezier(.2,1.4,.4,1) 2;`
**.petart>img.petoutfit** — `position:absolute;left:50%;transform:translateX(-50%);pointer-events:none;z-index:3;height:auto;object-fit:fill;filter:drop-shadow(0 2px 2px rgba(0,0,0,.16));`
**.petshadow** — `position:absolute;bottom:48px;left:50%;transform:translateX(-50%);width:118px;height:20px;border-radius:50%;background:rgba(0,0,0,.16);filter:blur(5px);z-index:1;`
**.moodtag** — `position:absolute;top:12px;left:12px;z-index:5;background:rgba(255,255,255,.92);backdrop-filter:blur(4px);padding:6px 12px;border-radius:var(--r-pill);font-weight:700;font-size:12.5px;color:var(--teal-ink);box-shadow:var(--shadow-sm);display:flex;gap:6px;align-items:center;`
**.stagetag** — `position:absolute;top:12px;right:12px;z-index:5;background:rgba(12,76,96,.9);color:#fff;padding:5px 11px;border-radius:var(--r-pill);font-weight:800;font-size:11px;letter-spacing:.2px;display:flex;gap:5px;align-items:center;`
**.mooddot** — `width:8px;height:8px;border-radius:50%;flex:none;`
**.mooddot.happy** — `background:#1E7F91`
**.mooddot.content** — `background:#E9B24C`
**.mooddot.tired** — `background:#C79350`
**.mooddot.hungry** — `background:#D98C6A`

Animations:
`@keyframes breathe{0%,100%{transform:translateY(0) scaleY(1) scaleX(1)}50%{transform:translateY(-5px) scaleY(1.028) scaleX(.988)}}`
`@keyframes cheer{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-16px) rotate(-5deg)}60%{transform:translateY(-4px) rotate(4deg)}}`

### Egg in room

**.eggstage** — `position:absolute;left:0;right:0;bottom:0;height:200px;display:flex;align-items:flex-end;justify-content:center;z-index:2;padding-bottom:38px;`
**.eggart** — `height:168px;animation:eggwobble 2.8s ease-in-out infinite;transform-origin:50% 92%;filter:drop-shadow(0 10px 8px rgba(0,0,0,.16));`
**.eggart svg** — `height:100%;width:auto;display:block;`
**.eggart.ready** — `animation-duration:.9s;`
`@keyframes eggwobble{0%,100%{transform:rotate(0)}20%{transform:rotate(-3.5deg)}40%{transform:rotate(3deg)}60%{transform:rotate(-2deg)}80%{transform:rotate(1.4deg)}}`

### Idle coin pile

**.coinpile** — `position:absolute;inset:0;z-index:6;border:none;background:transparent;padding:0;cursor:pointer;`
**.pilecoin** — `position:absolute;`
**.pilecoin img** — `display:block;filter:drop-shadow(0 3px 3px rgba(0,0,0,.22));animation:coinpop .42s ease-out backwards, coinbob 2.6s ease-in-out infinite;`
**.pilebadge** — `position:absolute;top:52px;left:50%;transform:translateX(-50%);display:inline-flex;align-items:center;gap:5px;background:rgba(12,76,96,.92);color:#fff;font-weight:800;font-size:11.5px;padding:5px 11px;border-radius:var(--r-pill);box-shadow:var(--shadow-sm);white-space:nowrap;`
**.pilebadge img** — `width:15px;height:15px;`
`@keyframes coinpop{from{opacity:0;transform:translateY(10px) scale(.5)}}`
`@keyframes coinbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`

### Health

**.health** — `display:flex;align-items:center;gap:9px;`
**.health .bar** — `flex:1;height:13px;border-radius:9px;background:#EFE7D6;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.06);`
**.health .fill** — `height:100%;border-radius:9px;background:linear-gradient(90deg,var(--yellow-2),var(--yellow));transition:width .5s cubic-bezier(.2,.8,.2,1);`
**.health.low .fill** — `background:linear-gradient(90deg,#E5654B,#F09A6E);`  (applied when `health<40`)
**.health .heart** — `display:flex;color:#E5654B;`
**.hval** — `font-weight:800;color:var(--teal-ink);font-size:13px;min-width:52px;text-align:right;`

### Care buttons

**.carerow** — `display:flex;gap:10px;margin-top:14px;`
**.carebtn** — `flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-radius:var(--r-md);background:#fff;box-shadow:var(--shadow-sm);border:1px solid var(--line);`
**.carebtn:active** — `transform:scale(.97);`
**.carebtn .cic** — `width:34px;height:34px;object-fit:contain;`
**.carebtn .clbl** — `font-size:11.5px;font-weight:700;color:var(--teal-ink);`

### Growth note (health card footer)

**.growthnote** — `display:flex;gap:7px;align-items:flex-start;margin-top:14px;padding:11px 12px;border-radius:var(--r-sm);background:var(--cream);color:var(--muted);font-size:11.5px;font-weight:600;line-height:1.45;`
**.growthnote svg** — `flex:none;margin-top:1px;color:var(--orange);`

### Growth card

**.jcardh** — `font-weight:800;color:var(--teal-ink);font-size:14.5px;`
**.jcards** — `font-size:11.5px;color:var(--muted);font-weight:600;margin-top:2px;line-height:1.35;`
**.bonuspill** — `display:inline-flex;align-items:center;gap:6px;background:#FFF4E7;border:1px solid #F6DFC4;color:var(--orange-2);font-weight:800;font-size:12px;padding:5px 11px 5px 9px;border-radius:var(--r-pill);`
**.bonuspill .ic** — `color:var(--orange);`
**.segbar** — `display:flex;gap:6px;`
**.seg** — `flex:1;height:9px;border-radius:var(--r-pill);background:var(--cream);border:1px solid var(--line-2);`
**.seg.on** — `background:var(--teal);border-color:var(--teal);`
**.seglabels** — `margin-top:7px;display:flex;justify-content:space-between;`
**.seglabels b** — `font-size:9.5px;font-weight:700;color:var(--line-2);`
**.seglabels b.on** — `color:var(--teal);`
**.jgrowthnote** — `margin-top:12px;font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.4;display:flex;gap:5px;`
**.jgrowthnote .ic** — `color:var(--teal);flex:none;margin-top:1px;`

### Foraging card

**.earncard** — `padding:16px;`
**.earnlvl** — `display:flex;align-items:center;gap:11px;`
**.earnbadge** — `width:40px;height:40px;border-radius:50%;background:var(--yellow);display:flex;align-items:center;justify-content:center;flex:none;`
**.earnbadge img** — `width:22px;height:22px;`
**.bondh** — `display:block;font-weight:800;color:var(--teal-ink);font-size:15px;`
**.bondsub** — `display:block;font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.35;`
**.bondempty** — `margin-top:12px;text-align:center;font-size:12px;color:var(--muted);font-weight:600;background:var(--cream);border-radius:var(--r-sm);padding:11px;`

### Benefit rows

**.benrow** — `display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid var(--line);`  (last row gets inline `border-bottom:none`)
**.benic** — `width:40px;height:40px;border-radius:13px;background:var(--cream);display:flex;align-items:center;justify-content:center;flex:none;`  (color set inline per row)
**.benmain** — `flex:1;min-width:0;`
**.bent** — `font-weight:700;font-size:14px;color:var(--teal-ink);`
**.bend** — `font-size:11.5px;color:var(--muted);font-weight:500;line-height:1.4;margin-top:2px;`
**.benval** — `flex:none;min-width:56px;text-align:center;font-weight:800;font-size:12.5px;padding:5px 10px;border-radius:var(--r-pill);`
**.benval.bonus** — `background:#FFF4E7;color:var(--orange-2);`
**.benval.on** — `background:var(--tint-2);color:var(--good);`
**.benval.off** — `background:var(--cream);color:var(--muted);`
(When `.benval.on` is a `<button>` it also inherits base `button{background:none;...cursor:pointer}` then `.benval.on` re-sets background.)

### Buttons

**.btn** — `display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;`
**.btn:active** — `transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);`
**.btn.block** — `display:flex;width:100%;`  (used by "Collect coins" and "Hatch it")

### Wardrobe grid

**.shopgrid** — `display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 16px calc(var(--nav-h) + 20px);`  (padding overridden inline `padding:0`)
**.shopcard** — `background:#fff;border-radius:18px;padding:12px;box-shadow:var(--shadow-sm);border:1px solid var(--line);position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;text-align:center;`
**.shopcard .art** — `width:78px;height:78px;object-fit:contain;margin:6px 0 8px;`
**.shopcard .cn** — `font-weight:700;font-size:13.5px;color:var(--teal-ink);`
**.shopcard .cd** — `font-size:11px;color:var(--muted);font-weight:600;margin-top:2px;min-height:15px;line-height:1.3;`
**.shopcard .buy** — `margin-top:10px;width:100%;display:flex;align-items:center;justify-content:center;gap:5px;background:var(--orange);color:#fff;font-weight:800;padding:9px;border-radius:var(--r-sm);box-shadow:0 4px 0 var(--orange-2);font-size:13.5px;`
**.shopcard .buy:active** — `transform:translateY(2px);box-shadow:0 2px 0 var(--orange-2);`
**.shopcard .buy.equipped** — `background:var(--teal);box-shadow:0 4px 0 #072f3d;`  (current outfit → "Wearing")
**.shopcard .buy.equip** — `background:#fff;color:var(--teal);box-shadow:0 0 0 1.5px var(--line-2) inset;`  (not worn → "Wear")

### Egg-room only

**.chip** — `display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:4px 9px;border-radius:var(--r-pill);background:var(--cream);color:var(--teal);border:1px solid var(--line-2);`
**.chip.warn** — `color:var(--orange-2);background:#FFF4E7;border-color:#F6DFC4;`
**.smallnote** — `font-size:11px;color:var(--muted);font-weight:600;line-height:1.45;margin-top:8px;`
**.fit** — `display:flex;align-items:flex-end;justify-content:center;`
**.fit>svg** — `height:100%;width:auto;display:block;`
**.fit>img** — `height:100%;width:auto;object-fit:contain;display:block;`

### Icons

**.ic** — `display:inline-block;vertical-align:middle;flex:none;`
**.ic.stroke** — `fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;`
**.ic.fill** — `fill:currentColor;stroke:none;`
`ic(name,size,cls)` (L1196) →
`<svg class="ic {stroke|fill} {cls}" width="{size}" height="{size}" viewBox="0 0 24 24" aria-hidden="true">{path}</svg>`

Icons used by this screen (from `ICONS`, L1148-1195):
- **heart** (fill): `<path d="M12 20.7C6.5 17 3 13.8 3 9.9 3 7.2 5 5.4 7.4 5.4c1.7 0 3 .9 3.9 2.2.9-1.3 2.2-2.2 3.9-2.2 2.4 0 4.4 1.8 4.4 4.5 0 3.9-3.5 7.1-9 10.8z"/>`
- **info** (stroke): `<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.9v.1"/>`
- **bolt** (fill): `<path d="M13.5 2 5 13h5.2l-1 9L19 10.5h-5.4z"/>`
- **snow** (stroke): `<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M12 6.6 9.8 4.8M12 6.6l2.2-1.8M12 17.4l-2.2 1.8M12 17.4l2.2 1.8"/>`
- **sparkle** (fill): `<path d="M12 3.5c1 5.8 2.7 7.5 8.5 8.5-5.8 1-7.5 2.7-8.5 8.5-1-5.8-2.7-7.5-8.5-8.5 5.8-1 7.5-2.7 8.5-8.5z"/>`
- **egg** (stroke): `<path d="M12 3.2c3.9 0 6 5.7 6 10.6 0 4.2-2.7 6.9-6 6.9s-6-2.7-6-6.9C6 8.9 8.1 3.2 12 3.2z"/>`
- **check** (stroke): `<path d="M8 12.5 11 15.5 16.5 6.5"/>`
- **sprout** (stroke): `<path d="M12 20v-7M12 13c0-3 2.5-5 6-5 0 3-2.5 5-6 5zM12 13c0-2.6-2.2-4.5-5.5-4.5C6.5 11 8.7 13 12 13z"/>`
- **shirt** (stroke): `<path d="M8 4 5 7l2 2 1-1v11h8V8l1 1 2-2-3-3-2 1.5a3 3 0 0 1-4 0z"/>`

`flameSVG(size)` (L1914): `<span style="display:inline-flex;width:{size}px;height:{size}px">{ART.flame}</span>`
where `ART.flame` = `ICONS.flame` fill path:
`<path d="M12.8 2.4c.4 2.7 2.7 3.7 3.4 6.1.9 3.1-1.2 6.6-4.6 6.6-2.9 0-5-2.2-4.6-5.1.2-1.4 1-2.2 1.7-3 .2 1.3.9 2 1.7 2.2-.5-2.3.9-4.6 2-6.8z"/><path d="M11 15.5c1.6 0 2.9 1 2.9 2.6 0 1.7-1.3 2.9-2.9 2.9s-2.7-1.2-2.7-2.7c0-1 .5-1.7 1.1-2.2.1.9.6 1.3 1.1 1.4-.3-1.1.1-1.6 .4-2z"/>`

### Reduced motion (L802-804)
```
@media (prefers-reduced-motion: reduce){
  .petart,.eggart,.gardensun,.gardencloud,.pilecoin img{animation:none!important;}
}
```

---

## 3. DATA / LOGIC (verbatim formulas)

### Mood — `moodOf(h)` (L1518-1523)  [h = S.pet.health, 0-100]
| health h | `t` (label) | `k` (class) | `bonus` |
|---|---|---|---|
| h ≥ 75 | "Happy" | happy | .25 |
| 45 ≤ h < 75 | "Content" | content | .10 |
| 20 ≤ h < 45 | "Tired" | tired | 0 |
| h < 20 | "Hungry" | hungry | 0 |

### `bonusPct()` (L1524) = `Math.round(moodOf(S.pet.health).bonus*100)` → 25 / 10 / 0 / 0.
Benefit-row string uses `bp>0` gate → shows `+25%` / `+10%`, else `0%`.

### Growth stage — `petStage()` (L1525-1529)
```js
const b = Math.max(S.profile.best, S.profile.streak);
let s = 1; for(let i=1;i<STAGE_GATE.length;i++) if(b>=STAGE_GATE[i]) s=i+1;
return S.pet.hatchState==='hatched' ? s : 1;   // egg is always Stage 1
```
`STAGE_GATE=[0,7,21,50,100]` (L1282), `STAGES=["Baby","Young","Grown","Prime","Legend"]` (L1281).
So stage by best-overall-streak `b`: `b≥100→5(Legend)`, `b≥50→4(Prime)`, `b≥21→3(Grown)`,
`b≥7→2(Young)`, else `1(Baby)`.

`stageName(n)` (L1530) = `STAGES[Math.min(4,Math.max(0,(n||1)-1))]`.

In `renderPet`:
- `stg = petStage()`, header shows `"Stage {stg} of 5"`.
- `nextGate = STAGE_GATE[stg] || null` → for stg 1..4 = `7,21,50,100`; stg 5 = `undefined→null`.
- `best = Math.max(S.profile.best, S.profile.streak)`.
- `.jcards` = `nextGate ? "{nextGate-best} more streak days to {stageName(stg+1)}" : "{name} has reached the final stage"`.
- `segbar(stg,5)` fills first `stg` of 5 segments; seglabels first `stg` `<b>` get `.on`.

### Health decay label — `decayPerDay()` (L1531)
`Math.max(6, 12 - perks().decay)`. Base (no garden) = **12**. Watering-Can perk `decay:2`,
Fruit-Tree perk `decay:2` (both plots planted → `12-4=8`; floor is 6). Shown as `−{n}/day`.
(Actual decay is applied at daily rollover, L1715: `health = clamp(0..100, health - decayPerDay() + restore)`, `restore=round(18*done/due)`.)

### Foraging / idle economy
- **`idleRate()`** (L1532) = `1*(1+perks().rate)`. Base **1.00** coins/hr. Flower-Bed perk `rate:.25` → `1.25`.
  Display format: `idleRate().toFixed(2).replace(/\.?0+$/,'')` → `1.00`→"1", `1.25`→"1.25".
- **`idleCap()`** (L1533) = `50 + perks().cap`. Base **50**. Herb-Patch `cap:50`, Flower-Bed `cap:100`.
- **`idlePending()`** (L1534-1538): `0` if not hatched; else
  `Math.max(0, Math.min(idleCap(), Math.floor(((Date.now()-S.pet.lastCollect)/3600000)*idleRate())))`.
- **`idleFull()`** (L1539) = `idlePending() >= idleCap()`.
- **`coinPile()`** shows count `n = Math.min(12, Math.max(1, Math.ceil(pending/4)))` coin sprites.

### `perks()` (L1504-1511)  — sum of planted garden plots' perk fields
`{perCheck, cap, rate, decay, allClear, all, freeze}`, accumulated over `GARDEN` where
`planted(g.id)` (i.e. `S.garden.includes(id)`). Relevant plot perks (L1244-1253):
`herbs cap:50`, `can decay:2`, `berry allClear:.10`, `sapling freeze:true`, `flowers cap:100 rate:.25`,
`fruit decay:2`, `orchard all:.20`, `sprout perCheck:1`.
`planted('sapling')` (L1503) gates the Streak-Freeze benefit copy.

### Streak Freeze count — `S.profile.freezes` (integer, capped at 3 by rollover/refill logic).
Benefit row: value = `S.profile.freezes`; class `.on` if `>0` else `.off`; icon color
`var(--good)` if `>0` else `var(--muted)`.

### Money — `money(n)` (L1801) = `Number(n||0).toLocaleString('en-US')` (thousands separators, e.g. `1,240`).
### `esc(s)` (L1802) HTML-escapes `& < > "` (pet name is user input → always escaped).

### Egg progress — `S.pet.hatchProgress` (0-3).
- `chip.warn` = `"{p} of 3 stages"`.
- `segbar(p,3)`; seglabels "Whole"(p≥1), "First crack"(p≥2), "Hatching"(p≥3).
- Hatch button appears only when `p>=3`.
- Egg art (via `eggBlock`): `p>=3→ART.eggHatch`, `p>=1→ART.eggCrack`, else `ART.eggWhole`.
- Progress advances by `maybeAllClear()` (L1671-1674): on an all-clear day while not hatched,
  `hatchProgress = Math.min(3, +1)`; when it reaches 3 → auto `startHatch()`.

### Species — `spec(id)` (L1226) → entry from `SPECIES` (L1218-1225):
| id | name | price | premium | kind | art/img | meta | wear |
|---|---|---|---|---|---|---|---|
| dog | Dog | 0 | false | img | dogthumb | "Loyal and easygoing" | w58 t59 |
| cat | Cat | 0 | false | img | catthumb | "Curious and cozy" | w56 t57 |
| fox | Fox | 600 | false | svg | fox | "Clever and quick" | w54 t60 |
| penguin | Penguin | 900 | false | svg | penguin | "Steady and social" | w54 t58 |
| axolotl | Axolotl | 1200 | true | svg | axolotl | "Rare and unbothered" | w46 t58 |

Egg-room preview text: `"A {sp.name.toLowerCase()}, probably"` and `"{sp.meta}. You'll get to name it the moment the shell breaks."`

### Clothes — `CLOTHES` (L1235-1241):
| id | name | price | premium | img |
|---|---|---|---|---|
| 1 | Cyan T-shirt | 80 | false | c1 |
| 2 | Green Shirt | 150 | false | c2 |
| 3 | Tuxedo | 320 | true | c3 |
| 4 | Star Shirt | 250 | true | c4 |
| 5 | Pink Dress | 400 | true | c5 |

Wardrobe list = `[ id 0 "No outfit" ] + S.pet.ownedClothes.map(...)`. Worn = `S.pet.clothesId`.

### Assets referenced (image `src`s, L1082-1101 — all inline base64 data URIs)
`ASSETS.coin`, `ASSETS.apple`, `ASSETS.wardrobe`, `ASSETS.petIcon`; food imgs `apple/chicken/pizza/melon/carrot`;
clothes imgs `c1..c5`; species imgs `catthumb/dogthumb` (dog/cat are `kind:'img'`). Copy the exact
data URIs from source; they are the authoritative artwork.

### Art (inline SVG in `ART`) referenced: `ART.eggWhole`, `ART.eggCrack`, `ART.eggHatch`, `ART.flame`,
`ART.fox`, `ART.penguin`, `ART.axolotl` (species svg bodies). Transcribe verbatim from `ART` for fidelity.

---

## 4. INTERACTIONS (every tap handler in the section)

| Element | Handler | Effect |
|---|---|---|
| `button.hi-av` (topbar avatar) | `openProfile()` (L3750) | `renderProfile(); openScreen('profile')` — slides up the Profile screen. |
| `span.coinpill` | none | Static display (animates via `.bump` when coins change elsewhere). |
| coin pile in room (`button.coinpile`) | `event.stopPropagation();collectIdle()` | See collectIdle below. Only rendered when `idlePending()>0`. |
| **Feed** carebtn | `openFeed()` (L2748-2752) | If not hatched → `toast('Your egg does not eat. Keep habits to warm it.')`. If `health>=100` → `toast('{name} is completely full')`. Else `renderFeed()` (opens Feed sheet). |
| **Wardrobe** carebtn | `openShop('clothes')` (L2909-2916) | Opens Shop screen (`openScreen('shop')`), Wardrobe tab. |
| **Adopt** carebtn | `openShop('pets')` | Opens Shop screen, Companions tab. |
| Foraging **Collect** btn | `collectIdle()` (L1540-1546) | `amt=idlePending()`; if `<=0` → `toast('The jar is still empty. Check back later.')`. Else `addCoins(amt,'idle')`, `S.pet.lastCollect=Date.now()`, `S.stats.idleCollected+=amt`, `toast('{name} foraged {amt} coins', ASSETS.coin)`, `confetti()`, `bumpCoins()`, `save()`, `renderAll()`. |
| Benefits — Streak-Freeze row | none (display only) | — |
| Wardrobe **"Get more"** (`.see`) | `openShop('clothes')` | Opens Shop → Wardrobe. |
| Wardrobe **"No outfit"** card | `equip(0)` (L2738-2745) | Toggle to no-outfit. |
| Wardrobe owned-outfit card | `equip(id)` | Equip/toggle that outfit. |
| Wardrobe empty-state card | `openShop('clothes')` | Opens Shop → Wardrobe. |
| **EGG:** "It's time. Hatch it" btn (p≥3) | `startHatch()` (L3034-3043) | Opens `nursery` screen, runs the hatch animation timeline (see below). |
| **EGG:** blurred species preview | none | Display only. |
| **EGG:** "While you wait" → **Open** btn | `switchTab('garden')` (L1843-1851) | Switches bottom-nav tab to Garden. |

### `equip(id)` (L2738-2745)
```js
function equip(id){
  if(id!==0 && !S.pet.ownedClothes.includes(id)){ toast('Buy this outfit first'); return; }
  const was=S.pet.clothesId;
  S.pet.clothesId=(was===id?0:id);          // tapping the worn outfit removes it (toggle)
  if(S.pet.clothesId!==was) S.stats.outfitChanges++;
  save(); renderAll();
  toast(S.pet.clothesId===0?'Outfit removed':'Looking sharp');
}
```
- Equipping updates the pet art overlay (`wearLayer` → `.petoutfit`) on next render.
- Toast: `"Buy this outfit first"` (unowned) / `"Outfit removed"` (toggled off) / `"Looking sharp"` (equipped).

### `startHatch()` (L3034-3043) timeline
`openScreen('nursery')` then, via `setTimeout`s from `hatchTimers`:
`t=0` step0 (whole egg, copy "Something is moving"), `t=1500ms` step1 (crack + `.shake`, "A first crack"),
`t=3400ms` step2 (`.burstout` + glow on, "Almost…"), `t=5300ms` step3 → `doHatch()`.
`hatchSkip()` (`.nursskip` button, top-right) jumps straight to `doHatch()`.

### `switchTab(t)` (L1843-1851)
Sets `S.tab`, toggles `.on` on the matching `.tabbar button[data-tab]`, shows the matching
`tab{Today|Habits|Pet|Garden}` host with a `.fade-in`, calls `renderAll()` + `save()`.

### `collectIdle` / `feed` etc. all end with `save(); renderAll();` — the whole `pet` tab re-renders.

---

## 5. NOTES (subtle behavior)

**Pre-hatch vs post-hatch is a hard fork.** `renderPet` delegates to `renderEggRoom` when
`hatchState!=='hatched'`. The two share only the top bar shape, `roomStage(292)`, `.pad`, and the
`.card`/`.benrow` primitives. The egg variant has NO health bar, NO growth stages (stage is forced
to 1), NO foraging (`idlePending` returns 0 pre-hatch → no coin pile, foraging card is absent), and
NO wardrobe. It instead shows Warming-up progress, a blurred species preview, and two "while you
wait" benefit rows.

**Room mood/stage tags differ by state** (`roomStage`, L1906-1908):
- Hatched → `.moodtag` = colored `.mooddot .{mood.k}` + `{mood.t}`; plus `.stagetag` (top-right)
  = sparkle icon + current `stageName(petStage())`.
- Egg → single `.moodtag` = egg icon + literal text **"Eggbound"**; no stage tag.

**Coin pile is conditional & interactive.** Only rendered when `idlePending()>0` (hatched only).
It is an absolutely-positioned full-room `<button>` overlaying the pet; tapping it collects idle
coins. `event.stopPropagation()` prevents bubbling. Coins animate in with `coinpop`+`coinbob`
(disabled under reduced-motion). Sprite count scales with pending (`ceil(pending/4)`, max 12).

**Pet outfit overlay.** `.petart` renders the species body; if `clothesId!=0`, `wearLayer` adds a
positioned `<img.petoutfit>` sized from the species' `wear` `{w,t}` percentages (fallback `{w:54,t:53}`).
Dog/cat are raster (`kind:'img'`), fox/penguin/axolotl are inline SVG (`kind:'svg'`).

**Health-low visual state.** `.health` gets `.low` when `S.pet.health<40`, switching the fill
gradient from yellow (`--yellow-2→--yellow`) to red (`#E5654B→#F09A6E`). Health text always `{h}/100`.
The health-card footer copy switches at `health>=75` (thriving) vs below (recovers on its own).
Nothing can die — health floors at 0 and only affects mood/bonus.

**Benefit-row copy is state-driven** (all three rows in the hatched "What X does for you" card):
- Check-off bonus: if `bp>0` names the mood ("{name} is happy/content, so every check-off pays
  extra.") and shows `+bp%` in an orange `.bonus` pill; if `bp===0`, copy "Get health to 45+ and
  {name} starts adding a bonus." and a grey `.off` `0%` pill.
- Streak Freeze: three-way copy — has freezes / has Young Sapling planted / neither — and the value
  pill/icon switch `.on`+`--good` vs `.off`+`--muted`.

**Wardrobe empty state.** When `S.pet.ownedClothes` is empty, the grid shows the permanent "No
outfit" card **plus** a single centered `min-height:150px` promo card ("No outfits yet / Buy one in
the shop") that opens the shop. When outfits are owned, each owned card shows "Wearing" (teal
`.equipped`) or "Wear" (white `.equip`); `CLOTHES.find` misses are skipped (empty string).

**Foraging number formatting.** `idleRate()` is printed via `.toFixed(2).replace(/\.?0+$/,'')`,
so `1.00`→"1", `1.50`→"1.5", `1.25`→"1.25". Same helper used in the benefit row (`{rate}/hr`).
The "jar full" suffix (" · jar full") only appears on the Collect button when `idleFull()`.

**Egg hatch gating.** The "It's time. Hatch it" button only renders at `hatchProgress>=3`. Note the
economy also auto-triggers `startHatch()` from `maybeAllClear()` the moment progress hits 3, so a
user usually reaches the nursery automatically; this manual button is the fallback / re-entry
(e.g. `rollover` sets `seenHatch=false` at L1727 when progress≥3 but still `egg`).

**Theme behavior.** The screen is fully theme-driven via CSS custom props on `:root[data-theme=...]`
(L28-55). Only the accent family moves; paper/cards/artwork stay fixed. Per-theme values that affect
this screen (accent `--orange`, `--teal`, `--good`, `--tint-2`, `--glow`, shadows):
- **hatch** (default, no attr): orange `#E28A4B`, teal `#0C4C60`, good `#1E7F91`, `--tint-2` unresolved.
- **dusk**: orange `#D9628F`, teal `#3E2E5E`, good `#7A5FA8`, tint-2 `#EDE7F6`, glow `rgba(217,98,143,.5)`.
- **forest**: orange `#D19A2E`, teal `#1E4632`, good `#3F7D4E`, tint-2 `#E3EFE4`, glow `rgba(209,154,46,.5)`.
- **ocean**: orange `#2FA0AE`, teal `#123A5C`, good `#2E8FA8`, tint-2 `#E1F0F3`, glow `rgba(47,160,174,.5)`.
- **ember**: orange `#DE5B39`, teal `#4A2A20`, good `#A8623F`, tint-2 `#F5E5DC`, glow `rgba(222,91,57,.5)`.
Note `--room-bg` (`#A0B559`), `--cream`, `--line`, `--yellow*` and the room SVG are NOT themed —
the room artwork looks identical across themes. There is no light/dark mode; the app is a single
warm-cream palette (`--cream:#FBF6EC` background). `applyTheme()` (L1818-1823) sets/removes
`data-theme` on `<html>`; `hatch` removes the attribute entirely.

**Reduced motion.** `.petart`, `.eggart`, `.pilecoin img` animations are killed under
`prefers-reduced-motion:reduce` (L802-804). `coinFly` (coin-toss on check-off) also early-returns
under reduced motion.

**`renderAll()` re-render.** Every mutating handler here (`equip`, `collectIdle`, `switchTab`) ends
with `save()` then `renderAll()`, which re-invokes `renderPet()` if `S.tab==='pet'` — the entire tab
HTML is rebuilt from state on each interaction (no diffing).
