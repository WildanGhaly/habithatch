# Google Play Store Listing: HabitHatch

Copy-paste answers for every Play Console field for **HabitHatch v1.0.0 (versionCode 1)**. The app itself is production-ready; the only things left are things that can *only* be done in your Play Console account (create the subscription, add screenshots, run the questionnaires).

---

## ✅ Status: what's already done in the app

- **App icon**: the HabitHatch egg (teal brand background). No placeholder.
- **Permissions**: trimmed to only what's used (notifications, exact alarm, boot, vibrate, billing). Removed `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `AD_ID`, and the unused image-picker/camera permissions.
- **HabitHatch+ billing**: real Google Play Billing (subscriptions) is integrated via `expo-iap`. The paywall shows live Play prices, purchases grant the entitlement, and it's restored on launch and via "Restore purchases."
- **Signed release AAB**: built and signed with the release key.

## 📋 What only you can do (in Play Console)

1. Create the **HabitHatch+ subscription** and its 3 base plans (§8 , IDs must match exactly).
2. Set up a **payments/merchant profile** (required to sell subscriptions).
3. Add a **license tester** and run a **test purchase** to confirm the flow end-to-end.
4. Add the **feature graphic** + **screenshots** (§4).
5. Complete **Data safety**, **Content rating**, **Target audience** (§5-§7, §9).

---

## 1. App details

| Field | Value |
|-------|-------|
| **App name** | HabitHatch |
| **Package name (App ID)** | `com.habithatch.app` |
| **Version name / code** | 1.0.0 / 1 |
| **Default language** | English (United States), `en-US` |
| **App or game** | App |
| **Free or paid** | Free (with an in-app subscription) |
| **Category (primary)** | Health & Fitness |
| **Category (alternative)** | Productivity |
| **Tags** | habit tracker, habits, streaks, routine, self-improvement, productivity, wellness |

---

## 2. Short description (max 80 characters)

> Keep your habits, hatch a companion: a cozy, private, offline habit tracker.

*(76 characters)*

---

## 3. Full description (max 4000 characters)

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

*(~1,950 characters, trim or expand freely.)*

---

## 4. Graphics assets (Store listing › Graphics)

| Asset | Requirement | Status |
|-------|-------------|--------|
| **App icon** | 512 × 512 PNG | ✅ The HabitHatch egg (already the app icon; export a 512 from `assets/icon/habithatch-icon.png`) |
| **Feature graphic** | 1024 × 500 PNG/JPG (no alpha) | ❌ To create: egg + "Keep your habits. Hatch a friend." on teal (#0C4C60) |
| **Phone screenshots** | 2-8 images, 9:16 portrait (1080 × 2400 is ideal) | ❌ Capture from the app; suggested set below |
| **7"/10" tablet screenshots** | Optional | Optional |
| **Promo video** | Optional | Optional |

**Suggested screenshots (in order):** 1) Today with the companion + habit ring, 2) a companion wearing an outfit, 3) the Nursery hatch ("It's a fox!"), 4) the Habit Garden in bloom, 5) the Insights dashboard, 6) the Habits list with streaks. Brand: teal #0C4C60, accent orange #E28A4B.

---

## 5. Content rating (IARC questionnaire)

Choose category **"Utility, Productivity, Communication or Other."** Answers:

| Question | Answer |
|----------|--------|
| Violence / sexual content / profanity / controlled substances | No |
| Gambling or simulated gambling | No (virtual coins have no cash value; no wagering) |
| User-to-user communication / shares location | No |
| **Digital purchases** | **Yes** (HabitHatch+ subscription) |
| Data collection/sharing | No |

**Expected result:** Everyone / PEGI 3 / ESRB Everyone.

---

## 6. Data safety (App content › Data safety)

Still the simplest possible form, because the app collects nothing:

| Question | Answer |
|----------|--------|
| Does your app collect or share any user data? | **No** |
| Data collected / shared | **None** |
| Encrypted in transit | Not applicable (nothing is transmitted) |
| Users can request deletion | **Yes**, in-app "Reset all data" and uninstall delete everything |

Google Play Billing handles subscription payments on Google's side; that is **not** data your app collects, so you still select **"No data collected / No data shared."**

---

## 7. App access

- No login or restricted areas. All features are reachable without credentials. **No test account needed** for review. (Reviewers can see the paywall UI without purchasing.)

---

## 8. HabitHatch+ billing setup (do this before publishing)

The app expects a subscription with these **exact** IDs (they match `src/billing/config.ts`). If they differ, the paywall won't find any plans.

**Monetize › Products › Subscriptions › Create subscription**
- **Product ID:** `habithatch_plus`
- **Name:** HabitHatch+

Add **three auto-renewing base plans** under that subscription:

| Base plan ID | Billing period | Notes |
|--------------|----------------|-------|
| `monthly`  | 1 month (P1M)  |  |
| `yearly`   | 1 year (P1Y)   | mark as your best value |
| `sixmonth` | 6 months (P6M) |  |

Then:
1. Set a **price** for each base plan per region (the app shows Play's live localized price; the Rupiah figures in the code are only fallbacks).
2. **Activate** the subscription and all three base plans.
3. **Monetization setup › Payments profile**: create/link a Google Payments merchant account (required to sell).
4. **Setup › License testing**: add a tester Google account so you can buy without being charged.
5. Upload the AAB to **Internal testing**, install via the tester opt-in link, open HabitHatch+ and confirm: prices load, a test purchase unlocks premium, "Restore purchases" works, and the entitlement persists after a restart.

> If you'd rather change the plan structure (e.g., different IDs or fewer plans), update `src/billing/config.ts` (`SUBSCRIPTION_SKU` and `PLANS[].basePlanId`) to match and rebuild.

---

## 9. Target audience & content

| Field | Value |
|-------|-------|
| Target age group | **13+** (safe for all ages; 13+ avoids the stricter Families/children data rules) |
| Appeals to children? | No |
| News / COVID / government app? | No |

---

## 10. Sensitive / restricted permissions

- **`SCHEDULE_EXACT_ALARM`**, if Play asks for justification:
  > "HabitHatch schedules user-configured habit reminders that must fire at the exact time the user chose. Exact alarms are used solely to deliver these local reminders. They are never used for advertising or data collection."
- **`com.android.vending.BILLING`**: added by the billing library for the HabitHatch+ subscription; no declaration form needed.
- No other sensitive permissions are declared.

---

## 11. Store settings

| Field | Value |
|-------|-------|
| App category | Health & Fitness |
| Contact email | wildanghaly1@gmail.com |
| Contact website (optional) | https://github.com/WildanGhaly/habithatch |
| Privacy Policy URL | https://github.com/WildanGhaly/habithatch/blob/main/store/PRIVACY_POLICY.md |

*(Tip: `wildanghaly1@gmail.com` is your dev email; swap in a dedicated support address if you'd prefer not to show a personal one. The privacy URL is live because the repo is public; enable GitHub Pages later if you want a cleaner page.)*

---

## 12. Pricing & distribution

| Field | Value |
|-------|-------|
| App price | Free |
| In-app products | **Yes**, HabitHatch+ subscription (monthly / 6-month / yearly) |
| Contains ads | No |
| Countries | All (or your chosen set) |

---

## 13. "What's new" / release notes (v1.0.0)

```
Welcome to HabitHatch 🥚

• Keep your daily habits and hatch a companion that grows with you.
• Build a Habit Garden of permanent perks from the coins you earn.
• Streak Freezes save you on the day you slip.
• A full offline stats dashboard: completion, streaks, trends, and more.
• Private by design: no account, no tracking, everything stays on your device.
• Optional HabitHatch+ unlocks every theme, companion, outfit and the full analytics.

Small habits, big changes.
```

---

## 14. Release build

- **Upload format:** Android App Bundle (`.aab`).
- **Path:** `android/app/build/outputs/bundle/release/app-release.aab`
- **Signing:** signed with the release keystore in `android/app/build.gradle`.
  - ⚠️ Back up `habithatch-release.keystore` and its passwords. With Play App Signing it is your **upload key** (gitignored, never commit it).
- On first upload, enroll in **Play App Signing** (default).

---

## 15. Submission checklist

- [x] Real app icon (egg)
- [x] Unused permissions removed
- [x] HabitHatch+ real Google Play Billing integrated
- [x] Privacy Policy + Terms finalized (real developer/contact/URL)
- [x] Signed release AAB built
- [ ] Create the `habithatch_plus` subscription + `monthly`/`yearly`/`sixmonth` base plans (§8)
- [ ] Set up a payments/merchant profile
- [ ] Add a license tester and run a test purchase on Internal testing
- [ ] Create the feature graphic (1024×500)
- [ ] Capture 2-8 phone screenshots
- [ ] Complete Data safety / Content rating / Target audience
- [ ] Roll out to Internal testing → verify → promote to Production
