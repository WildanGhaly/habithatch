// Pure game logic — ported 1:1 from the prototype, refactored to take the state `st`
// explicitly (the prototype used a global `S`). No mutation here; these only read/derive.
// The mutating transitions (check-off, rollover, purchases) live in actions.ts.

import { AppState, Habit, CategoryId, ScheduleKind } from './types';
import { GARDEN, STAGES, STAGE_GATE, SEED_DAYS } from './catalogs';
import { today, dstrOff, daysBetween, dow, weekStart, isoWeek } from './dates';

export interface Mood { t: string; k: 'happy' | 'content' | 'tired' | 'hungry'; bonus: number }

let habitSeq = 0; // only used by newHabit when no id is supplied (UI passes an id)

export function newHabit(o: Partial<Habit> = {}): Habit {
  return {
    id: 0,
    name: '',
    cat: 'custom',
    sched: 'daily',
    days: [1, 2, 3, 4, 5],
    perWeek: 3,
    remind: '',
    cur: 0,
    best: 0,
    coins: 0,
    archived: false,
    created: today(),
    logs: {},
    rec: {},
    void: {},
    ...o,
  } as Habit;
}

// Level/XP derived from lifetime coins so they can never drift out of sync.
export function levelInfo(st: AppState): { lvl: number; xp: number; need: number } {
  let xp = Math.max(0, st.profile.lifetimeCoins || 0);
  let lvl = 1;
  let need = 160;
  while (xp >= need) {
    xp -= need;
    lvl++;
    need = 10 * lvl * lvl + 50 * lvl + 100;
  }
  return { lvl, xp, need };
}

// ---- scheduling: "is this habit due on this local date?" ----
export function isDue(h: Habit, d: string): boolean {
  if (h.archived) return false;
  if (h.created && daysBetween(h.created, d) < 0) return false;
  if (h.sched === 'daily') return true;
  if (h.sched === 'weekdays') return (h.days || []).includes(dow(d));
  if (h.sched === 'weekly') {
    if (h.logs[d] === 'done') return true;
    return weekDone(h, d) < (h.perWeek || 3);
  }
  return true;
}

export function weekDone(h: Habit, d: string): number {
  const ws = weekStart(d);
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const k = dstrOff(i, ws);
    if (k > d) break;
    if (h.logs[k] === 'done') n++;
  }
  return n;
}

export function dueList(st: AppState, d: string): Habit[] {
  return st.habits.filter((h) => isDue(h, d)).sort((a, b) => a.id - b.id);
}
export function doneCount(st: AppState, d: string): number {
  return st.habits.filter((h) => h.logs[d] === 'done').length;
}
// The effective daily goal: profile.dailyGoal capped to what's actually due (min 1),
// or "all due" when dailyGoal is 0.
export function dayGoal(st: AppState, d: string): number {
  const g = st.profile.dailyGoal;
  const due = dueList(st, d).length;
  return g > 0 ? Math.min(g, Math.max(1, due)) : due;
}

// ---- garden perks ----
export function planted(st: AppState, id: string): boolean {
  return st.garden.includes(id);
}
export interface Perks { perCheck: number; cap: number; rate: number; decay: number; allClear: number; all: number; freeze: boolean }
export function perks(st: AppState): Perks {
  const p: Perks = { perCheck: 0, cap: 0, rate: 0, decay: 0, allClear: 0, all: 0, freeze: false };
  GARDEN.forEach((g) => {
    if (planted(st, g.id)) {
      p.perCheck += g.perCheck || 0;
      p.cap += g.cap || 0;
      p.rate += g.rate || 0;
      p.decay += g.decay || 0;
      p.allClear += g.allClear || 0;
      p.all += g.all || 0;
      if (g.freeze) p.freeze = true;
    }
  });
  return p;
}
export function nextPlot(st: AppState) {
  return GARDEN.find((g) => !planted(st, g.id));
}
export function gardenPct(st: AppState): number {
  return Math.round((st.garden.length / GARDEN.length) * 100);
}

// ---- pet ----
export function moodOf(h: number): Mood {
  if (h >= 75) return { t: 'Happy', k: 'happy', bonus: 0.25 };
  if (h >= 45) return { t: 'Content', k: 'content', bonus: 0.1 };
  if (h >= 20) return { t: 'Tired', k: 'tired', bonus: 0 };
  return { t: 'Hungry', k: 'hungry', bonus: 0 };
}
export function bonusPct(st: AppState): number {
  return Math.round(moodOf(st.pet.health).bonus * 100);
}
export function petStage(st: AppState): number {
  const b = Math.max(st.profile.best, st.profile.streak);
  let s = 1;
  for (let i = 1; i < STAGE_GATE.length; i++) if (b >= STAGE_GATE[i]) s = i + 1;
  return st.pet.hatchState === 'hatched' ? s : 1;
}
export function stageName(n: number): string {
  return STAGES[Math.min(4, Math.max(0, (n || 1) - 1))];
}
export function decayPerDay(st: AppState): number {
  return Math.max(6, 12 - perks(st).decay);
}
export function idleRate(st: AppState): number {
  return 1 * (1 + perks(st).rate);
}
export function idleCap(st: AppState): number {
  return 50 + perks(st).cap;
}
export function idlePending(st: AppState, now: number = Date.now()): number {
  if (st.pet.hatchState !== 'hatched') return 0;
  const hrs = (now - st.pet.lastCollect) / 3600000;
  return Math.max(0, Math.min(idleCap(st), Math.floor(hrs * idleRate(st))));
}
export function idleFull(st: AppState, now: number = Date.now()): boolean {
  return idlePending(st, now) >= idleCap(st);
}

// ---- economy ----
export interface CheckCoins { core: number; extra: number; total: number }
export function coinsForCheck(st: AppState, h: Habit): CheckCoins {
  const base = 5;
  const streakBonus = Math.min(Math.floor(h.cur / 3), 5);
  const hardBonus = h.sched === 'daily' ? 1 : 0;
  const core = base + streakBonus + hardBonus;
  const p = perks(st);
  const extra = p.perCheck + Math.round(core * (moodOf(st.pet.health).bonus + p.all));
  return { core, extra, total: core + extra };
}
export function allClearBonus(st: AppState): number {
  const p = perks(st);
  return Math.round((15 + Math.min(st.profile.streak, 30)) * (1 + p.allClear + p.all));
}

// ---- achievements ----
// Progress pairs [current, target] for the measurable badges; undefined for boolean ones.
export function achProg(st: AppState, id: string): [number, number] | null {
  const P = st.profile;
  const maxDone = Math.max(0, ...Object.values(st.history).map((r) => r.done || 0), 0);
  const map: Record<string, [number, number]> = {
    week: [Math.max(P.streak, P.best), 7],
    iron: [Math.max(P.streak, P.best), 30],
    centurion: [Math.max(P.streak, P.best), 100],
    perfect: [bestPerfectRun(st), 7],
    stacker: [maxDone, 5],
    comeback: [bestComeback(st), 7],
    wellfed: [Math.max(st.stats.healthy, st.stats.bestHealthy), 10],
    bloom: [st.garden.length, GARDEN.length],
    farmer: [P.lifetimeCoins, 10000],
  };
  return map[id] || null;
}
export interface StreakRun { from: string; to: string; len: number }
export function streakRuns(st: AppState): StreakRun[] {
  const days = Object.keys(st.history).filter((k) => st.history[k].due > 0).sort();
  const runs: StreakRun[] = [];
  let cur: StreakRun | null = null;
  days.forEach((k) => {
    if (st.history[k].ac) {
      if (!cur) cur = { from: k, to: k, len: 1 };
      else { cur.to = k; cur.len++; }
    } else if (st.history[k].frozen && cur) {
      cur.to = k;
    } else {
      if (cur) runs.push(cur);
      cur = null;
    }
  });
  if (cur) runs.push(cur);
  return runs.sort((a, b) => b.len - a.len);
}
export function bestPerfectRun(st: AppState): number {
  const r = streakRuns(st);
  return r.length ? r[0].len : 0;
}
// The longest run built after an earlier one had already been broken.
export function bestComeback(st: AppState): number {
  const r = streakRuns(st).slice().sort((a, b) => (a.from < b.from ? -1 : 1));
  return r.length > 1 ? Math.max(...r.slice(1).map((x) => x.len)) : 0;
}
export function achMet(st: AppState, id: string): boolean {
  const p = achProg(st, id);
  if (p) return p[0] >= p[1];
  switch (id) {
    case 'first_crack': return st.stats.checkoffs >= 1;
    case 'alive': return st.pet.hatchState === 'hatched';
    case 'green_thumb': return st.garden.length >= 1;
  }
  return false;
}
