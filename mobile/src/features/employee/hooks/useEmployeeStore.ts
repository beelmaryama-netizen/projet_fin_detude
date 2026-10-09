import { create } from 'zustand';
import type { User } from '../../../types/identity';
import type { EmployeeMission, EmployeeProfile, EmployeeReport, EmployeeTask } from '../types/employee';
import { getEmployeeMissions } from '../services/mockEmployeeService';
import { getClosureErrors, getReportErrors } from '../services/missionRules';

type TaskPatch = Partial<Pick<EmployeeTask, 'status' | 'comment' | 'justification'>>;

export interface EmployeeState {
  ownerId: string | null;
  missions: EmployeeMission[];
  profile: EmployeeProfile | null;
  onboarded: boolean;
  loading: boolean;
  error?: string;
  bindOwner: (user: User | null) => void;
  load: () => Promise<void>;
  completeOnboarding: (profile: EmployeeProfile) => void;
  startMission: (id: string) => void;
  updateTask: (id: string, taskId: string, patch: TaskPatch) => void;
  setIncident: (id: string, text: string) => void;
  finishIntervention: (id: string) => Record<string, string>;
  updateReport: (id: string, patch: Partial<EmployeeReport>) => void;
  saveDraft: (id: string) => void;
  validateReport: (id: string) => Record<string, string>;
}

/** In-memory demo state survives navigation; logout or account changes clear all private data. */
export const useEmployeeStore = create<EmployeeState>((set, get) => {
  let bindingVersion = 0;
  let loaded = false;
  const changeMission = (id: string, change: (mission: EmployeeMission) => EmployeeMission) => {
    if (!get().ownerId) return;
    set(state => ({ missions: state.missions.map(mission => mission.id === id ? change(mission) : mission) }));
  };
  return {
    ownerId: null, missions: [], profile: null, onboarded: false, loading: false, error: undefined,
    bindOwner: user => {
      const ownerId = user?.role === 'EMPLOYEE' ? user.id : null;
      if (get().ownerId === ownerId) return;
      bindingVersion += 1;
      loaded = false;
      set({
        ownerId, missions: [], onboarded: false, loading: false, error: undefined,
        profile: ownerId && user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? '' } : null,
      });
    },
    load: async () => {
      const { ownerId, loading } = get();
      if (!ownerId || loading || loaded) return;
      const version = bindingVersion;
      set({ loading: true, error: undefined });
      try {
        const missions = await getEmployeeMissions(ownerId);
        if (version !== bindingVersion || get().ownerId !== ownerId) return;
        loaded = true;
        set({ missions, loading: false });
      } catch {
        if (version !== bindingVersion || get().ownerId !== ownerId) return;
        set({ loading: false, error: 'Impossible de charger les missions. Réessayez dans un instant.' });
      }
    },
    completeOnboarding: profile => {
      if (!get().ownerId || !profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) return;
      set({ profile: {
        firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), email: profile.email.trim(), phone: profile.phone.trim(),
      }, onboarded: true });
    },
    startMission: id => changeMission(id, mission => {
      if (mission.status !== 'UPCOMING' || mission.startedAt || mission.endedAt) return mission;
      return { ...mission, status: 'IN_PROGRESS', startedAt: new Date().toISOString() };
    }),
    updateTask: (id, taskId, patch) => changeMission(id, mission => {
      if (mission.status !== 'IN_PROGRESS') return mission;
      return { ...mission, tasks: mission.tasks.map(task => {
        if (task.id !== taskId) return task;
        if (patch.status && !['TODO', 'DONE', 'NOT_APPLICABLE'].includes(patch.status)) return task;
        if (patch.status === 'NOT_APPLICABLE' && !task.allowNotApplicable) return task;
        return {
          ...task,
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(typeof patch.comment === 'string' ? { comment: patch.comment } : {}),
          ...(typeof patch.justification === 'string' ? { justification: patch.justification } : {}),
        };
      }) };
    }),
    setIncident: (id, incident) => changeMission(id, mission => mission.status === 'IN_PROGRESS' ? { ...mission, incident } : mission),
    finishIntervention: id => {
      const mission = get().missions.find(item => item.id === id);
      if (!get().ownerId || !mission) return { status: 'Mission introuvable dans votre espace employé.' };
      const errors = getClosureErrors(mission);
      if (Object.keys(errors).length) return errors;
      changeMission(id, current => ({
        ...current, status: 'REPORT_PENDING', endedAt: new Date().toISOString(),
        report: { ...current.report, hasIncident: Boolean(current.incident.trim()), incidentDescription: current.incident.trim() },
      }));
      return {};
    },
    updateReport: (id, patch) => changeMission(id, mission => {
      if (mission.status !== 'REPORT_PENDING') return mission;
      const report = { ...mission.report };
      if (typeof patch.summary === 'string') report.summary = patch.summary;
      if (typeof patch.observations === 'string') report.observations = patch.observations;
      if (typeof patch.hasIncident === 'boolean') report.hasIncident = patch.hasIncident;
      if (typeof patch.incidentDescription === 'string') report.incidentDescription = patch.incidentDescription;
      if (Array.isArray(patch.photos)) report.photos = patch.photos
        .filter((photo, index, list) => photo.id && photo.uri && photo.name && list.findIndex(item => item.uri === photo.uri) === index)
        .slice(0, 5).map(photo => ({ id: photo.id, uri: photo.uri, name: photo.name }));
      return { ...mission, report };
    }),
    saveDraft: id => changeMission(id, mission => mission.status === 'REPORT_PENDING'
      ? { ...mission, report: { ...mission.report, savedAt: new Date().toISOString() } } : mission),
    validateReport: id => {
      const mission = get().missions.find(item => item.id === id);
      if (!get().ownerId || !mission) return { status: 'Mission introuvable dans votre espace employé.' };
      const errors = getReportErrors(mission);
      if (Object.keys(errors).length) return errors;
      const now = new Date().toISOString();
      changeMission(id, current => ({
        ...current, status: 'COMPLETED', report: { ...current.report, summary: current.report.summary.trim(),
          observations: current.report.observations.trim(), incidentDescription: current.report.incidentDescription.trim(), savedAt: now, validatedAt: now },
      }));
      return {};
    },
  };
});
