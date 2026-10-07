export type EmployeeMissionStatus = 'UPCOMING' | 'IN_PROGRESS' | 'REPORT_PENDING' | 'COMPLETED';
export type EmployeeTaskStatus = 'TODO' | 'DONE' | 'NOT_APPLICABLE';

export interface EmployeeTask {
  id: string;
  zone: string;
  title: string;
  required: boolean;
  allowNotApplicable: boolean;
  status: EmployeeTaskStatus;
  comment: string;
  justification: string;
}

export interface EmployeeReport {
  summary: string;
  observations: string;
  hasIncident: boolean;
  incidentDescription: string;
  photos: { id: string; uri: string; name: string }[];
  validatedAt?: string;
  savedAt?: string;
}

export interface EmployeeMission {
  id: string;
  reference: string;
  status: EmployeeMissionStatus;
  service: string;
  client: string;
  address: string;
  scheduledStart: string;
  plannedMinutes: number;
  instructions: string[];
  equipment: string[];
  tasks: EmployeeTask[];
  startedAt?: string;
  endedAt?: string;
  incident: string;
  report: EmployeeReport;
}

export interface EmployeeProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
