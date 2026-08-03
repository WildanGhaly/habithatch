import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { SpeciesDef, spec } from '../domain/catalogs';
import { clothesImg, speciesThumb } from '../assets/registry';
import { Art } from './Art';

// Small header/profile headshot: egg before hatch, the SVG art for fox/penguin/axolotl, and the
// PNG thumbnail for dog/cat — mirrors the prototype's avatarArt() (dog/cat show their glyph, not
// an egg). No breathe idle, no outfit; just the face.
export function PetHeadshot({ species, hatched, size = 54, eggSize }: { species: string; hatched: boolean; size?: number; eggSize?: number }) {
  if (!hatched) return <Art name="eggWhole" height={eggSize ?? size} />;
  const sp = spec(species);
  if (sp.kind === 'svg') return <Art name={sp.art!} height={size} />;
  return <Image source={speciesThumb[species]} style={{ height: size, width: size, resizeMode: 'contain' }} />;
}

// The prototype's .breathe idle (translateY + subtle non-uniform scale), mood-driven duration.
const BREATHE: Record<string, number> = { happy: 2600, content: 3400, tired: 4400, hungry: 5000 };

export function Breathe({ height, moodK = 'content', children }: { height: number; moodK?: string; children: React.ReactNode }) {
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
  return (
    <Animated.View style={{ height, width: '100%', alignItems: 'center', justifyContent: 'flex-end', transform: [{ translateY }, { scaleY }, { scaleX }], opacity: moodK === 'hungry' ? 0.9 : 1 }}>
      {children}
    </Animated.View>
  );
}

// The worn-outfit overlay — matches the prototype wearLayer()/.petoutfit exactly: width =
// wear.w% of the pet art's rendered width, HEIGHT from the outfit PNG's natural aspect (not a
// forced square), horizontally centered over the pet, positioned at wear.t% of the pet height.
// Image.resolveAssetSource exists on native but not react-native-web; fall back to the
// asset object's own width/height (Metro provides it) and finally a sane default.
function assetAspect(src: any, fallback: number): number {
  const ras: any = (Image as any).resolveAssetSource;
  const m = typeof ras === 'function' ? ras(src) : src && typeof src === 'object' ? src : null;
  return m && m.height ? m.width / m.height : fallback;
}

export function OutfitOverlay({ speciesDef, clothesId, height }: { speciesDef: SpeciesDef; clothesId: number; height: number }) {
  if (!clothesId || !clothesImg[clothesId]) return null;
  const src = clothesImg[clothesId];
  const cAspect = assetAspect(src, 1);
  const petAspect = speciesDef.kind === 'svg' ? 100 / 118 : assetAspect(speciesThumb[speciesDef.id], 0.85);
  const petArtW = height * petAspect;
  const outfitW = petArtW * (speciesDef.wear.w / 100);
  const outfitH = outfitW / (cAspect || 1);
  const top = height * (speciesDef.wear.t / 100);
  return (
    <View style={{ position: 'absolute', top, left: 0, right: 0, alignItems: 'center', zIndex: 3 }} pointerEvents="none">
      <Image source={src} style={{ width: outfitW, height: outfitH }} resizeMode="contain" />
    </View>
  );
}

// Static pet body (svg art or PNG thumbnail) + the outfit overlay, wrapped in the breathe idle.
// Used for fox/penguin/axolotl everywhere, and for dog/cat on web (no Lottie).
export function StaticPet({ speciesDef, clothesId, height, moodK }: { speciesDef: SpeciesDef; clothesId: number; height: number; moodK?: string }) {
  return (
    <Breathe height={height} moodK={moodK}>
      <View style={{ height, width: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
        {speciesDef.kind === 'svg'
          ? <Art name={speciesDef.art!} height={height} />
          : <Image source={speciesThumb[speciesDef.id]} style={{ height, width: height, resizeMode: 'contain' }} />}
        <OutfitOverlay speciesDef={speciesDef} clothesId={clothesId} height={height} />
      </View>
    </Breathe>
  );
}
