import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { Art } from './Art';
import { spec, SpeciesDef } from '../domain/catalogs';
import { clothesImg, speciesThumb } from '../assets/registry';

// Renders the companion. SVG species (fox/penguin/axolotl) use the inline ART; img species
// (dog/cat) use their thumbnail. A breathing wrapper approximates the prototype's .breathe/
// mood-driven idle. NOTE: the reanimated UI-thread PetSprite engine + Lottie for dog/cat are
// wired in the pet-engine task; this keeps every species visible in the meantime.
const BREATHE: Record<string, number> = { happy: 2600, content: 3400, tired: 4400, hungry: 5000 };

export function PetView({
  species, clothesId = 0, height, moodK = 'content',
}: { species: string; clothesId?: number; height: number; moodK?: string }) {
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
  const wearW = height * (s.wear.w / 100);
  const wearTop = height * (s.wear.t / 100);

  return (
    <Animated.View style={{ height, alignItems: 'center', justifyContent: 'flex-end', transform: [{ translateY }, { scaleY }], opacity: moodK === 'hungry' ? 0.92 : 1 }}>
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
