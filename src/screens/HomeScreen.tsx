import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmptyState from '@/components/EmptyState';
import EventListItem from '@/components/EventListItem';
import { COLORS } from '@/constants/theme';
import { useSortedEvents, useHydrated } from '@/hooks/useEvents';
import type { RootStackParamList } from '@/types/countdown';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const sortedEvents = useSortedEvents();
  const hydrated = useHydrated();
  const insets = useSafeAreaInsets();

  const handlePressItem = (id: string) => {
    navigation.navigate('Edit', { id });
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
          renderItem={({ item }) => <EventListItem item={item} onPress={handlePressItem} />}
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
