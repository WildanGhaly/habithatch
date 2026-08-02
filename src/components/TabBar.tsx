import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_H, radius, shadowSm } from '../theme/tokens';
import { useC } from '../theme/ThemeContext';
import { Txt, Bounded } from './ui';
import { TabKey } from '../domain/types';

// The 4 nav glyphs, inlined verbatim from prototype/habithatch_v1.html <nav class="tabbar">.
const NAV: { key: TabKey; label: string; kind: 'stroke' | 'fill'; inner: string }[] = [
  { key: 'today', label: 'Today', kind: 'stroke', inner: '<rect x="3.5" y="4.5" width="17" height="16" rx="3.2"/><path d="M3.5 9.2h17M8 2.6v3.6M16 2.6v3.6"/><path d="M8.4 14.2l2.4 2.4 4.8-5"/>' },
  { key: 'habits', label: 'Habits', kind: 'stroke', inner: '<path d="M9.5 6.5h11M9.5 12h11M9.5 17.5h11"/><path d="M3.2 6.3l1.5 1.5L7.6 5"/><path d="M3.2 11.8l1.5 1.5L7.6 10.5"/><circle cx="4.6" cy="17.5" r="1.6"/>' },
  { key: 'pet', label: 'Companion', kind: 'fill', inner: '<ellipse cx="7" cy="7.4" rx="2.1" ry="2.7"/><ellipse cx="12" cy="6.1" rx="2.1" ry="2.7"/><ellipse cx="17" cy="7.4" rx="2.1" ry="2.7"/><ellipse cx="19.6" cy="12.3" rx="1.9" ry="2.4"/><ellipse cx="4.4" cy="12.3" rx="1.9" ry="2.4"/><path d="M12 11.4c2.6 0 4.6 1.9 5.6 4 1.1 2.3-.5 4.8-3 4.8-.9 0-1.8-.3-2.6-.3s-1.7.3-2.6.3c-2.5 0-4.1-2.5-3-4.8 1-2.1 3-4 5.6-4z"/>' },
  { key: 'garden', label: 'Garden', kind: 'stroke', inner: '<path d="M12 21v-8"/><path d="M12 13c0-3.4 2.7-5.6 6.6-5.6 0 3.4-2.7 5.6-6.6 5.6z"/><path d="M12 13.6C12 10.7 9.6 8.7 6.2 8.7c0 2.9 2.4 4.9 5.8 4.9z"/><path d="M6 21h12"/>' },
];

function NavIcon({ item, color }: { item: (typeof NAV)[number]; color: string }) {
  const attrs = item.kind === 'stroke'
    ? 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    : 'fill="currentColor"';
  return <SvgXml xml={`<svg viewBox="0 0 24 24" ${attrs}>${item.inner}</svg>`} width={24} height={24} color={color} />;
}

export function TabBar({ active, onTab, onCapture }: { active: TabKey; onTab: (t: TabKey) => void; onCapture: () => void }) {
  const c = useC();
  const insets = useSafeAreaInsets();
  const left = NAV.slice(0, 2);
  const right = NAV.slice(2);
  const btn = (t: (typeof NAV)[number]) => {
    const on = active === t.key;
    return (
      <Pressable key={t.key} style={styles.tabBtn} onPress={() => onTab(t.key)}>
        {on && <View style={[styles.pill, { backgroundColor: c.tint2 }]} />}
        <NavIcon item={t} color={on ? c.teal : c.muted} />
        <Txt weight={700} size={10.5} color={on ? c.teal : c.muted}>{t.label}</Txt>
      </Pressable>
    );
  };
  return (
    <View style={[styles.bar, { backgroundColor: '#fff', borderTopColor: c.line, paddingBottom: insets.bottom, ...shadowSm(c), shadowOffset: { width: 0, height: -6 } }]}>
      <Bounded style={[styles.row, { height: NAV_H }]}>
        {left.map(btn)}
        <View style={styles.fabSlot}>
          <Pressable
            onPress={onCapture}
            accessibilityLabel="Add a habit"
            style={({ pressed }) => [styles.fab, { backgroundColor: c.orange, borderColor: c.card, shadowColor: c.orange, transform: [{ translateY: pressed ? -14 : -18 }] }]}
          >
            <SvgXml xml={'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'} width={28} height={28} />
          </Pressable>
        </View>
        {right.map(btn)}
      </Bounded>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, zIndex: 30 },
  row: { flexDirection: 'row', alignItems: 'center' },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pill: { position: 'absolute', top: '50%', width: 62, height: 50, borderRadius: radius.md, marginTop: -25 },
  fabSlot: { width: 62, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 62, height: 62, borderRadius: 31, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
});
