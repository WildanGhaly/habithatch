# Shop screen — build contract (proto → React Native)

Source: `prototype/habithatch_v1.html`
Shop logic: lines **2909–3028**. Shop screen markup: lines **1012–1020**. CSS: lines **8–965**. Data/helpers: lines **1078–1957**, dialog/toast **4149–4184**.

The Shop is an **overlay screen** (`id="shop"`) with a fixed header (back button, title, live coin balance), a 3-way segmented tab strip (Food / Companions / Wardrobe), and a scrolling 2-column grid of product cards. Buying opens a bottom-sheet dialog. It is pure client state — no network.

---

## 1. VISUAL TREE

Static shell (markup in HTML, lines 1012–1020). `$('id')` = `document.getElementById`.

```
section.screen.overlay#shop                         ← when open gets +.active +.slide-up ; closing +.slide-down
  div.sheethead
    button.iconbtn            onclick="closeShop()"
      svg (viewBox 0 0 24 24)  path "M15 18l-6-6 6-6"   ← left chevron / back
    h2                        text: "Shop"
    span.coinpill#shopCoins                            ← filled by syncShopCoins()
        img (ASSETS.coin)   "{money(S.profile.coins)}"  e.g. "1,240"
  div.segtabs#shopTabs                                 ← innerHTML set by openShop()
    button[data-shop="food"]   onclick="shopTab('food')"
        img (ASSETS.foodIcon)  text "Food"
    button[data-shop="pets"]   onclick="shopTab('pets')"
        img (ASSETS.petIcon)   text "Companions"
    button[data-shop="clothes"] onclick="shopTab('clothes')"
        img (ASSETS.wardrobe)  text "Wardrobe"
    (active tab button gets +.on)
  div.scroll
    div.shopgrid#shopGrid                              ← innerHTML rebuilt per tab by shopTab()
      … shop cards …
```

The **active tab** button carries class `on` (toggled by `shopTab`: `b.classList.toggle('on', b.dataset.shop===curShop)`). Tab order is fixed Food, Companions, Wardrobe. Labels are verbatim: `Food`, `Companions`, `Wardrobe`.

### Shop card (produced by `shopCard(o)`, lines 2959–2973)

```
div.shopcard
  span.prembadge         ← ONLY if locked (o.premium && !S.profile.premium): {crown 11px} " HabitHatch+"
  <o.extra>              ← Food only: span.qty  "×{qty}"   (only when qty>0)
  EITHER  div.artsvg  {inline SVG from ART[...]}          ← svg-kind species
  OR      img.art  src="{o.img}"                          ← everything else
  div.cn   {o.name}
  div.cd   {o.desc}
  <btn>    ← one of the 5 buy-button variants below
```

Buy-button variants (mutually exclusive, evaluated in this order):
| condition | element | content |
|---|---|---|
| `o.btnClass==='equipped'` | `div.buy.equipped` onclick=`o.action` | `{check icon 13px} {o.label}` — label = `Active` (pets) / `Wearing` (clothes) |
| `o.btnClass==='equip'` | `div.buy.equip` onclick=`o.action` | `{o.label}` — label = `Switch` (pets) / `Wear` (clothes) |
| `locked` (premium item, user not subscribed) | `button.buy.prem` onclick=`o.action` | `{crown icon 13px} Unlock` |
| `o.price===0` | `button.buy` onclick=`o.action` | `o.included` ? `{crown icon 12px} Included` : `Free` |
| else (normal price) | `button.buy` onclick=`o.action` | `<img ASSETS.coin> {money(o.price)}` |

### Food tab cards (`shopTab`, lines 2923–2928)
Maps `FOODS`. For each food `f`:
- `img` = `ASSETS[f.img]`, `name` = `f.name`, `desc` = `` `+${f.heal} health` `` (e.g. `+10 health`), `price` = `f.price`, `premium` = `f.premium`, `action` = `` `buyFood(${f.id})` ``.
- `extra` = if owned qty `qty = S.pet.food[f.id]||0` > 0 → `` `<span class="qty">×${qty}</span>` `` else `''`.

### Companions (pets) tab cards (lines 2929–2939)
Maps `SPECIES`. For each species `s`:
- `art` = svg-kind → `` `<div class="artsvg">${ART[s.art]}</div>` `` ; img-kind → `null`.
- **If owned** (`S.pet.ownedSpecies.includes(s.id)`):
  - `img` = img-kind → `ASSETS[s.img]`, svg-kind → `null`; `artHTML` = `art`.
  - `name` = `s.name`; `desc` = active(`S.pet.species===s.id`) ? `Your companion` : `Adopted`.
  - `price` = `s.price`; `premium` = `s.premium`.
  - `btnClass` = active ? `equipped` : `equip`; `label` = active ? `Active` : `Switch`; `action` = `` `switchSpecies('${s.id}')` ``.
- **If NOT owned**:
  - `name` = `s.name`; `desc` = `s.meta` (e.g. `Clever and quick`).
  - `price` = `priceFor('species',s)`; `premium` = `s.premium`; `included` = `included('species')`; `action` = `` `buyPet('${s.id}')` ``.

### Wardrobe (clothes) tab cards (lines 2940–2947)
Maps `CLOTHES`. For each clothing `c`:
- `img` = `ASSETS[c.img]`, `name` = `c.name`, `desc` = `Cosmetic` (constant), `premium` = `c.premium`.
- **If owned** (`S.pet.ownedClothes.includes(c.id)`): `price` = `c.price`; `btnClass` = on(`S.pet.clothesId===c.id`) ? `equipped` : `equip`; `label` = on ? `Wearing` : `Wear`; `action` = `` `equip(${c.id});shopTab('clothes')` ``.
- **If NOT owned**: `price` = `priceFor('clothes',c)`; `included` = `included('clothes')`; `action` = `` `buyClothes(${c.id})` ``.

### Buy dialog (`buyDialog`, lines 2995–3006 ; hosted by `openDialog` in `#dialogHost`)

```
div.scrim  onclick="if(event.target===this)closeDialog()"
  div.dialog
    div.grip
    EITHER div.fit (style="height:120px;margin-bottom:10px") {inline SVG}   ← svg species (artsvg→fit swap)
    OR     img.d-art  src="{img}"                                            ← everything else
    h3   {name}
    p.d-sub   ← text depends on state (see Data/Logic §3)
    {err}     ← optional div.d-err (see below)
    div.d-line
      span.lbl "Price"
      span.val ← price===0 ? (premium user: "{crown 13px} Included" / else "Free") : "<img coin> {money(price)}"
    div.d-line
      span.lbl "Your balance"
      span.val "<img coin> {money(S.profile.coins)}"
    div.d-actions {actions buttons}
```

Dialog error blocks (`div.d-err`):
- Premium-locked (item is `premium` and user not subscribed): `{crown 15px} HabitHatch+ item. Subscribe to unlock it.`
- Not enough coins: `{info 15px} Not enough coins. {money(price - coins)} to go. Check off a few habits.`
- Enough coins / normal confirm: `err` = `''` (no block).

Dialog action-button rows (`div.d-actions`):
- Premium-locked: `button.btn.ghost.block "Not now"` (onclick closeDialog) + `button.btn.block "See HabitHatch+"` (onclick `closeDialog();openPremium()`).
- Not enough coins: single `button.btn.ghost.block "Okay"` (onclick closeDialog).
- Confirm buy: `button.btn.ghost.block "Cancel"` (onclick closeDialog) + `button.btn.block "Buy now"` (onclick `confirmBuy()`).

### Post-purchase "switch to new pet" dialog (`buyPet` onOk, lines 3017–3021, fires 400 ms after adopting)
```
div.dialog (via openDialog)
  div.grip
  h3   "Switch to your {s.name.toLowerCase()}?"     e.g. "Switch to your fox?"
  p.d-sub  "{esc(S.pet.name)} keeps every stat: health, growth stage and wardrobe carry straight over. You can switch back any time."
  div.d-actions
    button.btn.ghost.block "Later"        onclick=closeDialog()
    button.btn.block "Switch now"         onclick="closeDialog();switchSpecies('{id}')"
```

### Toast (global, `toast()` lines 4161–4167) — used for confirmations
`div#toast` gets `.show` (auto-hides after **2400 ms**). Content: optional `<img src>` + `<span>{msg}</span>`. Adds `.high` (top position) when a scrim/reward is open.

---

## 2. STYLE TABLE (verbatim declarations)

### CSS custom properties (`:root`, lines 9–24) — default "hatch" theme
```
--teal:#0C4C60; --teal-2:#12667F; --teal-ink:#0B2530;
--orange:#E28A4B; --orange-2:#C9773A;
--yellow:#FFDA7C; --yellow-2:#F4B942;
--coin-ink:#1E4B5F; --ink:#2D2F41; --muted:#8B897E;
--cream:#FBF6EC; --card:#FFFFFF; --line:#EFE6D6; --line-2:#E4D8C2;
--grass:#A7C34F; --sky:#BFE3F3; --room-bg:#A0B559; --floor:#DCC79A;
--good:#1E7F91; --danger:#E5654B; --pink:#E68FB0;
--tint:#FFF7EF;         /* selected-chip wash */
--tint-2:var(--tint-2); /* cool wash paired with --good (note: literal value only defined per-theme; base falls back to itself) */
--glow:rgba(226,138,75,.5);
--shadow:0 10px 16px rgba(12,76,96,.10);
--shadow-sm:0 4px 12px rgba(12,76,96,.08);
--r-sm:12px; --r-md:16px; --r-lg:20px; --r-pill:999px;
--nav-h:74px;
```
Theme override blocks (`:root[data-theme="dusk"|"forest"|"ocean"|"ember"]`, lines 28–55) only reassign the accent family (`--teal*`, `--orange*`, `--good`, `--sky`, `--tint`, `--tint-2`, `--coin-ink`, `--glow`, `--shadow*`). Paper/cards/artwork stay fixed. Each theme's `--tint-2` gets a real hex there (e.g. dusk `#EDE7F6`, forest `#E3EFE4`, ocean `#E1F0F3`, ember `#F5E5DC`).

### Screen container / animation
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
```
Note: `openScreen` adds `active slide-up`; `closeSlide` removes `slide-up fade-in`, adds `slide-down`, then removes `active slide-down` after **250 ms** (`setTimeout` token-guarded). Scrollbars are hidden on `#device *` (lines 101–103: `scrollbar-width:none`, webkit width/height 0).

### Header
```
.sheethead{display:flex;align-items:center;gap:12px;padding:14px 16px;padding-top:calc(14px + env(safe-area-inset-top));background:#fff;border-bottom:1px solid var(--line);}
.sheethead h2{flex:1;font-size:18px;}
.iconbtn{width:40px;height:40px;border-radius:14px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);flex:none;}
.iconbtn svg{width:18px;height:18px;stroke:var(--teal);stroke-width:2.5;fill:none;}
```
Header title `h2` inherits (line 140): `margin:0;font-weight:700;color:var(--teal-ink);` (overridden font-size 18px).

### Coin pill (balance)
```
.coinpill{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1.5px solid var(--line-2);
  padding:6px 12px 6px 7px;border-radius:var(--r-pill);font-weight:700;color:var(--coin-ink);box-shadow:var(--shadow-sm);}
.coinpill img{width:22px;height:22px}
.coinpill.bump{animation:bump .5s ease;}
@keyframes bump{0%,100%{transform:none}30%{transform:scale(1.16)}}
```
`bumpCoins()` re-triggers `.bump` on every `.coinpill` (removes class, forces reflow `void offsetWidth`, re-adds) after a purchase.

### Segmented tabs
```
.segtabs{display:flex;gap:6px;padding:12px 16px 4px;background:#fff;}
.segtabs button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 4px;border-radius:14px;font-weight:700;font-size:12px;color:var(--muted);border:1.5px solid transparent;}
.segtabs button img{width:26px;height:26px;opacity:.55;transition:.15s;}
.segtabs button.on{background:var(--tint);color:var(--orange-2);border-color:#F6DFC4;}
.segtabs button.on img{opacity:1;}
```

### Grid + card
```
.shopgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 16px calc(var(--nav-h) + 20px);}
.shopcard{background:#fff;border-radius:18px;padding:12px;box-shadow:var(--shadow-sm);border:1px solid var(--line);position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;text-align:center;}
.shopcard .art{width:78px;height:78px;object-fit:contain;margin:6px 0 8px;}
.shopcard .artsvg{width:78px;height:78px;display:flex;align-items:flex-end;justify-content:center;margin:6px 0 8px;}
.shopcard .artsvg svg{height:78px;width:auto;}
.shopcard .cn{font-weight:700;font-size:13.5px;color:var(--teal-ink);}
.shopcard .cd{font-size:11px;color:var(--muted);font-weight:600;margin-top:2px;min-height:15px;line-height:1.3;}
.shopcard .buy{margin-top:10px;width:100%;display:flex;align-items:center;justify-content:center;gap:5px;background:var(--orange);color:#fff;font-weight:800;padding:9px;border-radius:var(--r-sm);box-shadow:0 4px 0 var(--orange-2);font-size:13.5px;}
.shopcard .buy img{width:17px;height:17px}
.shopcard .buy:active{transform:translateY(2px);box-shadow:0 2px 0 var(--orange-2);}
.shopcard .buy.owned{background:var(--tint-2);color:var(--good);box-shadow:none;}
.shopcard .buy.equipped{background:var(--teal);box-shadow:0 4px 0 #072f3d;}
.shopcard .buy.equip{background:#fff;color:var(--teal);box-shadow:0 0 0 1.5px var(--line-2) inset;}
.shopcard .buy.prem{background:var(--yellow);color:#7A4B00;box-shadow:0 4px 0 #D9A93C;}
.prembadge{position:absolute;top:8px;left:8px;display:inline-flex;align-items:center;gap:3px;background:var(--yellow);color:#7A4B00;font-size:9.5px;font-weight:800;padding:3px 7px;border-radius:var(--r-pill);z-index:2;}
.qty{position:absolute;top:8px;right:8px;background:var(--cream);border:1px solid var(--line-2);color:var(--teal);font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:var(--r-pill);z-index:2;}
```
Note: `.buy` is a `<div>` for equipped/equip variants (non-`<button>`) but styled identically; `.buy.owned` is defined but NOT referenced by shop cards.

### Dialog (scrim + bottom sheet)
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
.d-line{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-top:1px solid var(--line);font-size:14px;}
.d-line .lbl{color:var(--muted);font-weight:600;}
.d-line .val{font-weight:800;color:var(--teal-ink);display:flex;align-items:center;gap:5px;}
.d-line .val img{width:18px;height:18px}
.d-err{background:#FDECE8;color:#C0432B;font-weight:600;font-size:13px;padding:11px 13px;border-radius:13px;margin:6px 0 4px;display:flex;gap:8px;align-items:center;}
.d-actions{display:flex;gap:10px;margin-top:16px;}
```
Dialog is hosted in `#dialogHost`; scrim closes on backdrop tap (`event.target===this`). `closeDialog` adds `.closing`, removes node after **250 ms**, and nulls `pendingBuy`.

### Buttons in dialog
```
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;
  box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;}
.btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);}
.btn.ghost{background:#fff;color:var(--teal);box-shadow:0 0 0 1.5px var(--line-2) inset;font-weight:600;}
.btn.ghost:active{transform:translateY(2px);}
.btn.block{display:flex;width:100%;}
.btn[disabled]{opacity:.5;box-shadow:none;pointer-events:none;filter:saturate(.6);}
```

### SVG fitter (used to swap `.artsvg` → `.fit` inside dialog)
```
.fit{display:flex;align-items:flex-end;justify-content:center;}
.fit>svg{height:100%;width:auto;display:block;}
.fit>img{height:100%;width:auto;object-fit:contain;display:block;}
```
`buyDialog` replaces `class="artsvg"` with `class="fit" style="height:120px"` inside a `div.fit` wrapper (`height:120px;margin-bottom:10px`).

### Icon helper output (`ic()`, line 1196)
`ic(name,size,cls)` → `<svg class="ic {kind} {cls}" width="{size}" height="{size}" viewBox="0 0 24 24">…</svg>`.
```
.ic{display:inline-block;vertical-align:middle;flex:none;}
.ic.stroke{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ic.fill{fill:currentColor;stroke:none;}
```
Icons used in shop:
- `crown` (kind `fill`): `<path d="M4.6 16.4 3.1 8.6a.55.55 0 0 1 .86-.56l3.9 2.66 3.62-5.02a.62.62 0 0 1 1.02 0l3.62 5.02 3.9-2.66a.55.55 0 0 1 .86.56l-1.5 7.8z"/><rect x="4.5" y="17.7" width="15" height="2.7" rx="1.35"/><circle cx="3.6" cy="7.6" r="1.5"/><circle cx="20.4" cy="7.6" r="1.5"/><circle cx="12" cy="4.3" r="1.6"/>`
- `check` (kind `stroke`): `<path d="M8 12.5 11 15.5 16.5 6.5"/>`
- `info` (kind `stroke`): `<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2M12 7.9v.1"/>`

### Toast
```
#toast{position:absolute;left:50%;bottom:calc(var(--nav-h) + 26px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(20px);
  background:rgba(11,37,48,.95);color:#fff;font-weight:600;font-size:13.5px;padding:11px 16px;border-radius:var(--r-md);
  display:flex;align-items:center;gap:8px;z-index:80;opacity:0;transition:.25s;pointer-events:none;max-width:86%;text-align:left;line-height:1.35;}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
#toast.high{bottom:auto;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%) translateY(-20px);}
#toast.high.show{transform:translateX(-50%) translateY(0);}
#toast img{width:20px;height:20px}
```

### Pet "cheer" animation (fired by `switchSpecies` on the home stage art)
```
.petart.cheer{animation:cheer .8s cubic-bezier(.2,1.4,.4,1) 2;}
@keyframes cheer{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-16px) rotate(-5deg)}60%{transform:translateY(-4px) rotate(4deg)}}
```

---

## 3. DATA / LOGIC (verbatim numbers)

### FOODS (line 1228) — `id, name, price, heal, premium, img`
| id | name | price | heal | premium | img key |
|----|------|-------|------|---------|---------|
| 1 | Apple | 5 | 10 | false | apple |
| 2 | Chicken | 5 | 10 | false | chicken |
| 3 | Pizza | 15 | 20 | **true** | pizza |
| 4 | Watermelon | 8 | 10 | false | melon |
| 5 | Carrot | 10 | 15 | false | carrot |
Card desc = `+{heal} health`. Card name = exact `name` (note id 4 name is `Watermelon` though img key is `melon`).

### SPECIES (line 1218) — `id, name, price, premium, kind, img|art, meta, wear`
| id | name | price | premium | kind | art/img | meta (desc when unowned) | wear{w,t} |
|----|------|-------|---------|------|---------|------|-----|
| dog | Dog | 0 | false | img | dogthumb | Loyal and easygoing | 58,59 |
| cat | Cat | 0 | false | img | catthumb | Curious and cozy | 56,57 |
| fox | Fox | 600 | false | svg | fox | Clever and quick | 54,60 |
| penguin | Penguin | 900 | false | svg | penguin | Steady and social | 54,58 |
| axolotl | Axolotl | 1200 | **true** | svg | axolotl | Rare and unbothered | 46,58 |
`spec(id)` returns the species or `SPECIES[0]` (dog). svg-kind renders `ART[art]` (inline SVG registry). img-kind renders `ASSETS[img]`.

### CLOTHES (line 1235) — `id, name, price, premium, img`
| id | name | price | premium | img key |
|----|------|-------|---------|---------|
| 1 | Cyan T-shirt | 80 | false | c1 |
| 2 | Green Shirt | 150 | false | c2 |
| 3 | Tuxedo | 320 | **true** | c3 |
| 4 | Star Shirt | 250 | **true** | c4 |
| 5 | Pink Dress | 400 | **true** | c5 |
Card desc is always the literal `Cosmetic`.

### Pricing / premium logic
```
priceFor(kind,item){ return (S.profile.premium && (kind==='species'||kind==='clothes')) ? 0 : item.price; }
included(kind){ return S.profile.premium && (kind==='species'||kind==='clothes'); }
```
Rationale (comment lines 2951–2953): companions + wardrobe are pure cosmetic, so **HabitHatch+ subscribers get the whole species/clothes collection for 0 coins ("Included")**. **Food is always paid** — even for premium — because it touches health and paying must never make habits easier. So `buyFood` uses raw `f.price`; food premium items (Pizza) still require a HabitHatch+ subscription to unlock but cost coins.

### `money(n)` (line 1801)
`const money=n=>Number(n||0).toLocaleString('en-US');` → thousands separators, e.g. `1240`→`1,240`.

### `spendCoins(n,bucket)` (line 1581)
```
S.profile.coins = Math.max(0, S.profile.coins - n);
if(bucket && S.stats.spent[bucket]!=null) S.stats.spent[bucket]+=n;
```
Buckets used by shop: `"food"`, `"clothes"`, `"species"`. Balance floored at 0. `S.stats.spent = {food:0, clothes:0, species:0, garden:0}`.

### Relevant `S` state (defaults, lines 1318–1328)
```
profile: { coins:0, premium:false, ... }
pet: { species:'fox', clothesId:0, ownedSpecies:['dog','cat'], ownedClothes:[], food:{1:1,2:1,3:0,4:0,5:0} }
stats.spent: {food:0, clothes:0, species:0, garden:0}
stats.outfitChanges: 0
```
(A demo/loaded save at line 1360 uses `ownedSpecies:['dog','cat','fox'], ownedClothes:[1,2]`.) So by default the user starts owning **dog + cat** species (no clothes), with 1 Apple + 1 Chicken in the food inventory.

### Dialog `d-sub` copy (buyDialog, line 2999)
- `price===0 && S.profile.premium` → `Part of your HabitHatch+ collection`
- else `premium` (item is premium) → `HabitHatch+ item`
- else → `Add it to your collection`

### Dialog `Price` value (line 3001)
- `price===0` → premium user: `{crown 13px} Included` ; else `Free`
- else → `<img coin> {money(price)}`

---

## 4. INTERACTIONS (every handler)

| Trigger | Handler | Effect |
|---|---|---|
| Open shop (called from elsewhere, `openShop(tab)`, l.2909) | sets `curShop=tab||'food'`, injects the 3 tab buttons into `#shopTabs`, `openScreen('shop')` (adds `active slide-up`), then `shopTab(curShop)`. |
| Back button `.iconbtn` | `closeShop()` (l.2917) | `closeSlide('shop', ()=>renderAll())` — slides screen down over 250 ms then re-renders the underlying tab. |
| Tap tab button | `shopTab('food'|'pets'|'clothes')` (l.2919) | sets `curShop`, toggles `.on` on the matching `[data-shop]` button, rebuilds `#shopGrid` innerHTML for that tab, then `syncShopCoins()`. |
| Tap **Food** card buy | `buyFood(id)` (l.3007) | `tryBuy({… bucket:'food', price:f.price …})`; onOk: `S.pet.food[id]=(S.pet.food[id]||0)+1; shopTab('food')` (re-renders qty badge). |
| Tap **Clothes** buy (unowned) | `buyClothes(id)` (l.3010) | `tryBuy({… bucket:'clothes', price:priceFor('clothes',c) …})`; onOk: push id into `ownedClothes` (if absent), set `clothesId=id` (auto-wears), `S.stats.outfitChanges++`, `shopTab('clothes')`. |
| Tap **Clothes** Wear/Wearing (owned) | `equip(id);shopTab('clothes')` (l.2745) | `equip`: if not owned → toast `Buy this outfit first`; else toggle `clothesId` (id or 0), inc `outfitChanges` if changed, `save()`, `renderAll()`, toast `Outfit removed` / `Looking sharp`. Then re-render tab. |
| Tap **Pet** buy (unowned) | `buyPet(id)` (l.3013) | `tryBuy({… bucket:'species', price:priceFor('species',s) …})`; onOk: `S.pet.ownedSpecies.push(id); shopTab('pets')`; then **after 400 ms** open the "Switch to your {name}?" dialog. |
| Tap **Pet** Switch/Active (owned) | `switchSpecies(id)` (l.3022) | if not owned → `buyPet(id)`; if already active → toast `{name} is already your {species}`; else set `S.pet.species=id`, `save()`, `shopTab('pets')`, `renderAll()`, toast `{name} is a {species} now`, add `.cheer` to `.petart` on home stage. |
| Locked (premium, no sub) card button | its `o.action` still fires | but `tryBuy` intercepts: shows the **HabitHatch+ / Subscribe** dialog instead of buying. |
| Dialog "Buy now" | `confirmBuy()` (l.2994) | runs `pendingBuy()` then nulls it. |
| Dialog "See HabitHatch+" | `closeDialog();openPremium()` | closes sheet, opens premium screen (`renderPremium(); openScreen('premium')`). |
| Dialog "Switch now" | `closeDialog();switchSpecies(id)` | closes sheet then switches active species. |
| Dialog "Cancel"/"Not now"/"Okay"/"Later" | `closeDialog()` | close only. |
| Backdrop tap | `closeDialog()` | close only (only when target is the scrim itself). |

### `tryBuy({img,artHTML,name,price,premium,onOk,bucket})` (lines 2975–2993) — the gate
1. `pendingBuy=null` (clear any stale confirm).
2. **If** `premium && !S.profile.premium` → open dialog with premium-lock `d-err` + Not now / See HabitHatch+ actions. `return`.
3. **Else if** `S.profile.coins < price` → open dialog with not-enough-coins `d-err` (`{money(price-coins)} to go`) + single Okay. `return`.
4. **Else** → open confirm dialog (no err) with Cancel / Buy now, and set
   `pendingBuy = () => { spendCoins(price, bucket||"food"); onOk(); syncShopCoins(); closeDialog(); save(); toast(`${name} is yours`, ASSETS.coin); bumpCoins(); renderAll(); checkAch(); }`.

So a successful purchase fires, in order: **deduct coins → mutate inventory (onOk) → refresh header coins → close dialog → persist (save) → toast "`{name} is yours`" with coin icon → bump coin pill → renderAll → checkAch** (achievement check). No confetti/reward on a shop buy (that's for check-offs/hatch).

### `syncShopCoins()` (l.2918)
`#shopCoins`.innerHTML = `<img src="${ASSETS.coin}">${money(S.profile.coins)}`. Called on tab switch and after each buy.

---

## 5. NOTES (subtle behavior)

- **Grid is a 2-column CSS grid**, gap 12px, padding `14px 16px calc(74px + 20px)` (bottom clears the nav). Cards are equal-width `1fr 1fr`, centered content, `overflow:hidden`.
- **`min-height` reserves layout**: `.cd` (desc) `min-height:15px` so single/blank descriptions keep card heights aligned. No empty-state screen exists — every tab always renders its full fixed list; there is no "no items" state.
- **Owned vs unowned diverge only in the button + desc**, not layout. Owned pet/clothes show an `equipped` (filled teal) or `equip` (white outline) pill rendered as a `<div>` (not `<button>`), so no native button semantics — replicate tap target manually in RN.
- **Premium (HabitHatch+) rules**:
  - Premium items always render the `.prembadge` "HabitHatch+" crown badge **while the user is not subscribed** (`locked`). Once subscribed, no badge, and species/clothes buy button shows `{crown} Included` (price becomes 0 via `priceFor`), while premium **food** (Pizza) still shows its coin price (food never becomes free).
  - `locked` also swaps the buy button to yellow `.buy.prem` "`{crown} Unlock`". Tapping it routes through `tryBuy` → subscribe dialog, never a purchase.
  - Edge case: the buy-button `btnClass` branch (equipped/equip) is checked **before** `locked`, so an owned premium item would show its equip button, not Unlock. (Owning a premium item without a sub is normally unreachable since buying requires the sub.)
- **Food quantity badge** (`.qty` "×N") shows top-right only when `S.pet.food[id] > 0`. Buying food increments the count and re-renders the same tab, so the badge updates live.
- **Buying clothes auto-equips** it (`clothesId=id`) and counts an outfit change; buying a pet does **not** auto-switch — it prompts via the 400 ms delayed "Switch now?" dialog. The pet you already have stays active until confirmed.
- **Switching species** carries all stats over (copy: health, growth stage, wardrobe) and triggers the home-stage pet `.cheer` bounce (runs twice, 0.8 s). It also toasts.
- **Coin pill bump**: after any successful buy, ALL `.coinpill` on screen animate `bump` (scale 1.16 at 30%). The shop header pill and the home pill share the class.
- **Theme awareness**: the shop uses `--tint`, `--tint-2`, `--orange*`, `--teal*`, `--good` throughout, so it fully reskins under the 4 premium themes (dusk/forest/ocean/ember) via `:root[data-theme=…]`. Paper (`--cream`), card white, `--line*`, `--yellow` badges stay constant across themes. Default (no attribute) = "hatch".
- **Asset keys** (from `ASSETS`, all inline data-URI images): `coin, foodIcon, petIcon, wardrobe, apple, chicken, pizza, melon, carrot, c1..c5, catthumb, dogthumb`. svg species art comes from the `ART` registry (`fox, penguin, axolotl`) as raw inline SVG strings — not from ASSETS.
- **Timing constants to preserve**: screen open slide-up 0.32 s; close 0.26 s but node removed after 250 ms; dialog slide-up 0.3 s / down 0.26 s, removed after 250 ms; toast visible 2400 ms; post-adopt switch dialog delay 400 ms; coin bump 0.5 s; cheer 0.8 s ×2.
- **Persistence**: every mutation calls `save()` (localStorage). `renderAll()` re-renders the underlying home/garden/etc. behind the overlay so returning shows updated coins/pet.
- The header title is a plain `<h2>Shop</h2>`; there is no subtitle. The back chevron is a hand-rolled 18px stroked SVG (`stroke:var(--teal); stroke-width:2.5`).
