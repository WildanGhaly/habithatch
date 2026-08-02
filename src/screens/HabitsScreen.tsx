import React from 'react';
import { View } from 'react-native';
import { Txt } from '../components/ui';
import { useC } from '../theme/ThemeContext';

// PLACEHOLDER tab — built out in a later task.
export function HabitsScreen() {
  const c = useC();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.cream }}>
      <Txt color={c.muted}>Habits — coming soon</Txt>
    </View>
  );
}
