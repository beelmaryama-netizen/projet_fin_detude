import type { EmployerRequest } from './employer';
import type { RequestCategory } from '../../requests/types/request';

export type AdminRoute =
  | { screen: 'estimate'; requestId: string; offerId?: string }
  | { screen: 'offer-preview' | 'offer-detail'; offerId: string }
  | { screen: 'offers'; sentFrom?: string; sentTo?: string }
  | { screen: 'missions'; filter?: MissionStatus | 'all'; dateFrom?: string; dateTo?: string }
  | { screen: 'mission-detail' | 'assignment'; missionId: string }
  | { screen: 'calendar' }
  | { screen: 'employees' | 'employee-create' }
  | { screen: 'employee-detail'; employeeId: string }
  | { screen: 'clients' }
  | { screen: 'client-detail'; clientId: string }
  | { screen: 'services' | 'reports' | 'settings' | 'support' };

export interface AdminScreenProps {
  route: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  onBack: () => void;
}
export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'refused' | 'expired' | 'cancelled';
export interface AdminOffer {
  id: string; requestId: string; status: OfferStatus;
  durationHours: number; employeeCount: number; subtotalCents: number;
  taxCents: number; totalCents: number; taxPercent: number;
  date: string; startTime: string; endTime: string; validityHours: number;
  requiresBeforePhotos?: boolean; requiresAfterPhotos?: boolean;
  notes: string; createdAt: string; sentAt?: string; validUntil?: string;
}
export interface EstimateInput {
  requestId: string; offerId?: string; durationHours: number; employeeCount: number;
  subtotal: string; taxPercent: string; date: string; startTime: string; endTime: string;
  validityHours: number; notes: string;
  requiresBeforePhotos?: boolean; requiresAfterPhotos?: boolean;
}
export type MissionStatus = 'unassigned' | 'planned' | 'in-progress' | 'completed' | 'cancelled';
export interface AdminMission {
  id: string; requestId: string; offerId?: string; employeeId?: string;
  employeeIds?: string[];
  date: string; startTime: string; endTime: string; status: MissionStatus;
  checklist: { id: string; label: string; completed: boolean; note?: string }[];
  notes: string; report?: string; incident?: string; startedAt?: string; completedAt?: string;
  photos?: import('../../employee/types/employee').MissionPhoto[]; requiresBeforePhotos?: boolean; requiresAfterPhotos?: boolean;
}
export interface AdminEmployee {
  id: string; firstName: string; lastName: string; email: string; phone: string;
  active: boolean; specialties: string[]; city: string; availability: string;
  createdAt: string; activationPending: boolean;
  workingHours?: { days: number[]; start: string; end: string };
}
export interface EmployeeInput {
  firstName: string; lastName: string; email: string; phone: string;
  city: string; specialties: string[]; availability: string;
  workingHours?: { days: number[]; start: string; end: string };
}
export interface AdminClient {
  id: string; name: string; email: string; phone: string; address: string;
  kind: 'Résidentiel' | 'Entreprise'; requestIds: string[];
}
export interface AdminService {
  id: string; name: string; category: RequestCategory; description: string; active: boolean;
}
export interface AdminSettings {
  companyName: string; contactEmail: string; contactPhone: string;
  defaultTaxPercent: number; defaultValidityHours: number; notifyNewRequests: boolean;
}
export interface AdminAuditEvent {
  id: string; at: string; text: string; entityId?: string;
}
export type AdminResult<T = undefined> = { ok: true; value: T } | { ok: false; error: string };
export interface AdminData {
  requests: EmployerRequest[]; employees: AdminEmployee[]; clients: AdminClient[];
  offers: AdminOffer[]; missions: AdminMission[]; services: AdminService[];
  settings: AdminSettings; audit: AdminAuditEvent[];
}

export interface AdminStore extends AdminData {
  ownerId: string | null;
  bindOwner: (ownerId: string | null) => void;
  saveEstimate: (input: EstimateInput) => AdminResult<AdminOffer>;
  sendOffer: (offerId: string) => AdminResult<AdminOffer>;
  resolveOffer: (offerId: string, decision: 'accepted' | 'refused') => AdminResult<AdminOffer>;
  cancelOffer: (offerId: string) => AdminResult;
  markRequestReview: (requestId: string) => void;
  assignMission: (missionId: string, employeeId: string) => AdminResult;
  setMissionEmployees: (missionId: string, employeeIds: string[]) => AdminResult;
  rescheduleMission: (missionId: string, date: string, startTime: string, endTime: string) => AdminResult;
  cancelMission: (missionId: string) => AdminResult;
  createEmployee: (input: EmployeeInput) => AdminResult<AdminEmployee>;
  updateEmployee: (employeeId: string, input: EmployeeInput) => AdminResult;
  setEmployeeActive: (employeeId: string, active: boolean) => AdminResult;
  updateService: (serviceId: string, values: Pick<AdminService, 'name' | 'description' | 'active'>) => AdminResult;
  updateSettings: (values: AdminSettings) => AdminResult;
}

export const offerStatusLabels: Record<OfferStatus, string> = {
  draft: 'Brouillon', sent: 'En attente', accepted: 'Acceptée', refused: 'Refusée', expired: 'Expirée', cancelled: 'Annulée',
};
export const missionStatusLabels: Record<MissionStatus, string> = {
  unassigned: 'À assigner', planned: 'Planifiée', 'in-progress': 'En cours', completed: 'Terminée', cancelled: 'Annulée',
};
