import React from 'react';
import { View } from 'react-native';
import { OverlayScreen } from '../components/OverlayScreen';
import { Txt } from '../components/ui';
import { useC } from '../theme/ThemeContext';

// PLACEHOLDER — built out in a later task.
export function InsightsScreen({ param }: { param?: any }) {
  const c = useC();
  return (
    <OverlayScreen title="Insights">
      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
        <Txt color={c.muted}>Insights — coming soon</Txt>
      </View>
    </OverlayScreen>
  );
}
