import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useC } from '../theme/ThemeContext';
import { TabBar } from '../components/TabBar';
import { Toast } from '../components/Toast';
import { OverlayHost } from '../components/OverlayHost';
import { RewardOverlay } from '../screens/RewardOverlay';
import { TodayScreen } from './TodayScreen';
import { HabitsScreen } from './HabitsScreen';
import { PetScreen } from './PetScreen';
import { GardenScreen } from './GardenScreen';
import { useStore } from '../store/store';
import { TabKey } from '../domain/types';

export function MainScreen() {
  const c = useC();
  const tab = useStore((s) => s.state?.tab ?? 'today');
  const setTab = useStore((s) => s.setTab);
  const openOverlay = useStore((s) => s.openOverlay);
  const hasState = useStore((s) => !!s.state);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [tab]);

  if (!hasState) return <View style={[styles.root, { backgroundColor: c.cream }]} />;

  return (
    <View style={[styles.root, { backgroundColor: c.cream }]}>
      <Animated.View style={{ flex: 1, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
        {tab === 'today' ? <TodayScreen /> : tab === 'habits' ? <HabitsScreen /> : tab === 'pet' ? <PetScreen /> : <GardenScreen />}
      </Animated.View>
      <TabBar active={tab as TabKey} onTab={setTab} onCapture={() => openOverlay('editor')} />
      <OverlayHost />
      <RewardOverlay />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
