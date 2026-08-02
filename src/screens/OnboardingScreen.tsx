import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useC } from '../theme/ThemeContext';
import { radius, shadowSm } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { CATS, SPECIES, catOf } from '../domain/catalogs';
import { useStore, HabitInput } from '../store/store';
import { CategoryId, SpeciesId } from '../domain/types';

// Starter habit presets per category (name + schedule), used to seed the picked habits.
const PRESET: Partial<Record<CategoryId, HabitInput>> = {
  water: { name: 'Drink 8 glasses of water', cat: 'water', sched: 'daily', remind: '09:00' },
  exercise: { name: 'Move for 20 minutes', cat: 'exercise', sched: 'weekdays', days: [1, 2, 3, 4, 5], remind: '17:30' },
  read: { name: 'Read before bed', cat: 'read', sched: 'daily', remind: '21:30' },
  meditate: { name: 'Five quiet minutes', cat: 'meditate', sched: 'daily', remind: '08:00' },
  run: { name: 'Go for a run', cat: 'run', sched: 'weekly', perWeek: 2, remind: '07:00' },
  hygiene: { name: 'Floss', cat: 'hygiene', sched: 'daily', remind: '22:00' },
  nophone: { name: 'No phone in bed', cat: 'nophone', sched: 'daily', remind: '21:00' },
  wake: { name: 'Wake up early', cat: 'wake', sched: 'daily', remind: '06:30' },
  sleep: { name: 'Lights out by 11', cat: 'sleep', sched: 'daily', remind: '22:45' },
  medicine: { name: 'Take vitamins', cat: 'medicine', sched: 'daily', remind: '08:30' },
};

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const c = useC();
  const insets = useSafeAreaInsets();
  const finishOnboarding = useStore((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<CategoryId[]>(['water', 'read']);
  const [species, setSpecies] = useState<SpeciesId>('fox');

  const toggle = (id: CategoryId) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? p : [...p, id]));
  };

  const start = () => {
    const habits: HabitInput[] = picked.map((cat) => PRESET[cat] || { name: catOf(cat).name, cat, sched: 'daily' });
    finishOnboarding(species, habits);
    onComplete();
  };

  const catPicks = CATS.filter((x) => x.id !== 'custom');

  return (
    <View style={{ flex: 1, backgroundColor: c.cream, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24, flexGrow: 1 }}>
        <View style={styles.dots}>
          {[0, 1].map((i) => <View key={i} style={[styles.dot, { backgroundColor: i === step ? c.orange : c.line2, width: i === step ? 22 : 8 }]} />)}
        </View>

        {step === 0 ? (
          <>
            <View style={{ alignItems: 'center', marginVertical: 12 }}><Art name="eggWhole" height={110} /></View>
            <Txt weight={800} size={24} color={c.tealInk}>Pick a few habits to start</Txt>
            <Txt size={14.5} color={c.muted} style={{ marginTop: 8, lineHeight: 21 }}>Choose 2–4. Keep them for three days and your egg hatches into a companion.</Txt>
            <View style={styles.catgrid}>
              {catPicks.map((cat) => {
                const on = picked.includes(cat.id);
                return (
                  <Pressable key={cat.id} style={[styles.catopt, { backgroundColor: on ? c.tint : '#fff', borderColor: on ? c.orange : c.line, ...shadowSm(c) }]} onPress={() => toggle(cat.id)}>
                    <Art name={cat.id} size={36} />
                    <Txt weight={700} size={11} color={c.tealInk} style={{ textAlign: 'center' }}>{cat.name}</Txt>
                    {on && <View style={[styles.tick, { backgroundColor: c.orange }]}><Icon name="check" size={12} color="#fff" strokeWidth={3.4} /></View>}
                  </Pressable>
                );
              })}
            </View>
            <Txt weight={700} size={12.5} color={c.muted} style={{ textAlign: 'center', marginTop: 12 }}>{picked.length} selected</Txt>
          </>
        ) : (
          <>
            <Txt weight={800} size={24} color={c.tealInk}>Who's in the egg?</Txt>
            <Txt size={14.5} color={c.muted} style={{ marginTop: 8, lineHeight: 21 }}>Pick the companion waiting to hatch. You can meet others later in the Shop.</Txt>
            <View style={{ gap: 11, marginTop: 18 }}>
              {SPECIES.map((s) => {
                const on = species === s.id;
                return (
                  <Pressable key={s.id} style={[styles.speccard, { backgroundColor: on ? c.tint : '#fff', borderColor: on ? c.orange : c.line, ...shadowSm(c) }]} onPress={() => setSpecies(s.id)}>
                    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'flex-end' }}>
                      {s.kind === 'svg' ? <Art name={s.art!} height={64} /> : <Art name="eggWhole" height={56} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Txt weight={800} size={15} color={c.tealInk}>{s.name}</Txt>
                        <View style={[styles.sbadge, { backgroundColor: s.premium ? c.yellow : c.tint2 }]}><Txt weight={800} size={9.5} color={s.premium ? '#7A4B00' : c.good}>{s.premium ? 'HabitHatch+' : s.price ? 'Unlockable' : 'Free'}</Txt></View>
                      </View>
                      <Txt size={12} color={c.muted} style={{ marginTop: 3 }}>{s.meta}</Txt>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, padding: 24, paddingTop: 8 }}>
        {step === 1 && <Btn title="Back" variant="ghost" onPress={() => setStep(0)} />}
        <View style={{ flex: 1 }}>
          {step === 0 ? (
            <Btn title="Continue" block disabled={picked.length < 2} onPress={() => setStep(1)} />
          ) : (
            <Btn title="Hatch my egg" block onPress={start} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 14 },
  dot: { height: 8, borderRadius: 9 },
  catgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  catopt: { width: '30%', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 6, borderRadius: radius.md, borderWidth: 2 },
  tick: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  speccard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 2 },
  sbadge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: radius.pill },
});
