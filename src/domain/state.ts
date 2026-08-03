// State factories — ported 1:1 from the prototype blankState()/freshState()/simulateHistory().
// A real new user starts from blankState() (eggbound, no history); the demo seed replays
// 8 real weeks through the same rules so the dashboard never contradicts itself.

import { AppState, Habit, SpeciesId } from './types';
import { GARDEN, SEED_DAYS, ACHIEVEMENTS, SPECIES, CLOTHES } from './catalogs';
import { newHabit } from './mechanics';
import { isDue } from './mechanics';
import { today, dstrOff, daysBetween, isoWeek } from './dates';
import { rollupDay, checkAch } from './actions';

export function newDeviceId(): string {
  // stable-enough per install; only used by the stubbed referral/sync features
  return 'dev-' + Math.random().toString(36).slice(2, 10);
}

export function blankState(now: Date = new Date()): AppState {
  return {
    v: 2,
    tab: 'today',
    nextId: 1,
    day: today(now),
    profile: {
      name: 'Friend', coins: 0, premium: false,
      streak: 0, best: 0, freezes: 0, freezeWeek: null,
      dailyGoal: 0, lifetimeCoins: 0, theme: 'hatch', code: 'HATCH-4K9Q',
    },
    pet: {
      species: 'fox', name: '', health: 100, clothesId: 0,
      ownedSpecies: ['dog', 'cat'], ownedClothes: [], food: { 1: 1, 2: 1, 3: 0, 4: 0, 5: 0 },
      lastCollect: now.getTime(), hatchState: 'egg', hatchProgress: 0, seenHatch: false, hatchedOn: null,
    },
    habits: [], history: {}, garden: [], gardenLog: {}, achievements: [], achLog: {},
    settings: { notif: true, sound: true, evening: true, hunger: true },
    stats: {
      mealsFed: 0, idleCollected: 0, outfitChanges: 0, healthy: 0, bestHealthy: 0,
      checkoffs: 0, freezesUsed: 0, undos: 0,
      src: { check: 0, clear: 0, idle: 0, gift: 0 },
      spent: { food: 0, clothes: 0, species: 0, garden: 0 },
    },
  };
}

// DEV/TESTING seed — a fully-unlocked mid-journey state for exercising every screen and
// animation. Built on the demo history (so Insights/heatmap have data), then: premium on,
// every species + outfit owned, all 8 garden plots, big coins, all achievements, idle jar
// full. Left EGG-READY (hatchProgress 3) so the Nursery hatch sequence is available on the
// Today egg banner; hatching then reveals the fully-unlocked companion. Reached only via the
// splash dev-tap.
export function unlockAllState(now: Date = new Date()): AppState {
  const s = freshState(true, now);
  s.profile.premium = true;
  s.profile.coins = 50000;
  s.profile.lifetimeCoins = Math.max(s.profile.lifetimeCoins, 60000);
  s.profile.freezes = 3;
  s.pet.ownedSpecies = SPECIES.map((x) => x.id);
  s.pet.ownedClothes = CLOTHES.map((x) => x.id);
  s.pet.food = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9 };
  s.pet.clothesId = 0;
  s.pet.lastCollect = now.getTime() - 60 * 3600 * 1000; // idle jar full
  s.garden = GARDEN.map((g) => g.id);
  GARDEN.forEach((g) => { if (!s.gardenLog[g.id]) s.gardenLog[g.id] = today(now); });
  s.achievements = ACHIEVEMENTS.map((a) => a.id);
  ACHIEVEMENTS.forEach((a) => { if (!s.achLog[a.id]) s.achLog[a.id] = today(now); });
  // egg-ready so the hatch animation can be watched; species revealed = fox
  s.pet.species = 'fox';
  s.pet.hatchState = 'egg';
  s.pet.hatchProgress = 3;
  s.pet.seenHatch = false;
  s.pet.hatchedOn = null;
  return s;
}

// xorshift PRNG for a deterministic demo history.
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function freshState(demo?: boolean, now: Date = new Date()): AppState {
  const S0 = blankState(now);
  if (!demo) return S0;
  S0.profile.name = 'Haryanto';
  S0.pet = {
    ...S0.pet, species: 'fox', name: 'Pip', hatchState: 'hatched', hatchProgress: 3,
    seenHatch: true, ownedSpecies: ['dog', 'cat', 'fox'], ownedClothes: [1, 2], clothesId: 0,
    food: { 1: 2, 2: 1, 3: 0, 4: 1, 5: 0 }, lastCollect: now.getTime() - 3.4 * 3600 * 1000,
    hatchedOn: dstrOff(-(SEED_DAYS - 3), undefined, now),
  };
  S0.habits = [
    newHabit({ id: 1, name: 'Drink 8 glasses of water', cat: 'water', sched: 'daily', remind: '09:00', created: dstrOff(-SEED_DAYS, undefined, now) }),
    newHabit({ id: 2, name: 'Move for 20 minutes', cat: 'exercise', sched: 'weekdays', days: [1, 2, 3, 4, 5], remind: '17:30', created: dstrOff(-SEED_DAYS, undefined, now) }),
    newHabit({ id: 3, name: 'Read before bed', cat: 'read', sched: 'daily', remind: '21:30', created: dstrOff(-SEED_DAYS, undefined, now) }),
    newHabit({ id: 4, name: 'Lights out by 11', cat: 'sleep', sched: 'daily', remind: '22:45', created: dstrOff(-42, undefined, now) }),
    newHabit({ id: 5, name: 'No phone in bed', cat: 'nophone', sched: 'daily', remind: '21:00', created: dstrOff(-35, undefined, now) }),
    newHabit({ id: 6, name: 'Long run', cat: 'run', sched: 'weekly', perWeek: 2, remind: '07:00', created: dstrOff(-28, undefined, now) }),
  ];
  S0.nextId = 7;
  simulateHistory(S0, now);
  return S0;
}

// Replays SEED_DAYS of days through the real rules (same coin formula, decay, streak
// logic). A deliberate arc: a wobbly first fortnight, a slump around week six, strong finish.
export function simulateHistory(st: AppState, now: Date = new Date()): void {
  const r = rng(20260801);
  const reliability: Record<number, number> = { 1: 0.95, 2: 0.88, 3: 0.86, 4: 0.9, 5: 0.96, 6: 0.82 };
  let health = 100;
  let streak = 0;
  let best = 0;
  let lifetime = 0;
  let allClearCount = 0;
  const owned: Record<string, number> = {};
  let bank = 0;
  for (let i = SEED_DAYS; i >= 1; i--) {
    const d = dstrOff(-i, undefined, now);
    const progress = (SEED_DAYS - i) / SEED_DAYS;
    const warmup = i > SEED_DAYS - 12 ? 0.72 : 1;
    const slump = i <= 16 && i >= 7 ? 0.18 : 1;
    const peak = i <= 36 && i >= 26;
    const finish = i <= 6;
    let checkCoins = 0;
    let dueN = 0;
    let doneN = 0;
    st.habits.forEach((h) => {
      if (daysBetween(h.created, d) < 0) return;
      if (!isDue(h, d)) return;
      dueN++;
      const rel = Math.min(0.985, (reliability[h.id] || 0.85) + progress * 0.08) * warmup * slump;
      if (finish || peak || r() < rel) {
        const core = 5 + Math.min(Math.floor(h.cur / 3), 5) + (h.sched === 'daily' ? 1 : 0);
        const extra = (owned.sprout ? 1 : 0) + Math.round(core * (health >= 75 ? 0.25 : health >= 45 ? 0.1 : 0)) + Math.round(core * (owned.orchard ? 0.2 : 0));
        const c = core + extra;
        h.logs[d] = 'done';
        h.rec[d] = { c, hp: 0 };
        h.cur += 1;
        h.best = Math.max(h.best, h.cur);
        h.coins += c;
        checkCoins += c;
        doneN++;
        st.stats.checkoffs++;
      } else {
        h.cur = 0;
      }
    });
    const ac = dueN > 0 && doneN >= dueN;
    let bonus = 0;
    if (ac) {
      bonus = Math.round((15 + Math.min(streak, 30)) * (1 + (owned.berry ? 0.1 : 0) + (owned.orchard ? 0.2 : 0)));
      streak += 1;
      best = Math.max(best, streak);
      allClearCount++;
      if (allClearCount === 3 && !st.pet.hatchedOn) st.pet.hatchedOn = d;
    } else if (dueN > 0) {
      streak = 0;
    }
    st.stats.src.check += checkCoins;
    st.stats.src.clear += bonus;
    const dayCoins = checkCoins + bonus;
    lifetime += dayCoins;
    bank += dayCoins;
    if (dueN > 0) {
      const decay = Math.max(6, 12 - (owned.can ? 2 : 0) - (owned.fruit ? 2 : 0));
      health = Math.max(0, Math.min(100, health - decay + Math.round((18 * doneN) / dueN)));
    }
    if (health >= 75) st.stats.healthy++;
    else st.stats.healthy = 0;
    st.stats.bestHealthy = Math.max(st.stats.bestHealthy, st.stats.healthy);
    st.history[d] = { due: dueN, done: doneN, ac: ac ? 1 : 0, paid: ac ? 1 : 0, coins: dayCoins, h: health };
    if (!owned._fox && bank > 1000) { owned._fox = 1; bank -= 600; st.stats.spent.species += 600; }
    if (!owned._c1 && bank > 500) { owned._c1 = 1; bank -= 80; st.stats.spent.clothes += 80; }
    if (!owned._c2 && bank > 700) { owned._c2 = 1; bank -= 150; st.stats.spent.clothes += 150; }
    if (i % 3 === 0 && bank > 120) { bank -= 8; st.stats.spent.food += 8; st.stats.mealsFed++; }
    const nx = GARDEN.find((g) => !owned[g.id]);
    if (nx && bank - nx.cost >= 120) { bank -= nx.cost; owned[nx.id] = 1; st.garden.push(nx.id); st.gardenLog[nx.id] = d; st.stats.spent.garden += nx.cost; }
  }
  // today is live and partly finished
  const t = today(now);
  const dueNow = st.habits.filter((h) => isDue(h, t));
  let todayCoins = 0;
  dueNow.slice(0, 3).forEach((h) => {
    const core = 5 + Math.min(Math.floor(h.cur / 3), 5) + (h.sched === 'daily' ? 1 : 0);
    const extra = (st.garden.includes('sprout') ? 1 : 0) + Math.round(core * (health >= 75 ? 0.25 : health >= 45 ? 0.1 : 0));
    h.logs[t] = 'done';
    h.rec[t] = { c: core + extra, hp: 0 };
    h.cur += 1;
    h.best = Math.max(h.best, h.cur);
    h.coins += core + extra;
    todayCoins += core + extra;
    st.stats.checkoffs++;
  });
  st.stats.src.check += todayCoins;
  lifetime += todayCoins;
  bank += todayCoins;
  st.stats.idleCollected = 640;
  st.stats.src.idle = 640;
  bank += 640;
  lifetime += 640;
  st.stats.src.gift = 100;
  bank += 100;
  lifetime += 100;
  st.profile.freezes = 1;
  let nx2 = GARDEN.find((g) => !st.garden.includes(g.id));
  while (nx2 && bank - nx2.cost >= 340) {
    bank -= nx2.cost;
    st.garden.push(nx2.id);
    st.gardenLog[nx2.id] = dstrOff(-2, undefined, now);
    st.stats.spent.garden += nx2.cost;
    nx2 = GARDEN.find((g) => !st.garden.includes(g.id));
  }
  st.profile.coins = Math.round(bank);
  st.profile.lifetimeCoins = Math.round(lifetime);
  st.profile.streak = streak;
  st.profile.best = Math.max(best, streak);
  st.profile.freezeWeek = isoWeek(t);
  st.pet.health = health;
  if (!st.pet.hatchedOn) st.pet.hatchedOn = dstrOff(-(SEED_DAYS - 6), undefined, now);
  st.day = t;
  rollupDay(st, t);
  st.history[t].paid = 0;
  checkAch(st, now);
}
