# Fork guide — the reanimated pet engine (`PetSprite` / `PetView` / `SpeciesThumb`)

Subsystem: the companion renderer. Four files in `src/components/` of Pawductivity:

| File | Role |
|---|---|
| `PetSprite.tsx` | The hand-drawn **SVG** species (fox / penguin / axolotl), fully animated on the reanimated **UI thread** via a `matrix` prop on `<G>`. |
| `PetView.tsx` (native) | The renderer selector + the **Lottie** path for the legacy species (dog / cat / rabbit). |
| `PetView.web.tsx` (web) | Web-only stand-in: sprite species render live, everyone else renders a static PNG thumbnail. Never imports Lottie. |
| `SpeciesThumb.tsx` | Shop / buy-dialog thumbnail: static SVG sprite for the new species, PNG for the Lottie species. |

This subsystem is called out in `PLAN.md §10` as **"Zero changes needed"** for `PetSprite.tsx` and reused-as-is for `PetView`. This guide confirms that, pins down exactly what plugs into it, and lists the two small edits HabitHatch actually needs (a `SPECIES` catalog override and copying the dog/cat Lottie JSON) — none of them inside these four files.

---

## 1. WHAT'S HERE

### `PetSprite.tsx` — the UI-thread SVG engine

The centerpiece. Every moving part animates on the UI thread through **one** `useFrameCallback` clock and a bank of detuned sine oscillators; nothing runs on the JS thread, so motion stays smooth even while a parent re-renders several times a second.

**Public exports**

```ts
// The three SVG (non-Lottie) species this engine draws.
export type SpriteSpecies = 'fox' | 'penguin' | 'axolotl';
export const SPRITE_SPECIES: SpriteSpecies[] = ['fox', 'penguin', 'axolotl'];

// Narrowing type-guard the PetView selectors call to route a species to SVG vs Lottie.
export function isSpriteSpecies(s: string): s is SpriteSpecies;

// The memoized component. React.memo(PetSpriteBase).
export const PetSprite: React.FC<{
  species: SpriteSpecies;
  clothesId?: number;   // 0 = none; 1..5 map to OUTFIT tints (Vest)
  size?: number;        // px; height is size * 1.15
  animated?: boolean;   // default true; false = static rest pose (thumbnails)
  speed?: number;       // mood speed multiplier, clamped to [0.5, 1.8]
}>;
```

**The GProps matrix augmentation (load-bearing).** `react-native-svg`'s public `GProps` type omits the low-level `matrix` escape-hatch, but the JS `<G>` forwards a supplied `matrix` straight to the native codegen prop. The file re-declares the module to add it so worklets can type `animatedProps` without casts:

```ts
declare module 'react-native-svg' {
  interface GProps {
    matrix?: number[];
  }
}
```

**Internal building blocks (all `'worklet'`):**

- `osc(t, period, phase)` — pure sine of the monotonic clock. Reduces `t % period` *before* dividing so double-precision phase stays bit-clean across an all-day idle session. Continuous in position **and** velocity → seamless, no turnaround seam.
- `rotMatrix(deg, px, py)` → `[a,b,c,d,tx,ty]` — rotate `deg` about pivot `(px,py)`. The only animatable native transform on `<G>` is this `matrix` `[a c tx / b d ty / 0 0 1]`; discrete `rotation`/`transform` props are JS-resolved and `useAnimatedProps` would bypass them, so the matrix is built in-worklet.
- `bodyMatrix(sx, sy, deg, px, py)` — non-uniform scale + rotation about a pivot (`T·R·S·T⁻¹`). Drives the volume-preserving breathe and the penguin waddle-rock, pivoted at the feet so the contact shadow never lifts.
- `blinkOpenness(t)` → `0..1` — two detuned gates (3300ms, 5100ms) so blinks never feel metronomic.
- `type Osc = { px, py, a1, p1, ph1, a2?, p2?, ph2? }` — a part's oscillation: primary sine + optional faster 2nd-harmonic for tip-whip / follow-through.
- `usePartProps(clock, animated, o: Osc)` — `useAnimatedProps<GProps>` that rotates a `<G>` about its pivot from the shared clock; holds the neutral rest pose when `!animated`.
- `Vest`, `Eyes` — sub-components. `OUTFIT: Record<number, {fill; accent?}>` tints the vest per `clothesId` (mirrors the shop's 5 outfits).
- `Fox`, `Penguin`, `Axolotl` — the three character bodies. Each declares its own `usePartProps` channels (tail wag + tip-whip, flipper flap at beating periods, gills wafting in opposition, etc.).
- `BODY: Record<SpriteSpecies, Body>` — per-species whole-body idle constants (`bobA/bobP`, `swayA/swayP`, `rockA/rockP`, `breA/breP`). `FEET_X = 50`, `FEET_Y = 106` are the rock/breathe pivot.

**The single clock (the core trick).** `PetSpriteBase` owns one `useSharedValue` clock and a speed shared value, and **accumulates** elapsed frame time (scaled by mood speed) rather than reading absolute `timeSinceFirstFrame`:

```ts
const clock = useSharedValue(0);
const spd = useSharedValue(Math.min(1.8, Math.max(0.5, speed)));
useEffect(() => { spd.value = Math.min(1.8, Math.max(0.5, speed)); }, [speed, spd]);

const tick = useCallback((f: FrameInfo) => {
  'worklet';
  const dt = f.timeSincePreviousFrame;
  clock.value += (dt == null ? 0 : Math.min(dt, 64)) * spd.value; // clamp dt so a GC hitch can't jump the pose
}, [clock, spd]);
const frame = useFrameCallback(tick, false);
useEffect(() => { frame.setActive(!!animated); }, [animated, frame]);
```

Why accumulate: (a) a mood/outfit re-render that re-registers the callback can't zero the clock (`timeSincePreviousFrame` is `null` on the first frame → adds 0); (b) a speed change alters only the *rate* going forward, never rescaling current phase → no teleport when mood tier flips. `tick` is wrapped in `useCallback` so reanimated's `[callback]` effect doesn't unregister/re-register it every render.

Whole-body translation (bob + sway) rides `useAnimatedStyle` on the **outer `Animated.View`** (origin-independent, native-safe); the pivoted breathe + waddle-rock ride `bodyProps` (a `matrix`) on the outer `AnimatedG`. Render shape:

```tsx
<Animated.View style={[{ width: size, height: size * 1.15, alignSelf: 'center' }, floatStyle]}>
  <Svg viewBox="0 0 100 118" width="100%" height="100%">
    <AnimatedG animatedProps={bodyProps}>
      {species === 'fox' && <Fox clock={clock} animated={animated} clothesId={clothesId} />}
      {species === 'penguin' && <Penguin .../>}
      {species === 'axolotl' && <Axolotl .../>}
    </AnimatedG>
  </Svg>
</Animated.View>
```

### `PetView.tsx` (native) — renderer selector + Lottie path

```ts
export function PetView({
  species: Species; clothesId: number; size?: number /*=210*/; speed?: number /*=1*/;
}): JSX.Element
```

Logic, in order: **(1)** if `isSpriteSpecies(species)` → delegate to `<PetSprite .../>` (passing `speed`). **(2)** else compute `clothesKey({ clothesId })` and look up `lottiePet[species][key] ?? lottiePet[species].default`; render `<LottieView autoPlay loop speed={speed} source={...} />`. **(3)** if no Lottie source exists → fall back to the `speciesThumb[species]` PNG `<Image>`. `speed` maps a mood multiplier onto Lottie's playback rate *and* the sprite clock — one control, both renderers.

### `PetView.web.tsx` — web selector (verification only)

Same props (`speed` accepted but unused). Sprite species render live via `<PetSprite>`; everyone else renders the static `speciesThumb` PNG. **Never imports `lottie-react-native`** — its web build pulls an uninstalled dep. Metro resolves this `.web.tsx` over `.tsx` automatically on web.

### `SpeciesThumb.tsx` — shop / buy thumbnail

```ts
export function SpeciesThumb({ species: Species; size?: number /*=78*/; animated?: boolean /*=false*/ }): JSX.Element
```

Sprite species → `<PetSprite animated={animated} />` (static by default — a still rest pose); Lottie species → the `speciesThumb[species]` PNG `<Image>`. Consumed by `ShopScreen` (Companions tab) and `BuySheet`.

---

## 2. HOW IT CONNECTS

**Renderer selection (species → engine).** `Species = 'dog'|'cat'|'rabbit'|'fox'|'penguin'|'axolotl'` (`src/domain/types.ts`). `isSpriteSpecies` splits it: `{fox,penguin,axolotl}` → SVG engine; `{dog,cat,rabbit}` → Lottie/PNG. This is the *only* branch that matters for the fork.

**Inputs the screens feed in.** All five callers pass `pet.species` + `pet.clothesId`; the animated ones pass `speed = moodOf(pet.health).spd`:

```
src/screens/HomeTab.tsx:78      <PetView species={s.pet.species} clothesId={s.pet.clothesId} size={200} speed={mood.spd} />
src/screens/PetTab.tsx:71       <PetView ... size={220} speed={mood.spd} />
src/screens/FocusScreen.tsx:519 <PetView ... speed={moodOf(pet.health).spd} />   // ← focus-only screen; drop in HabitHatch
src/screens/JourneyScreen.tsx:30 <PetView ... size={88} />                        // static (no speed)
src/screens/RecapScreen.tsx:105 <PetView ... size={150} speed={1} />
src/screens/OnboardingScreen.tsx:81 <PetView species={speciesKey} clothesId={0} size={180} />
ShopScreen.tsx:65 / BuySheet.tsx:63  <SpeciesThumb species={...} size={...} />
```

**Mood → speed (the only dynamic input).** `moodOf(health)` in `src/domain/mechanics.ts` returns `{ t, k, spd, bonus }`; `spd` is `1.25 / 1 / 0.7 / 0.6` across the happy/content/tired/hungry health tiers. That number becomes both the Lottie `speed` and the sprite clock's `spd`, clamped to `[0.5, 1.8]` inside `PetSprite`. **This is the sole runtime coupling** between the engine and game state — everything else (species, clothes, size) is static per render.

**Assets (`src/assets/registry.ts`).** `speciesThumb: Record<string, any>` (dog/cat/rabbit PNGs) and `lottiePet: Record<species, Record<'default'|'1'..'5', json>>`. `clothesKey(pet)` returns `String(pet.clothesId)` or `'default'`, keying the worn-outfit Lottie clip. The SVG species have **no** registry entries — their art is inline SVG paths inside `PetSprite.tsx`, and their outfits are the inline `Vest` tints, not PNGs.

**Data flow summary:** `zustand store → pet.{species,clothesId,health} → screen → moodOf(health).spd → PetView → (isSpriteSpecies? PetSprite[UI-thread clock] : LottieView[speed prop])`. The engine reads *nothing* from the store directly; it's a pure presentational leaf.

---

## 3. REUSE VERBATIM

Copy these **unchanged** into HabitHatch `src/components/`:

- **`PetSprite.tsx` — byte-for-byte.** No focus/habit concepts anywhere in it; it's pure geometry + reanimated. The `SpriteSpecies` union (`fox|penguin|axolotl`) is exactly HabitHatch's SVG roster. `PLAN.md §10` explicitly says "Zero changes needed."
- **`PetView.tsx`, `PetView.web.tsx`, `SpeciesThumb.tsx` — unchanged**, provided the two dependencies below are satisfied. They import only `../assets/registry`, `../domain/types` (`Species`), `../domain/mechanics` (`clothesKey`), and each other.

Also reuse verbatim (dependencies of the above, not part of this subsystem but required for it to compile/run):

- `moodOf` / `clothesKey` from `src/domain/mechanics.ts` — the `spd` tiers and clothes-key logic are theme-neutral. (Note: `moodOf`'s tier *thresholds* are 80/40/15; `PLAN.md §7.2` describes mood tiers at 75/45/20 with different color tokens. The **speed multipliers still apply**; if you adopt the PLAN's thresholds, edit `moodOf` in `mechanics.ts` — *not* `PetSprite`. The engine only consumes the resulting number.)
- `babel.config.js` — the worklets plugin wiring (see Gotchas). Reuse as-is.

**Do NOT** hand-port or "simplify" the clock/oscillator math. The `dt`-clamp, the accumulate-don't-read-absolute design, the `useCallback` stable tick, and the pre-modulo phase reduction each fix a specific reviewer-flagged bug and are commented as such. Copy the whole file.

---

## 4. CHANGE FOR HABITHATCH

**None of the four engine files change.** All HabitHatch-specific work happens in the *inputs* they read. Concretely:

### 4a. `SPECIES` catalog override (the one required economy edit)

`PLAN.md §10` calls for a **5-species** roster (rabbit removed — HabitHatch has no rabbit art) with re-set premium flags. This lives in `src/domain/catalogs.ts`, **not** in any engine file. Pawductivity ships:

```ts
// Pawductivity (6 species, rabbit premium, axolotl free) — DO NOT ship as-is:
export const SPECIES: SpeciesItem[] = [
  { id: 1, key: 'dog', name: 'Dog', price: 500, premium: false },
  { id: 2, key: 'cat', name: 'Cat', price: 800, premium: false },
  { id: 3, key: 'rabbit', name: 'Rabbit', price: 1200, premium: true },   // ← remove: no art
  { id: 4, key: 'fox', name: 'Fox', price: 1600, premium: false },
  { id: 5, key: 'penguin', name: 'Penguin', price: 2400, premium: false },
  { id: 6, key: 'axolotl', name: 'Axolotl', price: 3600, premium: false }, // ← must become premium
];
```

HabitHatch override (per `PLAN.md §9/§10`: dog/cat free starters, fox/penguin coin free-unlock, axolotl HabitHatch+):

```ts
export const SPECIES: SpeciesItem[] = [
  { id: 1, key: 'dog',     name: 'Dog',     price: 0,    premium: false }, // starter
  { id: 2, key: 'cat',     name: 'Cat',     price: 0,    premium: false }, // starter
  { id: 3, key: 'fox',     name: 'Fox',     price: 1600, premium: false }, // coin free-unlock
  { id: 4, key: 'penguin', name: 'Penguin', price: 2400, premium: false }, // coin free-unlock
  { id: 5, key: 'axolotl', name: 'Axolotl', price: 3600, premium: true  }, // HabitHatch+
];
```

Removing `rabbit` from `SPECIES` keeps the reused Shop "Companions" tab (which maps over `SPECIES` via `SpeciesThumb`) from surfacing an unshippable rabbit. **Leave the `Species` union in `types.ts` alone** — `'rabbit'` can stay in the type; it simply never appears in the catalog, so no screen ever renders it. `speciesThumb.rabbit` and `lottiePet.rabbit` in the registry can stay or be pruned; they're dead once `SPECIES` drops the row.

### 4b. Ship the dog/cat Lottie JSON (the one asset dependency)

The engine renders dog/cat through Lottie. `PLAN.md §10/§11`: copy their clips into `assets/reused/lottie/{dog,cat}/` (one per growth stage / clothes key) and keep `lottiePet.{dog,cat}` populated in `registry.ts`. Prune `lottiePet.rabbit` and the rabbit thumbnail if you like. **If a Lottie source is missing, `PetView` silently falls back to the PNG thumbnail** — acceptable but not the intended animated hatch, so verify the JSON actually resolves.

### 4c. Wiring the engine to the new data model (caller-side, not engine-side)

HabitHatch's new tables (`habits`, `habit_logs`, `day_summary`, `garden_plots` + the `pet`/`profile` `ALTER`s from `PLAN.md §6`) feed the engine only through the same two derived values it already consumes:

- **`speed`** — still `moodOf(pet.health).spd`. HabitHatch's health is driven by **per-day decay + habit-set restore** (`PLAN.md §7.2`) and `day_summary.health_end` instead of focus-session nourish, but the engine is agnostic: give it a health-derived `spd` and it animates. No engine change.
- **`species` + hatch gating.** `pet` gains `hatch_state ('egg'|'crack'|'hatched')`, `hatch_progress (0..3)`, and a `species` chosen at onboarding, revealed at hatch (`PLAN.md §6/§7.4`). **`PetView`/`PetSprite` render the companion only in the `hatched` state.** Pre-hatch, the caller (Companion screen / Nursery overlay) renders the **egg SVGs** (`egg-whole/crack/hatch.svg`) instead of `PetView` — a new sibling component, *not* a modification of this engine. Once `hatch_state === 'hatched'`, mount `<PetView species={pet.species} clothesId={pet.clothesId} speed={moodOf(pet.health).spd} />` exactly as Pawductivity does.
- **Growth stages** (`PLAN.md §7.3`: gated on overall best streak, not minutes) select which Lottie clip / are cosmetic for the SVG species. The SVG engine draws all 5 stages from the same paths (stage isn't a `PetSprite` input today); if you want per-stage SVG scale, that's a *new* prop you'd add later — MVP doesn't need it, and `PLAN.md §10` states the SVG engine "renders … across all 5 stages" without change.

### 4d. Reframed copy / focus→habit swaps

The engine has **no user-facing copy**. The focus→habit swaps that touch its callers:

- **Drop `FocusScreen.tsx`'s `PetView`** entirely (the focus timer screen is stripped per `PLAN.md §13 Week 1`). Its `speed={moodOf(pet.health).spd}` usage is the template for the other screens.
- **`JourneyScreen` → Habit Garden.** The screen is reframed (`PLAN.md §7.5`) but its `<PetView ... size={88} />` header call is copied verbatim.
- **`HomeTab` (Today), `PetTab` (Companion), `RecapScreen`, `OnboardingScreen`** keep their `PetView`/`SpeciesThumb` calls unchanged except that Onboarding now previews the chosen species behind an **egg** framing (the species is picked but the companion is revealed only at hatch).

**Net:** the fork touches `catalogs.ts` (SPECIES), the registry (Lottie copy/prune), and caller screens (egg-vs-companion gating). The four engine files are copied unchanged.

---

## 5. GOTCHAS

1. **The `GProps` matrix augmentation is mandatory and must travel with the file.** `react-native-svg`'s public `GProps` has no `matrix`; the `declare module 'react-native-svg'` block adds it. Drop it and every `useAnimatedProps<GProps>(() => ({ matrix: ... }))` fails to type-check. It's an *ambient* augmentation — it must be in a file that's part of the TS program (it is, being in `PetSprite.tsx`). Don't move it to a `.d.ts` that `tsconfig` might exclude.

2. **Fabric / reanimated 4: `matrix` is the ONLY animatable native transform on `<G>`.** The discrete `rotation` / `originX` / `transform` props are resolved to a matrix at the JS layer, which `useAnimatedProps` bypasses — animating them from a worklet does nothing. That's why the file builds `[a,b,c,d,tx,ty]` in-worklet via `rotMatrix`/`bodyMatrix`. Layout matrix convention is `[a c tx / b d ty / 0 0 1]` → `(x,y) ↦ (a·x + c·y + tx, b·x + d·y + ty)`. Whole-body *translation* deliberately rides `useAnimatedStyle` on the outer `Animated.View` instead (origin-independent and native-safe); only pivoted scale/rotate use the `matrix`.

3. **Babel: do NOT add the reanimated/worklets plugin manually.** `babel.config.js`:

   ```js
   // babel-preset-expo (SDK 57) auto-appends react-native-worklets/plugin when the
   // package is installed (required by reanimated 4). Do NOT add it again, or it double-applies.
   module.exports = (api) => { api.cache(true); return { presets: ['babel-preset-expo'] }; };
   ```
   Every `'worklet'` directive (`osc`, `rotMatrix`, `bodyMatrix`, `blinkOpenness`, `tick`, and all the `useAnimatedProps`/`useAnimatedStyle` bodies) depends on this transform. If HabitHatch's `babel.config.js` is regenerated by `expo init`, re-verify the preset is present and the worklets plugin is **not** duplicated — a double-apply silently breaks worklets at runtime.

4. **Keep the clock accumulate-don't-read-absolute design.** `clock.value += clampedDt * spd.value` (dt clamped to ≤64ms). Two bugs this prevents: a re-register can't zero the clock (`timeSincePreviousFrame` is `null` on the first frame → add 0), and a `speed` change never rescales existing phase (no teleport on mood-tier flip). The `t % period` reduction happens *before* the divide so phase stays bit-clean over an all-day idle. Don't "optimize" any of this away.

5. **`speed` is clamped to `[0.5, 1.8]` inside `PetSprite`.** `moodOf` returns up to `1.25`, well inside range. If HabitHatch retunes mood speeds (e.g. faster "happy"), values outside the clamp are silently capped — widen the clamp in `PetSprite` if you intend >1.8.

6. **SQLite is a single-document snapshot, debounced — not per-table rows.** Persistence (`src/db/persistence.ts`) stores the *entire* `AppState` as one JSON blob in a `kv(key,value)` table (`INSERT OR REPLACE`, key `'app_state'`); web uses `localStorage`. Writes are **debounced 250ms** in the store (`scheduleSave`). Consequences for the fork:
   - The `PLAN.md §6` `CREATE TABLE habits/...` DDL is **conceptual schema for the in-memory `AppState` shape**, not literal SQLite tables — everything still flushes through the one `kv` blob. Add `habits`/`habitLogs`/`daySummary`/`gardenPlots` as fields on `AppState` and they persist automatically.
   - A change (e.g. equipping an outfit → new `clothesId` → engine re-renders) is **not durable for up to 250ms**. Fine for animation, but if a test kills the app immediately after a mutation, the last change can be lost. Flush on background if you need tighter guarantees.
   - `hydrate()` in `store.ts` **backfills missing slices from `freshState()`** so an older saved state never leaves a slice `undefined`. When you add the new HabitHatch slices, extend that migration merge (`pet: { ...def.pet, ...loaded.pet }`, etc.) or a state saved before the new fields existed will read them as `undefined` and crash a screen that spreads them.

7. **SVG consumption / `react-native-svg` version.** The engine draws with `Svg, Path, Circle, Ellipse, G, Rect` and `Animated.createAnimatedComponent(G)`. Pin the same `react-native-svg` (15.15.4) + `react-native-reanimated` (4.5.0) the matrix-forwarding behavior was verified against; the `<G matrix>` forwarding is an implementation detail of `react-native-svg`'s `elements/G.js` and could change across majors. The new species' **art is inline SVG paths**, not asset files — there are no fox/penguin/axolotl PNGs or SVGs to bundle for the animated render (the `pets/*.svg` in `PLAN.md §11` and the `speciesThumb` PNGs are picker thumbnails only). Their outfits are the inline `Vest` tints keyed by `clothesId` (1..5), independent of the wardrobe PNGs.

8. **Web build must never import Lottie.** `PetView.web.tsx` exists solely because `lottie-react-native`'s web build pulls an uninstalled dep. Keep the `.web.tsx` split; if you consolidate `PetView`, web verification breaks at bundle time. Web renders sprite species live and everyone else as a static PNG — dog/cat animation is native-only, which is expected (web is verification-only).

9. **`PetSprite` is `React.memo`'d on purpose.** Callers (Today/Home) can re-render frequently; the memo keeps the React tree quiet while motion runs on the UI thread regardless. Don't pass it a fresh inline object/array prop that would defeat the memo — current props are all primitives (`species`, `clothesId`, `size`, `animated`, `speed`), keep them that way.
