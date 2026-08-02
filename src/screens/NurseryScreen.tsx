import React from 'react';
import { View } from 'react-native';
import { OverlayScreen } from '../components/OverlayScreen';
import { Txt } from '../components/ui';
import { useC } from '../theme/ThemeContext';

// PLACEHOLDER — the egg -> crack -> hatch Nursery is built out in a later task.
export function NurseryScreen({ param }: { param?: any }) {
  const c = useC();
  return (
    <OverlayScreen title="Nursery">
      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
        <Txt color={c.muted}>Hatch sequence — coming soon</Txt>
      </View>
    </OverlayScreen>
  );
}
