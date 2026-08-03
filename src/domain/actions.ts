// State transitions — ported 1:1 from the prototype's mutating functions (toggleHabit,
// uncheckHabit, maybeAllClear, unpayDay, rollover, checkAch, purchases). Each mutates the
// passed state (an immer draft in the store) and returns an events object the store turns
// into toasts / reward / hatch overlays. Kept free of UI + Date globals (now is injected)
// so the whole thing is unit-testable in Node.

import { AppState, Habit } from './types';
import { ACHIEVEMENTS, FOODS, CLOTHES, SPECIES, GARDEN, GardenPlot, FoodDef } from './catalogs';
import { today, dstrOff, isoWeek } from './dates';
import {
  isDue, dueList, doneCount, dayGoal, coinsForCheck, allClearBonus,
  perks, decayPerDay, idlePending, achMet, nextPlot,
} from './mechanics';

type SrcKey = 'check' | 'clear' | 'idle' | 'gift';
type SpendKey = 'food' | 'clothes' | 'species' | 'garden';

export function addCoins(st: AppState, n: number, src?: SrcKey): void {
  st.profile.coins = Math.max(0, st.profile.coins + n);
  if (n > 0) {
    st.profile.lifetimeCoins += n;
    if (src && st.stats.src[src] != null) st.stats.src[src] += n;
  }
}
export function spendCoins(st: AppState, n: number, bucket?: SpendKey): void {
  st.profile.coins = Math.max(0, st.profile.coins - n);
  if (bucket && st.stats.spent[bucket] != null) st.stats.spent[bucket] += n;
}
// An exact reversal: coins, lifetime totals and source buckets all unwind.
export function refundCoins(st: AppState, n: number, src?: SrcKey): void {
  st.profile.coins = Math.max(0, st.profile.coins - n);
  st.profile.lifetimeCoins = Math.max(0, st.profile.lifetimeCoins - n);
  if (src && st.stats.src[src] != null) st.stats.src[src] = Math.max(0, st.stats.src[src] - n);
}

// Recompute a day's due/done/all-clear rollup, preserving prior paid/bonus/etc. fields.
export function rollupDay(st: AppState, d: string): void {
  const due = st.habits.filter((h) => isDue(h, d)).length;
  const done = st.habits.filter((h) => h.logs[d] === 'done').length;
  const g = st.profile.dailyGoal;
  const goal = g > 0 ? Math.min(g, Math.max(1, due)) : due;
  const prev = st.history[d] || {};
  st.history[d] = { ...prev, due, done, ac: due > 0 && done >= goal ? 1 : 0 };
}

export type ToggleResult =
  | { ok: false }
  | { ok: true; unchecked: true; refunded: number }
  | { ok: true; unchecked: false; total: number; name: string };

// The core action: check a habit off (or uncheck if already done today).
export function toggleHabit(st: AppState, id: number, now: Date = new Date()): ToggleResult {
  const t = today(now);
  const h = st.habits.find((x) => x.id === id);
  if (!h) return { ok: false };

  if (h.logs[t] === 'done') return uncheckHabit(st, h, t);

  // Replay the original grant if this habit was checked then undone today, so a
  // check/uncheck loop can never drift the wallet.
  const voided = h.void && h.void[t];
  let total: number;
  let hp: number;
  if (voided) {
    total = voided.c;
    hp = Math.min(voided.hp, 100 - st.pet.health);
    delete h.void[t];
  } else {
    const gain = coinsForCheck(st, h);
    const due = Math.max(1, dueList(st, t).length);
    const hpWant = st.pet.hatchState === 'hatched' ? Math.round(18 / due) : 0;
    total = gain.total;
    hp = Math.min(hpWant, 100 - st.pet.health);
  }
  h.logs[t] = 'done';
  h.cur += 1;
  h.best = Math.max(h.best, h.cur);
  h.coins += total;
  h.rec[t] = { c: total, hp };
  st.stats.checkoffs++;
  addCoins(st, total, 'check');
  st.pet.health = Math.min(100, st.pet.health + hp);
  rollupDay(st, t);
  const rc = st.history[t];
  rc.coins = (rc.coins || 0) + total;
  return { ok: true, unchecked: false, total, name: h.name };
}

export function uncheckHabit(st: AppState, h: Habit, t: string): ToggleResult {
  const rec = h.rec[t] || { c: 0, hp: 0 };
  refundCoins(st, rec.c, 'check');
  h.coins = Math.max(0, h.coins - rec.c);
  st.pet.health = Math.max(0, st.pet.health - (rec.hp || 0));
  h.cur = Math.max(0, h.cur - 1);
  st.stats.checkoffs = Math.max(0, st.stats.checkoffs - 1);
  st.stats.undos++;
  h.void = h.void || {};
  h.void[t] = { c: rec.c, hp: rec.hp || 0 };
  delete h.rec[t];
  delete h.logs[t];
  const rc0 = st.history[t];
  if (rc0) rc0.coins = Math.max(0, (rc0.coins || 0) - rec.c);
  rollupDay(st, t);
  unpayDay(st, t);
  return { ok: true, unchecked: true, refunded: rec.c };
}

// If a day had already paid its all-clear bonus and no longer qualifies, take the
// bonus, the streak day and the hatch step back.
export function unpayDay(st: AppState, t: string): void {
  const rec = st.history[t];
  if (!rec || !rec.paid) return;
  const goal = dayGoal(st, t);
  if (rec.due > 0 && rec.done >= goal) return;
  refundCoins(st, rec.bonus || 0, 'clear');
  rec.coins = Math.max(0, (rec.coins || 0) - (rec.bonus || 0));
  st.profile.streak = Math.max(0, st.profile.streak - 1);
  if (st.pet.hatchState !== 'hatched' && rec.hatched) st.pet.hatchProgress = Math.max(0, st.pet.hatchProgress - 1);
  delete rec.paid;
  delete rec.bonus;
  delete rec.hatched;
}

export interface AllClearResult { cleared: boolean; already?: boolean; bonus?: number; hatched?: boolean; streak?: number }
// Grant the all-clear bonus + advance the overall streak / hatch progress, once per day.
export function maybeAllClear(st: AppState, now: Date = new Date()): AllClearResult {
  const t = today(now);
  const due = dueList(st, t);
  const done = doneCount(st, t);
  const goal = dayGoal(st, t);
  if (due.length === 0 || done < goal) return { cleared: false };
  if (st.history[t] && st.history[t].paid) return { cleared: false, already: true };
  const bonus = allClearBonus(st);
  addCoins(st, bonus, 'clear');
  st.profile.streak += 1;
  st.profile.best = Math.max(st.profile.best, st.profile.streak);
  rollupDay(st, t);
  const rec = st.history[t];
  rec.paid = 1;
  rec.bonus = bonus;
  rec.coins = (rec.coins || 0) + bonus;
  let hatched = false;
  if (st.pet.hatchState !== 'hatched') {
    st.pet.hatchProgress = Math.min(3, st.pet.hatchProgress + 1);
    rec.hatched = 1;
    if (st.pet.hatchProgress >= 3) hatched = true;
  }
  return { cleared: true, bonus, hatched, streak: st.profile.streak };
}

// Commit the hatch: called when the Nursery overlay reveal completes.
export function commitHatch(st: AppState, now: Date = new Date()): void {
  st.pet.hatchState = 'hatched';
  st.pet.hatchProgress = 3;
  st.pet.seenHatch = true;
  st.pet.health = 100;
  st.pet.lastCollect = now.getTime();
  if (!st.pet.hatchedOn) st.pet.hatchedOn = today(now);
}

// The deterministic daily rollover: replay-safe, runs on every load. Walks each elapsed
// local date, evaluating all-clear / freeze consumption / decay / hatch progress, then the
// weekly Streak-Freeze refill. Correct across multi-day gaps, DST and timezone changes.
export interface RolloverResult { moved: number }
export function rollover(st: AppState, now: Date = new Date()): RolloverResult {
  const t = today(now);
  if (st.day === t) return { moved: 0 };
  let cursor = st.day;
  let moved = 0;
  let guard = 0;
  while (cursor < t && guard++ < 400) {
    const d = cursor;
    rollupDay(st, d);
    const rec = st.history[d] || { due: 0, done: 0, ac: 0 };
    if (rec.due > 0) {
      if (rec.ac) {
        if (!rec.paid) {
          st.profile.streak += 1;
          st.profile.best = Math.max(st.profile.best, st.profile.streak);
          rec.paid = 1;
          if (st.pet.hatchState !== 'hatched') st.pet.hatchProgress = Math.min(3, st.pet.hatchProgress + 1);
        }
      } else if (st.profile.freezes > 0 && st.profile.streak > 0) {
        st.profile.freezes -= 1;
        st.stats.freezesUsed++;
        rec.frozen = 1;
        st.frozeYesterday = d;
      } else {
        st.profile.streak = 0;
      }
      st.habits.forEach((h) => {
        if (!isDue(h, d)) return;
        if (h.logs[d] === 'done') return;
        if (rec.frozen) { h.logs[d] = 'frozen'; return; }
        h.cur = 0;
      });
      if (st.pet.hatchState === 'hatched') {
        const restore = Math.round((18 * rec.done) / rec.due);
        st.pet.health = Math.max(0, Math.min(100, st.pet.health - decayPerDay(st) + restore));
        if (st.pet.health >= 75) st.stats.healthy++;
        else st.stats.healthy = 0;
        st.stats.bestHealthy = Math.max(st.stats.bestHealthy, st.stats.healthy);
      }
      rec.h = st.pet.health;
    }
    cursor = dstrOff(1, cursor);
    moved++;
    if (perks(st).freeze && isoWeek(cursor) !== st.profile.freezeWeek) {
      st.profile.freezes = Math.min(3, st.profile.freezes + 1);
      st.profile.freezeWeek = isoWeek(cursor);
    }
  }
  st.day = t;
  rollupDay(st, t);
  if (st.pet.hatchState !== 'hatched' && st.pet.hatchProgress >= 3) st.pet.seenHatch = false;
  return { moved };
}

// Grant any newly-met achievements; returns the newly unlocked ids (for reward toasts).
export function checkAch(st: AppState, now: Date = new Date()): string[] {
  const newly: string[] = [];
  ACHIEVEMENTS.forEach((a) => {
    if (!st.achievements.includes(a.id) && achMet(st, a.id)) {
      st.achievements.push(a.id);
      st.achLog[a.id] = today(now);
      newly.push(a.id);
    }
  });
  return newly;
}

// ---- purchases / care ----
export interface BuyResult { ok: boolean; reason?: 'none' | 'poor' | 'premium' | 'owned' | 'locked' | 'invalid'; }

export function feed(st: AppState, foodId: number): BuyResult & { food?: FoodDef; gained?: number } {
  if ((st.pet.food[foodId] || 0) <= 0) return { ok: false, reason: 'none' };
  const f = FOODS.find((x) => x.id === foodId);
  if (!f) return { ok: false, reason: 'invalid' };
  const gained = Math.min(f.heal, 100 - st.pet.health);
  st.pet.food[foodId] = (st.pet.food[foodId] || 0) - 1;
  st.pet.health = Math.min(100, st.pet.health + f.heal);
  st.stats.mealsFed += 1;
  return { ok: true, food: f, gained };
}

export function buyFood(st: AppState, id: number): BuyResult & { food?: FoodDef } {
  const f = FOODS.find((x) => x.id === id);
  if (!f) return { ok: false, reason: 'invalid' };
  if (f.premium && !st.profile.premium) return { ok: false, reason: 'premium' };
  if (st.profile.coins < f.price) return { ok: false, reason: 'poor' };
  spendCoins(st, f.price, 'food');
  st.pet.food[id] = (st.pet.food[id] || 0) + 1;
  return { ok: true, food: f };
}

export function equip(st: AppState, clothesId: number): void {
  st.pet.clothesId = st.pet.clothesId === clothesId ? 0 : clothesId;
  st.stats.outfitChanges += 1;
}

export function buyClothes(st: AppState, id: number): BuyResult & { name?: string; equipped?: boolean } {
  const c = CLOTHES.find((x) => x.id === id);
  if (!c) return { ok: false, reason: 'invalid' };
  if (st.pet.ownedClothes.includes(id)) { equip(st, id); return { ok: true, name: c.name, equipped: true }; }
  if (c.premium && !st.profile.premium) return { ok: false, reason: 'premium' };
  if (st.profile.coins < c.price) return { ok: false, reason: 'poor' };
  spendCoins(st, c.price, 'clothes');
  st.pet.ownedClothes.push(id);
  return { ok: true, name: c.name };
}

export function buyPet(st: AppState, id: string): BuyResult & { name?: string; equipped?: boolean } {
  const sp = SPECIES.find((x) => x.id === id);
  if (!sp) return { ok: false, reason: 'invalid' };
  const owned = st.pet.ownedSpecies.includes(sp.id);
  // Switching to an owned species keeps every stat, including the worn outfit — the prototype's
  // switchSpecies carries the wardrobe straight over (no clothesId reset).
  if (owned) { st.pet.species = sp.id; return { ok: true, name: sp.name, equipped: true }; }
  if (sp.premium && !st.profile.premium) return { ok: false, reason: 'premium' };
  if (st.profile.coins < sp.price) return { ok: false, reason: 'poor' };
  spendCoins(st, sp.price, 'species');
  st.pet.ownedSpecies.push(sp.id);
  st.pet.species = sp.id;
  return { ok: true, name: sp.name };
}

export function plantPlot(st: AppState, id: string, now: Date = new Date()): BuyResult & { plot?: GardenPlot } {
  const m = GARDEN.find((g) => g.id === id);
  if (!m) return { ok: false, reason: 'invalid' };
  if (st.garden.includes(id)) return { ok: false, reason: 'owned' };
  const next = nextPlot(st);
  if (!next || next.id !== id) return { ok: false, reason: 'locked' };
  if (st.profile.coins < m.cost) return { ok: false, reason: 'poor' };
  spendCoins(st, m.cost, 'garden');
  st.garden.push(id);
  st.gardenLog[id] = today(now);
  return { ok: true, plot: m };
}

export function collectIdle(st: AppState, now: Date = new Date()): { ok: boolean; amt: number } {
  const amt = idlePending(st, now.getTime());
  if (amt <= 0) return { ok: false, amt: 0 };
  addCoins(st, amt, 'idle');
  st.pet.lastCollect = now.getTime();
  st.stats.idleCollected += amt;
  return { ok: true, amt };
}
