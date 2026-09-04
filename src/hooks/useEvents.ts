import { useMemo } from 'react';

import { useCountdownStore } from '@/store/useCountdownStore';
import { sortEventsByDate } from '@/utils/sort';

export function useSortedEvents() {
  const events = useCountdownStore((state) => state.events);
  return useMemo(() => sortEventsByDate(events), [events]);
}

export function useHydrated() {
  return useCountdownStore((state) => state.hydrated);
}
