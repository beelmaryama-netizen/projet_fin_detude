# Livraison du front-end client MagicPro

Mise à jour : 19 octobre 2026. Stack, thème, logo et architecture conservés. Aucune nouvelle dépendance pour cette livraison.

## Parcours livré

- Accueil → type de service → logement → date/préférences → récapitulatif → demande envoyée → détail de la demande.
- Mes demandes : filtres Toutes / En analyse / Offre reçue / Acceptées / Fermées, résumé et historique.
- Mes offres : liste, détail du prix avec taxes et total, expiration, acceptation/refus avec confirmation et motif facultatif.
- Acceptation → réservation **en attente de confirmation**. La confirmation administrative n’est pas simulée par une action du client.
- Réservations : À venir / Passées / Annulées, détails, offre et demande liées, annulation sous condition.
- Notifications : lecture individuelle, tout marquer comme lu, navigation vers le dossier associé.
- Profil : informations personnelles, adresses, préférences, sécurité, support et déconnexion.
- États vide, chargement, erreur et réessai ; actualisation des listes.

Les quatre onglets restent Accueil, Mes demandes, Réservations et Profil. Les offres sont accessibles depuis l’accueil, les demandes et le profil.

## Audit et arbitrages

Les composants publics, les trois premiers écrans client, le formulaire RHF/Zod, le brouillon Zustand et la galerie existaient déjà. Les sections sommaires ont été remplacées dans la navigation par les écrans complets. `ClientSectionScreen.tsx` est désormais un point de réexport, sans conserver un deuxième rendu de ces sections.

Les références sont le dossier équipe, le catalogue UX, les PNG et le design system déjà analysés dans `ANALYSE_MAGICPRO.md`. Le vocabulaire client respecte demande → offre → réservation. Le refus d’offre garde la demande ouverte pour réanalyse. Le prix complet est affiché avant acceptation, contrairement à la mention de taxes différées dans un PNG.

Décisions explicitement provisoires :

- Annulation mock jusqu’à 24 heures avant l’horaire prévu ; règle affichée dans le détail. Politique métier à confirmer.
- Disponibilités à partir du lendemain, saisies en AAAA-MM-JJ, une ou deux plages distinctes. Les disponibilités ne constituent pas une réservation.
- Le carnet d’adresses peut être utilisé dans la demande ; l’adresse peut aussi être précisée ultérieurement, conformément au champ conditionnel demandé. L’adresse choisie est copiée dans le dossier soumis.
- Taxes : montants de démonstration déjà fournis dans l’offre, jamais recalculés dans l’interface comme une règle fiscale réelle.
- Coordonnées téléphoniques/email du support absentes des sources : aucune coordonnée réelle inventée. Configuration centralisée dans `supportContent.ts` et formulaire simulé opérationnel.
- Le courriel reste en lecture seule en attendant le parcours de vérification de changement d’adresse.

## Écrans ajoutés

Sous `src/features/requests/screens/` :

- `ResidentialSchedulePreferencesScreen.tsx`
- `RequestReviewScreen.tsx`
- `RequestSubmittedScreen.tsx`

Sous `src/features/client/screens/` :

- `MyRequestsScreen.tsx`, `RequestDetailsScreen.tsx`
- `MyQuotesScreen.tsx`, `QuoteDetailsScreen.tsx`
- `MyReservationsScreen.tsx`, `NotificationsScreen.tsx`
- `ClientProfileScreen.tsx`, `EditProfileScreen.tsx`
- `MyAddressesScreen.tsx`, `AddressFormScreen.tsx`
- `NotificationPreferencesScreen.tsx`, `SecurityScreen.tsx`
- `SupportScreen.tsx`, `ContactSupportScreen.tsx`

Écrans existants modifiés : `ClientHomeScreen`, `ReservationDetailsScreen`, `ClientPlaceholderScreen` et l’ancien fichier de sections. Le logement existant est raccordé à la suite via son hook.

## Composants

Créés : `Card`, `StatusChip`, `FilterTabs`, `ToggleRow`, `ConfirmModal`, `AsyncState` (avec `EmptyState`, `LoadingState`, `ErrorState`) et `RequestSummary`.

Réutilisés : `Brand`, `AppText`, `Button`, `ControlledField`, `FormField`, `SelectionCard`, `NumberStepper`, `MessageBanner`, `AuthLayout`, `ClientLayout`, `ReservationCard`, `RequestProgress`, `RequestPhotoPicker`, thème et polices.

`ClientLayout` reçoit la gestion du clavier et l’actualisation. `ReservationCard` réutilise désormais `Card` et `StatusChip`, et affiche le véritable statut de la réservation.

## État, services et types

- `requestDraftStore.ts` enrichi : disponibilités, instructions, notes d’accès, adresse et clé d’envoi. Pas de second store de formulaire.
- Le brouillon reste en mémoire, survit aux retours, se vide après envoi réussi et à la déconnexion. Un échec conserve les saisies.
- TanStack Query gère les ressources client et leurs mutations ; clés de cache par compte. Les mutations invalident les données liées. Aucun énorme store global supplémentaire.
- `clientServices.ts` expose `requestService`, `quoteService`, `reservationService`, `addressService`, `notificationService`, `supportService` avec interfaces Promise remplaçables par Axios.
- `mockClientService.ts` centralise la simulation avec latence, validation, isolation des comptes, contrôle des transitions et injection d’erreurs pour les tests.
- `clientFixtures.ts` fournit des dossiers cohérents et datés relativement au lancement pour les comptes `@magicpro.demo`. Les autres comptes commencent avec des listes vides.
- `profileService.ts` utilise le mock d’authentification existant pour que les modifications de profil, mot de passe et double authentification soient visibles à la prochaine connexion.
- Nouveaux types : demande soumise, offre, adresse, notification, préférences, entrées des services. Types réservation et navigation enrichis.
- Schémas séparés : disponibilités, envoi de demande, profil, adresse, sécurité, préférences et support.

Les données mock sont conservées par compte pendant la durée du processus JavaScript, y compris après une déconnexion/reconnexion. Un rechargement complet les réinitialise. Aucun backend, stockage durable des dossiers, paiement, email, push ou transfert de photos n’est appelé.

## Routes ajoutées

`ResidentialSchedulePreferences`, `RequestReview`, `RequestSubmitted`, `RequestDetails`, `MyQuotes`, `QuoteDetails`, `EditProfile`, `MyAddresses`, `AddressForm`, `NotificationPreferences`, `Security`, `Support`, `ContactSupport`.

Routes existantes finalisées : `ClientRequests`, `ClientReservations`, `ClientProfile`, `Notifications`, `ReservationDetails`. L’ancien placeholder `RequestNextStep` est remplacé par `ResidentialSchedulePreferences`. `RequestFlowPlaceholder` reste réservé au type Autre.

## Protections et corrections

- Envoi idempotent par clé de brouillon ; un double clic ne crée pas deux demandes.
- Une offre acceptée produit une seule réservation, y compris avec deux actions concurrentes.
- Expiration et délai d’annulation revérifiés dans le service, pas uniquement par le bouton.
- Refus conservant la demande et son historique.
- Une seule adresse par défaut ; remplacement automatique si l’adresse par défaut est supprimée.
- Modification/suppression du carnet sans altérer les adresses historiques.
- Mutations isolées par compte ; pas de navigation tardive depuis un écran démonté.
- Réutilisation de l’authentification pour les réglages de sécurité ; le compte fournisseur externe ne prétend pas posséder un mot de passe local.

## Vérifications

- TypeScript strict et Vitest : 37 tests réussis lors de la vérification initiale de cette livraison.
- Aucun script/configuration de lint préexistant ; aucun outil de lint ajouté.
- Parcours web 390 × 844 vérifiés : offre → modal → réservation en attente → annulation ; logement → disponibilité → modification → envoi → détail ; brouillon supprimé après succès ; profil enregistré ; adresse ajoutée et définie par défaut.
- Les résultats finaux de compilation et les contrôles complémentaires sont consignés dans `VALIDATION.md`.

## TODO avant API / production

- Remplacer les adaptateurs mock par les contrats REST NestJS et appliquer propriété, autorisations, validation, concurrence et idempotence côté serveur.
- Raccorder stockage des photos, restauration de session, notifications push et support réel.
- Finaliser les règles d’annulation, de dates, de prix/taxes et les coordonnées de support approuvées.
- Implémenter le parcours de changement de courriel vérifié et le provisionnement réel de la 2FA ; le code de démonstration n’est pas une implémentation de sécurité de production.
- Définir la persistance éventuelle du brouillon après fermeture.
- Les parcours professionnels sont maintenant implémentés (voir PARCOURS_PROFESSIONNELS.md).
- Valider sur iOS/Android réels : clavier, galerie, retour matériel, grandes polices, zones sûres et lecteurs d’écran.
