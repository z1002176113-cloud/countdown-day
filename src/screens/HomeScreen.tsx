import React, { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FAB, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmptyState from '@/components/EmptyState';
import EventListItem from '@/components/EventListItem';
import { COLORS } from '@/constants/theme';
import { useSortedEvents, useHydrated } from '@/hooks/useEvents';
import { useCountdownStore } from '@/store/useCountdownStore';
import type { RootStackParamList } from '@/types/countdown';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const sortedEvents = useSortedEvents();
  const hydrated = useHydrated();
  const insets = useSafeAreaInsets();
  const togglePinned = useCountdownStore((s) => s.togglePinned);
  const toggleNotify = useCountdownStore((s) => s.toggleNotify);
  const deleteEvent = useCountdownStore((s) => s.deleteEvent);
  const [manageMode, setManageMode] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRow}>
          <IconButton
            icon="cog-outline"
            size={22}
            iconColor={COLORS.text}
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerIcon}
          />
          <Pressable hitSlop={8} onPress={() => setManageMode((m) => !m)}>
            <Text style={[styles.manageBtn, manageMode && styles.manageBtnActive]}>
              {manageMode ? '完成' : '管理'}
            </Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, manageMode]);

  const handlePressItem = (id: string) => {
    navigation.navigate('Edit', { id });
  };

  const handleDelete = (id: string) => {
    const item = sortedEvents.find((event) => event.id === id);
    const message = `确定删除「${item?.title ?? ''}」吗？删除后不可恢复。`;
    const performDelete = async (): Promise<void> => {
      await deleteEvent(id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`删除事件\n${message}`)) {
        void performDelete();
      }
      return;
    }

    Alert.alert('删除事件', message, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => void performDelete() },
    ]);
  };

  return (
    <View style={styles.container}>
      {!hydrated ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={sortedEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <EventListItem
              item={item}
              isTop={index === 0}
              manageMode={manageMode}
              onPress={handlePressItem}
              onTogglePin={(id) => togglePinned(id)}
              onToggleNotify={(id) => void toggleNotify(id)}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={
            sortedEvents.length === 0 ? styles.emptyContent : styles.listContent
          }
          ListEmptyComponent={<EmptyState onAdd={() => navigation.navigate('Add')} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        label="新增事件"
        color="#FFFFFF"
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('Add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    margin: 0,
    marginRight: 4,
  },
  manageBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 8,
  },
  manageBtnActive: {
    color: COLORS.danger,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 96,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
  },
});
