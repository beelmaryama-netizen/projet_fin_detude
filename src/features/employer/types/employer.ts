import type { RequestCategory } from '../../requests/types/request';

/** Local SCRUM-17 demonstration labels, independent of any future API status contract. */
export type EmployerRequestStatus = 'new' | 'review' | 'waiting' | 'offer-sent' | 'confirmed';
export type EmployerRequestFilter = 'all' | 'new' | 'actionable' | 'waiting' | 'confirmed';

export interface EmployerRequest {
  id: string;
  clientName: string;
  serviceType: string;
  category: RequestCategory;
  submittedAt: string;
  preferredDate: string;
  location: string;
  description: string;
  status: EmployerRequestStatus;
}

export const employerStatusLabels: Record<EmployerRequestStatus, string> = {
  new: 'Nouvelle',
  review: 'À analyser',
  waiting: 'En attente',
  'offer-sent': 'Offre envoyée',
  confirmed: 'Confirmée',
};
