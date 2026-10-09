import type { EmployerRequest, EmployerRequestFilter } from '../types/employer';

function relativeLocalDate(today: Date, offset: number): string {
  const date = new Date(today);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Read-only, local demonstration data. No request or offer is created by this service. */
export function getEmployerRequests(): EmployerRequest[] {
  const today = new Date();
  return [
    {
      id: 'demo-request-001', clientName: 'Sophie Tremblay', serviceType: 'Grand ménage résidentiel', category: 'RESIDENTIAL',
      submittedAt: relativeLocalDate(today, 0), preferredDate: relativeLocalDate(today, 5), location: 'Rosemont, Montréal',
      description: 'Grand ménage d’un condo de trois pièces. Une attention particulière est demandée pour la cuisine et les fenêtres intérieures.', status: 'new',
    },
    {
      id: 'demo-request-002', clientName: 'Bureau Lavoie & Associés', serviceType: 'Entretien de bureaux', category: 'COMMERCIAL',
      submittedAt: relativeLocalDate(today, 0), preferredDate: relativeLocalDate(today, 7), location: 'Sainte-Foy, Québec',
      description: 'Entretien hebdomadaire de bureaux de 2 400 pi², incluant les salles de réunion et les espaces communs. Intervention souhaitée en soirée.', status: 'new',
    },
    {
      id: 'demo-request-003', clientName: 'Clinique du Parc', serviceType: 'Entretien de clinique', category: 'MEDICAL',
      submittedAt: relativeLocalDate(today, -1), preferredDate: relativeLocalDate(today, 4), location: 'Chomedey, Laval',
      description: 'Entretien de six salles de consultation et de la salle d’attente. Les protocoles et les produits autorisés doivent être précisés avant l’offre.', status: 'review',
    },
    {
      id: 'demo-request-004', clientName: 'Atelier Métal Rive-Sud', serviceType: 'Nettoyage industriel', category: 'INDUSTRIAL',
      submittedAt: relativeLocalDate(today, -2), preferredDate: relativeLocalDate(today, 10), location: 'Boucherville, Montérégie',
      description: 'Nettoyage des sols et des zones de circulation d’un atelier. En attente de précisions sur les accès et les consignes de sécurité.', status: 'waiting',
    },
    {
      id: 'demo-request-005', clientName: 'Émilie Gagnon', serviceType: 'Ménage après déménagement', category: 'RESIDENTIAL',
      submittedAt: relativeLocalDate(today, -3), preferredDate: relativeLocalDate(today, 6), location: 'Jacques-Cartier, Sherbrooke',
      description: 'Ménage complet d’une maison vide avant la remise des clés. Une offre de démonstration a été envoyée et attend une réponse.', status: 'offer-sent',
    },
    {
      id: 'demo-request-006', clientName: 'Librairie des Laurentides', serviceType: 'Entretien de commerce', category: 'COMMERCIAL',
      submittedAt: relativeLocalDate(today, -5), preferredDate: relativeLocalDate(today, 3), location: 'Saint-Jérôme, Laurentides',
      description: 'Entretien de la surface de vente et de l’arrière-boutique avant l’ouverture. L’horaire de la réservation de démonstration est confirmé.', status: 'confirmed',
    },
  ];
}

export function filterEmployerRequests(requests: readonly EmployerRequest[], filter: EmployerRequestFilter): EmployerRequest[] {
  return requests.filter(request => {
    switch (filter) {
      case 'all': return true;
      case 'new': return request.status === 'new';
      case 'actionable': return request.status === 'new' || request.status === 'review';
      case 'waiting': return request.status === 'waiting' || request.status === 'offer-sent';
      case 'confirmed': return request.status === 'confirmed';
    }
  });
}

export function getEmployerSummary(requests: readonly EmployerRequest[]) {
  return {
    new: filterEmployerRequests(requests, 'new').length,
    actionable: filterEmployerRequests(requests, 'actionable').length,
    waiting: filterEmployerRequests(requests, 'waiting').length,
    confirmed: filterEmployerRequests(requests, 'confirmed').length,
  };
}

/** These values are calendar dates, parsed at local noon rather than as UTC timestamps. */
export function formatEmployerDate(date: string): string {
  return new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}
