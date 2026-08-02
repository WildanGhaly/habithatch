import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { OverlayScreen } from '../components/OverlayScreen';
import { useC } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { Txt, Card } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore } from '../store/store';
import { THEMES, ThemeDef } from '../domain/catalogs';

// Appearance overlay — the HabitHatch+ theme picker lifted out of the Profile screen
// (proto renderProfile "Appearance" section). Themes only move the accent family; the
// paper, cards and artwork stay identical, so this screen is a pure palette chooser.
export function AppearanceScreen() {
  const c = useC();
  const st = useStore((s) => s.state!);
  const setTheme = useStore((s) => s.setTheme);
  const openOverlay = useStore((s) => s.openOverlay);
  const showToast = useStore((s) => s.showToast);
  const premium = st.profile.premium;

  // A locked (premium) theme for a free user routes to the paywall instead of applying;
  // anything else applies instantly and confirms with a toast (proto setTheme).
  const pick = (t: ThemeDef) => {
    if (t.premium && !premium) {
      openOverlay('premium');
      return;
    }
    setTheme(t.id);
    showToast(`${t.name} theme applied`);
  };

  return (
    <OverlayScreen title="Appearance">
      <Txt weight={600} size={12.5} color={c.muted} style={{ lineHeight: 18, marginHorizontal: 2, marginBottom: 16 }}>
        Themes only shift the accent colors. Your paper, cards and companion stay exactly the same, so pick the palette that feels most like you.
      </Txt>

      <View style={styles.shead}>
        <Txt weight={700} size={16} color={c.tealInk}>Themes</Txt>
        {!premium && (
          <Txt weight={700} size={11.5} color={c.muted}>1 of {THEMES.length} free</Txt>
        )}
      </View>

      <Card style={{ padding: 14, paddingBottom: 13 }}>
        <View style={styles.grid}>
          {THEMES.map((t) => {
            const on = st.profile.theme === t.id;
            const locked = t.premium && !premium;
            return (
              <Pressable
                key={t.id}
                accessibilityLabel={`${t.name} theme`}
                onPress={() => pick(t)}
                style={({ pressed }) => [
                  styles.themecard,
                  { borderColor: on ? c.orange : c.line2, backgroundColor: on ? c.tint : '#fff' },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                {/* Two-tone swatch: sw[0] fills the circle, sw[1] overlays the lower-right
                    triangle (proto .themesw i:last-child clip-path). */}
                <View style={[styles.sw, { opacity: locked ? 0.45 : 1 }]}>
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: t.sw[0] }]} />
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderLeftWidth: 30,
                      borderLeftColor: 'transparent',
                      borderBottomWidth: 30,
                      borderBottomColor: t.sw[1],
                    }}
                  />
                </View>
                <Txt weight={800} size={10} color={c.tealInk} style={{ opacity: locked ? 0.45 : 1 }}>{t.name}</Txt>
                {locked && (
                  <View style={[styles.lk, { backgroundColor: c.yellow }]}>
                    <Icon name="lock" size={9} color="#7A4B00" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Card>
    </OverlayScreen>
  );
}

const styles = StyleSheet.create({
  shead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 2, marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 8 },
  themecard: { flex: 1, alignItems: 'center', gap: 6, paddingTop: 9, paddingBottom: 8, paddingHorizontal: 4, borderRadius: radius.sm, borderWidth: 1.5, position: 'relative' },
  sw: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.07)', overflow: 'hidden', position: 'relative' },
  lk: { position: 'absolute', top: 5, right: 5, width: 15, height: 15, borderRadius: 7.5, alignItems: 'center', justifyContent: 'center' },
});
