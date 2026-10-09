import { useRequestDraftStore } from '../../../store/requestDraftStore';
import type { ClientScreenProps } from '../../../navigation/types';

export function useRequestType(navigation: ClientScreenProps<'RequestTypeScreen'>['navigation']) {
  const category = useRequestDraftStore(state => state.category);
  const selectCategory = useRequestDraftStore(state => state.setCategory);
  return { category, selectCategory, continueRequest: () => {
    if (!category) return;
    if (category === 'RESIDENTIAL') navigation.navigate('ResidentialPropertyDetailsScreen');
    else navigation.navigate('RequestFlowPlaceholder', { category });
  } };
}
