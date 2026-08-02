// Web has no local notifications; every export is a safe no-op. Metro resolves this
// file (over notifications.ts) when bundling for web.
import { Habit, Settings } from '../domain/types';

export async function initNotifications(): Promise<void> {}
export async function requestPermission(): Promise<boolean> {
  return false;
}
export async function syncHabitReminders(_habits: Habit[], _settings: Settings): Promise<void> {}
export async function notifyHatchReady(): Promise<void> {}
