# SCRUM-17 — Interface de l’administration MagiquePro

- **Projet :** MagiquePro
- **Sprint :** Sprint 2
- **Assigné à :** Khalid Asseffar
- **Statut :** Prêt pour revue de l’interface de démonstration
- **Branche :** `feature/khalid-dashboard-administrateur`

## User Story

En tant qu’administrateur, je veux consulter les demandes, préparer des offres et organiser les missions afin de suivre l’activité de MagiquePro dans une interface mobile cohérente.

Le tableau de bord livré le 7 octobre 2026 est complété le 20 octobre par les autres écrans d’administration du catalogue UX. La palette bleu marine, les cartes bleues et turquoise, les polices et le logo existants sont conservés.

## Interface disponible

- Tableau de bord réactif, indicateurs semaine/mois, graphiques et accès aux éléments comptés.
- Demandes avec recherche, cinq filtres, dossier client, analyse et accès à l’estimation.
- Estimation chiffrée, brouillon, prévisualisation et suivi des offres avec états explicites.
- Acceptation client simulée créant une mission à assigner, équipe conforme à l’effectif et contrôle des chevauchements.
- Toutes les missions, calendrier mensuel, détail, replanification, annulation et historique administratif.
- Répertoire des employés, création/modification des fiches, suspension/réactivation des affectations et historiques.
- Répertoire et dossiers clients reliés aux demandes, offres et missions.
- Catalogue des services modifiable, rapports et paramètres administratifs avec confirmation.
- Menu donnant accès à chaque section; navigation inférieure, notifications et déconnexion existantes.

[Correspondance des écrans 45 à 63, scénarios, règles et limites](ADMINISTRATION-UI.md)

![Offres et estimations sur mobile](../output/previews/admin/offers-mobile.png)

![Calendrier administratif sur mobile](../output/previews/admin/calendar-mobile.png)

## Périmètre technique

La fonctionnalité reste dans `src/features/employer/`. Le rôle existant `ADMIN` ouvre `EmployerDashboardScreen`, qui délègue au conteneur `AdminHomeScreen` et à ses modules. Les six demandes de démonstration originales sont conservées; les nouveaux écrans partagent un store local, typé et isolé par session.

Les écrans d’authentification de Yosri, le parcours client, les formulaires existants, les composants et tokens partagés, les contrats API et les dépendances ne sont pas modifiés par cette extension. Le rôle EMPLOYEE conserve sa destination existante; les écrans de Meryem ne sont pas développés dans cette livraison.

## Limites

Toutes les mutations concernent uniquement la démonstration en mémoire. Elles sont perdues au rechargement complet ou à la déconnexion. Les offres et réponses clients sont simulées. Aucun courriel ni invitation n’est transmis, aucun accès réel n’est modifié, aucun paiement n’est effectué et aucune API n’est connectée. L’exécution employé et la synchronisation entre rôles restent à intégrer avec le backend.

## Validation

- TypeScript strict et **121 tests réussis**, dont 63 tests du store administratif et 8 tests d’analytique administrative ajoutés aux 50 tests précédents.
- Parcours Web complet de l’estimation à l’affectation d’une équipe de deux personnes; création/suspension d’employé, dossier client, service et paramètres vérifiés.
- Sections principales contrôlées à 320 et 390 px, sans débordement horizontal de la page.
- Détails des contrôles et captures dans [ADMINISTRATION-UI.md](ADMINISTRATION-UI.md).

## Lancer

```text
npm install
npm run check
npx expo start --tunnel --go
```

Compte de gestion : `admin@magicpro.demo` / `MagicPro!2026`, code de démonstration `123456`.

La première version marine est publiée dans le commit `d26c6c33c517c17e1b4c090dbd1d2b1f7e25c5e7`. L’extension du 20 octobre est décrite dans les fichiers de cette branche de travail.

## Mise à jour du 4 novembre 2026

La dernière interface d’administration et ses captures sont intégrées dans `mobile/`, en conservant l’organisation du dépôt avec `backend/`. Le contrôle TypeScript strict et les 121 tests du projet réussissent à nouveau. Les limitations de la démonstration en mémoire décrites ci-dessus restent applicables.
