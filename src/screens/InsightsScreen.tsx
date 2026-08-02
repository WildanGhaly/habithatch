import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { OverlayScreen } from '../components/OverlayScreen';
import { useC } from '../theme/ThemeContext';
import { NAV_H, radius, shadowSm } from '../theme/tokens';
import { Txt, Card, Btn } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { Art } from '../components/Art';
import { useStore } from '../store/store';
import {
  streakRuns, levelInfo, moodOf, petStage, stageName, gardenPct, nextPlot, decayPerDay,
  idleRate, bonusPct, allClearBonus, coinsForCheck, perks, isDue, schedLabel,
} from '../domain/mechanics';
import { today, dstrOff, weekStart, dow, prettyDate, daysBetween } from '../domain/dates';
import { GARDEN, ACHIEVEMENTS, SPECIES, STAGES, STAGE_GATE, WD1, spec } from '../domain/catalogs';
import { AppState, Habit } from '../domain/types';

const money = (n: number) => Math.round(n).toLocaleString('en-US');
type Tab = 'overview' | 'habits' | 'streaks' | 'economy' | 'companion';
const TABS: [Tab, string, IconName][] = [
  ['overview', 'Overview', 'chart'], ['habits', 'Habits', 'note'], ['streaks', 'Streaks', 'flame'], ['economy', 'Coins', 'bag'], ['companion', 'Companion', 'heart'],
];
const RANGES: [number, string, boolean][] = [[7, '7 days', false], [28, '4 weeks', false], [84, '12 weeks', true], [0, 'All time', true]];

function trackedDays(st: AppState) { return Object.values(st.history).filter((r) => r.due > 0).length; }

function agg(st: AppState, range: number) {
  const t = today();
  let due = 0, done = 0, ac = 0, active = 0, coins = 0;
  const keys = Object.keys(st.history).sort();
  keys.forEach((k) => {
    if (k > t) return;
    if (range > 0 && daysBetween(k, t) >= range) return;
    const r = st.history[k];
    due += r.due || 0; done += r.done || 0; coins += r.coins || 0;
    if (r.due > 0) { active++; if (r.ac) ac++; }
  });
  return { due, done, ac, active, coins, rate: due ? Math.round((done / due) * 100) : 0, acRate: active ? Math.round((ac / active) * 100) : 0 };
}

function habitRate(st: AppState, h: Habit, range: number) {
  const t = today();
  let due = 0, done = 0;
  const keys = Object.keys(st.history).sort();
  keys.forEach((k) => {
    if (k > t || (range > 0 && daysBetween(k, t) >= range)) return;
    if (!isDue(h, k) && h.logs[k] !== 'done') return;
    if (isDue(h, k)) due++;
    if (h.logs[k] === 'done') done++;
  });
  return { pct: due ? Math.round((done / due) * 100) : 0, done, due };
}

export function InsightsScreen({ param }: { param?: { tab?: Tab } }) {
  const c = useC();
  const insets = useSafeAreaInsets();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const [tab, setTab] = useState<Tab>(param?.tab || 'overview');
  const [range, setRange] = useState(28);

  const rangeLabel = RANGES.find((r) => r[0] === range)?.[1] || '4 weeks';

  const subtabs = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
      {TABS.map(([key, label, ic]) => {
        const on = tab === key;
        return (
          <Pressable key={key} style={[styles.subtab, { backgroundColor: on ? c.teal : '#fff', borderColor: on ? c.teal : c.line2 }]} onPress={() => setTab(key)}>
            <Icon name={ic} size={13} color={on ? '#fff' : c.muted} />
            <Txt weight={700} size={12} color={on ? '#fff' : c.muted}>{label}</Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <OverlayScreen title="Insights" belowHeader={subtabs}>
      {/* range bar */}
      <View style={styles.rangebar}>
        {RANGES.map(([r, label, prem]) => {
          const on = range === r;
          const locked = prem && !st.profile.premium;
          return (
            <Pressable key={r} style={[styles.rangebtn, { backgroundColor: on ? c.tint : '#fff', borderColor: on ? c.orange : c.line2 }]} onPress={() => (locked ? openOverlay('premium') : setRange(r))}>
              <Txt weight={700} size={11.5} color={on ? c.orange2 : c.muted}>{label}</Txt>
              {locked && <Icon name="lock" size={9} color={c.muted} />}
            </Pressable>
          );
        })}
      </View>

      {tab === 'overview' && <Overview st={st} range={range} rangeLabel={rangeLabel} />}
      {tab === 'habits' && <Habits st={st} range={range} rangeLabel={rangeLabel} />}
      {tab === 'streaks' && <Streaks st={st} />}
      {tab === 'economy' && <Economy st={st} />}
      {tab === 'companion' && <Companion st={st} rangeLabel={rangeLabel} openAch={() => openOverlay('achievements')} />}
    </OverlayScreen>
  );
}

// ---------- shared primitives ----------
function StatCard({ ic, label, value, unit, sub }: { ic: IconName; label: string; value: string | number; unit?: string; sub?: string }) {
  const c = useC();
  return (
    <View style={[styles.scard, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c) }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={ic} size={15} color={c.teal} />
        <Txt weight={700} size={11} color={c.muted}>{label}</Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
        <Txt weight={800} size={22} color={c.tealInk}>{value}</Txt>
        {unit && <Txt weight={700} size={12} color={c.muted}>{unit}</Txt>}
      </View>
      {sub && <Txt weight={600} size={10.5} color={c.muted} style={{ marginTop: 2, lineHeight: 14 }}>{sub}</Txt>}
    </View>
  );
}
function Panel({ ic, title, right, sub, children, locked, lockTitle, lockSub, onUnlock }: { ic: IconName; title: string; right?: React.ReactNode; sub?: string; children: React.ReactNode; locked?: boolean; lockTitle?: string; lockSub?: string; onUnlock?: () => void }) {
  const c = useC();
  return (
    <Card style={{ padding: 15, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Icon name={ic} size={16} color={c.teal} />
        <Txt weight={700} size={14.5} color={c.tealInk} style={{ flex: 1 }}>{title}</Txt>
        {right}
      </View>
      {sub && <Txt weight={600} size={11.5} color={c.muted} style={{ marginTop: 3, lineHeight: 16 }}>{sub}</Txt>}
      <View style={{ marginTop: 12 }}>
        {locked ? (
          <Pressable onPress={onUnlock} style={{ alignItems: 'center', paddingVertical: 20, backgroundColor: c.cream, borderRadius: radius.md }}>
            <Icon name="lock" size={26} color={c.line2} />
            <Txt weight={800} size={13.5} color={c.tealInk} style={{ marginTop: 8 }}>{lockTitle}</Txt>
            <Txt weight={600} size={11.5} color={c.muted} style={{ marginTop: 3, textAlign: 'center', paddingHorizontal: 20, lineHeight: 16 }}>{lockSub}</Txt>
            <View style={[styles.plusPill, { backgroundColor: c.yellow }]}><Icon name="crown" size={11} color="#7A4B00" /><Txt weight={800} size={10.5} color="#7A4B00">HabitHatch+</Txt></View>
          </Pressable>
        ) : children}
      </View>
    </Card>
  );
}
function Hbar({ name, pct, value, tone }: { name: React.ReactNode; pct: number; value: string; tone?: 'g' | 'o' | undefined }) {
  const c = useC();
  const col = tone === 'g' ? c.grass : tone === 'o' ? c.orange : c.teal;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 4 }}>
      <View style={{ width: 96 }}>{typeof name === 'string' ? <Txt weight={700} size={11.5} color={c.tealInk}>{name}</Txt> : name}</View>
      <View style={{ flex: 1, height: 9, borderRadius: 9, backgroundColor: '#EFE7D6', overflow: 'hidden' }}><View style={{ height: '100%', width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: col, borderRadius: 9 }} /></View>
      <Txt weight={800} size={11.5} color={c.muted} style={{ width: 40, textAlign: 'right' }}>{value}</Txt>
    </View>
  );
}
function RecGrid({ items }: { items: { k: string; v: string; d: string }[] }) {
  const c = useC();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {items.map((it, i) => (
        <View key={i} style={{ width: '47%', backgroundColor: c.cream, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: c.line2 }}>
          <Txt weight={700} size={11} color={c.muted}>{it.k}</Txt>
          <Txt weight={800} size={16} color={c.tealInk} style={{ marginTop: 3 }}>{it.v}</Txt>
          <Txt weight={600} size={10.5} color={c.muted} style={{ marginTop: 2, lineHeight: 14 }}>{it.d}</Txt>
        </View>
      ))}
    </View>
  );
}
function WeekBars({ st, range }: { st: AppState; range: number }) {
  const c = useC();
  const n = range === 7 ? 7 : range === 0 ? 28 : Math.min(range, 28);
  const t = today();
  const rows = Array.from({ length: n }, (_, i) => {
    const k = dstrOff(-(n - 1 - i));
    const r = st.history[k] || { due: 0, done: 0, ac: 0 };
    const pct = r.due ? Math.round((r.done / r.due) * 100) : 0;
    return { pct, ac: !!r.ac, miss: r.due > 0 && pct === 0, k };
  });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 100 }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flex: 1, height: `${Math.max(6, r.pct)}%`, backgroundColor: r.miss ? '#F0C7BC' : r.ac ? '#8FB94E' : c.teal, borderRadius: 3, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
      ))}
    </View>
  );
}
function LineChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 300, h = 84, max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 8) - 4}`).join(' ');
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

// weekly buckets
function weekBuckets(st: AppState, n: number) {
  const t = today();
  const ws0 = weekStart(t);
  const weeks: { start: string; pct: number; coins: number }[] = [];
  for (let w = n - 1; w >= 0; w--) {
    const start = dstrOff(-7 * w, ws0);
    let due = 0, done = 0, coins = 0;
    for (let d = 0; d < 7; d++) {
      const k = dstrOff(d, start);
      if (k > t) break;
      const r = st.history[k];
      if (r) { due += r.due || 0; done += r.done || 0; coins += r.coins || 0; }
    }
    weeks.push({ start, pct: due ? Math.round((done / due) * 100) : 0, coins });
  }
  return weeks;
}

// ---------- tabs ----------
function Overview({ st, range, rangeLabel }: { st: AppState; range: number; rangeLabel: string }) {
  const c = useC();
  const a = agg(st, range);
  const score = Math.round(a.rate * 0.5 + a.acRate * 0.33 + Math.min(100, st.profile.streak * 3) * 0.17);
  const weeks = weekBuckets(st, 8);
  return (
    <>
      <View style={styles.sgrid}>
        <StatCard ic="target" label="Kept" value={a.rate} unit="%" sub={`${a.done} of ${a.due} scheduled`} />
        <StatCard ic="checkCircle" label="All-clear" value={a.ac} unit={` / ${a.active}`} sub={`${a.acRate}% of active days`} />
        <StatCard ic="flame" label="Streak" value={st.profile.streak} unit="d" sub={`Best run ${st.profile.best} days`} />
        <StatCard ic="check" label="Kept all time" value={money(Object.values(st.history).reduce((s, r) => s + (r.done || 0), 0))} sub={`Across ${trackedDays(st)} tracked days`} />
      </View>
      <Panel ic="pulse" title="Consistency score" sub="Half completion rate, a third all-clear days, the rest current streak.">
        <View style={{ alignItems: 'center' }}>
          <Txt weight={800} size={42} color={c.tealInk}>{score}</Txt>
          <Txt weight={700} size={12} color={c.muted}>{score >= 80 ? 'Rock solid' : score >= 55 ? 'Building well' : score >= 30 ? 'Finding rhythm' : 'Early days'}</Txt>
        </View>
      </Panel>
      <Panel ic="bars" title="Daily completion" right={<Chip label={rangeLabel} />} sub="Green bars are days you cleared everything that was due.">
        <WeekBars st={st} range={range} />
      </Panel>
      <Panel ic="chart" title="Weekly trend" sub="Completion rate per week, most recent on the right.">
        <LineChart data={weeks.map((w) => w.pct)} color={c.teal} />
      </Panel>
    </>
  );
}

function Habits({ st, range, rangeLabel }: { st: AppState; range: number; rangeLabel: string }) {
  const c = useC();
  const live = st.habits.filter((h) => !h.archived);
  const ranked = live.map((h) => ({ h, ...habitRate(st, h, range) })).sort((x, y) => y.pct - x.pct);
  return (
    <>
      <Panel ic="trophy" title="Habit leaderboard" right={<Chip label={rangeLabel} />} sub="Completion rate over the selected range, best first.">
        {ranked.length ? ranked.map((x, i) => (
          <View key={x.h.id} style={styles.rank}>
            <Txt weight={800} size={13} color={i === 0 ? c.orange : c.muted} style={{ width: 20 }}>{i + 1}</Txt>
            <View style={[styles.ric, { backgroundColor: c.cream, borderColor: c.line2 }]}><Art name={x.h.cat} size={22} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight={700} size={13} color={c.tealInk} numberOfLines={1}>{x.h.name}</Txt>
              <Txt weight={600} size={10.5} color={c.muted}>{x.done} of {x.due} due · {x.h.cur} day streak · best {x.h.best}</Txt>
            </View>
            <Txt weight={800} size={14} color={c.tealInk}>{x.pct}%</Txt>
          </View>
        )) : <Empty text="Add a habit to start building history." />}
      </Panel>
      <Panel ic="calendar" title="Eight week heatmap" sub="One square per day, per habit. The number is days kept.">
        {live.length ? live.map((h) => <HeatRow key={h.id} st={st} h={h} />) : <Empty text="Nothing to chart yet." />}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, justifyContent: 'center' }}>
          <Legend color={c.good} label="kept" /><Legend color="#F0C7BC" label="missed" /><Legend color={c.line2} label="not due" />
        </View>
      </Panel>
      <Panel ic="note" title="Your habit set">
        <RecGrid items={[
          { k: 'Active', v: `${live.length}`, d: `${live.filter((h) => h.remind).length} with reminders` },
          { k: 'Archived', v: `${st.habits.length - live.length}`, d: 'History kept' },
          { k: 'Daily load', v: `${live.filter((h) => isDue(h, today())).length}`, d: 'Due today' },
          { k: 'Reminders', v: `${live.filter((h) => h.remind).length}`, d: 'Timed nudges' },
        ]} />
      </Panel>
    </>
  );
}
function HeatRow({ st, h }: { st: AppState; h: Habit }) {
  const c = useC();
  let kept = 0;
  const cells = Array.from({ length: 56 }, (_, idx) => {
    const i = 55 - idx;
    const k = dstrOff(-i);
    const wasDue = isDue(h, k);
    const done = h.logs[k] === 'done';
    if (done) kept++;
    return done ? c.good : !wasDue ? c.line2 : k < today() ? '#F0C7BC' : c.line2;
  });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Txt weight={700} size={9.5} color={c.tealInk} numberOfLines={1} style={{ width: 70 }}>{h.name}</Txt>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 1.5 }}>
        {cells.map((col, i) => <View key={i} style={{ width: '11%', aspectRatio: 1, maxWidth: 6, maxHeight: 6, borderRadius: 1.5, backgroundColor: col }} />)}
      </View>
      <Txt weight={800} size={10.5} color={c.tealInk} style={{ marginLeft: 6 }}>{kept}</Txt>
    </View>
  );
}

function Streaks({ st }: { st: AppState }) {
  const c = useC();
  const runs = streakRuns(st);
  const avg = runs.length ? Math.round(runs.reduce((s, r) => s + r.len, 0) / runs.length) : 0;
  const live = st.profile.streak > 0;
  return (
    <>
      <View style={styles.sgrid}>
        <StatCard ic="flame" label="Current" value={st.profile.streak} unit="d" sub={st.profile.streak ? `Started ${prettyDate(dstrOff(-(st.profile.streak - 1)))}` : 'Not running'} />
        <StatCard ic="trophy" label="Longest" value={st.profile.best} unit="d" sub="Personal record" />
        <StatCard ic="scale" label="Average run" value={avg} unit="d" sub={`${runs.length} runs recorded`} />
        <StatCard ic="snow" label="Freezes" value={st.profile.freezes} sub={`${st.stats.freezesUsed} used so far`} />
      </View>
      <Panel ic="calendar" title="All-clear calendar" sub="Eight weeks. Green is a day you cleared everything due.">
        <Calendar st={st} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, justifyContent: 'center' }}>
          <Legend color={c.good} label="all-clear" /><Legend color="#E9B24C" label="partial" /><Legend color={c.sky} label="frozen" />
        </View>
      </Panel>
      <Panel ic="medal" title="Your longest runs" locked={!st.profile.premium} lockTitle="Streak history" lockSub="Keep the full record of every run you have built." onUnlock={() => useStore.getState().openOverlay('premium')}>
        {runs.length ? runs.slice(0, 6).map((r, i) => (
          <View key={i} style={styles.rank}>
            <Txt weight={800} size={13} color={i === 0 ? c.orange : c.muted} style={{ width: 20 }}>{i + 1}</Txt>
            <View style={{ flex: 1 }}>
              <Txt weight={700} size={13} color={c.tealInk}>{r.len} day run</Txt>
              <Txt weight={600} size={10.5} color={c.muted}>{prettyDate(r.from)} to {prettyDate(r.to)}</Txt>
            </View>
            <Txt weight={800} size={11} color={live && i === 0 ? c.orange : c.muted}>{live && i === 0 ? 'running' : i === 0 ? 'best' : ''}</Txt>
          </View>
        )) : <Empty text="Clear a full day to start your first run." />}
      </Panel>
      <Panel ic="snow" title="Streak Freeze" sub="The token that covers one missed day, spent automatically.">
        <RecGrid items={[
          { k: 'In hand', v: `${st.profile.freezes}`, d: st.garden.includes('sapling') ? 'Refills weekly' : 'Plant the Young Sapling' },
          { k: 'Used', v: `${st.stats.freezesUsed}`, d: 'Streaks saved' },
        ]} />
      </Panel>
    </>
  );
}
function Calendar({ st }: { st: AppState }) {
  const c = useC();
  const t = today();
  const ws = weekStart(dstrOff(-49));
  return (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'space-between' }}>
      {Array.from({ length: 8 }, (_, w) => (
        <View key={w} style={{ gap: 3 }}>
          {Array.from({ length: 7 }, (_, d) => {
            const k = dstrOff(w * 7 + d, ws);
            const r = st.history[k];
            const col = k > t ? c.line : !r || !r.due ? c.line2 : r.frozen ? c.sky : r.ac ? c.good : '#E9B24C';
            return <View key={d} style={{ width: 9, height: 9, borderRadius: 2.5, backgroundColor: col, borderWidth: k === t ? 1.5 : 0, borderColor: c.orange }} />;
          })}
        </View>
      ))}
    </View>
  );
}

function Economy({ st }: { st: AppState }) {
  const c = useC();
  const li = levelInfo(st);
  const spentTotal = Object.values(st.stats.spent).reduce((s, v) => s + v, 0);
  const weeks = weekBuckets(st, 8);
  const eta = nextPlot(st);
  const srcSegs = [['Check-offs', st.stats.src.check, c.teal2], ['All-clear', st.stats.src.clear, c.orange], ['Foraging', st.stats.src.idle, c.grass], ['Invites', st.stats.src.gift, c.pink]] as const;
  const srcTotal = Math.max(1, srcSegs.reduce((s, x) => s + x[1], 0));
  return (
    <>
      <View style={styles.sgrid}>
        <StatCard ic="bolt" label="Earned all time" value={money(st.profile.lifetimeCoins)} sub="From your habits" />
        <StatCard ic="bag" label="Spent all time" value={money(spentTotal)} sub={`${Math.round((spentTotal / Math.max(1, st.profile.lifetimeCoins)) * 100)}% of earnings`} />
        <StatCard ic="target" label="Balance" value={money(st.profile.coins)} sub="Ready to plant or spend" />
        <StatCard ic="sparkle" label="Level" value={li.lvl} sub={`${money(li.xp)} of ${money(li.need)} XP`} />
      </View>
      <Panel ic="chart" title="Coins earned per week"><LineChart data={weeks.map((w) => w.coins)} color={c.orange} /></Panel>
      <Panel ic="pulse" title="Where coins come from" locked={!st.profile.premium} lockTitle="Coin flow" lockSub="See which part of the loop actually pays you." onUnlock={() => useStore.getState().openOverlay('premium')}>
        <View style={{ height: 12, borderRadius: 9, overflow: 'hidden', flexDirection: 'row', marginBottom: 10 }}>
          {srcSegs.map((s, i) => <View key={i} style={{ width: `${(s[1] / srcTotal) * 100}%`, backgroundColor: s[2] }} />)}
        </View>
        {srcSegs.map((s, i) => <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: 2 }}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s[2] }} /><Txt weight={600} size={12} color={c.tealInk} style={{ flex: 1 }}>{s[0]}</Txt><Txt weight={800} size={12} color={c.muted}>{money(s[1])}</Txt></View>)}
      </Panel>
      <Panel ic="sprout" title="Garden progress" sub="The long sink for everything you earn.">
        <View style={{ height: 8, borderRadius: 9, backgroundColor: '#EFE7D6', overflow: 'hidden' }}><View style={{ height: '100%', width: `${gardenPct(st)}%`, backgroundColor: c.grass, borderRadius: 9 }} /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7, marginBottom: 12 }}>
          <Txt weight={700} size={11.5} color={c.muted}>{gardenPct(st)}% grown</Txt>
          <Txt weight={700} size={11.5} color={c.muted}>{st.garden.length} of {GARDEN.length} plots</Txt>
        </View>
        {eta ? <RecGrid items={[{ k: 'Next plot', v: eta.name, d: `${money(eta.cost)} coins` }, { k: 'Balance', v: money(st.profile.coins), d: 'toward it' }]} /> : <Callout tone="good" ic="trophy" text="Every plot is planted. The garden is complete." />}
      </Panel>
      <Panel ic="scale" title="Earning power" sub="What each part of the loop is worth to you right now.">
        <Hbar name="Per check-off" pct={(st.habits.length ? coinsForCheck(st, st.habits[0]).total : 0) * 7} value={`${st.habits.length ? coinsForCheck(st, st.habits[0]).total : 0}`} />
        <Hbar name="All-clear day" pct={allClearBonus(st) * 2} value={`${allClearBonus(st)}`} tone="o" />
        <Hbar name="Foraging / day" pct={idleRate(st) * 24 * 2} value={`${Math.round(idleRate(st) * 24)}`} tone="g" />
      </Panel>
    </>
  );
}

function Companion({ st, rangeLabel, openAch }: { st: AppState; rangeLabel: string; openAch: () => void }) {
  const c = useC();
  const stg = petStage(st);
  const bp = bonusPct(st);
  // mood breakdown over history
  const md = { happy: 0, content: 0, tired: 0, hungry: 0 } as Record<string, number>;
  Object.values(st.history).forEach((r) => { if (r.h != null) md[moodOf(r.h).k]++; });
  const mdTotal = Math.max(1, Object.values(md).reduce((s, v) => s + v, 0));
  const moodRows: [string, string, string][] = [['happy', 'Happy', '#1E7F91'], ['content', 'Content', '#E9B24C'], ['tired', 'Tired', '#C79350'], ['hungry', 'Hungry', '#D98C6A']];
  const hs = Object.keys(st.history).sort().slice(-30).map((k) => st.history[k].h || 0).filter((v) => v > 0);
  return (
    <>
      <View style={styles.sgrid}>
        <StatCard ic="heart" label="Health" value={st.pet.health} unit="/100" sub={moodOf(st.pet.health).t} />
        <StatCard ic="sparkle" label="Stage" value={stg} unit=" of 5" sub={stageName(stg)} />
        <StatCard ic="bolt" label="Coin bonus" value={`+${bp}`} unit="%" sub="From mood alone" />
        <StatCard ic="gift" label="Treats fed" value={money(st.stats.mealsFed)} sub={`${money(st.stats.spent.food)} coins on food`} />
      </View>
      {hs.length > 1 && (
        <Panel ic="pulse" title="Health over 30 days" sub={`Drops ${decayPerDay(st)} a day, restored by the habits you keep.`}>
          <LineChart data={hs} color="#E5654B" />
        </Panel>
      )}
      <Panel ic="sun" title="Mood breakdown" sub={`Days at each mood tier over the ${rangeLabel}.`}>
        {moodRows.map(([key, label, col]) => <Hbar key={key} name={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} /><Txt weight={700} size={11.5} color={c.tealInk}>{label}</Txt></View>} pct={(md[key] / mdTotal) * 100} value={`${md[key]}d`} />)}
      </Panel>
      <Panel ic="trophy" title="Growth timeline" sub="Stages unlock on your best overall streak.">
        {STAGES.map((s, i) => {
          const on = Math.max(st.profile.best, st.profile.streak) >= STAGE_GATE[i];
          return (
            <View key={s} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, opacity: on ? 1 : 0.5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 4, backgroundColor: on ? c.teal : c.line2 }} />
              <View style={{ flex: 1 }}>
                <Txt weight={800} size={13} color={c.tealInk}>{s}{i + 1 === stg ? ' · now' : ''}</Txt>
                <Txt weight={600} size={11} color={c.muted}>{STAGE_GATE[i] === 0 ? 'From the moment it hatches' : `${STAGE_GATE[i]} day streak`}{on ? ' · reached' : ` · ${STAGE_GATE[i] - Math.max(st.profile.best, st.profile.streak)} days to go`}</Txt>
              </View>
            </View>
          );
        })}
      </Panel>
      <Panel ic="users" title="Care record">
        <RecGrid items={[
          { k: 'Hatched on', v: st.pet.hatchedOn ? prettyDate(st.pet.hatchedOn) : 'Not yet', d: st.pet.hatchedOn ? `${daysBetween(st.pet.hatchedOn, today())} days together` : 'Keep 3 days in a row' },
          { k: 'Coins foraged', v: money(st.stats.idleCollected), d: 'While you were away' },
          { k: 'Outfit changes', v: `${st.stats.outfitChanges}`, d: `${st.pet.ownedClothes.length} owned` },
          { k: 'Species owned', v: `${st.pet.ownedSpecies.length} of ${SPECIES.length}`, d: `Now a ${spec(st.pet.species).name.toLowerCase()}` },
        ]} />
      </Panel>
      <Panel ic="medal" title="Personal records">
        <RecGrid items={[
          { k: 'Longest streak', v: `${st.profile.best} days`, d: 'All-clear in a row' },
          { k: 'Badges', v: `${st.achievements.length} of ${ACHIEVEMENTS.length}`, d: 'Collected' },
        ]} />
        <Btn title="Open achievements" variant="ghost" block style={{ marginTop: 12 }} left={<Icon name="trophy" size={15} color={c.teal} />} onPress={openAch} />
      </Panel>
    </>
  );
}

function Chip({ label }: { label: string }) {
  const c = useC();
  return <View style={{ backgroundColor: c.cream, borderWidth: 1, borderColor: c.line2, paddingVertical: 3, paddingHorizontal: 9, borderRadius: radius.pill }}><Txt weight={700} size={10.5} color={c.muted}>{label}</Txt></View>;
}
function Empty({ text }: { text: string }) {
  const c = useC();
  return <View style={{ paddingVertical: 14, alignItems: 'center' }}><Txt weight={600} size={12.5} color={c.muted}>{text}</Txt></View>;
}
function Legend({ color, label }: { color: string; label: string }) {
  const c = useC();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 10, height: 10, borderRadius: 2.5, backgroundColor: color }} /><Txt weight={600} size={10.5} color={c.muted}>{label}</Txt></View>;
}
function Callout({ tone, ic, text }: { tone: 'good' | 'warn'; ic: IconName; text: string }) {
  const c = useC();
  const bg = tone === 'good' ? c.tint2 : '#FFF4E7';
  const fg = tone === 'good' ? c.good : c.orange2;
  return <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: bg, padding: 11, borderRadius: radius.sm }}><Icon name={ic} size={14} color={fg} /><Txt weight={600} size={11.5} color={fg} style={{ flex: 1, lineHeight: 16 }}>{text}</Txt></View>;
}

const styles = StyleSheet.create({
  subtab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 11, borderRadius: radius.pill, borderWidth: 1 },
  rangebar: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  rangebtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1 },
  sgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scard: { width: '47%', borderRadius: radius.md, padding: 12, borderWidth: 1 },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EFE6D6' },
  ric: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  plusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, marginTop: 10 },
});
