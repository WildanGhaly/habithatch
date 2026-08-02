import React from 'react';
import { Image, View } from 'react-native';
import { PetSprite, isSpriteSpecies, SpriteSpecies } from './PetSprite';
import { speciesThumb } from '../assets/registry';

// Web companion renderer. Never imports lottie-react-native (its web build pulls an
// uninstalled dep). SVG species render live via PetSprite; dog/cat render a static PNG
// thumbnail (web is verification-only; dog/cat animation is native).
export function PetView({
  species, clothesId = 0, height, speed = 1, animated = true,
}: { species: string; clothesId?: number; height: number; speed?: number; animated?: boolean; moodK?: string }) {
  if (isSpriteSpecies(species)) {
    return <PetSprite species={species as SpriteSpecies} clothesId={clothesId} size={height / 1.15} speed={speed} animated={animated} />;
  }
  return (
    <View style={{ height, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Image source={speciesThumb[species]} style={{ height, width: height, resizeMode: 'contain' }} />
    </View>
  );
}
