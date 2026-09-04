/**
 * 新增事件页：填写名称 + 选择日期，保存后写入 store 并返回首页
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import EventForm from '../components/EventForm';
import { COLORS } from '../constants/theme';
import { useCountdownStore } from '../store/useCountdownStore';
import type { EventFormValues, RootStackParamList } from '../types/countdown';

type Props = NativeStackScreenProps<RootStackParamList, 'Add'>;

export default function AddEventScreen({ navigation }: Props) {
  const addEvent = useCountdownStore((state) => state.addEvent);

  const handleSubmit = async (values: EventFormValues): Promise<void> => {
    await addEvent(values);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <EventForm submitLabel="保存" onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
