# Vérification de l’authentification et des premiers écrans client

7 octobre 2026.

## Contrôles réalisés

- TypeScript strict : réussi, y compris après remplacement du logo.
- Vitest : 24 tests réussis (authentification, schémas résidentiels et brouillon).
- `expo install --check` : versions compatibles avec le SDK installé.
- Export Metro/Hermes : Android, iOS et web compilés. Il s'agit de bundles, pas de builds APK/IPA ni de tests sur appareil.
- Navigateur à 390 × 844 : inspection du splash, de la connexion et de la vérification ; formulaires scrollables et labels accessibles.
- Parcours navigateur réussi : erreurs sur connexion vide, inscription fictive, vérification du courriel, confirmation de session puis déconnexion.
- Parcours navigateur réussi : récupération, vérification du code, modification du mot de passe du compte mock en mémoire, retour à la connexion avec confirmation.
- Aucun avertissement ou erreur relevé dans les logs navigateur à la fin de ces parcours.

Les tests automatisés couvrent aussi les rôles EMPLOYEE/ADMIN préexistants avec MFA, l'injection d'un rôle dans l'inscription, les codes expirés/invalides, les tentatives limitées, le délai de renvoi, l'usage unique des codes et jetons de récupération, les mots de passe et les connexions sociales simulées.

## Limites

Le module client a également été vérifié dans le navigateur à 390 × 844 : accueil, onglets, choix de catégorie, validation du logement, conservation du brouillon après retour, ajout/aperçu/suppression d’une photo locale, placeholder commercial et détail de réservation mock. Six tests couvrent les champs résidentiels, la limite de cinq photos, les doublons et l’isolation des données entre comptes. Les nouveaux bundles Android/iOS/web compilent. Le projet ne contient pas de script ou configuration de lint. Les détails et TODO sont dans `LIVRAISON_CLIENT.md`.

Les claviers natifs, lecteurs d'écran, remplissage automatique iOS/Android et SecureStore nécessitent une validation sur appareil. SecureStore et Axios sont préparés mais ne sont pas utilisés pour simuler des sessions persistantes ou un backend.

## Audit des dépendances

L'audit npm de l'installation signale 22 entrées (15 élevées, 7 modérées), dont des propagations depuis `braces`, `node-forge` et `uuid` à travers les dépendances Expo/Metro/Xcode. Ces entrées ne représentent pas 22 failles indépendantes. Aucun correctif forcé n'a été appliqué : certaines propositions npm rétrogradent Expo jusqu'à la version 44 et casseraient la stack retenue. Ce résultat doit être réévalué avec les mises à jour de la chaîne Expo avant une livraison en production.

## Logo

Le logo PNG de 1536 × 1024 fourni ensuite par l'utilisateur remplace l'ancienne image dans le composant partagé `Brand`. Sa transparence et ses pixels sont conservés. Tous les écrans passent par ce composant, soit directement (Splash), soit via `AuthLayout`, y compris la confirmation de connexion.
