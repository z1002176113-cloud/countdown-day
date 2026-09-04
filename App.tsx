/**
 * 应用入口组件
 *  - 挂载全局 Provider：安全区(SafeAreaProvider) / UI 主题(PaperProvider) / 导航(NavigationContainer)
 *  - 启动初始化：初始化本地通知（前台展示 + 渠道 + 权限）→ 读取本地数据并校准到期提醒
 *    （store.init 由 Home 页 hydration 控制，避免数据未就绪时的空白）
 */
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DefaultTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from './constants/theme';
import AddEventScreen from './screens/AddEventScreen';
import EditEventScreen from './screens/EditEventScreen';
import HomeScreen from './screens/HomeScreen';
import { useCountdownStore } from './store/useCountdownStore';
import type { RootStackParamList } from './types/countdown';
import { initializeNotifications } from './utils/notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Paper 主题：浅色风，主色替换为项目品牌色 */
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
      // 通知模块初始化失败不应阻断 App 启动（核心功能是本地倒计时）
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
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerTitleAlign: 'center',
              headerTintColor: COLORS.text,
              headerStyle: { backgroundColor: COLORS.card },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: COLORS.background },
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: '极简倒数日' }}
            />
            <Stack.Screen
              name="Add"
              component={AddEventScreen}
              options={{ title: '新增事件' }}
            />
            <Stack.Screen
              name="Edit"
              component={EditEventScreen}
              options={{ title: '编辑事件' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="dark" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
