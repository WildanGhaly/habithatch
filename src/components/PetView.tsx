import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { StaticPet } from './PetParts';
import { spec } from '../domain/catalogs';
import { lottiePet } from '../assets/registry';

// The companion renderer (native). fox/penguin/axolotl render the exact prototype ART (breathe
// + outfit overlay). dog/cat render their Lottie clip keyed by the worn outfit (clothesId) —
// the outfit is baked into the clip — falling back to the static PNG + overlay if a clip is
// missing. `speed` is the mood multiplier.
export function PetView({
  species, clothesId = 0, height, speed = 1, moodK = 'content',
}: { species: string; clothesId?: number; height: number; speed?: number; moodK?: string; animated?: boolean }) {
  const s = spec(species);
  if (s.kind === 'svg') {
    return <StaticPet speciesDef={s} clothesId={clothesId} height={height} moodK={moodK} />;
  }
  // dog / cat → Lottie clip for the worn outfit (outfit baked in).
  const key = clothesId > 0 ? String(clothesId) : 'default';
  const src = lottiePet[species]?.[key] ?? lottiePet[species]?.default;
  if (src) {
    return (
      <View style={{ height, width: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
        <LottieView autoPlay loop speed={speed} source={src} style={{ width: height, height }} />
      </View>
    );
  }
  return <StaticPet speciesDef={s} clothesId={clothesId} height={height} moodK={moodK} />;
}
