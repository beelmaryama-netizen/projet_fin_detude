import type { User } from '../../../types/identity';
export type MissionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PhotoPhase = 'BEFORE' | 'AFTER';
export interface MissionPhoto { id: string; uri: string; phase: PhotoPhase; createdAt: string }
export interface EmployeeMission {
  id: string; title: string; status: MissionStatus; startAt: string; endAt: string;
  address: string; description: string; accessNotes: string; instructions: string;
  team: string[]; checklist: { id: string; label: string; isDone: boolean }[];
  photos: MissionPhoto[]; startedAt?: string; completedAt?: string; report?: string; incident?: string;
}
export interface EmployeeNotification { id: string; title: string; message: string; missionId: string; read: boolean; createdAt: string }
export interface CompletionReport { note: string; incident: string }
export interface EmployeePreferences { assignments: boolean; changes: boolean }
export interface EmployeeService {
  list(user: User): Promise<EmployeeMission[]>;
  get(user: User, id: string): Promise<EmployeeMission>;
  start(user: User, input: { id: string; photos: MissionPhoto[] }): Promise<EmployeeMission>;
  toggle(user: User, input: { id: string; itemId: string; isDone: boolean }): Promise<EmployeeMission>;
  addPhoto(user: User, input: { id: string; photo: MissionPhoto }): Promise<EmployeeMission>;
  removePhoto(user: User, input: { id: string; photoId: string }): Promise<EmployeeMission>;
  complete(user: User, input: { id: string; report: CompletionReport }): Promise<EmployeeMission>;
  notifications(user: User): Promise<EmployeeNotification[]>;
  readNotification(user: User, id: string): Promise<void>;
  preferences(user: User): Promise<EmployeePreferences>;
  savePreferences(user: User, value: EmployeePreferences): Promise<EmployeePreferences>;
  contact(user: User, input: { missionId?: string; message: string }): Promise<string>;
}
export class EmployeeServiceError extends Error {
  constructor(message: string) { super(message); this.name = 'EmployeeServiceError'; }
}
