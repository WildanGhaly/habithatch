# HabitHatch: Google Play Store Asset Pack

Drag-drop-ready graphics for Google Play Console. **Every file is already at the exact required size and is a flattened 24-bit PNG (colour type 2, no transparency)**. No editing needed. Generated from a seeded, aspirational demo state (happy 100-health companion "Pip", a 6-day streak, a fully-bloomed Habit Garden, and full analytics) captured on an Android emulator at true 9:16, then composed with `compose.js` (playwright-core + pngjs).

Brand colours used: teal `#0C4C60` → `#12667F`, accent orange `#E28A4B`, cream `#FBF6EC`.

## File → Play Console field

| File(s) | Play Console field | Dimensions | Format | Count |
|---------|--------------------|-----------|--------|-------|
| `app-icon-512.png` | **App icon** | 512 × 512 | 24-bit PNG | 1 |
| `feature-graphic-1024x500.png` | **Feature graphic** | 1024 × 500 | 24-bit PNG, no alpha | 1 |
| `screenshots/phone/framed/01-08.png` | **Phone screenshots** ⭐ upload these | 1080 × 1920 | 24-bit PNG, no alpha | 8 |
| `screenshots/phone/raw/01-08.png` | **Phone screenshots** (clean, no caption, alt set) | 1080 × 1920 | 24-bit PNG, no alpha | 8 |
| `screenshots/chromebook/01-08.png` | **Chromebook** | 1920 × 1080 (landscape) | 24-bit PNG, no alpha | 8 |
| `screenshots/tablet-7/01-08.png` | **7-inch tablet** (optional) | 1200 × 1920 | 24-bit PNG, no alpha | 8 |
| `screenshots/tablet-10/01-08.png` | **10-inch tablet** (optional) | 1600 × 2560 | 24-bit PNG, no alpha | 8 |

- **Upload the `phone/framed` set** as your phone screenshots. They carry the benefit captions. The `phone/raw` set is the same 8 screens with no caption/frame, in case you prefer plain captures (use one set or the other, not both).
- **Chromebook / tablet** shots show the app's portrait content column centred on the brand background, which is correct because HabitHatch is large-screen aware (it caps and centres its content).
- Every set has exactly **8** screenshots (Play allows 2-8), each side is within 320-3840 px, and the long side is ≤ 2× the short side (1080×1920 and 1920×1080 both satisfy this).
- **Skip** Wear OS / Android TV / Android Auto / XR. HabitHatch doesn't target those form factors.

## Screenshot order + captions (ordered to sell)

| # | Screen | Caption |
|---|--------|---------|
| 01 | Today / home | Keep habits. Hatch a friend. |
| 02 | Companion | Raise a happy companion |
| 03 | Habits | Track any habit |
| 04 | Habit Garden | Grow a garden of perks |
| 05 | Insights | See every stat |
| 06 | Shop · Companions | Collect five companions |
| 07 | Achievements | Earn every badge |
| 08 | Weekly recap | Celebrate each week |

---

## Listing text

### App title (≤ 30 chars)
```
HabitHatch: Habit Tracker
```
*(25 characters)*

### Short description (≤ 80 chars)
```
Keep your habits, hatch a companion: a cozy, private, offline habit tracker.
```
*(76 characters)*

### Full description (≤ 4000 chars)
```
HabitHatch turns your daily habits into a companion you'll want to show up for.

Check off your habits, keep your streak, and a little companion hatches from its egg and grows alongside you. Miss a day and it just gets a little hungry. Nothing here can ever die. It's the gentlest way to stay consistent.

WHY HABITHATCH

• Private by design: everything lives on your device. No account, no sign-up, no cloud, no tracking. Your habits are yours alone.
• Works fully offline: track anywhere, anytime, no connection needed.
• Cozy, not guilt-trippy: a bad day makes your companion hungry, not dead. You can always bounce back.

HATCH & RAISE A COMPANION
Keep your habits to warm your egg until it hatches. Raise a fox, penguin, axolotl, dog, or cat, dress it up in outfits, feed it treats, and watch it grow through five stages as your streak climbs.

BUILD A HABIT GARDEN
Every check-off earns coins. Plant them in your Habit Garden, where each plot is a permanent perk: bonus coins, a bigger idle jar, or a weekly Streak Freeze that quietly saves you on the day you slip.

NEVER LOSE A STREAK BY ACCIDENT
Earn Streak Freezes and let one cover a missed day automatically, so a single off-day doesn't undo weeks of work.

SEE YOUR PROGRESS
A full stats dashboard: completion rate, all-clear days, weekly trend, day-of-week breakdown, an eight-week heatmap, streak history, and where your coins come from and go.

FLEXIBLE HABITS
Daily, weekdays, or X-times-a-week schedules, custom reminders, categories, and reordering. Set it up in about thirty seconds.

HABITHATCH+
An optional subscription unlocks all five themes, every companion and outfit, unlimited habits, the full analytics window, and recap export. Every Garden perk that touches your habits stays free. Paying only adds cosmetics and deeper numbers, never an easier streak.

Small habits, big changes. Download HabitHatch and hatch a friend today.
```

### What's new (v1.0.0)
```
Welcome to HabitHatch 🥚

• Keep your daily habits and hatch a companion that grows with you.
• Build a Habit Garden of permanent perks from the coins you earn.
• Streak Freezes save you on the day you slip.
• A full offline stats dashboard: completion, streaks, trends, and more.
• Private by design: no account, no tracking, everything stays on your device.

Small habits, big changes.
```

---

## Regenerating
The composer is committed at the repo root as `compose.js`. It reads the raw device captures from `capshots/` (re-capture the screens at a 1080×1920 display if that folder is absent), composes each asset at its exact size, and flattens to 24-bit with pngjs. Run with `node compose.js`.

## Full Play Console field answers
For the complete listing (category, content rating, Data safety, HabitHatch+ billing setup, etc.), see `STORE_LISTING.md` in this folder. Privacy policy and terms are `PRIVACY_POLICY.md` and `TERMS_AND_CONDITIONS.md`.
