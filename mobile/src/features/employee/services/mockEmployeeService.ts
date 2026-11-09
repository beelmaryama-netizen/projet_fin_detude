import type { User } from '../../../types/identity';
import { EmployeeServiceError, type EmployeeMission, type EmployeeNotification, type EmployeePreferences, type EmployeeService } from '../types/employee';
import { completionSchema, contactSchema, missionPhotoSchema } from '../schemas/employeeSchemas';
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
interface Database { missions: EmployeeMission[]; notifications: EmployeeNotification[]; preferences: EmployeePreferences }
export function createMockEmployeeService(options: { latency?: number; now?: () => number; fail?: () => boolean } = {}): EmployeeService {
  const databases = new Map<string, Database>(); const now = options.now ?? Date.now; let sequence = 0;
  const date = (days: number, hour: number) => { const value = new Date(now() + days * 86400000); value.setUTCHours(hour, 0, 0, 0); return value.toISOString(); };
  async function database(user: User) {
    await new Promise<void>(resolve => setTimeout(resolve, options.latency ?? 350));
    if (user.role !== 'EMPLOYEE' || user.mustChangePassword) throw new EmployeeServiceError('Un compte employé actif avec un mot de passe personnel est requis.');
    if (options.fail?.()) throw new EmployeeServiceError('Connexion interrompue. Réessayez.');
    let db = databases.get(user.id);
    if (!db) {
      const missions: EmployeeMission[] = user.email.endsWith('@magicpro.demo') ? [
        { key: 'today', title: 'Entretien résidentiel', days: 0, status: 'PLANNED' as const, address: '123 rue Sainte-Catherine, Montréal, QC', description: 'Cuisine, salle de bain et planchers.' },
        { key: 'upcoming', title: 'Entretien de bureaux', days: 2, status: 'PLANNED' as const, address: '800 boulevard René-Lévesque, Montréal, QC', description: 'Bureaux, salle de réunion et espaces communs.' },
        { key: 'history', title: 'Entretien de clinique', days: -3, status: 'COMPLETED' as const, address: '450 avenue du Parc, Montréal, QC', description: 'Accueil et salle d’attente, selon les consignes de l’établissement.' },
      ].map(item => ({
        id: user.id + '-' + item.key, title: item.title, status: item.status, startAt: date(item.days, 16), endAt: date(item.days, 20),
        address: item.address, description: item.description, accessNotes: 'Sonner à l’arrivée. Stationnement dans la rue.',
        instructions: 'Respecter les produits autorisés et les zones indiquées. Contacter l’administration en cas de difficulté.',
        team: [user.firstName + ' ' + user.lastName],
        checklist: ['Vérifier les consignes et préparer le matériel', 'Nettoyer les zones prévues', 'Vérifier le résultat et ranger le matériel'].map((label, index) => ({ id: item.key + '-task-' + index, label, isDone: item.status === 'COMPLETED' })),
        photos: [], ...(item.status === 'COMPLETED' ? { startedAt: date(item.days, 16), completedAt: date(item.days, 20), report: 'Entretien effectué selon les consignes.', incident: '' } : {}),
      })) : [];
      db = { missions, notifications: missions.filter(item => item.status === 'PLANNED').map(item => ({ id: 'notification-' + item.id, title: 'Nouvelle mission assignée', message: item.title, missionId: item.id, read: false, createdAt: new Date(now()).toISOString() })), preferences: { assignments: true, changes: true } };
      databases.set(user.id, db);
    }
    return db;
  }
  function find(db: Database, id: string) { const mission = db.missions.find(item => item.id === id); if (!mission) throw new EmployeeServiceError('Cette mission n’est pas disponible ou ne vous est plus assignée.'); return mission; }
  function active(mission: EmployeeMission) { if (mission.status !== 'IN_PROGRESS') throw new EmployeeServiceError('Cette action nécessite une mission en cours.'); }
  return {
    list: async user => copy((await database(user)).missions),
    get: async (user, id) => copy(find(await database(user), id)),
    start: async (user, input) => {
      const mission = find(await database(user), input.id);
      if (mission.status !== 'PLANNED') throw new EmployeeServiceError('Cette mission a déjà démarré ou ne peut plus démarrer.');
      if (input.photos.length > 5 || input.photos.some(photo => !missionPhotoSchema.safeParse(photo).success || photo.phase !== 'BEFORE')) throw new EmployeeServiceError('Vérifiez les photos avant intervention.');
      mission.status = 'IN_PROGRESS'; mission.startedAt = new Date(now()).toISOString(); mission.photos = copy(input.photos); return copy(mission);
    },
    toggle: async (user, input) => {
      const mission = find(await database(user), input.id); active(mission);
      const item = mission.checklist.find(value => value.id === input.itemId); if (!item) throw new EmployeeServiceError('Tâche introuvable.');
      item.isDone = input.isDone; return copy(mission);
    },
    addPhoto: async (user, input) => {
      const mission = find(await database(user), input.id); active(mission);
      const parsed = missionPhotoSchema.safeParse(input.photo); if (!parsed.success) throw new EmployeeServiceError('Photo invalide.');
      if (mission.photos.some(item => item.id === input.photo.id)) return copy(mission);
      if (mission.photos.filter(item => item.phase === input.photo.phase).length >= 5) throw new EmployeeServiceError('Maximum 5 photos par étape.');
      mission.photos.push(copy(parsed.data)); return copy(mission);
    },
    removePhoto: async (user, input) => { const mission = find(await database(user), input.id); active(mission); mission.photos = mission.photos.filter(item => item.id !== input.photoId); return copy(mission); },
    complete: async (user, input) => {
      const mission = find(await database(user), input.id); active(mission);
      const parsed = completionSchema.safeParse(input.report); if (!parsed.success) throw new EmployeeServiceError('Vérifiez le rapport de fin.');
      mission.status = 'COMPLETED'; mission.completedAt = new Date(now()).toISOString(); mission.report = parsed.data.note; mission.incident = parsed.data.incident; return copy(mission);
    },
    notifications: async user => copy((await database(user)).notifications),
    readNotification: async (user, id) => { const item = (await database(user)).notifications.find(value => value.id === id); if (item) item.read = true; },
    preferences: async user => copy((await database(user)).preferences),
    savePreferences: async (user, value) => { const db = await database(user); db.preferences = { assignments: !!value.assignments, changes: !!value.changes }; return copy(db.preferences); },
    contact: async (user, input) => { const db = await database(user); if (input.missionId) find(db, input.missionId); if (!contactSchema.safeParse(input).success) throw new EmployeeServiceError('Décrivez votre demande (10 caractères minimum).'); return 'EMP-' + ++sequence; },
  };
}
