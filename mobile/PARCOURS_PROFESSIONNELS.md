# Parcours commercial, industriel et médical

Implémentation du 19 octobre 2026, à partir du dossier technique §6.2 et du catalogue UX écrans 17–23. Les trois catégories partagent la structure des étapes, mais leurs choix et contenus sont personnalisés selon la correction demandée par le client. Les termes client utilisent « service » et « demande ».

## Personnalisation par catégorie

`src/features/requests/data/businessProfiles.ts` centralise établissements, zones, libellés et exemples de service, horaires, contraintes et pièces jointes.

- Commercial : bureau, commerce, restaurant, immeuble commercial ou autre local commercial.
- Industriel : usine, entrepôt, chantier industriel ou autre site industriel.
- Médical : clinique, cabinet médical, cabinet dentaire, pharmacie ou autre établissement de santé ; aucune usine ni commerce générique.
- Les zones médicales incluent accueil, attente, consultation et soins ; les zones industrielles incluent production, stockage et quais. Les consignes et exemples suivent la catégorie choisie.
- Les schémas de formulaire et d’envoi refusent les établissements/zones incompatibles. Les anciens types génériques restent dans les types de lecture mais ne sont plus proposés dans ces nouveaux parcours.
- Les brouillons, photos, documents et disponibilités sont conservés séparément par catégorie pendant la session. Ils sont tous effacés après succès, déconnexion ou changement de compte.
- Validation après correction : TypeScript et 47 tests réussis. Aucun lint configuré. Contrôle visuel de cette correction non réalisé.

## Parcours livré

Accueil → type de service → type d’établissement → informations du site → zones → service et fréquence → contraintes → documents/photos → disponibilités → vérification → envoi mock → détail de la demande.

- Établissements : bureau, usine, entrepôt, commerce, clinique/pharmacie, restaurant, immeuble/chantier, autre.
- Entreprise, superficie en pi², étages et adresse du site obligatoires.
- Au moins une zone et une description du service obligatoires.
- Fréquence ponctuelle, hebdomadaire, quotidienne ou personnalisée ; précision obligatoire si personnalisée.
- Horaires souhaités, EPI, accès restreints, produits et autres consignes facultatifs.
- Galerie existante : aperçu/suppression, cinq photos maximum.
- Documents : sélection/suppression de PDF, cinq maximum et 10 Mo par fichier. Limites de démonstration centralisées dans `types/business.ts`, à confirmer pour l’API. Pas de transfert réseau ni de visualiseur PDF intégré.
- Brouillon Zustand conservé entre les écrans et supprimé après succès ou changement de compte.
- Envoi idempotent et demandes isolées par compte. Pas de réservation créée automatiquement.

## Fichiers créés

- `src/features/requests/types/business.ts`
- `src/features/requests/schemas/businessSchema.ts`
- `src/features/requests/schemas/businessSchema.test.ts`
- `src/features/requests/hooks/useBusinessRequest.ts`
- `src/features/requests/hooks/useRequestDocuments.ts`
- `src/features/requests/components/RequestDocumentPicker.tsx`
- `src/features/requests/screens/BusinessRequestScreen.tsx`
- Ce document.

## Fichiers adaptés

- `src/navigation/types.ts`, `ClientNavigator.tsx` : route typée `BusinessRequest`, paramètre `step` de 0 à 5.
- `src/store/requestDraftStore.ts` : établissement et PDF dans le brouillon existant.
- `src/features/requests/types/request.ts`, `schemas/scheduleSchema.ts` : union discriminée résidentiel/professionnel ; le payload professionnel ne contient pas de logement.
- Hooks `useRequestType`, `useSchedulePreferences`, `useRequestReview`.
- Composants `RequestProgress`, `RequestSummary`.
- Écrans `ResidentialSchedulePreferencesScreen`, `RequestReviewScreen` : disponibilité et vérification communes. Le nom technique de la route historique est conservé pour éviter de casser le parcours résidentiel.
- `src/features/client/types/client.ts`, `services/mockClientService.ts`, `services/mockClientService.test.ts`, `screens/MyRequestsScreen.tsx`, `screens/RequestDetailsScreen.tsx` : suivi des demandes professionnelles et lecture du bon type de description.
- `package.json`, `package-lock.json` : `expo-document-picker` compatible Expo 57.
- `README.md`, `LIVRAISON_CLIENT.md`, `VALIDATION.md`.

## Composants réutilisés

AuthLayout (SafeArea, clavier, ScrollView), Brand, AppText, Button, ControlledField, SelectionCard, ToggleRow, NumberStepper, MessageBanner, Card, RequestPhotoPicker, RequestProgress et RequestSummary. Aucun deuxième thème ni navigateur racine créé.

## Validation et limites

- TypeScript strict : réussi.
- Vitest : 43 tests réussis, dont six nouveaux cas pour les trois catégories, la validation professionnelle, les documents et l’isolation du brouillon.
- Export Expo Android/iOS/web : réussi. Ce contrôle produit les bundles, pas des APK/IPA installés.
- Aucun lint configuré dans le projet.
- Contrôle visuel de cette extension non réalisé : l’outil navigateur a refusé l’accès à l’aperçu local selon sa politique de sécurité.

À faire avant production : validation sur appareils Android/iOS (sélecteurs natifs, retour matériel, clavier, lecteur d’écran), upload et validation serveur des pièces jointes, persistance durable et API réelle. Seule la catégorie principale « Autre » reste un placeholder. Les écrans employés/admin ne sont pas modifiés.
