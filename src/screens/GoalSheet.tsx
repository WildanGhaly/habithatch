import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { useC } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore } from '../store/store';
import { dueList } from '../domain/mechanics';
import { today } from '../domain/dates';

export function GoalSheet({ visible }: { param?: any; visible?: boolean }) {
  const c = useC();
  const close = useStore((s) => s.closeOverlay);
  const st = useStore((s) => s.state!);
  const setGoal = useStore((s) => s.setGoal);
  const checkDayComplete = useStore((s) => s.checkDayComplete);

  const active = st.habits.filter((h) => !h.archived).length;
  const maxDue = Math.max(1, active);
  const opts = [0, ...Array.from({ length: Math.min(6, maxDue) }, (_, i) => i + 1)];
  const dg = st.profile.dailyGoal;
  const now = dg > 0 ? dg : dueList(st, today()).length;

  const onSet = (n: number) => {
    setGoal(n);
    setTimeout(() => checkDayComplete(), 200);
  };

  return (
    <BottomSheet visible={!!visible} onClose={close}>
      <Txt weight={700} size={19} color={c.tealInk} style={{ marginBottom: 14 }}>What counts as a win?</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginLeft: 2 }}>
        <Icon name="target" size={13} color={c.teal} />
        <Txt weight={700} size={12} color={c.teal}>Habits per day</Txt>
        <View style={[styles.pgval, { backgroundColor: c.tint, borderColor: '#F6DFC4' }]}>
          <Txt weight={800} size={11.5} color={c.orange2}>{dg > 0 ? `${dg} / day` : 'All due'}</Txt>
        </View>
      </View>
      <View style={styles.grid}>
        {opts.map((n) => {
          const on = dg === n;
          return (
            <Pressable key={n} style={[styles.pchip, { backgroundColor: on ? c.tint : '#fff', borderColor: on ? c.orange : c.line2 }]} onPress={() => onSet(n)}>
              <Txt weight={700} size={13} color={on ? c.orange2 : c.tealInk}>{n === 0 ? 'All due' : `${n} / day`}</Txt>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.hint, { backgroundColor: c.cream, borderColor: c.line2 }]}>
        <Icon name="info" size={12} color={c.orange} />
        <Txt weight={600} size={11} color={c.muted} style={{ flex: 1, lineHeight: 15 }}>That is {now || 0} habit{now === 1 ? '' : 's'} to clear today.</Txt>
      </View>
      <View style={{ marginTop: 16 }}><Btn title="Done" block onPress={close} /></View>
      <View style={{ height: 8 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pchip: { width: '23%', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1.5 },
  pgval: { marginLeft: 'auto', paddingVertical: 2, paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1 },
  hint: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
});
