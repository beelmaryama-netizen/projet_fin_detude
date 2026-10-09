import type { EmployeeMission, EmployeeTask } from '../types/employee';

const isJustifiedException = (task: EmployeeTask) => task.status === 'NOT_APPLICABLE'
  && task.allowNotApplicable && task.justification.trim().length > 0;

export function getProgress(mission: EmployeeMission) {
  const total = mission.tasks.length;
  const done = mission.tasks.filter(task => task.status === 'DONE').length;
  const notApplicable = mission.tasks.filter(isJustifiedException).length;
  const remaining = total - done - notApplicable;
  return { done, total, notApplicable, remaining, percent: total ? Math.round((done + notApplicable) / total * 100) : 0 };
}

function getTaskErrors(mission: EmployeeMission): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const task of mission.tasks) {
    if (task.status === 'NOT_APPLICABLE' && !task.allowNotApplicable) {
      errors[task.id] = 'Cette tâche ne peut pas être déclarée non applicable.';
    } else if (task.status === 'NOT_APPLICABLE' && !task.justification.trim()) {
      errors[task.id] = 'Justifiez pourquoi cette tâche ne s’applique pas.';
    } else if (task.required && task.status !== 'DONE' && !isJustifiedException(task)) {
      errors[task.id] = 'Cette tâche obligatoire doit être réalisée.';
    } else if (!['TODO', 'DONE', 'NOT_APPLICABLE'].includes(task.status)) {
      errors[task.id] = 'Le statut de cette tâche est invalide.';
    }
  }
  if (Object.keys(errors).length) errors.tasks = 'Vérifiez les tâches obligatoires et les justifications dans la checklist.';
  return errors;
}

export function getClosureErrors(mission: EmployeeMission): Record<string, string> {
  const errors = getTaskErrors(mission);
  if (mission.status !== 'IN_PROGRESS') errors.status = 'Seule une mission en cours peut être clôturée.';
  const start = Date.parse(mission.startedAt ?? '');
  if (!Number.isFinite(start) || start > Date.now() || mission.endedAt) {
    errors.timing = 'L’heure de début de l’intervention est invalide.';
  }
  return errors;
}

export function getReportErrors(mission: EmployeeMission): Record<string, string> {
  const errors = getTaskErrors(mission);
  if (mission.status !== 'REPORT_PENDING') errors.status = 'Terminez l’intervention avant de valider le rapport.';
  const start = Date.parse(mission.startedAt ?? '');
  const end = Date.parse(mission.endedAt ?? '');
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end > Date.now()) {
    errors.timing = 'Les horaires réels de l’intervention sont incomplets ou incohérents.';
  }
  if (mission.report.summary.trim().length < 10) errors.summary = 'Décrivez l’intervention en au moins 10 caractères.';
  if (mission.report.hasIncident && mission.report.incidentDescription.trim().length < 10) {
    errors.incidentDescription = 'Décrivez l’incident en au moins 10 caractères.';
  }
  return errors;
}

/** The elapsed time freezes as soon as the intervention ends, before report validation. */
export function getElapsedMs(mission: EmployeeMission, now = Date.now()): number {
  if (!mission.startedAt) return 0;
  const start = Date.parse(mission.startedAt);
  const end = mission.endedAt ? Date.parse(mission.endedAt) : now;
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0;
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(Math.max(0, Number.isFinite(ms) ? ms : 0) / 60000);
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}
