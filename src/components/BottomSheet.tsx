import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Animated, Easing, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useC } from '../theme/ThemeContext';
import { Txt } from './ui';

const H = Dimensions.get('window').height;

// Slide-up bottom sheet matching the prototype dialog: scrim fades in while the sheet
// slides up from the bottom (proto .slide-up), and slides back down on close. Rendered as
// an absolute overlay (NOT a Modal) so on web it stays inside the phone frame.
export function BottomSheet({
  visible, onClose, title, subtitle, children, align = 'center',
}: {
  visible: boolean; onClose: () => void; title?: string; subtitle?: string; children: ReactNode; align?: 'center' | 'left';
}) {
  const c = useC();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [render, setRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRender(true);
      Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
    } else if (render) {
      Animated.timing(anim, { toValue: 0, duration: 240, easing: Easing.bezier(0.4, 0, 0.9, 0.5), useNativeDriver: true }).start(({ finished }) => finished && setRender(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!render) return null;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [H, 0] });

  return (
    <View style={styles.host} pointerEvents="box-none">
      <Animated.View style={[styles.scrim, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.dialog, { paddingBottom: 22 + insets.bottom, transform: [{ translateY }] }]}>
        <View style={[styles.grip, { backgroundColor: c.line2 }]} />
        {title ? <Txt weight={700} size={19} color={c.tealInk} style={{ textAlign: align, marginBottom: 4 }}>{title}</Txt> : null}
        {subtitle ? <Txt size={13.5} color={c.muted} style={{ textAlign: align, marginBottom: 16, lineHeight: 20 }}>{subtitle}</Txt> : null}
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11,37,48,.5)' },
  dialog: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '90%', paddingHorizontal: 20, paddingTop: 22 },
  grip: { width: 40, height: 5, borderRadius: 9, alignSelf: 'center', marginBottom: 16 },
});
