import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { DefaultTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import RootNavigator from '@/navigation/RootNavigator';
import { useCountdownStore } from '@/store/useCountdownStore';
import { initializeNotifications } from '@/services/notifications';

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
  },
};

export default function App() {
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        await initializeNotifications();
      } catch (error) {
        console.warn('[app] 通知初始化失败：', error);
      }
      if (!cancelled) {
        await useCountdownStore.getState().init();
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="dark" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
