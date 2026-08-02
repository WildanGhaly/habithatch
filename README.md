# HabitHatch 🥚

A gamified daily-habit tracker for Android: check off your habits, earn coins, and raise a
companion that **hatches from an egg** after your first 3-day streak and thrives on your
consistency. A spin-off of [Pawductivity](https://github.com/WildanGhaly/pawductivity) that
reuses its virtual-pet engine, coin economy, care loop, and design system, retargeted from a
focus timer to habit tracking.

## Status: pre-build (spec + assets ready)

This repo currently holds the **plan, the art, and the two build prompts**. The app itself is
built in two phases:

1. **Prototype** — generate a single-file interactive HTML prototype on claude.ai using
   [`PROTO-PROMPT.md`](./PROTO-PROMPT.md), then drop it in [`prototype/`](./prototype/) as
   `habithatch_v1.html`. That file becomes the 1:1 source of truth for the app.
2. **App** — build the Expo / React Native app **1:1 from the prototype** using
   [`BUILD-PROMPT.md`](./BUILD-PROMPT.md), reusing the Pawductivity architecture.

## Structure

```
PLAN.md                     Full 13-section product spec (screens, data model, economy, roadmap)
PROTO-PROMPT.md             Prompt to generate the web HTML prototype (phase 1)
BUILD-PROMPT.md             Prompt to build the Expo/RN app 1:1 from the prototype (phase 2)
prototype/                  Drop the generated habithatch_v1.html here (the SOT for the build)
assets/
  new/                      20 concept-specific SVGs (egg stages, habit icons, garden, streak flame)
  reused/                   Art + code seeds reused from Pawductivity:
    pets/                     fox/penguin/axolotl SVG + dog/cat PNG + pet_home
    economy/                  coin, food, clothes, shop art
    icons/                    shared UI glyphs
    lottie/                   dog/cat Lottie companions
    tokens.ts                 design tokens (colors, radii, shadows, fonts) — copy in
    catalogs.ts               foods/clothes/species/journey/achievements catalog shape
    PetSprite.tsx             the reanimated UI-thread pet engine (matrix + sine oscillators)
reference/
  PAWDUCTIVITY-INVENTORY.md  what Pawductivity provides and how to reuse it
  concept-board.png          rendered board of the pet + all HabitHatch assets
```

## Tech target
Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · Hermes · New Architecture ·
offline-first `expo-sqlite` · zustand + immer · `react-native-reanimated` 4 +
`react-native-svg` (UI-thread pet engine) · `expo-notifications` · Android-first.

No backend — everything is local.
