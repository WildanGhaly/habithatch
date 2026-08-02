import React, { ReactNode } from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';
import { colors } from '../theme/tokens';

// On web (and large screens) the app renders inside a centered phone frame on a dark
// backdrop, mirroring prototype/habithatch_v1.html's #device. On a real phone it just
// fills the screen.
export function DeviceFrame({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width >= 480;

  if (!framed) {
    return <View style={{ flex: 1, backgroundColor: colors.cream }}>{children}</View>;
  }

  const frameW = Math.min(440, width);
  const frameH = Math.min(940, height);
  return (
    <View style={{ flex: 1, backgroundColor: colors.backdrop, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: frameW,
          height: frameH,
          backgroundColor: colors.cream,
          borderRadius: 40,
          overflow: 'hidden',
          // subtle device bezel + drop shadow (proto #device shadow)
          borderWidth: 11,
          borderColor: '#10151b',
          // @ts-ignore web-only shadow
          boxShadow: '0 30px 80px rgba(0,0,0,.45)',
        }}
      >
        {children}
      </View>
    </View>
  );
}
