import React, { useEffect, useRef } from 'react';
import { View, Image, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useC } from '../theme/ThemeContext';
import { radius, shadowSm } from '../theme/tokens';
import { Txt } from './ui';
import { Icon } from './Icon';
import { Art } from './Art';
import { PetView } from './PetView';
import { useStore } from '../store/store';
import { moodOf, petStage, stageName, idlePending } from '../domain/mechanics';
import { img } from '../assets/registry';

// COIN_SPOTS from the prototype (idle-coin pile positions), left% / bottom px / size / rot.
const COIN_SPOTS = [
  { l: 26, b: 48, s: 28, r: 0 }, { l: 16, b: 52, s: 24, r: -12 }, { l: 72, b: 48, s: 28, r: 11 },
  { l: 80, b: 54, s: 23, r: -9 }, { l: 20, b: 62, s: 21, r: 14 }, { l: 76, b: 62, s: 22, r: 5 },
  { l: 33, b: 44, s: 20, r: -7 }, { l: 64, b: 44, s: 21, r: 16 }, { l: 11, b: 44, s: 22, r: 8 },
  { l: 86, b: 44, s: 22, r: -14 }, { l: 29, b: 58, s: 18, r: 0 }, { l: 69, b: 56, s: 19, r: -5 },
];

// The companion "room": green wall + floor, cream bottom fade, the pet (or egg) breathing/
// wobbling at bottom-center, plus mood/stage tags and the idle-coin pile. Shared by Today
// (as a tap-through to the Pet tab) and the Pet screen.
export function RoomStage({ height = 238, onPress, interactive = true }: { height?: number; onPress?: () => void; interactive?: boolean }) {
  const c = useC();
  const pet = useStore((s) => s.state!.pet);
  const collectIdle = useStore((s) => s.collectIdle);
  const hatched = pet.hatchState === 'hatched';
  const mood = moodOf(pet.health);
  const stageN = petStage(useStore.getState().state!);
  const pending = idlePending(useStore.getState().state!);

  const petH = Math.round(height * 0.8);
  const floorH = Math.round(height * 0.24);

  const inner = (
    <View style={[styles.room, { height, backgroundColor: c.roomBg }]}>
      {/* wall + floor */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 220 132" preserveAspectRatio="xMidYMid slice">
        <Rect x="0" y="0" width="220" height="132" fill={c.roomBg} />
        <Rect x="0" y="96" width="220" height="36" fill={c.floor} />
      </Svg>
      {/* bottom cream fade (proto .room::after) */}
      <Svg style={[StyleSheet.absoluteFill]} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <SvgGrad id="rfade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.74" stopColor={c.cream} stopOpacity={0} />
            <Stop offset="0.9" stopColor={c.cream} stopOpacity={0.35} />
            <Stop offset="1" stopColor={c.cream} stopOpacity={1} />
          </SvgGrad>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#rfade)" />
      </Svg>

      {/* tags */}
      {hatched ? (
        <>
          <View style={[styles.moodtag, { ...shadowSm(c) }]}>
            <View style={[styles.mooddot, { backgroundColor: MOOD_DOT[mood.k] }]} />
            <Txt weight={700} size={12.5} color={c.tealInk}>{mood.t}</Txt>
          </View>
          <View style={[styles.stagetag]}>
            <Icon name="sparkle" size={12} color="#fff" />
            <Txt weight={800} size={11} color="#fff">{stageName(stageN)}</Txt>
          </View>
        </>
      ) : (
        <View style={[styles.moodtag, { ...shadowSm(c) }]}>
          <Icon name="egg" size={14} color={c.teal} />
          <Txt weight={700} size={12.5} color={c.tealInk}>Eggbound</Txt>
        </View>
      )}

      {/* pet / egg */}
      <View style={styles.stage} pointerEvents="none">
        <View style={[styles.shadow]} />
        {hatched ? <PetBody species={pet.species} clothesId={pet.clothesId} height={petH} speed={mood.spd} /> : <Egg progress={pet.hatchProgress} height={Math.round(height * 0.71)} />}
      </View>

      {/* idle coin pile */}
      {hatched && pending > 0 && interactive && (
        <Pressable style={StyleSheet.absoluteFill} onPress={collectIdle}>
          {COIN_SPOTS.slice(0, Math.min(COIN_SPOTS.length, Math.max(1, Math.ceil(pending / 4)))).map((p, i) => (
            <Image key={i} source={img.coin} style={{ position: 'absolute', left: `${p.l}%`, bottom: p.b, width: p.s, height: p.s, transform: [{ rotate: `${p.r}deg` }] }} />
          ))}
          <View style={styles.pilebadge}>
            <Image source={img.coin} style={{ width: 15, height: 15 }} />
            <Txt weight={800} size={11.5} color="#fff">{pending} to collect</Txt>
          </View>
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.99 } : undefined)}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const MOOD_DOT: Record<string, string> = { happy: '#1E7F91', content: '#E9B24C', tired: '#C79350', hungry: '#D98C6A' };

// Egg with the whole/crack/hatch art + a gentle wobble.
function Egg({ progress, height }: { progress: number; height: number }) {
  const rot = useRef(new Animated.Value(0)).current;
  const ready = progress >= 3;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rot, { toValue: 1, duration: ready ? 450 : 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(rot, { toValue: -1, duration: ready ? 450 : 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(rot, { toValue: 0, duration: ready ? 450 : 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [ready]);
  const art = progress >= 3 ? 'eggHatch' : progress >= 1 ? 'eggCrack' : 'eggWhole';
  const rotate = rot.interpolate({ inputRange: [-1, 1], outputRange: ['-3.5deg', '3deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }], marginBottom: 8 }}>
      <Art name={art} height={height} />
    </Animated.View>
  );
}

// The pet body: fox/penguin/axolotl via PetView (reanimated engine); dog/cat via PetView too
// (Lottie native / PNG web). PetView picks the renderer; speed is the mood multiplier.
function PetBody({ species, clothesId, height, speed }: { species: string; clothesId: number; height: number; speed: number }) {
  return (
    <View style={{ height, alignItems: 'center', justifyContent: 'flex-end' }}>
      <PetView species={species} clothesId={clothesId} height={height} speed={speed} />
    </View>
  );
}

const styles = StyleSheet.create({
  room: { position: 'relative', overflow: 'hidden', width: '100%' },
  stage: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40 },
  shadow: { position: 'absolute', bottom: 40, width: 118, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.16)' },
  moodtag: { position: 'absolute', top: 12, left: 12, zIndex: 5, backgroundColor: 'rgba(255,255,255,.92)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, flexDirection: 'row', gap: 6, alignItems: 'center' },
  mooddot: { width: 8, height: 8, borderRadius: 4 },
  stagetag: { position: 'absolute', top: 12, right: 12, zIndex: 5, backgroundColor: 'rgba(12,76,96,.9)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill, flexDirection: 'row', gap: 5, alignItems: 'center' },
  pilebadge: { position: 'absolute', top: 52, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(12,76,96,.92)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill },
});
