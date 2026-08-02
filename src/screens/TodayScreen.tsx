import React from 'react';
import { View, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useC } from '../theme/ThemeContext';
import { NAV_H, radius, shadowSm, shadowCard } from '../theme/tokens';
import { Txt, Card, CoinPill, Bounded } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { DayRing } from '../components/Ring';
import { RoomStage } from '../components/RoomStage';
import { HabitRow } from '../components/HabitRow';
import { useStore } from '../store/store';
import {
  dueList, doneCount, dayGoal, moodOf, bonusPct, petStage, stageName, nextPlot, gardenPct, coinsForCheck,
} from '../domain/mechanics';
import { today, weekStart, dstrOff, dow } from '../domain/dates';
import { GARDEN, WD, WD1 } from '../domain/catalogs';
import { CategoryId } from '../domain/types';
import { HabitInput } from '../store/store';

const STARTER: Record<string, { name: string; input: HabitInput }> = {
  water: { name: 'Drink 8 glasses of water', input: { name: 'Drink 8 glasses of water', cat: 'water', sched: 'daily', remind: '09:00' } },
  read: { name: 'Read before bed', input: { name: 'Read before bed', cat: 'read', sched: 'daily', remind: '21:30' } },
  exercise: { name: 'Move for 20 minutes', input: { name: 'Move for 20 minutes', cat: 'exercise', sched: 'weekdays', days: [1, 2, 3, 4, 5], remind: '17:30' } },
  meditate: { name: 'Five quiet minutes', input: { name: 'Five quiet minutes', cat: 'meditate', sched: 'daily', remind: '08:00' } },
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Winding down';
}

function completionPct(history: Record<string, any>, days: number): number {
  const keys = Object.keys(history).sort().slice(-days);
  let due = 0;
  let done = 0;
  keys.forEach((k) => { due += history[k].due || 0; done += history[k].done || 0; });
  return due ? Math.round((done / due) * 100) : 0;
}

export function TodayScreen() {
  const c = useC();
  const insets = useSafeAreaInsets();
  const st = useStore((s) => s.state!);
  const setTab = useStore((s) => s.setTab);
  const toggleHabit = useStore((s) => s.toggleHabit);
  const openOverlay = useStore((s) => s.openOverlay);
  const addHabit = useStore((s) => s.addHabit);
  const showToast = useStore((s) => s.showToast);

  const d = today();
  const P = st.profile;
  const due = dueList(st, d);
  const done = due.filter((h) => h.logs[d] === 'done');
  const pending = due.filter((h) => h.logs[d] !== 'done');
  const goal = Math.max(1, dayGoal(st, d));
  const noHabits = st.habits.filter((h) => !h.archived).length === 0;
  const hatched = st.pet.hatchState === 'hatched';
  const nx = nextPlot(st);
  const dc = doneCount(st, d);

  const quickStart = (cat: string) => {
    const s = STARTER[cat];
    if (!s) return;
    addHabit(s.input);
    showToast(`"${s.name}" added`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.cream }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom + 20 }}>
      <Bounded>
        {/* top bar */}
        <View style={[styles.topbar, { paddingTop: Math.max(20, insets.top + 12) }]}>
          <Pressable onPress={() => openOverlay('profile')} style={styles.avwrap}>
            <View style={styles.avin}>
              {hatched ? <Art name={st.pet.species === 'dog' || st.pet.species === 'cat' ? 'eggWhole' : st.pet.species} height={54} /> : <Art name="eggWhole" height={50} />}
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Txt weight={600} size={12} color={c.muted}>{greeting()}</Txt>
            <Txt weight={800} size={20} color={c.tealInk}>Hi, {P.name}</Txt>
          </View>
          <View style={[styles.flamepill]}>
            <Art name="flame" height={19} />
            <Txt weight={800} size={12.5} color={c.orange2}>{P.streak}</Txt>
          </View>
          <CoinPill amount={P.coins} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
          {/* room */}
          <View style={{ borderRadius: 22, overflow: 'hidden', ...shadowCard(c) }}>
            <RoomStage height={238} onPress={() => setTab('pet')} />
          </View>

          {/* care card / egg banner (overlaps room by -26) */}
          {hatched ? <CareCard /> : <EggBanner />}

          {!noHabits && (
            <>
              {/* day hero */}
              <Card style={{ marginTop: 14 }}>
                <View style={styles.dayring}>
                  <View>
                    {due.length ? (
                      <DayRing size={88} done={dc} goal={goal}>
                        <Txt weight={800} size={21} color={c.tealInk}>{dc}</Txt>
                        <Txt weight={700} size={10} color={c.muted} style={{ marginTop: 3 }}>of {goal}</Txt>
                      </DayRing>
                    ) : (
                      <View style={[styles.restring, { backgroundColor: c.cream, borderColor: c.line2 }]}>
                        <Icon name="moon" size={30} color={c.line2} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt weight={800} size={15} color={c.tealInk}>{due.length ? "Today's habits" : 'A day off'}</Txt>
                    <Txt weight={600} size={12.5} color={c.muted} style={{ marginTop: 2, lineHeight: 18 }}>{daySub(st, pending, due)}</Txt>
                    <View style={styles.daychips}>
                      <Chip left={<Art name="flame" height={13} />} label={`${P.streak} day streak`} />
                      {P.freezes > 0 && <Chip left={<Icon name="snow" size={12} color={c.orange} />} label={`${P.freezes} freeze${P.freezes > 1 ? 's' : ''}`} />}
                      <Pressable onPress={() => openOverlay('goal')}><Chip left={<Icon name="target" size={12} color={c.orange} />} label={`Goal: ${P.dailyGoal > 0 ? `${P.dailyGoal} / day` : 'all due'}`} /></Pressable>
                    </View>
                  </View>
                </View>
              </Card>

              {/* garden strip */}
              <GardenStrip onPress={() => setTab('garden')} nx={nx} pct={gardenPct(st)} />
            </>
          )}

          {/* Due today */}
          {due.length > 0 && (
            <View style={styles.shead}>
              <Txt weight={700} size={16} color={c.tealInk}>Due today</Txt>
              <Txt weight={700} size={12.5} color={c.muted}>{done.length}/{due.length}</Txt>
            </View>
          )}

          {pending.length > 0 ? (
            pending.map((h, i) => <HabitRow key={h.id} habit={h} date={d} first={i === 0} onToggle={() => toggleHabit(h.id)} onPress={() => openOverlay('editor', { id: h.id })} />)
          ) : due.length > 0 ? (
            <AllClearCard hatched={hatched} petName={st.pet.name} />
          ) : (
            <EmptyToday noHabits={noHabits} onQuick={quickStart} onEditor={() => openOverlay('editor')} />
          )}

          {/* Done today */}
          {done.length > 0 && (
            <>
              <View style={styles.shead}>
                <Txt weight={700} size={16} color={c.tealInk}>Done today</Txt>
                <Txt weight={700} size={12.5} color={c.muted}>+{done.reduce((a, x) => a + coinsForCheck(st, x).core, 0)} earned</Txt>
              </View>
              {done.map((h) => <HabitRow key={h.id} habit={h} date={d} onToggle={() => toggleHabit(h.id)} onPress={() => openOverlay('editor', { id: h.id })} />)}
            </>
          )}

          {/* This week */}
          {!noHabits && (
            <>
              <View style={styles.shead}>
                <Txt weight={700} size={16} color={c.tealInk}>This week</Txt>
                <Pressable onPress={() => openOverlay('insights')}><Txt weight={700} size={12.5} color={c.orange}>Insights</Txt></Pressable>
              </View>
              <WeekCard onPress={() => openOverlay('insights')} />
              <View style={styles.tiles}>
                <Tile ic="chart" v={`${completionPct(st.history, 28)}%`} l="28d rate" onPress={() => openOverlay('insights', { tab: 'overview' })} />
                <Tile ic="flame" v={`${P.best}`} l="Best streak" onPress={() => openOverlay('insights', { tab: 'streaks' })} />
                <Tile ic="trophy" v={`${st.achievements.length}`} l="Badges" onPress={() => openOverlay('achievements')} />
              </View>
              <Pressable style={[styles.jstrip, { borderColor: c.line, backgroundColor: '#fff', marginTop: 12, ...shadowSm(c) }]} onPress={() => openOverlay('insights', { tab: 'overview' })}>
                <View style={[styles.jstripIc, { backgroundColor: c.tint2 }]}><Icon name="bars" size={18} color={c.teal} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt weight={700} size={13.5} color={c.tealInk}>Your dashboard</Txt>
                  <Txt weight={500} size={11} color={c.muted} style={{ marginTop: 1 }}>30 metrics across consistency, habits, streaks, coins and care</Txt>
                </View>
                <Icon name="chevR" size={15} color={c.line2} />
              </Pressable>
            </>
          )}
        </View>
      </Bounded>
    </ScrollView>
  );
}

// ------- pieces -------
function Chip({ label, left }: { label: string; left?: React.ReactNode }) {
  const c = useC();
  return (
    <View style={[styles.gchip, { backgroundColor: c.cream, borderColor: c.line2 }]}>
      {left}
      <Txt weight={700} size={11} color={c.teal}>{label}</Txt>
    </View>
  );
}

function daySub(st: any, pending: any[], due: any[]): string {
  if (pending.length === 0) return due.length ? 'All clear for today.' : restLine(st);
  return `${pending.length} still to go${pending.length <= 2 ? ', nearly there.' : '.'}`;
}
function restLine(st: any): string {
  // find next due day within 7 days
  const t = today();
  for (let i = 1; i <= 7; i++) {
    const k = dstrOff(i, undefined);
    const has = st.habits.some((h: any) => !h.archived && (h.sched === 'daily' || (h.sched === 'weekdays' && (h.days || []).includes(dow(k))) || h.sched === 'weekly'));
    if (has) return `Nothing scheduled. Back at it ${i === 1 ? 'tomorrow' : WD[dow(k)]}.`;
  }
  return 'Nothing scheduled today.';
}

function CareCard() {
  const c = useC();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const bp = bonusPct(st);
  const low = st.pet.health < 40;
  return (
    <View style={[styles.overlapCard, { backgroundColor: '#fff', ...shadowCard(c) }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Txt weight={800} size={15} color={c.tealInk}>{st.pet.name || 'Your companion'}</Txt>
        {bp > 0 ? (
          <View style={[styles.bonuspill]}><Icon name="bolt" size={14} color={c.orange} /><Txt weight={800} size={12} color={c.orange2}>+{bp}% coins</Txt></View>
        ) : (
          <Txt size={12} weight={600} color={c.muted}>Feed to earn a bonus</Txt>
        )}
      </View>
      <View style={styles.health}>
        <Icon name="heart" size={16} color="#E5654B" />
        <View style={styles.hbar}><View style={[styles.hfill, { width: `${st.pet.health}%`, backgroundColor: low ? '#E5654B' : c.yellow2 }]} /></View>
        <Txt weight={800} size={13} color={c.tealInk} style={{ minWidth: 52, textAlign: 'right' }}>{st.pet.health}/100</Txt>
      </View>
      <View style={styles.carerow}>
        <CareBtn img="apple" label="Feed" onPress={() => openOverlay('feed')} />
        <CareBtn img="wardrobe" label="Dress" onPress={() => openOverlay('shop', { tab: 'clothes' })} />
        <CareBtn img="shop" label="Shop" onPress={() => openOverlay('shop', { tab: 'food' })} />
      </View>
    </View>
  );
}
function CareBtn({ img: imgKey, label, onPress }: { img: string; label: string; onPress: () => void }) {
  const c = useC();
  const { img } = require('../assets/registry');
  return (
    <Pressable style={({ pressed }) => [styles.carebtn, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c) }, pressed && { transform: [{ scale: 0.97 }] }]} onPress={onPress}>
      <Image source={img[imgKey]} style={{ width: 34, height: 34, resizeMode: 'contain' }} />
      <Txt weight={700} size={11.5} color={c.tealInk}>{label}</Txt>
    </Pressable>
  );
}

function EggBanner() {
  const c = useC();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const showToast = useStore((s) => s.showToast);
  const p = st.pet.hatchProgress;
  const ready = p >= 3;
  return (
    <Pressable
      style={styles.eggbanner}
      onPress={() => (ready ? openOverlay('nursery') : showToast(`Finish every habit due today. ${3 - p} more all-clear ${3 - p === 1 ? 'day' : 'days'} to hatch.`))}
    >
      <View style={styles.ebIc}><Art name={ready ? 'eggCrack' : 'eggWhole'} height={38} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight={800} size={14.5} color="#fff">{ready ? 'Your egg is ready to hatch!' : `Egg warming · ${p} of 3 days`}</Txt>
        <Txt weight={600} size={11.5} color="#BFE3F3" style={{ marginTop: 3 }}>{ready ? 'Tap to meet your companion.' : 'Finish every habit due today to warm it another stage.'}</Txt>
        <View style={styles.eggsegs}>
          {[0, 1, 2].map((i) => <View key={i} style={[styles.eggseg, { backgroundColor: i < p ? c.yellow : 'rgba(255,255,255,0.2)' }]} />)}
        </View>
      </View>
      <Icon name="chevR" size={16} color="#BFE3F3" />
    </Pressable>
  );
}

function GardenStrip({ onPress, nx, pct }: { onPress: () => void; nx: any; pct: number }) {
  const c = useC();
  return (
    <Pressable style={[styles.jstrip, { borderColor: c.line, backgroundColor: '#fff', ...shadowSm(c) }]} onPress={onPress}>
      <View style={[styles.jstripIc, { backgroundColor: '#EDF3E4' }]}><Icon name={(nx ? nx.ic || 'sprout' : 'crown') as any} size={18} color="#6E8C31" /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight={700} size={13.5} color={c.tealInk} numberOfLines={1}>{nx ? `Growing next: ${nx.name}` : 'Your garden is fully grown'}</Txt>
        <View style={[styles.jprogbar, { backgroundColor: '#EFE7D6', marginTop: 7 }]}><View style={[styles.jprogfill, { width: `${pct}%`, backgroundColor: c.grass }]} /></View>
      </View>
      <Icon name="chevR" size={15} color={c.line2} />
    </Pressable>
  );
}

function AllClearCard({ hatched, petName }: { hatched: boolean; petName: string }) {
  const c = useC();
  return (
    <Card style={{ padding: 22, alignItems: 'center' }}>
      <Icon name="checkCircle" size={32} color={c.good} />
      <Txt weight={800} size={15} color={c.tealInk} style={{ marginTop: 8 }}>Everything's done</Txt>
      <Txt size={13} color={c.muted} style={{ marginTop: 3, textAlign: 'center', lineHeight: 20 }}>{hatched ? `${petName || 'Your companion'} is fed and your streak is safe.` : 'The egg moved up a stage.'}</Txt>
    </Card>
  );
}

function EmptyToday({ noHabits, onQuick, onEditor }: { noHabits: boolean; onQuick: (c: string) => void; onEditor: () => void }) {
  const c = useC();
  if (!noHabits) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 }}>
        <Icon name="moon" size={40} color={c.line2} />
        <Txt weight={700} size={15} color={c.tealInk} style={{ marginTop: 8 }}>Enjoy the day off</Txt>
        <Txt size={13} color={c.muted} style={{ marginTop: 4, textAlign: 'center', lineHeight: 20 }}>Rest counts too. Your streak is safe on days with nothing scheduled.</Txt>
      </View>
    );
  }
  const picks: CategoryId[] = ['water', 'read', 'exercise', 'meditate'];
  return (
    <Card style={{ marginTop: 14, padding: 22, alignItems: 'center' }}>
      <Icon name="sprout" size={36} color={c.line2} />
      <Txt weight={800} size={16} color={c.tealInk} style={{ marginTop: 8 }}>Add your first habit</Txt>
      <Txt size={13} color={c.muted} style={{ marginTop: 4, textAlign: 'center', lineHeight: 20 }}>One is enough to start. Every check-off warms the egg and pays out coins.</Txt>
      <View style={styles.starterchips}>
        {picks.map((cat) => (
          <Pressable key={cat} style={[styles.starterchip, { backgroundColor: c.cream, borderColor: c.line2 }]} onPress={() => onQuick(cat)}>
            <Art name={cat} size={26} />
            <Txt weight={700} size={12} color={c.tealInk} style={{ flexShrink: 1 }}>{STARTER[cat]?.name}</Txt>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onEditor} style={[styles.smBtn, { backgroundColor: c.orange }]}><Icon name="plus" size={15} color="#fff" /><Txt weight={700} size={13} color="#fff">Something else</Txt></Pressable>
    </Card>
  );
}

function WeekCard({ onPress }: { onPress: () => void }) {
  const c = useC();
  const st = useStore((s) => s.state!);
  const ws = weekStart(today());
  let total = 0;
  const cells = Array.from({ length: 7 }).map((_, i) => {
    const k = dstrOff(i, ws);
    const r = st.history[k] || { due: 0, done: 0, ac: 0 };
    const future = k > today();
    const pct = r.due ? Math.round((r.done / r.due) * 100) : 0;
    total += r.done || 0;
    return { k, pct, future, ac: r.ac, due: r.due, today: k === today() };
  });
  const allClear = cells.filter((x) => x.ac).length;
  return (
    <Card onPress={onPress} style={{ padding: 15 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Txt weight={700} size={12} color={c.muted}>Habits kept this week</Txt>
          <Txt weight={800} size={22} color={c.tealInk} style={{ marginTop: 2 }}>{total}</Txt>
        </View>
        <View style={styles.wktag}><Art name="flame" height={13} /><Txt weight={700} size={11} color={c.muted}>{allClear} all-clear {allClear === 1 ? 'day' : 'days'}</Txt></View>
      </View>
      <View style={styles.wkbars}>
        {cells.map((cell, i) => {
          const h = cell.future ? 4 : Math.max(10, cell.pct);
          const miss = !cell.future && cell.pct === 0;
          const bg = cell.future ? '#EFE7D6' : miss ? '#F0C7BC' : cell.ac ? '#8FB94E' : c.teal;
          return (
            <View key={i} style={styles.wkcol}>
              <View style={{ width: '100%', maxWidth: 26, height: `${h}%`, backgroundColor: bg, borderRadius: miss || cell.future ? 2 : 5, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
              <Txt weight={700} size={9.5} color={cell.today ? c.orange : '#BFB7A5'} style={{ position: 'absolute', bottom: -19 }}>{WD1[(i + 1) % 7]}</Txt>
            </View>
          );
        })}
      </View>
      <Txt weight={600} size={11.5} color={c.muted} style={{ lineHeight: 17 }}>{weekBlurb(cells)}</Txt>
    </Card>
  );
}
function weekBlurb(cells: any[]): string {
  const past = cells.filter((x) => !x.future && x.due > 0);
  if (!past.length) return 'A fresh week. Tap for the full breakdown.';
  const best = past.reduce((a, b) => (b.pct > a.pct ? b : a), past[0]);
  const avg = Math.round(past.reduce((a, b) => a + b.pct, 0) / past.length);
  return `${WD[dow(best.k)]} was your strongest day. You're averaging ${avg}% of what's due. Tap for the full breakdown.`;
}

function Tile({ ic, v, l, onPress }: { ic: any; v: string; l: string; onPress: () => void }) {
  const c = useC();
  return (
    <Pressable style={[styles.tile, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c) }]} onPress={onPress}>
      <View style={{ marginBottom: 5 }}><Icon name={ic} size={20} color={c.teal} /></View>
      <Txt weight={800} size={20} color={c.tealInk}>{v}</Txt>
      <Txt weight={700} size={10.5} color={c.muted} style={{ marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{l}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  avwrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9', alignItems: 'center', justifyContent: 'flex-end' },
  avin: { height: '122%', alignItems: 'center', justifyContent: 'flex-end' },
  flamepill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF4E7', borderWidth: 1, borderColor: '#F6DFC4', paddingVertical: 5, paddingLeft: 6, paddingRight: 11, borderRadius: radius.pill },
  overlapCard: { marginTop: -26, borderRadius: radius.lg, padding: 14, paddingHorizontal: 16, zIndex: 6, borderWidth: 1, borderColor: '#EFE6D6' },
  bonuspill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF4E7', borderWidth: 1, borderColor: '#F6DFC4', paddingVertical: 5, paddingLeft: 9, paddingRight: 11, borderRadius: radius.pill },
  health: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  hbar: { flex: 1, height: 13, borderRadius: 9, backgroundColor: '#EFE7D6', overflow: 'hidden' },
  hfill: { height: '100%', borderRadius: 9 },
  carerow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  carebtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8, borderRadius: radius.md, borderWidth: 1 },
  eggbanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0C4C60', borderRadius: radius.lg, padding: 14, paddingHorizontal: 15, marginTop: -26, zIndex: 6 },
  ebIc: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  eggsegs: { flexDirection: 'row', gap: 5, marginTop: 8 },
  eggseg: { flex: 1, height: 7, borderRadius: 9 },
  dayring: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, paddingHorizontal: 16 },
  restring: { width: 88, height: 88, borderRadius: 44, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  daychips: { flexDirection: 'row', gap: 7, marginTop: 9, flexWrap: 'wrap' },
  gchip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1 },
  jstrip: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, padding: 13, paddingHorizontal: 14, borderWidth: 1, marginTop: 14 },
  jstripIc: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  jprogbar: { height: 8, borderRadius: 9, overflow: 'hidden' },
  jprogfill: { height: '100%', borderRadius: 9 },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  starterchips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 12 },
  starterchip: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 10, borderRadius: radius.sm, borderWidth: 1.5 },
  smBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E28A4B', paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.sm, marginTop: 4 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 12 },
  tile: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1 },
  wktag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FBF6EC', borderWidth: 1, borderColor: '#E4D8C2', paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill },
  wkbars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 112, marginTop: 16, marginBottom: 6, paddingBottom: 20 },
  wkcol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
});
