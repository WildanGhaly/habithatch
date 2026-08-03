import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { Art } from './Art';
import { spec, SpeciesDef } from '../domain/catalogs';
import { clothesImg, speciesThumb } from '../assets/registry';

// The companion, rendered 1:1 with the prototype's speciesArt(): the exact ART SVG for
// fox/penguin/axolotl and the PNG thumbnail for dog/cat, with the prototype's `breathe`
// idle (translateY + subtle non-uniform scale, mood-driven duration) and the outfit overlay.
// (The reanimated PetSprite engine is ported in ./PetSprite.tsx and available; the room uses
// the prototype art directly so the pixels match the source of truth.)
const BREATHE: Record<string, number> = { happy: 2600, content: 3400, tired: 4400, hungry: 5000 };

export function PetView({
  species, clothesId = 0, height, speed = 1, moodK = 'content',
}: { species: string; clothesId?: number; height: number; speed?: number; moodK?: string; animated?: boolean }) {
  const s: SpeciesDef = spec(species);
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dur = BREATHE[moodK] || 3400;
    Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: dur / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: dur / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [moodK]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const scaleY = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.028] });
  const scaleX = t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.988] });

  const artW = height * (100 / 118); // species art viewBox aspect
  const wearW = artW * (s.wear.w / 100);
  const wearTop = height * (s.wear.t / 100);

  return (
    <Animated.View style={{ height, alignItems: 'center', justifyContent: 'flex-end', transform: [{ translateY }, { scaleY }, { scaleX }], opacity: moodK === 'hungry' ? 0.9 : 1 }}>
      <View style={{ height, alignItems: 'center', justifyContent: 'flex-end' }}>
        {s.kind === 'svg' ? (
          <Art name={s.art!} height={height} />
        ) : (
          <Image source={speciesThumb[s.id]} style={{ height, width: height, resizeMode: 'contain' }} />
        )}
        {clothesId > 0 && clothesImg[clothesId] && (
          <Image source={clothesImg[clothesId]} style={{ position: 'absolute', top: wearTop, width: wearW, height: wearW, resizeMode: 'contain' }} />
        )}
      </View>
    </Animated.View>
  );
}
