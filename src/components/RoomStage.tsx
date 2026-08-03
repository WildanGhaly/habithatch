import React, { useEffect, useRef } from 'react';
import { View, Image, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGrad, Stop, Rect } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';

// The decorated room scene, transcribed verbatim from the prototype roomArt() (window,
// framed picture, potted plant, floor woodgrain, dirt shadows). Not themed — colors fixed.
const ROOM_ART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 132" preserveAspectRatio="xMidYMid slice"><rect width="220" height="132" fill="#A0B559"/><g opacity="0.28" fill="#8E9F4C"><circle cx="34" cy="16" r="2"/><circle cx="72" cy="9" r="1.6"/><circle cx="112" cy="20" r="1.8"/><circle cx="150" cy="12" r="1.6"/><circle cx="196" cy="22" r="2"/><circle cx="12" cy="46" r="1.6"/><circle cx="96" cy="52" r="1.6"/></g><rect y="84" width="220" height="48" fill="#DCC79A"/><rect y="82" width="220" height="3" fill="#8E9F4C"/><rect y="85" width="220" height="2.5" fill="#C9B084" opacity="0.55"/><g stroke="#C9B084" stroke-width="1.1" stroke-linecap="round" opacity="0.9"><path d="M0 94h92M104 94h116M0 106h48M60 106h160M0 118h146M158 118h62M0 129h74M86 129h134"/></g><g><circle cx="181" cy="35" r="19" fill="#F2EADA"/><circle cx="181" cy="35" r="15" fill="#BFE3F3"/><path d="M166 39a15 15 0 0 0 30 0z" fill="#A9D8ED"/><circle cx="174" cy="29" r="3.6" fill="#fff" opacity="0.75"/><circle cx="187" cy="33" r="2.4" fill="#fff" opacity="0.5"/><path d="M181 20v30M166 35h30" stroke="#F2EADA" stroke-width="2.4"/></g><g><rect x="26" y="20" width="27" height="22" rx="2.4" fill="#3A2E1D"/><rect x="29" y="23" width="21" height="16" rx="1.6" fill="#F2EADA"/><path d="M29 39l5.5-7 4 4 4.5-6 7 9z" fill="#A7C34F"/><circle cx="34" cy="28" r="2" fill="#F4B942"/></g><g><path d="M17 84V74" stroke="#7FA23C" stroke-width="2" stroke-linecap="round"/><path d="M17 78q-7-1.5-8.5-8.5 7 0 8.5 6z" fill="#A7C34F"/><path d="M17 75q7-1.5 8.5-8.5-7 0-8.5 6z" fill="#B7D25E"/><path d="M10 84h14l-1.6 9H11.6z" fill="#C9773A"/></g><ellipse cx="110" cy="116" rx="62" ry="12" fill="#D2BB8C" opacity="0.55"/><ellipse cx="110" cy="116" rx="48" ry="8.5" fill="#C9B084" opacity="0.45"/></svg>`;
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

  // The pet's rendered height. Grows upward from a fixed 44px floor offset (feet stay on the
  // dirt shadow); a taller, centred head clears the corner mood/stage tags. Deliberately larger
  // than the web prototype so the companion reads big on a phone (per product direction) instead
  // of small-and-distant, while keeping ~15px of headroom below the ceiling in both room sizes.
  const petH = Math.round(height * 0.9) - 32;

  const inner = (
    <View style={[styles.room, { height, backgroundColor: c.roomBg }]}>
      {/* decorated room scene (window, picture, plant, floor) — verbatim from the prototype */}
      <SvgXml xml={ROOM_ART} width="100%" height="100%" style={StyleSheet.absoluteFill} />
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
      <View style={[styles.stage, { paddingBottom: hatched ? 44 : 38 }]} pointerEvents="none">
        <View style={styles.shadow} />
        {hatched ? <PetBody species={pet.species} clothesId={pet.clothesId} height={petH} moodK={mood.k} /> : <Egg progress={pet.hatchProgress} height={188} />}
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
function PetBody({ species, clothesId, height, moodK }: { species: string; clothesId: number; height: number; moodK: string }) {
  return (
    <View style={{ height, alignItems: 'center', justifyContent: 'flex-end' }}>
      <PetView species={species} clothesId={clothesId} height={height} moodK={moodK} />
    </View>
  );
}

const styles = StyleSheet.create({
  room: { position: 'relative', overflow: 'hidden', width: '100%' },
  stage: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-end' },
  shadow: { position: 'absolute', bottom: 48, width: 118, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.16)' },
  moodtag: { position: 'absolute', top: 12, left: 12, zIndex: 5, backgroundColor: 'rgba(255,255,255,.92)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, flexDirection: 'row', gap: 6, alignItems: 'center' },
  mooddot: { width: 8, height: 8, borderRadius: 4 },
  stagetag: { position: 'absolute', top: 12, right: 12, zIndex: 5, backgroundColor: 'rgba(12,76,96,.9)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill, flexDirection: 'row', gap: 5, alignItems: 'center' },
  // Sits in the top HUD row (between the mood + stage tags) so it never overlaps the now-larger
  // pet. The corner tags leave a centred gap wide enough for the "N to collect" pill.
  pilebadge: { position: 'absolute', top: 13, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(12,76,96,.92)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: radius.pill, zIndex: 5 },
});
