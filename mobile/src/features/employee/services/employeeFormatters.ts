import type { EmployeeMission, MissionStatus } from '../types/employee';
export const missionLabels: Record<MissionStatus, string> = { PLANNED: 'Planifiée', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée' };
export const dayKey = (date: string | Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
export const missionDate = (date: string) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Toronto', weekday: 'short', day: 'numeric', month: 'long' }).format(new Date(date));
export const missionTime = (date: string) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
export const missionProgress = (mission: EmployeeMission) => mission.checklist.filter(item => item.isDone).length + ' / ' + mission.checklist.length + ' tâches terminées';
