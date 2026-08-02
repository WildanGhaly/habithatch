import React, { useState } from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import { OverlayScreen } from '../components/OverlayScreen';
import { useC } from '../theme/ThemeContext';
import { radius, shadowSm } from '../theme/tokens';
import { Txt, CoinPill } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { useStore } from '../store/store';
import { FOODS, SPECIES, CLOTHES, spec } from '../domain/catalogs';
import { img, foodImg, clothesImg, speciesThumb } from '../assets/registry';

const money = (n: number) => n.toLocaleString('en-US');
type ShopTab = 'food' | 'pets' | 'clothes';
const TABS: { key: ShopTab; label: string; icon: any }[] = [
  { key: 'food', label: 'Food', icon: img.food },
  { key: 'pets', label: 'Companions', icon: img.petIcon },
  { key: 'clothes', label: 'Wardrobe', icon: img.wardrobe },
];

export function ShopScreen({ param }: { param?: { tab?: ShopTab } }) {
  const c = useC();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const buyPet = useStore((s) => s.buyPet);
  const equip = useStore((s) => s.equip);
  const [tab, setTab] = useState<ShopTab>(param?.tab || 'food');

  const tabs = (
    <View style={styles.segtabs}>
      {TABS.map((t) => {
        const on = tab === t.key;
        return (
          <Pressable key={t.key} style={[styles.segbtn, on && { backgroundColor: c.tint, borderColor: c.orange }]} onPress={() => setTab(t.key)}>
            <Image source={t.icon} style={{ width: 20, height: 20, resizeMode: 'contain', opacity: on ? 1 : 0.6 }} />
            <Txt weight={700} size={12.5} color={on ? c.orange2 : c.muted}>{t.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <OverlayScreen title="Shop" right={<CoinPill amount={st.profile.coins} />} belowHeader={tabs}>
      <View style={styles.grid}>
        {tab === 'food' && FOODS.map((f) => {
          const qty = st.pet.food[f.id] || 0;
          const locked = f.premium && !st.profile.premium;
          return (
            <ShopCard key={f.id} artNode={<Image source={foodImg[f.id]} style={styles.art} />} name={f.name} desc={`+${f.heal} health`} qty={qty} premBadge={locked} onPress={() => openOverlay('buy', { kind: 'food', id: f.id })} buyLabel={<CoinBtn price={f.price} />} tone="buy" />
          );
        })}
        {tab === 'pets' && SPECIES.map((s) => {
          const owned = st.pet.ownedSpecies.includes(s.id);
          const active = st.pet.species === s.id;
          const locked = s.premium && !st.profile.premium;
          const artNode = s.kind === 'svg' ? <View style={{ height: 78, justifyContent: 'flex-end' }}><Art name={s.art!} height={78} /></View> : <Image source={speciesThumb[s.id]} style={styles.art} />;
          if (owned) {
            return <ShopCard key={s.id} artNode={artNode} name={s.name} desc={active ? 'Your companion' : 'Adopted'} premBadge={false} onPress={() => buyPet(s.id)} buyLabel={<EquipLbl label={active ? 'Active' : 'Switch'} active={active} />} tone={active ? 'equipped' : 'equip'} />;
          }
          return <ShopCard key={s.id} artNode={artNode} name={s.name} desc={s.meta} premBadge={locked} onPress={() => openOverlay('buy', { kind: 'pet', id: s.id })} buyLabel={s.price === 0 ? <Txt weight={800} size={13.5} color="#fff">Free</Txt> : <CoinBtn price={s.price} />} tone="buy" />;
        })}
        {tab === 'clothes' && CLOTHES.map((cl) => {
          const owned = st.pet.ownedClothes.includes(cl.id);
          const on = st.pet.clothesId === cl.id;
          const locked = cl.premium && !st.profile.premium;
          if (owned) {
            return <ShopCard key={cl.id} artNode={<Image source={clothesImg[cl.id]} style={styles.art} />} name={cl.name} desc="Cosmetic" premBadge={false} onPress={() => equip(cl.id)} buyLabel={<EquipLbl label={on ? 'Wearing' : 'Wear'} active={on} />} tone={on ? 'equipped' : 'equip'} />;
          }
          return <ShopCard key={cl.id} artNode={<Image source={clothesImg[cl.id]} style={styles.art} />} name={cl.name} desc="Cosmetic" premBadge={locked} onPress={() => openOverlay('buy', { kind: 'clothes', id: cl.id })} buyLabel={<CoinBtn price={cl.price} />} tone="buy" />;
        })}
      </View>
    </OverlayScreen>
  );
}

function CoinBtn({ price }: { price: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Image source={img.coin} style={{ width: 15, height: 15 }} />
      <Txt weight={800} size={13.5} color="#fff">{money(price)}</Txt>
    </View>
  );
}
function EquipLbl({ label, active }: { label: string; active: boolean }) {
  const c = useC();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {active && <Icon name="check" size={13} color="#fff" />}
      <Txt weight={800} size={13.5} color={active ? '#fff' : c.teal}>{label}</Txt>
    </View>
  );
}

function ShopCard({ artNode, name, desc, qty, premBadge, onPress, buyLabel, tone }: { artNode: React.ReactNode; name: string; desc: string; qty?: number; premBadge?: boolean; onPress: () => void; buyLabel: React.ReactNode; tone: 'buy' | 'equipped' | 'equip' }) {
  const c = useC();
  const btnBg = tone === 'equipped' ? c.teal : tone === 'equip' ? '#fff' : c.orange;
  const btnBorder = tone === 'equip' ? 1.5 : 0;
  return (
    <View style={[styles.shopcard, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c) }]}>
      {premBadge && <View style={[styles.prembadge, { backgroundColor: c.yellow }]}><Icon name="crown" size={11} color="#7A4B00" /><Txt weight={800} size={9.5} color="#7A4B00">HabitHatch+</Txt></View>}
      {qty != null && qty > 0 && <View style={[styles.qty, { backgroundColor: c.teal }]}><Txt weight={800} size={10} color="#fff">×{qty}</Txt></View>}
      <View style={{ height: 78, marginVertical: 6, alignItems: 'center', justifyContent: 'center' }}>{artNode}</View>
      <Txt weight={700} size={13.5} color={c.tealInk}>{name}</Txt>
      <Txt weight={600} size={11} color={c.muted} style={{ marginTop: 2, minHeight: 15 }}>{desc}</Txt>
      <Pressable onPress={onPress} style={[styles.buy, { backgroundColor: btnBg, borderWidth: btnBorder, borderColor: c.line2 }]}>{buyLabel}</Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  segtabs: { flexDirection: 'row', gap: 8 },
  segbtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: 'transparent' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  shopcard: { width: '47%', borderRadius: 18, padding: 12, borderWidth: 1, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  art: { width: 78, height: 78, resizeMode: 'contain' },
  buy: { marginTop: 10, width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: radius.sm },
  prembadge: { position: 'absolute', top: 8, left: 8, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 6, borderRadius: radius.pill },
  qty: { position: 'absolute', top: 8, right: 8, zIndex: 2, paddingVertical: 1, paddingHorizontal: 6, borderRadius: radius.pill },
});
