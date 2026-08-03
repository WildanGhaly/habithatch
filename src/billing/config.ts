// Google Play Billing configuration for HabitHatch+.
//
// These IDs MUST match what you create in Play Console › Monetize › Products › Subscriptions:
//   • ONE subscription product with ID `habithatch_plus`
//   • THREE auto-renewing base plans under it, with these exact base-plan IDs:
//       - `monthly`   (billing period P1M)
//       - `sixmonth`  (billing period P6M)
//       - `yearly`    (billing period P1Y)
// Set the prices in Play Console; the app shows the live localized price it gets back.
//
// See store/STORE_LISTING.md → "HabitHatch+ billing setup" for the full walkthrough.

export const SUBSCRIPTION_SKU = 'habithatch_plus';

export type PlanId = 'monthly' | 'sixmonth' | 'yearly';

export interface PlanDef {
  id: PlanId;
  basePlanId: string;   // must match the Play Console base-plan ID
  dur: string;          // heading, e.g. "1 Year"
  sub: string;          // subheading, e.g. "Rp 9.900 / month"
  fallbackPrice: string; // shown only if the live price hasn't loaded yet
  per: string;          // e.g. "/year"
  badge?: boolean;      // "BEST VALUE"
}

// Order = display order in the paywall. `fallbackPrice` is illustrative and is replaced by the
// real Play price at runtime once products load.
export const PLANS: PlanDef[] = [
  { id: 'monthly',  basePlanId: 'monthly',  dur: '1 Month',  sub: 'Try it out',          fallbackPrice: 'Rp 15.000',  per: '/month' },
  { id: 'yearly',   basePlanId: 'yearly',   dur: '1 Year',   sub: 'Best price per month', fallbackPrice: 'Rp 119.000', per: '/year',  badge: true },
  { id: 'sixmonth', basePlanId: 'sixmonth', dur: '6 Months', sub: 'A season of habits',   fallbackPrice: 'Rp 69.000',  per: '/6 mo' },
];
