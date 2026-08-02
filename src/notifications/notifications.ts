// Local notifications (native). Habit reminders, the evening sweep, hunger/streak-at-risk
// nudges and the hatch ping. All scheduling is RTC_WAKEUP + kill-survivable; the daily
// rollover is recomputed deterministically on launch, so correctness never depends on a
// notification actually firing (they are nudges, not the source of truth).
//
// NOTE: the reminder scheduling detail is fleshed out in the notifications task; this module
// exposes the stable API the store calls and degrades to a safe no-op if the native module
// or permission is unavailable.
import { Habit, Settings } from '../domain/types';

let mod: typeof import('expo-notifications') | null = null;
let ready = false;

async function notif() {
  if (!mod) {
    try {
      mod = await import('expo-notifications');
    } catch {
      return null;
    }
  }
  return mod;
}

export async function initNotifications(): Promise<void> {
  const N = await notif();
  if (!N) return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    // Channels (Android). Match PLAN §8.
    const { Platform } = await import('react-native');
    if (Platform.OS === 'android') {
      const chans: { id: string; name: string }[] = [
        { id: 'reminders', name: 'Habit reminders' },
        { id: 'care', name: 'Companion care' },
        { id: 'streak', name: 'Streak alerts' },
        { id: 'celebrate', name: 'Celebrations' },
        { id: 'nudge', name: 'Re-engagement' },
      ];
      for (const c of chans) {
        await N.setNotificationChannelAsync(c.id, {
          name: c.name,
          importance: N.AndroidImportance.DEFAULT,
        });
      }
    }
    ready = true;
  } catch {
    /* notifications unavailable — degrade silently */
  }
}

export async function requestPermission(): Promise<boolean> {
  const N = await notif();
  if (!N) return false;
  try {
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// Reschedule per-habit daily reminders from each habit's reminder_time. Cancels and
// re-arms so it is idempotent (safe to call on every launch / habit change).
export async function syncHabitReminders(habits: Habit[], settings: Settings): Promise<void> {
  const N = await notif();
  if (!N || !ready) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    if (!settings.notif) return;
    for (const h of habits) {
      if (h.archived || !h.remind) continue;
      const [hh, mm] = h.remind.split(':').map((x) => parseInt(x, 10));
      if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
      await N.scheduleNotificationAsync({
        content: { title: 'HabitHatch', body: `Time to ${h.name.toLowerCase()}`, channelId: 'reminders' } as any,
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: hh, minute: mm } as any,
      });
    }
  } catch {
    /* ignore */
  }
}

export async function notifyHatchReady(): Promise<void> {
  const N = await notif();
  if (!N || !ready) return;
  try {
    await N.scheduleNotificationAsync({
      content: { title: 'Your egg is ready!', body: 'Something is hatching — come see.', channelId: 'celebrate' } as any,
      trigger: null,
    });
  } catch {
    /* ignore */
  }
}
