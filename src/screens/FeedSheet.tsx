import React from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { useC } from '../theme/ThemeContext';
import { radius, shadowSm } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore } from '../store/store';
import { FOODS } from '../domain/catalogs';
import { moodOf, bonusPct } from '../domain/mechanics';
import { foodImg, img } from '../assets/registry';

export function FeedSheet({ visible }: { param?: any; visible?: boolean }) {
  const c = useC();
  const close = useStore((s) => s.closeOverlay);
  const st = useStore((s) => s.state!);
  const feed = useStore((s) => s.feed);
  const openOverlay = useStore((s) => s.openOverlay);

  const anyFood = FOODS.some((f) => (st.pet.food[f.id] || 0) > 0);
  const maxOwnedHeal = Math.max(0, ...FOODS.filter((f) => (st.pet.food[f.id] || 0) > 0).map((f) => f.heal));
  const add = Math.min(maxOwnedHeal, 100 - st.pet.health);

  return (
    <BottomSheet visible={!!visible} onClose={close}>
      <Txt weight={700} size={19} color={c.tealInk} style={{ textAlign: 'center' }}>Feed {st.pet.name || 'your companion'}</Txt>
      <Txt size={13.5} color={c.muted} style={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }}>Health {st.pet.health}/100 · {moodOf(st.pet.health).t} · check-off bonus +{bonusPct(st)}%</Txt>

      {anyFood ? (
        <>
          <View style={styles.feedgrid}>
            {FOODS.map((f) => {
              const qty = st.pet.food[f.id] || 0;
              return (
                <Pressable key={f.id} disabled={qty <= 0} style={[styles.fooditem, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c), opacity: qty <= 0 ? 0.45 : 1 }]} onPress={() => feed(f.id)}>
                  {qty > 0 && <View style={[styles.fq, { backgroundColor: c.teal }]}><Txt weight={800} size={10} color="#fff">×{qty}</Txt></View>}
                  <Image source={foodImg[f.id]} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
                  <Txt weight={700} size={11.5} color={c.tealInk} style={{ marginTop: 4 }}>{f.name}</Txt>
                  <Txt weight={800} size={11} color={c.good}>+{f.heal}</Txt>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.healthprev}>
            <Icon name="heart" size={15} color="#E5654B" />
            <View style={styles.pbar}>
              <View style={[styles.pnow, { width: `${st.pet.health}%`, backgroundColor: c.yellow2 }]} />
              {add > 0 && <View style={[styles.padd, { left: `${st.pet.health}%`, width: `${add}%`, backgroundColor: c.good }]} />}
            </View>
            <Txt weight={700} size={12} color={c.muted}>{st.pet.health} → {st.pet.health + add}</Txt>
          </View>
        </>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 14 }}>
          <Icon name="bag" size={34} color={c.line2} />
          <Txt weight={700} size={15} color={c.tealInk} style={{ marginTop: 8 }}>The pantry is empty</Txt>
          <Txt size={13} color={c.muted} style={{ marginTop: 4, textAlign: 'center', lineHeight: 20 }}>Grab a treat from the shop, or just keep your habits, which heals for free.</Txt>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <View style={{ flex: 1 }}><Btn title="Close" variant="ghost" block onPress={close} /></View>
        <View style={{ flex: 1 }}><Btn title="Buy food" block onPress={() => { close(); openOverlay('shop', { tab: 'food' }); }} /></View>
      </View>
      <View style={{ height: 8 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  feedgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  fooditem: { width: '18%', minWidth: 60, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.sm, borderWidth: 1, position: 'relative' },
  fq: { position: 'absolute', top: 5, right: 5, paddingVertical: 1, paddingHorizontal: 5, borderRadius: radius.pill },
  healthprev: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
  pbar: { flex: 1, height: 13, borderRadius: 9, backgroundColor: '#EFE7D6', overflow: 'hidden', position: 'relative' },
  pnow: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 9 },
  padd: { position: 'absolute', top: 0, bottom: 0, opacity: 0.6 },
});
