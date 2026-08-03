// Native Google Play Billing hook for the HabitHatch+ paywall.
// Wraps expo-iap's useIAP and exposes a tiny, screen-friendly surface:
//   { ready, busy, priceFor(planId), buy(planId), restore() }.
// Everything is guarded so a billing hiccup never crashes the app — the worst case is a toast.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useIAP, deepLinkToSubscriptions } from 'expo-iap';
import { useStore } from '../store/store';
import { SUBSCRIPTION_SKU, PlanId, PLANS } from './config';

// Pull the base-plan offer (and its live price) out of a fetched Android subscription. Field
// shapes are read defensively (via any) so minor SDK differences degrade to the fallback price
// instead of throwing.
function androidOffers(sub: any): any[] {
  return sub?.subscriptionOfferDetailsAndroid || sub?.subscriptionOfferDetails || [];
}
function offerFor(sub: any, basePlanId: string): any | null {
  const offers = androidOffers(sub);
  return offers.find((o: any) => (o?.basePlanId ?? o?.basePlanIdAndroid) === basePlanId) || null;
}
function priceOf(offer: any): string | null {
  const phases = offer?.pricingPhases?.pricingPhaseList || offer?.pricingPhasesAndroid?.pricingPhaseList || offer?.pricingPhases || [];
  const phase = phases[phases.length - 1] || phases[0];
  return phase?.formattedPrice || offer?.formattedPrice || offer?.displayPrice || null;
}

export interface Billing {
  ready: boolean;                       // connected AND the subscription + its offers loaded
  busy: boolean;                        // a purchase/restore is in flight
  priceFor: (planId: PlanId) => string | null; // live localized price, or null (use fallback)
  buy: (planId: PlanId) => Promise<void>;
  restore: () => Promise<void>;
  manage: () => Promise<void>;          // open Play's subscription-management screen
}

export function useBilling(): Billing {
  const setPremium = useStore((s) => s.setPremium);
  const showToast = useStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);
  const finishedRef = useRef(false);

  const {
    connected, subscriptions, fetchProducts, requestPurchase, finishTransaction, hasActiveSubscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase: any) => {
      try {
        setPremium(true);
        showToast('HabitHatch+ is active. Enjoy every feature!');
        // Acknowledge the subscription so Play doesn't auto-refund it (non-consumable).
        await finishTransaction({ purchase, isConsumable: false });
      } catch { /* entitlement already granted; acknowledgement can be retried on next launch */ }
      finishedRef.current = true;
      setBusy(false);
    },
    onPurchaseError: (err: any) => {
      setBusy(false);
      // User cancelling isn't an error worth shouting about.
      const code = String(err?.code || '').toLowerCase();
      if (!code.includes('cancel')) showToast('Purchase didn\'t go through. Please try again.');
    },
  });

  // Load the subscription + its base-plan offers once connected.
  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [SUBSCRIPTION_SKU], type: 'subs' }).catch(() => {});
  }, [connected, fetchProducts]);

  const sub = (subscriptions || []).find((s: any) => s?.id === SUBSCRIPTION_SKU) as any;
  const ready = !!connected && !!sub && androidOffers(sub).length > 0;

  const priceFor = useCallback((planId: PlanId): string | null => {
    const def = PLANS.find((p) => p.id === planId);
    if (!def || !sub) return null;
    return priceOf(offerFor(sub, def.basePlanId));
  }, [sub]);

  const buy = useCallback(async (planId: PlanId) => {
    const def = PLANS.find((p) => p.id === planId);
    if (!def) return;
    if (!connected || !sub) { showToast('Play Store isn\'t ready yet. Please try again in a moment.'); return; }
    const offer = offerFor(sub, def.basePlanId);
    if (!offer?.offerToken) { showToast('That plan isn\'t available right now.'); return; }
    try {
      setBusy(true);
      await requestPurchase({
        request: {
          google: { skus: [SUBSCRIPTION_SKU], subscriptionOffers: [{ sku: SUBSCRIPTION_SKU, offerToken: offer.offerToken }] },
        } as any,
        type: 'subs',
      } as any);
      // Success/failure arrive via the onPurchaseSuccess / onPurchaseError callbacks.
    } catch (e: any) {
      setBusy(false);
      const code = String(e?.code || '').toLowerCase();
      if (!code.includes('cancel')) showToast('Couldn\'t start the purchase. Please try again.');
    }
  }, [connected, sub, requestPurchase, showToast]);

  const restore = useCallback(async () => {
    if (!connected) { showToast('Play Store isn\'t ready yet.'); return; }
    try {
      setBusy(true);
      const active = await hasActiveSubscriptions([SUBSCRIPTION_SKU]);
      setPremium(!!active);
      showToast(active ? 'HabitHatch+ restored.' : 'No active HabitHatch+ subscription found on this account.');
    } catch {
      showToast('Couldn\'t reach the Play Store to restore.');
    } finally {
      setBusy(false);
    }
  }, [connected, hasActiveSubscriptions, setPremium, showToast]);

  const manage = useCallback(async () => {
    try { await deepLinkToSubscriptions({ skuAndroid: SUBSCRIPTION_SKU } as any); }
    catch { showToast('Open the Play Store app › Subscriptions to manage HabitHatch+.'); }
  }, [showToast]);

  return { ready, busy, priceFor, buy, restore, manage };
}
