import React from 'react';
import { Image, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { PetSprite, isSpriteSpecies, SpriteSpecies } from './PetSprite';
import { lottiePet, speciesThumb } from '../assets/registry';

// The companion renderer (native). SVG species (fox/penguin/axolotl) animate on the UI
// thread via PetSprite; dog/cat animate via Lottie (clip keyed by worn outfit), falling back
// to their PNG thumbnail if a clip is missing. `speed` is the mood multiplier.
export function PetView({
  species, clothesId = 0, height, speed = 1, animated = true, moodK,
}: { species: string; clothesId?: number; height: number; speed?: number; animated?: boolean; moodK?: string }) {
  if (isSpriteSpecies(species)) {
    return <PetSprite species={species as SpriteSpecies} clothesId={clothesId} size={height / 1.15} speed={speed} animated={animated} />;
  }
  const key = clothesId > 0 ? String(clothesId) : 'default';
  const src = lottiePet[species]?.[key] ?? lottiePet[species]?.default;
  if (src) {
    return <LottieView autoPlay loop speed={speed} source={src} style={{ width: height, height }} />;
  }
  return (
    <View style={{ height, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Image source={speciesThumb[species]} style={{ height, width: height, resizeMode: 'contain' }} />
    </View>
  );
}
