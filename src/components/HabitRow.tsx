import React, { useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { useC } from '../theme/ThemeContext';
import { radius, shadowSm } from '../theme/tokens';
import { Txt } from './ui';
import { Icon } from './Icon';
import { Art } from './Art';
import { HabitProgressRing } from './Ring';
import { Habit } from '../domain/types';
import { WD } from '../domain/catalogs';

function schedLabel(h: Habit): string {
  if (h.sched === 'daily') return 'Every day';
  if (h.sched === 'weekdays') {
    const d = h.days || [];
    const eq = (a: number[]) => a.length === d.length && a.every((x) => d.includes(x));
    if (eq([1, 2, 3, 4, 5])) return 'Weekdays';
    if (eq([0, 6])) return 'Weekends';
    return d.slice().sort((a, b) => a - b).map((x) => WD[x]).join(', ');
  }
  return `${h.perWeek || 3}× a week`;
}

// A habit row from the prototype `habitRow()`: category glyph, name (+ "next up" on the
// first pending), streak flame + schedule tag + reminder, and the big tappable check control.
export function HabitRow({ habit, date, first, onToggle, onPress }: { habit: Habit; date: string; first?: boolean; onToggle: () => void; onPress?: () => void }) {
  const c = useC();
  const done = habit.logs[date] === 'done';
  const pop = useRef(new Animated.Value(1)).current;
  const cold = habit.cur === 0;

  const tap = () => {
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.22, duration: 130, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.habit, { backgroundColor: done ? '#F7FAF9' : '#fff', borderColor: done ? '#E1EDEF' : c.line, ...shadowSm(c) }, pressed && onPress ? { opacity: 0.98 } : null]}>
      <View style={[styles.hIc, { backgroundColor: c.cream, borderColor: c.line2 }]}>
        <Art name={habit.cat} size={28} />
      </View>
      <View style={styles.main}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt weight={700} size={14.5} color={done ? '#5D7B84' : c.tealInk} numberOfLines={1} style={{ flexShrink: 1 }}>{habit.name}</Txt>
          {first && !done && (
            <View style={[styles.starthere, { backgroundColor: c.orange }]}>
              <Txt weight={800} size={9.5} color="#fff">next up</Txt>
            </View>
          )}
        </View>
        <View style={styles.sub}>
          <View style={[styles.hflame, cold && { opacity: 0.5 }]}>
            <Art name="flame" height={15} />
            <Txt weight={800} size={11.5} color={cold ? '#B9B4A6' : c.orange2}>{habit.cur}</Txt>
          </View>
          <View style={[styles.tag, { backgroundColor: c.cream, borderColor: c.line2 }]}>
            <Txt weight={700} size={11} color="#5C6B72">{schedLabel(habit)}</Txt>
          </View>
          {habit.remind ? (
            <View style={styles.hmeta}>
              <Icon name="bell" size={12} color="#9A968A" />
              <Txt weight={600} size={11.5} color={c.muted}>{habit.remind}</Txt>
            </View>
          ) : null}
        </View>
      </View>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Pressable onPress={tap} style={({ pressed }) => [styles.hbox, pressed && { transform: [{ scale: 0.9 }] }]} accessibilityLabel={done ? `Uncheck ${habit.name}` : `Check off ${habit.name}`}>
          {done ? <Art name="habitCheck" size={48} /> : <HabitProgressRing size={48} cur={habit.cur} />}
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  habit: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  hIc: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, minWidth: 0 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4, flexWrap: 'wrap' },
  hflame: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingLeft: 8, paddingRight: 9, borderRadius: radius.pill, borderWidth: 1 },
  hmeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hbox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  starthere: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: radius.pill, marginLeft: 6 },
});
