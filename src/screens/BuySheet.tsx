import React from 'react';
import { View } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { Txt } from '../components/ui';
import { useC } from '../theme/ThemeContext';
import { useStore } from '../store/store';

// PLACEHOLDER — built out in a later task.
export function BuySheet({ visible }: { param?: any; visible?: boolean }) {
  const c = useC();
  const close = useStore((s) => s.closeOverlay);
  return (
    <BottomSheet visible={!!visible} onClose={close} title="Buy">
      <View style={{ paddingVertical: 30, alignItems: 'center' }}>
        <Txt color={c.muted}>Buy — coming soon</Txt>
      </View>
    </BottomSheet>
  );
}
