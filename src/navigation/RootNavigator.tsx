import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { MainScreen } from '../screens/MainScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useStore } from '../store/store';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Splash waits for both its timer and store hydration, then routes to Main (a saved
// profile exists) or Onboarding (first run).
function SplashRoute({ navigation }: any) {
  const hydrated = useStore((s) => s.hydrated);
  const hasState = useStore((s) => !!s.state);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (timeUp && hydrated) {
      navigation.replace(hasState ? 'Main' : 'Onboarding');
    }
  }, [timeUp, hydrated, hasState, navigation]);

  return <SplashScreen onDone={() => setTimeUp(true)} />;
}

export function RootNavigator() {
  const hasState = useStore((s) => !!s.state);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="Splash" component={SplashRoute} />
      <Stack.Screen name="Onboarding">
        {({ navigation }) => <OnboardingScreen onComplete={() => navigation.replace('Main')} />}
      </Stack.Screen>
      <Stack.Screen name="Main">
        {({ navigation }) => {
          // If state is wiped mid-session (reset), bounce back to onboarding.
          if (!hasState) {
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
            return null;
          }
          return <MainScreen />;
        }}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
