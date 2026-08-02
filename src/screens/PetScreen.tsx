import React from 'react';
import { View, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useC } from '../theme/ThemeContext';
import { NAV_H, radius, shadowSm, shadowCard } from '../theme/tokens';
import { Txt, Card, CoinPill, Bounded, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { RoomStage } from '../components/RoomStage';
import { useStore } from '../store/store';
import {
  moodOf, bonusPct, petStage, stageName, decayPerDay, idleRate, idleCap, idlePending, idleFull, planted,
} from '../domain/mechanics';
import { STAGES, STAGE_GATE, CLOTHES, spec } from '../domain/catalogs';
import { img, clothesImg } from '../assets/registry';

const fmtRate = (n: number) => n.toFixed(2).replace(/\.?0+$/, '');

export function PetScreen() {
  const c = useC();
  const insets = useSafeAreaInsets();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const collectIdle = useStore((s) => s.collectIdle);
  const equip = useStore((s) => s.equip);
  const showToast = useStore((s) => s.showToast);
  const hatched = st.pet.hatchState === 'hatched';
  const name = st.pet.name || 'Your companion';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.cream }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom + 20 }}>
      <Bounded>
        <View style={[styles.topbar, { paddingTop: Math.max(20, insets.top + 12) }]}>
          <Pressable onPress={() => openOverlay('profile')} style={styles.avwrap}>
            <View style={styles.avin}><Art name={hatched && st.pet.species !== 'dog' && st.pet.species !== 'cat' ? st.pet.species : 'eggWhole'} height={hatched ? 54 : 50} /></View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Txt weight={600} size={12} color={c.muted}>{hatched ? 'Your companion' : 'The nursery'}</Txt>
            <Txt weight={800} size={20} color={c.tealInk}>{hatched ? name : 'Your egg'}</Txt>
          </View>
          <CoinPill amount={st.profile.coins} />
        </View>

        <View style={{ borderRadius: 0, overflow: 'hidden' }}>
          <RoomStage height={292} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          {hatched ? <CompanionBody /> : <EggRoom />}
        </View>
      </Bounded>
    </ScrollView>
  );
}

function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
  const c = useC();
  return (
    <View style={styles.shead}>
      <Txt weight={700} size={16} color={c.tealInk}>{title}</Txt>
      {right}
    </View>
  );
}

function Segbar({ n, total }: { n: number; total: number }) {
  const c = useC();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 9, borderRadius: radius.pill, backgroundColor: i < n ? c.teal : c.cream, borderWidth: 1, borderColor: i < n ? c.teal : c.line2 }} />
      ))}
    </View>
  );
}

function CareBtn({ imgKey, label, onPress }: { imgKey: string; label: string; onPress: () => void }) {
  const c = useC();
  return (
    <Pressable style={({ pressed }) => [styles.carebtn, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c) }, pressed && { transform: [{ scale: 0.97 }] }]} onPress={onPress}>
      <Image source={img[imgKey as keyof typeof img]} style={{ width: 34, height: 34, resizeMode: 'contain' }} />
      <Txt weight={700} size={11.5} color={c.tealInk}>{label}</Txt>
    </Pressable>
  );
}

function BenRow({ icColor, icon, imgKey, title, desc, val, valTone, valOnPress, last }: { icColor: string; icon?: any; imgKey?: string; title: string; desc: string; val: string; valTone: 'bonus' | 'on' | 'off'; valOnPress?: () => void; last?: boolean }) {
  const c = useC();
  const valBg = valTone === 'bonus' ? '#FFF4E7' : valTone === 'on' ? c.tint2 : c.cream;
  const valFg = valTone === 'bonus' ? c.orange2 : valTone === 'on' ? c.good : c.muted;
  const valNode = (
    <View style={{ minWidth: 56, alignItems: 'center', backgroundColor: valBg, paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill }}>
      <Txt weight={800} size={12.5} color={valFg}>{val}</Txt>
    </View>
  );
  return (
    <View style={[styles.benrow, { borderBottomColor: c.line, borderBottomWidth: last ? 0 : 1 }]}>
      <View style={[styles.benic, { backgroundColor: c.cream }]}>
        {imgKey ? <Image source={img[imgKey as keyof typeof img]} style={{ width: 22, height: 22 }} /> : <Icon name={icon} size={20} color={icColor} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight={700} size={14} color={c.tealInk}>{title}</Txt>
        <Txt weight={500} size={11.5} color={c.muted} style={{ marginTop: 2, lineHeight: 16 }}>{desc}</Txt>
      </View>
      {valOnPress ? <Pressable onPress={valOnPress}>{valNode}</Pressable> : valNode}
    </View>
  );
}

function CompanionBody() {
  const c = useC();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const collectIdle = useStore((s) => s.collectIdle);
  const equip = useStore((s) => s.equip);
  const showToast = useStore((s) => s.showToast);
  const mood = moodOf(st.pet.health);
  const bp = bonusPct(st);
  const stg = petStage(st);
  const best = Math.max(st.profile.best, st.profile.streak);
  const nextGate = STAGE_GATE[stg] || null;
  const owned = st.pet.ownedClothes;
  const name = st.pet.name || 'Your companion';
  const low = st.pet.health < 40;
  const pending = idlePending(st);
  const rate = idleRate(st);

  return (
    <>
      {/* Health card */}
      <Card style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Txt weight={800} size={15} color={c.tealInk}>Health</Txt>
          <Txt weight={600} size={12} color={c.muted}>−{decayPerDay(st)}/day · habits restore it</Txt>
        </View>
        <View style={styles.health}>
          <Icon name="heart" size={16} color="#E5654B" />
          <View style={styles.hbar}><View style={[styles.hfill, { width: `${st.pet.health}%`, backgroundColor: low ? '#E5654B' : c.yellow2 }]} /></View>
          <Txt weight={800} size={13} color={c.tealInk} style={{ minWidth: 52, textAlign: 'right' }}>{st.pet.health}/100</Txt>
        </View>
        <View style={styles.carerow}>
          <CareBtn imgKey="apple" label="Feed" onPress={() => (st.pet.health >= 100 ? showToast(`${name} is completely full`) : openOverlay('feed'))} />
          <CareBtn imgKey="wardrobe" label="Wardrobe" onPress={() => openOverlay('shop', { tab: 'clothes' })} />
          <CareBtn imgKey="petIcon" label="Adopt" onPress={() => openOverlay('shop', { tab: 'pets' })} />
        </View>
        <View style={[styles.growthnote, { backgroundColor: c.cream }]}>
          <Icon name="info" size={13} color={c.orange} />
          <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 17 }}>
            {st.pet.health >= 75 ? `${name} is thriving. Nothing here can die. Health only changes the mood and your coin bonus.` : `Finish today's habits and ${name} recovers on its own. Treats are a shortcut, never a requirement.`}
          </Txt>
        </View>
      </Card>

      {/* Growth */}
      <SectionHead title="Growth" right={<Txt weight={700} size={12} color={c.muted}>Stage {stg} of 5</Txt>} />
      <Card style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View>
            <Txt weight={800} size={14.5} color={c.tealInk}>{stageName(stg)}</Txt>
            <Txt weight={600} size={11.5} color={c.muted} style={{ marginTop: 2 }}>{nextGate ? `${nextGate - best} more streak days to ${stageName(stg + 1)}` : `${name} has reached the final stage`}</Txt>
          </View>
          <View style={styles.bonuspill}><Art name="flame" height={14} /><Txt weight={800} size={12} color={c.orange2}>{best} best</Txt></View>
        </View>
        <Segbar n={stg} total={5} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
          {STAGES.map((s, i) => <Txt key={s} weight={700} size={9.5} color={i < stg ? c.teal : c.line2}>{s}</Txt>)}
        </View>
        <View style={{ flexDirection: 'row', gap: 5, marginTop: 12 }}>
          <Icon name="sparkle" size={12} color={c.teal} />
          <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 16 }}>Growth is gated on your best overall streak, so {name}'s body is a permanent record of your most consistent run.</Txt>
        </View>
      </Card>

      {/* Foraging */}
      <SectionHead title="Foraging" />
      <Card style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <View style={[styles.earnbadge, { backgroundColor: c.yellow }]}><Image source={img.coin} style={{ width: 22, height: 22 }} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight={800} size={15} color={c.tealInk}>{fmtRate(rate)} coins / hour</Txt>
            <Txt weight={600} size={11.5} color={c.muted} style={{ marginTop: 1, lineHeight: 16 }}>{name} forages while you're away, into a {idleCap(st)}-coin jar</Txt>
          </View>
        </View>
        {pending > 0 ? (
          <Btn title={`Collect ${pending} coins${idleFull(st) ? ' · jar full' : ''}`} block style={{ marginTop: 13 }} left={<Image source={img.coin} style={{ width: 16, height: 16 }} />} onPress={collectIdle} />
        ) : (
          <View style={[styles.bondempty, { backgroundColor: c.cream }]}><Txt weight={600} size={12} color={c.muted} style={{ textAlign: 'center' }}>The jar is empty. {name} will keep gathering while you're gone.</Txt></View>
        )}
      </Card>

      {/* What X does for you */}
      <SectionHead title={`What ${name} does for you`} />
      <Card style={{ paddingHorizontal: 16 }}>
        <BenRow imgKey="coin" icColor={c.yellow2} title="Forages while you're away" desc="Garden perks raise both the rate and the size of the jar." val={`${fmtRate(rate)}/hr`} valTone="bonus" />
        <BenRow icon="bolt" icColor={c.orange} title="Check-off bonus" desc={bp > 0 ? `${name} is ${mood.t.toLowerCase()}, so every check-off pays extra.` : `Get health to 45+ and ${name} starts adding a bonus.`} val={bp > 0 ? `+${bp}%` : '0%'} valTone={bp > 0 ? 'bonus' : 'off'} />
        <BenRow icon="snow" icColor={st.profile.freezes > 0 ? c.good : c.muted} title="Streak Freeze" desc={st.profile.freezes > 0 ? "One missed day won't cost you the streak." : planted(st, 'sapling') ? 'Refills every week from your Young Sapling.' : 'Plant the Young Sapling to earn one every week.'} val={`${st.profile.freezes}`} valTone={st.profile.freezes > 0 ? 'on' : 'off'} last />
      </Card>

      {/* Wardrobe */}
      <SectionHead title="Wardrobe" right={<Pressable onPress={() => openOverlay('shop', { tab: 'clothes' })}><Txt weight={700} size={12.5} color={c.orange}>Get more</Txt></Pressable>} />
      <View style={styles.shopgrid}>
        <WardrobeCard artNode={<Image source={img.petIcon} style={{ width: 78, height: 78, resizeMode: 'contain', opacity: 0.7 }} />} name="No outfit" desc="Natural look" worn={st.pet.clothesId === 0} onPress={() => equip(0)} />
        {owned.length > 0 ? (
          owned.map((id) => {
            const cl = CLOTHES.find((x) => x.id === id);
            if (!cl) return null;
            return <WardrobeCard key={id} artNode={<Image source={clothesImg[id]} style={{ width: 78, height: 78, resizeMode: 'contain' }} />} name={cl.name} desc="Cosmetic" worn={st.pet.clothesId === id} onPress={() => equip(id)} />;
          })
        ) : (
          <Pressable style={[styles.shopcard, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c), justifyContent: 'center', minHeight: 150 }]} onPress={() => openOverlay('shop', { tab: 'clothes' })}>
            <Icon name="shirt" size={30} color={c.line2} />
            <Txt weight={700} size={13.5} color={c.tealInk} style={{ marginTop: 6 }}>No outfits yet</Txt>
            <Txt weight={600} size={11} color={c.muted} style={{ marginTop: 2 }}>Buy one in the shop</Txt>
          </Pressable>
        )}
      </View>
    </>
  );
}

function WardrobeCard({ artNode, name, desc, worn, onPress }: { artNode: React.ReactNode; name: string; desc: string; worn: boolean; onPress: () => void }) {
  const c = useC();
  return (
    <Pressable style={[styles.shopcard, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c) }]} onPress={onPress}>
      <View style={{ height: 78, marginVertical: 6, alignItems: 'center', justifyContent: 'center' }}>{artNode}</View>
      <Txt weight={700} size={13.5} color={c.tealInk}>{name}</Txt>
      <Txt weight={600} size={11} color={c.muted} style={{ marginTop: 2 }}>{desc}</Txt>
      <View style={[styles.buy, { backgroundColor: worn ? c.teal : '#fff', borderWidth: worn ? 0 : 1.5, borderColor: c.line2 }]}>
        <Txt weight={800} size={13.5} color={worn ? '#fff' : c.teal}>{worn ? 'Wearing' : 'Wear'}</Txt>
      </View>
    </Pressable>
  );
}

function EggRoom() {
  const c = useC();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const setTab = useStore((s) => s.setTab);
  const p = st.pet.hatchProgress;
  const sp = spec(st.pet.species);

  return (
    <>
      <Card style={{ padding: 18, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Txt weight={800} size={15} color={c.tealInk}>Warming up</Txt>
          <View style={[styles.chipWarn, { backgroundColor: '#FFF4E7', borderColor: '#F6DFC4' }]}><Txt weight={600} size={11.5} color={c.orange2}>{p} of 3 stages</Txt></View>
        </View>
        <Segbar n={p} total={3} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
          <Txt weight={700} size={9.5} color={p >= 1 ? c.teal : c.line2}>Whole</Txt>
          <Txt weight={700} size={9.5} color={p >= 2 ? c.teal : c.line2}>First crack</Txt>
          <Txt weight={700} size={9.5} color={p >= 3 ? c.teal : c.line2}>Hatching</Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 5, marginTop: 12 }}>
          <Icon name="info" size={12} color={c.teal} />
          <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 16 }}>Each day you clear every habit that was due, the egg advances one stage. Miss a day and nothing is lost. The egg just waits.</Txt>
        </View>
        {p >= 3 && <Btn title="It's time. Hatch it" block style={{ marginTop: 14 }} left={<Icon name="sparkle" size={16} color="#fff" />} onPress={() => openOverlay('nursery')} />}
      </Card>

      <SectionHead title="Waiting inside" />
      <Card style={{ padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={[styles.previewBox, { backgroundColor: c.cream, borderColor: c.line2 }]}>
          {sp.kind === 'svg' ? <Art name={sp.art!} height={70} /> : <Image source={img[(sp.img === 'dogThumb' ? 'dogThumb' : 'catThumb') as keyof typeof img]} style={{ height: 70, width: 70, resizeMode: 'contain' }} />}
        </View>
        <View style={{ flex: 1 }}>
          <Txt weight={800} size={14.5} color={c.tealInk}>A {sp.name.toLowerCase()}, probably</Txt>
          <Txt weight={600} size={11} color={c.muted} style={{ marginTop: 4, lineHeight: 16 }}>{sp.meta}. You'll get to name it the moment the shell breaks.</Txt>
        </View>
      </Card>

      <SectionHead title="While you wait" />
      <Card style={{ paddingHorizontal: 16 }}>
        <BenRow icon="check" icColor={c.orange} title="Coins still stack up" desc="Every check-off pays, hatched or not." val={st.profile.coins.toLocaleString('en-US')} valTone="bonus" />
        <BenRow icon="sprout" icColor={c.grass} title="The garden is already open" desc="Plant your first plot for a permanent perk." val="Open" valTone="on" valOnPress={() => setTab('garden')} last />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  avwrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9', alignItems: 'center', justifyContent: 'flex-end' },
  avin: { height: '122%', alignItems: 'center', justifyContent: 'flex-end' },
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  health: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  hbar: { flex: 1, height: 13, borderRadius: 9, backgroundColor: '#EFE7D6', overflow: 'hidden' },
  hfill: { height: '100%', borderRadius: 9 },
  carerow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  carebtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 8, borderRadius: radius.md, borderWidth: 1 },
  growthnote: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', marginTop: 14, padding: 11, paddingHorizontal: 12, borderRadius: radius.sm },
  bonuspill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF4E7', borderWidth: 1, borderColor: '#F6DFC4', paddingVertical: 5, paddingLeft: 9, paddingRight: 11, borderRadius: radius.pill },
  earnbadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bondempty: { marginTop: 12, borderRadius: radius.sm, padding: 11 },
  benrow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13 },
  benic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  shopgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shopcard: { width: '47%', backgroundColor: '#fff', borderRadius: 18, padding: 12, borderWidth: 1, alignItems: 'center' },
  buy: { marginTop: 10, width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: radius.sm },
  chipWarn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill, borderWidth: 1 },
  previewBox: { width: 74, height: 74, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden', opacity: 0.5 },
});
