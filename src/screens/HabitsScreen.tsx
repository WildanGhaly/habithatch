import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useC } from '../theme/ThemeContext';
import { NAV_H, radius, shadowSm } from '../theme/tokens';
import { Txt, CoinPill, Bounded } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { PetHeadshot } from '../components/PetParts';
import { useStore } from '../store/store';
import { isDue, schedLabel } from '../domain/mechanics';
import { today, weekStart, dstrOff } from '../domain/dates';
import { WD1 } from '../domain/catalogs';
import { Habit } from '../domain/types';

export function HabitsScreen() {
  const c = useC();
  const insets = useSafeAreaInsets();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const [showArchived, setShowArchived] = useState(false);

  const live = st.habits.filter((h) => !h.archived).sort((a, b) => a.id - b.id);
  const arch = st.habits.filter((h) => h.archived);
  const dueToday = live.filter((x) => isDue(x, today())).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.cream }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom + 20 }}>
      <Bounded>
        <View style={[styles.topbar, { paddingTop: Math.max(20, insets.top + 12) }]}>
          <Pressable onPress={() => openOverlay('profile')} style={styles.avwrap}>
            <View style={styles.avin}>
              <PetHeadshot species={st.pet.species} hatched={st.pet.hatchState === 'hatched'} size={54} eggSize={50} />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Txt weight={600} size={12} color={c.muted}>{live.length} active · {dueToday} due today</Txt>
            <Txt weight={800} size={20} color={c.tealInk}>Your habits</Txt>
          </View>
          <CoinPill amount={st.profile.coins} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
          {live.length > 0 && (
            <Pressable style={styles.addbanner} onPress={() => openOverlay('editor')}>
              <View style={styles.ebIc}><Icon name="plus" size={26} color="#fff" /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight={800} size={14.5} color="#fff">Add a habit</Txt>
                <Txt weight={600} size={11.5} color="#BFE3F3" style={{ marginTop: 3 }}>Name it, pick an icon, choose how often. Thirty seconds.</Txt>
              </View>
              <Icon name="chevR" size={16} color="#BFE3F3" />
            </Pressable>
          )}

          {live.length > 0 ? (
            <>
              <View style={styles.shead}>
                <Txt weight={700} size={16} color={c.tealInk}>Active</Txt>
                <Txt weight={700} size={12} color={c.muted}>{live.length}</Txt>
              </View>
              {live.map((h, i) => (
                <ManageRow key={h.id} habit={h} index={i} liveCount={live.length} onEdit={() => openOverlay('editor', { id: h.id })} />
              ))}
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20, marginTop: 20 }}>
              <Icon name="note" size={40} color={c.line2} />
              <Txt weight={700} size={15} color={c.tealInk} style={{ marginTop: 8 }}>No habits yet</Txt>
              <Txt size={13} color={c.muted} style={{ marginTop: 4, textAlign: 'center', lineHeight: 20 }}>Start with one or two you actually want. Small beats ambitious every time.</Txt>
              <Pressable onPress={() => openOverlay('editor')} style={[styles.smBtn, { backgroundColor: c.orange, marginTop: 14 }]}><Icon name="plus" size={15} color="#fff" /><Txt weight={700} size={13} color="#fff">Add your first</Txt></Pressable>
            </View>
          )}

          {arch.length > 0 && (
            <>
              <View style={styles.shead}>
                <Txt weight={700} size={16} color={c.tealInk}>Archived</Txt>
                <Pressable onPress={() => setShowArchived((v) => !v)}><Txt weight={700} size={12.5} color={c.orange}>{showArchived ? 'Hide' : `Show ${arch.length}`}</Txt></Pressable>
              </View>
              {showArchived && arch.map((h) => <ManageRow key={h.id} habit={h} index={-1} liveCount={0} onEdit={() => openOverlay('editor', { id: h.id })} />)}
            </>
          )}

          {st.habits.length > 0 && (
            <View style={[styles.growthnote, { backgroundColor: c.cream, borderColor: c.line2 }]}>
              <Icon name="info" size={14} color={c.orange} />
              <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 17 }}>Archiving keeps a habit's history and badges. It only stops appearing on Today.</Txt>
            </View>
          )}
        </View>
      </Bounded>
    </ScrollView>
  );
}

function ManageRow({ habit, index, liveCount, onEdit }: { habit: Habit; index: number; liveCount: number; onEdit: () => void }) {
  const c = useC();
  const moveHabit = useStore((s) => s.moveHabit);
  const d = today();
  const cold = habit.cur <= 0;
  const archived = habit.archived;
  return (
    <View style={[styles.habit, { backgroundColor: archived ? '#F7FAF9' : '#fff', borderColor: archived ? '#E1EDEF' : c.line, ...shadowSm(c) }]}>
      <View style={[styles.hIc, { backgroundColor: c.cream, borderColor: c.line2 }]}><Art name={habit.cat} size={28} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight={700} size={14.5} color={archived ? '#5D7B84' : c.tealInk} numberOfLines={1}>{habit.name}</Txt>
        <View style={styles.sub}>
          <View style={[styles.hflame, cold && { opacity: 0.5 }]}><Art name="flame" height={15} /><Txt weight={800} size={11.5} color={cold ? '#B9B4A6' : c.orange2}>{habit.cur}</Txt></View>
          <View style={[styles.tag, { backgroundColor: c.cream, borderColor: c.line2 }]}><Txt weight={700} size={11} color="#5C6B72">{schedLabel(habit)}</Txt></View>
          <Txt weight={600} size={11.5} color={c.muted}>best {habit.best}</Txt>
        </View>
        <WeekDots habit={habit} d={d} />
      </View>
      <View style={{ gap: 5 }}>
        <SortBtn icon="chevU" disabled={index <= 0 || archived} onPress={() => moveHabit(habit.id, -1)} />
        <SortBtn icon="chevD" disabled={index < 0 || index >= liveCount - 1 || archived} onPress={() => moveHabit(habit.id, 1)} />
        <SortBtn icon="edit" disabled={false} onPress={onEdit} />
      </View>
    </View>
  );
}

function SortBtn({ icon, disabled, onPress }: { icon: any; disabled: boolean; onPress: () => void }) {
  const c = useC();
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.sortbtn, { backgroundColor: c.cream, borderColor: c.line2, opacity: disabled ? 0.35 : 1 }, pressed && !disabled ? { transform: [{ scale: 0.92 }] } : null]}>
      <Icon name={icon} size={15} color={c.teal} />
    </Pressable>
  );
}

function WeekDots({ habit, d }: { habit: Habit; d: string }) {
  const c = useC();
  const ws = weekStart(d);
  return (
    <View style={styles.wdots}>
      {Array.from({ length: 7 }).map((_, i) => {
        const k = dstrOff(i, ws);
        const dueDay = isDue(habit, k);
        const status = habit.logs[k];
        const future = k > d;
        let cls: 'on' | 'miss' | 'na' | '' = !dueDay ? 'na' : status === 'done' ? 'on' : !future && !status ? 'miss' : 'na';
        if (future && dueDay) cls = '';
        const bg = cls === 'on' ? c.good : cls === 'miss' ? '#FBE6E0' : c.cream;
        const border = cls === 'on' ? c.good : cls === 'miss' ? '#F0C7BC' : c.line2;
        return (
          <View key={i} style={[styles.wdot, { backgroundColor: bg, borderColor: border, opacity: cls === 'na' ? 0.4 : 1 }, k === d && styles.wdotToday]}>
            {status === 'done' && <Txt weight={800} size={8} color="#fff">{WD1[(i + 1) % 7]}</Txt>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  avwrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9', alignItems: 'center', justifyContent: 'flex-end' },
  avin: { height: '122%', alignItems: 'center', justifyContent: 'flex-end' },
  addbanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0C4C60', borderRadius: radius.lg, padding: 14, paddingHorizontal: 15 },
  ebIc: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  habit: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  hIc: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4, flexWrap: 'wrap' },
  hflame: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingLeft: 8, paddingRight: 9, borderRadius: radius.pill, borderWidth: 1 },
  wdots: { flexDirection: 'row', gap: 4, marginTop: 6 },
  wdot: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  wdotToday: { borderColor: '#E28A4B', borderWidth: 2 },
  sortbtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  growthnote: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', marginTop: 14, padding: 11, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1 },
  smBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.sm },
});
