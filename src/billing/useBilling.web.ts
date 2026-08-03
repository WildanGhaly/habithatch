// Web stub for the billing hook. The web build ships no store billing, so this is a no-op that
// keeps the paywall screen renderable (it just shows the fallback prices with a disabled buy).
import { useStore } from '../store/store';
import { PlanId } from './config';
import { Billing } from './useBilling';

export function useBilling(): Billing {
  const showToast = useStore((s) => s.showToast);
  return {
    ready: false,
    busy: false,
    priceFor: (_planId: PlanId) => null,
    buy: async () => { showToast('Purchases are only available in the Play Store app.'); },
    restore: async () => { showToast('Purchases are only available in the Play Store app.'); },
    manage: async () => { showToast('Manage your subscription in the Play Store app.'); },
  };
}
