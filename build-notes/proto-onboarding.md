# Onboarding Screen — Build Contract (proto `habithatch_v1.html`, lines 1957–2041)

Pixel-and-behavior-faithful spec for the 4-step onboarding flow. Source of truth:
`prototype/habithatch_v1.html`. Every string, number, hex, and px below is transcribed
verbatim — do not paraphrase.

The whole flow lives in one host element that is re-rendered on every step change:

```html
<section class="screen" id="onboarding">
  <div class="ob" id="obBody"></div>      <!-- innerHTML replaced by renderOnboarding() -->
</section>
```

`renderOnboarding()` (line 1957) sets `obBody.innerHTML = dots + body`, where `body`
switches on `ob.step` (0,1,2,3). State object: `let ob = {step:0, picks:[], species:'fox', name:''}`
(line 1955). `const OB_STEPS = 4` (line 1956).

---

## 1. VISUAL TREE

Every step renders the **dots** node first, then a step-specific body. The `.ob` container
is a flex column; `.dots` and `.obfoot` are `flex:none`, the middle region (`.ob-hero` /
`.ob-mid`) is `flex:1`.

### Shared — dots (all steps)
```
.ob#obBody
└─ div.dots
   ├─ i            ← class "on" when index i <= ob.step, else no class
   ├─ i            (4 total; OB_STEPS = 4)
   ├─ i
   └─ i
```
Fill rule: `<i class="${i<=ob.step?'on':''}">`. Step 0 → dot0 on. Step 1 → dot0,1 on.
Step 2 → 0,1,2 on. Step 3 → all 4 on.

### Step 0 — welcome / egg hero
```
.ob#obBody
├─ div.dots  (dot0 on)
├─ div.ob-hero
│  └─ div  [style="text-align:center"]
│     ├─ div.fit  [style="height:190px;margin-bottom:14px"]  → ART.eggWhole (inline SVG egg)
│     ├─ h2   → "You don't start<br>with a pet."          (literal <br>)
│     └─ p.sub → "You start with an egg. Keep your habits three days in a row and it hatches into a companion that grows with every streak you keep."
└─ div.obfoot
   └─ button.btn.block  [onclick="obNext()"]  → "Let's begin"
```

### Step 1 — pick categories
```
.ob#obBody
├─ div.dots  (dot0,1 on)
├─ div.ob-mid
│  ├─ h2   → "What do you want<br>to keep up?"
│  ├─ p.sub → "Pick two to four to start. You can add, edit or archive habits any time."
│  ├─ div.catgrid
│  │  └─ button.catopt[.on]  ×10  [onclick="obPick('<id>')"]   ('.on' when ob.picks includes id)
│  │     ├─ <svg>  → catArt(id)   (36×36 category icon)
│  │     └─ span.cl → category name
│  └─ div.pickcount → "<n> selected" + ( ob.picks.length<2 ? " · pick at least 2" : "" )
└─ div.obfoot
   └─ button.btn.block  [disabled unless ob.picks.length>=2]  [onclick="obNext()"]  → "Continue"
```
The 10 category buttons, in order (from `CATS` filtered to exclude `custom`), rendered as
`catArt(id)` icon + `<span class="cl">name</span>`:

| # | id (obPick arg) | label (`.cl` text) |
|---|-----------------|--------------------|
| 1 | `water`    | Water |
| 2 | `exercise` | Exercise |
| 3 | `read`     | Read |
| 4 | `meditate` | Meditate |
| 5 | `run`      | Move |
| 6 | `hygiene`  | Hygiene |
| 7 | `nophone`  | No phone |
| 8 | `wake`     | Wake early |
| 9 | `sleep`    | Sleep |
| 10 | `medicine` | Medicine |

(Note: id `run` shows label **Move**; its icon is `ART.run`.)

### Step 2 — pick species (horizontal carousel)
```
.ob#obBody
├─ div.dots  (dot0,1,2 on)
├─ div.ob-mid
│  ├─ h2   → "Who is in the egg?"
│  ├─ p.sub → "Choose the companion you are hoping for. Dog and Cat are free starters. The rest you can unlock later with coins."
│  ├─ div.speclist                       (horizontal scroll-snap carousel)
│  │  └─ button.speccard[.sel]  ×5  [onclick="obSpecies('<id>')"]  ('.sel' when ob.species===id)
│  │     ├─ span.sbadge.(free|prem)  → badge text (see table)
│  │     ├─ div.sart   → ART[art] (SVG)  OR  <img src=ASSETS[img] alt=name>
│  │     ├─ div.snm    → species name
│  │     └─ div.smeta  → species meta line
│  └─ div.smallnote  [style="text-align:center"] → "Swipe to see all five. Locked species stay claimable from the Shop."
└─ div.obfoot
   └─ button.btn.block  [onclick="obNext()"]  → "Continue"   (always enabled)
```
After render, if a `.speccard.sel` exists it is auto-centered:
`sel.scrollIntoView({block:'nearest',inline:'center'})` (lines 2006–2007). Default
`ob.species==='fox'`, so **Fox is pre-selected and scrolled to center** on first view.

The 5 species cards, in order (from `SPECIES`):

| # | id | name (`.snm`) | meta (`.smeta`) | badge text | badge class | art render |
|---|----|---------------|-----------------|-----------|-------------|-----------|
| 1 | `dog`     | Dog     | Loyal and easygoing | `Free`        | `free` | `<img src=ASSETS.dogthumb alt="Dog">` |
| 2 | `cat`     | Cat     | Curious and cozy    | `Free`        | `free` | `<img src=ASSETS.catthumb alt="Cat">` |
| 3 | `fox`     | Fox     | Clever and quick    | `600`         | `free` | `ART.fox` (inline SVG) |
| 4 | `penguin` | Penguin | Steady and social   | `900`         | `free` | `ART.penguin` (inline SVG) |
| 5 | `axolotl` | Axolotl | Rare and unbothered | `HabitHatch+` | `prem` | `ART.axolotl` (inline SVG) |

Badge text formula (line 1984): `s.premium ? 'HabitHatch+' : (s.price ? money(s.price) : 'Free')`.
Badge class (line 1984): `s.premium ? 'prem' : 'free'`. **Fox/Penguin cost coins but are NOT
premium** → they show the coin number with the green `.free` badge styling.
Art render (line 1985): `s.kind==='svg' ? ART[s.art] : '<img src="'+ASSETS[s.img]+'" alt="'+s.name+'">'`.

### Step 3 — name entry
```
.ob#obBody
├─ div.dots  (all 4 on)
├─ div.ob-mid
│  ├─ h2   → "Last thing"
│  ├─ p.sub → "What should we call you? Your companion gets named the moment it hatches."
│  ├─ div.label → "Your name"
│  ├─ input.field#obName
│  │     placeholder="e.g. Haryanto"  maxlength="18"
│  │     value="${esc(ob.name)}"      oninput="ob.name=this.value"
│  └─ div.card  [style="padding:14px 15px;margin-top:16px;display:flex;gap:12px;align-items:center"]
│     ├─ div.fit  [style="height:62px;width:52px;flex:none"] → ART.eggWhole (SVG egg)
│     └─ div
│        ├─ div [style="font-weight:800;color:var(--teal-ink);font-size:14px"] → "Three all-clear days"
│        └─ div.smallnote [style="margin-top:2px"] → "Finish every habit due on a day and the egg advances one stage. Three stages and it cracks open."
└─ div.obfoot
   └─ button.btn.block  [onclick="finishOnboarding()"]  → "Start hatching"
```

---

## 2. STYLE TABLE

### Root custom properties (default "Hatch" theme, `:root`, lines 9–24)
Only the vars referenced by this screen:
```
--teal:#0C4C60;  --teal-2:#12667F;  --teal-ink:#0B2530;
--orange:#E28A4B;  --orange-2:#C9773A;
--yellow:#FFDA7C;  --yellow-2:#F4B942;
--ink:#2D2F41;  --muted:#8B897E;
--cream:#FBF6EC;  --card:#FFFFFF;  --line:#EFE6D6;  --line-2:#E4D8C2;
--good:#1E7F91;
--tint:#FFF7EF;                         /* selected-chip wash */
--tint-2:var(--tint-2);                 /* SELF-REFERENTIAL on Hatch theme — see NOTES */
--glow:rgba(226,138,75,.5);             /* accent drop shadow */
--shadow:0 10px 16px rgba(12,76,96,.10);
--shadow-sm:0 4px 12px rgba(12,76,96,.08);
--r-sm:12px;  --r-md:16px;  --r-lg:20px;  --r-pill:999px;
```

### Screen container
```css
.screen{position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--cream);}
.screen.active{display:flex;}
.fade-in{animation:fade .28s ease both;}          /* applied by show('onboarding') */
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
```

### Onboarding layout
```css
.ob{flex:1;display:flex;flex-direction:column;
    padding:26px 22px calc(env(safe-area-inset-bottom) + 22px);overflow-y:auto;}
.ob-mid{flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0;}
.ob-hero{flex:1;display:flex;align-items:center;justify-content:center;position:relative;min-height:120px;}
.ob .dots{display:flex;gap:7px;justify-content:center;margin-bottom:14px;flex:none;}
.ob .dots i{width:8px;height:8px;border-radius:9px;background:var(--line-2);transition:.2s;}
.ob .dots i.on{width:22px;background:var(--orange);}
.ob h2{font-size:24px;line-height:1.25;margin-bottom:8px;}
.ob p.sub{color:var(--muted);font-size:14.5px;line-height:1.5;margin:0 0 18px;}
.obfoot{flex:none;margin-top:14px;display:flex;gap:10px;}
/* base heading rule that also applies to .ob h2 */
h1,h2,h3,h4{margin:0;font-weight:700;color:var(--teal-ink);}
```

### Primary button
```css
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
     background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);
     padding:14px 18px;box-shadow:0 6px 0 var(--orange-2);
     transition:transform .06s, box-shadow .06s;font-size:15px;}
.btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);}
.btn.block{display:flex;width:100%;}
.btn[disabled]{opacity:.5;box-shadow:none;pointer-events:none;filter:saturate(.6);}
```

### Category picker (step 1)
```css
.catgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.catopt{background:#fff;border:2px solid var(--line);border-radius:var(--r-md);
        padding:11px 6px 9px;display:flex;flex-direction:column;align-items:center;gap:6px;
        box-shadow:var(--shadow-sm);transition:.14s;position:relative;}
.catopt svg{width:36px;height:36px;}
.catopt .cl{font-size:11px;font-weight:700;color:var(--teal-ink);line-height:1.2;text-align:center;}
.catopt.on{border-color:var(--orange);background:var(--tint);}
.catopt.on::after{content:'';position:absolute;top:-6px;right:-6px;width:22px;height:22px;
   border-radius:50%;background:var(--orange);box-shadow:0 3px 8px var(--glow);
   background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.5 10 17.5 19 7'/></svg>");
   background-size:15px;background-position:center;background-repeat:no-repeat;}
.catopt:active{transform:scale(.96);}
.pickcount{font-size:12.5px;font-weight:700;color:var(--muted);text-align:center;margin-top:12px;}
```
The selected state adds a 22×22 orange circle badge with a white checkmark at the top-right
corner (offset −6px,−6px).

### Species carousel (step 2)
```css
.speclist{display:flex;gap:11px;overflow-x:auto;padding:4px 22px 10px;margin:0 -22px;
          scroll-snap-type:x mandatory;}
.speclist::-webkit-scrollbar{display:none}
.speccard{flex:none;width:132px;scroll-snap-align:center;background:#fff;
          border:2px solid var(--line);border-radius:var(--r-lg);padding:12px 10px 13px;
          text-align:center;box-shadow:var(--shadow-sm);transition:.15s;position:relative;}
.speccard.sel{border-color:var(--orange);background:var(--tint);}
.speccard .sart{height:106px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:6px;}
.speccard .sart svg{height:106px;width:auto;}
.speccard .sart img{height:96px;width:auto;object-fit:contain;mix-blend-mode:multiply;}
.speccard .snm{font-weight:800;font-size:14.5px;color:var(--teal-ink);}
.speccard .smeta{font-size:11px;color:var(--muted);font-weight:600;line-height:1.35;
                 margin-top:2px;min-height:29px;}
.speccard .sbadge{position:absolute;top:8px;right:8px;font-size:9.5px;font-weight:800;
                  padding:2px 7px;border-radius:var(--r-pill);}
.speccard .sbadge.free{background:var(--tint-2);color:var(--good);}   /* see --tint-2 note */
.speccard .sbadge.prem{background:var(--yellow);color:#7A4B00;}
```
Note the negative side margins (`margin:0 -22px`) + inner padding cancel the `.ob`'s 22px
side padding so the carousel bleeds edge-to-edge. `.sart img` uses `mix-blend-mode:multiply`
(dog/cat thumbnails); SVG species do not.

### Name entry (step 3)
```css
.label{font-size:12.5px;font-weight:700;color:var(--teal);margin:0 0 7px 4px;}
.field{width:100%;background:#fff;border:2px solid var(--line);border-radius:var(--r-md);
       padding:15px 16px;font-size:16px;color:var(--ink);font-weight:600;outline:none;transition:.15s;}
.field:focus{border-color:var(--orange);}
.field::placeholder{color:#BDB8AB;font-weight:500;}
.card{background:var(--card);border-radius:var(--r-lg);box-shadow:var(--shadow);border:1px solid var(--line);}
.smallnote{font-size:11px;color:var(--muted);font-weight:600;line-height:1.45;margin-top:8px;}
```
(Step 3 card overrides via inline style: `padding:14px 15px;margin-top:16px;display:flex;gap:12px;align-items:center`.
The `.smallnote` in step 3 overrides `margin-top:2px` inline; step 2 `.smallnote` adds `text-align:center`.)

### Inline-SVG fitter (egg art, steps 0 & 3)
```css
.fit{display:flex;align-items:flex-end;justify-content:center;}
.fit>svg{height:100%;width:auto;display:block;}
.fit>img{height:100%;width:auto;object-fit:contain;display:block;}
```

### Keyframes / transitions referenced
- `@keyframes fade` — the screen-enter animation (`.fade-in`, 0.28s ease).
- Transitions only (no keyframes) on: `.ob .dots i` (.2s), `.catopt` (.14s), `.speccard`
  (.15s), `.field` (.15s), `.btn` (transform .06s, box-shadow .06s).
- `:active` press states: `.btn:active` (translateY 4px, shadow collapses to `0 2px 0`),
  `.catopt:active` (scale .96). No `:active` on `.speccard`.

---

## 3. DATA / LOGIC

### State (`ob`), lines 1955–1956
```js
let ob = {step:0, picks:[], species:'fox', name:''};
const OB_STEPS = 4;
```

### `money` formatter (line 1801)
```js
const money = n => Number(n||0).toLocaleString('en-US');
```
→ `money(600)="600"`, `money(900)="900"`, `money(1200)="1,200"` (thousands comma).
Species prices: dog 0, cat 0, fox **600**, penguin **900**, axolotl **1200** (axolotl shows
"HabitHatch+" not its price because `premium:true`).

### `esc` (line 1802) — used for the name input value
```js
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,
  c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
```

### `pickcount` text (line 1975)
```
`${ob.picks.length} selected${ob.picks.length<2?' · pick at least 2':''}`
```
Examples: `0 selected · pick at least 2`, `1 selected · pick at least 2`, `2 selected`,
`4 selected`.

### `CATS` (lines 1201–1213) — filtered to drop `custom`; `catOf`, `catArt`
```js
catOf(id){ return CATS.find(c=>c.id===id) || CATS[CATS.length-1]; }   // fallback = custom
catArt(id){ return ART[id] || ART.custom; }                            // icon SVG per id
```

### `SPECIES` (lines 1218–1225)
```js
{id:'dog',     price:0,    premium:false, kind:'img', img:'dogthumb', meta:'Loyal and easygoing'}
{id:'cat',     price:0,    premium:false, kind:'img', img:'catthumb', meta:'Curious and cozy'}
{id:'fox',     price:600,  premium:false, kind:'svg', art:'fox',      meta:'Clever and quick'}
{id:'penguin', price:900,  premium:false, kind:'svg', art:'penguin',  meta:'Steady and social'}
{id:'axolotl', price:1200, premium:true,  kind:'svg', art:'axolotl',  meta:'Rare and unbothered'}
```
(Each also carries `wear:{w,t}` for outfit fitting — not used on this screen.)

### `STARTER` habit templates (lines 2017–2028) — applied at finish, one per picked category
```js
water:    {name:"Drink 8 glasses of water", sched:'daily',    remind:'09:00'}
exercise: {name:"Move for 20 minutes",      sched:'weekdays', remind:'17:30', days:[1,2,3,4,5]}
read:     {name:"Read before bed",          sched:'daily',    remind:'21:30'}
meditate: {name:"Five quiet minutes",       sched:'daily',    remind:'08:00'}
run:      {name:"Go for a run",             sched:'weekly',   perWeek:3, remind:'07:00'}
hygiene:  {name:"Floss tonight",            sched:'daily',    remind:'22:00'}
nophone:  {name:"No phone in bed",          sched:'daily',    remind:'21:00'}
wake:     {name:"Up by 7am",                sched:'weekdays', remind:'07:00', days:[1,2,3,4,5]}
sleep:    {name:"Lights out by 11",         sched:'daily',    remind:'22:45'}
medicine: {name:"Take my vitamins",         sched:'daily',    remind:'08:30'}
```
Fallback when a picked id has no STARTER entry (cannot happen for the 10 shown, since all 10
have entries): `{name: catOf(c).name, sched:'daily'}`.

### `newHabit` defaults (lines 1333–1341)
```js
{id:0, name:'', cat:'custom', sched:'daily', days:[1,2,3,4,5], perWeek:3, remind:'',
 cur:0, best:0, coins:0, archived:false, created:today(), logs:{}, rec:{}, void:{}}
```
Each finished pick becomes `newHabit(Object.assign({id:S.nextId++, cat:c}, STARTER[c]))`.

### `freshState(false)` → `blankState()` (lines 1315–1330) — the account onboarding creates
```js
profile:{name:"Friend", coins:0, premium:false, streak:0, best:0, freezes:0, freezeWeek:null,
         dailyGoal:0, lifetimeCoins:0, theme:'hatch', code:'HATCH-4K9Q'}
pet:{species:'fox', name:"", health:100, clothesId:0, ownedSpecies:['dog','cat'],
     ownedClothes:[], food:{1:1,2:1,3:0,4:0,5:0}, lastCollect:Date.now(),
     hatchState:'egg', hatchProgress:0, seenHatch:false, hatchedOn:null}
habits:[], history:{}, garden:[], achievements:[], ...
```

### `rollupDay(S, today())` (lines 1491–1498) — called at finish
```js
const due  = habits.filter(h=>isDue(h,d)).length;
const done = habits.filter(h=>h.logs[d]==='done').length;   // 0 on fresh onboarding
const g    = profile.dailyGoal;                             // 0 on fresh account
const goal = g>0 ? Math.min(g, Math.max(1,due)) : due;
history[d] = {...prev, due, done, ac:(due>0 && done>=goal)?1:0};
```
On a brand-new account `done=0`, so `ac=0` (day is not all-clear).

---

## 4. INTERACTIONS

| Handler (source) | Trigger | Effect |
|---|---|---|
| `obNext()` (1016 line 2016) | "Let's begin" (step0), "Continue" (step1/step2) | `ob.step++; renderOnboarding();` — advances one step, no persistence. |
| `obPick(id)` (lines 2009–2014) | tap a `.catopt` | Toggle `id` in `ob.picks`. If already present → `splice` out. If absent AND `ob.picks.length>=4` → `toast('Four is plenty for a first week')` and **return without adding**. Else push. Then `renderOnboarding()`. |
| `obSpecies(id)` (line 2015) | tap a `.speccard` | `ob.species = id; renderOnboarding();` — selection + auto re-center of the selected card. |
| `oninput` on `#obName` (line 1996) | typing in name field | `ob.name = this.value` (maxlength 18). No re-render. |
| `finishOnboarding()` (lines 2029–2041) | "Start hatching" (step3) | Full commit — see below. |

### `finishOnboarding()` sequence (lines 2029–2041)
```js
S = freshState(false);                                   // blank account, name "Friend", coins 0
S.profile.name = (ob.name||'Friend').trim();             // empty name → "Friend"
S.pet.species  = ob.species;                             // default 'fox'
if(!S.pet.ownedSpecies.includes(ob.species)) S.pet.ownedSpecies.push(ob.species);
                                                         // ownedSpecies starts ['dog','cat'];
                                                         // fox/penguin/axolotl gets appended
ob.picks.forEach((c,i)=>{                                // one habit per picked category
  const t = STARTER[c] || {name:catOf(c).name, sched:'daily'};
  S.habits.push(newHabit(Object.assign({id:S.nextId++, cat:c}, t)));
});
rollupDay(S, today());                                   // seed today's history row
save(); show('main'); switchTab('today');                // persist + navigate to Today tab
setTimeout(()=> toast("Your egg is in the nest. Keep today's habits to warm it up."), 500);
```
- Opens screen `#main`, tab **Today** (`switchTab('today')`).
- `show('main')` toggles the `#main` `.screen` active and replays the `.fade-in` animation.
- Persists to `localStorage` under `SAVE_KEY` (via `save()`).
- Fires a **toast** after 500 ms: `Your egg is in the nest. Keep today's habits to warm it up.`
- No confetti / reward overlay / hatch animation fires here (the pet is still an egg,
  `hatchState:'egg'`, `hatchProgress:0`).

### `toast(msg, img)` behavior (lines 4161–4167)
Sets `#toast` innerHTML to optional `<img>` + `<span>msg</span>`, adds `.show`, auto-hides
after **2400 ms** (`setTimeout(...,2400)`). Adds `.high` (top-anchored) only when a scrim
dialog or reward overlay is open — not the case during onboarding, so the onboarding/finish
toasts appear at the bottom.

---

## 5. NOTES / SUBTLETIES

1. **Entry points.** Onboarding is shown by:
   - First-run when there is no saved game: after the splash, `setTimeout(()=>{ show('onboarding'); renderOnboarding(); }, 2500)` (line 4235).
   - "Start fresh" reset path (lines 3881–3884): resets `ob={step:0,picks:[],species:'fox',name:''}`, `S=blankState()`, then `show('onboarding'); renderOnboarding()`.
   (The prototype's default boot actually seeds a demo save and skips onboarding; onboarding is reached via a fresh/reset account.)

2. **Single-host re-render.** The entire step swaps via `obBody.innerHTML`. There is no per-step
   mount/unmount animation — only the one-time `.fade-in` on the `#onboarding` screen when it
   becomes active. In React Native, model this as a single screen with a `step` state and
   conditional bodies; the dots + footer are always present.

3. **Continue gating.**
   - Step 0 / Step 2 buttons are always enabled.
   - Step 1 "Continue" carries the `disabled` attribute unless `ob.picks.length >= 2`
     (`${ob.picks.length>=2?'':'disabled'}`). Disabled style: opacity .5, no shadow,
     `pointer-events:none`, `filter:saturate(.6)`.
   - There is **no upper-bound disable**; the 4-pick cap is enforced only inside `obPick`
     (extra taps are refused with a toast).

4. **Default selections persist across steps.** `ob.species` defaults to `'fox'`, so Step 2
   always opens with Fox selected AND auto-centered via `scrollIntoView`. `ob.picks` starts
   empty, so Step 1 opens with the "pick at least 2" hint and a disabled Continue.

5. **Free badge shows a coin price.** Fox (`600`) and Penguin (`900`) are `premium:false` but
   `price>0`, so their badge text is the coin number while the badge keeps the green `.free`
   class styling. Only Axolotl (`premium:true`) shows "HabitHatch+" with the yellow `.prem`
   badge. Dog/Cat show literal "Free".

6. **`--tint-2` is self-referential on the default (Hatch) theme.** Line 18 declares
   `--tint-2:var(--tint-2);` (circular → guaranteed-invalid), so on the default theme
   `.sbadge.free{background:var(--tint-2)}` resolves to no background (transparent); only the
   `--good` (#1E7F91) text color shows. The four premium themes (dusk/forest/ocean/ember) each
   set a real `--tint-2`. For the RN rebuild, pick a concrete free-badge background (the intended
   value is the cool wash paired with `--good`; the themed values are `#EDE7F6`, `#E3EFE4`,
   `#E1F0F3`, `#F5E5DC`). Treat the transparent default as a bug, not intent.

7. **Art assets.** Egg (`ART.eggWhole`) and species art are inline SVG strings, except Dog/Cat
   which are raster thumbnails (`ASSETS.dogthumb` / `ASSETS.catthumb`, base64 data-URIs) rendered
   `<img>` with `mix-blend-mode:multiply`. Category icons are inline SVGs via `catArt(id)`
   (`ART[id]`, 36×36). Export these as assets for RN; the multiply blend on the two thumbnails
   matters for matching the paper background.

8. **Carousel edge-bleed.** `.speclist{margin:0 -22px;padding:...22px...}` deliberately cancels
   the `.ob` 22px horizontal padding so the carousel scrolls full-bleed while cards still inset
   22px at rest. `scroll-snap-type:x mandatory` + `.speccard{scroll-snap-align:center}`.

9. **No theme switching in-flow.** During onboarding the account is blank (`theme:'hatch'`), so
   `applyTheme()` removes `data-theme` and the default palette above applies. Onboarding does not
   expose the theme picker.

10. **Empty name → "Friend".** `(ob.name||'Friend').trim()`. The input is capped at 18 chars.
    The companion is NOT named during onboarding (`pet.name:""`); the copy states it is named at
    hatch time.

11. **Layout height behavior.** `.ob` is `overflow-y:auto` with `flex:1`; the middle region
    (`.ob-hero`/`.ob-mid`) is `flex:1` and vertically centers its content, pinning dots to the top
    and the footer button to the bottom. Bottom padding respects `env(safe-area-inset-bottom)`.
