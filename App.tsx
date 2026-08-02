import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { DeviceFrame } from './src/components/DeviceFrame';
import { fonts } from './src/assets/registry';
import { colors } from './src/theme/tokens';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useStore } from './src/store/store';
import { initNotifications } from './src/notifications/notifications';

export default function App() {
  const [loaded] = useFonts(fonts);

  useEffect(() => {
    useStore.getState().hydrate();
    initNotifications();
  }, []);

  if (!loaded) {
    // Keep the frame teal so the transition into the splash gradient is seamless.
    return <View style={{ flex: 1, backgroundColor: colors.teal }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <DeviceFrame>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </DeviceFrame>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
