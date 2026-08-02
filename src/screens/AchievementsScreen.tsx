import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { OverlayScreen } from '../components/OverlayScreen';
import { useC } from '../theme/ThemeContext';
import { radius, shadowCard, shadowSm } from '../theme/tokens';
import { Txt } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { useStore } from '../store/store';
import { ACHIEVEMENTS, AchievementDef } from '../domain/catalogs';
import { achMet, achProg } from '../domain/mechanics';
import { prettyDate } from '../domain/dates';
import { img } from '../assets/registry';

const money = (n: number) => n.toLocaleString('en-US');

export function AchievementsScreen() {
  const c = useC();
  const st = useStore((s) => s.state!);
  const got = ACHIEVEMENTS.filter((a) => st.achievements.includes(a.id)).length;
  const total = ACHIEVEMENTS.length;
  const C = 2 * Math.PI * 26;

  // group in declaration order
  const groups: { name: string; items: AchievementDef[] }[] = [];
  ACHIEVEMENTS.forEach((a) => {
    let g = groups.find((x) => x.name === a.group);
    if (!g) { g = { name: a.group, items: [] }; groups.push(g); }
    g.items.push(a);
  });

  return (
    <OverlayScreen title="Achievements">
      {/* summary */}
      <View style={[styles.achtop, { backgroundColor: '#fff', borderColor: c.line, ...shadowCard(c) }]}>
        <View>
          <Svg width={66} height={66} viewBox="0 0 64 64">
            <Circle cx={32} cy={32} r={26} fill="none" stroke="#EFE7D6" strokeWidth={7} />
            <Circle cx={32} cy={32} r={26} fill="none" stroke={c.orange} strokeWidth={7} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - got / total)} transform="rotate(-90 32 32)" />
          </Svg>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 66, height: 66, alignItems: 'center', justifyContent: 'center' }}>
            <Txt weight={800} size={15} color={c.tealInk}>{got}</Txt>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight={800} size={15} color={c.tealInk}>{got} of {total} badges</Txt>
          <Txt weight={600} size={12} color={c.muted} style={{ marginTop: 2, lineHeight: 17 }}>Earned by showing up, not by spending.</Txt>
        </View>
      </View>

      {groups.map((g) => {
        const gg = g.items.filter((a) => st.achievements.includes(a.id)).length;
        return (
          <View key={g.name}>
            <View style={styles.shead}>
              <Txt weight={700} size={16} color={c.tealInk}>{g.name}</Txt>
              <Txt weight={700} size={11} color={c.muted}>{gg}/{g.items.length}</Txt>
            </View>
            <View style={styles.grid}>
              {g.items.map((a) => <BadgeCard key={a.id} a={a} got={st.achievements.includes(a.id)} prog={achProg(st, a.id)} date={st.achLog[a.id]} />)}
            </View>
          </View>
        );
      })}
    </OverlayScreen>
  );
}

function BadgeCard({ a, got, prog, date }: { a: AchievementDef; got: boolean; prog: [number, number] | null; date?: string }) {
  const c = useC();
  const pc = prog ? Math.min(100, Math.round((prog[0] / prog[1]) * 100)) : 0;
  return (
    <View style={[styles.achcard, { backgroundColor: got ? '#fff' : c.cream, borderColor: c.line, ...shadowSm(c), opacity: got ? 1 : 0.72 }]}>
      <View style={styles.stars}>
        {Array.from({ length: a.rar }).map((_, i) => <View key={i} style={{ opacity: got ? 1 : 0.5 }}><Art name={`star${a.rar}`} height={13} /></View>)}
      </View>
      <View style={[styles.achic, { backgroundColor: got ? '#FFF4E7' : c.cream, borderColor: got ? '#F6DFC4' : c.line2 }]}>
        {!got ? <Icon name="lock" size={21} color={c.line2} /> : a.art ? <Art name={a.art} height={30} /> : a.img ? <Image source={img[a.img as keyof typeof img]} style={{ width: 24, height: 24, resizeMode: 'contain' }} /> : <Icon name={(a.ic || 'trophy') as any} size={24} color={c.orange} />}
      </View>
      <Txt weight={800} size={13} color={c.tealInk} style={{ textAlign: 'center' }}>{a.name}</Txt>
      <Txt weight={600} size={10.5} color={c.muted} style={{ textAlign: 'center', marginTop: 3, lineHeight: 14, minHeight: 28 }}>{a.desc}</Txt>
      {!got && prog && (
        <>
          <View style={[styles.achprog, { backgroundColor: '#EFE7D6' }]}><View style={{ height: '100%', width: `${pc}%`, backgroundColor: c.orange, borderRadius: 9 }} /></View>
          <Txt weight={800} size={10} color={c.muted} style={{ textAlign: 'center', marginTop: 4 }}>{money(prog[0])} / {money(prog[1])}</Txt>
        </>
      )}
      {got && date && <Txt weight={800} size={10} color={c.muted} style={{ textAlign: 'center', marginTop: 6 }}>{prettyDate(date)}</Txt>}
    </View>
  );
}

const styles = StyleSheet.create({
  achtop: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 14, borderWidth: 1 },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, justifyContent: 'space-between' },
  achcard: { width: '47%', borderRadius: 18, paddingVertical: 13, paddingHorizontal: 11, borderWidth: 1, alignItems: 'center', position: 'relative' },
  stars: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 1 },
  achic: { width: 46, height: 46, marginBottom: 8, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  achprog: { height: 6, borderRadius: 9, overflow: 'hidden', marginTop: 8, alignSelf: 'stretch' },
});
