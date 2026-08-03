// One-shot entitlement refresh on app launch (native). Reads the account's real Play purchases
// and syncs `premium` to whether the HabitHatch+ subscription is currently owned. If Play can't
// be reached, the persisted entitlement is left untouched — a flaky connection never locks a
// paying user out.
import { initConnection, getAvailablePurchases, endConnection } from 'expo-iap';
import { SUBSCRIPTION_SKU } from './config';

function ownsSub(purchases: any[]): boolean {
  return purchases.some((p) =>
    p?.productId === SUBSCRIPTION_SKU
    || (Array.isArray(p?.ids) && p.ids.includes(SUBSCRIPTION_SKU))
    || (Array.isArray(p?.productIds) && p.productIds.includes(SUBSCRIPTION_SKU)));
}

export async function syncPremiumFromStore(setPremium: (v: boolean) => void): Promise<void> {
  try {
    await initConnection();
    const purchases = ((await getAvailablePurchases()) as any[]) || [];
    // The read succeeded, so this is authoritative: grant or revoke to match Play.
    setPremium(ownsSub(purchases));
  } catch {
    /* offline / Play unavailable — keep the persisted entitlement */
  } finally {
    try { await endConnection(); } catch { /* no-op */ }
  }
}
