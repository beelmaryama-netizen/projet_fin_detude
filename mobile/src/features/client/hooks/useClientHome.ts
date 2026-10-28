import { useAuthStore } from '../../../store/authStore';
import { useRequestDraftStore } from '../../../store/requestDraftStore';
import { reservationService } from '../services/clientServices';
import { reservationGroup } from '../services/clientFormatters';
import { useClientQuery } from './useClientData';
import type { RequestCategory } from '../../requests/types/request';
import type { ClientTabScreenProps } from '../../../navigation/types';
import { openRequestForm } from '../../requests/services/openRequestForm';

export function useClientHome(navigation: ClientTabScreenProps<'ClientHomeScreen'>['navigation']) {
  const user = useAuthStore(state => state.session?.user);
  const query = useClientQuery('reservations', reservationService.list);
  const reservations = (query.data ?? []).filter(item => reservationGroup(item) === 'upcoming').sort((a, b) => a.startAt.localeCompare(b.startAt));
  const setCategory = useRequestDraftStore(state => state.setCategory);
  return {
    firstName: user?.firstName ?? '', reservations, query,
    startRequest: (category?: RequestCategory) => {
      if (!category) { navigation.navigate('RequestTypeScreen'); return; }
      setCategory(category);
      openRequestForm(navigation, category);
    },
  };
}
