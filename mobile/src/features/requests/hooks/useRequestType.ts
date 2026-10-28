import { useRequestDraftStore } from '../../../store/requestDraftStore';
import type { ClientScreenProps } from '../../../navigation/types';
import { openRequestForm } from '../services/openRequestForm';

export function useRequestType(navigation: ClientScreenProps<'RequestTypeScreen'>['navigation']) {
  const category = useRequestDraftStore(state => state.category);
  const selectCategory = useRequestDraftStore(state => state.setCategory);
  return { category, selectCategory, continueRequest: () => {
    if (!category) return;
    openRequestForm(navigation, category);
  } };
}
