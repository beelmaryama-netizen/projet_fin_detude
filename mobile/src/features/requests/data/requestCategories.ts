import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';
import type { RequestCategory } from '../types/request';

export const requestCategories: ReadonlyArray<{
  value: RequestCategory; title: string; description: string; icon: ComponentProps<typeof Ionicons>['name'];
}> = [
  { value: 'RESIDENTIAL', title: 'Résidentiel', description: 'Appartement, condo ou maison.', icon: 'home-outline' },
  { value: 'COMMERCIAL', title: 'Commercial', description: 'Bureaux, commerces et espaces professionnels.', icon: 'business-outline' },
  { value: 'INDUSTRIAL', title: 'Industriel', description: 'Usines, entrepôts et zones de production.', icon: 'construct-outline' },
  { value: 'MEDICAL', title: 'Médical / Clinique', description: 'Cliniques et établissements de soins.', icon: 'medkit-outline' },
  { value: 'OTHER', title: 'Autre', description: 'Un besoin particulier à nous décrire.', icon: 'ellipsis-horizontal-circle-outline' },
];
export function categoryTitle(category: RequestCategory | null) {
  return requestCategories.find(item => item.value === category)?.title ?? 'Service';
}
