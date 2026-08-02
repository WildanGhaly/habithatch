# Fork Guide — Reusable UI primitives (`src/components/*` + asset registry)

Source repo: `d:/Documents/Work/Project/Pawductivity`
Files covered:
`src/components/ui.tsx`, `Icon.tsx`, `BottomSheet.tsx`, `CoinPile.tsx`, `Toast.tsx`,
`QuestRow.tsx`, and `src/assets/registry.ts`.
Supporting files referenced: `src/theme/tokens.ts`, `src/domain/types.ts`,
`src/domain/mechanics.ts`, `src/domain/catalogs.ts`, `src/store/store.ts`,
`src/db/persistence.ts`, `src/components/PetSprite.tsx`, `babel.config.js`.

These are the **already-ported React-Native primitives** (not prototype HTML). They are the
shared vocabulary every screen composes from. For HabitHatch the rule of thumb is: the
*container/primitive* layer (`ui.tsx`, `BottomSheet`, `Toast`, `CoinPile`) copies **verbatim**;
the *content* layer (`Icon`'s icon set, `QuestRow`→`HabitRow`, `registry.ts`'s asset list)
gets reshaped. This maps to the PLAN's "~80% reused / 20% new" split (PLAN §12).

---

## 1. WHAT'S HERE

### `ui.tsx` — the primitive kit (Button/Card/Chip/Text/layout)
Pure presentational components, all reading `theme/tokens.ts`. No store, no domain logic.
Only external asset is `img.coin` (for `CoinPill`).

| Export | Signature | Responsibility |
|---|---|---|
| `Bounded` | `({ children, pad?: boolean, style? }) ` | Width-capped, centered content column. `maxWidth = pad ? MAX_CONTENT+32 : MAX_CONTENT` (`MAX_CONTENT=600`); `pad` adds `paddingHorizontal:16`. Full-width on phones, centered on tablets/Chromebooks. |
| `Txt` | `(TextProps & { weight?: 400\|500\|600\|700\|800; color?: string; size?: number; style?; children? })` | The **only** text component. Always Poppins via `fontFor(weight)` — `weight >= 600 → Poppins-Bold`, else `Poppins-Regular` (only two ttf are shipped). Defaults `color=colors.ink, size=14`. |
| `Btn` | `({ title, onPress?, variant?: 'orange'\|'teal'\|'ghost', block?, disabled?, sm?, style?, left? })` | The signature 3D "brick" button: a colored shade (`BTN_SHADE`) sits under the face (`BTN_FACE`); pressing translates the face down onto it (`translateY: lip-2`). `ghost` = transparent face + teal text + 1.5px border. `left` slots an icon before the title. |
| `Card` | `({ children, style?, onPress? })` | White rounded surface (`radius.lg`, `colors.line` border, `shadow.card`). Wraps in a `Pressable` (dims to `opacity:0.97`) only when `onPress` is given. |
| `CoinPill` | `({ amount: number, style? })` | Coin image (22×22) + `amount.toLocaleString('en-US')` in a pill. The header currency chip. |
| `Chip` | `({ label: string, color?: string })` | Small cream pill with a `weight={600} size={11.5}` label (default teal). |

Internal maps:
```ts
type BtnVariant = 'orange' | 'teal' | 'ghost';
const BTN_FACE:  Record<BtnVariant,string> = { orange: colors.orange, teal: colors.teal,  ghost: colors.white  };
const BTN_SHADE: Record<BtnVariant,string> = { orange: colors.orange2, teal: '#072f3d',   ghost: colors.line2  };
```

### `Icon.tsx` — inline-SVG icon renderer
A closed **string-map of icon geometry**, rendered through `react-native-svg`'s `SvgXml`.
No `.svg` files are imported anywhere; each icon is an inline path fragment.

```ts
type Kind = 'stroke' | 'fill';
const ICONS: Record<string, [Kind, string]> = {
  clock:  ['stroke', '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>'],
  flame:  ['fill',   '<path d="M12.8 2.4c.4 2.7 ... z"/> ...'],
  // ... 41 entries total
};
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 16, color = colors.ink, strokeWidth = 2 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  const [kind, inner] = ICONS[name];
  const attrs = kind === 'stroke'
    ? `fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="currentColor" stroke="none"`;
  const xml = `<svg viewBox="0 0 24 24" ${attrs}>${inner}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} color={color} />;
}
```
Key mechanic: color is applied via `currentColor` in the XML, resolved by `SvgXml`'s
`color` prop. `stroke` icons are outlines; `fill` icons are solids.

The **41 shipped keys** are:
`clock, calendar, repeat, flame, check, checkCircle, bolt, heart, note, play, pause, reset,
plus, chevL, chevR, bell, sound, edit, gift, shield, offline, download, trash, chat, crown,
sparkle, sprout, trophy, target, bag, shirt, lock`.
Notably present for the fork: **all seven Garden `ic` keys** (`heart, shield, bolt, sparkle,
trophy, note, crown` — PLAN §7.5) and `flame, checkCircle, sprout, target, bell, plus`.

### `BottomSheet.tsx` — slide-up modal sheet
```ts
export function BottomSheet({ visible, onClose, title?, subtitle?, children,
  align?: 'center' | 'left' }): JSX.Element | null
```
An `Animated`-driven sheet (not RN `Modal`'s built-in fade). One `Animated.Value(0→1)`:
scrim opacity fades while the dialog `translateY` interpolates from `H` (window height) to `0`
on open, and reverses on close. Keeps an internal `render` flag so the exit animation finishes
before unmount. `useNativeDriver: true`. Respects `useSafeAreaInsets().bottom`. Content lives in
a non-bouncing `ScrollView`. Grip handle + optional teal title + muted subtitle. This is the
host for every dialog: Habit Editor, Feed, Buy, Goal (PLAN §5).

### `CoinPile.tsx` — idle-jar coin overlay
```ts
export function CoinPile({ pending: number }): JSX.Element | null   // null when pending<=0
```
Absolute-fill, `pointerEvents="none"` overlay (taps fall through to the room's collect
handler). Shows `n = min(12, max(1, ceil(pending / 3)))` coins from a fixed 12-slot
`COIN_SPOTS` table (`{ l, b, s, r }` = left%, bottom, size, rotation). Each `PileCoin` pops in
(staggered `delay: index*50`, scale 0.5→1 + rise) then bobs forever (`Animated.loop`, 1300ms
each way). A `pileBadge` reads `"{pending} · tap to collect"`. All native-driver.

### `Toast.tsx` — global transient toast
```ts
export function Toast(): JSX.Element | null
```
Subscribes to `useStore((s) => s.toast)`. On a new `toast`, fades/springs a pill in, holds
**2200 ms**, fades out. Optional coin image when `toast.coin` is set. Fully store-driven — see
§2. Purely a renderer; the message is pushed by `showToast(text, coin?)`.

### `QuestRow.tsx` — the row to reshape into `HabitRow`
```ts
export function QuestRow({ quest: Quest, startHere?: boolean, onStart: (id: number) => void })
```
Renders one focus-quest as a **progress ring + title + meta + play button**:
- Ring: `pct = round(quest.done / quest.est * 100)`, drawn with two `<Circle>`s
  (grey track + teal arc via `strokeDasharray`/`strokeDashoffset`, `rotate(-90 23 23)`).
  When `isDone(quest)` → solid green circle + white `check` icon.
- Meta row: category dot colored by `catColors[quest.tag]`, `clock` + `fmt(quest.est)`, and
  either `repeat`+`quest.rlabel` or `calendar`+`quest.due`.
- A teal `play` button (40×40) on the right when not done.
Depends on `Quest` (types), `fmt`/`isDone` (mechanics), `catColors` (tokens), `Icon`.

### `registry.ts` — the static asset registry
RN's bundler requires **literal `require()` calls**, so every asset is enumerated here and
referenced by logical name. Exports:
- `img` — `as const` object of PNGs (coin, lock, potion, shop, food, wardrobe, brand logos,
  5 foods, 5 clothes, pet thumbnails, room backgrounds, nav icons).
- `avatars: any[]` (0..6) and `avatarSrc(avatar, custom?)` — resolves `{uri}` for a custom
  photo (`avatar === -1`) else the built-in.
- `foodImg` / `clothesImg` — `Record<number, source>` keyed by catalog id.
- `speciesThumb: Record<string, source>` — `dog/cat/rabbit` picker thumbnails.
- `lottiePet: Record<species, Record<'default'|'1'..'5', json>>` — Lottie clips per species per
  worn-clothes key. Only the **JSON is required here**; the animation plays through `PetView`.
- `fonts` — `Poppins-Regular` / `Poppins-Bold` ttf.
- `soundscapes: Record<number, wav>` — focus ambiences (drops in HabitHatch MVP; PLAN §10).

Two distinct SVG-consumption paths already exist and matter for the fork:
1. **Inline XML string** → `SvgXml` (`Icon.tsx`). Geometry lives in JS, not files.
2. **Hand-built `<Svg><Path/>…`** on the UI thread (`PetSprite.tsx`) for fox/penguin/axolotl.
`registry.ts` requires **no `.svg` files at all** — PNG/JSON/ttf/wav only.

---

## 2. HOW IT CONNECTS

```
theme/tokens.ts ──colors/radius/shadow/fontFor/MAX_CONTENT──┐
                                                            ▼
assets/registry.ts ──img.coin──► ui.tsx (Btn/Card/Chip/Txt/CoinPill/Bounded)
        │  img.coin                    ▲        ▲
        │                              │        │ (Txt, Icon)
        ├──► CoinPile ─img.coin        │        │
        ├──► Toast ─img.coin ◄─────────┼── store.toast (useStore selector)
        │                              │
Icon.tsx (ICONS map) ─Icon──► QuestRow ─┘  ─fmt/isDone (mechanics), catColors (tokens),
                                            Quest (types), onStart→openOverlay('focus')

store.ts ─ showToast(text,coin) ─set({toast})─► Toast renders
         └ mutate(fn) ─immer─► scheduleSave (250ms debounce) ─► persistence.save(state)
persistence.ts ─ expo-sqlite kv table (native) / localStorage (web); JSON snapshot of AppState
```

- **Toast is the one component wired to the store.** `store.showToast(text, coin?)` does
  `set({ toast: { id: toastSeq++, text, coin } })`; the `id` bump re-fires the effect even for
  identical text. Every gameplay action (`collectIdle`, `feed`, `buyFood`, `buildMilestone`,
  achievement grants…) calls `showToast`. Everything else in this set is pure props.
- **Persistence is a whole-document snapshot, not tables.** `mutate` produces the next state
  via immer, grants achievements, then `scheduleSave` debounces 250 ms and calls
  `persistence.save(state)` which does `INSERT OR REPLACE INTO kv (key,value)` with
  `JSON.stringify(state minus tab)`. There is **one row** (`key='app_state'`). The `habits /
  habit_logs / day_summary / garden_plots` "tables" in PLAN §6 are the *conceptual* schema;
  physically they live inside that JSON blob unless you deliberately move to real tables.
- **`Btn`/`Card`/`Bounded`** are composed by every screen shell; `CoinPill` sits in the header;
  `Chip` labels tags. `QuestRow` is composed by the Quests/Today lists and calls back
  `onStart(id)` (which opens the Focus overlay).

---

## 3. REUSE VERBATIM

Copy these **unchanged** into `habithatch/src/components` (only the import of `tokens`/`registry`
travels with them):

- **`ui.tsx` — entire file.** `Btn/Card/Chip/Txt/CoinPill/Bounded` are activity-agnostic. The
  brick button, coin pill, card, and Poppins text are the HabitHatch look too (PLAN §10 lists
  `tokens.ts` and the primitives as reused). The Hatch theme palette in PLAN §2/proto-today is
  the same hex set already in `tokens.ts`, so no recolor is needed.
- **`BottomSheet.tsx` — entire file.** HabitHatch's Habit Editor / Feed / Buy / Goal sheets are
  exactly this component with different children.
- **`Toast.tsx` — entire file.** Only the *messages* change, and those live in store actions,
  not here.
- **`CoinPile.tsx` — entire file.** "Idle jar unchanged (companion forages while you're gone)"
  (PLAN §3 table). The `"N · tap to collect"` badge copy is generic. (Optional: proto-today
  spec uses `ceil(pending/4)` and `"{pending} to collect"`; the ported RN uses `ceil(pending/3)`
  and `"· tap to collect"`. Keep the RN version — it's the shipped one — unless you're matching
  proto pixels.)
- **`Icon.tsx` — the component + the whole ICONS map.** Keep all 41 entries. The renderer is
  reused as-is; you only **add** keys (see §4). Every Garden milestone icon (PLAN §7.5) already
  resolves.

---

## 4. CHANGE FOR HABITHATCH

Ordered by how much surgery each needs.

### 4a. `Icon.tsx` — add ~5 icon keys (small, additive)
The Today/Home and Garden screens in PLAN reference a handful of glyphs the ported map lacks.
Auditing proto-today (`build-notes/proto-today.md` §Icon primitive) against the current
`ICONS` keys, the **missing** ones are: `moon`, `snow`, `chart`, `bars`, `leaf`. Add each as a
new `[kind, innerSvg]` entry in the same 24×24 viewBox convention. Nothing else in `Icon.tsx`
changes. Example shape to match:
```ts
moon: ['fill',   '<path d="M15 3a9 9 0 1 0 6 15A7 7 0 0 1 15 3z"/>'],
snow: ['stroke', '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>'],
```
The Garden strip and milestone rows need **no** additions (`bolt/sparkle/shield/heart/note/
trophy/crown` all present).

### 4b. `QuestRow.tsx` → `HabitRow.tsx` (the real reshape)
This is the one component whose *content model* flips from focus→habit. The ported `QuestRow`
is time-based (`done/est` seconds ring, `fmt` minutes, `play` to start a session). A `HabitRow`
is check-off + per-habit-streak based. Target shape (mirrors proto-today §habitRow/habitBox):

New prop/type (from PLAN §6 `habits` table):
```ts
interface Habit {
  id: string;                 // uuid
  name: string;
  category: 'water'|'exercise'|'read'|'meditate'|'run'|'hygiene'
          |'nophone'|'wake'|'sleep'|'medicine'|'custom';
  icon: string;               // cat-*.svg filename
  type: 'good' | 'bad';
  schedule_kind: 'daily' | 'weekdays' | 'times_per_week';
  weekdays?: number[];        // when schedule_kind='weekdays'
  target_per_wk?: number;     // when 'times_per_week'
  reminder_time?: string;     // 'HH:MM'
  color: string;              // token key for the row accent
  cur_streak: number;
  best_streak: number;
  coins_earned: number;
}
export function HabitRow({ habit, done, first, onToggle }: {
  habit: Habit; done: boolean; first?: boolean; onToggle: (id: string) => void;
});
```
Edits, part by part:
- **Ring → check control.** Replace the `done/est` percentage with the streak-tier ring:
  `tier = habit.cur_streak % 3; pct = tier/3` (proto-today §habitBox). When `done`, render the
  new `habit-checkbox.svg` (a filled check) instead of the green circle+`check`. When not done,
  render `habit-ring.svg` geometry (grey track + orange progress arc). The `<Circle>` +
  `strokeDasharray`/`strokeDashoffset`/`rotate(-90)` technique in the current file carries over
  directly — only the fraction source changes.
- **Category dot/icon.** Replace `catColors[quest.tag]` + text tag with the category **icon**
  (`catArt(habit.category)` → one of the 11 `cat-*.svg`) in the `.h-ic` tile, and a
  **schedule label** (`schedLabel`): `daily→"Every day"`, `weekdays→"Weekdays"/"Weekends"/joined
  day names`, `times_per_week→"N× a week"`. Add a habit-category→accent-color map (the old
  `catColors` is Work/School/etc. and is irrelevant; new categories are water/exercise/…).
- **Streak flame.** Add a per-row `hflame`: the new `streak-flame.svg` + `habit.cur_streak`,
  dimmed (`.cold`, desaturated) when `cur_streak === 0`. This is the **per-habit** tier of the
  two-tier streak (PLAN §7.4); the **overall** streak flame lives in the header, not the row.
- **Callback.** `onStart(id: number)` → `onToggle(id: string)` (check/uncheck), and drop the
  `play` button entirely — HabitHatch has no per-row timer (the optional routine timer is v3,
  PLAN §4).
- **Reminder chip.** Optional `bell` + `habit.reminder_time` when set.

### 4c. `registry.ts` — swap the asset list
Keep the *pattern* (enumerated `require()`s, logical names), change the *entries*:
- **Add the 20 new standalone SVGs** (PLAN §11): `egg-whole/crack/hatch.svg`,
  `habit-ring.svg`, `habit-checkbox.svg`, `streak-flame.svg`, `garden-sprout/tree/orchard.svg`,
  and the 11 `cat-*.svg` (incl. `cat-custom.svg` as the fallback for `category='custom'`).
  **How** they're referenced depends on the SVG decision in §5 — if you inline them as XML
  strings (recommended, matches `Icon.tsx`), they don't go in `registry.ts` at all; they become
  a `catArt`/`ART` string-map module. If instead you add `react-native-svg-transformer`, they
  become component imports (also not `require()`s in `registry.ts`).
- **5-species override** (PLAN §10 / §9). The reused `SPECIES` catalog ships 6 species with
  `rabbit`. HabitHatch has **no rabbit art**, so:
  - Remove `rabbitThumb`, `speciesThumb.rabbit`, and the entire `lottiePet.rabbit` block.
  - Keep `lottiePet.cat` and `lottiePet.dog` (the two Lottie species render via `PetView`).
  - `fox/penguin/axolotl` need **no registry/Lottie entries** — they're drawn by `PetSprite`
    from hand-built SVG on the UI thread. Their `pets/*.png` are picker thumbnails only, so add
    `foxThumb/penguinThumb/axolotlThumb` to `speciesThumb` if the Shop/onboarding carousel needs
    thumbs.
  - The override itself is in `catalogs.ts` (`SPECIES` array: drop rabbit; `dog/cat` price 0
    free-starter, `fox/penguin` coin-unlock, `axolotl` `premium:true`), **not** in `registry.ts`
    — but the registry's species maps must agree (no rabbit key left dangling).
- **Streak Freeze** reuses `img.potion` (PLAN §11) — already present, no change.
- **`soundscapes`** is unused in MVP (no focus timer) — leave it or drop it; harmless.

### 4d. New string-map modules (new files, sibling to `Icon.tsx`)
The egg / garden / category art are **content**, so give them their own inline-XML maps rather
than bloating `ICONS`:
- `catArt(category)` → the 11 `cat-*.svg` bodies (viewBox `0 0 100 100`).
- `ART.eggWhole / eggCrack / eggHatch` and `garden-*` (viewBox `0 0 100 118` per PLAN §11).
- `streak-flame`, `habit-ring`, `habit-checkbox`.
Each rendered exactly like `Icon` does — build `<svg viewBox=...>${inner}</svg>` and hand to
`SvgXml`. This keeps one SVG-consumption path across the app (see §5 gotcha).

### 4e. Copy reframes (store actions, not components)
`Toast`/`CoinPile`/`CoinPill` are reused; the **text** flips in `store.ts` actions:
`"Finish a focus session to earn your first coins"` → habit-check copy;
`"{pet} brought you N coins"` (idle) stays; `"Keep focusing to afford this"` → `"Keep at your
habits to afford this"`; etc. These are string edits in the store, not in this component set.

---

## 5. GOTCHAS

1. **Standalone `.svg` files have no import path in this repo yet.** Nothing in
   `registry.ts`/`Icon.tsx`/`PetSprite.tsx` ever `require()`s a `.svg` file — icons are inline
   XML strings, pets are hand-built `<Path>`s. The 20 new HabitHatch SVGs (egg/garden/category/
   flame/ring/checkbox) therefore need a **decision**: either (a) **inline them as XML strings**
   into `catArt`/`ART` maps and render via `SvgXml` (recommended — zero new deps, matches
   `Icon.tsx`, keeps `color`/`currentColor` theming), or (b) add `react-native-svg-transformer`
   + a `metro.config.js` `transformer`/`resolver` change to import `.svg` as components. Do
   **not** `Image`-load an `.svg` (RN `Image` can't rasterize SVG). Pick (a) unless the art is
   too path-heavy to hand-transcribe.

2. **`SvgXml` colors via `currentColor`, not a `fill` prop.** `Icon` injects
   `stroke="currentColor"`/`fill="currentColor"` and passes `color` to `SvgXml`. When you
   author the new inline art, use `currentColor` for the tintable parts and hard hex only for
   fixed multi-color art (egg shell tints, garden greens). A missing `currentColor` renders
   black regardless of the `color` prop.

3. **PetSprite's reanimated-4 `matrix` engine is load-bearing and undocumented in RN types.**
   `PetSprite.tsx` animates `<G matrix={[...]}>` on the UI thread via worklets, using a
   `declare module 'react-native-svg' { interface GProps { matrix?: number[] } }` augmentation
   because `matrix` is the *only* animatable native transform on `<G>` (discrete
   `rotation`/`transform`/`originX` are JS-resolved and bypassed by `useAnimatedProps`). It's
   reused **verbatim** for fox/penguin/axolotl (PLAN §10: "Zero changes needed"). Do not
   "simplify" it to `transform` props — it will silently stop animating on the UI thread. The
   monotonic clock **accumulates** `dt` (clamped to 64 ms) rather than reading absolute time, so
   a mood/outfit re-render can't zero the phase — preserve that.

4. **Babel: worklets plugin is auto-appended — do not add it.** `babel.config.js` is just
   `presets: ['babel-preset-expo']`. SDK 57's preset auto-appends
   `react-native-worklets/plugin` (required by reanimated 4). Adding
   `react-native-reanimated/plugin` (or the worklets plugin) yourself **double-applies** it and
   breaks worklets. Copy `babel.config.js` verbatim; the `'worklet'` directives in `PetSprite`
   depend on this.

5. **Persistence is a single-row JSON snapshot, debounced 250 ms.** `persistence.ts` stores the
   whole `AppState` as one `kv` row (`key='app_state'`), `INSERT OR REPLACE`, after
   `JSON.stringify` (minus the runtime-only `tab`). `mutate` → `scheduleSave` (250 ms debounce).
   Consequences for the fork:
   - PLAN §6's `habits/habit_logs/day_summary/garden_plots` are **fields inside that blob**, not
     SQL tables, unless you rearchitect. The `ALTER TABLE` statements are conceptual schema.
   - The 250 ms debounce means a rapid check→check→uncheck flushes only the final state. A hard
     kill inside the window loses the last mutation — fine for a habit tick, but the **launch-time
     rollover must be deterministic from local `YYYY-MM-DD` dates** (PLAN §8/§12 risk 1), never
     dependent on the last save having flushed.
   - `hydrate()` back-fills missing slices from `freshState()` (loaded wins), so adding
     `habits`/`profile.overall_streak`/etc. is safe for existing installs — but you must extend
     that migration block for every new top-level slice, or a screen that spreads it crashes.
   - DB filename is `pawductivity.db` — rename to `habithatch.db` in `SqlitePersistence.db()`.

6. **Toast re-fires on `id`, not text.** Two identical messages back-to-back still animate
   because `showToast` bumps `toastSeq`. Keep that if you fire, e.g., a per-habit "+coins" toast
   repeatedly. The 2200 ms hold + `pointerEvents="none"` means toasts don't queue — a burst
   overwrites; the store already staggers achievement toasts with `setTimeout(i*900)` for this
   reason (mirror that if you batch habit unlocks).

7. **`QuestRow` uses `View` `inset:0` cast `as any`.** The `pct` overlay style is
   `{ position:'absolute', inset:0, ... } as any` (RN's older `ViewStyle` lacks `inset`). If you
   lift the ring code into `HabitRow`, keep the cast or expand to `top/left/right/bottom:0` to
   avoid a TS error.

8. **`fontFor` only has two weights.** `Txt weight={500}` and `weight={600}` both round to
   Regular/Bold at the `>=600` boundary — only Regular + Bold ttf ship. Don't design HabitHatch
   rows expecting a true medium/semibold; emphasis is binary. (`registry.fonts` has exactly
   `Poppins-Regular`/`Poppins-Bold`.)

9. **`CoinPile` is `pointerEvents="none"` by design.** It overlays the room so taps hit the
   room's collect handler underneath, not the pile. If you wrap it in a new touchable, keep the
   pile itself non-interactive or the collect tap breaks.

10. **`MAX_CONTENT`/`Bounded` centering.** Screens rely on `Bounded` for tablet/Chromebook
    layout (caps at 600, centers, background fills the sides). New HabitHatch screens (Today,
    Garden, Companion) should wrap their scroll content in `Bounded` for the same behavior — it's
    not automatic.
