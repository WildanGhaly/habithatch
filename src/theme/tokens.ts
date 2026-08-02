// Design tokens ported 1:1 from prototype/habithatch_v1.html :root.
// Single source of truth for colors, spacing, radii, shadows, typography.
//
// The prototype ships 5 HabitHatch+ themes that only move the accent family; the
// paper, cards and artwork stay identical. We model that as a BASE palette plus a
// small set of per-theme accent overrides, merged by paletteFor(). See ThemeContext.

export type ThemeId = 'hatch' | 'dusk' | 'forest' | 'ocean' | 'ember';

// The full palette shape. Every screen reads this (via useC()); the values below are
// the free "Hatch" theme, which is also the base every theme overrides on top of.
export interface Palette {
  teal: string;
  teal2: string;
  tealInk: string;
  orange: string;
  orange2: string;
  yellow: string;
  yellow2: string;
  coinInk: string;
  ink: string;
  muted: string;
  cream: string;
  card: string;
  line: string;
  line2: string;
  grass: string;
  sky: string;
  roomBg: string;
  floor: string;
  good: string;
  danger: string;
  pink: string;
  white: string;
  tint: string; // selected-chip wash, themed with the accent
  tint2: string; // cool wash that pairs with --good
  glow: string; // accent drop shadow color
  backdrop: string; // behind the phone frame
  tealShade: string; // the dark "brick" shade under a teal button (proto #072f3d)
  shadowColor: string; // base color for RN elevation shadows (theme-tinted)
}

const BASE: Palette = {
  teal: '#0C4C60',
  teal2: '#12667F',
  tealInk: '#0B2530',
  orange: '#E28A4B',
  orange2: '#C9773A',
  yellow: '#FFDA7C',
  yellow2: '#F4B942',
  coinInk: '#1E4B5F',
  ink: '#2D2F41',
  muted: '#8B897E',
  cream: '#FBF6EC',
  card: '#FFFFFF',
  line: '#EFE6D6',
  line2: '#E4D8C2',
  grass: '#A7C34F',
  sky: '#BFE3F3',
  roomBg: '#A0B559',
  floor: '#DCC79A',
  good: '#1E7F91',
  danger: '#E5654B',
  pink: '#E68FB0',
  white: '#FFFFFF',
  tint: '#FFF7EF',
  tint2: '#E4EFF3',
  glow: 'rgba(226,138,75,0.5)',
  backdrop: '#0b3543',
  tealShade: '#072f3d',
  shadowColor: '#0C4C60',
};

// Per-theme accent overrides. Everything not listed inherits from BASE.
const ACCENTS: Record<Exclude<ThemeId, 'hatch'>, Partial<Palette>> = {
  dusk: {
    teal: '#3E2E5E', teal2: '#5A4487', tealInk: '#241A38', coinInk: '#3E2E5E',
    orange: '#D9628F', orange2: '#BC4E78', tint: '#FDF0F5',
    good: '#7A5FA8', sky: '#DCD2EF', tint2: '#EDE7F6',
    glow: 'rgba(217,98,143,0.5)', tealShade: '#241A38', shadowColor: '#3E2E5E',
  },
  forest: {
    teal: '#1E4632', teal2: '#2F6B49', tealInk: '#132A1F', coinInk: '#1E4632',
    orange: '#D19A2E', orange2: '#B07F1E', tint: '#FBF4E3',
    good: '#3F7D4E', sky: '#CFE4D2', tint2: '#E3EFE4',
    glow: 'rgba(209,154,46,0.5)', tealShade: '#132A1F', shadowColor: '#1E4632',
  },
  ocean: {
    teal: '#123A5C', teal2: '#1D5A82', tealInk: '#0B2135', coinInk: '#123A5C',
    orange: '#2FA0AE', orange2: '#238795', tint: '#E9F6F7',
    good: '#2E8FA8', sky: '#CDE9F3', tint2: '#E1F0F3',
    glow: 'rgba(47,160,174,0.5)', tealShade: '#0B2135', shadowColor: '#123A5C',
  },
  ember: {
    teal: '#4A2A20', teal2: '#6E4032', tealInk: '#2C1710', coinInk: '#4A2A20',
    orange: '#DE5B39', orange2: '#BE452A', tint: '#FDEFEA',
    good: '#A8623F', sky: '#F1D9CC', tint2: '#F5E5DC',
    glow: 'rgba(222,91,57,0.5)', tealShade: '#2C1710', shadowColor: '#4A2A20',
  },
};

export function paletteFor(theme: ThemeId | undefined | null): Palette {
  if (!theme || theme === 'hatch') return BASE;
  const acc = ACCENTS[theme];
  return acc ? { ...BASE, ...acc } : BASE;
}

// Convenience default palette for theme-invariant modules (StyleSheet defaults etc.).
export const colors = BASE;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

export const NAV_H = 74;

// Content column cap: full width on phones, centered + capped on tablets/web.
export const MAX_CONTENT = 440;

// react-native shadow presets approximating the CSS box-shadows (theme-tinted color).
export function shadowCard(c: Palette = BASE) {
  return {
    shadowColor: c.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  };
}
export function shadowSm(c: Palette = BASE) {
  return {
    shadowColor: c.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };
}
// Static presets for the default theme (used by theme-invariant StyleSheets).
export const shadow = {
  card: shadowCard(BASE),
  sm: shadowSm(BASE),
} as const;

// Poppins only ships Regular + Bold; map design weights onto the two families.
export const font = {
  regular: 'Poppins-Regular',
  bold: 'Poppins-Bold',
} as const;

export const fontFor = (weight: 400 | 500 | 600 | 700 | 800): string =>
  weight >= 600 ? font.bold : font.regular;
