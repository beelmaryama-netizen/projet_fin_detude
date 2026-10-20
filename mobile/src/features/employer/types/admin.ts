export type AdminOfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REFUSED' | 'EXPIRED' | 'CANCELLED';
export type AdminMissionStatus = 'TO_ASSIGN' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type AdminEmployeeStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminOffer {
  id: string;
  reference: string;
  requestId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  address: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  employeeCount: number;
  subtotalCents: number;
  taxRateBps: number;
  taxCents: number;
  totalCents: number;
  validDays: number;
  notes: string;
  conditions: string;
  status: AdminOfferStatus;
  createdAt: string;
}

export interface AdminMissionLog {
  id: string;
  at: string;
  label: string;
}

export interface AdminMission {
  id: string;
  reference: string;
  offerId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  address: string;
  startAt: string;
  endAt: string;
  employeeCount: number;
  employeeIds: string[];
  status: AdminMissionStatus;
  checklist: string[];
  instructions: string;
  logs: AdminMissionLog[];
}

export interface AdminEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  specialties: string[];
  availability: string;
  status: AdminEmployeeStatus;
}

export interface AdminClient {
  id: string;
  kind: 'RESIDENTIAL' | 'BUSINESS';
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface EstimateDraft {
  requestId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  address: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  employeeCount: number;
  subtotalCents: number;
  taxRateBps: number;
  validDays: number;
  notes: string;
  conditions: string;
}

export type AdminStackParamList = {
  AdminHome: undefined;
  CreateEstimate: { requestId?: string } | undefined;
  OfferPreview: { offerId: string };
  Offers: undefined;
  MissionsToAssign: undefined;
  AssignEmployees: { missionId: string };
  DispatchCalendar: undefined;
  MissionDetail: { missionId: string };
  Employees: undefined;
  CreateEmployee: undefined;
  EmployeeDetail: { employeeId: string };
  Clients: undefined;
  ClientDetail: { clientId: string };
  LegacyEmployerDashboard: undefined;
};
