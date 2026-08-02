# Profile screen — build contract (proto extraction)

Source: `prototype/habithatch_v1.html`
- `renderProfile()` + helpers `linkRow / toggleRow / toggleSet / editName / saveName / resetData / doReset / devTap`: lines **3750–3891**
- CSS: lines **8–965**
- Data/helpers: lines **1078–1957** (+ `avatarImg/avatarArt` 3124–3132, `firstDay/trackedDays` 3237–3238)

The Profile screen is an **overlay screen** that slides up over the tab shell. Container markup (line 1010):

```html
<section class="screen overlay" id="profile"><div class="scroll" id="profileBody"></div></section>
```

`renderProfile()` writes the entire body into `#profileBody` (a `.scroll` surface). It is called by `openProfile()` which then runs `openScreen('profile')` (slide-up).

---

## 1. VISUAL TREE

Text in «guillemets» is verbatim copy. `{…}` is an interpolated value (formula in §3). Inline styles are shown as `@style=…`.

```
section#profile .screen .overlay
└─ div#profileBody .scroll                         (flex:1; scrolls vertically)
   ├─ div .profhead                                (teal gradient header, white text)
   │  ├─ div .row .spread   @style="margin-bottom:14px"
   │  │  ├─ span  @style="font-size:10.5px;font-weight:800;color:#BFE3F3;letter-spacing:.6px;text-transform:uppercase"
   │  │  │        «Your profile»
   │  │  └─ button .iconbtn  onclick=closeScreen('profile')
   │  │        └─ ic('close',18)  → inline <svg class="ic stroke"> X-glyph
   │  ├─ div .profav
   │  │  ├─ avatarImg(64)  →  span .avwrap @style="width:64px;height:64px"
   │  │  │        └─ span .avin
   │  │  │              └─ avatarArt():  egg SVG (unhatched) | species SVG (fox/penguin/axolotl) | <img> (dog/cat)
   │  │  ├─ div  @style="min-width:0"
   │  │  │  ├─ div .profnm    «{esc(P.name)}»                     (demo: «Haryanto»)
   │  │  │  └─ div .profsub   «Level {L.lvl} · {esc(petName||'egg')} the {speciesWord}»
   │  │  │                     speciesWord = hatched ? spec(species).name.toLowerCase() : «unhatched»
   │  │  │                     (demo hatched fox: «Level N · Pip the fox»)
   │  │  └─ button .btn .sm  @style="margin-left:auto;background:rgba(255,255,255,.16);box-shadow:none"
   │  │        onclick=editName()
   │  │        └─ ic('edit',14) + « Edit»                         (leading space before Edit)
   │  ├─ div .xpbar
   │  │     └─ i  @style="width:{xpPct}%"
   │  └─ div .xpmeta
   │        ├─ span  «{money(L.xp)} of {money(L.need)} XP»
   │        └─ span  «Level {L.lvl+1} next»
   │
   └─ div .pad-flat
      ├─ div .tiles                                (3-up stat tiles)
      │  ├─ div .tile
      │  │  ├─ div .tileic → ic('flame',18)
      │  │  ├─ div .v     «{P.streak}»
      │  │  └─ div .l     «Streak»
      │  ├─ div .tile
      │  │  ├─ div .tileic → ic('check',18)
      │  │  ├─ div .v     «{money(totalKept)}»
      │  │  └─ div .l     «Kept»
      │  └─ div .tile
      │     ├─ div .tileic → <img src=ASSETS.coin @style="width:18px;height:18px">
      │     ├─ div .v     «{money(P.lifetimeCoins)}»
      │     └─ div .l     «Earned»
      │
      ├─ div .shead → h3 «Your progress»
      ├─ div .card  @style="padding:4px 16px"       (linkRow list)
      │  ├─ linkRow('chart',  «Insights»,      «{trackedDays()} days tracked across 30 metrics», openInsights('overview'))
      │  ├─ linkRow('trophy', «Achievements»,  «{S.achievements.length} of {ACHIEVEMENTS.length} badges», openAchievements())
      │  ├─ linkRow('gift',   «Weekly recap»,  «Your week, side by side with last week», openRecap())
      │  └─ linkRow('sprout', «Habit Garden»,  «{S.garden.length} of {GARDEN.length} plots grown»,
      │              "closeScreen('profile');setTimeout(()=>switchTab('garden'),260)",  last=true)
      │
      ├─ button .plusrow  @style="margin-top:18px"  onclick=openPremium()
      │  ├─ span .plusic  → ic('crown',24)
      │  ├─ span .plusmain
      │  │  ├─ span .plust   «HabitHatch+ »  + (premium ? <span .plusb>«ACTIVE»</span> : nothing)
      │  │  └─ span .pluss   premium ? «Themes, the full collection and every dashboard are yours.»
      │  │                             : «Five themes, every companion and outfit, 30 metrics.»
      │  └─ span .pluscta   premium ? «Manage» : «See plans»
      │
      ├─ div .shead
      │  ├─ h3 «Appearance»
      │  └─ (only if NOT premium) span .muted @style="font-size:11.5px;font-weight:700"
      │        «1 of {THEMES.length} free»                        (THEMES.length = 5 → «1 of 5 free»)
      ├─ div .card  @style="padding:14px 14px 13px"
      │  └─ div .themegrid
      │     └─ THEMES.map → button .themecard [.on if P.theme===id] [.tlock if premium theme & !P.premium]
      │           onclick=setTheme('{id}')  aria-label="{name} theme"
      │           ├─ span .themesw
      │           │     ├─ i @style="background:{sw[0]}"
      │           │     └─ i @style="background:{sw[1]}"   (clipped to bottom-left triangle)
      │           ├─ span .themenm  «{name}»
      │           └─ (if locked) span .themelk → ic('lock',9)
      │
      ├─ div .shead → h3 «Shop and extras»
      ├─ div .card  @style="padding:4px 16px"
      │  ├─ linkRow('bag',   «Shop»,            «Food, companions, wardrobe», openShop('food'))
      │  └─ linkRow('users', «Invite a friend», «You both get a Streak Freeze», openReferral(), last=true)
      │
      ├─ div .shead → h3 «Settings»
      ├─ div .card  @style="padding:4px 16px"
      │  ├─ toggleRow('notif',   «Reminders»,      «Per-habit nudges at the time you set»)
      │  ├─ toggleRow('evening', «Evening sweep»,  «A 20:00 ping if habits are still due»)
      │  ├─ toggleRow('hunger',  «Care alerts»,    «When {esc(petName||'your companion')} gets hungry»)
      │  └─ toggleRow('sound',   «Sound effects»,  «Small chimes on check-off»)
      │
      ├─ div .shead → h3 «Data»
      ├─ div .card  @style="padding:4px 16px"
      │  ├─ linkRow('offline', «Everything is offline», «Your habits live on this device only»,
      │  │           "toast('Nothing here leaves your phone.')")
      │  └─ linkRow('trash',   «Reset demo data»,       «Start over from the seeded demo or a fresh egg»,
      │              resetData(), last=true)
      │
      └─ p .section-note
            «HabitHatch v1.0 interactive prototype. Health never reaches zero and nothing here can die. A missed day only makes your companion a little hungry.»
```

### `linkRow(icon,title,sub,action,last,prem)` template (lines 3833–3838)
```html
<button class="setrow" style="width:100%;text-align:left;{last?'border-bottom:none':''}" onclick="{action}">
  <span class="setic {prem?'prem':''}">{ic(icon,18)}</span>
  <span class="sett">{title}<span class="setsub" style="display:block">{sub}</span></span>
  <span class="chev">{ic('chevR',16)}</span>
</button>
```
Note: in the Profile screen `prem` is **never passed true**, so `.setic.prem` is unused here (rule still documented in §2).

### `toggleRow(key,title,sub)` template (lines 3839–3844)
```html
<div class="setrow">
  <span class="setic">{ic(iconForKey,18)}</span>
  <span class="sett">{title}<span class="setsub" style="display:block">{sub}</span></span>
  <button class="tgl {S.settings[key]?'on':''}" onclick="toggleSet('{key}',this)" aria-label="{title}"></button>
</div>
```
Icon per key: `notif→'bell'`, `evening→'clock'`, `hunger→'heart'`, `sound→'bell'` (both notif and sound resolve to `bell`).

---

## 2. STYLE TABLE (declarations copied verbatim)

### CSS variables in play (default `hatch` theme — `:root`, lines 9–24)
The section uses these vars; resolved hex for the default theme:
```
--teal:#0C4C60   --teal-2:#12667F   --teal-ink:#0B2530
--orange:#E28A4B --orange-2:#C9773A
--yellow:#FFDA7C --yellow-2:#F4B942
--cream:#FBF6EC  --card:#FFFFFF     --line:#EFE6D6    --line-2:#E4D8C2
--muted:#8B897E  --ink:#2D2F41      --good:#1E7F91    --sky:#BFE3F3
--tint:#FFF7EF   --tint-2:#EDE7F6(*)
--r-sm:12px --r-md:16px --r-lg:20px --r-pill:999px
--nav-h:74px
--shadow:0 10px 16px rgba(12,76,96,.10)
--shadow-sm:0 4px 12px rgba(12,76,96,.08)
```
(*) `--tint-2` has no literal value in `:root`; it is only given a real value inside each themed block, so on the default `hatch` theme it is effectively unset — do NOT rely on it on the profile default. The themed overrides (`dusk/forest/ocean/ember`, lines 28–55) only move the accent family (teal/orange/good/sky/tint/glow/shadow). `hatch` = default with no `data-theme` attribute.

### Layout / container classes
```css
.screen{position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--cream);}
.screen.active{display:flex;}
.screen.overlay{z-index:40;}
.scroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}
.pad-flat{padding:16px 16px 26px;}
.card{background:var(--card);border-radius:var(--r-lg);box-shadow:var(--shadow);border:1px solid var(--line);}
.row{display:flex;align-items:center;}
.spread{justify-content:space-between;}
.muted{color:var(--muted);}
h1,h2,h3,h4{margin:0;font-weight:700;color:var(--teal-ink);}
.shead{display:flex;align-items:center;justify-content:space-between;margin:18px 2px 10px;}
.shead h3{font-size:16px;}
```
Body font stack (line 87): `'Poppins','Segoe UI',Roboto,system-ui,-apple-system,sans-serif;`

### Profile header
```css
.profhead{background:linear-gradient(180deg,#0C4C60,#12667F);padding:calc(16px + env(safe-area-inset-top)) 16px 22px;color:#fff;position:relative;}
.profav{display:flex;align-items:center;gap:14px;}
.profav img{width:64px;height:64px;border-radius:50%;border:3px solid rgba(255,255,255,.85);object-fit:cover;background:#DDEDE9;}
.profnm{font-weight:800;font-size:19px;}
.profsub{font-size:12px;color:#BFE3F3;font-weight:600;margin-top:2px;}
.xpbar{height:9px;border-radius:9px;background:rgba(255,255,255,.2);overflow:hidden;margin-top:12px;}
.xpbar i{display:block;height:100%;background:var(--yellow);border-radius:9px;}
.xpmeta{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#BFE3F3;margin-top:6px;}
```
Avatar wrapper (avatarImg output):
```css
.avwrap{display:inline-flex;border-radius:50%;overflow:hidden;border:2.5px solid #fff;background:#DDEDE9;box-shadow:var(--shadow-sm);flex:none;align-items:flex-end;justify-content:center;}
.avwrap .avin{display:flex;align-items:flex-end;height:122%;}
.avwrap svg,.avwrap img{height:100%;width:auto;display:block;}
```

### Buttons used in header
```css
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;}
.btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);}
.btn.sm{padding:9px 14px;border-radius:var(--r-sm);font-size:13px;box-shadow:0 4px 0 var(--orange-2);}
.btn.sm:active{box-shadow:0 1px 0 var(--orange-2);}
/* Edit button overrides via inline style: background:rgba(255,255,255,.16); box-shadow:none */
.iconbtn{width:40px;height:40px;border-radius:14px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);flex:none;}
.iconbtn svg{width:18px;height:18px;stroke:var(--teal);stroke-width:2.5;fill:none;}
```

### Stat tiles
```css
.tiles{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
.tile{background:#fff;border-radius:var(--r-md);padding:12px 10px;text-align:center;box-shadow:var(--shadow-sm);border:1px solid var(--line);}
.tile .v{font-size:20px;font-weight:800;color:var(--teal-ink);line-height:1;}
.tile .l{font-size:10.5px;font-weight:700;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:.3px;}
.tile .tileic{margin-bottom:5px;display:flex;justify-content:center;color:var(--teal);}
```

### HabitHatch+ promo row
```css
.setic.prem{background:#FFF4E7;color:var(--yellow-2);}   /* premium linkRow icon variant (unused on Profile) */
.plusrow{display:flex;align-items:center;gap:13px;width:100%;text-align:left;position:relative;overflow:hidden;
  background:linear-gradient(135deg,#FFF9EC 0%,#FFF0D8 100%);border:1.5px solid #F1D9A8;border-radius:var(--r-lg);
  padding:14px 15px;box-shadow:0 8px 18px rgba(244,185,66,.20);}
.plusrow::after{content:"";position:absolute;top:-38px;right:-26px;width:118px;height:118px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,218,124,.55),rgba(255,218,124,0) 70%);}
.plusrow:active{transform:scale(.99);}
.plusic{width:44px;height:44px;border-radius:15px;background:linear-gradient(135deg,#FFDA7C,#F4B942);color:#7A4B00;
  display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 5px 12px rgba(244,185,66,.5);position:relative;z-index:2;}
.plusmain{flex:1;min-width:0;position:relative;z-index:2;}
.plust{font-weight:800;font-size:15.5px;color:var(--teal-ink);display:flex;align-items:center;gap:6px;}
.plusb{font-size:8.5px;font-weight:800;background:var(--good);color:#fff;padding:2px 6px;border-radius:var(--r-pill);letter-spacing:.4px;}
.pluss{font-size:11.5px;color:#8A7550;font-weight:600;margin-top:3px;line-height:1.35;}
.pluscta{flex:none;position:relative;z-index:2;font-size:12px;font-weight:800;color:#7A4B00;background:var(--yellow);
  border:1px solid #E8C46A;padding:8px 13px;border-radius:var(--r-pill);white-space:nowrap;}
```

### Appearance / theme picker
```css
.themegrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
.themecard{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:9px 4px 8px;
  border-radius:var(--r-sm);background:#fff;border:1.5px solid var(--line-2);transition:.14s;}
.themecard.on{border-color:var(--orange);background:var(--tint);}
.themecard:active{transform:scale(.97);}
.themesw{width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(0,0,0,.07);position:relative;overflow:hidden;}
.themesw i{position:absolute;inset:0;}
.themesw i:last-child{clip-path:polygon(100% 0,100% 100%,0 100%);}   /* second swatch = bottom-left triangle */
.themenm{font-size:10px;font-weight:800;color:var(--teal-ink);letter-spacing:.1px;}
.themecard.tlock .themesw,.themecard.tlock .themenm{opacity:.45;}    /* locked (premium) theme dims swatch+name */
.themelk{position:absolute;top:5px;right:5px;width:15px;height:15px;border-radius:50%;background:var(--yellow);
  color:#7A4B00;display:flex;align-items:center;justify-content:center;}
```

### Setting / link rows + toggle
```css
.setrow{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--line);}
.setrow:last-child{border-bottom:none;}
.setic{width:36px;height:36px;border-radius:12px;background:var(--cream);color:var(--teal);display:flex;align-items:center;justify-content:center;flex:none;}
.sett{flex:1;font-size:14px;font-weight:600;color:var(--teal-ink);}
.setsub{font-size:11px;color:var(--muted);font-weight:500;margin-top:1px;}
.chev{color:var(--line-2);display:flex;flex:none;}
.tgl{width:46px;height:27px;border-radius:var(--r-pill);background:var(--line-2);position:relative;transition:.2s;flex:none;}
.tgl::after{content:'';position:absolute;top:3px;left:3px;width:21px;height:21px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 2px 4px rgba(0,0,0,.2);}
.tgl.on{background:var(--good);}
.tgl.on::after{transform:translateX(19px);}
```

### Footer note
```css
.section-note{font-size:11.5px;color:var(--muted);text-align:center;padding:10px 16px 0;line-height:1.5;}
```

### Icon primitive (`ic(name,size)` → inline SVG), lines 168–170 + 1196
```css
.ic{display:inline-block;vertical-align:middle;flex:none;}
.ic.stroke{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ic.fill{fill:currentColor;stroke:none;}
```
`ic(name,size)` emits `<svg class="ic {mode} " width=size height=size viewBox="0 0 24 24">{path}</svg>`. Icons used and their raw geometry (viewBox 0 0 24 24):
| name | mode | path(s) |
|---|---|---|
| close | stroke | `M6.5 6.5l11 11M17.5 6.5l-11 11` |
| edit | stroke | `M4 20h4L18.5 9.5l-4-4L4 16z` · `M13.5 6.5l4 4` |
| chevR | stroke | `M9.5 5.5 16 12l-6.5 6.5` |
| flame | fill | `M12.8 2.4c.4 2.7 2.7 3.7 3.4 6.1.9 3.1-1.2 6.6-4.6 6.6-2.9 0-5-2.2-4.6-5.1.2-1.4 1-2.2 1.7-3 .2 1.3.9 2 1.7 2.2-.5-2.3.9-4.6 2-6.8z` · `M11 15.5c1.6 0 2.9 1 2.9 2.6 0 1.7-1.3 2.9-2.9 2.9s-2.7-1.2-2.7-2.7c0-1 .5-1.7 1.1-2.2.1.9.6 1.3 1.1 1.4-.3-1.1.1-1.6 .4-2z` |
| check | stroke | `M8 12.5 11 15.5 16.5 6.5` |
| chart | stroke | `M4 4v16h16` · `M7.5 15.5l3.5-4 3 2.6L19 8` |
| trophy | stroke | `M7 4.5h10v3.5a5 5 0 0 1-10 0z` · `M9.5 14.5h5M10.5 18.5h3M12 14.5v4M7 6H4.5v1a3 3 0 0 0 3 3M17 6h2.5v1a3 3 0 0 1-3 3` |
| gift | stroke | `M4 9.5…` rect+ribbon (line 1168) |
| sprout | stroke | `M12 20v-7M12 13c0-3 2.5-5 6-5 0 3-2.5 5-6 5zM12 13c0-2.6-2.2-4.5-5.5-4.5C6.5 11 8.7 13 12 13z` |
| crown | fill | line 1174 (crown + 3 dots) |
| bag | stroke | `M6 8h12l-.9 12H6.9z` · `M9 8V6.5a3 3 0 0 1 6 0V8` |
| users | stroke | line 1189 (two-person) |
| lock | stroke | `M5 10.4… rect + shackle` (line 1191) |
| bell | stroke | `M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 5.5 1.8 5.5H4.2S6 14 6 9.5z` · `M10 18.5a2 2 0 0 0 4 0` |
| clock | stroke | `M12 7.5V12l3 1.8` in `circle r=8.5` |
| heart | fill | `M12 20.7C6.5 17 3 13.8 3 9.9 3 7.2 5 5.4 7.4 5.4c1.7 0 3 .9 3.9 2.2.9-1.3 2.2-2.2 3.9-2.2 2.4 0 4.4 1.8 4.4 4.5 0 3.9-3.5 7.1-9 10.8z` |
| offline | stroke | `M6.5 3… rect(phone) + M10.5 18h3` |
| trash | stroke | `M5 7h14M9.5 7V4.8h5V7M6.5 7l1 12.5h9L17.5 7` |
| repeat | stroke | line 1149 (used in Reset dialog) |
| egg | stroke | `M12 3.2c3.9 0 6 5.7 6 10.6 0 4.2-2.7 6.9-6 6.9s-6-2.7-6-6.9C6 8.9 8.1 3.2 12 3.2z` (Reset dialog) |

`ASSETS.coin` (line 1083) is a WebP data-URI (gold coin). Rendered 18×18 in the "Earned" tile.

### Animations referenced by the screen's open/close + dialogs
```css
.slide-up{animation:slideup .32s cubic-bezier(.2,.8,.2,1) both;}
.slide-down{animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
.fade-in{animation:fade .28s ease both;}
@keyframes slideup{from{transform:translateY(100%)}to{transform:none}}
@keyframes slidedown{from{transform:none}to{transform:translateY(100%)}}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes fadeout{from{opacity:1}to{opacity:0}}
@media (prefers-reduced-motion: reduce){ .petart,.eggart,.gardensun,.gardencloud,.pilecoin img{animation:none!important;} }
```
Dialog chrome (editName / resetData use `openDialog`):
```css
.scrim{position:absolute;inset:0;background:rgba(11,37,48,.5);z-index:60;display:flex;align-items:flex-end;justify-content:center;animation:fade .2s both;}
.scrim.closing{animation:fadeout .24s both;}
.scrim.closing .dialog{animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
.dialog{background:#fff;border-radius:26px 26px 0 0;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;padding:22px 20px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.2);animation:slideup .3s cubic-bezier(.2,.8,.2,1) both;}
.dialog .grip{width:40px;height:5px;border-radius:9px;background:var(--line-2);margin:0 auto 16px;}
.dialog h3{text-align:center;font-size:19px;margin-bottom:4px;}
.dialog .d-sub{text-align:center;color:var(--muted);font-size:13.5px;margin-bottom:16px;line-height:1.5;}
.d-actions{display:flex;gap:10px;margin-top:16px;}
.field{width:100%;background:#fff;border:2px solid var(--line);border-radius:var(--r-md);padding:15px 16px;font-size:16px;color:var(--ink);font-weight:600;outline:none;transition:.15s;}
.field:focus{border-color:var(--orange);}
.btn.ghost{background:#fff;color:var(--teal);box-shadow:0 0 0 1.5px var(--line-2) inset;font-weight:600;}
.btn.ghost:active{transform:translateY(2px);}
.btn.block{display:flex;width:100%;}
```
Toast (line 734):
```css
#toast{position:absolute;left:50%;bottom:calc(var(--nav-h) + 26px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);background:rgba(11,37,48,.95);color:#fff;font-weight:600;font-size:13.5px;padding:11px 16px;border-radius:var(--r-md);display:flex;align-items:center;gap:8px;z-index:80;opacity:0;transition:.25s;pointer-events:none;max-width:86%;text-align:left;line-height:1.35;}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
#toast.high{bottom:auto;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%) translateY(-20px);}   /* used when a scrim/reward is open */
```

---

## 3. DATA / LOGIC (formulas verbatim)

Bound at top of `renderProfile` (lines 3752–3754):
```js
const P = S.profile, L = levelInfo();
const xpPct = Math.min(100, Math.round(L.xp / L.need * 100));
const totalKept = S.habits.reduce((a,h)=> a + Object.values(h.logs).filter(v=>v==='done').length, 0);
```

### `levelInfo()` (lines 1344–1348) — XP is lifetime coins
```js
function levelInfo(){
  let xp = Math.max(0, S.profile.lifetimeCoins||0), lvl = 1, need = 160;
  while(xp >= need){ xp -= need; lvl++; need = 10*lvl*lvl + 50*lvl + 100; }
  return {lvl, xp, need};
}
```
- Level 1 requires **160** XP (coins earned lifetime). After that the threshold per level is `10·lvl² + 50·lvl + 100`:
  - L2 need = 240, L3 = 340, L4 = 460, L5 = 600, L6 = 760 … (evaluated AFTER `lvl++`).
- `L.xp` = remaining XP inside current level; `L.need` = XP needed for the current level; `L.lvl` = current level number.
- Header shows: XP bar width = `xpPct`%; `«{money(L.xp)} of {money(L.need)} XP»`; `«Level {L.lvl+1} next»`; subtitle `«Level {L.lvl}…»`.

### Stat tiles
- **Streak** = `P.streak` (raw integer, `S.profile.streak`). No `money()` formatting.
- **Kept** = `money(totalKept)` where `totalKept` = total count across all habits of log entries whose value === `'done'`.
- **Earned** = `money(P.lifetimeCoins)` (= `S.profile.lifetimeCoins`, the same value that drives level/XP).

### Progress link-row counts
- Insights sub = `«{trackedDays()} days tracked across 30 metrics»`.
  - `trackedDays()` = `daysBetween(firstDay(), today()) + 1` (lines 3237–3238).
  - `firstDay()` = earliest key of `S.history` sorted ascending, else `today()`.
  - "30 metrics" is a hardcoded literal.
- Achievements sub = `«{S.achievements.length} of {ACHIEVEMENTS.length} badges»`. `ACHIEVEMENTS.length = 12` (lines 1266–1279).
- Habit Garden sub = `«{S.garden.length} of {GARDEN.length} plots grown»`. `GARDEN.length = 8` (lines 1244–1253).

### THEMES (lines 1257–1263) — drives the picker
```
id      name    premium  sw[0](base)  sw[1](accent)
hatch   Hatch   false    #0C4C60      #E28A4B
dusk    Dusk    true     #3E2E5E      #D9628F
forest  Forest  true     #1E4632      #D19A2E
ocean   Ocean   true     #123A5C      #2FA0AE
ember   Ember   true     #4A2A20      #DE5B39
```
Per-card flags (line 3801–3807):
```js
const locked = t.premium && !P.premium;
class = `themecard ${P.theme===t.id?'on':''} ${locked?'tlock':''}`
```
`.themesw` shows two color chips: `i[0]` fills the whole circle with `sw[0]`; `i[1]` overlays `sw[1]` clipped to the bottom-left triangle. Lock badge (`.themelk` + `ic('lock',9)`) only when `locked`.

### Helpers
- `money(n)` (line 1801): `Number(n||0).toLocaleString('en-US')` → integer with US thousands separators (e.g. `10,000`).
- `esc(s)` (line 1802): escapes `& < > "` → HTML entities.
- `avatarArt()` (3124): unhatched → `ART.eggWhole`; hatched svg species → `ART[species.art]`; hatched img species (dog/cat) → `<img src=ASSETS[species.img]>`.
- Demo-seed profile (`freshState(true)`, 1358–1362): name `"Haryanto"`, pet fox named `"Pip"`, hatched → subtitle reads `«Pip the fox»`. Settings default (`blankState`, line 1324): `{notif:true, sound:true, evening:true, hunger:true}` → all four toggles start ON.

---

## 4. INTERACTIONS (every handler)

| Element | Handler | Effect |
|---|---|---|
| `.iconbtn` (X) | `closeScreen('profile')` | `closeSlide('profile', …)` — adds `.slide-down`, after 250ms removes `.active`, then runs `renderAll()`. Returns to the tab shell underneath. |
| `.btn.sm` "Edit" | `editName()` | Opens bottom-sheet dialog (see below), focuses+selects the name field after 140ms. |
| `.plusrow` | `openPremium()` | `renderPremium()` then `openScreen('premium')` (slide-up premium screen). |
| `.themecard` | `setTheme('{id}')` | See `setTheme` below. |
| linkRow Insights | `openInsights('overview')` | Opens Insights dashboard on the overview sub-tab. |
| linkRow Achievements | `openAchievements()` | Opens Achievements screen. |
| linkRow Weekly recap | `openRecap()` | Opens Weekly recap screen. |
| linkRow Habit Garden | `closeScreen('profile'); setTimeout(()=>switchTab('garden'),260)` | Slides Profile down, then 260ms later switches the main tab bar to Garden. |
| linkRow Shop | `openShop('food')` | Opens Shop on the Food tab. |
| linkRow Invite a friend | `openReferral()` | Opens Referral screen. |
| linkRow Everything is offline | `toast('Nothing here leaves your phone.')` | Shows toast; no navigation, no state change. |
| linkRow Reset demo data | `resetData()` | Opens reset dialog (see below). |
| toggle (each of 4) | `toggleSet('{key}',this)` | See `toggleSet` below. |
| `.dev` hidden button (id in shell, line 1076) | `devTap()` | Triple-tap within 900ms → `resetData()` (hidden reset). Not part of Profile markup but reachable app-wide. |

### `setTheme(id)` (lines 1824–1829)
```js
function setTheme(id){
  const t = THEMES.find(x=>x.id===id); if(!t) return;
  if(t.premium && !S.profile.premium){ closeScreen('profile'); setTimeout(openPremium,240); return; }
  S.profile.theme = id; applyTheme(); save(); renderProfile();
  toast(`${t.name} theme applied`);
}
```
- **Locked/premium theme + non-premium user** → does NOT apply; slides Profile down and opens Premium after 240ms.
- Otherwise: sets `S.profile.theme`, `applyTheme()` (sets/removes `data-theme` on `<html>`; `hatch` removes the attribute → default palette), persists, re-renders Profile in place, toasts `«{name} theme applied»`.

### `toggleSet(k,el)` (lines 3845–3848)
```js
S.settings[k] = !S.settings[k];
el.classList.toggle('on', S.settings[k]);
save();
toast(`${label} ${S.settings[k]?'on':'off'}`);
```
Label map: `notif→'Reminders'`, `evening→'Evening sweep'`, `hunger→'Care alerts'`, else `'Sound'`. Toast e.g. `«Reminders off»`. Toggle knob animates via `.tgl.on` (track → `--good`, knob translateX 19px).

### `editName()` / `saveName()` (lines 3849–3861)
Dialog markup:
```html
<div class="grip"></div><h3>What should we call you?</h3>
<p class="d-sub">Only used to say hello.</p>
<input class="field" id="nameInput" maxlength="18" value="{esc(S.profile.name)}">
<div class="d-actions">
  <button class="btn ghost block" onclick="closeDialog()">Cancel</button>
  <button class="btn block" onclick="saveName()">Save</button>
</div>
```
`saveName()`: trims input; if non-empty sets `S.profile.name`; `save()`; `closeDialog()`; `renderProfile()`; `renderAll()`; `toast('Name updated')`. `maxlength=18`.

### `resetData()` / `doReset(demo)` (lines 3862–3886)
Dialog markup:
```html
<div class="grip"></div><h3>Reset the prototype</h3>
<p class="d-sub">Pick where to start again. Either way this only touches this browser.</p>
<div class="d-actions" style="flex-direction:column">
  <button class="btn block" onclick="doReset(true)">{ic('repeat',15)} Reload the demo save</button>
  <button class="btn ghost block" onclick="doReset(false)">{ic('egg',15)} Start fresh from the egg</button>
  <button class="btn ghost block" onclick="closeDialog()">Cancel</button>
</div>
<p class="section-note">Starting fresh walks you through onboarding again so you can watch the egg hatch from day zero.</p>
```
`doReset(demo)`:
- Always `closeDialog()` + `localStorage.removeItem(SAVE_KEY)` (`SAVE_KEY='habithatch_v2'`).
- `demo=true`: `S=freshState(true)`, `save()`, clears all `.screen` state classes, `show('main')`, `switchTab('today')`, `toast('Demo save reloaded')`.
- `demo=false`: resets onboarding object `ob={step:0,picks:[],species:'fox',name:''}`, `S=blankState()`, clears screens, `show('onboarding')`, `renderOnboarding()`.

---

## 5. NOTES (subtle behavior)

1. **Container is `.scroll`, not `.pad`.** The header (`.profhead`) is full-bleed at the top of the scroll surface; only the body below is padded (`.pad-flat` = `16px 16px 26px`). The teal header itself pads with `calc(16px + env(safe-area-inset-top))` on top for the notch.
2. **Avatar is NOT a plain `<img>`.** `avatarImg(64)` produces `.avwrap > .avin > (svg|img)`. For SVG species/egg the art fills 122% height, bottom-aligned inside the clipped circle (a "peeking" crop). For dog/cat (`kind:'img'`) an `<img>` is emitted and, due to source order, the `.profav img{width:64;height:64;border-radius:50%;object-fit:cover}` rule wins over `.avwrap img` — so raster avatars render as a plain 64px circle instead of the peeking crop.
3. **Pre-hatch vs post-hatch.** Subtitle: hatched → `«{petName} the {species.name.toLowerCase()}»`; unhatched → `«{petName||'egg'} the unhatched»`. Avatar shows the egg art when `S.pet.hatchState !== 'hatched'`. Care-alerts sub uses `esc(S.pet.name||'your companion')` when the pet is unnamed.
4. **Premium conditional rendering:**
   - `.plusrow` title appends `<span class="plusb">ACTIVE</span>` only when `P.premium`; subtitle and CTA copy both swap (`Manage`/`See plans`).
   - Appearance `.shead` right slot: the `«1 of 5 free»` `.muted` badge renders ONLY when `!P.premium`; premium users see just the heading.
   - Theme cards get `.tlock` + lock badge when `t.premium && !P.premium`. Tapping a locked card routes to Premium instead of applying.
5. **`prem` param of `linkRow` is never true in Profile** — every icon chip renders as the neutral `.setic` (cream bg, teal icon). The `.setic.prem` peach variant exists but is unused here.
6. **Row separators:** `.setrow` draws a bottom border; the last row of each card suppresses it two ways — `:last-child{border-bottom:none}` and (for `linkRow` last rows) an inline `border-bottom:none`. Rows within a card are separated but the card edge is clean.
7. **`.setrow` is polymorphic:** `linkRow` renders it as a `<button>` (whole row tappable, has `.chev` chevron), `toggleRow` renders it as a `<div>` (only the `.tgl` button is tappable, no chevron).
8. **Toggles default ON.** Fresh/blank state sets all four `settings` true, so all switches start green on first open.
9. **Theme application is global & instant.** `setTheme` mutates `<html data-theme>`, so accent colors across the whole app change immediately; `hatch` clears the attribute (default palette). Re-render is `renderProfile()` in place (no slide), keeping scroll position.
10. **No empty states in this screen** — counts can read `«0 of 8 plots grown»` / `«0 of 12 badges»` etc., but there is no alternate layout; the rows always render. `firstDay()` falls back to `today()` so `trackedDays()` is at minimum `1`.
11. **Footer disclaimer is static copy** (`.section-note`), always shown: reassures nothing can die and a miss only makes the pet hungry.
12. **Hidden reset:** app-wide `.dev` button (14px invisible strip at the very top, `opacity:0`, `z-index:95`) triple-tapped within 900ms also triggers `resetData()`.
