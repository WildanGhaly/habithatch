// App state types — mirror the prototype freshState()/blankState() `S` shape 1:1.
// Persisted as a single JSON snapshot (see db/persistence.ts), exactly like the
// prototype's localStorage document and Pawductivity's kv table.

import { ThemeId } from '../theme/tokens';

export type SpeciesId = 'dog' | 'cat' | 'fox' | 'penguin' | 'axolotl';
export type CategoryId =
  | 'water' | 'exercise' | 'read' | 'meditate' | 'run' | 'hygiene'
  | 'nophone' | 'wake' | 'sleep' | 'medicine' | 'custom';
export type ScheduleKind = 'daily' | 'weekdays' | 'weekly';
export type HatchState = 'egg' | 'crack' | 'hatched';
export type LogStatus = 'done' | 'frozen';

export type TabKey = 'today' | 'habits' | 'pet' | 'garden';

// The per-check-off undo ledger entry: exact coins + health granted, replayed on re-check.
export interface Grant {
  c: number; // coins granted
  hp: number; // health granted
}

export interface Habit {
  id: number;
  name: string;
  cat: CategoryId;
  sched: ScheduleKind;
  days: number[]; // weekday indices (0=Sun) when sched==='weekdays'
  perWeek: number; // target completions/week when sched==='weekly'
  remind: string; // 'HH:MM' local, '' = none
  cur: number; // current per-habit streak
  best: number; // best per-habit streak
  coins: number; // lifetime coins from this habit
  archived: boolean;
  created: string; // 'YYYY-MM-DD'
  logs: Record<string, LogStatus>; // date -> 'done' | 'frozen'
  rec: Record<string, Grant>; // date -> the grant recorded, for exact undo
  void: Record<string, Grant>; // date -> a grant that was undone, replayed if re-checked
}

// One rolled-up day. `paid`/`bonus`/`hatched`/`frozen` are written when the day
// clears (so an undo can precisely reverse them). `h` is companion health at day close.
export interface DaySummary {
  due: number;
  done: number;
  ac: 0 | 1; // all-clear
  paid?: 0 | 1; // the all-clear bonus was granted
  bonus?: number; // the all-clear bonus amount
  hatched?: 0 | 1; // this day advanced the hatch progress
  frozen?: 0 | 1; // a Streak Freeze covered this day
  coins?: number; // total coins that day
  h?: number; // companion health at day close (0-100)
}

export interface Profile {
  name: string;
  coins: number;
  premium: boolean;
  streak: number; // overall daily streak
  best: number; // overall best streak
  freezes: number; // Streak Freeze tokens held
  freezeWeek: string | null; // ISO-week id the weekly freeze was last granted
  dailyGoal: number; // habits/day = a win (0 = "all due")
  lifetimeCoins: number; // drives level/xp
  theme: ThemeId;
  code: string; // referral code (stubbed offline)
}

export interface Pet {
  species: SpeciesId;
  name: string;
  health: number; // 0..100
  clothesId: number; // 0 = none
  ownedSpecies: SpeciesId[];
  ownedClothes: number[];
  food: Record<number, number>; // foodId -> count owned
  lastCollect: number; // epoch ms (idle-jar anchor)
  hatchState: HatchState;
  hatchProgress: number; // 0..3 all-clear days toward hatch
  seenHatch: boolean;
  hatchedOn: string | null; // 'YYYY-MM-DD'
}

export interface Settings {
  notif: boolean;
  sound: boolean;
  evening: boolean; // evening "still due" sweep
  hunger: boolean; // hunger warning
}

export interface Stats {
  mealsFed: number;
  idleCollected: number;
  outfitChanges: number;
  healthy: number; // consecutive days health >= 75
  bestHealthy: number;
  checkoffs: number;
  freezesUsed: number;
  undos: number;
  src: { check: number; clear: number; idle: number; gift: number };
  spent: { food: number; clothes: number; species: number; garden: number };
}

export interface AppState {
  v: 2;
  tab: TabKey; // runtime-only UI tab
  nextId: number;
  day: string; // last day the state was rolled to ('YYYY-MM-DD')
  profile: Profile;
  pet: Pet;
  habits: Habit[];
  history: Record<string, DaySummary>; // date -> summary
  garden: string[]; // planted plot ids (in plant order)
  gardenLog: Record<string, string>; // plot id -> date planted
  achievements: string[]; // unlocked ids
  achLog: Record<string, string>; // id -> date unlocked
  settings: Settings;
  stats: Stats;
  // transient marker set when a freeze covered yesterday (for the morning notice)
  frozeYesterday?: string;
  // stable per-install id, only used by stubbed referral/sync
  deviceId?: string;
}
