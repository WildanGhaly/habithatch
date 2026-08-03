import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OverlayScreen } from '../components/OverlayScreen';
import { useC } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { Txt, Btn, Card } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { useStore } from '../store/store';
import { useBilling } from '../billing/useBilling';
import { PLANS, PlanId } from '../billing/config';

// HabitHatch+ premium overlay. Wired to Google Play Billing (expo-iap) via useBilling(): the CTA
// starts a real subscription purchase and prices come live from Play; entitlement is granted on a
// confirmed purchase and refreshed on launch. The teal hero is hardcoded and does NOT retheme.

const FEATS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'sparkle', title: 'Five app themes', desc: 'Dusk, Forest, Ocean and Ember. Pick one the minute you sign up' },
  { icon: 'shirt', title: 'The whole collection', desc: 'Every companion and every outfit included, no coins needed' },
  { icon: 'note', title: 'No habit cap', desc: 'Build the routine you actually have. Free holds 7' },
  { icon: 'chart', title: 'Full analytics', desc: '30 metrics across five dashboards, including blocker analysis and coin flow' },
  { icon: 'calendar', title: 'Unlimited history', desc: '12 weeks and all time, instead of the free 4 week window' },
  { icon: 'gift', title: 'Recap export', desc: 'Save the weekly card as an image to share' },
];

const TABLE: { label: string; free: string | boolean; plus: string | boolean }[] = [
  { label: 'App themes', free: '1', plus: '5' },
  { label: 'Companions', free: 'Dog, Cat', plus: 'All 5' },
  { label: 'Outfits', free: 'With coins', plus: 'All included' },
  { label: 'Active habits', free: '7', plus: 'No limit' },
  { label: 'Dashboards', free: '5', plus: '5' },
  { label: 'History window', free: '4 weeks', plus: 'All time' },
  { label: 'Blocker analysis', free: false, plus: true },
  { label: 'Recap export', free: false, plus: true },
];

export function PremiumScreen(_props: { param?: any }) {
  const c = useC();
  const st = useStore((s) => s.state!);
  const premium = st.profile.premium;
  const billing = useBilling();
  const [chosen, setChosen] = useState<PlanId>('yearly');

  const buy = () => { if (premium) billing.manage(); else billing.buy(chosen); };
  const restore = () => billing.restore();

  return (
    <OverlayScreen title="HabitHatch+">
      {/* Hero (hardcoded teal gradient — does not retheme) */}
      <LinearGradient colors={['#0C4C60', '#12667F']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
        <Icon name="crown" size={42} color={c.yellow} />
        <Txt weight={800} size={23} color="#fff" style={{ marginTop: 6 }}>HabitHatch+</Txt>
        <Txt weight={500} size={13.5} color="#BFE3F3" style={{ marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
          Make it yours on day one: five themes, every companion and outfit. All Garden perks stay earnable with coins, always.
        </Txt>
      </LinearGradient>

      {/* Active state banner */}
      {premium && (
        <View style={[styles.callout, { backgroundColor: '#F1F7EE', borderColor: '#DCEBD2', marginBottom: 14 }]}>
          <Icon name="checkCircle" size={15} color="#5B8A38" />
          <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 17 }}>
            <Txt weight={800} size={11.5} color={c.tealInk}>HabitHatch+ is active.</Txt> Themes, the full collection and every dashboard are yours.
          </Txt>
        </View>
      )}

      {/* Benefits */}
      <Card style={{ paddingHorizontal: 16, paddingVertical: 6, marginBottom: 14 }}>
        {FEATS.map((f, i) => (
          <View key={f.title} style={[styles.benrow, { borderBottomColor: c.line, borderBottomWidth: i === FEATS.length - 1 ? 0 : 1 }]}>
            <View style={[styles.benic, { backgroundColor: c.cream }]}>
              <Icon name={f.icon} size={20} color={c.yellow2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight={700} size={14} color={c.tealInk}>{f.title}</Txt>
              <Txt weight={500} size={11.5} color={c.muted} style={{ marginTop: 2, lineHeight: 16 }}>{f.desc}</Txt>
            </View>
          </View>
        ))}
      </Card>

      {/* Comparison */}
      <Txt weight={700} size={16} color={c.tealInk} style={{ marginBottom: 10, marginHorizontal: 2 }}>Free and Plus, side by side</Txt>
      <Card style={{ paddingHorizontal: 14, paddingVertical: 2 }}>
        {/* head */}
        <View style={[styles.cmprow, { borderBottomColor: c.line, borderBottomWidth: 1 }]}>
          <View style={{ flex: 1 }} />
          <View style={styles.cmpFree}>
            <Txt weight={800} size={10} color={c.muted} style={{ letterSpacing: 0.5 }}>FREE</Txt>
          </View>
          <View style={styles.cmpPlus}>
            <View style={[styles.cplus, { backgroundColor: c.yellow }]}>
              <Icon name="crown" size={12} color="#7A4B00" />
              <Txt weight={800} size={10} color="#7A4B00" style={{ letterSpacing: 0.5 }}>PLUS</Txt>
            </View>
          </View>
        </View>
        {TABLE.map((row, i) => (
          <View key={row.label} style={[styles.cmprow, { borderBottomColor: c.line, borderBottomWidth: i === TABLE.length - 1 ? 0 : 1 }]}>
            <View style={{ flex: 1 }}>
              <Txt weight={700} size={11.5} color={c.ink}>{row.label}</Txt>
            </View>
            <View style={styles.cmpFree}><Cell v={row.free} tone="free" /></View>
            <View style={styles.cmpPlus}><Cell v={row.plus} tone="plus" /></View>
          </View>
        ))}
      </Card>

      <View style={{ height: 14 }} />

      {/* Fairness note */}
      <View style={[styles.callout, { backgroundColor: c.cream, borderColor: c.line2 }]}>
        <Icon name="shield" size={14} color={c.orange} />
        <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 17 }}>
          Plus is themes, companions and deeper numbers. Every Garden perk that touches coins, decay or freezes stays earnable for free, so paying never makes the habits easier.
        </Txt>
      </View>

      <View style={{ height: 14 }} />

      {/* Plans */}
      {PLANS.map((p) => {
        const best = chosen === p.id;
        return (
          <Pressable key={p.id} onPress={() => setChosen(p.id)} style={[styles.plan, { borderColor: best ? c.orange : c.line, backgroundColor: best ? c.tint : '#fff' }]}>
            {p.badge && (
              <View style={[styles.bestbadge, { backgroundColor: c.orange }]}>
                <Txt weight={800} size={9.5} color="#fff" style={{ letterSpacing: 0.4 }}>BEST VALUE</Txt>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Txt weight={800} size={15.5} color={c.tealInk}>{p.dur}</Txt>
              <Txt weight={600} size={11.5} color={c.muted} style={{ marginTop: 1 }}>{p.sub}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt weight={800} size={15} color={c.tealInk}>{billing.priceFor(p.id) || p.fallbackPrice}</Txt>
              <Txt weight={600} size={11} color={c.muted}>{p.per}</Txt>
            </View>
          </Pressable>
        );
      })}

      <Btn title={premium ? 'Manage subscription' : billing.busy ? 'Processing…' : 'Subscribe with Google Play'} onPress={buy} block style={{ marginTop: 8 }} />
      <Btn title="Restore purchases" variant="ghost" onPress={restore} block style={{ marginTop: 10 }} />

      <Txt weight={600} size={11.5} color={c.muted} style={{ textAlign: 'center', lineHeight: 18, paddingHorizontal: 16, paddingTop: 10 }}>
        Billed through Google Play and linked to your account, so it restores on any device. Cancel anytime from Play Store subscriptions.
      </Txt>
    </OverlayScreen>
  );
}

// Comparison cell: true -> check, false -> close, else raw string (spec cell()).
function Cell({ v, tone }: { v: string | boolean; tone: 'free' | 'plus' }) {
  const c = useC();
  if (v === true) return <Icon name="check" size={13} color={c.good} />;
  if (v === false) return <Icon name="close" size={12} color="#CFC6B4" />;
  return (
    <Txt weight={tone === 'plus' ? 800 : 700} size={11.5} color={tone === 'plus' ? c.orange2 : c.muted} style={{ textAlign: 'center' }}>
      {v}
    </Txt>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, paddingVertical: 26, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden', marginBottom: 16 },
  callout: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', borderWidth: 1, borderRadius: radius.sm, padding: 11, paddingHorizontal: 12 },
  benrow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13 },
  benic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cmprow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  cmpFree: { width: 66, alignItems: 'center' },
  cmpPlus: { width: 76, alignItems: 'center' },
  cplus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 8 },
  plan: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderRadius: 18, paddingVertical: 15, paddingHorizontal: 16, marginBottom: 11, position: 'relative' },
  bestbadge: { position: 'absolute', top: -9, left: 16, paddingVertical: 3, paddingHorizontal: 9, borderRadius: radius.pill },
});
