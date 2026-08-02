import React from 'react';
import { View } from 'react-native';
import { OverlayScreen } from '../components/OverlayScreen';
import { Txt } from '../components/ui';
import { useC } from '../theme/ThemeContext';

// PLACEHOLDER — built out in a later task.
export function PremiumScreen({ param }: { param?: any }) {
  const c = useC();
  return (
    <OverlayScreen title="Premium">
      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
        <Txt color={c.muted}>Premium — coming soon</Txt>
      </View>
    </OverlayScreen>
  );
}
