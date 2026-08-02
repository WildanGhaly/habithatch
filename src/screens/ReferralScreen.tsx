import React from 'react';
import { View } from 'react-native';
import { OverlayScreen } from '../components/OverlayScreen';
import { Txt } from '../components/ui';
import { useC } from '../theme/ThemeContext';

// PLACEHOLDER — built out in a later task.
export function ReferralScreen({ param }: { param?: any }) {
  const c = useC();
  return (
    <OverlayScreen title="Referral">
      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
        <Txt color={c.muted}>Referral — coming soon</Txt>
      </View>
    </OverlayScreen>
  );
}
