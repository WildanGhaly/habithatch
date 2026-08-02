// Catalog data — transcribed verbatim from prototype/habithatch_v1.html. Pure data
// (numbers/strings only, no art imports) so the domain stays testable in Node.
// Art keys (`art`, `ic`, `img`) are resolved against the art/icon registries at render.

import { CategoryId, ScheduleKind, SpeciesId } from './types';
import { ThemeId } from '../theme/tokens';

export interface Category { id: CategoryId; name: string; hint: string }
export const CATS: Category[] = [
  { id: 'water', name: 'Water', hint: 'Hydration' },
  { id: 'exercise', name: 'Exercise', hint: 'Strength' },
  { id: 'read', name: 'Read', hint: 'Books' },
  { id: 'meditate', name: 'Meditate', hint: 'Calm' },
  { id: 'run', name: 'Move', hint: 'Cardio' },
  { id: 'hygiene', name: 'Hygiene', hint: 'Self-care' },
  { id: 'nophone', name: 'No phone', hint: 'Focus' },
  { id: 'wake', name: 'Wake early', hint: 'Mornings' },
  { id: 'sleep', name: 'Sleep', hint: 'Rest' },
  { id: 'medicine', name: 'Medicine', hint: 'Health' },
  { id: 'custom', name: 'Your own', hint: 'Anything' },
];
export const catOf = (id: string): Category => CATS.find((c) => c.id === id) || CATS[CATS.length - 1];

// Species: HabitHatch override of the reused roster (no rabbit art, 5 species).
// wear: garment width and shoulder line as a % of the body's art box.
export interface SpeciesDef {
  id: SpeciesId;
  name: string;
  price: number;
  premium: boolean;
  kind: 'img' | 'svg';
  img?: string; // registry img key when kind==='img'
  art?: string; // ART key when kind==='svg'
  meta: string;
  wear: { w: number; t: number };
}
export const SPECIES: SpeciesDef[] = [
  { id: 'dog', name: 'Dog', price: 0, premium: false, kind: 'img', img: 'dogThumb', meta: 'Loyal and easygoing', wear: { w: 58, t: 59 } },
  { id: 'cat', name: 'Cat', price: 0, premium: false, kind: 'img', img: 'catThumb', meta: 'Curious and cozy', wear: { w: 56, t: 57 } },
  { id: 'fox', name: 'Fox', price: 600, premium: false, kind: 'svg', art: 'fox', meta: 'Clever and quick', wear: { w: 54, t: 60 } },
  { id: 'penguin', name: 'Penguin', price: 900, premium: false, kind: 'svg', art: 'penguin', meta: 'Steady and social', wear: { w: 54, t: 58 } },
  { id: 'axolotl', name: 'Axolotl', price: 1200, premium: true, kind: 'svg', art: 'axolotl', meta: 'Rare and unbothered', wear: { w: 46, t: 58 } },
];
export const spec = (id: string): SpeciesDef => SPECIES.find((s) => s.id === id) || SPECIES[0];

export interface FoodDef { id: number; name: string; price: number; heal: number; premium: boolean; img: string }
export const FOODS: FoodDef[] = [
  { id: 1, name: 'Apple', price: 5, heal: 10, premium: false, img: 'apple' },
  { id: 2, name: 'Chicken', price: 5, heal: 10, premium: false, img: 'chicken' },
  { id: 3, name: 'Pizza', price: 15, heal: 20, premium: true, img: 'pizza' },
  { id: 4, name: 'Watermelon', price: 8, heal: 10, premium: false, img: 'watermelon' },
  { id: 5, name: 'Carrot', price: 10, heal: 15, premium: false, img: 'carrot' },
];

export interface ClothesDef { id: number; name: string; price: number; premium: boolean; img: string }
export const CLOTHES: ClothesDef[] = [
  { id: 1, name: 'Cyan T-shirt', price: 80, premium: false, img: 'c1' },
  { id: 2, name: 'Green Shirt', price: 150, premium: false, img: 'c2' },
  { id: 3, name: 'Tuxedo', price: 320, premium: true, img: 'c3' },
  { id: 4, name: 'Star Shirt', price: 250, premium: true, img: 'c4' },
  { id: 5, name: 'Pink Dress', price: 400, premium: true, img: 'c5' },
];

// Habit Garden — the Journey reframe (PLAN.md §7.5). Each plot costs coins and grants
// a lasting perk; the perk fields (perCheck/cap/decay/allClear/rate/all/freeze) are
// summed by perks() in mechanics.
export interface GardenPlot {
  id: string;
  name: string;
  desc: string;
  cost: number;
  perk: string;
  ic: string; // Icon name for the scroll row
  art: string; // ART key for the plot scene
  perCheck?: number;
  cap?: number;
  decay?: number;
  allClear?: number;
  rate?: number;
  all?: number;
  freeze?: boolean;
  final?: boolean;
}
export const GARDEN: GardenPlot[] = [
  { id: 'sprout', name: 'First Sprout', desc: 'Your very first seedling', cost: 120, perk: '+1 coin per check-off', ic: 'bolt', art: 'gSprout', perCheck: 1 },
  { id: 'herbs', name: 'Herb Patch', desc: 'Something to snack on', cost: 300, perk: 'Idle jar cap +50', ic: 'leaf', art: 'gSprout', cap: 50 },
  { id: 'can', name: 'Watering Can', desc: 'Keeps the whole plot alive', cost: 550, perk: 'Health drops 2 slower / day', ic: 'shield', art: 'gSprout', decay: 2 },
  { id: 'berry', name: 'Berry Bush', desc: 'Sweet reward for a full day', cost: 900, perk: '+10% coins on all-clear days', ic: 'heart', art: 'gSprout', allClear: 0.1 },
  { id: 'sapling', name: 'Young Sapling', desc: 'Small tree, big shelter', cost: 1400, perk: '1 Streak Freeze every week', ic: 'sprout', art: 'gTree', freeze: true },
  { id: 'flowers', name: 'Flower Bed', desc: 'The garden starts to bloom', cost: 2100, perk: 'Jar cap +100 and forage +25%', ic: 'sparkle', art: 'gTree', cap: 100, rate: 0.25 },
  { id: 'fruit', name: 'Fruit Tree', desc: 'Shade, fruit, and a full belly', cost: 3200, perk: 'Health drops 2 slower again', ic: 'trophy', art: 'gTree', decay: 2 },
  { id: 'orchard', name: 'Orchard', desc: 'The garden, fully grown', cost: 4800, perk: '+20% coins everywhere', ic: 'crown', art: 'gOrchard', all: 0.2, final: true },
];

export interface ThemeDef { id: ThemeId; name: string; premium: boolean; sw: [string, string] }
export const THEMES: ThemeDef[] = [
  { id: 'hatch', name: 'Hatch', premium: false, sw: ['#0C4C60', '#E28A4B'] },
  { id: 'dusk', name: 'Dusk', premium: true, sw: ['#3E2E5E', '#D9628F'] },
  { id: 'forest', name: 'Forest', premium: true, sw: ['#1E4632', '#D19A2E'] },
  { id: 'ocean', name: 'Ocean', premium: true, sw: ['#123A5C', '#2FA0AE'] },
  { id: 'ember', name: 'Ember', premium: true, sw: ['#4A2A20', '#DE5B39'] },
];

// 12 achievements (PLAN.md §7.6). rarity 1=common 2=rare 3=legendary. `art`/`ic`/`img`
// pick the badge glyph source.
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  ic?: string;
  art?: string;
  img?: string;
  rar: 1 | 2 | 3;
  group: string;
}
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_crack', name: 'First Crack', desc: 'Check off your first habit ever', ic: 'check', rar: 1, group: 'Getting started' },
  { id: 'alive', name: "It's Alive!", desc: 'Hatch your companion', art: 'eggHatch', rar: 2, group: 'Getting started' },
  { id: 'green_thumb', name: 'Green Thumb', desc: 'Plant your first Garden plot', ic: 'sprout', rar: 1, group: 'Getting started' },
  { id: 'stacker', name: 'Habit Stacker', desc: 'Keep 5 habits alive on the same day', ic: 'note', rar: 1, group: 'Getting started' },
  { id: 'week', name: 'Week Warrior', desc: 'Reach a 7 day streak', art: 'flame', rar: 1, group: 'Streaks' },
  { id: 'perfect', name: 'Perfect Week', desc: '7 all-clear days in a row', ic: 'target', rar: 2, group: 'Streaks' },
  { id: 'iron', name: 'Iron Month', desc: 'Reach a 30 day streak', art: 'flame', rar: 2, group: 'Streaks' },
  { id: 'centurion', name: 'Centurion', desc: 'Reach a 100 day streak', ic: 'crown', rar: 3, group: 'Streaks' },
  { id: 'comeback', name: 'Comeback', desc: 'Build a new 7 day streak after losing one', ic: 'pulse', rar: 2, group: 'Care and growth' },
  { id: 'wellfed', name: 'Well-Fed', desc: 'Keep health at 75+ for 10 days', ic: 'heart', rar: 2, group: 'Care and growth' },
  { id: 'bloom', name: 'Full Bloom', desc: 'Plant every Garden plot', ic: 'trophy', rar: 3, group: 'Care and growth' },
  { id: 'farmer', name: 'Coin Farmer', desc: 'Earn 10,000 coins in total', img: 'coin', rar: 3, group: 'Care and growth' },
];

export const STAGES = ['Baby', 'Young', 'Grown', 'Prime', 'Legend'];
export const STAGE_GATE = [0, 7, 21, 50, 100]; // overall best streak needed per stage
export const SCHEDULES: [string, ScheduleKind][] = [
  ['Daily', 'daily'],
  ['Weekdays', 'weekdays'],
  ['X / week', 'weekly'],
];
export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WD1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const SEED_DAYS = 56;
