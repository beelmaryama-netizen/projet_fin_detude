# SCRUM-17 — Créer le tableau de bord de l’employeur

**Projet :** MagiquePro  
**Sprint :** Sprint 2  
**Assigné à :** Khalid  
**Statut :** Prêt pour revue

## User Story

En tant que développeur frontend,
je veux créer le tableau de bord de l’employeur,
afin de permettre la consultation et la gestion des demandes des clients MagiquePro.

## Branche Git

`feature/SCRUM-17-dashboard-employeur`

Le tableau de bord prolonge l’application Expo existante de `feature/SCRUM-16-interface-utilisateur`. Le compte de gestion utilise le rôle existant `ADMIN`.

## Aperçu

![Tableau de bord employeur](../output/previews/employer-dashboard-dark-web.png)

[Détail d’une demande](../output/previews/employer-request-dark-web.png)

## Refonte visuelle livrée

Le tableau de bord reprend la référence fournie : fond bleu marine, cartes en dégradé bleu et turquoise, graphiques en barres, actions rapides et navigation inférieure fixe. Le logo original MagiquePro est conservé. Les données affichées proviennent toujours des six demandes locales de démonstration.

- Accueil avec la date courante et quatre indicateurs : Nouvelles demandes, En analyse, Offres envoyées et Missions planifiées.
- Sélecteur « Cette semaine » / « Ce mois-ci », appliqué aux indicateurs et aux statistiques de l’accueil.
- Quatre actions rapides : Créer une offre, Gérer les employés, Planifier une mission et Voir les statistiques.
- Navigation fixe : Tableau de bord, Demandes, Réservations et Employés.
- Menu avec profil et déconnexion via `useSession`, en conservant les états d’attente et d’erreur.
- Notifications dérivées des nouvelles demandes : les deux demandes concernées sont consultables; le badge indique 2 avec les données actuelles.
- Demandes avec cinq filtres, détails défilants, statuts explicites et actions contextuelles.
- Réservations affichant les demandes confirmées; l’onglet Employés indique clairement que la gestion de l’équipe sera disponible prochainement.

Les filtres de gestion restent indépendants du sélecteur de période de l’accueil. Toutes, Nouvelles, À traiter, En attente et Confirmées affichent respectivement **6, 2, 3, 2 et 1 demandes**. Les nouvelles demandes font aussi partie de « À traiter »; les offres envoyées font partie de « En attente ». Ces totaux de filtres ne doivent pas être additionnés.

## Règles des indicateurs

`employerAnalytics.ts` calcule les indicateurs à partir des demandes reçues en paramètre; aucune valeur, tendance ou barre de graphique n’est inventée.

- La semaine commence le lundi à minuit; le mois commence le premier jour du mois. Les dates de calendrier sont interprétées à midi en heure locale, pour éviter un décalage de jour lié à UTC.
- Nouvelles demandes, En analyse et Offres envoyées utilisent le statut courant et la date de réception `submittedAt`, du début de la période jusqu’à la fin du jour courant.
- La date d’envoi de l’offre n’existe pas dans les données actuelles : « Offres envoyées » utilise donc la date de réception de la demande, et ne représente pas un historique des événements d’envoi.
- Missions planifiées utilise les demandes `confirmed` et leur date souhaitée `preferredDate`, sur toute la semaine ou tout le mois sélectionné, y compris les prestations à venir. Une demande reçue auparavant peut donc être comptée si sa prestation tombe dans la période.
- La tendance compare le nombre courant à la **période calendaire précédente complète**, et non à une durée écoulée équivalente. Elle est arrondie en pourcentage et reste indisponible (`null`) lorsque la période précédente ne contient aucun élément de cette catégorie.
- Les graphiques contiennent les nombres réels dans sept jours pour la semaine ou dix segments du mois. Les segments sans demande restent à zéro; l’interface leur réserve seulement une ligne de base visuelle.
- Cliquer sur un indicateur ouvre exactement les demandes comptées par cet indicateur via `getEmployerMetricRequests()`. L’indicateur Missions planifiées ouvre les réservations filtrées par date de prestation.

## Fichiers de la fonctionnalité

```text
src/features/employer/
  components/
    DashboardStatCard.tsx
    EmployerActionButton.tsx
    EmployerDialog.tsx
    EmployerLayout.tsx
    EmployerQuickAction.tsx
    EmployerRequestCard.tsx
    EmployerRequestDetails.tsx
    RequestStatusBadge.tsx
  hooks/useEmployerDashboard.ts
  screens/EmployerDashboardScreen.tsx
  services/employerAnalytics.ts
  services/employerAnalytics.test.ts
  services/mockEmployerService.ts
  services/mockEmployerService.test.ts
  theme.ts
  types/employer.ts
stories/SCRUM-17.md
```

`EmployerActionButton.tsx`, `EmployerDialog.tsx`, `EmployerQuickAction.tsx`, `theme.ts`, `employerAnalytics.ts` et `employerAnalytics.test.ts` sont ajoutés pour cette refonte. Les autres fichiers employeur existaient dans la première livraison SCRUM-17.

Les seuls fichiers préexistants hors de la fonctionnalité modifiés par la livraison SCRUM-17 restent :

- `src/navigation/RootNavigator.tsx` : branche ADMIN vers `EmployerDashboardScreen`, après le MFA existant.
- `src/navigation/types.ts` : route privée `EmployerDashboard` sans paramètres.

CLIENT conserve `ClientNavigator`. EMPLOYEE conserve `AuthenticatedNotice`. Aucun rôle EMPLOYER n’est ajouté. Le logo, l’authentification de Yosri, les écrans client, les formulaires de demandes, le store de session, les composants et tokens partagés, les contrats backend, `package.json` et `package-lock.json` sont préservés. La palette marine est locale à `src/features/employer/theme.ts`; aucune dépendance n’est ajoutée.

L’audit SHA-256 des 76 fichiers originaux de l’archive confirme que seuls `RootNavigator.tsx` et `types.ts` de navigation diffèrent. Aucun fichier original ne manque; tous les autres fichiers originaux sont inchangés.

## Limites de la démonstration

`getEmployerRequests()` reste le point d’entrée des six demandes originales; leurs statuts, leurs dates relatives et le comportement de `getEmployerSummary()` et `filterEmployerRequests()` sont conservés. Les catégories réutilisent `RequestCategory` et les libellés existants. Les statuts employeur restent locaux à la démonstration : aucun enum de base de données ni contrat API n’est ajouté.

Créer une offre, Planifier une mission et Gérer les employés ouvrent des informations explicites sur les fonctionnalités à venir. Les actions des demandes ouvrent les détails et les messages de démonstration correspondants. Elles ne modifient aucun statut, ne créent aucune offre ou réservation et ne transmettent rien au client. Il n’y a aucune connexion avec les demandes créées dans le parcours client.

## Lancer et tester

```powershell
git clone --branch feature/SCRUM-17-dashboard-employeur https://github.com/beelmaryama-netizen/projet_fin_detude.git
cd projet_fin_detude
npm install
npm run check
npx expo start
```

Ouvrir avec Expo Go sur Android/iPhone, ou appuyer sur `a` pour un émulateur Android disponible. Pour le Web : `npx expo start --web`.

| Compte | Courriel | Mot de passe | MFA |
| --- | --- | --- | --- |
| Gestion / ADMIN | admin@magicpro.demo | MagicPro!2026 | 123456 |
| Client | client@magicpro.demo | MagicPro!2026 | Pas de MFA pour ce compte |
| Employé | employee@magicpro.demo | MagicPro!2026 | 123456 |

1. Commencer → connexion ADMIN → code MFA → accueil employeur bleu marine.
2. Changer la période semaine/mois; vérifier les valeurs calculées et les statistiques.
3. Ouvrir chaque indicateur; vérifier que la liste correspond au nombre affiché, puis revenir via la navigation inférieure.
4. Ouvrir Demandes et vérifier les cinq filtres : 6, 2, 3, 2 et 1 demandes.
5. Ouvrir un détail et les actions Analyser, Préparer l’offre et Voir l’offre; vérifier les messages de démonstration.
6. Essayer les quatre actions rapides, les onglets Réservations et Employés, puis le badge de notifications.
7. Ouvrir le menu et le profil, puis se déconnecter; vérifier le retour au parcours public.
8. Vérifier les destinations CLIENT et EMPLOYEE existantes.

## Validation de la refonte marine

- `npm run check` réussi : TypeScript strict et **50 tests**, dont 14 tests d’analytique calendaire, 12 tests du service employeur existant et 24 autres tests du projet.
- Les tests d’analytique couvrent les débuts de semaine et de mois, les changements d’année, le jour courant avant midi, les dates de prestation à venir, les tendances, les périodes vides, les fuseaux horaires et les sous-ensembles exacts ouverts depuis les indicateurs.
- Expo Web : sélection du mois, sous-ensembles des indicateurs, cinq filtres de demandes et état vide des offres de la semaine vérifiés. Les quatre actions rapides, les quatre onglets, les notifications avec ouverture du détail et les trois actions contextuelles ont été testés.
- Expo Web à 320, 390 et 1024 px : aucun débordement horizontal et toutes les cibles tactiles mesurées à au moins 44 px. Les libellés des indicateurs deviennent compacts à 320 px. Les actions rapides passent à deux colonnes sous 350 px ou lorsque `fontScale > 1.2`; les indicateurs passent à une colonne lorsque `fontScale > 1.2`.
- Expo Web : menu, profil et déconnexion vérifiés; le compte retourne au parcours public, puis peut se reconnecter par le MFA existant. Aucun message d’erreur dans la console Web.
- Expo Go sur Android : parcours ADMIN/MFA, sous-ensemble exact de deux nouvelles demandes, changement semaine/mois des offres de 0 à 1, quatre onglets, aperçus Créer une offre et Planifier une mission, détail et action Analyser vérifiés.
- Android : aucun avertissement ou erreur ReactNativeJS, ni erreur AndroidRuntime dans le relevé ciblé. L’icône flottante Tools appartient à Expo Go. Le dernier aperçu natif utilise des graphiques de 32 px et montre les quatre actions rapides. L’émulateur a été arrêté après validation; Metro est resté actif.
- Les preuves natives de cette refonte sont `output/previews/employer-dashboard-dark-android.png` et `output/previews/employer-request-dark-android.png`; le rapport est `output/android-dark-qa.md`.
- Le bundle iOS a été téléchargé via le tunnel Expo existant : réponse HTTP 200, 6 424 093 octets. Ce contrôle valide le téléchargement du bundle, pas le chargement sur un iPhone physique.
- Captures Web enregistrées : `output/previews/employer-dashboard-dark-web.png`, `output/previews/employer-request-dark-web.png` et `output/previews/employer-dashboard-dark-desktop.png`.
