/**
 * 编辑事件页：自动回填原数据，支持「保存修改」与「删除事件」
 */
import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import EventForm from '../components/EventForm';
import { COLORS } from '../constants/theme';
import { useCountdownStore } from '../store/useCountdownStore';
import type { EventFormValues, RootStackParamList } from '../types/countdown';

type Props = NativeStackScreenProps<RootStackParamList, 'Edit'>;

export default function EditEventScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const events = useCountdownStore((state) => state.events);
  const updateEvent = useCountdownStore((state) => state.updateEvent);
  const deleteEvent = useCountdownStore((state) => state.deleteEvent);

  const item = useMemo(
    () => events.find((event) => event.id === id),
    [events, id],
  );

  const handleSubmit = async (values: EventFormValues): Promise<void> => {
    await updateEvent(id, values);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('删除事件', `确定删除「${item?.title ?? ''}」吗？删除后不可恢复。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!item) {
    // 数据异常兜底：理论上不会出现，出现时给提示并允许返回
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>未找到该事件，可能已被删除</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EventForm
        initialTitle={item.title}
        initialTargetDate={item.targetDate}
        submitLabel="保存修改"
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notFound: {
    textAlign: 'center',
    marginTop: 40,
    color: COLORS.subText,
    fontSize: 15,
  },
});
