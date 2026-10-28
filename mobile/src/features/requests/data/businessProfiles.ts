import type { BusinessCategory, BusinessDetails } from '../types/business';
interface BusinessProfile {
  establishments: BusinessDetails['establishmentType'][];
  zones: BusinessDetails['zones'];
  question: string; nameLabel: string; serviceHint: string; hoursHint: string;
  constraintsLabel: string; constraintsHint: string; attachmentsHint: string;
}
export const businessProfiles: Record<BusinessCategory, BusinessProfile> = {
  COMMERCIAL: {
    establishments: ['Bureau', 'Commerce', 'Restaurant', 'Immeuble commercial', 'Autre'],
    zones: ['Accueil', 'Bureaux', 'Salles de réunion', 'Surface de vente', 'Cuisine', 'Salles de bain', 'Aires communes'],
    question: 'Quel type de local commercial ?', nameLabel: 'Nom de l’entreprise ou du commerce',
    serviceHint: 'Ex. : nettoyage des bureaux, vitrines et espaces accueillant la clientèle.',
    hoursHint: 'Ex. : avant l’ouverture ou après la fermeture du commerce.',
    constraintsLabel: 'Consignes du commerce (facultatif)', constraintsHint: 'Ex. : présence de clientèle, surfaces fragiles, alarme à l’entrée.',
    attachmentsHint: 'Ajoutez des photos des locaux, un plan ou les consignes d’accès du commerce.',
  },
  INDUSTRIAL: {
    establishments: ['Usine', 'Entrepôt', 'Chantier industriel', 'Autre'],
    zones: ['Production', 'Entrepôt', 'Quais de chargement', 'Bureaux', 'Cafétéria', 'Salles de bain', 'Vestiaires', 'Aires communes'],
    question: 'Quel type de site industriel ?', nameLabel: 'Nom de l’entreprise ou du site industriel',
    serviceHint: 'Ex. : nettoyage des planchers de production et des zones de stockage.',
    hoursHint: 'Ex. : pendant l’arrêt de production ou entre deux quarts de travail.',
    constraintsLabel: 'Consignes de sécurité du site (facultatif)', constraintsHint: 'Ex. : circulation d’engins, équipements à ne pas toucher, formation d’accès requise.',
    attachmentsHint: 'Ajoutez des photos des zones, un plan du site ou les consignes de sécurité applicables.',
  },
  MEDICAL: {
    establishments: ['Clinique', 'Cabinet médical', 'Cabinet dentaire', 'Pharmacie', 'Autre'],
    zones: ['Accueil', 'Salle d’attente', 'Salles de consultation', 'Salles de soins', 'Bureaux', 'Salles de bain', 'Espaces de circulation'],
    question: 'Quel type d’établissement de santé ?', nameLabel: 'Nom de la clinique, du cabinet ou de la pharmacie',
    serviceHint: 'Ex. : entretien de la salle d’attente et des salles de consultation. Précisez les surfaces concernées.',
    hoursHint: 'Ex. : après les consultations ou en dehors des heures d’accueil des patients.',
    constraintsLabel: 'Protocoles et consignes de l’établissement (facultatif)', constraintsHint: 'Précisez les protocoles à respecter, les surfaces et les équipements exclus du nettoyage.',
    attachmentsHint: 'Ajoutez un plan ou des consignes de nettoyage, sans renseignements ni photos permettant d’identifier des patients.',
  },
};
