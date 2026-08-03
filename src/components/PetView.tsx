import React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { StaticPet } from './PetParts';
import { spec } from '../domain/catalogs';
import { lottiePet } from '../assets/registry';

// The dog/cat Lottie comps carry generous built-in padding, so at a given box height their
// character renders ~15% smaller than the SVG pets and floats a little above the floor shadow.
// Scale each clip up so the animal matches the SVG pets, then nudge it down (negative
// marginBottom) so the feet still land on the shadow. The extra box height overflows the room's
// top (empty padding, clipped harmlessly). Calibrated per comp: cat 1080x1500, dog 1500x1500.
const LOTTIE_FIT: Record<string, { scale: number; drop: number }> = {
  cat: { scale: 1.2, drop: 0.05 },
  dog: { scale: 1.2, drop: 0.1 },
};

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
    const fit = LOTTIE_FIT[species] ?? { scale: 1, drop: 0 };
    const box = height * fit.scale;
    return (
      <View style={{ height, width: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
        <LottieView autoPlay loop speed={speed} source={src} style={{ width: box, height: box, marginBottom: -height * fit.drop }} />
      </View>
    );
  }
  return <StaticPet speciesDef={s} clothesId={clothesId} height={height} moodK={moodK} />;
}
