import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { useC } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { useStore, HabitInput } from '../store/store';
import { CATS, catOf, SCHEDULES, WD1 } from '../domain/catalogs';
import { schedLabel } from '../domain/mechanics';
import { today } from '../domain/dates';
import { CategoryId, ScheduleKind, Habit } from '../domain/types';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const QUICK = ['07:00', '12:00', '18:00', '21:30'];

interface Draft { id: number; name: string; cat: CategoryId; sched: ScheduleKind; days: number[]; perWeek: number; remind: string }

export function EditorSheet({ param, visible }: { param?: { id?: number }; visible?: boolean }) {
  const c = useC();
  const close = useStore((s) => s.closeOverlay);
  const st = useStore((s) => s.state!);
  const addHabit = useStore((s) => s.addHabit);
  const updateHabit = useStore((s) => s.updateHabit);
  const archiveHabit = useStore((s) => s.archiveHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const openOverlay = useStore((s) => s.openOverlay);
  const showToast = useStore((s) => s.showToast);

  const existing: Habit | undefined = param?.id != null ? st.habits.find((h) => h.id === param.id) : undefined;
  const isNew = !existing;
  const activeCount = st.habits.filter((h) => !h.archived).length;
  const capped = isNew && !st.profile.premium && activeCount >= 7;

  const [ed, setEd] = useState<Draft>(() =>
    existing
      ? { id: existing.id, name: existing.name, cat: existing.cat, sched: existing.sched, days: [...existing.days], perWeek: existing.perWeek, remind: existing.remind }
      : { id: 0, name: '', cat: 'custom', sched: 'daily', days: [1, 2, 3, 4, 5], perWeek: 3, remind: '' },
  );
  const [pick, setPick] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (patch: Partial<Draft>) => setEd((e) => ({ ...e, ...patch }));

  const timeParts = useMemo(() => (ed.remind || '08:00').split(':'), [ed.remind]);
  const setTimePart = (i: 0 | 1, v: string) => { const p = (ed.remind || '08:00').split(':'); p[i] = v; set({ remind: p.join(':') }); };
  const edDay = (day: number) => {
    const has = ed.days.includes(day);
    if (has) { if (ed.days.length <= 1) { showToast('Pick at least one day'); return; } set({ days: ed.days.filter((x) => x !== day) }); }
    else set({ days: [...ed.days, day].sort((a, b) => a - b) });
  };
  const save = () => {
    const name = ed.name.trim();
    if (!name) { showToast('Give it a name first'); return; }
    const input: HabitInput = { name, cat: ed.cat, sched: ed.sched, days: ed.days, perWeek: ed.perWeek, remind: ed.remind };
    if (isNew) { addHabit(input); showToast(`"${name}" added`); }
    else { updateHabit(ed.id, input as Partial<Habit>); showToast('Habit updated'); }
    close();
  };

  // --- premium cap dialog ---
  if (capped) {
    return (
      <BottomSheet visible={!!visible} onClose={close}>
        <View style={{ alignItems: 'center' }}>
          <Icon name="crown" size={44} color={c.yellow2} />
          <Txt weight={700} size={19} color={c.tealInk} style={{ marginTop: 8 }}>Room for more?</Txt>
          <Txt size={13.5} color={c.muted} style={{ textAlign: 'center', marginTop: 6, lineHeight: 20 }}>The free plan holds 7 active habits, enough for a real routine. HabitHatch+ lifts the cap entirely.</Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1 }}><Btn title="Not now" variant="ghost" block onPress={close} /></View>
          <View style={{ flex: 1 }}><Btn title="See HabitHatch+" block onPress={() => { close(); openOverlay('premium'); }} /></View>
        </View>
      </BottomSheet>
    );
  }

  // --- delete confirm ---
  if (confirmDel && existing) {
    return (
      <BottomSheet visible={!!visible} onClose={close}>
        <View style={{ alignItems: 'center' }}>
          <Txt weight={700} size={19} color={c.tealInk} style={{ textAlign: 'center' }}>Delete “{existing.name}”?</Txt>
          <Txt size={13.5} color={c.muted} style={{ textAlign: 'center', marginTop: 6, lineHeight: 20 }}>This erases its {Object.keys(existing.logs).length} logged days and its {existing.best}-day best streak. Archiving keeps all of that instead.</Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1 }}><Btn title="Back" variant="ghost" block onPress={() => setConfirmDel(false)} /></View>
          <View style={{ flex: 1 }}><Btn title="Delete" block variant="orange" style={{}} onPress={() => { deleteHabit(existing.id); showToast('Habit deleted'); close(); }} /></View>
        </View>
        <View style={{ marginTop: 10 }}><Btn title="Archive instead" variant="ghost" block onPress={() => { archiveHabit(existing.id, true); showToast(`“${existing.name}” archived, history kept`); close(); }} /></View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={!!visible} onClose={close}>
      <Txt weight={700} size={19} color={c.tealInk} style={{ marginBottom: 16 }}>{isNew ? 'New habit' : 'Edit habit'}</Txt>

      {/* Name */}
      <PGroup label="Name" icon="edit">
        <TextInput
          style={[styles.field, { borderColor: c.line, color: c.ink }]}
          placeholder="e.g. Drink a glass of water"
          placeholderTextColor="#BDB8AB"
          maxLength={42}
          value={ed.name}
          onChangeText={(t) => set({ name: t })}
        />
      </PGroup>

      {/* Icon */}
      <PGroup label="Icon" icon="sparkle" value={catOf(ed.cat).name}>
        <View style={styles.iconpick}>
          {CATS.map((cat) => {
            const on = ed.cat === cat.id;
            return (
              <Pressable key={cat.id} style={[styles.iconbtn, { backgroundColor: on ? c.tint : '#fff', borderColor: on ? c.orange : c.line2 }]} onPress={() => set({ cat: cat.id })}>
                <Art name={cat.id} size={30} />
              </Pressable>
            );
          })}
        </View>
      </PGroup>

      {/* Schedule */}
      <PGroup label="Schedule" icon="repeat" value={schedLabel({ ...ed } as Habit)}>
        <View style={styles.g3}>
          {SCHEDULES.map(([lbl, val]) => (
            <Chip key={val} label={lbl} on={ed.sched === val} onPress={() => set({ sched: val })} />
          ))}
        </View>
        {ed.sched === 'weekdays' && (
          <View style={[styles.g7, { marginTop: 8 }]}>
            {WD1.map((w, i) => {
              const day = (i + 1) % 7; // prototype quirk: label S,M,.. maps to days 1..6,0
              return <Chip key={i} label={w} sq on={ed.days.includes(day)} onPress={() => edDay(day)} />;
            })}
          </View>
        )}
        {ed.sched === 'weekly' && (
          <>
            <View style={[styles.g5, { marginTop: 8 }]}>
              {[1, 2, 3, 4, 5].map((n) => <Chip key={n} label={`${n}×`} on={ed.perWeek === n} onPress={() => set({ perWeek: n })} />)}
            </View>
            <Hint text={`Stops asking once you hit ${ed.perWeek || 3} this week.`} />
          </>
        )}
      </PGroup>

      {/* Reminder */}
      <PGroup label="Reminder" icon="bell" value={ed.remind || 'Off'}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Off" on={!ed.remind} onPress={() => { set({ remind: '' }); setPick(false); }} padX={20} />
          <Pressable style={[styles.timebtn, { backgroundColor: ed.remind ? c.tint : '#fff', borderColor: ed.remind || pick ? c.orange : c.line2 }]} onPress={() => { const opening = !pick; setPick(opening); if (opening && !ed.remind) set({ remind: '08:00' }); }}>
            <Icon name="clock" size={15} color={ed.remind ? c.orange2 : c.teal} />
            <Txt weight={800} size={14} color={ed.remind ? c.orange2 : c.tealInk}>{ed.remind || 'Pick a time'}</Txt>
            <Icon name={pick ? 'chevU' : 'chevD'} size={14} color={c.teal} />
          </Pressable>
        </View>
        {pick && (
          <View style={[styles.timepop, { backgroundColor: c.cream, borderColor: c.line2 }]}>
            <ScrollView style={styles.twheel} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {HOURS.map((hh) => <TI key={hh} label={hh} on={timeParts[0] === hh} onPress={() => setTimePart(0, hh)} />)}
            </ScrollView>
            <Txt weight={800} size={16} color="#BFB7A5" style={{ alignSelf: 'center' }}>:</Txt>
            <ScrollView style={styles.twheel} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {MINS.map((mm) => <TI key={mm} label={mm} on={timeParts[1] === mm} onPress={() => setTimePart(1, mm)} />)}
            </ScrollView>
          </View>
        )}
        <View style={[styles.g4, { marginTop: 8 }]}>
          {QUICK.map((t) => <Chip key={t} label={t} on={ed.remind === t} onPress={() => { set({ remind: t }); }} />)}
        </View>
      </PGroup>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        {isNew ? (
          <View style={{ flex: 1 }}><Btn title="Cancel" variant="ghost" block onPress={close} /></View>
        ) : (
          <View style={{ flex: 1 }}><Btn title={existing!.archived ? 'Restore' : 'Archive'} variant="ghost" block onPress={() => { archiveHabit(existing!.id, !existing!.archived); showToast(existing!.archived ? `“${existing!.name}” is back on Today` : `“${existing!.name}” archived, history kept`); close(); }} /></View>
        )}
        <View style={{ flex: 1 }}><Btn title={isNew ? 'Add habit' : 'Save'} block onPress={save} /></View>
      </View>
      {!isNew && (
        <Pressable onPress={() => setConfirmDel(true)} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="trash" size={15} color={c.danger} />
          <Txt weight={600} size={14} color={c.danger}>Delete permanently</Txt>
        </Pressable>
      )}
      <View style={{ height: 8 }} />
    </BottomSheet>
  );
}

function PGroup({ label, icon, value, children }: { label: string; icon: any; value?: string; children: React.ReactNode }) {
  const c = useC();
  return (
    <View style={{ marginBottom: 15 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginLeft: 2 }}>
        <Icon name={icon} size={13} color={c.teal} />
        <Txt weight={700} size={12} color={c.teal}>{label}</Txt>
        {value != null && (
          <View style={[styles.pgval, { backgroundColor: c.tint, borderColor: '#F6DFC4' }]}>
            <Txt weight={800} size={11.5} color={c.orange2} numberOfLines={1}>{value}</Txt>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

function Chip({ label, on, onPress, sq, padX }: { label: string; on: boolean; onPress: () => void; sq?: boolean; padX?: number }) {
  const c = useC();
  return (
    <Pressable onPress={onPress} style={[styles.pchip, sq && { paddingHorizontal: 0 }, padX != null && { flex: 0, paddingHorizontal: padX }, { backgroundColor: on ? c.tint : '#fff', borderColor: on ? c.orange : c.line2 }]}>
      <Txt weight={700} size={13} color={on ? c.orange2 : c.tealInk}>{label}</Txt>
    </Pressable>
  );
}

function TI({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useC();
  return (
    <Pressable onPress={onPress} style={[styles.ti, { backgroundColor: on ? c.tint : '#fff', borderColor: on ? c.orange : c.line2 }]}>
      <Txt weight={700} size={13} color={on ? c.orange2 : c.tealInk}>{label}</Txt>
    </Pressable>
  );
}

function Hint({ text }: { text: string }) {
  const c = useC();
  return (
    <View style={[styles.hint, { backgroundColor: c.cream, borderColor: c.line2 }]}>
      <Icon name="info" size={12} color={c.orange} />
      <Txt weight={600} size={11} color={c.muted} style={{ flex: 1, lineHeight: 15 }}>{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%', backgroundColor: '#fff', borderWidth: 2, borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 16, fontSize: 16, fontFamily: 'Poppins-Bold', fontWeight: '600' },
  iconpick: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  iconbtn: { width: '15%', aspectRatio: 1, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', padding: 5 },
  g3: { flexDirection: 'row', gap: 8 },
  g4: { flexDirection: 'row', gap: 8 },
  g5: { flexDirection: 'row', gap: 8 },
  g7: { flexDirection: 'row', gap: 6 },
  pchip: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 6, borderRadius: radius.sm, borderWidth: 1.5 },
  pgval: { marginLeft: 'auto', paddingVertical: 2, paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1, maxWidth: '52%' },
  timebtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1.5 },
  timepop: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8, padding: 7, borderRadius: radius.sm, borderWidth: 1.5 },
  twheel: { maxWidth: 118, height: 128, flex: 1 },
  ti: { paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1.5, alignItems: 'center', marginBottom: 4 },
  hint: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 9, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
});
