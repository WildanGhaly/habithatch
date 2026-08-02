import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { useC } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { useStore } from '../store/store';
import { FOODS, SPECIES, CLOTHES } from '../domain/catalogs';
import { foodImg, clothesImg, speciesThumb, img } from '../assets/registry';

const money = (n: number) => n.toLocaleString('en-US');
type Kind = 'food' | 'clothes' | 'pet';

export function BuySheet({ param, visible }: { param?: { kind: Kind; id: number | string }; visible?: boolean }) {
  const c = useC();
  const close = useStore((s) => s.closeOverlay);
  const st = useStore((s) => s.state!);
  const buyFood = useStore((s) => s.buyFood);
  const buyClothes = useStore((s) => s.buyClothes);
  const buyPet = useStore((s) => s.buyPet);
  const openOverlay = useStore((s) => s.openOverlay);

  if (!param) return <BottomSheet visible={!!visible} onClose={close}><View /></BottomSheet>;
  const { kind, id } = param;

  let name = '';
  let price = 0;
  let premium = false;
  let sub = '';
  let artNode: React.ReactNode = null;
  let onBuy = () => {};

  if (kind === 'food') {
    const f = FOODS.find((x) => x.id === id)!;
    name = f.name; price = f.price; premium = f.premium; sub = `Restores +${f.heal} health.`;
    artNode = <Image source={foodImg[f.id]} style={styles.art} />;
    onBuy = () => buyFood(f.id as number);
  } else if (kind === 'clothes') {
    const cl = CLOTHES.find((x) => x.id === id)!;
    name = cl.name; price = cl.price; premium = cl.premium; sub = 'A cosmetic outfit for your companion.';
    artNode = <Image source={clothesImg[cl.id]} style={styles.art} />;
    onBuy = () => buyClothes(cl.id as number);
  } else {
    const s = SPECIES.find((x) => x.id === id)!;
    name = s.name; price = s.price; premium = s.premium; sub = `${s.meta}. Switch any time; every stat carries over.`;
    artNode = s.kind === 'svg' ? <Art name={s.art!} height={110} /> : <Image source={speciesThumb[s.id]} style={{ width: 110, height: 110, resizeMode: 'contain' }} />;
    onBuy = () => buyPet(s.id as string);
  }

  const locked = premium && !st.profile.premium;
  const afford = st.profile.coins >= price;

  const confirm = () => { onBuy(); close(); };

  return (
    <BottomSheet visible={!!visible} onClose={close}>
      <View style={{ alignItems: 'center', marginBottom: 10 }}>{artNode}</View>
      <Txt weight={700} size={19} color={c.tealInk} style={{ textAlign: 'center' }}>{name}</Txt>
      <Txt size={13.5} color={c.muted} style={{ textAlign: 'center', marginTop: 4, marginBottom: 16, lineHeight: 20 }}>{sub}</Txt>

      {locked ? (
        <View style={[styles.err, { backgroundColor: c.tint, borderColor: '#F6DFC4' }]}><Icon name="crown" size={15} color={c.yellow2} /><Txt weight={600} size={12} color={c.orange2} style={{ flex: 1 }}>HabitHatch+ item. Subscribe to unlock it.</Txt></View>
      ) : !afford ? (
        <View style={[styles.err, { backgroundColor: c.cream, borderColor: c.line2 }]}><Icon name="info" size={15} color={c.muted} /><Txt weight={600} size={12} color={c.muted} style={{ flex: 1 }}>Not enough coins. {money(price - st.profile.coins)} to go. Check off a few habits.</Txt></View>
      ) : null}

      <View style={[styles.dline, { borderTopColor: c.line }]}>
        <Txt weight={600} size={14} color={c.muted}>Price</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>{price === 0 ? <Txt weight={800} size={14} color={c.tealInk}>Free</Txt> : <><Image source={img.coin} style={{ width: 18, height: 18 }} /><Txt weight={800} size={14} color={c.tealInk}>{money(price)}</Txt></>}</View>
      </View>
      <View style={[styles.dline, { borderTopColor: c.line }]}>
        <Txt weight={600} size={14} color={c.muted}>Your balance</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Image source={img.coin} style={{ width: 18, height: 18 }} /><Txt weight={800} size={14} color={c.tealInk}>{money(st.profile.coins)}</Txt></View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        {locked ? (
          <>
            <View style={{ flex: 1 }}><Btn title="Not now" variant="ghost" block onPress={close} /></View>
            <View style={{ flex: 1 }}><Btn title="See HabitHatch+" block onPress={() => { close(); openOverlay('premium'); }} /></View>
          </>
        ) : !afford ? (
          <View style={{ flex: 1 }}><Btn title="Okay" variant="ghost" block onPress={close} /></View>
        ) : (
          <>
            <View style={{ flex: 1 }}><Btn title="Cancel" variant="ghost" block onPress={close} /></View>
            <View style={{ flex: 1 }}><Btn title="Buy now" block onPress={confirm} /></View>
          </>
        )}
      </View>
      <View style={{ height: 8 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  art: { width: 96, height: 96, resizeMode: 'contain' },
  err: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: radius.sm, borderWidth: 1, marginBottom: 12 },
  dline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1 },
});
