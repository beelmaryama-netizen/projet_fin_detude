export type BusinessCategory = 'COMMERCIAL' | 'INDUSTRIAL' | 'MEDICAL';
export const establishmentTypes = ['Bureau', 'Usine', 'Entrepôt', 'Commerce', 'Clinique / pharmacie', 'Clinique', 'Pharmacie', 'Cabinet médical', 'Cabinet dentaire', 'Restaurant', 'Immeuble commercial', 'Chantier industriel', 'Immeuble / chantier', 'Autre'] as const;
export const businessZones = ['Production', 'Bureaux', 'Cafétéria', 'Salles de bain', 'Entrepôt', 'Vestiaires', 'Aires communes', 'Surface de vente', 'Cuisine', 'Salles de réunion', 'Accueil', 'Salle d’attente', 'Salles de consultation', 'Salles de soins', 'Espaces de circulation', 'Quais de chargement'] as const;
export const frequencies = ['Ponctuel', 'Hebdomadaire', 'Quotidien', 'Personnalisé'] as const;
export interface BusinessDetails {
  establishmentType: typeof establishmentTypes[number] | '';
  companyName: string; areaSqft: string; floors: number; siteAddress: string;
  zones: (typeof businessZones[number])[];
  description: string; frequency: typeof frequencies[number] | ''; customFrequency: string; preferredHours: string;
  equipment: string; restrictedAreas: string; allowedProducts: string; constraints: string;
}
export interface RequestDocument { id: string; uri: string; name: string; size: number; mimeType: 'application/pdf' }
export const MAX_DOCUMENTS = 5;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const emptyBusinessDetails = (): BusinessDetails => ({ establishmentType: '', companyName: '', areaSqft: '', floors: 1, siteAddress: '', zones: [], description: '', frequency: '', customFrequency: '', preferredHours: '', equipment: '', restrictedAreas: '', allowedProducts: '', constraints: '' });
export const isBusinessCategory = (category: string | null): category is BusinessCategory => category === 'COMMERCIAL' || category === 'INDUSTRIAL' || category === 'MEDICAL';
