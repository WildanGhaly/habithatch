# Prototype spec — Premium + Referral screens

Source: `prototype/habithatch_v1.html`
JS: `renderPremium` (L3898–3947), `renderReferral` (L3976–3994), handlers L3948–4008.
Static screen scaffolds: L1039–1055. CSS: L8–965. Helpers/data: L1078–1957.

Both are **full-screen overlays** (`.screen.overlay`) that slide up over the tab UI. This is the build
contract — copy strings and numbers verbatim, never paraphrase.

---

## 0. GLOBAL DESIGN TOKENS (CSS custom properties)

Default theme (`:root`, L9–24). Values in the section below reference these by name.

```
--teal:#0C4C60;  --teal-2:#12667F;  --teal-ink:#0B2530;
--orange:#E28A4B; --orange-2:#C9773A;
--yellow:#FFDA7C; --yellow-2:#F4B942;
--coin-ink:#1E4B5F; --ink:#2D2F41; --muted:#8B897E;
--cream:#FBF6EC; --card:#FFFFFF; --line:#EFE6D6; --line-2:#E4D8C2;
--good:#1E7F91; --danger:#E5654B; --pink:#E68FB0;
--tint:#FFF7EF;        /* selected-chip wash */
--tint-2:#... (see theme note)  /* cool wash that pairs with --good; NOT defined in base :root, see NOTES */
--glow:rgba(226,138,75,.5);
--shadow:0 10px 16px rgba(12,76,96,.10);
--shadow-sm:0 4px 12px rgba(12,76,96,.08);
--r-sm:12px; --r-md:16px; --r-lg:20px; --r-pill:999px;
--nav-h:74px;
```

Themes `dusk/forest/ocean/ember` (L28–55) override the accent family only (`--teal`, `--orange`,
`--tint`, `--good`, `--sky`, `--tint-2`, `--glow`, `--shadow*`). See NOTES for which nodes in this
section actually retheme vs. use hardcoded hex.

---

# PART A — PREMIUM SCREEN

## A1. VISUAL TREE

Static scaffold `#premium` (L1039–1047) + dynamic `#premiumBody` filled by `renderPremium`.

```
section.screen.overlay#premium
├─ div.pbg                                         [teal gradient header — HARDCODED hex, does not retheme]
│  ├─ button.iconbtn                               [back; inline: position:absolute; left:16px; top:calc(20px + env(safe-area-inset-top))]
│  │                                               onclick="closeScreen('premium')"
│  │  └─ svg 24×24  <path d="M15 18l-6-6 6-6"/>    [chevron-left, inherits iconbtn stroke]
│  ├─ div  [inline: color:#FFDA7C; display:flex; justify-content:center]
│  │  └─ svg 42×42 fill="currentColor"  <path d="M4 8.5 7.5 12 12 5.5 16.5 12 20 8.5 18.5 18h-13z"/>   [gold sparkle-crown mark]
│  ├─ h2   [inline: color:#fff; font-size:23px; margin-top:6px]   "HabitHatch+"
│  └─ p    [inline: color:#BFE3F3; font-size:13.5px; margin:6px 0 0; line-height:1.5]
│           "Make it yours on day one: five themes, every companion and outfit.<br>All Garden perks stay earnable with coins, always."
└─ div.scroll#premiumBody
   └─ div.pad-flat  [inline: padding-top:18px]                    ← everything below is renderPremium output

      ┌ (CONDITIONAL, only if S.profile.premium === true) ┐
      │ div.callout.good  [inline: margin:0 0 14px]
      │   ├─ ic('checkCircle',15)   → svg.ic.stroke 15×15
      │   └─ span  "<b>HabitHatch+ is active.</b> Themes, the full collection and every dashboard are yours."
      └───────────────────────────────────────────────────┘

      div.card  [inline: padding:6px 16px; margin-bottom:14px]     ← BENEFITS list (6 rows from `feats`)
      ├─ div.benrow                                                [row 0]
      │  ├─ div.benic  [inline: color:var(--yellow-2)]  →  ic(icon,20)   svg 20×20
      │  └─ div.benmain
      │     ├─ div.bent   <feats[i][1]>   (title)
      │     └─ div.bend   <feats[i][2]>   (description)
      ├─ … rows 1–4 identical …
      └─ div.benrow  [inline on LAST row only: border-bottom:none]  [row 5]

      div.shead  [inline: margin-top:0]
      └─ h3  "Free and Plus, side by side"

      div.card.cmp                                                 ← COMPARISON table
      ├─ div.cmprow.cmphead
      │  ├─ span            (empty)
      │  ├─ span            "Free"
      │  └─ span.cplus      ic('crown',12) + " Plus"               (leading space before "Plus")
      ├─ div.cmprow                                                [table row 0]
      │  ├─ span.cmpk   <table[i][0]>       (row label)
      │  ├─ span.cmpf   cell(table[i][1])   (Free value)
      │  └─ span.cmpp   cell(table[i][2])   (Plus value)
      ├─ … rows 1–6 …
      └─ div.cmprow  [inline on LAST row only: border-bottom:none]  [table row 7]
         where cell(v):  v===true  → <span class="cyes">ic('check',13)</span>
                         v===false → <span class="cno">ic('close',12)</span>
                         else      → v  (raw string)

      div  [inline: height:14px]                                   (spacer)

      div.callout
      ├─ ic('shield',14)   → svg.ic.stroke 14×14
      └─ span  "Plus is themes, companions and deeper numbers. Every Garden perk that touches coins, decay or freezes stays earnable for free, so paying never makes the habits easier."

      div  [inline: height:14px]                                   (spacer)

      div.plan (+ .best if chosenPlan==='1 month')   onclick="choosePlan(this,'1 month')"
      ├─ div
      │  ├─ div.pdur   "1 Month"
      │  └─ div.psub   "Try it out"
      └─ div.pprice
         ├─ div.pp    "Rp 15.000"
         └─ div.pm    "/month"

      div.plan (+ .best if chosenPlan==='1 year')    onclick="choosePlan(this,'1 year')"
      ├─ span.bestbadge  "BEST VALUE"                             (absolutely positioned, top:-9px left:16px)
      ├─ div
      │  ├─ div.pdur   "1 Year"
      │  └─ div.psub   "Rp 9.900 / month"
      └─ div.pprice
         ├─ div.pp    "Rp 119.000"
         └─ div.pm    "/year"

      div.plan (+ .best if chosenPlan==='6 months')  onclick="choosePlan(this,'6 months')"
      ├─ div
      │  ├─ div.pdur   "6 Months"
      │  └─ div.psub   "Rp 11.500 / month"
      └─ div.pprice
         ├─ div.pp    "Rp 69.000"
         └─ div.pm    "/6 mo"

      button.btn.block  [inline: margin-top:8px]   onclick="buyPremium()"
        text = S.profile.premium ? "Manage subscription" : "Continue with Google Play"

      button.btn.ghost.block  [inline: margin-top:10px]   onclick="restorePurchase()"
        "Restore purchases"

      ┌ (CONDITIONAL, only if S.profile.premium === true) ┐
      │ button.btn.ghost.block  [inline: margin-top:10px; color:var(--muted)]  onclick="cancelPremium()"
      │   "Turn off for this demo"
      └───────────────────────────────────────────────────┘

      p.section-note
        "Billed through Google Play and linked to your account, so it restores on any device. Cancel any time. Prices are illustrative for this prototype."
```

### `feats` array (verbatim, L3899–3906) — `[icon, title, description]`
| # | icon (ic name) | title (`.bent`) | description (`.bend`) |
|---|---|---|---|
| 0 | `sparkle` | `Five app themes` | `Dusk, Forest, Ocean and Ember. Pick one the minute you sign up` |
| 1 | `shirt` | `The whole collection` | `Every companion and every outfit included, no coins needed` |
| 2 | `note` | `No habit cap` | `Build the routine you actually have. Free holds 7` |
| 3 | `chart` | `Full analytics` | `30 metrics across five dashboards, including blocker analysis and coin flow` |
| 4 | `calendar` | `Unlimited history` | `12 weeks and all time, instead of the free 4 week window` |
| 5 | `gift` | `Recap export` | `Save the weekly card as an image to share` |

### `table` array (verbatim, L3907–3916) — `[label, freeValue, plusValue]`
| # | `.cmpk` label | `.cmpf` Free | `.cmpp` Plus |
|---|---|---|---|
| 0 | `App themes` | `1` | `5` |
| 1 | `Companions` | `Dog, Cat` | `All 5` |
| 2 | `Outfits` | `With coins` | `All included` |
| 3 | `Active habits` | `7` | `No limit` |
| 4 | `Dashboards` | `5` | `5` |
| 5 | `History window` | `4 weeks` | `All time` |
| 6 | `Blocker analysis` | `false` → `.cno` ✕ icon | `true` → `.cyes` ✓ icon |
| 7 | `Recap export` | `false` → `.cno` ✕ icon | `true` → `.cyes` ✓ icon |

---

## A2. STYLE TABLE (Premium)

Every class the Premium subtree uses, declarations verbatim.

### Header / scaffold
```css
.screen{position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--cream);}
.screen.active{display:flex;}
.screen.overlay{z-index:40;}
.scroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}
.pad-flat{padding:16px 16px 26px;}

.pbg{background:linear-gradient(180deg,#0C4C60,#12667F);
  padding:calc(26px + env(safe-area-inset-top)) 24px 26px;text-align:center;position:relative;}

.iconbtn{width:40px;height:40px;border-radius:14px;background:rgba(255,255,255,.9);
  display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);flex:none;}
.iconbtn svg{width:18px;height:18px;stroke:var(--teal);stroke-width:2.5;fill:none;}
```

### Open/close animation (applied by openScreen/closeSlide)
```css
.slide-up{animation:slideup .32s cubic-bezier(.2,.8,.2,1) both;}
.slide-down{animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
@keyframes slideup{from{transform:translateY(100%)}to{transform:none}}
@keyframes slidedown{from{transform:none}to{transform:translateY(100%)}}
.fade-in{animation:fade .28s ease both;}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
```

### Card + callout
```css
.card{background:var(--card);border-radius:var(--r-lg);box-shadow:var(--shadow);border:1px solid var(--line);}

.callout{display:flex;gap:9px;align-items:flex-start;background:var(--cream);border:1px solid var(--line-2);
  border-radius:var(--r-sm);padding:10px 12px;margin-top:11px;font-size:11.5px;font-weight:600;color:var(--muted);line-height:1.45;}
.callout .ic{color:var(--orange);flex:none;margin-top:1px;}
.callout b{color:var(--teal-ink);}
.callout.good{background:#F1F7EE;border-color:#DCEBD2;}
.callout.good .ic{color:#5B8A38;}
.callout.warn{background:#FFF4E7;border-color:#F6DFC4;}   /* not used here, listed for completeness */
```

### Benefits rows
```css
.benrow{display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid var(--line);}
.benic{width:40px;height:40px;border-radius:13px;background:var(--cream);display:flex;align-items:center;justify-content:center;flex:none;}
.benmain{flex:1;min-width:0;}
.bent{font-weight:700;font-size:14px;color:var(--teal-ink);}
.bend{font-size:11.5px;color:var(--muted);font-weight:500;line-height:1.4;margin-top:2px;}
```
Note `.benic` gets inline `color:var(--yellow-2)` (icon tint = #F4B942).

### Section heading
```css
.shead{display:flex;align-items:center;justify-content:space-between;margin:18px 2px 10px;}
.shead h3{font-size:16px;}
h1,h2,h3,h4{margin:0;font-weight:700;color:var(--teal-ink);}   /* base heading */
```

### Comparison table
```css
.cmp{padding:2px 14px;}
.cmprow{display:grid;grid-template-columns:1fr 76px 82px;align-items:center;gap:6px;
  padding:10px 0;border-bottom:1px solid var(--line);}
.cmprow span{font-size:11.5px;font-weight:700;color:var(--teal-ink);text-align:center;}
.cmpk{text-align:left!important;color:var(--ink)!important;}
.cmpf{color:var(--muted)!important;}
.cmphead span{font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)!important;}
.cmphead .cplus{display:inline-flex;align-items:center;justify-content:center;gap:4px;color:#7A4B00!important;
  background:var(--yellow);border-radius:var(--r-pill);padding:3px 0;}
.cmpp{color:var(--orange-2)!important;font-weight:800;}
.cyes{display:inline-flex;color:var(--good);}
.cno{display:inline-flex;color:#CFC6B4;}
```

### Plan rows
```css
.plan{background:#fff;border:2px solid var(--line);border-radius:18px;padding:15px 16px;
  display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;position:relative;}
.plan.best{border-color:var(--orange);background:var(--tint);}
.bestbadge{position:absolute;top:-9px;left:16px;background:var(--orange);color:#fff;font-size:9.5px;font-weight:800;
  padding:3px 9px;border-radius:var(--r-pill);letter-spacing:.4px;}
.pdur{font-weight:800;font-size:15.5px;color:var(--teal-ink);}
.psub{font-size:11.5px;color:var(--muted);font-weight:600;margin-top:1px;}
.pprice{text-align:right;}
.pp{font-weight:800;color:var(--teal-ink);font-size:15px;}
.pm{font-size:11px;color:var(--muted);font-weight:600;}
```

### Buttons
```css
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;
  box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;}
.btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);}
.btn.block{display:flex;width:100%;}
.btn.ghost{background:#fff;color:var(--teal);box-shadow:0 0 0 1.5px var(--line-2) inset;font-weight:600;}
.btn.ghost:active{transform:translateY(2px);}
.btn.teal{background:var(--teal);box-shadow:0 6px 0 #072f3d;}      /* referral uses this */
.btn.teal:active{box-shadow:0 2px 0 #072f3d;}
.btn[disabled]{opacity:.5;box-shadow:none;pointer-events:none;filter:saturate(.6);}
```

### Section note
```css
.section-note{font-size:11.5px;color:var(--muted);text-align:center;padding:10px 16px 0;line-height:1.5;}
```

---

# PART B — REFERRAL SCREEN

## B1. VISUAL TREE

Static scaffold `#referral` (L1049–1055) + dynamic `#referralBody` filled by `renderReferral`.

```
section.screen.overlay#referral
├─ div.sheethead                                   [white bar, safe-area top pad, bottom border]
│  ├─ button.iconbtn   onclick="closeScreen('referral')"
│  │  └─ svg 24×24  <path d="M15 18l-6-6 6-6"/>    [chevron-left]
│  ├─ h2   "Invite friends"
│  └─ div  [inline: width:40px]                    (spacer to balance the back button)
└─ div.scroll#referralBody
   └─ div.pad-flat                                 ← renderReferral output

      div.refcard                                  [teal gradient card — HARDCODED hex]
      ├─ div  [inline: font-size:15px; font-weight:800]   "Give a Freeze, get a Freeze"
      ├─ div  [inline: font-size:12.5px; color:#D6EEF7; margin-top:4px; line-height:1.5]
      │        "Share your code. When a friend enters it on their first day, you both get a Streak Freeze, the token that covers one missed day."
      ├─ div.refcode                               <S.profile.code>   (e.g. "HATCH-4K9Q")
      └─ button.btn.block  [inline: background:#fff; color:var(--teal); box-shadow:0 5px 0 rgba(0,0,0,.15)]
            onclick="shareInvite()"   "Share invite"

      div.shead
      └─ h3  "Have a code?"

      input.field#refInput  [inline: text-transform:uppercase]  placeholder="Enter a friend's code"

      button.btn.block.teal  [inline: margin-top:10px]  onclick="redeemRef()"  "Redeem code"

      div.card  [inline: padding:14px 16px; margin-top:16px]
      ├─ div.row.spread
      │  ├─ div  [inline: font-weight:800; color:var(--teal-ink)]   "Your Streak Freezes"
      │  └─ span.chip.good      ic('snow',12) + " " + <S.profile.freezes> + " in hand"
      └─ div.smallnote
            "A Freeze is spent automatically on a day you would otherwise lose the streak. "
            + ( planted('sapling')
                 ? "Your Young Sapling grants one every week."
                 : "Plant the Young Sapling in the Garden to earn one weekly." )

      div.offnote
      ├─ ic('offline',15)   → svg.ic.stroke 15×15
      └─ span  "Sharing and redeeming are the only things in HabitHatch that need internet, so a code can be checked once. Everything else works offline."
```

## B2. STYLE TABLE (Referral)

```css
.sheethead{display:flex;align-items:center;gap:12px;padding:14px 16px;
  padding-top:calc(14px + env(safe-area-inset-top));background:#fff;border-bottom:1px solid var(--line);}
.sheethead h2{flex:1;font-size:18px;}

.refcard{background:linear-gradient(120deg,#0C4C60,#12667F);border-radius:22px;padding:18px;color:#fff;box-shadow:var(--shadow);}
.refcode{background:rgba(255,255,255,.16);border:1.5px dashed rgba(255,255,255,.5);border-radius:var(--r-sm);
  padding:11px;text-align:center;font-weight:800;font-size:18px;letter-spacing:3px;margin:12px 0;}

.field{width:100%;background:#fff;border:2px solid var(--line);border-radius:var(--r-md);padding:15px 16px;
  font-size:16px;color:var(--ink);font-weight:600;outline:none;transition:.15s;}
.field:focus{border-color:var(--orange);}
.field::placeholder{color:#BDB8AB;font-weight:500;}

.row{display:flex;align-items:center;}
.spread{justify-content:space-between;}

.chip{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;
  padding:4px 9px;border-radius:var(--r-pill);background:var(--cream);color:var(--teal);border:1px solid var(--line-2);}
.chip.good{color:var(--good);background:var(--tint-2);border-color:#CFE2E8;}

.smallnote{font-size:11px;color:var(--muted);font-weight:600;line-height:1.45;margin-top:8px;}

.offnote{display:flex;gap:8px;align-items:flex-start;margin-top:14px;padding:11px 13px;border-radius:var(--r-sm);
  background:var(--cream);border:1px solid var(--line-2);color:var(--muted);font-size:11.5px;font-weight:600;line-height:1.45;}
.offnote svg{flex:none;margin-top:1px;color:var(--teal);}
```
(`.card`, `.btn`, `.btn.block`, `.btn.teal`, `.shead/h3`, `.pad-flat`, `.scroll`, `.screen*`, `.iconbtn` as in Part A.)

---

## 3. DATA / LOGIC

### State fields read (initial values from `blankState`, L1316–1327)
| Path | Initial | Meaning |
|---|---|---|
| `S.profile.premium` | `false` | gates the active-callout, the buy/cancel buttons, button labels |
| `S.profile.code` | `'HATCH-4K9Q'` | the user's referral code shown in `.refcode` |
| `S.profile.freezes` | `0` | Streak-Freeze count shown in `.chip.good` |
| `S.profile.coins` / `lifetimeCoins` | `0` / `0` | wallet; mutated by redeem via `addCoins` |
| `S.garden` | `[]` | array of planted garden ids; `planted('sapling')` = `S.garden.includes('sapling')` |
| `S._redeemed` | `undefined` | one-shot flag; blocks a second redeem |
| `chosenPlan` (global, L3896) | `'1 year'` | which `.plan` gets `.best`; also the reward `sub` line |

### Plan pricing (verbatim, L3939–3941) — display strings only, no computation
| Order | `.pdur` | `.psub` | `.pp` | `.pm` | badge |
|---|---|---|---|---|---|
| 1 | `1 Month` | `Try it out` | `Rp 15.000` | `/month` | — |
| 2 | `1 Year` | `Rp 9.900 / month` | `Rp 119.000` | `/year` | `BEST VALUE` |
| 3 | `6 Months` | `Rp 11.500 / month` | `Rp 69.000` | `/6 mo` | — |

Default selected = `1 Year` (because `chosenPlan='1 year'`). Prices are static literals — no math.

### Garden data used (`GARDEN`, L1249)
```
{id:'sapling', name:"Young Sapling", desc:"Small tree, big shelter", cost:1400,
 perk:"1 Streak Freeze every week", ic:'sprout', art:'gTree', freeze:true}
```
Only `planted('sapling')` (boolean membership) is consulted here; it swaps the `.smallnote` tail text.

### Redeem reward math (`redeemRef`, L3999–4008)
- Grants exactly `+1` freeze: `S.profile.freezes += 1`.
- Grants `100` coins via `addCoins(100,'gift')`:
  ```js
  function addCoins(n,src){                                   // L1577
    S.profile.coins = Math.max(0, S.profile.coins + n);       // → coins + 100
    if(n>0){ S.profile.lifetimeCoins += n;                    // lifetime + 100
             if(src && S.stats.src[src]!=null) S.stats.src[src]+=n; }  // stats.src.gift + 100
  }
  ```
  `'gift'` is a valid source bucket (`S.stats.src = {check:0, clear:0, idle:0, gift:0}`, L1327).
- Toast number is raw literal `100` in the string (no `money()` formatting on the toast).

### Purchase reward card (`buyPremium` → `showReward`, L3958–3961)
No coins are granted; reward card shows a crown icon only. `sub` = `chosenPlan + " plan"` (e.g. `"1 year plan"`).

### Helpers referenced
```js
function ic(name,size=16,cls=''){                              // L1196 — inline-SVG icon factory
  const d=ICONS[name]; if(!d) return '';
  return `<svg class="ic ${d[0]} ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${d[1]}</svg>`;
}
// d[0] is 'stroke' | 'fill' → picks .ic.stroke or .ic.fill styling below.
.ic{display:inline-block;vertical-align:middle;flex:none;}
.ic.stroke{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ic.fill{fill:currentColor;stroke:none;}

function planted(id){ return S.garden.includes(id); }          // L1503
const money = n => Number(n||0).toLocaleString('en-US');       // L1801  (100 → "100")
function save(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }   // L1803
```

### Icon SVG paths used in this section (from `ICONS`, transcribe for pixel fidelity)
All render on a `0 0 24 24` viewBox. `stroke` icons inherit `stroke-width:2` round caps; `fill` icons fill currentColor.

| ic name | type | inner markup |
|---|---|---|
| `sparkle` | fill | `<path d="M12 3.5c1 5.8 2.7 7.5 8.5 8.5-5.8 1-7.5 2.7-8.5 8.5-1-5.8-2.7-7.5-8.5-8.5 5.8-1 7.5-2.7 8.5-8.5z"/>` |
| `shirt` | stroke | `<path d="M8 4 5 7l2 2 1-1v11h8V8l1 1 2-2-3-3-2 1.5a3 3 0 0 1-4 0z"/>` |
| `note` | stroke | `<rect x="4.5" y="4" width="15" height="16" rx="3"/><path d="M8 9h8M8 12.5h8M8 16h5"/>` |
| `chart` | stroke | `<path d="M4 4v16h16"/><path d="M7.5 15.5l3.5-4 3 2.6L19 8"/>` |
| `calendar` | stroke | `<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3.2v3.6M15.5 3.2v3.6"/>` |
| `gift` | stroke | `<rect x="4" y="9.5" width="16" height="10.5" rx="1.6"/><path d="M4 13h16M12 9.5V20"/><path d="M12 9.5C11 7 9 5.5 7.6 6.6 6.4 7.6 8.6 9.5 12 9.5z"/><path d="M12 9.5c1-2.5 3-4 4.4-2.9 1.2 1-.9 2.9-4.4 2.9z"/>` |
| `crown` | fill | `<path d="M4.6 16.4 3.1 8.6a.55.55 0 0 1 .86-.56l3.9 2.66 3.62-5.02a.62.62 0 0 1 1.02 0l3.62 5.02 3.9-2.66a.55.55 0 0 1 .86.56l-1.5 7.8z"/><rect x="4.5" y="17.7" width="15" height="2.7" rx="1.35"/><circle cx="3.6" cy="7.6" r="1.5"/><circle cx="20.4" cy="7.6" r="1.5"/><circle cx="12" cy="4.3" r="1.6"/>` |
| `shield` | stroke | `<path d="M12 3.2 19 6v5.2c0 4.8-3 7.7-7 9.6-4-1.9-7-4.8-7-9.6V6z"/><path d="M9 12l2.2 2.2L15.4 10"/>` |
| `checkCircle` | stroke | `<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2 11 15l5-5.6"/>` |
| `check` | stroke | `<path d="M8 12.5 11 15.5 16.5 6.5"/>` |
| `close` | stroke | `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>` |
| `snow` | stroke | `<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M12 6.6 9.8 4.8M12 6.6l2.2-1.8M12 17.4l-2.2 1.8M12 17.4l2.2 1.8"/>` |
| `offline` | stroke | `<rect x="6.5" y="3" width="11" height="18" rx="2.5"/><path d="M10.5 18h3"/>` |
| `trophy` | stroke | `<path d="M7 4.5h10v3.5a5 5 0 0 1-10 0z"/><path d="M9.5 14.5h5M10.5 18.5h3M12 14.5v4M7 6H4.5v1a3 3 0 0 0 3 3M17 6h2.5v1a3 3 0 0 1-3 3"/>` (default reward icon; not shown — buy uses crown) |

`ASSETS.coin` (L1083) is a `data:image/svg+xml,...` URI of the gold coin, passed as the toast image on redeem and as `<img>` inside the reward card. Referenced, not transcribed here (long inline data URI).

---

## 4. INTERACTIONS

### Entry points
- `openPremium()` (L3897): `renderPremium(); openScreen('premium')`.
- `openReferral()` (L3975): `renderReferral(); openScreen('referral')`.
- `openScreen(id)` (L1808): adds `.active .slide-up` to the section (slides up from bottom, 0.32s).
- `closeScreen(id)` (L1815): `closeSlide(id, ()=>renderAll())` — adds `.slide-down` (0.26s), removes `.active` after 250ms, then re-renders the underlying tab. Both back buttons call this.

### Premium handlers
| Handler | Trigger | Effect |
|---|---|---|
| `choosePlan(el,plan)` L3948 | tap any `.plan` | `chosenPlan = plan`; removes `.best` from **all** `.plan`; adds `.best` to tapped `el`. **No save, no re-render** — pure DOM class toggle. |
| `buyPremium()` L3953 | tap primary button | If already premium → `toast('Manage it in Play Store subscriptions')` and return. Else `S.profile.premium=true; save();` then `closeSlide('premium', cb)`; the callback runs `renderAll()` and `showReward({...})` (see below). |
| `restorePurchase()` L3968 | tap "Restore purchases" | `toast(premium ? 'Subscription already active' : 'No previous purchase found on this account')`. No state change. |
| `cancelPremium()` L3964 | tap "Turn off for this demo" (premium only) | `S.profile.premium=false; save(); renderPremium(); renderAll(); toast('HabitHatch+ turned off for this demo')`. Screen stays open, re-rendered in place. |

`buyPremium` reward payload (L3958–3961):
```js
showReward({
  title:"HabitHatch+ is on",
  sub: chosenPlan + " plan",                                  // e.g. "1 year plan"
  icon:`<div style="color:var(--yellow-2)">${ic('crown',52)}</div>`,   // gold crown, 52px
  note:"Pick a new theme, adopt any companion, and every dashboard is open.",
  goal:"Thanks for supporting a small, ad-free app."
});
```
`showReward` (L4185) builds `.rewardcard` in `#reward`, adds `.show`, and calls `confetti()`. Because
no `coins` key is passed, the `.rewardbonus` note renders in the muted variant (`.muted-bonus`) and no
coin stat tile appears. "Continue" button → `closeReward()` (fade-out, then `renderAll()`).

### Referral handlers
| Handler | Trigger | Effect |
|---|---|---|
| `shareInvite()` L3995 | tap "Share invite" | If `navigator.share` exists → `navigator.share({title:'HabitHatch', text:'Join me on HabitHatch. My code is '+S.profile.code}).catch(()=>{})`. Always `toast('Share sheet opened')`. |
| `redeemRef()` L3999 | tap "Redeem code" | Reads `#refInput`, `.trim().toUpperCase()`. Validation ladder → success path below. |

`redeemRef` logic (verbatim order):
1. `v = (#refInput.value || '').trim().toUpperCase()`
2. empty → `toast('Enter a code first')`, return.
3. `v === S.profile.code` → `toast('That is your own code')`, return.
4. `S._redeemed` truthy → `toast('A code can only be redeemed once')`, return.
5. Success: `S._redeemed=true; S.profile.freezes+=1; addCoins(100,'gift'); save();`
   clear input (`#refInput.value=''`); `renderReferral(); renderAll(); bumpCoins(); confetti();`
   `toast('Code accepted. +1 Streak Freeze and 100 coins', ASSETS.coin)` (toast shows coin icon).

Animation/feedback fired on successful redeem:
- `bumpCoins()` (L1935): removes+re-adds `.bump` on every `.coinpill` → `@keyframes bump` (0.5s, scale 1.16 at 30%).
- `confetti()` (L4168): skipped under `prefers-reduced-motion`. Spawns **70** `.conf` pieces, colors
  `['#E28A4B','#FFDA7C','#0C4C60','#1E7F91','#E68FB0','#12667F','#A7C34F']`, random `left` %, duration
  `1.6–3.0s`, delay `0–0.4s`, width `6–12px`, height `10–18px`; each removed after 3400ms. `@keyframes fall`
  translates Y +960px and rotates 720° to opacity .3.
- `toast(msg,img)` (L4161): sets innerHTML `(<img> if img)+<span>msg</span>`; adds `.high` class if a
  `.scrim:not(.closing)` or the reward overlay is open (so it clears modals); `.show` for 2400ms.

Toast / bump / confetti CSS:
```css
#toast{position:absolute;left:50%;bottom:calc(var(--nav-h) + 26px + env(safe-area-inset-bottom));
  transform:translateX(-50%) translateY(20px);background:rgba(11,37,48,.95);color:#fff;font-weight:600;
  font-size:13.5px;padding:11px 16px;border-radius:var(--r-md);display:flex;align-items:center;gap:8px;
  z-index:80;opacity:0;transition:.25s;pointer-events:none;max-width:86%;text-align:left;line-height:1.35;}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
#toast.high{bottom:auto;top:calc(16px + env(safe-area-inset-top));transform:translateX(-50%) translateY(-20px);}
#toast.high.show{transform:translateX(-50%) translateY(0);}
#toast img{width:20px;height:20px}
.coinpill.bump{animation:bump .5s ease;}
@keyframes bump{0%,100%{transform:none}30%{transform:scale(1.16)}}
#confetti{position:absolute;inset:0;pointer-events:none;z-index:75;overflow:hidden;}
.conf{position:absolute;width:9px;height:14px;top:-20px;border-radius:2px;animation:fall linear forwards;}
@keyframes fall{to{transform:translateY(960px) rotate(720deg);opacity:.3}}
```
Reward overlay CSS (fired on purchase):
```css
#reward{position:absolute;inset:0;z-index:70;background:rgba(11,37,48,.55);display:none;align-items:center;justify-content:center;padding:24px;}
#reward.show{display:flex;animation:fade .25s both;}
.rewardcard{background:#fff;border-radius:26px;padding:26px 22px;text-align:center;width:100%;max-width:330px;
  box-shadow:0 20px 60px rgba(0,0,0,.3);animation:pop .45s cubic-bezier(.2,1.3,.4,1) both;max-height:88vh;overflow-y:auto;}
.rewardcard .burst{display:flex;justify-content:center;margin-bottom:2px;animation:spinin 1.2s ease;}
@keyframes spinin{from{transform:rotate(-20deg) scale(.5)}to{transform:none}}
.rewardcard h2{font-size:23px;margin:6px 0 3px;}
.rewardcard p{color:var(--muted);font-size:14px;margin:0 0 18px;line-height:1.45;}
.rewardbonus{display:inline-flex;align-items:center;gap:6px;background:#FFF4E7;border:1px solid #F6DFC4;
  color:var(--orange-2);font-weight:700;font-size:12.5px;padding:8px 13px;border-radius:var(--r-sm);line-height:1.3;}
.rewardbonus.muted-bonus{background:var(--cream);border-color:var(--line-2);color:var(--muted);font-weight:600;}
.rewardgoal{font-size:11.5px;color:var(--muted);font-weight:700;margin-top:12px;}
@keyframes pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
```

---

## 5. NOTES (subtleties, conditionals, edge cases)

1. **Two premium visual states.** When `S.profile.premium` is `true`, three things change and re-render
   whenever `renderPremium()` runs:
   - The green `.callout.good` "HabitHatch+ is active." banner appears at the top.
   - Primary button label flips `"Continue with Google Play"` → `"Manage subscription"`.
   - An extra ghost button `"Turn off for this demo"` (muted text) appears.
   Free state omits all three.

2. **`choosePlan` never persists.** It only mutates the global `chosenPlan` and toggles `.best` in the
   DOM. If the screen re-renders (e.g. `cancelPremium` calls `renderPremium`), the highlight is rebuilt
   from `chosenPlan`, so the selection survives re-render but is **not** written to `S`/localStorage.

3. **Purchase closes the screen first.** `buyPremium` slides `#premium` down (`closeSlide`) and only in
   the after-callback runs `renderAll()` + `showReward()`. So the reward modal appears over the tab the
   user came from, not over the premium screen.

4. **Cancel re-renders in place.** `cancelPremium` keeps `#premium` open and calls `renderPremium()` +
   `renderAll()` — the active-banner/buttons update live without any slide animation.

5. **Redeem is one-shot & idempotent-guarded.** `S._redeemed` blocks a second grant across the whole
   session/save. Own-code and empty-input are rejected before the flag is set. On success the referral
   screen re-renders in place, so the `.chip.good` freeze count and the `.smallnote` update immediately;
   the input is cleared.

6. **Referral `.smallnote` has two variants** driven by `planted('sapling')`:
   - planted → `"Your Young Sapling grants one every week."`
   - not planted → `"Plant the Young Sapling in the Garden to earn one weekly."`
   (Prefix `"A Freeze is spent automatically on a day you would otherwise lose the streak. "` is constant.)

7. **Theme behavior — mixed.** Most nodes use CSS vars that retheme (`.card`, `.plan.best` uses
   `--orange`/`--tint`, `.benic` icon uses `--yellow-2`, `.chip.good` uses `--good`/`--tint-2`,
   `.cyes` uses `--good`, `.cmpp` uses `--orange-2`). **But** the two hero gradients are HARDCODED and do
   NOT retheme: `.pbg` = `linear-gradient(180deg,#0C4C60,#12667F)` and `.refcard` =
   `linear-gradient(120deg,#0C4C60,#12667F)`; likewise the `.cplus` badge/`.cmphead` inner tints use the
   fixed `--yellow`/`#7A4B00`. The refcard subtext color `#D6EEF7`, header subtitle `#BFE3F3`, and refcode
   dashed border `rgba(255,255,255,.5)` are all literal. So both hero surfaces stay teal in every theme.

8. **`--tint-2` in base theme.** The base `:root` defines `--tint-2:var(--tint-2)` (self-referential /
   effectively unset). Only the four premium themes give `--tint-2` a real value (`#EDE7F6`, `#E3EFE4`,
   `#E1F0F3`, `#F5E5DC`). In the default "hatch" theme `.chip.good` background (`var(--tint-2)`) resolves
   to an invalid/initial value — the visible fallback is the element's transparent background with the
   `#CFE2E8` border and `--good` text. Reproduce the base look accordingly (don't invent a fill).

9. **No empty states / no skeletons.** Both screens render fully-populated static copy every time; there
   is no loading, list-empty, or error branch. The only data-driven text is the freeze count, the code,
   and the two conditional variants above.

10. **Pre-hatch vs post-hatch:** these screens do NOT vary by pet hatch state. They are reachable and
    render identically regardless of `S.pet.hatchState`.

11. **`.field` input** is visually uppercased via inline `text-transform:uppercase` only; the actual
    normalization to uppercase happens in JS (`redeemRef` does `.toUpperCase()`), so the stored/compared
    value is genuinely uppercased, not just displayed that way. Placeholder `"Enter a friend's code"`,
    placeholder color `#BDB8AB`.

12. **Icon sizing is explicit per call:** benefits `20`, cplus crown `12`, cell check `13` / close `12`,
    shield `14`, active-callout checkCircle `15`, snow `12`, offline `15`, reward crown `52`. `ic()` writes
    these as literal `width`/`height` px on a 24-unit viewBox.

13. **Coin grant vs toast text.** Redeem grants 100 coins through `addCoins` (updates coins, lifetime, and
    the `gift` source bucket) but the toast prints the literal `"...and 100 coins"` — it is not derived
    from `money()`; the reward card path (`showReward`) is the only place `money()` would format coins, and
    the purchase reward passes no coins at all.
