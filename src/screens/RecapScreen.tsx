import React, { ReactNode } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OverlayScreen } from '../components/OverlayScreen';
import { useC } from '../theme/ThemeContext';
import { radius, shadowSm, shadowCard } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { Art } from '../components/Art';
import { useStore } from '../store/store';
import { AppState, DaySummary, Habit } from '../domain/types';
import { today, dstrOff, weekStart, daysBetween, dow, prettyDate } from '../domain/dates';
import { moodOf, petStage, isDue, planted, gardenPct, nextPlot } from '../domain/mechanics';
import { GARDEN, ACHIEVEMENTS, WD, spec } from '../domain/catalogs';
import { speciesThumb } from '../assets/registry';

const money = (n: number): string => (n || 0).toLocaleString('en-US');

// ---- week aggregation (proto weekAgg) --------------------------------------
interface WeekAgg { ws: string; kept: number; due: number; ac: number; coins: number; pct: number }
function weekAgg(st: AppState, offset: number): WeekAgg {
  const ws = dstrOff(-7 * offset, weekStart(today()));
  let kept = 0;
  let due = 0;
  let ac = 0;
  let coins = 0;
  for (let i = 0; i < 7; i++) {
    const r = st.history[dstrOff(i, ws)];
    if (!r) continue;
    kept += r.done;
    due += r.due;
    if (r.ac) ac++;
    coins += r.coins || 0;
  }
  return { ws, kept, due, ac, coins, pct: due ? Math.round((kept / due) * 100) : 0 };
}

export function RecapScreen() {
  const c = useC();
  const st = useStore((s) => s.state!);
  const close = useStore((s) => s.closeOverlay);
  const setTab = useStore((s) => s.setTab);
  const showToast = useStore((s) => s.showToast);

  const w = weekAgg(st, 0);
  const pv = weekAgg(st, 1);
  const ws = w.ws;

  const backToToday = () => {
    close();
    setTimeout(() => setTab('today'), 240);
  };

  // ---- EMPTY variant: nothing due AND nothing kept this week ----------------
  if (!w.due && !w.kept) {
    const hasHabit = st.habits.some((h) => !h.archived);
    return (
      <OverlayScreen title="Weekly recap">
        <View style={{ alignItems: 'center', paddingVertical: 52, paddingHorizontal: 22 }}>
          <View style={{ marginBottom: 8 }}>
            <Icon name="gift" size={44} color={c.line2} strokeWidth={2} />
          </View>
          <Txt weight={700} size={15} color={c.tealInk} style={{ marginBottom: 4, textAlign: 'center' }}>
            No recap for this week yet
          </Txt>
          <Txt weight={400} size={13} color={c.muted} style={{ textAlign: 'center', lineHeight: 19.5 }}>
            {hasHabit
              ? 'Nothing has been due yet this week. Your card fills in\nas the days go by, and it is worth sharing by Sunday.'
              : 'Add a habit and check it off. The weekly card starts\nbuilding from your very first day.'}
          </Txt>
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Btn title="Back to today" sm left={<Icon name="chevR" size={15} color="#fff" />} onPress={backToToday} />
          </View>
        </View>
      </OverlayScreen>
    );
  }

  // ---- derived collections (proto renderRecap) -----------------------------
  const grown = GARDEN.filter((g) => planted(st, g.id));
  const plantedThisWeek = GARDEN.filter((g) => st.gardenLog[g.id] && daysBetween(ws, st.gardenLog[g.id]) >= 0);
  const badgesThisWeek = ACHIEVEMENTS.filter((a) => st.achLog[a.id] && daysBetween(ws, st.achLog[a.id]) >= 0);

  const perHabit = st.habits
    .filter((h) => !h.archived)
    .map((h) => {
      let d = 0;
      let n = 0;
      for (let i = 0; i < 7; i++) {
        const k = dstrOff(i, ws);
        if (k > today()) break;
        if (!isDue(h, k)) continue;
        n++;
        if (h.logs[k] === 'done') d++;
      }
      return { h, d, n, pct: n ? Math.round((d / n) * 100) : 0 };
    })
    .sort((a, b) => b.pct - a.pct);

  const days: { k: string; r: DaySummary; future: boolean }[] = Array.from({ length: 7 }).map((_, i) => {
    const k = dstrOff(i, ws);
    const r: DaySummary = st.history[k] || { due: 0, done: 0, ac: 0 };
    return { k, r, future: k > today() };
  });

  const bestDay = days
    .filter((d) => !d.future && d.r.due)
    .sort((a, b) => b.r.done / b.r.due - a.r.done / a.r.due)[0];

  const hadLast = pv.due > 0;
  const verdict = !hadLast
    ? 'Your first week on the board.'
    : w.pct > pv.pct + 5
      ? 'Ahead of last week.'
      : w.pct >= pv.pct - 5
        ? 'About level with last week.'
        : 'A lighter week than the last one.';

  const hatched = st.pet.hatchState === 'hatched';

  const copyText = () => showToast('Recap copied to your clipboard');
  const shareCard = () =>
    showToast(
      st.profile.premium
        ? 'Recap image saved to your device'
        : 'Card export is a HabitHatch+ extra. Copy the text version for free.',
    );

  // ---- timeline rows (proto PANEL 4) ---------------------------------------
  const tlRows: { on: boolean; t: string; d: string }[] = [];
  plantedThisWeek.forEach((g) => tlRows.push({ on: true, t: `Planted ${g.name}`, d: `${g.perk} · ${prettyDate(st.gardenLog[g.id])}` }));
  badgesThisWeek.forEach((a) => tlRows.push({ on: true, t: `Badge: ${a.name}`, d: `${a.desc} · ${prettyDate(st.achLog[a.id])}` }));
  if (tlRows.length === 0) {
    const np = nextPlot(st);
    tlRows.push({
      on: false,
      t: 'Nothing new planted yet',
      d: np ? `${np.name} needs ${money(Math.max(0, np.cost - st.profile.coins))} more coins` : 'The garden is complete',
    });
  }

  return (
    <OverlayScreen title="Weekly recap">
      {/* ---- Hero card ---- */}
      <View style={{ borderRadius: 24, overflow: 'hidden', ...shadowCard(c) }}>
        <LinearGradient colors={[c.teal, c.teal2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
          <View style={styles.heroBlob} />
          <Txt weight={800} size={11} color="#BFE3F3" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {prettyDate(ws)} to {prettyDate(dstrOff(6, ws))}
          </Txt>
          <Txt weight={800} size={23} color="#fff" style={{ marginTop: 4 }}>
            {st.profile.name}'s week
          </Txt>
          <Txt weight={400} size={13} color="#D6EEF7" style={{ marginTop: 4, lineHeight: 19.5 }}>
            {verdict}
          </Txt>

          {/* 2x2 stat grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            <RCell v={String(w.kept)} l="Habits kept" />
            <RCell v={String(w.ac)} l="All-clear days" />
            <RCell v={String(st.profile.streak)} l="Streak now" />
            <RCell v={money(w.coins)} l="Coins earned" />
          </View>

          {/* pet + progress rows */}
          <View style={styles.recappet}>
            <View style={{ height: 60, justifyContent: 'flex-end', alignItems: 'center' }}>
              <PetAvatar st={st} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {hatched ? (
                <>
                  <Txt weight={800} size={13} color="#fff" style={{ marginBottom: 9 }}>
                    {st.pet.name || 'Your companion'} is {moodOf(st.pet.health).t.toLowerCase()}
                  </Txt>
                  <View style={styles.rprow}>
                    <Txt weight={800} style={styles.rpk}>Health</Txt>
                    <View style={styles.rpbar}>
                      <View style={{ height: '100%', width: `${st.pet.health}%`, borderRadius: 999, backgroundColor: c.yellow2 }} />
                    </View>
                    <Txt weight={800} style={styles.rpv}>
                      {st.pet.health}
                      <Txt weight={700} style={styles.rpvSmall}>/100</Txt>
                    </Txt>
                  </View>
                  <View style={styles.rprow}>
                    <Txt weight={800} style={styles.rpk}>Stage</Txt>
                    <Pips count={5} on={petStage(st)} />
                    <Txt weight={800} style={styles.rpv}>
                      {petStage(st)}
                      <Txt weight={700} style={styles.rpvSmall}>/5</Txt>
                    </Txt>
                  </View>
                </>
              ) : (
                <>
                  <Txt weight={800} size={13} color="#fff" style={{ marginBottom: 9 }}>
                    Your egg is warming
                  </Txt>
                  <View style={styles.rprow}>
                    <Txt weight={800} style={styles.rpk}>Warmth</Txt>
                    <Pips count={3} on={st.pet.hatchProgress} wide />
                    <Txt weight={800} style={styles.rpv}>
                      {st.pet.hatchProgress}
                      <Txt weight={700} style={styles.rpvSmall}>/3</Txt>
                    </Txt>
                  </View>
                  <View style={styles.rprow}>
                    <Txt weight={800} style={styles.rpk}>Hatches</Txt>
                    <Txt weight={600} numberOfLines={1} style={styles.rpnote}>
                      after {3 - st.pet.hatchProgress} more all-clear day{3 - st.pet.hatchProgress === 1 ? '' : 's'}
                    </Txt>
                    <View style={{ width: 52 }} />
                  </View>
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* ---- Copy / Share actions ---- */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 22 }}>
        <View style={{ flex: 1 }}>
          <Btn title="Copy text" variant="ghost" block left={<Icon name="note" size={15} color={c.teal} />} onPress={copyText} />
        </View>
        <View style={{ flex: 1 }}>
          <Btn title="Share card" block left={<Icon name="gift" size={15} color="#fff" />} onPress={shareCard} />
        </View>
      </View>

      {/* ---- PANEL 1: This week against last ---- */}
      <Panel ic="scale" title="This week against last" foot={
        bestDay && bestDay.r.done ? (
          <Txt weight={600} size={11.5} color={c.muted} style={{ lineHeight: 17 }}>
            <Txt weight={700} size={11.5} color={c.tealInk}>{WD[dow(bestDay.k)]}</Txt> was your strongest day at {bestDay.r.done} of {bestDay.r.due}.
          </Txt>
        ) : (
          <Txt weight={600} size={11.5} color={c.muted} style={{ lineHeight: 17 }}>Nothing kept yet this week. There is still time.</Txt>
        )
      }>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <StatCard ic="target" k="Completion" v={String(w.pct)} unit="%" delta={<DeltaChip now={w.pct} prev={pv.due ? pv.pct : null} unit="pt" />} />
          <StatCard ic="check" k="Habits kept" v={String(w.kept)} delta={<DeltaChip now={w.kept} prev={pv.due ? pv.kept : null} />} />
          <StatCard ic="checkCircle" k="All-clear" v={String(w.ac)} unit=" days" delta={<DeltaChip now={w.ac} prev={pv.due ? pv.ac : null} />} />
          <StatCard ic="bolt" k="Coins" v={money(w.coins)} delta={<DeltaChip now={w.coins} prev={pv.due ? pv.coins : null} />} />
        </View>
      </Panel>

      {/* ---- PANEL 2: Habit by habit ---- */}
      <Panel ic="note" title="Habit by habit">
        {perHabit.length ? (
          perHabit.map((x, idx) => {
            const fill = x.pct >= 80 ? '#8FB94E' : x.pct < 50 ? c.orange : c.teal;
            return (
              <View key={x.h.id} style={{ paddingVertical: 10, borderBottomWidth: idx === perHabit.length - 1 ? 0 : 1, borderBottomColor: c.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                    <Art name={x.h.cat} height={20} />
                  </View>
                  <Txt weight={700} size={12.5} color={c.tealInk} style={{ flex: 1 }} numberOfLines={1}>{x.h.name}</Txt>
                  {x.n ? (
                    <Txt weight={800} size={12} color={c.tealInk}>{x.d} of {x.n}</Txt>
                  ) : (
                    <Txt weight={700} size={10.5} color={c.muted}>not due</Txt>
                  )}
                </View>
                <View style={{ height: 10, borderRadius: 999, backgroundColor: c.cream, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
                  <View style={{ height: '100%', borderRadius: 999, width: `${x.n ? x.pct : 0}%`, backgroundColor: fill }} />
                </View>
              </View>
            );
          })
        ) : (
          <View style={{ padding: 10, alignItems: 'center' }}>
            <Txt weight={400} size={13} color={c.muted}>No habits scheduled this week.</Txt>
          </View>
        )}
      </Panel>

      {/* ---- PANEL 3: Day by day ---- */}
      <Panel ic="calendar" title="Day by day">
        {days.map((d, idx) => {
          const valText = d.future ? 'not yet' : d.r.due ? `${d.r.done}/${d.r.due}` : 'nothing due';
          return (
            <View key={d.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: idx === days.length - 1 ? 0 : 1, borderBottomColor: c.line }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.cream, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={d.r.ac ? 'checkCircle' : d.future ? 'clock' : 'circle'} size={17} color={c.teal} strokeWidth={2} />
              </View>
              <Txt weight={600} size={13.5} color={c.tealInk} style={{ flex: 1 }}>
                {WD[dow(d.k)]}{d.k === today() ? ' · today' : ''}
              </Txt>
              <Txt weight={800} size={13} color={d.r.ac ? c.good : c.muted}>{valText}</Txt>
            </View>
          );
        })}
      </Panel>

      {/* ---- PANEL 4: What grew this week ---- */}
      <Panel ic="sprout" title="What grew this week" foot={
        <Txt weight={600} size={11.5} color={c.muted} style={{ lineHeight: 17 }}>
          Garden is <Txt weight={700} size={11.5} color={c.tealInk}>{gardenPct(st)}%</Txt> grown, {grown.length} of {GARDEN.length} plots.
        </Txt>
      }>
        <View style={{ paddingLeft: 26 }}>
          <View style={{ position: 'absolute', left: 8, top: 6, bottom: 6, width: 2, backgroundColor: c.line }} />
          {tlRows.map((row, idx) => (
            <View key={idx} style={{ paddingVertical: 8 }}>
              <View style={[styles.tldot, { backgroundColor: row.on ? c.orange : '#fff', borderColor: row.on ? c.orange : c.line2 }]} />
              <Txt weight={700} size={12.5} color={c.tealInk} style={{ lineHeight: 18 }}>{row.t}</Txt>
              <Txt weight={600} size={10.5} color={c.muted} style={{ marginTop: 1 }}>{row.d}</Txt>
            </View>
          ))}
        </View>
      </Panel>

      {/* ---- Non-premium callout ---- */}
      {!st.profile.premium && (
        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: '#FFF4E7', borderWidth: 1, borderColor: '#F6DFC4', borderRadius: radius.sm, padding: 10, paddingHorizontal: 12, marginTop: 11 }}>
          <View style={{ marginTop: 1 }}>
            <Icon name="crown" size={14} color={c.orange} />
          </View>
          <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 17 }}>
            HabitHatch+ exports this as an image you can post. The numbers are yours either way.
          </Txt>
        </View>
      )}
    </OverlayScreen>
  );
}

// ---- hero stat cell --------------------------------------------------------
function RCell({ v, l }: { v: string; l: string }) {
  return (
    <View style={styles.rcell}>
      <Txt weight={800} size={22} color="#fff" style={{ lineHeight: 22 }}>{v}</Txt>
      <Txt weight={700} size={10.5} color="#BFE3F3" style={{ textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 4 }}>{l}</Txt>
    </View>
  );
}

// ---- pet avatar: egg pre-hatch, species art/thumb post-hatch --------------
function PetAvatar({ st }: { st: AppState }) {
  if (st.pet.hatchState !== 'hatched') {
    return <Art name={st.pet.hatchProgress >= 2 ? 'eggCrack' : 'eggWhole'} height={60} />;
  }
  const sp = spec(st.pet.species);
  if (sp.kind === 'svg') return <Art name={sp.art!} height={60} />;
  return <Image source={speciesThumb[st.pet.species]} style={{ height: 60, width: 60, resizeMode: 'contain' }} />;
}

// ---- progress pips (stage / warmth) ---------------------------------------
function Pips({ count, on, wide }: { count: number; on: number; wide?: boolean }) {
  const c = useC();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ flex: 1, maxWidth: wide ? 46 : 26, height: 7, borderRadius: 999, backgroundColor: i < on ? c.yellow : 'rgba(255,255,255,0.18)' }} />
      ))}
    </View>
  );
}

// ---- panel wrapper ---------------------------------------------------------
function Panel({ ic, title, foot, children }: { ic: IconName; title: string; foot?: ReactNode; children: ReactNode }) {
  const c = useC();
  return (
    <View style={{ backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: 15, paddingHorizontal: 16, marginBottom: 12, ...shadowSm(c) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <Icon name={ic} size={16} color={c.teal} strokeWidth={2} />
        <Txt weight={800} size={14.5} color={c.tealInk} style={{ flex: 1 }}>{title}</Txt>
      </View>
      {children}
      {foot ? (
        <View style={{ marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: c.line }}>{foot}</View>
      ) : null}
    </View>
  );
}

// ---- stat card (panel 1) ---------------------------------------------------
function StatCard({ ic, k, v, unit, delta }: { ic: IconName; k: string; v: string; unit?: string; delta?: ReactNode }) {
  const c = useC();
  return (
    <View style={{ flexGrow: 1, flexBasis: '46%', backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 13, overflow: 'hidden', ...shadowSm(c) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name={ic} size={13} color={c.teal} strokeWidth={2} />
        <Txt weight={800} size={10.5} color={c.muted} style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>{k}</Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
        <Txt weight={800} size={23} color={c.tealInk}>{v}</Txt>
        {unit ? <Txt weight={700} size={12} color={c.muted}>{unit}</Txt> : null}
      </View>
      {delta}
    </View>
  );
}

// ---- delta chip ------------------------------------------------------------
function DeltaChip({ now, prev, unit }: { now: number; prev: number | null; unit?: string }) {
  const c = useC();
  if (prev == null) return null;
  const d = now - prev;
  const flat = d === 0;
  const up = d > 0;
  const bg = flat ? c.cream : up ? '#E7F2E4' : '#FDECE8';
  const fg = flat ? c.muted : up ? '#4C7A32' : '#B9553C';
  const v = Math.abs(Math.round(d * 10) / 10);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', backgroundColor: bg, paddingVertical: 2, paddingLeft: 5, paddingRight: 7, borderRadius: radius.pill, marginTop: 6 }}>
      <Icon name={flat ? 'minus' : up ? 'arrUp' : 'arrDn'} size={11} color={fg} strokeWidth={2.4} />
      <Txt weight={800} size={11} color={fg}>{v}{unit || ''}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBlob: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,218,124,0.14)' },
  rcell: { flexGrow: 1, flexBasis: '46%', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: radius.md, padding: 12 },
  recappet: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
  rprow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 7 },
  rpk: { width: 50, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase', color: '#8FBACB' },
  rpbar: { flex: 1, height: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  rpv: { width: 52, textAlign: 'right', fontSize: 14, color: '#fff' },
  rpvSmall: { fontSize: 10, color: '#9FC9D8' },
  rpnote: { flex: 1, fontSize: 11, color: '#9FC9D8' },
  tldot: { position: 'absolute', left: -23.5, top: 10.5, width: 13, height: 13, borderRadius: 6.5, borderWidth: 2.5 },
});
