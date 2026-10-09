# Livraison des premiers écrans client

## Comportement

L’authentification CLIENT ouvre `ClientHomeScreen`. Le logo PNG fourni est partagé avec l’authentification. L’accueil présente le prénom, les notifications, la demande de service, quatre catégories rapides et une réservation de démonstration. Les quatre onglets sont fonctionnels ; Mes demandes présente le brouillon, Réservations le mock et Profil le compte avec déconnexion.

`RequestTypeScreen` permet une seule catégorie. Continuer est désactivé sans sélection. Un raccourci depuis l’accueil présélectionne sa catégorie. Résidentiel ouvre `ResidentialPropertyDetailsScreen`, les autres catégories un placeholder.

Le logement utilise React Hook Form + Zod. Les nombres sont bornés, la superficie est positive, le type et la présence d’animaux sont obligatoires. La superficie utilise les pi² du contrat `area_sqft` du dossier technique, malgré le libellé m² d’une maquette. Description facultative limitée à 500 caractères. Galerie avec aperçu, suppression et cinq photos maximum ; pas de caméra, car aucun support caméra ne préexistait. Les permissions caméra/micro sont désactivées dans la configuration du plugin.

Le brouillon Zustand survit aux retours et démontages des écrans. Il reste uniquement en mémoire pour la session et est effacé à la déconnexion ou au changement de compte. Rien n’est envoyé. La date/préférences et la confirmation restent hors périmètre.

## Fichiers créés

Sous `src/` :

- `components/SelectionCard.tsx`, `components/NumberStepper.tsx`.
- `navigation/ClientNavigator.tsx`.
- `store/requestDraftStore.ts`, `store/requestDraftStore.test.ts`.
- `features/client/screens/ClientHomeScreen.tsx`, `ClientSectionScreen.tsx`, `ClientPlaceholderScreen.tsx`, `ReservationDetailsScreen.tsx`.
- `features/client/components/ClientLayout.tsx`, `ReservationCard.tsx`.
- `features/client/hooks/useClientHome.ts`.
- `features/client/services/mockClientService.ts` et `features/client/types/reservation.ts`.
- `features/requests/screens/RequestTypeScreen.tsx`, `ResidentialPropertyDetailsScreen.tsx`.
- `features/requests/components/RequestProgress.tsx`, `RequestPhotoPicker.tsx`.
- `features/requests/hooks/useRequestType.ts`, `useResidentialDetails.ts`, `useRequestPhotos.ts`.
- `features/requests/data/requestCategories.ts`, `features/requests/types/request.ts`.
- `features/requests/schemas/requestSchemas.ts`, `requestSchemas.test.ts`.

Documentation : ce fichier. Captures : `output/previews/client-home.png` et `logement-client.png`.

## Fichiers modifiés ou déplacés

- `Brand.tsx` et `ControlledField.tsx` déplacés de `features/auth/components/` vers `components/`, sans conserver de copies. Imports des écrans et composants d’authentification adaptés.
- `features/auth/components/AuthLayout.tsx` : emplacement facultatif de progression.
- `navigation/RootNavigator.tsx`, `navigation/types.ts` : branche CLIENT typée, pile publique préservée.
- `store/authStore.ts` : isolation et nettoyage du brouillon.
- `theme/tokens.ts` : fond #F8F9FA, bordures #E0E0E0 dans le thème unique.
- `package.json`, `package-lock.json` : bottom-tabs et expo-image-picker.
- `app.json` : fond et permissions de la galerie.
- `README.md`, `VALIDATION.md` : périmètre et résultats actualisés.

## Routes ajoutées

- Racine : `Client`.
- Pile client : `ClientTabs`, `RequestTypeScreen`, `ResidentialPropertyDetailsScreen`, `RequestFlowPlaceholder`, `RequestNextStep`, `Notifications`, `ReservationDetails`.
- Onglets : `ClientHomeScreen`, `ClientRequests`, `ClientReservations`, `ClientProfile`.

## Réutilisation

`Brand`, `AppText`, `Button`, `ControlledField`, `FormField`, `MessageBanner`, `AuthLayout`, le thème, les polices, le store de session et le hook de déconnexion existants. Les nouveaux hooks portent les actions de navigation/formulaire et le service mock porte les données de réservation. Aucun second thème ni copie des composants communs.

## Vérifications et limites

- TypeScript strict : réussi.
- Vitest : 24 tests réussis, dont six nouveaux tests de validation, isolation du brouillon et gestion des photos.
- Export Expo Android, iOS et web : réussi.
- Lint : aucun script ni configuration dans le projet existant.
- Navigateur 390 × 844 : connexion mock vers accueil, sélection obligatoire, formulaire vide refusé, formulaire valide vers étape préparée, retour avec superficie conservée, ajout/aperçu/suppression d’une photo locale, placeholder commercial et détail réservation vérifiés.
- À valider sur appareils : galerie native, permissions, clavier, zones sûres et lecteurs d’écran.

## TODO hors périmètre

- Développer date/préférences, confirmation et formulaires non résidentiels lorsque les flux sont spécifiés.
- Connecter les API demandes/réservations et le transfert des photos ; les mocks restent explicites dans le code.
- Définir si un brouillon doit persister après fermeture de l’application. Aucun stockage durable implicite n’est ajouté.

Documentation consultée : [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) et [React Navigation Bottom Tabs](https://reactnavigation.org/docs/bottom-tab-navigator/).
