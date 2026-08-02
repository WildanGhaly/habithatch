import React from 'react';
import { View } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { Txt } from '../components/ui';
import { useC } from '../theme/ThemeContext';
import { useStore } from '../store/store';

// PLACEHOLDER — built out in a later task.
export function GoalSheet({ visible }: { param?: any; visible?: boolean }) {
  const c = useC();
  const close = useStore((s) => s.closeOverlay);
  return (
    <BottomSheet visible={!!visible} onClose={close} title="Goal">
      <View style={{ paddingVertical: 30, alignItems: 'center' }}>
        <Txt color={c.muted}>Goal — coming soon</Txt>
      </View>
    </BottomSheet>
  );
}
