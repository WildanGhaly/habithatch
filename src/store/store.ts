import { create } from 'zustand';
import { produce } from 'immer';
import { AppState, Habit, SpeciesId, TabKey, CategoryId, ScheduleKind } from '../domain/types';
import { ThemeId } from '../theme/tokens';
import { blankState, freshState, newDeviceId } from '../domain/state';
import { newHabit } from '../domain/mechanics';
import { nextPlot } from '../domain/mechanics';
import * as A from '../domain/actions';
import { ACHIEVEMENTS, GARDEN } from '../domain/catalogs';
import { persistence } from '../db/persistence';
import * as Notif from '../notifications/notifications';

export interface ToastMsg { id: number; text: string; coin?: boolean }

// Glyph source for reward popups (resolved by RewardOverlay against the art/icon registries).
export interface Glyph { type: 'icon' | 'art' | 'img'; name: string }
export interface RewardData {
  title: string;
  sub: string;
  glyph?: Glyph;
  coins?: number;
  right?: { v: string; l: string };
  stars?: number;
  note?: string;
  goal?: string;
}

export type OverlayName =
  | 'shop' | 'insights' | 'achievements' | 'premium' | 'referral' | 'recap' | 'profile' | 'nursery'
  | 'editor' | 'goal' | 'feed' | 'buy' | 'appearance';
export interface OverlayState { name: OverlayName; param?: any }

const FULL: OverlayName[] = ['shop', 'insights', 'achievements', 'premium', 'referral', 'recap', 'profile', 'nursery'];
export const isFullOverlay = (n: OverlayName) => FULL.includes(n);

export interface HabitInput {
  name: string;
  cat: CategoryId;
  sched: ScheduleKind;
  days?: number[];
  perWeek?: number;
  remind?: string;
}

interface StoreShape {
  state: AppState | null;
  hydrated: boolean;
  toast: ToastMsg | null;
  overlays: OverlayState[];
  reward: RewardData | null;
  rewardQueue: RewardData[];

  hydrate: () => Promise<void>;
  showToast: (text: string, coin?: boolean) => void;
  openOverlay: (name: OverlayName, param?: any) => void;
  closeOverlay: () => void;
  closeAllOverlays: () => void;
  showReward: (data: RewardData) => void;
  closeReward: () => void;
  mutate: <T>(fn: (s: AppState) => T) => T | undefined;

  finishOnboarding: (species: SpeciesId, habits: HabitInput[]) => void;
  resetData: () => Promise<void>;
  seedDemo: () => void;

  setTab: (tab: TabKey) => void;
  toggleHabit: (id: number) => void;
  checkDayComplete: () => void;
  addHabit: (h: HabitInput) => number;
  updateHabit: (id: number, patch: Partial<Habit>) => void;
  deleteHabit: (id: number) => void;
  archiveHabit: (id: number, archived: boolean) => void;
  moveHabit: (id: number, dir: -1 | 1) => void;
  setGoal: (n: number) => void;

  feed: (foodId: number) => void;
  equip: (clothesId: number) => void;
  buyFood: (id: number) => void;
  buyClothes: (id: number) => void;
  buyPet: (id: string) => void;
  plantPlot: (id: string) => void;
  collectIdle: () => void;
  commitHatch: (name?: string) => void;

  setName: (name: string) => void;
  setTheme: (id: ThemeId) => void;
  setPremium: (on: boolean) => void;
  toggleSetting: (k: 'notif' | 'sound' | 'evening' | 'hunger') => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let toastSeq = 1;

function scheduleSave(getState: () => StoreShape) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = getState().state;
    if (s) persistence.save(s);
  }, 250);
}

function badgeReward(st: AppState, id: string): RewardData | null {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return null;
  const glyph: Glyph = a.art
    ? { type: 'art', name: a.art }
    : a.img
      ? { type: 'img', name: a.img }
      : { type: 'icon', name: a.ic || 'trophy' };
  return {
    title: 'Badge unlocked',
    sub: a.name,
    glyph,
    stars: a.rar,
    note: a.desc,
    goal: `${st.achievements.length} of ${ACHIEVEMENTS.length} badges collected`,
  };
}

export const useStore = create<StoreShape>((set, get) => {
  // Core mutate: run fn on an immer draft, grant any newly-met achievements in the same
  // pass, enqueue their badge popups, persist. Returns fn's result.
  const mutate = <T,>(fn: (s: AppState) => T): T | undefined => {
    let result: T | undefined;
    let newly: string[] = [];
    set((store) => {
      if (!store.state) return store;
      const next = produce(store.state, (d) => {
        result = fn(d);
        newly = A.checkAch(d);
      });
      return { ...store, state: next };
    });
    if (newly.length) {
      const st = get().state!;
      newly.forEach((id) => {
        const r = badgeReward(st, id);
        if (r) get().showReward(r);
      });
    }
    scheduleSave(get);
    return result;
  };

  const syncReminders = () => {
    const s = get().state;
    if (s) Notif.syncHabitReminders(s.habits, s.settings);
  };

  return {
    state: null,
    hydrated: false,
    toast: null,
    overlays: [],
    reward: null,
    rewardQueue: [],

    hydrate: async () => {
      const loaded = await persistence.load();
      if (!loaded) {
        set({ state: null, hydrated: true });
        return;
      }
      // Backfill any fields an older save is missing, then run the deterministic rollover.
      const def = blankState();
      const migrated: AppState = {
        ...def,
        ...loaded,
        profile: { ...def.profile, ...(loaded.profile || {}) },
        pet: { ...def.pet, ...(loaded.pet || {}) },
        settings: { ...def.settings, ...(loaded.settings || {}) },
        stats: { ...def.stats, ...(loaded.stats || {}), src: { ...def.stats.src, ...(loaded.stats?.src || {}) }, spent: { ...def.stats.spent, ...(loaded.stats?.spent || {}) } },
        habits: Array.isArray(loaded.habits) ? loaded.habits : [],
        history: loaded.history || {},
        garden: Array.isArray(loaded.garden) ? loaded.garden : [],
        gardenLog: loaded.gardenLog || {},
        achievements: Array.isArray(loaded.achievements) ? loaded.achievements : [],
        achLog: loaded.achLog || {},
        deviceId: loaded.deviceId || newDeviceId(),
        tab: 'today',
      };
      const rolled = produce(migrated, (d) => {
        A.rollover(d);
        A.checkAch(d);
      });
      persistence.save(rolled);
      set({ state: rolled, hydrated: true });
      Notif.syncHabitReminders(rolled.habits, rolled.settings);
      // If a freeze covered yesterday, let the user know this morning.
      if (rolled.frozeYesterday) {
        get().showToast('A Streak Freeze saved your streak. Keep it going today!');
      }
      // Egg reached the hatch gate while away: reveal the Nursery on open.
      if (rolled.pet.hatchState !== 'hatched' && rolled.pet.hatchProgress >= 3) {
        setTimeout(() => get().openOverlay('nursery'), 500);
      }
    },

    showToast: (text, coin) => set({ toast: { id: toastSeq++, text, coin } }),

    openOverlay: (name, param) =>
      set((store) => {
        const existing = store.overlays.findIndex((o) => o.name === name);
        if (existing >= 0) {
          const trimmed = store.overlays.slice(0, existing + 1);
          trimmed[existing] = { name, param };
          return { overlays: trimmed };
        }
        return { overlays: [...store.overlays, { name, param }] };
      }),
    closeOverlay: () => set((store) => ({ overlays: store.overlays.slice(0, -1) })),
    closeAllOverlays: () => set({ overlays: [] }),

    showReward: (data) =>
      set((store) => (store.reward ? { rewardQueue: [...store.rewardQueue, data] } : { reward: data })),
    closeReward: () =>
      set((store) => {
        if (store.rewardQueue.length) {
          const [next, ...rest] = store.rewardQueue;
          return { reward: next, rewardQueue: rest };
        }
        return { reward: null };
      }),

    mutate,

    finishOnboarding: (species, habits) => {
      const s = blankState();
      s.pet.species = species;
      let id = 1;
      habits.forEach((h) => {
        s.habits.push(
          newHabit({
            id: id++,
            name: h.name,
            cat: h.cat,
            sched: h.sched,
            days: h.days || [1, 2, 3, 4, 5],
            perWeek: h.perWeek || 3,
            remind: h.remind || '',
            created: s.day,
          }),
        );
      });
      s.nextId = id;
      s.deviceId = newDeviceId();
      set({ state: s, overlays: [], reward: null, rewardQueue: [] });
      persistence.save(s);
      Notif.syncHabitReminders(s.habits, s.settings);
    },

    resetData: async () => {
      await persistence.wipe();
      set({ state: null, overlays: [], toast: null, reward: null, rewardQueue: [] });
    },

    // Dev helper: load the mid-journey demo seed (used from the splash dev tap in the proto).
    seedDemo: () => {
      const s = freshState(true);
      s.deviceId = newDeviceId();
      set({ state: s, overlays: [], reward: null, rewardQueue: [] });
      persistence.save(s);
      Notif.syncHabitReminders(s.habits, s.settings);
    },

    setTab: (tab) => set((store) => (store.state ? { state: { ...store.state, tab } } : store)),

    toggleHabit: (id) => {
      const res = mutate((d) => A.toggleHabit(d, id));
      if (!res || !res.ok) return;
      if (res.unchecked) {
        get().showToast(res.refunded ? `Unchecked. ${res.refunded} coins returned.` : 'Unchecked.');
        return;
      }
      const st0 = get().state!;
      const h = st0.habits.find((x) => x.id === id);
      get().showToast(`+${res.total} coins for ${h ? h.name : 'your habit'}`, true);
      // The all-clear check plays a beat after the coin fly, like the prototype.
      setTimeout(() => get().checkDayComplete(), 620);
    },

    // Evaluate the day's all-clear: award the bonus, advance streak/hatch, and surface the
    // reward popup or the Nursery. Shared by check-off and the goal sheet.
    checkDayComplete: () => {
      const ac = mutate((d) => A.maybeAllClear(d));
      if (!ac) return;
      const st = get().state!;
      if (ac.hatched) {
        get().openOverlay('nursery');
        Notif.notifyHatchReady();
      } else if (ac.cleared) {
        const np = nextPlot(st);
        const remain = 3 - st.pet.hatchProgress;
        get().showReward({
          title: 'Day complete',
          sub: `Everything due today is done. Streak is now ${ac.streak} days.`,
          glyph: { type: 'icon', name: 'trophy' },
          coins: ac.bonus,
          right: { v: String(ac.streak), l: 'Day streak' },
          note:
            st.pet.hatchState === 'hatched'
              ? `${st.pet.name || 'Your companion'} is fed and your streak is safe.`
              : `The egg is warmer. ${remain} more all-clear ${remain === 1 ? 'day' : 'days'} to go.`,
          goal: np
            ? `${st.profile.coins.toLocaleString('en-US')} of ${np.cost.toLocaleString('en-US')} coins toward ${np.name}`
            : 'Your garden is fully grown',
        });
      }
    },

    addHabit: (h) => {
      const s = get().state;
      if (!s) return 0;
      const id = s.nextId;
      mutate((d) => {
        d.habits.push(
          newHabit({
            id,
            name: h.name,
            cat: h.cat,
            sched: h.sched,
            days: h.days || [1, 2, 3, 4, 5],
            perWeek: h.perWeek || 3,
            remind: h.remind || '',
            created: d.day,
          }),
        );
        d.nextId += 1;
      });
      syncReminders();
      return id;
    },
    updateHabit: (id, patch) => {
      mutate((d) => {
        const h = d.habits.find((x) => x.id === id);
        if (h) Object.assign(h, patch);
      });
      syncReminders();
    },
    deleteHabit: (id) => {
      mutate((d) => { d.habits = d.habits.filter((x) => x.id !== id); });
      syncReminders();
    },
    archiveHabit: (id, archived) => {
      mutate((d) => { const h = d.habits.find((x) => x.id === id); if (h) h.archived = archived; });
      syncReminders();
    },
    // Reorder within the active (id-sorted) list by swapping the two habits' ids
    // (ids drive ordering everywhere), matching the prototype moveHabit.
    moveHabit: (id, dir) => {
      mutate((d) => {
        const live = d.habits.filter((h) => !h.archived).sort((a, b) => a.id - b.id);
        const i = live.findIndex((h) => h.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= live.length) return;
        const tmp = live[i].id;
        live[i].id = live[j].id;
        live[j].id = tmp;
      });
    },
    setGoal: (n) => mutate((d) => { d.profile.dailyGoal = n; }),

    feed: (foodId) => {
      const r = mutate((d) => A.feed(d, foodId));
      if (!r) return;
      if (!r.ok) { get().showToast(r.reason === 'none' ? 'You have none of that treat' : 'Cannot feed that'); return; }
      const name = get().state!.pet.name || 'Your companion';
      get().showToast(`${name} enjoyed the ${r.food!.name.toLowerCase()} (+${r.gained})`);
    },
    equip: (clothesId) => mutate((d) => A.equip(d, clothesId)),
    buyFood: (id) => {
      const r = mutate((d) => A.buyFood(d, id));
      if (!r) return;
      if (!r.ok) { get().showToast(r.reason === 'premium' ? 'That treat is a Premium item' : 'Not enough coins yet'); return; }
      get().showToast(`Bought ${r.food!.name}`, true);
    },
    buyClothes: (id) => {
      const r = mutate((d) => A.buyClothes(d, id));
      if (!r) return;
      if (!r.ok) { get().showToast(r.reason === 'premium' ? 'That outfit is a Premium item' : 'Not enough coins yet'); return; }
      get().showToast(r.equipped ? `${r.name} on!` : `Bought ${r.name}. Wear it from the wardrobe.`, !r.equipped);
    },
    buyPet: (id) => {
      const r = mutate((d) => A.buyPet(d, id));
      if (!r) return;
      if (!r.ok) { get().showToast(r.reason === 'premium' ? 'That companion is Premium' : 'Not enough coins yet'); return; }
      get().showToast(r.equipped ? `Say hello to your ${r.name}!` : `Welcome, a new ${r.name}!`, !r.equipped);
    },
    plantPlot: (id) => {
      const r = mutate((d) => A.plantPlot(d, id));
      if (!r) return;
      if (!r.ok) { get().showToast(r.reason === 'poor' ? 'Keep your habits to afford this' : 'Plant the earlier plots first'); return; }
      get().showToast(`Planted ${r.plot!.name}`, false);
    },
    collectIdle: () => {
      const r = mutate((d) => A.collectIdle(d));
      if (!r || !r.ok) { get().showToast('The jar is still empty. Check back later.'); return; }
      const name = get().state!.pet.name || 'Your companion';
      get().showToast(`${name} foraged ${r.amt} coins`, true);
    },
    commitHatch: (name) => {
      mutate((d) => {
        A.commitHatch(d);
        if (name && name.trim()) d.pet.name = name.trim();
      });
      get().closeOverlay();
    },

    setName: (name) => { mutate((d) => { d.profile.name = name; }); get().showToast('Name updated'); },
    setTheme: (id) => mutate((d) => { d.profile.theme = id; }),
    setPremium: (on) => mutate((d) => { d.profile.premium = on; }),
    toggleSetting: (k) => {
      mutate((d) => { d.settings[k] = !d.settings[k]; });
      if (k === 'notif') syncReminders();
    },
  };
});

// dev-only: expose the store for automated verification driving
if (typeof __DEV__ !== 'undefined' && __DEV__ && typeof window !== 'undefined') {
  (window as any).__store = useStore;
}
