import type { ClientScreenProps } from '../../../navigation/types';
import type { RequestCategory } from '../types/request';

export function openRequestForm(navigation: Pick<ClientScreenProps<'RequestTypeScreen'>['navigation'], 'navigate'>, category: RequestCategory) {
  if (category === 'RESIDENTIAL') navigation.navigate('ResidentialPropertyDetailsScreen');
  else if (category !== 'OTHER') navigation.navigate('BusinessRequest', { step: 0 });
  else navigation.navigate('RequestFlowPlaceholder', { category });
}
