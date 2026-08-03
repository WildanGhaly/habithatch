import React from 'react';
import { StaticPet } from './PetParts';
import { spec } from '../domain/catalogs';

// Web companion renderer. Never imports lottie-react-native (its web build pulls an
// uninstalled dep). Every species — including dog/cat — renders the static art (SVG or PNG
// thumbnail) with the breathe idle and the worn-outfit overlay, so outfits show on web too.
export function PetView({
  species, clothesId = 0, height, moodK = 'content',
}: { species: string; clothesId?: number; height: number; speed?: number; moodK?: string; animated?: boolean }) {
  const s = spec(species);
  return <StaticPet speciesDef={s} clothesId={clothesId} height={height} moodK={moodK} />;
}
