# Fork Guide — Notifications subsystem (`src/notifications/*`)

How Pawductivity wires **expo-notifications** (channels, RTC_WAKEUP scheduled alarms,
kill-survival, boot re-arm, permissions) and exactly what to reframe for HabitHatch's
habit reminders / evening sweep / hunger warning / streak-at-risk / hatch ping.

Source of truth (Pawductivity root `d:/Documents/Work/Project/Pawductivity`):
- `src/notifications/notifications.ts` — native (Android/iOS) implementation
- `src/notifications/notifications.web.ts` — web no-op stub (platform-resolved twin)
- `app.json` → `expo.plugins["expo-notifications"]` + `expo.android.permissions`
- `android/app/src/main/AndroidManifest.xml` — permissions (prebuild output)
- Call sites: `App.tsx`, `src/store/store.ts`, `src/screens/{FocusScreen,CalendarTab,ProfileScreen}.tsx`

---

## 1. WHAT'S HERE

### `src/notifications/notifications.ts` (native)

The whole module is defensively lazy. `expo-notifications` is a **native module** that is
**absent in Expo Go (SDK 53+) and on web**, so nothing is imported at module scope — it is
`require`d on first use behind guards, identical to the `billing.ts` / `google.ts` pattern.

```ts
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let N: any = null;            // cached module handle
let inited = false;           // channels/handler installed once

function mod(): any | null {  // null on web, Expo Go, or if require throws
  if (Platform.OS === 'web' || isExpoGo) return null;
  if (N) return N;
  try { N = require('expo-notifications'); return N; } catch { return null; }
}
```

Every exported function calls `mod()` first and **no-ops when it returns null** — the app can
never crash because notifications are unavailable.

**Exports (signatures):**

| Export | Signature | Responsibility |
|---|---|---|
| `isNotifSupported` | `(): boolean` | `!!mod()` — is the native module present. |
| `ReminderLike` (type) | see below | Minimal shape `syncReminders` needs (decoupled from the full `Reminder`). |
| `initNotifications` | `(): Promise<void>` | Idempotent (`inited` guard). Installs the **foreground presentation handler** and, on Android, creates the notification **channels**. |
| `hasNotifPermission` | `(): Promise<boolean>` | `getPermissionsAsync().granted`. |
| `requestNotifPermission` | `(): Promise<boolean>` | Ensures init, then `requestPermissionsAsync()` (Android-13+ `POST_NOTIFICATIONS` prompt); returns granted. |
| `scheduleFocusEnd` | `(atMs: number, title: string, body: string): Promise<void>` | **Focus-specific.** Schedules the end-of-phase alert (survives kill). |
| `cancelFocusEnd` | `(): Promise<void>` | Cancels the pending focus-end alert. |
| `showOngoingFocus` | `(title: string, body: string): Promise<void>` | **Focus-specific.** Sticky "in progress" shade notification (Android only). |
| `clearOngoingFocus` | `(): Promise<void>` | Cancels + dismisses the sticky notification. |
| `syncReminders` | `(reminders: ReminderLike[], enabled: boolean): Promise<void>` | **The reusable engine.** Reconciles all OS-scheduled reminder alarms against the current list + master toggle. |

```ts
export type ReminderLike = {
  id: number;
  name: string;
  time: string;  // 'HH:MM' (24h)
  rep: string;   // 'once' | 'daily' | 'weekdays' | 'weekly' | 'monthly'
  y?: number; mo?: number; day?: number;  // anchor date for once/weekly/monthly
};

const FOCUS_ID   = 'pawductivity-focus-end';      // stable id → replace, not stack
const ONGOING_ID = 'pawductivity-focus-ongoing';
```

**`initNotifications` — the handler + channels (Android):**

```ts
m.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: true,  shouldSetBadge: false,
  }),
});
if (Platform.OS === 'android') {
  const chan = (id: string, name: string) =>
    m.setNotificationChannelAsync(id, {
      name,
      importance: m.AndroidImportance.HIGH,            // HIGH ⇒ heads-up + RTC_WAKEUP
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: m.AndroidNotificationVisibility?.PUBLIC,
    });
  await chan('focus', 'Focus timer');
  await chan('reminders', 'Reminders');
}
```

Only **two channels** today: `focus` and `reminders`. `importance: HIGH` is what makes the
OS schedule an **exact RTC_WAKEUP alarm** and pop a heads-up notification even when the app is
backgrounded/killed.

**`syncReminders` — the reconcile loop (the pattern to reuse):**

```ts
export async function syncReminders(reminders: ReminderLike[], enabled: boolean) {
  const m = mod(); if (!m) return;
  // 1. cancel ONLY our reminder alarms (tagged data.type==='reminder'); leaves focus alert.
  const all = await m.getAllScheduledNotificationsAsync().catch(() => []);
  for (const n of all) if (n?.content?.data?.type === 'reminder')
    await m.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
  if (!enabled) return;                       // master toggle off ⇒ leave everything cancelled
  if (!(await hasNotifPermission())) return;  // no permission ⇒ nothing to schedule
  // 2. re-arm every reminder from scratch (idempotent full resync)
  for (const r of reminders) {
    const [hh, mm] = parseTime(r.time);
    for (const trigger of reminderTriggers(m, r, hh, mm)) {
      await m.scheduleNotificationAsync({
        content: { title: 'Pawductivity reminder', body: r.name, sound: 'default',
                   data: { type: 'reminder', id: r.id } },   // tag → selective cancel
        trigger,
      }).catch(() => {});
    }
  }
}
```

**`reminderTriggers` — the repeat→trigger mapping (the reusable scheduling logic):**

```ts
function reminderTriggers(m, r, hh, mm): any[] {
  const T = m.SchedulableTriggerInputTypes;  const ch = 'reminders';
  switch (r.rep) {
    case 'daily':    return [{ type: T.DAILY, hour: hh, minute: mm, channelId: ch }];
    case 'weekly':   /* anchor.getDay()+1 → expo weekday */
                     return [{ type: T.WEEKLY, weekday: anchor.getDay()+1, hour: hh, minute: mm, channelId: ch }];
    case 'weekdays': // expo weekday: 1=Sun..7=Sat ⇒ Mon–Fri = 2..6
                     return [2,3,4,5,6].map(weekday => ({ type: T.WEEKLY, weekday, hour: hh, minute: mm, channelId: ch }));
    case 'monthly':  // MONTHLY can't express "last valid day"; clamp 29–31 → 28 so it never skips a short month
                     return [{ type: T.MONTHLY, day: Math.min(28, r.day ?? 1), hour: hh, minute: mm, channelId: ch }];
    default:         // one-off: fire on anchored date; skip if already past
                     return d.getTime() <= Date.now() ? [] : [{ type: T.DATE, date: d, channelId: ch }];
  }
}
```

Note the **weekday convention** (expo: `1=Sunday … 7=Saturday`) and the two hard-won edge
cases baked in as comments: **weekdays = `[2,3,4,5,6]`** and **monthly clamp to 28**. Both are
directly relevant to HabitHatch's schedule model — copy them.

**`scheduleFocusEnd` (focus-specific, the kill-survival template):**

```ts
await m.cancelScheduledNotificationAsync(FOCUS_ID).catch(() => {});   // replace prior
const seconds = Math.max(1, Math.round((atMs - Date.now()) / 1000));
await m.scheduleNotificationAsync({
  identifier: FOCUS_ID,                                     // stable id ⇒ single alert
  content: { title, body, sound: 'default', data: { type: 'focus' } },
  trigger: { type: m.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
             seconds, channelId: 'focus' },
});
```

The comment states the guarantee plainly: *"This is what fires when the session ends while the
app is backgrounded or even fully killed (the OS holds the scheduled notification)."* That
guarantee is the whole reason HabitHatch can lean on the same mechanism for hatch/streak pings.

### `src/notifications/notifications.web.ts` (web stub)

Platform-resolved twin (Metro picks `.web.ts` on web). Re-declares the same `ReminderLike`
type and exports **every function as a no-op** returning the "unavailable" value
(`isNotifSupported()→false`, `hasNotifPermission()→false`, etc.). Keeps the web build free of
the native module and lets every call site stay platform-agnostic.

---

## 2. HOW IT CONNECTS

**Boot / init (App.tsx):**
```ts
useEffect(() => {
  useStore.getState().hydrate();   // loads persisted AppState → then syncs reminders
  initNotifications();             // channels + foreground handler, once at launch
}, []);
```

**Reminder lifecycle — all reconciliation flows through the store, never a screen:**

```
store.hydrate()  ──►  Notif.syncReminders(state.reminders, state.settings.notif)
                        (re-arms every alarm from persisted state on every launch)

store.setNotif(on)      ─┐
store.addReminder(r)     ├─►  syncReminderNotifs()  ──►  Notif.syncReminders(reminders, settings.notif)
store.deleteReminder(id) ─┘
```

`store.ts` keeps one private helper and calls it after any relevant mutation:
```ts
const syncReminderNotifs = () => {
  const s = get().state; if (!s) return;
  Notif.syncReminders(s.reminders, s.settings.notif);
};
```
So the OS-scheduled set is **always a pure function of persisted state** — there is no
imperative "add one alarm" path; every change does a full cancel-and-re-arm resync. This is
what makes it survive kill/reboot: on launch, `hydrate()` replays the entire reminder list
into fresh OS alarms.

**Permission prompt** is user-initiated from screens, not automatic:
- `ProfileScreen.tsx` (settings toggle) and `CalendarTab.tsx` both call
  `requestNotifPermission()` before enabling reminders.

**Focus alerts** are driven directly by the timer screen (bypass the store):
- `FocusScreen.tsx` calls `scheduleFocusEnd(endMs, title, body)` + `showOngoingFocus(...)` when
  a phase starts, and `cancelFocusEnd()` + `clearOngoingFocus()` on pause/leave/complete.
- `MainScreen.tsx` calls `clearOngoingFocus()` (defensive cleanup on return to the tab shell).

**Kill-survival & boot re-arm (native, "free"):**
- `app.json` declares `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`,
  `VIBRATE`.
- The scheduled notification becomes an **AlarmManager RTC_WAKEUP alarm** held by the OS; it
  fires with the app killed.
- **There is NO custom BootReceiver / Kotlin in this repo.** `MainApplication.kt` is stock
  Expo. Boot re-arm is provided by **expo-notifications' own bundled receiver**, which the
  library's manifest merges in on the strength of the `RECEIVE_BOOT_COMPLETED` permission — it
  re-registers persisted scheduled notifications after a reboot automatically. The app's
  launch-time `syncReminders()` is the belt-and-suspenders on top.

**Persistence:** reminders live inside the single `AppState` document (see §5 gotchas), so they
are restored by `persistence.load()` and re-armed at hydrate — no separate notification store.

---

## 3. REUSE VERBATIM

Copy these into HabitHatch essentially unchanged (only string renames noted in §4):

1. **The entire lazy-guard scaffolding** — `isExpoGo`, `N`, `inited`, `mod()`,
   `isNotifSupported()`. Zero changes. This is the crash-proofing that lets the app run in
   Expo Go / web / permission-denied without special-casing.
2. **`initNotifications()` structure** — the foreground `setNotificationHandler` block verbatim;
   the `chan(id, name)` helper verbatim. Only the **channel list** changes (§4).
3. **`hasNotifPermission()` / `requestNotifPermission()`** — verbatim. Permission model is
   identical (Android-13 `POST_NOTIFICATIONS`).
4. **`syncReminders()` reconcile pattern** — the *cancel-tagged-then-re-arm-all* loop is exactly
   what HabitHatch's per-habit reminders need. Reuse the algorithm; widen the `data.type` filter
   to cover HabitHatch's tag set (§4). **Keep the `data.type` tagging + selective-cancel design**
   — it is what lets multiple notification classes coexist without clobbering each other.
5. **`reminderTriggers()`** — the `rep → SchedulableTriggerInputTypes` mapping. **Keep the two
   embedded edge-case fixes**: `weekdays = [2,3,4,5,6]` (expo 1=Sun offset) and the
   **monthly-day clamp to 28**. HabitHatch's `weekdays` schedule maps 1:1; see §4 for the
   `times_per_week` gap.
6. **The whole `notifications.web.ts` no-op stub** — re-export the same function names as
   no-ops so the web build stays clean. Update only the exported names to match §4.
7. **`store.syncReminderNotifs()` wiring pattern** — "recompute the OS-scheduled set from
   persisted state after every relevant mutation, and once on hydrate." Reuse this control flow
   for HabitHatch's habit-reminder sync.
8. **App.json permission set + `expo-notifications` plugin block** — verbatim (icon/color point
   at HabitHatch's monochrome asset). PLAN §10 confirms: *"Nothing new beyond what Pawductivity
   already declares."*
9. **App.tsx init order** — `hydrate()` then `initNotifications()` in the mount effect.

---

## 4. CHANGE FOR HABITHATCH

HabitHatch keeps the identical **engine**; it swaps the **focus vocabulary for habit
vocabulary**, grows the **channel set**, and drives reminders from **`habits.reminder_time`**
instead of the standalone `reminders[]` list. Ties to PLAN.md §6 (data model) and §8
(notification matrix).

### 4a. Delete / rename the focus surface

- **Remove** `scheduleFocusEnd`, `cancelFocusEnd`, `showOngoingFocus`, `clearOngoingFocus`
  and the `FOCUS_ID` / `ONGOING_ID` constants and the `focus` channel. HabitHatch has no
  focus timer in MVP (PLAN §13 strips the pomodoro screens; a timer only reappears in the
  optional v3 "guided routine mode"). Their **FocusScreen/MainScreen call sites go away with
  the screens**.
- Rename the module-private ids and the title string `'Pawductivity reminder'` →
  `'HabitHatch'` (or per-notification titles, §4c).

### 4b. Channels — grow from 2 to the PLAN §8 set

`initNotifications()` should create the channels the notification matrix names. Replace the two
`chan(...)` calls with:

```ts
await chan('reminders', 'Habit reminders');  // per-habit + evening sweep
await chan('streak',    'Streak alerts');    // streak-at-risk + freeze reminder
await chan('care',      'Companion care');   // hunger warning
await chan('celebrate', 'Hatch & milestones');// hatch-ready, achievement pops
await chan('nudge',     'Re-engagement');     // 2-day no-open re-engagement
```

(`focus` is dropped.) Keep `importance: HIGH` for `reminders`/`streak`/`care`/`celebrate` so
they schedule exact RTC_WAKEUP alarms; `nudge` may drop to `DEFAULT` importance to be less
intrusive. PLAN §8 channel column maps exactly onto these ids.

### 4c. `ReminderLike` → habit-driven reminders

HabitHatch's reminders are **not** a separate `reminders[]` list; they are the
`reminder_time` field on each **habit** (PLAN §6 `habits` table). Reframe the input type and
build the schedule from the habit's `schedule_kind` + `weekdays`:

```ts
export type HabitReminder = {
  id: string;            // habits.id (uuid) — was numeric reminder id
  name: string;          // habits.name → notification body
  time: string;          // habits.reminder_time 'HH:MM' (nullable ⇒ skip)
  schedule_kind: 'daily' | 'weekdays' | 'times_per_week';
  weekdays?: string;     // '1,2,3,4,5' when schedule_kind==='weekdays'
};
```

Map `schedule_kind` to triggers (reuse `reminderTriggers`, adjusted):
- `daily`            → `{ type: DAILY, hour, minute }` (as-is).
- `weekdays`         → parse the `weekdays` CSV to expo weekdays (**+1 offset**, since PLAN
  stores `1=Mon..7=Sun`-ish app days — normalize to expo `1=Sun..7=Sat` here). Reuse the
  `[2..6]` construction pattern for the Mon–Fri default.
- `times_per_week`   → **no fixed clock schedule.** There is no calendar day to pin an alarm
  to; do **not** emit a per-day repeating trigger for these. Rely on the **evening sweep**
  (below) to nudge if the weekly quota is unmet, or (v3 "adaptive reminders", PLAN §4) learn a
  time. In MVP: skip scheduling a per-habit alarm for `times_per_week` habits.

Widen the selective-cancel filter so the resync owns all habit-reminder classes:
```ts
const OURS = new Set(['habit', 'sweep', 'streak', 'care', 'nudge']);
if (OURS.has(n?.content?.data?.type)) await m.cancelScheduledNotificationAsync(n.identifier)...
// and tag scheduled ones data:{ type:'habit', id: habit.id }
```

### 4d. The five PLAN §8 notification classes to add

All ride the **same `syncReminders`-style resync** (cancel-tagged → re-arm from state), invoked
from the store after any habit/day-summary/pet mutation and once on hydrate. Because the daily
rollover is recomputed deterministically on launch (PLAN §8), these are **nudges, not the
source of truth** — a missed fire never corrupts state.

| Class | Trigger shape | Channel | `data.type` | Notes |
|---|---|---|---|---|
| **Per-habit reminder** | `DAILY`/`WEEKLY` from `habits.reminder_time` | `reminders` | `habit` | Re-armed on boot (expo receiver) & every launch from `habits[]`. Direct reuse of §3.5. |
| **Evening sweep** | `DAILY` at 20:00 | `reminders` | `sweep` | One standing daily alarm. Body computed at fire time from today's logs ("3 habits still due"). Keep it scheduled unconditionally; it self-checks. |
| **Hunger warning** | fired at rollover when `health < 40` | `care` | `care` | Not a repeating clock alarm — emit an **immediate** local notification during the launch-time rollover job when health crosses below 40. (v2: fire while fully closed via `expo-task-manager`.) |
| **Streak at risk** | conditional `DAILY` at 21:30 | `streak` | `streak` | Schedule only while an active overall/per-habit streak exists and `all_clear` not yet met; the resync cancels it the moment the day clears (recompute → re-arm). |
| **Hatch ready** | **immediate** local notification | `celebrate` | `hatch` | Fire the instant `pet.hatch_progress` hits 3 (PLAN §7.4). `trigger: null` + stable id (mirror the old `showOngoingFocus` immediate-notification form). In-app Nursery overlay shows next open regardless. |

Plus (v2) **Freeze reminder** (`streak`, written at rollover after a Freeze auto-saved a
streak, delivered next morning) and **Re-engagement** (`nudge`, scheduled on last close, 2-day
no-open) — same resync engine.

### 4e. Copy reframes (focus → habit/companion)

| Pawductivity string | HabitHatch |
|---|---|
| `'Pawductivity reminder'` / `r.name` | per-habit: title `'Habit reminder'`, body `habit.name` |
| `'Focus session complete!'` / `"Come back to collect …reward."` | hatch-ready: `"It's hatching! 🥚"` / `"Your companion is ready to meet you."` |
| `"Focusing with ${petName}"` (sticky) | **removed** (no ongoing timer). Evening sweep body: `"${n} habits still due today."` |
| — | streak-at-risk: `"Your ${streak}-day streak is on the line — one check-off saves it."` |
| — | hunger: `"${petName} is getting hungry. Keep a habit to feed it."` |

### 4f. Store wiring

Rename `syncReminderNotifs()` → e.g. `syncHabitNotifs()`; feed it `state.habits` (+ derived
day state) instead of `state.reminders`, gated by `state.settings.notif`. Call it from:
`hydrate` (after migrate), `addHabit` / `editHabit` / `deleteHabit` / `archiveHabit`, the
**daily-rollover** routine (to (re)arm streak-at-risk / hunger / freeze), and `setNotif`.

---

## 5. GOTCHAS

1. **"Tables" in PLAN §6 are logical, not physical.** Persistence is a **single-document
   snapshot**, not relational SQLite. `src/db/persistence.ts` stores the *entire* `AppState`
   as one JSON string in a one-row kv table:
   ```ts
   'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);'
   // save: INSERT OR REPLACE INTO kv (key,value) VALUES ('app_state', JSON.stringify(state))
   ```
   So `habits` / `habit_logs` / `day_summary` / `garden_plots` become **slices on the
   `AppState` object** that serialize into that one blob — do **not** author real `CREATE TABLE`
   / migrations. Notification code just reads `state.habits`, never SQL. Add the same
   backfill-on-hydrate guard that `store.hydrate()` uses (`reminders: Array.isArray(...) ?
   loaded.reminders : def.reminders`) for the new `habits` slice, or a screen that spreads it
   will crash on an old snapshot.

2. **SQLite "snapshot flush" is debounced — reminders can be scheduled ahead of the write.**
   `store.scheduleSave()` waits **250 ms** before persisting:
   ```ts
   saveTimer = setTimeout(() => { const s = getState().state; if (s) persistence.save(s); }, 250);
   ```
   But `syncReminderNotifs()` runs **synchronously inside the mutation** (before the flush).
   That is fine for OS alarms (they don't depend on the DB), but if you make a notification's
   fire-time body read persisted state, remember the DB may lag the in-memory state by up to
   250 ms — always compute from `get().state`, never re-read the DB. Also: a hard kill within
   that 250 ms window loses the last mutation, but launch-time `syncReminders(hydratedState)`
   simply re-derives alarms from whatever *did* persist, so the set stays consistent.

3. **Never import `expo-notifications` at module scope.** It is null in Expo Go (SDK 53+) and
   on web; a top-level import crashes the JS bundle on launch in those environments. Keep the
   lazy `mod()` guard on **every** new function you add. This is also why there's a `.web.ts`
   twin — don't delete it.

4. **expo weekday offset (1=Sunday..7=Saturday).** Your habit `weekdays` almost certainly use
   a different base (PLAN's `'1,2,3,4,5'` reads as Mon–Fri). Convert at the trigger boundary,
   exactly as the reused code does with `anchor.getDay()+1` and the literal `[2,3,4,5,6]` for
   Mon–Fri. Off-by-one here silently fires reminders on the wrong day.

5. **`times_per_week` has no calendar anchor.** expo's schedulable triggers are all fixed-clock
   (DAILY/WEEKLY/MONTHLY/DATE/TIME_INTERVAL). A "3× per week, any day" habit cannot be a
   repeating alarm — don't try. Cover it with the evening sweep (quota-aware body) instead.

6. **`SCHEDULE_EXACT_ALARM` + heads-up needs `importance: HIGH`.** Dropping a channel to
   DEFAULT importance downgrades the alarm to inexact and kills the heads-up banner. Keep
   time-critical HabitHatch channels (streak-at-risk, hatch) at HIGH. On Android 14+, exact
   alarms may need the user-grantable exact-alarm permission — already declared; no runtime
   prompt is wired, and the code tolerates denial (it just no-ops).

7. **Kill-survival/boot re-arm is delegated, not hand-rolled.** `MainApplication.kt` is stock;
   there's no custom `BootReceiver`. Re-arming after reboot comes from **expo-notifications'
   merged receiver** keyed on the `RECEIVE_BOOT_COMPLETED` permission. If you ever remove that
   permission from `app.json`, boot re-arm silently dies (launch-time resync still covers app
   re-opens, but not a device that reboots and is never opened). Keep the permission.

8. **The following are unrelated spine gotchas** — they don't live in the notifications module
   but the fork touches the same app shell, so keep them in view:
   - **Fabric / reanimated-4 `matrix` engine (`PetSprite.tsx`).** The companion renderer runs a
     UI-thread reanimated `matrix` animation under the New Architecture (Fabric). PLAN §10 says
     it needs **zero changes**; do not "modernize" it. The hatch-ready notification's in-app
     counterpart (Nursery overlay) drives these SVGs — the notification layer only *pings*; the
     animation is a separate concern.
   - **Babel: worklets plugin is auto-appended — do not add it.** `babel.config.js` uses only
     `presets: ['babel-preset-expo']`; SDK 57's preset appends `react-native-worklets/plugin`
     itself. Adding `react-native-reanimated/plugin` (or worklets) manually double-applies and
     breaks the build. Leave `babel.config.js` alone in the fork.
   - **SVG consumption.** The 20 new HabitHatch props (`egg-*.svg`, `cat-*.svg`, `garden-*.svg`,
     `streak-flame.svg`, …) are **in-app UI SVGs** (react-native-svg / transformer), *not*
     notification icons. The notification icon is the flat monochrome PNG referenced by the
     `expo-notifications` plugin (`android-icon-monochrome.png`) + `notification_icon` drawable
     — Android notification small-icons must be monochrome PNG, **an SVG will not work there**.
     Don't try to feed the new egg/streak SVGs into a notification's `icon`.

---

## Quick reference — files to create in HabitHatch

| HabitHatch file | Derived from | Change |
|---|---|---|
| `src/notifications/notifications.ts` | Pawductivity same | Drop focus fns; grow channels to 5; `HabitReminder` type; add sweep/streak/care/hatch/nudge scheduling; widen `data.type` cancel filter. |
| `src/notifications/notifications.web.ts` | Pawductivity same | Same no-op stubs, renamed exports. |
| `app.json` | Pawductivity plugins/permissions | Keep permission set verbatim; point notification icon/color at HabitHatch asset. |
| `App.tsx` mount effect | Pawductivity | `hydrate()` + `initNotifications()` unchanged. |
| `src/store/store.ts` | Pawductivity `syncReminderNotifs` | Rename → `syncHabitNotifs`, source from `state.habits` + rollover, call from habit mutations + rollover + `setNotif`. |
