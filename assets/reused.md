# HabitHatch — Reused Shared Assets

Everything below is pulled from `concepts/_shared-assets/` (the Pawductivity production
library). It is reused as-is *except* the SPECIES roster, which HabitHatch overrides (see
below); HabitHatch otherwise only adds the domain SVGs in `assets/new/`.

## Pet art (`_shared-assets/pets/`)
| File | Reused for |
|------|-----------|
| `fox.svg` | Companion species option; also the default post-hatch reveal in the Nursery. Rendered by `PetSprite`. |
| `penguin.svg` | Companion species option (free-unlock via coins). Rendered by `PetSprite`. |
| `axolotl.svg` | Companion species option (**premium** in HabitHatch's override). Rendered by `PetSprite`. |
| `dog.png` | Species-picker / Shop-card **thumbnail** for the dog (free starter). |
| `cat.png` | Species-picker / Shop-card **thumbnail** for the cat (free starter). |
| `pet_home.png` | Room backdrop behind the pet on the Home / Companion screen. |

## Lottie species (`assets/reused/lottie/`, copied from `_shared-assets/lottie/`)
| Folder | Reused for |
|--------|-----------|
| `lottie/dog/dog_{1..5,default}.json` | Animated **dog** companion, one clip per growth stage, rendered by the reused `PetView` (dog is a Lottie species — `PetSprite` does not render it). |
| `lottie/cat/cat_{1..5,default}.json` | Animated **cat** companion, one clip per growth stage, rendered by the reused `PetView`. |

**Two renderers, one Companion screen.** `PetSprite.tsx` (reanimated 4 UI-thread matrix
animation) renders the three SVG species **fox / penguin / axolotl** across all 5 growth
stages; the reused `PetView` renders the two Lottie species **dog / cat** from the JSON above.
Whatever the egg hatches into is fully animated — no species falls back to a static PNG (the
`.png` files are picker thumbnails only). **`rabbit` is dropped** (no shipped art here), so its
Lottie is not copied.

## SPECIES override (small `catalogs.ts` edit — not verbatim)
The reused `catalogs.ts` `SPECIES` has 6 entries incl. `rabbit` (premium) and a free
`axolotl`. HabitHatch overrides it to **5 species** — `rabbit` removed — with premium flags:
`dog`/`cat` free (price 0 starters), `fox`/`penguin` free-unlock via coins, `axolotl`
`premium: true`. This keeps the reused Shop "Companions" tab from listing an unshippable rabbit.

## Economy art (`_shared-assets/economy/`)
| File | Reused for |
|------|-----------|
| `coin.png` | The single currency earned per habit check-off and spent in Shop / Garden. |
| `food/apel.png` `food/ayam.png` `food/pizza.png` `food/semangka.png` `food/wortel.png` | Treats bought in the Shop to top up companion health (Pawductivity food system verbatim). |
| `food.png` | Shop "Food" tab icon. |
| `clothes/*.png` | Wardrobe outfits (vest overlays) for the companion. |
| `wardrobe.png` | Shop "Wardrobe" tab icon. |
| `pet.png` | Shop "Companions" tab icon. |
| `shop-icon.png` | Shop nav / tab-bar icon. |
| `potion.png` | "Streak Freeze" consumable icon (reframed from potion). |
| `lock.png` | Locked/premium overlay on gated species and outfits. |

## Icons (`_shared-assets/icons/`)
| File | Reused for |
|------|-----------|
| `check.svg` | Habit row completion tick (small UI glyph). |
| `paw.svg` | Companion / Home tab icon. |
| `chart.svg` | Insights tab icon. |
| `star1.svg` `star2.svg` `star3.svg` | Achievement rarity tiers; hatch celebration burst. |
| `bone.svg` | Care / feed affordance in the Companion screen. |
| `hanger.svg` | Wardrobe affordance. |
| `back.svg` | Header back button on all sheets/overlays. |
| `play.svg` `pause.svg` | Reused only if v2 guided-routine timer ships; not in MVP. |

## Design system (reused wholesale, not a file copy)
- `tokens.ts` palette, radii, shadow, Poppins typography — copied verbatim.
- Screen shells: Home, Pet, Shop, Insights, Achievements, Journey, Onboarding, Profile,
  Premium, Referral, Recap; sheets BottomSheet/Buy/Feed/Goal/Plan/Capture.
- Systems: zustand+immer store, expo-sqlite persistence, expo-notifications, XP/levels,
  streaks, daily-goal ring, Journey milestones, achievements, idle "jar".
