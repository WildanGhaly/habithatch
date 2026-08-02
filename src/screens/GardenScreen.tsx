import React from 'react';
import { View, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useC } from '../theme/ThemeContext';
import { NAV_H, radius, shadowSm, shadowCard } from '../theme/tokens';
import { Txt, CoinPill, Bounded, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { useStore } from '../store/store';
import { nextPlot, gardenPct, planted } from '../domain/mechanics';
import { GARDEN, spec } from '../domain/catalogs';
import { img } from '../assets/registry';

const money = (n: number) => n.toLocaleString('en-US');

export function GardenScreen() {
  const c = useC();
  const insets = useSafeAreaInsets();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const plantPlot = useStore((s) => s.plantPlot);

  const grown = st.garden;
  const nx = nextPlot(st);
  const pct = gardenPct(st);
  const hatched = st.pet.hatchState === 'hatched';
  const sp = spec(st.pet.species);
  const name = hatched ? st.pet.name || 'your companion' : 'your companion';
  const remaining = nx ? Math.max(0, nx.cost - st.profile.coins) : 0;

  // hero: show the arts of grown plots (or a sprout hint) on a green scene
  const heroArt = grown.includes('orchard') ? 'gOrchard' : grown.includes('sapling') || grown.includes('flowers') || grown.includes('fruit') ? 'gTree' : grown.length ? 'gSprout' : 'gSprout';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.cream }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom + 20 }}>
      <Bounded>
        <View style={[styles.topbar, { paddingTop: Math.max(20, insets.top + 12) }]}>
          <Pressable onPress={() => openOverlay('profile')} style={styles.avwrap}>
            <View style={styles.avin}><Art name={hatched && sp.kind === 'svg' ? sp.art! : 'eggWhole'} height={hatched ? 54 : 50} /></View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Txt weight={600} size={12} color={c.muted}>{grown.length} of {GARDEN.length} plots grown</Txt>
            <Txt weight={800} size={20} color={c.tealInk}>Habit Garden</Txt>
          </View>
          <CoinPill amount={st.profile.coins} />
        </View>

        {/* garden hero scene */}
        <View style={styles.hero}>
          <LinearGradient colors={['#BFE3F3', '#DCEBB8', '#A7C34F']} style={StyleSheet.absoluteFill} />
          <View style={styles.sun} />
          <View style={styles.heroScene}>
            {grown.length > 0 ? (
              grown.slice(-5).map((id, i) => {
                const g = GARDEN.find((x) => x.id === id)!;
                return <Art key={id} name={g.art} height={i === grown.slice(-5).length - 1 ? 108 : 84} />;
              })
            ) : (
              <Art name="gSprout" height={72} />
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          {/* jhero */}
          <View style={styles.jhero}>
            <View style={styles.jheropet}>{hatched && sp.kind === 'svg' ? <Art name={sp.art!} height={54} /> : <Art name={st.pet.hatchProgress >= 1 ? 'eggCrack' : 'eggWhole'} height={54} />}</View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight={700} size={11} color={c.orange2} style={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>{nx ? 'The long game' : 'Complete'}</Txt>
              <Txt weight={800} size={16} color={c.tealInk} style={{ marginTop: 2 }}>{nx ? `Grow ${name} a real garden` : 'The garden is in full bloom'}</Txt>
              <Txt weight={600} size={12} color={c.muted} style={{ marginTop: 3, lineHeight: 17 }}>Coins from your habits plant permanent perks here. Nothing in the garden ever wilts.</Txt>
            </View>
          </View>

          {/* progress */}
          <View style={{ marginTop: 14 }}>
            <View style={[styles.progbar, { backgroundColor: '#EFE7D6' }]}><View style={[styles.progfill, { width: `${pct}%`, backgroundColor: c.grass }]} /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
              <Txt weight={700} size={11.5} color={c.muted}>Garden {pct}% grown</Txt>
              <Txt weight={700} size={11.5} color={c.muted}>{grown.length} / {GARDEN.length}</Txt>
            </View>
          </View>

          {/* Next card */}
          {nx && (
            <View style={[styles.card, { backgroundColor: '#fff', borderColor: c.line, ...shadowCard(c), marginTop: 14, padding: 14, paddingHorizontal: 16 }]}>
              <Txt weight={800} size={14.5} color={c.tealInk}>Next: {nx.name}</Txt>
              <Txt weight={600} size={11.5} color={c.muted} style={{ marginTop: 2 }}>{nx.perk} · {remaining > 0 ? `${money(remaining)} coins to go` : 'you can afford it now'}</Txt>
              <View style={[styles.progbar, { backgroundColor: '#EFE7D6', marginTop: 11 }]}><View style={[styles.progfill, { width: `${Math.min(100, Math.round((st.profile.coins / nx.cost) * 100))}%`, backgroundColor: c.grass }]} /></View>
              <Btn title={st.profile.coins >= nx.cost ? `Plant ${nx.name} for ${money(nx.cost)}` : `${nx.name} needs ${money(nx.cost)} coins`} variant={st.profile.coins >= nx.cost ? 'orange' : 'ghost'} block style={{ marginTop: 12 }} left={<Image source={img.coin} style={{ width: 16, height: 16 }} />} onPress={() => plantPlot(nx.id)} />
            </View>
          )}

          {/* Plots */}
          <View style={styles.shead}>
            <Txt weight={700} size={16} color={c.tealInk}>Plots</Txt>
            <Txt weight={700} size={12} color={c.muted}>perks are permanent</Txt>
          </View>
          {GARDEN.map((g) => {
            const owned = planted(st, g.id);
            const isNext = !owned && nx?.id === g.id;
            const afford = st.profile.coins >= g.cost;
            return (
              <View key={g.id} style={[styles.jrow, { backgroundColor: '#fff', borderColor: owned ? '#CFE2E8' : c.line, ...shadowSm(c) }]}>
                <View style={[styles.jic, { backgroundColor: c.cream, borderColor: c.line2 }]}>
                  {owned ? <Art name={g.art} height={34} /> : isNext ? <Icon name={(g.ic || 'sprout') as any} size={24} color={c.teal} /> : <Image source={img.lock} style={{ width: 26, height: 26, resizeMode: 'contain' }} />}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Txt weight={700} size={14} color={c.tealInk}>{g.name}</Txt>
                    {g.final && <View style={[styles.jfinal, { backgroundColor: c.yellow }]}><Txt weight={800} size={9} color="#7A4B00">goal</Txt></View>}
                  </View>
                  <Txt weight={500} size={11.5} color={c.muted} style={{ marginTop: 1 }}>{g.desc}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Icon name="bolt" size={11} color={c.orange} />
                    <Txt weight={700} size={11} color={c.orange2}>{g.perk}</Txt>
                  </View>
                </View>
                {owned ? (
                  <View style={[styles.jdone, { backgroundColor: c.tint2 }]}><Icon name="check" size={16} color={c.good} /></View>
                ) : isNext ? (
                  <Pressable onPress={() => plantPlot(g.id)} style={[styles.jbuild, { backgroundColor: afford ? c.orange : c.cream, borderWidth: afford ? 0 : 1, borderColor: c.line2 }]}>
                    <Image source={img.coin} style={{ width: 14, height: 14 }} />
                    <Txt weight={800} size={12.5} color={afford ? '#fff' : c.muted}>{money(g.cost)}</Txt>
                  </Pressable>
                ) : (
                  <View style={styles.jlock}><Image source={img.coin} style={{ width: 14, height: 14 }} /><Txt weight={800} size={12.5} color={c.muted}>{money(g.cost)}</Txt></View>
                )}
              </View>
            );
          })}

          <View style={[styles.growthnote, { backgroundColor: c.cream, borderColor: c.line2 }]}>
            <Icon name="sparkle" size={13} color={c.orange} />
            <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 17 }}>Every perk here is buyable with coins you earn for free. HabitHatch+ only ever adds decoration, never an advantage.</Txt>
          </View>
        </View>
      </Bounded>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  avwrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9', alignItems: 'center', justifyContent: 'flex-end' },
  avin: { height: '122%', alignItems: 'center', justifyContent: 'flex-end' },
  hero: { height: 212, marginHorizontal: 16, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  sun: { position: 'absolute', top: 22, right: 30, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFDA7C' },
  heroScene: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, paddingBottom: 6 },
  jhero: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  jheropet: { width: 54, height: 54, alignItems: 'center', justifyContent: 'flex-end' },
  progbar: { height: 8, borderRadius: 9, overflow: 'hidden' },
  progfill: { height: '100%', borderRadius: 9 },
  card: { borderRadius: radius.lg, borderWidth: 1 },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  jrow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  jic: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  jfinal: { paddingVertical: 1, paddingHorizontal: 6, borderRadius: radius.pill },
  jdone: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  jbuild: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  jlock: { flexDirection: 'row', alignItems: 'center', gap: 5, opacity: 0.6 },
  growthnote: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', marginTop: 14, padding: 11, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1 },
});
