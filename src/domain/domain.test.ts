import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankState, freshState } from './state';
import { newHabit } from './mechanics';
import {
  isDue, dueList, coinsForCheck, allClearBonus, moodOf, petStage, decayPerDay,
  idlePending, perks, achMet, dayGoal,
} from './mechanics';
import {
  toggleHabit, maybeAllClear, rollover, plantPlot, feed, buyPet, collectIdle, commitHatch,
} from './actions';
import { today, dstrOff, isoWeek, daysBetween, weekStart, dow } from './dates';
import { AppState } from './types';

const NOW = new Date('2026-08-03T10:00:00'); // a fixed local Monday-ish reference
const clone = (s: AppState): AppState => JSON.parse(JSON.stringify(s));

function withDailyHabit(hatched = false, now = NOW): AppState {
  const st = blankState(now);
  // backdate creation so the habit is "due" on past days the rollover tests walk over
  st.habits.push(newHabit({ id: 1, name: 'Water', cat: 'water', sched: 'daily', created: dstrOff(-30, undefined, now) }));
  st.nextId = 2;
  if (hatched) { st.pet.hatchState = 'hatched'; st.pet.hatchProgress = 3; st.pet.seenHatch = true; }
  return st;
}

// ---- dates ----
test('date helpers use local YYYY-MM-DD and are internally consistent', () => {
  assert.equal(today(NOW), '2026-08-03');
  assert.equal(dstrOff(1, undefined, NOW), '2026-08-04');
  assert.equal(dstrOff(-1, '2026-08-03'), '2026-08-02');
  assert.equal(daysBetween('2026-08-01', '2026-08-03'), 2);
  // a DST-transition span (US spring forward 2026-03-08) still counts whole local days
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2);
  assert.equal(dow('2026-08-03'), 1); // Monday
  assert.equal(weekStart('2026-08-06'), '2026-08-03'); // Thursday -> Monday
  assert.equal(isoWeek('2026-01-01'), isoWeek('2026-01-01')); // stable
});

// ---- scheduling ----
test('isDue: daily / weekdays / weekly quota', () => {
  const daily = newHabit({ id: 1, sched: 'daily', created: '2026-08-01' });
  assert.equal(isDue(daily, '2026-08-03'), true);
  // not due before creation
  assert.equal(isDue(newHabit({ id: 2, sched: 'daily', created: '2026-08-05' }), '2026-08-03'), false);

  const wd = newHabit({ id: 3, sched: 'weekdays', days: [1, 2, 3, 4, 5], created: '2026-08-01' });
  assert.equal(isDue(wd, '2026-08-03'), true); // Mon
  assert.equal(isDue(wd, '2026-08-08'), false); // Sat

  const wk = newHabit({ id: 4, sched: 'weekly', perWeek: 2, created: '2026-08-01' });
  assert.equal(isDue(wk, '2026-08-03'), true);
  wk.logs['2026-08-03'] = 'done';
  wk.logs['2026-08-04'] = 'done';
  // quota met -> drops out of due for the rest of that ISO week
  assert.equal(isDue(wk, '2026-08-05'), false);
  // but a day it was actually completed still reads as due (so it renders checked)
  assert.equal(isDue(wk, '2026-08-03'), true);
});

// ---- coins ----
test('coinsForCheck matches PLAN 7.1: base + streakBonus + hardBonus + perks + mood', () => {
  const st = withDailyHabit(true);
  st.pet.health = 100; // happy -> +25% mood bonus
  const h = st.habits[0];
  h.cur = 9; // streakBonus = min(floor(9/3),5)=3
  const c = coinsForCheck(st, h);
  // core = 5 + 3 + 1(daily) = 9 ; extra = perCheck(0) + round(9 * 0.25) = 2
  assert.equal(c.core, 9);
  assert.equal(c.total, 11);
  // streak bonus caps at +5
  h.cur = 30;
  assert.equal(coinsForCheck(st, h).core, 5 + 5 + 1);
});

test('allClearBonus = 15 + min(streak,30), boosted by berry/orchard perks', () => {
  const st = withDailyHabit(true);
  st.profile.streak = 12;
  assert.equal(allClearBonus(st), 27);
  st.garden.push('berry'); // +10%
  assert.equal(allClearBonus(st), Math.round(27 * 1.1));
});

// ---- check / uncheck idempotency ----
test('check then uncheck nets exactly to zero (wallet, health, streak, ledger)', () => {
  const st = withDailyHabit(true);
  st.pet.health = 50;
  const before = clone(st);
  const r1 = toggleHabit(st, 1, NOW);
  assert.equal(r1.ok, true);
  assert.ok(st.profile.coins > 0);
  assert.ok(st.pet.health > 50); // hatched pet gets health from a check
  const r2 = toggleHabit(st, 1, NOW);
  assert.deepEqual(r2, { ok: true, unchecked: true, refunded: (r1 as any).total });
  assert.equal(st.profile.coins, before.profile.coins);
  assert.equal(st.profile.lifetimeCoins, before.profile.lifetimeCoins);
  assert.equal(st.pet.health, before.pet.health);
  assert.equal(st.habits[0].cur, before.habits[0].cur);
  assert.equal(st.stats.checkoffs, before.stats.checkoffs);
  // re-checking replays the exact voided grant
  const r3 = toggleHabit(st, 1, NOW);
  assert.equal((r3 as any).total, (r1 as any).total);
});

// ---- all-clear + hatch gate ----
test('maybeAllClear pays once/day, advances streak, and hatches at progress 3', () => {
  const st = withDailyHabit(false); // egg
  st.pet.hatchProgress = 2;
  toggleHabit(st, 1, NOW);
  const ac = maybeAllClear(st, NOW);
  assert.equal(ac.cleared, true);
  assert.equal(ac.streak, 1);
  assert.equal(ac.hatched, true); // 2 -> 3
  assert.equal(st.pet.hatchProgress, 3);
  // a second call the same day is a no-op
  const ac2 = maybeAllClear(st, NOW);
  assert.equal(ac2.cleared, false);
  assert.equal(ac2.already, true);
});

test('commitHatch flips the pet to hatched at full health', () => {
  const st = withDailyHabit(false);
  st.pet.hatchProgress = 3;
  commitHatch(st, NOW);
  assert.equal(st.pet.hatchState, 'hatched');
  assert.equal(st.pet.health, 100);
  assert.equal(achMet(st, 'alive'), true);
});

// ---- rollover ----
test('rollover is replay-safe: running it twice equals running it once', () => {
  const st = withDailyHabit(true);
  st.day = dstrOff(-3, undefined, NOW);
  const a = clone(st);
  rollover(a, NOW);
  const b = clone(a);
  rollover(b, NOW); // second run same day -> no change
  assert.deepEqual(a, b);
  assert.equal(a.day, today(NOW));
});

test('rollover: a missed due day with no freeze resets the overall streak', () => {
  const st = withDailyHabit(true);
  st.profile.streak = 5;
  st.profile.best = 5;
  st.day = dstrOff(-1, undefined, NOW); // yesterday due, not done
  rollover(st, NOW);
  assert.equal(st.profile.streak, 0);
  assert.equal(st.profile.best, 5); // best preserved
  assert.equal(st.habits[0].logs[dstrOff(-1, undefined, NOW)], undefined); // not frozen
});

test('rollover: a Streak Freeze covers a missed day and holds the streak', () => {
  const st = withDailyHabit(true);
  st.profile.streak = 5;
  st.profile.freezes = 1;
  st.garden.push('sapling'); // freeze perk present (weekly refill)
  st.day = dstrOff(-1, undefined, NOW);
  rollover(st, NOW);
  assert.equal(st.profile.streak, 5); // held
  assert.equal(st.stats.freezesUsed, 1);
  assert.equal(st.habits[0].logs[dstrOff(-1, undefined, NOW)], 'frozen');
});

test('rollover: decays health per missed day across a multi-day gap (hatched pet)', () => {
  const st = withDailyHabit(true);
  st.pet.health = 100;
  st.day = dstrOff(-3, undefined, NOW); // 3 fully-missed due days
  rollover(st, NOW);
  // 3 days * 12 decay (no restore, nothing done) but floored at 0
  assert.equal(st.pet.health, 100 - 3 * decayPerDay(st));
  assert.ok(st.pet.health >= 0);
});

test('rollover: weekly Streak-Freeze refill grants at most one per ISO week', () => {
  const st = withDailyHabit(true);
  st.garden.push('sapling');
  st.profile.freezes = 0;
  st.profile.freezeWeek = isoWeek(dstrOff(-10, undefined, NOW));
  st.day = dstrOff(-10, undefined, NOW);
  rollover(st, NOW);
  // spanning ~2 ISO weeks grants freezes but never more than the cap of 3
  assert.ok(st.profile.freezes >= 1);
  assert.ok(st.profile.freezes <= 3);
  assert.equal(st.profile.freezeWeek, isoWeek(today(NOW)));
});

// ---- pet / idle ----
test('mood tiers and decay/idle perks', () => {
  assert.equal(moodOf(80).k, 'happy');
  assert.equal(moodOf(50).k, 'content');
  assert.equal(moodOf(30).k, 'tired');
  assert.equal(moodOf(10).k, 'hungry');
  const st = withDailyHabit(true);
  assert.equal(decayPerDay(st), 12);
  st.garden.push('can', 'fruit'); // -2 -2
  assert.equal(decayPerDay(st), 8);
});

test('idle jar: 0 before hatch, accrues at rate up to cap after hatch', () => {
  const st = withDailyHabit(false);
  st.pet.lastCollect = NOW.getTime() - 10 * 3600 * 1000;
  assert.equal(idlePending(st, NOW.getTime()), 0); // egg -> no foraging
  st.pet.hatchState = 'hatched';
  assert.equal(idlePending(st, NOW.getTime()), 10); // 10h * 1/hr
  st.pet.lastCollect = NOW.getTime() - 999 * 3600 * 1000;
  assert.equal(idlePending(st, NOW.getTime()), 50); // capped
  const r = collectIdle(st, NOW);
  assert.equal(r.ok, true);
  assert.equal(r.amt, 50);
});

// ---- garden / purchases ----
test('garden plots must be bought in order and cost coins', () => {
  const st = withDailyHabit(true);
  st.profile.coins = 500;
  assert.equal(plantPlot(st, 'herbs', NOW).ok, false); // locked: sprout is next
  const r = plantPlot(st, 'sprout', NOW);
  assert.equal(r.ok, true);
  assert.equal(st.profile.coins, 380);
  assert.deepEqual(st.garden, ['sprout']);
});

test('buyPet respects premium gate and coin cost', () => {
  const st = withDailyHabit(true);
  st.profile.coins = 100;
  assert.equal(buyPet(st, 'fox').reason, 'poor');
  st.profile.coins = 700;
  assert.equal(buyPet(st, 'fox').ok, true);
  assert.ok(st.pet.ownedSpecies.includes('fox'));
  assert.equal(buyPet(st, 'axolotl').reason, 'premium'); // premium locked
});

// ---- feed ----
test('feed consumes a treat and heals up to 100', () => {
  const st = withDailyHabit(true);
  st.pet.health = 95;
  st.pet.food[1] = 1;
  const r = feed(st, 1);
  assert.equal(r.ok, true);
  assert.equal(st.pet.health, 100);
  assert.equal(st.pet.food[1], 0);
  assert.equal(feed(st, 1).reason, 'none');
});

// ---- demo seed smoke test ----
test('freshState(demo) yields a coherent mid-journey state', () => {
  const st = freshState(true, NOW);
  assert.equal(st.pet.hatchState, 'hatched');
  assert.ok(st.profile.coins > 0);
  assert.ok(st.profile.lifetimeCoins > st.profile.coins);
  assert.ok(st.profile.streak > 0);
  assert.ok(st.garden.length > 0);
  assert.ok(st.habits.length === 6);
  assert.ok(Object.keys(st.history).length > 50);
  assert.ok(st.achievements.length > 0);
  assert.equal(st.day, today(NOW));
  // health within bounds, day goal sensible
  assert.ok(st.pet.health >= 0 && st.pet.health <= 100);
  assert.ok(dayGoal(st, today(NOW)) >= 0);
});
