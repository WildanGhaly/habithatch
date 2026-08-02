// Static asset registry. RN requires literal require() calls, so every raster/lottie/font
// asset is enumerated here and referenced by a logical key elsewhere. SVG art is handled
// separately (inlined strings in src/art, rendered via SvgXml).

export const img = {
  // currency / ui
  coin: require('../../assets/coin.png'),
  lock: require('../../assets/lock.png'),
  potion: require('../../assets/potion.png'), // Streak Freeze token
  shop: require('../../assets/shop-icon.png'),
  food: require('../../assets/food.png'),
  wardrobe: require('../../assets/wardrobe.png'),
  petIcon: require('../../assets/pet.png'),
  // brand (placeholder — swap for a HabitHatch egg mark)
  logo: require('../../assets/icon/logo-paw.png'),
  logoGlow: require('../../assets/images/logo-glow.png'),
  // food (legacy indonesian filenames)
  apple: require('../../assets/food/apel.png'),
  chicken: require('../../assets/food/ayam.png'),
  pizza: require('../../assets/food/pizza.png'),
  watermelon: require('../../assets/food/semangka.png'),
  carrot: require('../../assets/food/wortel.png'),
  // clothes (id order = catalog order)
  c1: require('../../assets/clothes/shirt.png'),
  c2: require('../../assets/clothes/polo_shirt.png'),
  c3: require('../../assets/clothes/suit.png'),
  c4: require('../../assets/clothes/emo_shirt.png'),
  c5: require('../../assets/clothes/dress.png'),
  // pet thumbnails (dog/cat picker glyphs)
  catThumb: require('../../assets/pet/cat.png'),
  dogThumb: require('../../assets/pet/dog.png'),
  // room backdrop
  petHome: require('../../assets/pet/pet_home.png'),
  referralBg: require('../../assets/referral_background.png'),
} as const;

export type ImgKey = keyof typeof img;

// profile avatars 0..6
export const avatars = [
  require('../../assets/profile/0.png'),
  require('../../assets/profile/1.png'),
  require('../../assets/profile/2.png'),
  require('../../assets/profile/3.png'),
  require('../../assets/profile/4.png'),
  require('../../assets/profile/5.png'),
  require('../../assets/profile/6.png'),
];

// food images by catalog id
export const foodImg: Record<number, any> = {
  1: img.apple,
  2: img.chicken,
  3: img.pizza,
  4: img.watermelon,
  5: img.carrot,
};

// clothes images by catalog id
export const clothesImg: Record<number, any> = {
  1: img.c1,
  2: img.c2,
  3: img.c3,
  4: img.c4,
  5: img.c5,
};

export const speciesThumb: Record<string, any> = {
  dog: img.dogThumb,
  cat: img.catThumb,
};

// Lottie pet animations: [species][key] where key = 'default' | '1'..'5' (worn clothes id).
export const lottiePet: Record<string, Record<string, any>> = {
  cat: {
    default: require('../../assets/pet/cat/cat_default.json'),
    '1': require('../../assets/pet/cat/cat_1.json'),
    '2': require('../../assets/pet/cat/cat_2.json'),
    '3': require('../../assets/pet/cat/cat_3.json'),
    '4': require('../../assets/pet/cat/cat_4.json'),
    '5': require('../../assets/pet/cat/cat_5.json'),
  },
  dog: {
    default: require('../../assets/pet/dog/dog_default.json'),
    '1': require('../../assets/pet/dog/dog_1.json'),
    '2': require('../../assets/pet/dog/dog_2.json'),
    '3': require('../../assets/pet/dog/dog_3.json'),
    '4': require('../../assets/pet/dog/dog_4.json'),
    '5': require('../../assets/pet/dog/dog_5.json'),
  },
};

export const fonts = {
  'Poppins-Regular': require('../../assets/Poppins-Regular.ttf'),
  'Poppins-Bold': require('../../assets/Poppins-Bold.ttf'),
};

// Resolve an image key from a catalog `img` string (used by Food/Clothes cards).
export function imgFor(key: string | undefined): any {
  if (!key) return undefined;
  return (img as Record<string, any>)[key];
}
