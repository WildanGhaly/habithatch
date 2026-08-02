# HabitHatch — Insights screen build contract

Pixel-and-behavior-faithful spec of the **Insights** overlay screen, extracted from
`prototype/habithatch_v1.html`. Source of truth: DOM shell at line 1022–1029, render
logic at lines 3339–3702, CSS at lines 8–965, constants/helpers at lines 1146–3334.

Everything below is transcribed verbatim from the prototype. Numbers, thresholds,
colors, copy strings and emoji/punctuation are exact — do not paraphrase when rebuilding.

---

## 0. SCREEN IDENTITY & MECHANICS

- Screen id: `insights`. It is a `<section class="screen overlay" id="insights">` — an
  **overlay** screen (z-index 40), opened on top of the tab screens.
- Opened by `openInsights(t)` (line 3343): `if(t)insTab=t; renderInsights(); openScreen('insights');`
  - `openScreen` (1808) adds classes `active slide-up` → CSS `@keyframes slideup` translates
    from `translateY(100%)` to none over `.3s cubic-bezier(.2,.8,.2,1)`.
- Closed by the back button → `closeScreen('insights')` (1815) → `closeSlide` adds `slide-down`
  (`@keyframes slidedown` none→`translateY(100%)` over `.26s cubic-bezier(.4,0,.9,.5)`), removes
  `active` after 250ms, then calls `renderAll()`.
- Module-level state (line 3339): `let insTab='overview', insRange=28;`
  - `insTab` ∈ `overview | habits | streaks | economy | companion`.
  - `insRange` ∈ `7 | 28 | 84 | 0` (0 = all time).
- `renderAll()` re-renders this screen if active (line 1839): `if($('insights').classList.contains('active')) renderInsights();`
- Entry points elsewhere in the app (not part of this screen but relevant to `insTab` preselection):
  - Home "This week" header link → `openInsights()` (no arg, keeps current `insTab`).
  - Home tiles → `openInsights('overview')` and `openInsights('streaks')`.
  - Home garden strip / week card → `openInsights('overview')` / `openInsights()`.
  - Profile row → `openInsights('overview')`.

### Static DOM shell (lines 1022–1029, verbatim)

```html
<section class="screen overlay" id="insights">
  <div class="sheethead">
    <button class="iconbtn" onclick="closeScreen('insights')"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
    <h2>Insights</h2><div style="width:40px"></div>
  </div>
  <div class="subtabs" id="insightsTabs"></div>
  <div class="scroll" id="insightsBody"></div>
</section>
```

`#insightsTabs` and `#insightsBody` are filled by `renderInsights()`.

---

## 1. VISUAL TREE

### 1a. `renderInsights()` (lines 3374–3385) — the frame

```
section#insights .screen.overlay
├─ div.sheethead
│  ├─ button.iconbtn            (back; SVG chevron-left path "M15 18l-6-6 6-6", stroke via .iconbtn svg)
│  ├─ h2  "Insights"
│  └─ div (inline width:40px spacer)
├─ div.subtabs#insightsTabs      ← INS_TABS.map(...)
│  └─ button[.on if insTab===tab[0]]  ·  ic(tab[2],13) + " " + tab[1]   (×5)
│        overview → chart-icon "Overview"
│        habits   → note-icon  "Habits"
│        streaks  → flame-icon "Streaks"
│        economy  → bag-icon   "Coins"
│        companion→ heart-icon "Companion"
└─ div.scroll#insightsBody
   ├─ div.rangebar               (ONLY when NOT bare; omitted on empty state)
   │  └─ button[.on if insRange===r[0]]  ·  r[1] label  (×4)
   │        "7 days" (r=7)  "4 weeks" (r=28)  "12 weeks" (r=84, premium)  "All time" (r=0, premium)
   │        premium ranges when !premium append:  span.plock > lock-icon(9)
   └─ div.pad-flat (inline style padding-top:14px)
      └─ {tab body}   ← insEmpty() OR insOverview/insHabits/insStreaks/insEconomy/insCompanion
```

Tab button markup (3375–3376):
`<button class="${insTab===t[0]?'on':''}" onclick="setInsTab('${t[0]}')">${ic(t[2],13)} ${t[1]}</button>`

Rangebar button markup (3381–3383):
`<button class="${insRange===r[0]?'on':''}" onclick="setRange(${r[0]},${r[2]})">${r[1]} ${r[2]&&!premium?'<span class="plock">'+ic('lock',9)+'</span>':''}</button>`

`bare = !S.stats.checkoffs` (line 3377). When `bare` is truthy → no rangebar, body = `insEmpty()`.

---

### 1b. Empty state `insEmpty()` (lines 3360–3373)

Only rendered when nothing has ever been checked off (`S.stats.checkoffs === 0`).
`const live=S.habits.filter(h=>!h.archived).length;`

```
div.empty (inline style padding:44px 22px)
├─ div.em-ic         · ic('chart',44)
├─ div.em-t          · live ? "No numbers yet" : "Nothing to measure yet"
├─ div.em-s          · live
│                        ? "Check off a habit and your first day lands here.<br>Patterns start showing up after about a week."
│                        : "Add a habit first. Once you start checking things off,<br>five dashboards fill in behind this screen."
├─ button.btn.sm (inline style margin-top:16px)
│     onclick="closeScreen('insights');setTimeout(()=>switchTab('today'),240)"
│     · ic(live?'check':'plus',15) + " " + (live ? "Go check one off" : "Add a habit")
└─ div.insprev       · six span pills, verbatim order:
      "Completion rate" "Streak history" "Coin flow" "Weekday patterns" "Blocker analysis" "Health trend"
```

---

### 1c. Tab 1 — OVERVIEW `insOverview()` (lines 3388–3447)

```
(fragment)
├─ div.sgrid (inline margin-bottom:12px)          ← 4 stat cards, 2-col grid
│  ├─ statCard  Kept        target-icon   value a.rate "%"  delta=deltaChip(a.rate, p.due?p.rate:null,'pt')  sub "{a.done} of {a.due} scheduled"
│  ├─ statCard  All-clear   checkCircle   value a.ac  unit " / {a.active}"  delta=deltaChip(a.ac, p.active?p.ac:null)  sub "{a.acRate}% of active days"
│  ├─ statCard  Streak      flame-icon    value S.profile.streak "d"  sub "Best run {S.profile.best} days"
│  └─ statCard  Kept all time  check-icon value money(totalKept)  sub "Across {trackedDays()} tracked day{s}"
│
├─ panel  pulse "Consistency score"
│     sub "Half completion rate, a third all-clear days, the rest current streak."
│     body = gauge(score, <label>, <sub>)   (see DATA §3 for label/sub thresholds)
│     foot "Free plan tracks 4 weeks. <b>{trackedDays()} day{s}</b> of history recorded so far."
│
├─ panel  bars "Daily completion"   right=<span class="chip">{rangeLabel()}</span>
│     sub "Green bars are days you cleared everything that was due."
│     body = barsChart(rows→{v,label,hi,now,off}, {height:100})
│     foot "<b>{a.done}</b> habits kept, <b>{a.due-a.done}</b> missed, <b>{a.ac}</b> perfect days."
│
├─ panel  chart "Weekly trend"
│     sub "Completion rate per week, most recent on the right."
│     body = lineChart(weeks.map(w=>w.pct), {height:84, zero:true})
│          + div.lcx > span prettyDate(weeks[0].start) · span "this week"
│     foot (only if weeks.length>1) "Last week <b>{...}%</b>, this week <b>{...}%</b> so far."
│
├─ panel  (mom>=0?arrUp:arrDn) "Momentum"
│     sub "Your last 7 days against your last 28."
│     body = div.sgrid (inline grid-template-columns:1fr 1fr)
│              ├─ statCard clock  "Last 7 days"  last7 "%"
│              └─ statCard calendar "Last 28 days" last28 "%"
│            + div.callout[.good if mom>3, .warn if mom<-3]
│                · ic(mom>3?arrUp:mom<-3?arrDn:minus,14) + span (3 message variants, see §3)
│
└─ panel  calendar "Best and worst days"
      sub "Completion rate by day of the week."
      body = wd.length
               ? wd.map → div.hbar( span.hbn {d.name}  ·  span.hbt>span.hbf[.g if pct>=80,.o if pct<50] width:{pct}%  ·  span.hbv {pct}% )
               : div.empty(padding:10px) > div.em-s "Not enough history yet."
      foot (if bestWd && bestWd.pct) "<b>{bestWd.name}</b> is your strongest day at {bestWd.pct}%. <b>{worstWd.name}</b> is the one to watch at {worstWd.pct}%."
```

`barsChart` bar node per item (3148–3150):
`<div class="wkcol"><div class="wkbar {off?'fut':zero?'miss':''} {hi?'hi':''}" style="height:{pct}%"></div><span class="{now?'on':''}">{label if shown}</span></div>`

---

### 1d. Tab 2 — HABITS `insHabits()` (lines 3450–3514)

```
├─ panel  trophy "Habit leaderboard"  right=<span class="chip">{rangeLabel()}</span>
│     sub "Completion rate over the selected range, best first."
│     body = ranked.length
│       ? ranked.map((x,i)) → div.rank(
│           span.rn[.top if i===0] {i+1}
│           span.ric  catArt(x.h.cat)
│           span.rmain( span.rt {esc(name)}  ·  span.rs "{done} of {due} due · {cur} day streak · best {best}" )
│           span.rv "{pct}%" <small>{money(coins)} coins</small> )
│       : div.empty(padding:14px) > div.em-s "Add a habit to start building history."
│
├─ panel  calendar "Eight week heatmap"
│     sub "One square per day, per habit. The number is days kept."
│     body = live.length
│       ? div.heatwrap { rows }  +  div.heatlegend( <i.hc.done>kept · <i.hc>missed · <i.hc.na>not due )
│       : div.empty(padding:14px) > div.em-s "Nothing to chart yet."
│     ── each heat row (3466–3467):
│        div.heatrow( span.heatlbl {esc(name)}  ·  span.heatcells{56 × span.hc[.na|.done]}  ·  span(inline: font-size 10.5px, weight 800, color var(--teal-ink), margin-left 6px, flex none) {kept} )
│
├─ panel  target "What breaks your day"   [LOCKED — premium]
│     sub "On days you did not go all-clear, this is the habit most often left undone."
│     lockTitle "Blocker analysis"   lockSub "See exactly which habit costs you the most all-clear days."
│     body = bl
│       ? div.rank(inline border-bottom:none)( span.ric catArt · span.rmain( rt {esc(name)} · rs "Missed on {bl.n} of your incomplete days") · span.rv {bl.n}<small>times</small> )
│         + div.callout.warn( ic('info',14) · "Consider moving <b>{name}</b> earlier in the day, or lowering your daily goal so one hard habit cannot sink the whole day." )
│       : div.callout.good( ic('checkCircle',14) · "No pattern yet. You have not missed enough days for a blocker to show up." )
│
├─ panel  clock "Your day, by reminder"
│     sub "Habits in the order they nudge you."
│     body = timed.map → div.rank( span.ric catArt · span.rmain( rt {esc(name)} · rs "{schedLabel(h)} · {habitRate(h,insRange).pct}% kept") · span.rv {h.remind}<small>reminder</small> )
│          + (untimed ? div.callout( ic('bell',14) · "<b>{untimed}</b> of your habits {has|have} no reminder set. Add one from the habit editor." ) : '')
│
└─ panel  note "Your habit set"        (no sub)
      body = div.recgrid (4 × div.rec)
        ├─ rec  rk "Active"       rv2 {live.length}                          rd "{timed.length} with reminders"
        ├─ rec  rk "Archived"     rv2 {S.habits.length-live.length}          rd "History kept"
        ├─ rec  rk "Oldest habit" rv2 {oldest?daysBetween:0}<small>(inline font-size:12px)" days"</small>  rd "{oldest?esc(name):'None'}"
        └─ rec  rk "Daily load"   rv2 {dueList(today()).length}              rd "Due today"
```

Heat cell (3463): `<span class="hc {!wasDue?'na':st==='done'?'done':''}"></span>` — 56 cells, i from 55→0, `k=dstrOff(-i)`.

---

### 1e. Tab 3 — STREAKS `insStreaks()` (lines 3517–3583)

```
├─ div.sgrid (inline margin-bottom:12px)    ← 4 stat cards
│  ├─ statCard flame  "Current"     S.profile.streak "d"  sub streak? "Started {prettyDate(dstrOff(-(streak-1)))}" : "Not running"
│  ├─ statCard trophy "Longest"     S.profile.best   "d"  sub "Personal record"
│  ├─ statCard scale  "Average run" avg              "d"  sub "{runs.length} runs recorded"
│  └─ statCard snow   "Freezes"     S.profile.freezes     sub "{S.stats.freezesUsed} used so far"
│
├─ panel  calendar "All-clear calendar"
│     sub "Eight weeks. Green is a day you cleared everything due."
│     body = div.calwrap { 8 × div.calcol }  +  div.heatlegend (inline margin-top:10px)
│       legend: <i.caldot.ac (11×11)>all-clear · <i.caldot.p>partial · <i.caldot.fz>frozen · <i.caldot.fut>upcoming
│     ── calcol (3532): div.calcol( div.calhead {first/last week → prettyDate split[0], else ''} + 7 × div.caldot )
│     ── caldot (3530): div.caldot {cls} {now if k===today} , title="{k}"
│          cls = k>today?'fut' : (!r||!r.due)?'' : r.frozen?'fz' : r.ac?'ac' : 'p'
│
├─ panel  medal "Your longest runs"   [LOCKED — premium]
│     sub "Every streak you have put together, longest first."
│     lockTitle "Streak history"   lockSub "Keep the full record of every run you have built."
│     body = runs.length
│       ? runs.slice(0,6).map((r,i)) → div.rank(
│           span.rn[.top if i===0] {i+1}
│           span.rmain( rt "{r.len} day run" · rs "{prettyDate(r.from)} to {prettyDate(r.to)}" )
│           span.rv (inline font-size:11px; color = live?var(--orange):i===0?#7A4B00:var(--muted)) {live?'running':i===0?'best':''} )
│       : div.empty(padding:14px) > div.em-s "Clear a full day to start your first run."
│
├─ panel  repeat "How fast you bounce back"   [LOCKED — premium]
│     sub "Average days between one streak ending and the next starting."
│     lockTitle "Recovery pattern"   lockSub "The number that predicts whether a habit sticks."
│     body = rec!==null
│       ? div(flex row, gap:16px)(
│           div(flex:none;text-align:center; background:var(--cream); border:1px solid var(--line-2); border-radius:var(--r-md); padding:14px 18px)(
│             div(font-size:30px;font-weight:800;color:var(--teal-ink);line-height:1) {rec}
│             div(font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;margin-top:3px) "days off" )
│           div(font-size:12px;color:var(--muted);font-weight:600;line-height:1.5) {3 message variants, see §3} )
│         + div.hbar(inline margin-top:12px)( span.hbn "Runs recorded" · span.hbt>span.hbf width:{Math.min(100,runs.length*12)}% · span.hbv {runs.length} )
│       : div.callout.good( ic('checkCircle',14) · "You have not broken a streak yet, so there is nothing to recover from." )
│
└─ panel  snow "Streak Freeze"
      sub "The token that covers one missed day, spent automatically."
      body = div.recgrid(
        ├─ rec  rk "In hand"  rv2 {S.profile.freezes}   rd planted('sapling')? "Refills weekly" : "Plant the Young Sapling"
        └─ rec  rk "Used"     rv2 {S.stats.freezesUsed}  rd "Streaks saved" )
        + div.callout( ic('info',14) · "A Freeze is always earnable with coins or invites. Paying never buys a longer streak." )
```

---

### 1f. Tab 4 — ECONOMY `insEconomy()` (lines 3587–3647)

```
├─ div.sgrid (inline margin-bottom:12px)    ← 4 stat cards
│  ├─ statCard bolt   "Earned all time" money(S.profile.lifetimeCoins)  sub "About {avgDay} a day lately"
│  ├─ statCard bag    "Spent all time"  money(spentTotal)               sub "{round(spentTotal/max(1,lifetimeCoins)*100)}% of everything earned"
│  ├─ statCard target "Balance"         money(S.profile.coins)          sub "Ready to plant or spend"
│  └─ statCard sparkle "Level"          levelInfo().lvl                 sub "{money(xp)} of {money(need)} XP"
│
├─ panel  chart "Coins earned per week"    (no sub)
│     body = lineChart(weeks.map(w=>w.coins), {height:84, zero:true, color:'var(--orange)', fill:'#E28A4B'})
│          + div.lcx( span prettyDate(weeks[0].start) · span "this week" )
│     foot (if weeks.length>1) "Last full week <b>{money(...coins)}</b> coins."
│
├─ panel  pulse "Where coins come from"   [LOCKED — premium]
│     sub "Every coin you have ever earned, by source."
│     lockTitle "Coin flow"  lockSub "See which part of the loop actually pays you."
│     body = div.donutwrap( donutChart(srcSegs,100) + div.donutlegend{ srcSegs.map → div.dleg( <i background:{c}> {label} <span>{money(v)}</span> ) } )
│     foot "Check-offs are <b>{round(src.check/max(1,lifetimeCoins)*100)}%</b> of your income. The rest is bonuses and foraging."
│     srcSegs: {Check-offs #12667F} {All-clear bonuses #E28A4B} {Foraging #A7C34F} {Invites #E68FB0}
│
├─ panel  bag "Where coins go"   [LOCKED — premium]
│     sub "Lifetime spending by category."
│     lockTitle "Spending breakdown"  lockSub "Track every coin out the door."
│     body = spentTotal ? div.donutwrap(donutChart(spSegs,100) + donutlegend) : div.empty(padding:14px)>em-s "Nothing spent yet."
│     spSegs: {Habit Garden #7FA53C} {Companions #12667F} {Treats #E28A4B} {Wardrobe #E68FB0}
│
├─ panel  sprout "Garden progress"
│     sub "The long sink for everything you earn."
│     body = div.jprogbar > div.jprogfill width:{gardenPct()}%
│          + div.jprogmeta(inline margin-bottom:12px)( span "{gardenPct()}% grown" · span "{S.garden.length} of {GARDEN.length} plots" )
│          + eta
│              ? div.recgrid(
│                  rec  rk "Next plot"    rv2(inline font-size:14px) {eta.nx.name}  rd "{money(eta.nx.cost)} coins"
│                  rec  rk "At your pace" rv2 {eta.days!==null?eta.days:'?'}<small(font-size:12px)> days</small>  rd "{eta.perDay||0} coins a day" )
│              : div.callout.good( ic('trophy',14) · "Every plot is planted. The garden is complete." )
│
└─ panel  scale "Earning power"
      sub "What each part of the loop is worth to you right now."
      body = 3 × div.hbar:
        ├─ hbar( hbn "Per check-off"  · hbt>hbf     width:min(100, coinsForCheck(...).total*7)%  · hbv {S.habits.length?coinsForCheck(S.habits[0]).total:0} )
        ├─ hbar( hbn "All-clear day"  · hbt>hbf.o   width:min(100, allClearBonus()*2)%           · hbv {allClearBonus()} )
        └─ hbar( hbn "Foraging / day" · hbt>hbf.g   width:min(100, idleRate()*24*2)%             · hbv {round(idleRate()*24)} )
      foot "Mood bonus <b>+{bonusPct()}%</b>{perks().all>0 ? ' and garden perks <b>+{round(perks().all*100)}%</b> are' : ' is'} already included."
```

---

### 1g. Tab 5 — COMPANION `insCompanion()` (lines 3650–3701)

```
├─ div.sgrid (inline margin-bottom:12px)    ← 4 stat cards
│  ├─ statCard heart   "Health"    S.pet.health "/100"  sub moodOf(S.pet.health).t
│  ├─ statCard sparkle "Stage"     stg " of 5"          sub stageName(stg)
│  ├─ statCard bolt    "Coin bonus" "+"+bonusPct() "%"  sub "From mood alone"
│  └─ statCard gift    "Treats fed" money(S.stats.mealsFed)  sub "{money(S.stats.spent.food)} coins on food"
│
├─ panel  pulse "Health over 30 days"
│     sub "Drops {decayPerDay()} a day, restored by the habits you keep."
│     body = hs.length>1
│       ? lineChart(hs, {height:88, zero:true, color:'#E5654B', fill:'#E5654B'}) + div.lcx( span "30 days ago" · span "today" )
│       : div.empty(padding:14px) > div.em-s "Not enough history yet."
│     foot "Health never reaches zero and nothing here can die. It only changes mood and your coin bonus."
│
├─ panel  sun "Mood breakdown"
│     sub "Days at each mood tier over the {rangeLabel()}."
│     body = 4 rows from [[happy,Happy,#1E7F91],[content,Content,#E9B24C],[tired,Tired,#C79350],[hungry,Hungry,#D98C6A]]:
│       div.hbar( span.hbn( <span.mooddot.{key} inline display:inline-block;margin-right:5px> {Label} )
│                 span.hbt > span.hbf width:{round(md[key]/mdTotal*100)}% background:{color}
│                 span.hbv "{md[key]}d" )
│     foot "Happy is health 75 or more and pays <b>+25%</b> on every check-off."
│
├─ panel  trophy "Growth timeline"
│     sub "Stages unlock on your best overall streak."
│     body = div.tl { STAGES.map((s,i)) →
│       div.tlrow[.on if best>=STAGE_GATE[i]](
│         div.tlt "{s}{i+1===stg?' · now':''}"
│         div.tld "{STAGE_GATE[i]===0?'From the moment it hatches':`${STAGE_GATE[i]} day streak`}{best>=STAGE_GATE[i]?' · reached':` · ${STAGE_GATE[i]-best} days to go`}" ) }
│
├─ panel  users "Care record"    (no sub)
│     body = div.recgrid (4 × rec):
│       ├─ rec  rk "Hatched on"      rv2(inline font-size:15px) {S.pet.hatchedOn?prettyDate:'Not yet'}  rd {hatchedOn? daysBetween+' days together' : 'Keep 3 days in a row'}
│       ├─ rec  rk "Coins foraged"   rv2 {money(S.stats.idleCollected)}   rd "While you were away"
│       ├─ rec  rk "Outfit changes"  rv2 {S.stats.outfitChanges}          rd "{S.pet.ownedClothes.length} owned"
│       └─ rec  rk "Species owned"   rv2 "{S.pet.ownedSpecies.length} of {SPECIES.length}"  rd "Currently a {spec(S.pet.species).name.toLowerCase()}"
│
└─ panel  medal "Personal records"   (no sub)
      body = div.recgrid (4 × rec):
        ├─ rec  rk "Best day"       rv2 {bestDayRec()?b.r.done:0}<small(font-size:12px)> kept</small>  rd {b?prettyDate(b.k):'None yet'}
        ├─ rec  rk "Richest day"    rv2 {bestCoinDay()?money(c.r.coins):0}                              rd {c?prettyDate(c.k):'None yet'}
        ├─ rec  rk "Longest streak" rv2 {S.profile.best}<small(font-size:12px)> days</small>            rd "All-clear in a row"
        └─ rec  rk "Badges"         rv2 "{S.achievements.length} of {ACHIEVEMENTS.length}"              rd "Tap to view"
      + button.btn.ghost.block (inline margin-top:12px) onclick="openAchievements()"  ·  ic('trophy',15) + " Open achievements"
```

---

### 1h. Shared sub-component markup (from helper functions)

**`statCard(o)`** (3211–3216):
```html
<div class="scard">
  <div class="sk">{ic(o.ic,13)} {o.k}</div>
  <div class="sv">{o.v}<small>{o.unit}</small></div>   <!-- <small> only if o.unit -->
  {o.delta}<div class="ss">{o.s}</div>                 <!-- .ss only if o.s -->
</div>
```

**`panel(o)`** (3218–3232):
```html
<div class="panel">
  <div class="panel-h">{ic(o.ic||'chart',16)}<h4>{o.title}</h4>{o.right}</div>
  <div class="panel-s">{o.sub}</div>          <!-- only if o.sub -->
  {body}
  <div class="panel-f">{o.foot}</div>         <!-- only if o.foot -->
</div>
```
Locked body (when `o.locked && !S.profile.premium`), replaces `{body}`:
```html
<div class="locked"><div class="lockbody">{o.body}</div>
  <div class="lockover"><div class="lb">{ic('lock',20)}</div>
    <div class="lt">{o.lockTitle||'HabitHatch+ insight'}</div>
    <div class="ls">{o.lockSub||'Unlock the deeper breakdown.'}</div>
    <button class="btn sm" onclick="openPremium()">{ic('crown',14)} Unlock</button></div></div>
```

**`gauge(pct,label,sub)`** (3191–3202):
```html
<div style="display:flex;align-items:center;gap:15px">
  <div class="cring" style="flex:none"><svg width="94" height="94" viewBox="0 0 94 94">
    <circle cx="47" cy="47" r="40" fill="none" stroke="#EFE7D6" stroke-width="9"/>
    <circle cx="47" cy="47" r="40" fill="none"
      stroke="{pct>=75?'#7FA53C':pct>=45?'var(--orange)':'var(--danger)'}" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="{C=2π·40 = 251.3}" stroke-dashoffset="{C*(1-pct/100)}" transform="rotate(-90 47 47)"/></svg>
    <div class="cringv" style="font-size:22px">{pct}</div></div>
  <div style="min-width:0"><div style="font-weight:800;color:var(--teal-ink);font-size:15px">{label}</div>
    <div style="font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.45;margin-top:3px">{sub}</div></div>
</div>
```

**`deltaChip(now,prev,unit,invert)`** (3203–3210): returns `''` if `prev` is null/undefined; else
`<span class="delta {cls}">{arrow}{v}{unit}</span>` where `cls = d===0?'flat':((d>0)!==!!invert?'up':'down')`,
`arrow = d===0?minus:d>0?arrUp:arrDn` (size 11), `v = Math.abs(Math.round(d*10)/10)`.

**`barsChart(items,o)`** (3137–3152): outer `<div class="wkbars" style="height:{(o.height||96)+20}px;gap:{n>24?3:n>12?4:6}px">`;
`max=Math.max(1,...v)`, `step=Math.max(1,Math.ceil(n/7))`, per bar `zero=!v`, `pct=zero?0:Math.max(10,Math.round(v/max*100))`,
label shown when `i%step===0 || it.now`.

**`lineChart(vals,o)`** (3153–3177): SVG `class="lc"` viewBox `0 0 340 {h}` (`h=o.height||88`, `pad=4`), smooth cubic path;
gradient fill from `o.fill||'#12667F'` (0.28 → 0 opacity), stroke `o.color||'var(--teal)'` width 2.4, end dot r 3.6.
`min = o.zero?0:Math.min(...vals)`.

**`donutChart(segs,size)`** (3178–3190): SVG `size×size` (called with 100), `r=size/2-9`, track stroke `#EFE7D6` width 14,
each positive segment stroke = seg color, width 14, `rotate(-90)`.

---

## 2. STYLE TABLE

All declarations copied verbatim. `:root` custom-property values (default **Hatch** theme, line 9–24) are
listed once; theme overrides in §5.

### 2.0 Root tokens (used throughout)
```
--teal:#0C4C60; --teal-2:#12667F; --teal-ink:#0B2530;
--orange:#E28A4B; --orange-2:#C9773A;
--yellow:#FFDA7C; --yellow-2:#F4B942;
--coin-ink:#1E4B5F; --ink:#2D2F41; --muted:#8B897E;
--cream:#FBF6EC; --card:#FFFFFF; --line:#EFE6D6; --line-2:#E4D8C2;
--grass:#A7C34F; --sky:#BFE3F3; --good:#1E7F91; --danger:#E5654B; --pink:#E68FB0;
--tint:#FFF7EF; --tint-2:var(--tint-2);   /* self-referential → effectively unset in Hatch; themes set a real value */
--glow:rgba(226,138,75,.5);
--shadow:0 10px 16px rgba(12,76,96,.10); --shadow-sm:0 4px 12px rgba(12,76,96,.08);
--r-sm:12px; --r-md:16px; --r-lg:20px; --r-pill:999px; --nav-h:74px;
```

### 2.1 Screen frame & scroll
```
.screen{position:absolute;inset:0;display:none;flex-direction:column;overflow:hidden;background:var(--cream);}
.screen.active{display:flex;}
.screen.overlay{z-index:40;}
.scroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}
.pad-flat{padding:16px 16px 26px;}
.fade-in{animation:fade .28s ease both;}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.slide-up{animation:slideup .32s cubic-bezier(.2,.8,.2,1) both;}
.slide-down{animation:slidedown .26s cubic-bezier(.4,0,.9,.5) both;}
@keyframes slideup{from{transform:translateY(100%)}to{transform:none}}
@keyframes slidedown{from{transform:none}to{transform:translateY(100%)}}
```
(Scrollbars hidden inside `#device`: `scrollbar-width:none; -ms-overflow-style:none;` and `::-webkit-scrollbar{width:0;height:0;}`.)

### 2.2 Header (`.sheethead`, `.iconbtn`)
```
.sheethead{display:flex;align-items:center;gap:12px;padding:14px 16px;padding-top:calc(14px + env(safe-area-inset-top));background:#fff;border-bottom:1px solid var(--line);}
.sheethead h2{flex:1;font-size:18px;}
.iconbtn{width:40px;height:40px;border-radius:14px;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);flex:none;}
.iconbtn svg{width:18px;height:18px;stroke:var(--teal);stroke-width:2.5;fill:none;}
```
`h2` color inherits `--teal-ink` (from `h1,h2,h3,h4{margin:0;font-weight:700;color:var(--teal-ink);}`).

### 2.3 Sub-tabs (`#insightsTabs`)
```
.subtabs{display:flex;gap:5px;overflow-x:auto;padding:12px 12px 10px;background:#fff;border-bottom:1px solid var(--line);}
.subtabs::-webkit-scrollbar{display:none}
.subtabs button{flex:none;padding:8px 11px;border-radius:var(--r-pill);font-weight:700;font-size:12px;color:var(--muted);
  background:var(--cream);border:1.5px solid var(--line-2);display:flex;align-items:center;gap:5px;white-space:nowrap;}
.subtabs button.on{background:var(--teal);border-color:var(--teal);color:#fff;}
.subtabs button.on .ic{color:#fff;}
.subtabs button .ic{color:var(--muted);}
```

### 2.4 Range bar (`.rangebar`)
```
.rangebar{display:flex;gap:6px;padding:10px 16px 0;}
.rangebar button{flex:1;padding:7px 4px;border-radius:var(--r-sm);font-weight:700;font-size:12px;color:var(--muted);
  background:#fff;border:1.5px solid var(--line-2);position:relative;}
.rangebar button.on{background:var(--tint);border-color:var(--orange);color:var(--orange-2);}
.rangebar button .plock{position:absolute;top:-6px;right:-4px;width:16px;height:16px;border-radius:50%;background:var(--yellow);
  display:flex;align-items:center;justify-content:center;color:#7A4B00;}
.rangebar button .plock svg{width:9px;height:9px;}
```

### 2.5 Stat grid & stat card (`.sgrid`, `.scard`, `.delta`)
```
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.sgrid.g3{grid-template-columns:1fr 1fr 1fr;}
.scard{background:#fff;border:1px solid var(--line);border-radius:var(--r-md);padding:12px 13px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;}
.scard .sk{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;}
.scard .sk .ic{color:var(--teal);}
.scard .sv{font-size:23px;font-weight:800;color:var(--teal-ink);line-height:1.05;margin-top:6px;display:flex;align-items:baseline;gap:4px;}
.scard .sv small{font-size:12px;font-weight:700;color:var(--muted);}
.scard .ss{font-size:11px;font-weight:600;color:var(--muted);margin-top:3px;line-height:1.35;}
.scard .ss{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}   /* second rule, line 964 */
.delta{display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:800;padding:2px 7px 2px 5px;border-radius:var(--r-pill);margin-top:6px;}
.delta.up{background:#E7F2E4;color:#4C7A32;}
.delta.down{background:#FDECE8;color:#B9553C;}
.delta.flat{background:var(--cream);color:var(--muted);}
.delta svg{width:11px;height:11px;}
```

### 2.6 Panel (`.panel`, header/sub/foot)
```
.panel{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow-sm);padding:15px 16px;margin-bottom:12px;position:relative;}
.panel-h{display:flex;align-items:center;gap:8px;margin-bottom:3px;}
.panel-h h4{font-size:14.5px;font-weight:800;color:var(--teal-ink);flex:1;}
.panel-h .ic{color:var(--teal);}
.panel-s{font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.4;margin-bottom:12px;}
.panel-f{font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.45;margin-top:11px;padding-top:11px;border-top:1px solid var(--line);}
.panel-f b{color:var(--teal-ink);}
```

### 2.7 Premium lock overlay (`.locked`, `.lockover`)
```
.locked{position:relative;overflow:hidden;min-height:178px;border-radius:14px;display:flex;flex-direction:column;justify-content:center;}
.locked .lockbody{filter:blur(4.5px);opacity:.5;pointer-events:none;user-select:none;}
.lockover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  background:linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,.93));border-radius:14px;padding:12px;text-align:center;z-index:3;overflow:hidden;}
.lockover .lb{width:32px;height:32px;border-radius:50%;background:var(--yellow);color:#7A4B00;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(244,185,66,.4);flex:none;}
.lockover .lt{font-weight:800;font-size:13px;color:var(--teal-ink);line-height:1.2;}
.lockover .ls{font-size:11px;color:var(--muted);font-weight:600;max-width:220px;line-height:1.35;}
.lockover .btn{padding:8px 14px;font-size:12.5px;border-radius:11px;box-shadow:0 4px 0 var(--orange-2);margin-top:2px;}
.lockover .btn:active{box-shadow:0 1px 0 var(--orange-2);}
```
Note: `.locked` here is the insights lock treatment. (There is also an unrelated `.jrow.locked` in the Garden CSS — different element; the panel body uses only the `.locked` block above.)

### 2.8 Chart primitives
```
/* bars */
.wkbars{display:flex;align-items:flex-end;gap:6px;height:112px;margin:16px 0 6px;padding-bottom:20px;position:relative;}
.wkbars::after{content:"";position:absolute;left:0;right:0;bottom:20px;height:1.5px;background:var(--line-2);border-radius:2px;}
.wkcol{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;position:relative;min-width:0;}
.wkbar{width:100%;max-width:26px;background:linear-gradient(180deg,var(--teal-2),var(--teal));border-radius:5px 5px 0 0;transition:height .45s;position:relative;z-index:1;}
.wkbar.hi{background:linear-gradient(180deg,#B7D25E,#8FB94E);}
.wkbar.miss{height:4px!important;background:#F0C7BC;border-radius:2px;}
.wkbar.fut{height:4px!important;background:#EFE7D6;border-radius:2px;}
.wkcol span{position:absolute;bottom:-19px;z-index:2;font-size:9.5px;font-weight:700;color:#BFB7A5;white-space:nowrap;}
.wkcol span.on{color:var(--orange);}

/* line chart */
.lc{width:100%;display:block;}
.lcx{display:flex;justify-content:space-between;font-size:9.5px;font-weight:700;color:var(--line-2);margin-top:5px;}

/* donut */
.donutwrap{display:flex;align-items:center;gap:16px;}
.donutlegend{flex:1;min-width:0;}
.dleg{display:flex;align-items:center;gap:7px;padding:4px 0;font-size:11.5px;font-weight:700;color:var(--teal-ink);}
.dleg i{width:10px;height:10px;border-radius:3px;flex:none;}
.dleg span{margin-left:auto;font-weight:800;color:var(--muted);font-size:11px;}
```

### 2.9 Heatmap (Habits tab)
```
.heatwrap{padding-bottom:4px;}
.heatrow{display:flex;gap:5px;margin-bottom:4px;align-items:center;}
.heatlbl{width:60px;flex:none;font-size:9.5px;font-weight:700;color:var(--teal-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.heatcells{display:flex;gap:1px;flex:1;min-width:0;}
.hc{width:5px;height:13px;border-radius:2px;background:#F0D9D0;flex:1 1 0;min-width:0;}
.hc.done{background:#7FA53C}
.hc.na{background:#F3EEE1}
.heatlegend{display:flex;align-items:center;gap:12px;justify-content:center;font-size:10px;font-weight:700;color:var(--muted);margin-top:10px;flex-wrap:wrap;}
.heatlegend span{display:flex;align-items:center;gap:4px;}
.heatlegend .hc{width:11px;flex:none;height:11px;border-radius:3px;}
```
(Note: legend `<i class="hc done">` etc. inherit `.hc` base but legend rule forces 11×11.)

### 2.10 Calendar grid (Streaks tab)
```
.calwrap{display:flex;gap:4px;align-items:flex-start;}
.calcol{display:flex;flex-direction:column;gap:4px;flex:1;}
.calhead{font-size:9px;font-weight:800;color:var(--line-2);text-align:center;height:12px;}
.caldot{width:100%;aspect-ratio:1;border-radius:6px;background:#F3EEE1;position:relative;}
.caldot.p{background:#F0D9D0;}
.caldot.ac{background:#7FA53C;}
.caldot.fz{background:#BFE3F3;}
.caldot.now{box-shadow:0 0 0 2px #fff,0 0 0 3.5px var(--orange);}
.caldot.fut{background:#FAF6EC;}
```
Legend dots in streaks panel use inline `style="width:11px;height:11px"` overriding the fluid width.

### 2.11 Horizontal bar list (`.hbar`)
```
.hbar{display:flex;align-items:center;gap:9px;padding:7px 0;}
.hbar .hbn{width:96px;flex:none;font-size:11.5px;font-weight:700;color:var(--teal-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hbar .hbt{flex:1;height:16px;border-radius:8px;background:var(--cream);overflow:hidden;position:relative;border:1px solid var(--line);}
.hbar .hbf{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,var(--teal-2),var(--teal));transition:width .5s;min-width:3px;}
.hbar .hbf.g{background:linear-gradient(90deg,#8FB94E,#B7D25E);}
.hbar .hbf.o{background:linear-gradient(90deg,var(--orange),#EEA872);}
.hbar .hbv{width:44px;flex:none;text-align:right;font-size:11.5px;font-weight:800;color:var(--teal-ink);}
```

### 2.12 Rank rows (`.rank`)
```
.rank{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--line);}
.rank:last-child{border-bottom:none;}
.rank .rn{width:22px;height:22px;border-radius:50%;background:var(--cream);border:1px solid var(--line-2);flex:none;
  display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;color:var(--muted);}
.rank .rn.top{background:var(--yellow);border-color:var(--yellow-2);color:#7A4B00;}
.rank .ric{width:30px;height:30px;flex:none;border-radius:10px;background:var(--cream);border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;overflow:hidden;}
.rank .ric svg{width:22px;height:22px;}
.rank .rmain{flex:1;min-width:0;}
.rank .rt{font-size:13px;font-weight:700;color:var(--teal-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rank .rs{font-size:10.5px;font-weight:600;color:var(--muted);margin-top:1px;}
.rank .rv{flex:none;font-size:13px;font-weight:800;color:var(--teal-ink);text-align:right;}
.rank .rv small{display:block;font-size:9.5px;font-weight:700;color:var(--muted);}
```

### 2.13 Records grid (`.recgrid`, `.rec`)
```
.recgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.rec{background:var(--cream);border:1px solid var(--line-2);border-radius:var(--r-sm);padding:11px 12px;}
.rec .rk{font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;}
.rec .rv2{font-size:17px;font-weight:800;color:var(--teal-ink);margin-top:3px;line-height:1.1;}
.rec .rd{font-size:10.5px;font-weight:600;color:var(--muted);margin-top:2px;}
.rec .rv2,.rec .rd{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}   /* line 963 */
```

### 2.14 Timeline (`.tl`, Companion growth)
```
.tl{position:relative;padding-left:26px;}
.tl::before{content:'';position:absolute;left:8px;top:6px;bottom:6px;width:2px;background:var(--line);}
.tlrow{position:relative;padding:8px 0;}
.tlrow::before{content:'';box-sizing:border-box;position:absolute;
  left:-17px;top:17px;transform:translate(-50%,-50%);
  width:13px;height:13px;border-radius:50%;background:#fff;border:2.5px solid var(--line-2);}
.tlrow.on::before{border-color:var(--orange);background:var(--orange);}
.tlt{font-size:12.5px;font-weight:700;color:var(--teal-ink);line-height:18px;}
.tld{font-size:10.5px;font-weight:600;color:var(--muted);margin-top:1px;}
```

### 2.15 Callout (`.callout`)
```
.callout{display:flex;gap:9px;align-items:flex-start;background:var(--cream);border:1px solid var(--line-2);
  border-radius:var(--r-sm);padding:10px 12px;margin-top:11px;font-size:11.5px;font-weight:600;color:var(--muted);line-height:1.45;}
.callout .ic{color:var(--orange);flex:none;margin-top:1px;}
.callout b{color:var(--teal-ink);}
.callout.good{background:#F1F7EE;border-color:#DCEBD2;}
.callout.good .ic{color:#5B8A38;}
.callout.warn{background:#FFF4E7;border-color:#F6DFC4;}
```

### 2.16 Progress bar (Garden progress panel — reused home classes)
```
.jprogbar{height:8px;border-radius:9px;background:#EFE7D6;overflow:hidden;display:block;}
.jprogfill{height:100%;border-radius:9px;background:linear-gradient(90deg,var(--grass),#C2DA75);display:block;transition:width .5s;}
.jprogmeta{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:var(--muted);margin-top:7px;}
```

### 2.17 Mood dot, chip, empty, buttons (referenced)
```
.mooddot{width:8px;height:8px;border-radius:50%;flex:none;}
.mooddot.happy{background:#1E7F91}.mooddot.content{background:#E9B24C}.mooddot.tired{background:#C79350}.mooddot.hungry{background:#D98C6A}
/* NOTE: mooddot base colors differ from Mood-breakdown inline bar colors (see §5). */

.chip{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;
  padding:4px 9px;border-radius:var(--r-pill);background:var(--cream);color:var(--teal);border:1px solid var(--line-2);}
.chip.good{color:var(--good);background:var(--tint-2);border-color:#CFE2E8;}
.chip.warn{color:var(--orange-2);background:#FFF4E7;border-color:#F6DFC4;}

.empty{text-align:center;padding:34px 20px;color:var(--muted);}
.empty .em-ic{margin-bottom:8px;display:flex;justify-content:center;color:var(--line-2);}
.empty .em-t{font-weight:700;color:var(--teal-ink);font-size:15px;margin-bottom:4px;}
.empty .em-s{font-size:13px;line-height:1.5;}
.insprev{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:26px;}
.insprev span{font-size:10.5px;font-weight:700;color:var(--line-2);background:var(--card);
  border:1px dashed var(--line-2);border-radius:var(--r-pill);padding:5px 10px;}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--orange);color:#fff;font-weight:700;border-radius:var(--r-md);padding:14px 18px;
  box-shadow:0 6px 0 var(--orange-2);transition:transform .06s, box-shadow .06s;font-size:15px;}
.btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--orange-2);}
.btn.ghost{background:#fff;color:var(--teal);box-shadow:0 0 0 1.5px var(--line-2) inset;font-weight:600;}
.btn.ghost:active{transform:translateY(2px);}
.btn.block{display:flex;width:100%;}
.btn.sm{padding:9px 14px;border-radius:var(--r-sm);font-size:13px;box-shadow:0 4px 0 var(--orange-2);}
.btn.sm:active{box-shadow:0 1px 0 var(--orange-2);}

.cring{position:relative;display:inline-flex;line-height:0;flex:none;}
.cringv{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--teal-ink);font-size:18px;}
```

### 2.18 Icon base (`.ic`)
```
.ic{display:inline-block;vertical-align:middle;flex:none;}
.ic.stroke{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.ic.fill{fill:currentColor;stroke:none;}
```
`ic(name,size,cls)` (1196): `<svg class="ic {stroke|fill} {cls}" width height viewBox="0 0 24 24">{path}</svg>`.
Icons used on this screen and their class: `chart`(stroke) `note`(stroke) `flame`(fill) `bag`(stroke) `heart`(fill)
`lock`(stroke) `crown`(fill) `target`(stroke) `checkCircle`(stroke) `check`(stroke) `plus`(stroke) `pulse`(stroke)
`bars`(stroke) `calendar`(stroke) `clock`(stroke) `arrUp`(stroke) `arrDn`(stroke) `minus`(stroke) `info`(stroke)
`bell`(stroke) `trophy`(stroke) `medal`(stroke) `repeat`(stroke) `snow`(stroke) `scale`(stroke) `bolt`(fill)
`sparkle`(fill) `sprout`(stroke) `sun`(stroke) `users`(stroke) `gift`(stroke) `egg`(stroke).

### 2.19 Reduced motion
```
@media (prefers-reduced-motion: reduce){ .petart,.eggart,.gardensun,.gardencloud,.pilecoin img{animation:none!important;} }
```
(No insights-specific animation is disabled; only the transitions on bars/lines/hbars/jprogfill remain, all pure width/height transitions.)

---

## 3. DATA / LOGIC (formulas, thresholds — verbatim)

### 3.0 Constants
```
INS_TABS = [['overview','Overview','chart'],['habits','Habits','note'],['streaks','Streaks','flame'],
            ['economy','Coins','bag'],['companion','Companion','heart']];
RANGES   = [[7,'7 days',false],[28,'4 weeks',false],[84,'12 weeks',true],[0,'All time',true]];
STAGES     = ["Baby","Young","Grown","Prime","Legend"];
STAGE_GATE = [0,7,21,50,100];              // overall best streak needed per stage
GARDEN.length = 8;  SPECIES.length = 5;  ACHIEVEMENTS.length = 12;  SEED_DAYS = 56;
WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
```
`rangeLabel()` (3357): finds RANGES row where `[0]===insRange`, returns `row[1].toLowerCase()` else `'range'`
(→ "7 days" / "4 weeks" / "12 weeks" / "all time").

### 3.1 Date & history primitives
- `dstrOff(n,from)` = local YYYY-MM-DD n days from `from` (default today).
- `daysBetween(a,b)` = `Math.round((parseD(b)-parseD(a))/86400000)`.
- `today()` = local YYYY-MM-DD.
- `prettyDate(s)` = `"Mon D"` e.g. "Aug 3" (`['Jan'..'Dec'][month] + ' ' + date`).
- `firstDay()` = earliest key in `S.history` (else today). `trackedDays()` = `daysBetween(firstDay(),today())+1`.
- `hist(n)` (3239): span = `n>0?n:trackedDays()`; array oldest→newest of `{k, r:S.history[k]||{due:0,done:0,ac:0,coins:0}}`.
- `agg(rows)` (3245): sums; returns `{due,done,ac,coins,active, rate:due?round(done/due*100):0, acRate:active?round(ac/active*100):0}`. `active` = count of days with `due>0`.
- `prevAgg(n)` (3250): same window shifted back one full span (`i` from `span*2-1`→`span`).

### 3.2 Overview computed values (3388–3397)
```
rows      = hist(insRange);  a = agg(rows);  p = prevAgg(insRange);
score     = consistencyScore(rows);
wd        = byWeekday(hist(insRange>0?Math.max(insRange,28):0)).filter(x=>x.pct!==null);
bestWd    = wd.slice().sort((x,y)=>y.pct-x.pct)[0];
worstWd   = wd.slice().sort((x,y)=>x.pct-y.pct)[0];
last7     = agg(hist(7)).rate;   last28 = agg(hist(28)).rate;
mom       = last7 - last28;
weeks     = weeklySeries(insRange>28?12:8);
totalKept = S.habits.reduce((n,h)=>n + Object.values(h.logs).filter(v=>v==='done').length, 0);
```
- **Consistency score** `consistencyScore(rows)` (3256):
  `streakPart = min(1, max(S.profile.streak,0)/21)`; return `round(a.rate*0.5 + a.acRate*0.3 + streakPart*100*0.2)`.
  → "Half completion rate, a third all-clear days, the rest current streak."
  Gauge ring color: `>=75 → #7FA53C`, `>=45 → var(--orange)`, else `var(--danger)`.
- **Gauge label / sub** (3408–3411), thresholds on `score`:
  - `>=75` → label `"Strong and steady"`, sub `"You are clearing most of what you schedule, and your streak is holding. Little left to fix here."`
  - `>=50` → label `"Finding a rhythm"`, sub `"Solid base. Lifting all-clear days is the fastest way to move this number."`
  - else   → label `"Early days"`, sub `"Try trimming to two or three habits until the daily win feels easy."`
- **`byWeekday(rows)`** (3261): 7 buckets keyed by `dow(k)`; each `{i, name:WD[i], pct:due?round(done/due*100):null, due}`.
  Overview hbar fill class: `pct>=80 → .g`, `pct<50 → .o`, else base teal.
- **`weeklySeries(weeks)`** (3266): for each of the last `weeks` ISO-ish weeks (Mon start via `weekStart`): sums due/done/coins/ac; `pct:due?round(done/due*100):0`. Overview uses `.pct`, Economy uses `.coins`.
- **Daily-completion bars** (3416–3418): per day `v = r.due?round(r.done/r.due*100):0`, `label = String(parseD(k).getDate())`, `hi = !!r.ac`, `now = k===today()`, `off = !r.due`.
- **Momentum callout** (3433–3436): `mom>3` → `.good`, `mom<-3` → `.warn`, else base; icon arrUp/arrDn/minus.
  - `mom>3`: `"You are <b>{mom} points</b> ahead of your monthly average."`
  - `mom<-3`: `"You are <b>{Math.abs(mom)} points</b> below your monthly average. Nothing in the garden or your badges is at risk."`
  - else: `"Holding within <b>{Math.abs(mom)} points</b> of your monthly average."`

### 3.3 Habits computed values (3450–3468)
```
live    = S.habits.filter(h=>!h.archived);
ranked  = live.map(h=>({h, r:habitRate(h,insRange)})).sort((a,b)=>b.r.pct-a.r.pct);   // best first
bl      = blocker(insRange);
timed   = live.filter(h=>h.remind).sort((a,b)=>a.remind<b.remind?-1:1);               // by reminder time asc
untimed = live.length - timed.length;
oldest  = live.slice().sort((a,b)=>a.created<b.created?-1:1)[0];
```
- `habitRate(h,days)` (3277): over span days, count days `isDue`; `due++`, `done++ if logs[k]==='done'`; `{due,done,pct:due?round(done/due*100):0}`.
- `blocker(days)` (3284): over span, for each day with `due>0 && !ac`, increment miss[h.id] for each due-but-not-done habit; returns `{h, n}` for the single most-missed habit, else `null`.
- Heatmap: 56 cells (i 55→0). `kept` count (3465) = `Object.keys(h.logs).filter(k=>h.logs[k]==='done' && daysBetween(dstrOff(-56),k)>=0).length`.
- `schedLabel(h)` (2046): `daily→'Every day'`; `weekdays→ 'Weekdays' if days=1..5, 'Weekends' if 0,6, else WD names joined ', '`; else `"{perWeek||3}× a week"`.
- Reminder callout copy: `"<b>{untimed}</b> of your habits {untimed===1?'has':'have'} no reminder set. Add one from the habit editor."`
- Habit-set records: Active=`live.length`; Archived=`S.habits.length-live.length`; Oldest habit=`oldest?daysBetween(oldest.created,today()):0` days, rd=oldest name; Daily load=`dueList(today()).length`.

### 3.4 Streaks computed values (3517–3533)
```
runs = streakRuns();
avg  = runs.length ? Math.round(runs.reduce((a,b)=>a+b.len,0)/runs.length*10)/10 : 0;
rec  = recoveryDays();
weeks = 8;   ws = weekStart(dstrOff(-7*(weeks-1)));   // 8-week calendar start (Monday)
```
- `streakRuns()` (1746): walks `S.history` days (those with `due>0`) chronologically; an `ac` day extends/opens a run, a `frozen` day extends an open run without resetting, any other day closes it. Returns runs `{from,to,len}` sorted longest first.
- `recoveryDays()` (3297): needs ≥2 runs (else `null`); gaps between consecutive runs (`max(1, daysBetween(prev.to,cur.from)-1)`); returns `round(mean*10)/10`.
- Calendar dot class (3529): `k>today→'fut'`; `!r||!r.due→''` (base #F3EEE1); `r.frozen→'fz'`; `r.ac→'ac'`; else `'p'`. `now` ring if `k===today()`.
- Current-streak sub: `S.profile.streak ? "Started {prettyDate(dstrOff(-(streak-1)))}" : "Not running"`.
- Longest-runs rows: `runs.slice(0,6)`; `live = daysBetween(r.to,today())<=0`; rv text `live?'running':i===0?'best':''`, color `live→var(--orange)`, `i===0→#7A4B00`, else `var(--muted)`.
- Recovery message (3568–3571) on `rec`:
  - `<=1.5`: `"You get straight back on it. Restarting fast matters more than never missing."`
  - `<=3`: `"A short dip and then back. Comfortably inside the range where habits hold."`
  - else: `"It takes a few days to restart. A Streak Freeze covers the first missed day so the gap never opens at all."`
  - Runs-recorded hbar width = `Math.min(100, runs.length*12)%`.
- Streak-Freeze records: In hand=`S.profile.freezes` (rd = `planted('sapling')?'Refills weekly':'Plant the Young Sapling'`); Used=`S.stats.freezesUsed` (rd "Streaks saved").

### 3.5 Economy computed values (3587–3604)
```
src = S.stats.src;  sp = S.stats.spent;
spentTotal = sp.food + sp.clothes + sp.species + sp.garden;
weeks = weeklySeries(insRange>28?12:8);
eta   = gardenEta();
avgDay = Math.round(agg(hist(28)).coins / 28);
srcSegs = [ {Check-offs, src.check, #12667F}, {All-clear bonuses, src.clear, #E28A4B},
            {Foraging, src.idle, #A7C34F}, {Invites, src.gift, #E68FB0} ];
spSegs  = [ {Habit Garden, sp.garden, #7FA53C}, {Companions, sp.species, #12667F},
            {Treats, sp.food, #E28A4B}, {Wardrobe, sp.clothes, #E68FB0} ];
```
- Stat cards: Earned=`money(S.profile.lifetimeCoins)`; Spent=`money(spentTotal)` (sub pct = `round(spentTotal/max(1,lifetimeCoins)*100)`); Balance=`money(S.profile.coins)`; Level=`levelInfo().lvl` (sub `{money(xp)} of {money(need)} XP`).
- `levelInfo()` (1344): `xp=max(0,lifetimeCoins)`, `lvl=1`, `need=160`; while `xp>=need { xp-=need; lvl++; need=10*lvl*lvl+50*lvl+100; }`.
- Coin-flow foot pct = `round(src.check/max(1,lifetimeCoins)*100)`.
- `gardenPct()` (1513) = `round(S.garden.length/GARDEN.length*100)`.
- `gardenEta()` (3327): `nx=nextPlot()`; if none → `null`. `w=weeklySeries(4).filter(coins>0)`; `perDay = w.length? sum(coins)/(w.length*7):0`; `need=max(0,nx.cost-coins)`. `perDay<=0 → {nx, days:null}`; else `{nx, days:Math.ceil(need/perDay), perDay:Math.round(perDay)}`.
- **Earning power hbars** (3642–3644):
  - Per check-off: value `S.habits.length?coinsForCheck(S.habits[0]).total:0`; width `min(100, coinsForCheck(S.habits[0]||{cur:0,sched:'daily'}).total*7)%` (base teal fill).
  - All-clear day: value `allClearBonus()`; width `min(100, allClearBonus()*2)%` (`.o` orange fill).
  - Foraging/day: value `round(idleRate()*24)`; width `min(100, idleRate()*24*2)%` (`.g` green fill).
- `coinsForCheck(h)` (1564): `base=5`; `streakBonus=min(floor(h.cur/3),5)`; `hardBonus=h.sched==='daily'?1:0`; `core=base+streakBonus+hardBonus`; `p=perks()`; `extra=p.perCheck + round(core*(moodOf(health).bonus + p.all))`; `{core,extra,total:core+extra}`.
- `allClearBonus()` (1573): `round((15+min(S.profile.streak,30))*(1+perks().allClear+perks().all))`.
- `idleRate()` (1532): `1*(1+perks().rate)`.
- `bonusPct()` (1524): `round(moodOf(S.pet.health).bonus*100)`. `perks().all` from planted Orchard (0.20).
- Foot: `"Mood bonus <b>+{bonusPct()}%</b>{perks().all>0 ? ' and garden perks <b>+{round(perks().all*100)}%</b> are':' is'} already included."`

### 3.6 Companion computed values (3650–3655)
```
hs  = healthSeries(30);
md  = moodDays(insRange);
mdTotal = Math.max(1, md.happy + md.content + md.tired + md.hungry);
stg  = petStage();
best = Math.max(S.profile.best, S.profile.streak);
```
- `healthSeries(days)` (3310): last `days` days' `S.history[k].h` where present (ordered oldest→newest).
- `moodDays(days)` (3304): over span, bucket each day by `moodOf(r.h).k` when `r.h!=null` → `{happy,content,tired,hungry}` counts.
- `moodOf(h)` (1518): `h>=75 → {t:"Happy", k:"happy", bonus:.25}`; `h>=45 → {Content, content, .10}`; `h>=20 → {Tired, tired, 0}`; else `{Hungry, hungry, 0}`.
- `petStage()` (1525): `b=max(best,streak)`; `s=1`; for i 1..4 `if b>=STAGE_GATE[i] s=i+1`; returns `hatchState==='hatched'?s:1`. `stageName(n)` = `STAGES[min(4,max(0,(n||1)-1))]`.
- `decayPerDay()` (1531): `max(6, 12 - perks().decay)`.
- Health-over-30 panel: rendered only if `hs.length>1`, else empty "Not enough history yet." Chart color/fill `#E5654B`.
- Mood-breakdown rows: `[['happy','Happy','#1E7F91'],['content','Content','#E9B24C'],['tired','Tired','#C79350'],['hungry','Hungry','#D98C6A']]`; fill width `round(md[key]/mdTotal*100)%`, inline `background:{color}`; value `"{md[key]}d"`.
- Growth timeline rows: `STAGES.map((s,i))`, `.on` when `best>=STAGE_GATE[i]`; title `"{stage}{i+1===stg?' · now':''}"`; desc `"{gate===0?'From the moment it hatches':gate+' day streak'}{best>=gate?' · reached':' · '+(gate-best)+' days to go'}"`.
- Care record: Hatched on `S.pet.hatchedOn?prettyDate:'Not yet'` (rd `hatchedOn? daysBetween+' days together':'Keep 3 days in a row'`); Coins foraged `money(S.stats.idleCollected)`; Outfit changes `S.stats.outfitChanges` (rd `{ownedClothes.length} owned`); Species owned `{ownedSpecies.length} of {SPECIES.length}` (rd `Currently a {spec(species).name.toLowerCase()}`).
- Personal records: Best day `bestDayRec()` → `b.r.done` kept + `prettyDate(b.k)`; Richest day `bestCoinDay()` → `money(c.r.coins)` + `prettyDate(c.k)`; Longest streak `S.profile.best` days; Badges `{S.achievements.length} of {ACHIEVEMENTS.length}` (rd "Tap to view").
  - `bestDayRec()` (3315): history day with max `done` (must have `due`). `bestCoinDay()` (3321): day with max `coins`.

### 3.7 Demo seed reference (so numbers are reproducible)
`freshState(true)` seeds profile name "Haryanto", fox named "Pip", `hatchState:'hatched'`, and 6 habits;
`simulateHistory` replays 56 days with reliability `{1:.95,2:.88,3:.86,4:.90,5:.96,6:.82}`, a wobbly first ~12 days
(`warmup .72`), a slump around days 7–16 (`slump .18`), a peak run days 26–36, a clean final 6 days. It sets
`stats.idleCollected=640`, `src.idle=640`, `src.gift=100`, `profile.freezes=1`, and marks today `paid:0`
(so today counts as not-yet-all-clear). This is the state the Insights screen renders against in the demo.

---

## 4. INTERACTIONS

| Element | Handler | Effect |
|---|---|---|
| Back button (`.iconbtn`, header) | `closeScreen('insights')` | Slide-down 250ms, removes `active`, then `renderAll()`. Returns to whatever tab screen is beneath. |
| Sub-tab button (`#insightsTabs button`) | `setInsTab(t)` (3344) | `insTab=t; renderInsights(); $('insightsBody').scrollTop=0;` — swaps tab body, resets scroll to top. No screen change, no toast. |
| Range button — free (7d, 4wk) | `setRange(n, false)` (3345) | `insRange=n; renderInsights();` — re-renders active tab against new window. |
| Range button — premium (12wk, All time) when `!S.profile.premium` | `setRange(n, true)` | Opens a bottom-sheet **dialog** (does NOT change range). Dialog markup below. |
| Range button — premium when premium=true | `setRange(n, true)` | Sets `insRange=n; renderInsights();` (premium check passes). |
| Empty-state CTA (`.btn.sm`) | inline: `closeScreen('insights');setTimeout(()=>switchTab('today'),240)` | Closes insights, after 240ms switches to Today tab. |
| Locked panel "Unlock" button (`.lockover .btn`) | `openPremium()` (3897) | `renderPremium(); openScreen('premium');` — opens the premium overlay screen (slide-up). |
| Companion → "Open achievements" (`.btn.ghost.block`) | `openAchievements()` (3707) | `renderAchievements(); openScreen('achievements');` — opens achievements overlay. |

**Premium-gate dialog** fired by `setRange(n,true)` when not premium (3347–3352), rendered into `#dialogHost`
by `openDialog(html)` as `<div class="scrim">…<div class="dialog">{html}</div></div>` (scrim tap-outside → `closeDialog()`):
```html
<div class="grip"></div>
<div style="color:var(--yellow-2);display:flex;justify-content:center">{ic('crown',44)}</div>
<h3>Longer history</h3>
<p class="d-sub">The free plan keeps 4 weeks of detail. HabitHatch+ opens 12 weeks and all time, so you can see the shape of a whole season.</p>
<div class="d-actions"><button class="btn ghost block" onclick="closeDialog()">Not now</button>
<button class="btn block" onclick="closeDialog();openPremium()">See HabitHatch+</button></div>
```
`closeDialog()` (4153): adds `.closing` to the scrim (fade/slide-down), removes it after 250ms.

No coin/reward/confetti/toast animations originate from the Insights screen itself — it is read-only.
The only motion is CSS transitions (`.wkbar height .45s`, `.hbf/.hsf/.jprogfill width .5s`, `slide-up/down` on open/close, `fade-in .28s` on body swap via `renderAll`). Tap feedback: `.btn:active`, `.iconbtn`/`.rangebar`/`.subtabs` buttons have no `:active` transform of their own beyond `.btn` variants.

---

## 5. NOTES (subtle behavior, conditionals, variants)

1. **Global empty state gates the whole screen.** `bare = !S.stats.checkoffs`. When zero check-offs ever:
   no rangebar renders, and the body is `insEmpty()` regardless of `insTab`. The sub-tabs still render and are
   still tappable, but every tab shows the same empty screen (because `renderInsights` picks `insEmpty()` before
   dispatching to the tab fn). `insEmpty()` itself has two sub-variants keyed on whether any **live** (non-archived)
   habit exists: "No numbers yet"/"Go check one off" (check icon) vs "Nothing to measure yet"/"Add a habit" (plus icon).

2. **Premium locking is per-panel, blur-behind.** Four panels pass `locked:true`: Habits→"What breaks your day"
   (Blocker analysis), Streaks→"Your longest runs" (Streak history) and "How fast you bounce back" (Recovery pattern),
   Economy→"Where coins come from" (Coin flow) and "Where coins go" (Spending breakdown). `panel()` only applies the
   lock when `o.locked && !S.profile.premium`; if the user is premium the real body shows. The locked body is still
   fully rendered underneath (blurred 4.5px, opacity .5, non-interactive) so the shape/teaser is visible. That means
   the demo real data is computed even when hidden. `min-height:178px` guarantees the overlay always has room.

3. **Range → data-window plumbing.** `insRange=0` means "all time" and every analytic treats `n>0?n:trackedDays()`.
   `weeklySeries` count switches at `insRange>28 ? 12 : 8` weeks (Overview weekly trend, Economy coins/week). The
   weekday analysis always widens to at least 28 days: `hist(insRange>0?Math.max(insRange,28):0)` — so on the 7-day
   range the "Best and worst days" panel still uses a 28-day window, and on All-time it uses full history.

4. **`--tint-2` is theme-dependent.** In the default **Hatch** theme `--tint-2` is declared self-referentially
   (`--tint-2:var(--tint-2)`), i.e. it has no concrete value; elements relying on it (`.chip.good`, `.callout` uses
   `--cream` not tint-2, `.subtabs` uses --teal/--cream, so insights is largely unaffected — but `.chip.good` background
   would be empty in Hatch). Each premium theme sets a concrete `--tint-2`. On this screen the callouts use explicit
   hex backgrounds (`#F1F7EE` good, `#FFF4E7` warn) so they are unaffected; watch this only if reusing `.chip.good`.

5. **Theme behavior (accent-only reskin).** Setting a premium theme swaps the accent family via `:root[data-theme=...]`.
   All four themes remap `--teal`, `--teal-2`, `--teal-ink`, `--coin-ink`, `--orange`, `--orange-2`, `--tint`, `--good`,
   `--sky`, `--tint-2`, `--glow`, `--shadow`, `--shadow-sm`. Concretely for Insights, this recolors: panel titles/icons,
   stat-card values, sub-tab active pill, rangebar active state, hbar/wkbar/hsf teal gradients, timeline active dot,
   gauge label. **Hardcoded hex values do NOT theme** and stay constant across all themes — notably: heatmap kept `#7FA53C`,
   heat missed `#F0D9D0`, heat na `#F3EEE1`; calendar `.ac #7FA53C`/`.p #F0D9D0`/`.fz #BFE3F3`/`.fut #FAF6EC`; gauge ring
   colors `#7FA53C / #EFE7D6`; delta chips `#E7F2E4/#4C7A32`, `#FDECE8/#B9553C`; the `.hbf.g` green and `.hbf.o` uses
   `--orange` (themed) + `#EEA872` (fixed); donut segment palette (`#12667F #E28A4B #A7C34F #E68FB0 #7FA53C`); mood-breakdown
   inline bar colors; line-chart default fill `#12667F`. So charts keep a stable data-color language while chrome reskins.
   Theme dark/light: there is **no** OS dark-mode handling — the app is a single light "paper" look; theming is user-chosen only.
   Themes: Hatch (free, `#0C4C60`/`#E28A4B`), Dusk (`#3E2E5E`/`#D9628F`), Forest (`#1E4632`/`#D19A2E`), Ocean (`#123A5C`/`#2FA0AE`), Ember (`#4A2A20`/`#DE5B39`).

6. **Mood color inconsistency (intentional-looking, transcribe exactly).** The generic `.mooddot` classes are
   `happy #1E7F91 / content #E9B24C / tired #C79350 / hungry #D98C6A`. The Companion "Mood breakdown" bars set their
   **fill** background inline from a different array `happy #1E7F91 / content #E9B24C / tired #C79350 / hungry #D98C6A`
   — these match. But the `.mooddot` inside each hbn label uses the CSS class colors (same values). No divergence in
   practice, but the dot and bar are colored by two different mechanisms (class vs inline) — keep both.

7. **Per-panel empty/edge states** (besides the global empty):
   - Overview "Best and worst days": if `wd.length===0` → inline empty "Not enough history yet."; foot only if `bestWd && bestWd.pct`.
   - Overview weekly-trend foot & momentum: shown only if `weeks.length>1`.
   - Habits leaderboard: empty "Add a habit to start building history." when no ranked habits.
   - Habits heatmap: "Nothing to chart yet." when `live.length===0`.
   - Habits blocker: two states — a rank+warn callout when a blocker exists, else a `.good` callout "No pattern yet…".
   - Habits "by reminder": `timed` rows then (if `untimed>0`) a bell callout; if both empty the panel body is empty.
   - Streaks longest-runs: "Clear a full day to start your first run." when no runs.
   - Streaks recovery: `.good` callout "You have not broken a streak yet…" when `rec===null` (needs ≥2 runs).
   - Economy spending donut: "Nothing spent yet." when `spentTotal===0`.
   - Economy garden progress: `.good` trophy callout "Every plot is planted. The garden is complete." when `nextPlot()` is null (eta null).
   - Companion health chart: "Not enough history yet." when `hs.length<=1`.

8. **Pre-hatch vs post-hatch.** The Insights screen has no explicit egg/pre-hatch branch of its own, but data reflects it:
   `petStage()` returns 1 ("Baby") until `hatchState==='hatched'`; health decay/`moodDays`/`healthSeries` only accrue
   `r.h` on days after hatch (rollover only writes `rec.h` and health when `hatchState==='hatched'`). So on a pre-hatch
   account the Companion tab's Health-over-30 and Mood-breakdown will be sparse/empty ("Not enough history yet.") and
   `stg` stays 1. Care record "Hatched on" shows "Not yet" / "Keep 3 days in a row" pre-hatch. In the demo seed the pet is
   already hatched (`hatchedOn` set), so all Companion panels populate.

9. **Singular/plural copy branches to preserve exactly:** "tracked day{trackedDays()===1?'':'s'}", "{n} day{…}"
   in consistency foot, "has/have" for reminders, "day/days" in hatch/recovery contexts, "{3-progress} more all-clear
   day/days" (that last one lives in the reward flow, not this screen). Also `.rn.top` (gold) only on index 0 of a ranked
   list (leaderboard + longest-runs), and `.rt`/`.heatlbl`/`.hbn`/`.rec .rv2` all ellipsis-truncate — long habit names clip.

10. **Scroll & layout.** `#insightsBody` is the only vertical scroller (`.scroll flex:1`), the header and sub-tabs are
    fixed above it. Sub-tabs and rangebar are horizontally laid out; sub-tabs scroll horizontally (`overflow-x:auto`,
    hidden scrollbar) and never wrap, rangebar is a 4-way flex that divides width evenly (`flex:1` each). All charts are
    width-fluid (line chart uses `preserveAspectRatio="none"` at a 340-unit viewBox; bars/hbars/heat use flex). The
    body outer padding is `.pad-flat` (16px sides, 26px bottom) plus an inline `padding-top:14px` wrapper.
