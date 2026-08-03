# Google Play Store Listing — HabitHatch

Everything you need to fill in Play Console for **HabitHatch v1.0.0**. Copy‑paste the fields below; the checklists tell you what's ready and what still needs a decision from you.

---

## ⚠️ Pre‑submission blockers (read first)

These will fail review or mislead users if not resolved before you publish:

1. **App icon is still a placeholder.** `app.json` points `icon` at `./assets/icon/logo-paw.png` (the paw mark inherited from the fork). Replace it with a HabitHatch egg icon (a 1024×1024 source is ideal; Expo generates the rest) and rebuild. The 512×512 Play Store icon must match.
2. **HabitHatch+ (premium) is not wired to a real purchase.** The app shows premium/upsell UI but has **no Google Play Billing integration**. Before publishing, pick one:
   - implement Google Play Billing for HabitHatch+, **or**
   - remove/hide the purchase prompts, **or**
   - make those features free (unlocked for everyone).
   Whichever you choose, set the **"In‑app purchases"** and **pricing** answers below to match.
3. **Unused sensitive permissions.** The manifest currently declares `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, and `INTERNET`, which the app does not use. Unused sensitive permissions can trigger review questions. Remove them (via `app.json` `android.permissions` / `blockedPermissions` or a config plugin) unless a dependency truly needs them, then rebuild. Keep: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`.
   - Note: `SCHEDULE_EXACT_ALARM` itself requires a short justification in Play Console (see "Sensitive/Restricted permissions" below).

---

## 1. App details

| Field | Value |
|-------|-------|
| **App name** | HabitHatch |
| **Package name (App ID)** | `com.habithatch.app` |
| **Version name** | 1.0.0 |
| **Version code** | 1 |
| **Default language** | English (United States) — `en-US` |
| **App or game** | App |
| **Free or paid** | Free (with optional in‑app products — *only if you implement HabitHatch+*) |
| **Category (primary)** | Health & Fitness |
| **Category (alternative)** | Productivity |
| **Tags** | habit tracker, habits, streaks, routine, self‑improvement, productivity, wellness |

---

## 2. Short description (max 80 characters)

> Keep your habits, hatch a companion — a cozy, private, offline habit tracker.

*(75 characters)*

---

## 3. Full description (max 4000 characters)

```
HabitHatch turns your daily habits into a companion you'll want to show up for.

Check off your habits, keep your streak, and a little companion hatches from its egg and grows alongside you. Miss a day and it just gets a little hungry — nothing here can ever die. It's the gentlest way to stay consistent.

WHY HABITHATCH

• Private by design — everything lives on your device. No account, no sign‑up, no cloud, no tracking. Your habits are yours alone.
• Works fully offline — track anywhere, anytime, no connection needed.
• Cozy, not guilt‑trippy — a bad day makes your companion hungry, not dead. You can always bounce back.

HATCH & RAISE A COMPANION
Keep your habits to warm your egg until it hatches. Raise a fox, penguin, axolotl, dog, or cat, dress it up in outfits, feed it treats, and watch it grow through five stages as your streak climbs.

BUILD A HABIT GARDEN
Every check‑off earns coins. Plant them in your Habit Garden, where each plot is a permanent perk — bonus coins, a bigger idle jar, or a weekly Streak Freeze that quietly saves you on the day you slip.

NEVER LOSE A STREAK BY ACCIDENT
Earn Streak Freezes and let one cover a missed day automatically, so a single off‑day doesn't undo weeks of work.

SEE YOUR PROGRESS
A full stats dashboard: completion rate, all‑clear days, weekly trend, day‑of‑week breakdown, an eight‑week heatmap, streak history, and where your coins come from and go.

FLEXIBLE HABITS
Daily, weekdays, or X‑times‑a‑week schedules, custom reminders, categories, and reordering — set it up in about thirty seconds.

MADE TO FEEL GOOD
Warm, hand‑crafted art, a breathing, blinking companion, and five color themes to make the app yours.

HabitHatch keeps the loop simple: keep your habit, feed something living, grow. Small habits, big changes.

Download HabitHatch and hatch a friend today.
```

*(~1,650 characters — well under the 4,000 limit; trim or expand freely.)*

---

## 4. Graphics assets (Play Console → Store listing → Graphics)

| Asset | Requirement | Status |
|-------|-------------|--------|
| **App icon** | 512 × 512 PNG, 32‑bit with alpha | ⚠️ **Replace placeholder paw with HabitHatch egg** |
| **Feature graphic** | 1024 × 500 PNG or JPG (no alpha) | ❌ To create — suggest the egg + tagline "Keep your habits. Hatch a friend." on the teal brand background (#0C4C60) |
| **Phone screenshots** | 2–8 images, PNG/JPG, 9:16 portrait, 1080 × 2400 works | ✅ Capture from the app — suggested set below |
| **7" tablet screenshots** | Optional | Optional |
| **10" tablet screenshots** | Optional | Optional |
| **Promo video** | Optional (YouTube URL) | Optional |

**Suggested screenshot set (in order):**
1. Today screen — companion in the room + habit ring ("Your companion, waiting")
2. A companion wearing an outfit (Companion screen)
3. Nursery hatch moment ("It's a fox!")
4. Habit Garden in full bloom
5. Insights dashboard (gauge + weekly trend)
6. Habits list with streaks

*Tip: add a short caption banner to each screenshot. Brand color #0C4C60 (teal), accent #E28A4B (orange).*

---

## 5. Content rating (IARC questionnaire answers)

Category: **Reference, News, or Educational** → **Utility / Productivity / Communication** (choose "Utility, Productivity, Communication or Other"). Answer the questionnaire as:

| Question | Answer |
|----------|--------|
| Violence (cartoon/realistic) | No |
| Sexual content / nudity | No |
| Profanity or crude humor | No |
| Controlled substances (drugs/alcohol/tobacco) | No |
| Gambling / simulated gambling | No (virtual coins have no cash value and no wagering) |
| User‑to‑user communication / shares location | No |
| Digital purchases | Yes **only if** you enable HabitHatch+ IAP; otherwise No |
| Data collection/sharing | No |

**Expected result:** Everyone / PEGI 3 / ESRB Everyone.

---

## 6. Data safety (Play Console → App content → Data safety)

This is the most important form for HabitHatch, and it's simple because the app is offline:

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | **No** |
| Is all user data encrypted in transit? | Not applicable — **no data is transmitted** |
| Do you provide a way for users to request that their data be deleted? | **Yes** — in‑app "Reset all data" and uninstalling deletes everything |
| Data collected | **None** |
| Data shared | **None** |

Because nothing is collected or shared, you will select **"No data collected"** and **"No data shared."** (If you later add Google Play Billing, that is handled by Google and is not "collected by your app.")

---

## 7. App access

- Is any part of the app restricted (login required)? **No.** All functionality is available without any credentials. (No test account needed for review.)

---

## 8. Ads

- Does your app contain ads? **No.**

---

## 9. Target audience & content (Play Console → App content)

| Field | Value |
|-------|-------|
| Target age group | 13+ (recommended). The app is safe for all ages, but selecting 13+ avoids the stricter "Designed for Families" / children's data requirements. Choose 13+ unless you specifically want the Families program. |
| Appeals to children? | No |
| News app? | No |
| COVID‑19 contact tracing/status? | No |
| Government app? | No |

---

## 10. Sensitive / restricted permissions declaration

- **`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`** — if Play asks for justification:
  > "HabitHatch schedules user‑configured habit reminders that must fire at the exact time the user chose. Exact alarms are used solely to deliver these local reminders on time. No alarms are used for advertising or data collection."
- Remove `RECORD_AUDIO` and `SYSTEM_ALERT_WINDOW` before submission (see blockers) so you don't have to justify them at all.

---

## 11. Store settings

| Field | Value |
|-------|-------|
| App category | Health & Fitness |
| Contact email | `[CONTACT EMAIL]` |
| Contact website (optional) | `[WEBSITE URL or leave blank]` |
| Contact phone (optional) | Leave blank unless required |
| Privacy Policy URL | `[PRIVACY POLICY URL]` — host `PRIVACY_POLICY.md` and paste the link |

---

## 12. Pricing & distribution

| Field | Value |
|-------|-------|
| Price | Free |
| Countries | All (or your chosen set) |
| Contains ads | No |
| In‑app purchases | **No** in the current build. Change to **Yes** and add products only if you implement HabitHatch+ billing. |

---

## 13. "What's new" / release notes (v1.0.0)

```
Welcome to HabitHatch 🥚

• Keep your daily habits and hatch a companion that grows with you.
• Build a Habit Garden of permanent perks from the coins you earn.
• Streak Freezes save you on the day you slip.
• A full offline stats dashboard — completion, streaks, trends, and more.
• Private by design: no account, no tracking, everything stays on your device.

Small habits, big changes.
```

---

## 14. Release build

- **Format:** Android App Bundle (`.aab`) — this is what you upload to Play Console (not the `.apk`).
- **Output path:** `android/app/build/outputs/bundle/release/app-release.aab`
- **Signing:** built and signed with the release keystore configured in `android/app/build.gradle`.
  - ⚠️ **Keep `habithatch-release.keystore` and its passwords safe and backed up.** With Play App Signing, this is your **upload key** — if you lose it you can reset it via Google, but losing it is still painful. Do not commit it to git (it is already gitignored).
- **Play App Signing:** on first upload, enroll in Play App Signing (recommended/default). Google manages the final signing key; you sign uploads with the keystore above.

---

## 15. Submission checklist

- [ ] Replace the app **icon** (egg, not paw) and rebuild the AAB
- [ ] Resolve **HabitHatch+**: implement billing, hide it, or make it free
- [ ] Remove unused permissions (`RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `INTERNET`) and rebuild
- [ ] Host `PRIVACY_POLICY.md` and add the URL
- [ ] Fill in `[DEVELOPER NAME]`, `[CONTACT EMAIL]`, and remaining placeholders in all three docs
- [ ] Create the **feature graphic** (1024×500)
- [ ] Capture **2–8 phone screenshots**
- [ ] Complete **Data safety** ("No data collected/shared")
- [ ] Complete **Content rating** questionnaire
- [ ] Set **Target audience** (13+)
- [ ] Upload the **AAB** to a testing track first (internal testing), verify, then promote to production
