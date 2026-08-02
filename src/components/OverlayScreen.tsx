import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_H, shadowSm } from '../theme/tokens';
import { useC } from '../theme/ThemeContext';
import { Txt, Bounded } from './ui';
import { Icon } from './Icon';
import { useStore } from '../store/store';

// Shared chrome for slide-up overlay screens: a header (back + centered title + optional
// right slot) over a scrollable body. Matches the prototype `.sheethead`.
export function OverlayScreen({
  title, right, children, scroll = true, onBack, belowHeader, backIcon = 'chevL',
}: {
  title: string; right?: ReactNode; children: ReactNode; scroll?: boolean;
  onBack?: () => void; belowHeader?: ReactNode; backIcon?: 'chevL';
}) {
  const c = useC();
  const insets = useSafeAreaInsets();
  const closeOverlay = useStore((s) => s.closeOverlay);
  const back = onBack || closeOverlay;

  return (
    <View style={[styles.root, { backgroundColor: c.cream }]}>
      <View style={[styles.head, { paddingTop: insets.top + 14, backgroundColor: '#fff', borderBottomColor: c.line }]}>
        <Bounded style={styles.headRow}>
          <Pressable style={[styles.iconbtn, { ...shadowSm(c) }]} onPress={back}>
            <Icon name={backIcon} size={18} color={c.teal} strokeWidth={2.5} />
          </Pressable>
          <Txt weight={700} size={18} color={c.tealInk} style={{ flex: 1 }}>{title}</Txt>
          {right ?? <View style={{ width: 40 }} />}
        </Bounded>
      </View>
      {belowHeader ? (
        <View style={[styles.belowHeader, { backgroundColor: '#fff', borderBottomColor: c.line }]}>
          <Bounded pad>{belowHeader}</Bounded>
        </View>
      ) : null}
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: NAV_H + insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
          <Bounded pad>{children}</Bounded>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  belowHeader: { paddingVertical: 10, borderBottomWidth: 1 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconbtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.9)', alignItems: 'center', justifyContent: 'center' },
});
