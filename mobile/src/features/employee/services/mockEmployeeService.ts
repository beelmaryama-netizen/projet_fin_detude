import type { EmployeeMission, EmployeeReport, EmployeeTask } from '../types/employee';

const emptyReport = (): EmployeeReport => ({ summary: '', observations: '', hasIncident: false, incidentDescription: '', photos: [] });
const task = (id: string, zone: string, title: string, required = true, allowNotApplicable = false): EmployeeTask => ({
  id, zone, title, required, allowNotApplicable, status: 'TODO', comment: '', justification: '',
});

/** Fresh, session-owned fixtures. All real times are relative to the time of loading. */
export function createDemoEmployeeMissions(ownerId: string, now = new Date()): EmployeeMission[] {
  const iso = (minutes: number) => new Date(now.getTime() + minutes * 60000).toISOString();
  return [
    {
      id: `${ownerId}-mission-001`, reference: 'MP-2026-041', status: 'UPCOMING', service: 'Ménage résidentiel',
      client: 'Sophie Tremblay', address: '4520, rue de la Roche, Montréal, QC', scheduledStart: iso(90), plannedMinutes: 150,
      instructions: ['Sonner à l’appartement 3 à l’arrivée.', 'Utiliser les produits sans parfum fournis.', 'Le chat reste dans la chambre fermée.'],
      equipment: ['Gants de protection', 'Chiffons en microfibre', 'Aspirateur', 'Produits sans parfum'],
      tasks: [
        task('kitchen-worktops', 'Cuisine', 'Nettoyer le plan de travail et l’évier'),
        task('kitchen-appliances', 'Cuisine', 'Nettoyer l’extérieur des appareils'),
        task('bathroom', 'Salle de bain', 'Nettoyer les sanitaires et la douche'),
        task('floors', 'Pièces de vie', 'Aspirer et laver les sols'),
        task('windows', 'Pièces de vie', 'Nettoyer les vitres accessibles', true, true),
        task('plants', 'Finitions', 'Dépoussiérer les tablettes', false, true),
      ],
      incident: '', report: emptyReport(),
    },
    {
      id: `${ownerId}-mission-002`, reference: 'MP-2026-038', status: 'IN_PROGRESS', service: 'Entretien de bureaux',
      client: 'Studio Nord', address: '1250, avenue du Mont-Royal Est, Montréal, QC', scheduledStart: iso(-45), plannedMinutes: 120,
      startedAt: iso(-35), instructions: ['Accès par la réception.', 'Ne pas déplacer les documents sur les bureaux.'],
      equipment: ['Gants de protection', 'Chariot d’entretien', 'Sacs de recyclage', 'Nettoyant multiusage'],
      tasks: [
        { ...task('reception', 'Accueil', 'Nettoyer les points de contact'), status: 'DONE' },
        { ...task('bins', 'Bureaux', 'Vider les corbeilles et trier les déchets'), status: 'DONE' },
        task('desks', 'Bureaux', 'Nettoyer les surfaces dégagées'),
        task('meeting', 'Salle de réunion', 'Nettoyer la table et les chaises', true, true),
        task('office-floors', 'Finitions', 'Aspirer les sols et laver l’entrée'),
      ],
      incident: '', report: emptyReport(),
    },
    {
      id: `${ownerId}-mission-003`, reference: 'MP-2026-046', status: 'UPCOMING', service: 'Ménage après déménagement',
      client: 'Amélie Gagnon', address: '6835, rue Saint-Denis, Montréal, QC', scheduledStart: iso(24 * 60), plannedMinutes: 210,
      instructions: ['Appartement vide au deuxième étage.', 'Récupérer la clé auprès de la concierge.'],
      equipment: ['Gants de protection', 'Aspirateur', 'Vadrouille', 'Dégraissant', 'Escabeau'],
      tasks: [
        task('cupboards', 'Cuisine', 'Nettoyer les placards vides'),
        task('oven', 'Cuisine', 'Dégraisser le four et la hotte'),
        task('moving-bathroom', 'Salle de bain', 'Nettoyer les sanitaires'),
        task('moving-windows', 'Pièces de vie', 'Nettoyer les vitres accessibles', true, true),
        task('moving-floors', 'Finitions', 'Nettoyer tous les sols'),
      ],
      incident: '', report: emptyReport(),
    },
  ];
}

/** Local demo only: replace this boundary with the authenticated API when it exists. */
export async function getEmployeeMissions(ownerId: string): Promise<EmployeeMission[]> {
  return createDemoEmployeeMissions(ownerId);
}
