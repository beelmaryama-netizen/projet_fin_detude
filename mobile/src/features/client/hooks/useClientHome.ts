import { useMemo } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import { getUpcomingReservations } from '../services/mockClientService';
import type { RequestCategory } from '../../requests/types/request';

export function useClientHome(navigation: { navigate: (screen: 'RequestTypeScreen') => void }) {
  const user = useAuthStore(state => state.session?.user);
  const reservations = useMemo(() => getUpcomingReservations(user?.id ?? ''), [user?.id]);
  const setCategory = useRequestDraftStore(state => state.setCategory);
  return {
    firstName: user?.firstName ?? '', reservations,
    startRequest: (category?: RequestCategory) => {
      if (category) setCategory(category);
      navigation.navigate('RequestTypeScreen');
    },
  };
}
