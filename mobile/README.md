# mobile

Application mobile : Maryem (SCRUM-16), Khalid (SCRUM-17), Yosri (SCRUM-18 à SCRUM-21).

## Démarrer l’application

Depuis la racine du dépôt :

```sh
cd mobile
npm ci
npm run check
npx expo start --tunnel --go
```

Dans Expo Go, scanner le QR affiché par cette nouvelle session. Sur iPhone, utiliser l’appareil photo pour ouvrir le lien dans Expo Go.

## Interface d’administration

La branche `feature/khalid-dashboard-administrateur` contient la dernière interface locale : tableau de bord, demandes, estimations et offres, missions, affectations, calendrier, employés, clients, services, rapports et paramètres.

- [Parcours, écrans du catalogue, règles et limites](stories/ADMINISTRATION-UI.md)
- [Suivi SCRUM-17](stories/SCRUM-17.md)
- [Captures des écrans administratifs](output/previews/admin/)

Compte ADMIN de démonstration : `admin@magicpro.demo`, mot de passe `MagicPro!2026`, code `123456`.

Les changements restent en mémoire pendant la session. Le rechargement complet et la déconnexion réinitialisent la démonstration. L’envoi d’offres et les réponses clients sont simulés. L’API et la sauvegarde durable restent à connecter.

Contrôles du 4 novembre 2026 : TypeScript strict et 121 tests réussis dans le projet.
