import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Pressable, Easing } from 'react-native';
import { useStore } from '../store/store';
import { useC } from '../theme/ThemeContext';
import { radius, shadowCard } from '../theme/tokens';
import { Txt, Btn } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { Art } from '../components/Art';
import { img } from '../assets/registry';

// Device-level reward popup, driven by store.reward. Matches the prototype showReward():
// a burst glyph, optional stars, title/sub, coin + right stats, a note, a goal line, and a
// Continue button. Fades the scrim + pops the card.
export function RewardOverlay() {
  const c = useC();
  const reward = useStore((s) => s.reward);
  const close = useStore((s) => s.closeReward);
  const scrim = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reward) {
      scrim.setValue(0);
      pop.setValue(0);
      Animated.parallel([
        Animated.timing(scrim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(pop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      ]).start();
    }
  }, [reward]);

  if (!reward) return null;
  const g = reward.glyph;

  return (
    <View style={styles.host}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,37,48,.55)', opacity: scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={{ opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
        <View style={[styles.card, { backgroundColor: c.card, ...shadowCard(c) }]}>
          <View style={[styles.burst, { backgroundColor: c.tint }]}>
            {g?.type === 'art' ? (
              <Art name={g.name} height={52} />
            ) : g?.type === 'img' ? (
              <Image source={img[g.name as keyof typeof img]} style={{ width: 52, height: 52 }} resizeMode="contain" />
            ) : (
              <Icon name={(g?.name || 'trophy') as IconName} size={52} color={c.orange} />
            )}
          </View>
          {reward.stars ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 3, marginVertical: 4 }}>
              {Array.from({ length: reward.stars }).map((_, i) => (
                <Art key={i} name={`star${reward.stars}`} height={20} />
              ))}
            </View>
          ) : null}
          <Txt weight={800} size={21} color={c.tealInk} style={{ textAlign: 'center', marginTop: 6 }}>{reward.title}</Txt>
          {reward.sub ? <Txt size={13.5} color={c.muted} style={{ textAlign: 'center', marginTop: 6, lineHeight: 20 }}>{reward.sub}</Txt> : null}

          {(reward.coins != null || reward.right) && (
            <View style={styles.stats}>
              {reward.coins != null && (
                <View style={styles.stat}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Image source={img.coin} style={{ width: 20, height: 20 }} />
                    <Txt weight={800} size={20} color={c.tealInk}>+{reward.coins.toLocaleString('en-US')}</Txt>
                  </View>
                  <Txt weight={700} size={10.5} color={c.muted} style={{ marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>Bonus coins</Txt>
                </View>
              )}
              {reward.right && (
                <View style={styles.stat}>
                  <Txt weight={800} size={20} color={c.tealInk}>{reward.right.v}</Txt>
                  <Txt weight={700} size={10.5} color={c.muted} style={{ marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>{reward.right.l}</Txt>
                </View>
              )}
            </View>
          )}
          {reward.note ? (
            <View style={[styles.note, { backgroundColor: c.tint, borderColor: '#F6DFC4' }]}>
              <Txt weight={600} size={12.5} color={c.orange2} style={{ textAlign: 'center' }}>{reward.note}</Txt>
            </View>
          ) : null}
          {reward.goal ? <Txt weight={600} size={11.5} color={c.muted} style={{ textAlign: 'center', marginTop: 10 }}>{reward.goal}</Txt> : null}
          <Btn title="Continue" block style={{ marginTop: 16 }} onPress={close} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 340, borderRadius: 26, padding: 22, alignItems: 'center' },
  burst: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 12, marginTop: 16, alignSelf: 'stretch', justifyContent: 'center' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.02)' },
  note: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, alignSelf: 'stretch' },
});
