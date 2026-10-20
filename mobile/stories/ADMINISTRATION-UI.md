# Administration MagiquePro — Meryem

Cette extension complète le parcours administratif sur la branche `feature/meryem-espace-employe`, en conservant le thème du tableau de bord employeur.

## Écrans livrés

- 48 — Créer l’estimation
- 49 — Prévisualiser l’offre
- 50 — Offres envoyées
- 51 — Missions à assigner
- 52 — Assigner un employé
- 53 — Calendrier / Dispatch
- 55 — Détail mission admin
- 56 — Employés
- 57 — Créer un compte employé
- 58 — Détail employé
- 59 — Clients
- 60 — Détail client

## Cohérence de la démonstration

Les offres, missions, employés et clients utilisent un store Zustand commun. Une acceptation simulée crée une seule mission. L’affectation contrôle le nombre d’employés, les suspensions, les doublons et les conflits horaires. Les suspensions conservent l’historique.

Le tableau de bord SCRUM-17 existant reste accessible depuis l’accueil Administration.

## Thème

Palette reprise du module employeur existant :

- fond principal `#071A38`
- fond profond `#06142D`
- surface `#102A52`
- surface surélevée `#17345F`
- bordures `#294D83`
- texte principal `#F4F8FF`
- texte secondaire `#AABDDC`
- bleu `#4EAAFF`
- turquoise `#66D5E9`
- confirmation `#69DCB4`

Les titres réutilisent Poppins, le contenu DM Sans, et les icônes Ionicons.

## Limites explicites

La démonstration est locale. Aucun courriel, notification push, paiement, invitation ou synchronisation distante n’est réellement envoyé. Le raccordement backend reste à faire.

## Test

Depuis `mobile/` :

```bash
npm install
npm run check
npx expo start -c
```

Compte ADMIN de démonstration :

```text
admin@magicpro.demo
MagicPro!2026
MFA : 123456
```

## Contrôle continu

La branche inclut `.github/workflows/mobile-check.yml` pour exécuter `npm ci` puis `npm run check` après les prochains pushes sur la branche.
