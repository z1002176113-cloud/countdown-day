import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddEventScreen from '@/screens/AddEventScreen';
import EditEventScreen from '@/screens/EditEventScreen';
import HomeScreen from '@/screens/HomeScreen';
import type { RootStackParamList } from '@/types/countdown';
import { COLORS } from '@/constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
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
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: '极简倒数日' }} />
      <Stack.Screen name="Add" component={AddEventScreen} options={{ title: '新增事件' }} />
      <Stack.Screen name="Edit" component={EditEventScreen} options={{ title: '编辑事件' }} />
    </Stack.Navigator>
  );
}
