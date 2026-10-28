# Vérification de l’authentification et de l’espace client

Dernière vérification : 19 octobre 2026. Les contrôles d’authentification initiaux datent du 7 octobre.

## Contrôles réalisés

- TypeScript strict : réussi (`tsc --noEmit`).
- Vitest : 37 tests réussis dans sept fichiers, dont le cycle client et les réglages de compte.
- Dépendances et stack conservées dans cette livraison ; aucun nouvel outil installé.
- Export Metro/Hermes : Android, iOS et web compilés. Il s'agit de bundles, pas de builds APK/IPA ni de tests sur appareil.
- Navigateur à 390 × 844 : inspection du splash, de la connexion et de la vérification ; formulaires scrollables et labels accessibles.
- Parcours navigateur réussi : erreurs sur connexion vide, inscription fictive, vérification du courriel, confirmation de session puis déconnexion.
- Parcours navigateur réussi : récupération, vérification du code, modification du mot de passe du compte mock en mémoire, retour à la connexion avec confirmation.
- Aucune erreur JavaScript relevée sur les nouveaux parcours. Un avertissement de dépendance React Native Web concernant `props.pointerEvents` reste visible en développement.

## Contrôles du module client

- Parcours complet : logement → date/créneau → récapitulatif → modification de disponibilité → envoi → détail « Nouvelle / en cours d’analyse ». Brouillon supprimé après succès et aucune réservation créée par l’envoi.
- Offre mock : détail du total, modal d’acceptation → réservation en attente de confirmation ; annulation avec modal et actualisation du statut.
- Refus d’offre : demande conservée « En analyse », offre « Refusée », historique cohérent.
- Réservations : filtres À venir, Passées et Annulées vérifiés avec leurs statuts respectifs.
- Profil enregistré, adresse fictive ajoutée et définie par défaut.
- Notifications toutes marquées lues, lien vers l’offre, préférences enregistrées.
- Sécurité inspectée avec compte fournisseur ; les modifications de mot de passe et MFA sont testées au niveau service, y compris leur effet à la connexion suivante.
- Support : validation des champs vides et succès du message mock, sans email réel.
- Déconnexion/reconnexion vérifiée sans erreur d’exécution.
- Rendu à 390 × 844 et 320 × 740 ; correction des libellés tronqués de la barre du bas.
- Aucun libellé « mission », `any` TypeScript ou `console.log` dans le code client/demandes contrôlé.
- `git diff --check` : aucune erreur de whitespace.

Les tests de service vérifient aussi les doubles envois/acceptations, les offres expirées, la limite exacte d’annulation, l’accès entre comptes, l’immuabilité des données retournées, les adresses historiques, l’unicité de l’adresse par défaut, les préférences et la reprise après erreur réseau.

Les tests automatisés couvrent aussi les rôles EMPLOYEE/ADMIN préexistants avec MFA, l'injection d'un rôle dans l'inscription, les codes expirés/invalides, les tentatives limitées, le délai de renvoi, l'usage unique des codes et jetons de récupération, les mots de passe et les connexions sociales simulées.

## Limites

Les vérifications précédentes couvrent également l’ajout, l’aperçu et la suppression des photos, la limite de cinq images, les doublons et la conservation du brouillon. Le projet ne contient pas de script ou configuration de lint : aucun lint n’est annoncé comme exécuté. Les détails et TODO sont dans `LIVRAISON_CLIENT.md`.

Les claviers natifs, lecteurs d'écran, remplissage automatique iOS/Android et SecureStore nécessitent une validation sur appareil. SecureStore et Axios sont préparés mais ne sont pas utilisés pour simuler des sessions persistantes ou un backend.

## Audit des dépendances

L'audit npm de l'installation signale 22 entrées (15 élevées, 7 modérées), dont des propagations depuis `braces`, `node-forge` et `uuid` à travers les dépendances Expo/Metro/Xcode. Ces entrées ne représentent pas 22 failles indépendantes. Aucun correctif forcé n'a été appliqué : certaines propositions npm rétrogradent Expo jusqu'à la version 44 et casseraient la stack retenue. Ce résultat doit être réévalué avec les mises à jour de la chaîne Expo avant une livraison en production.

## Logo

Le logo PNG de 1536 × 1024 fourni ensuite par l'utilisateur remplace l'ancienne image dans le composant partagé `Brand`. Sa transparence et ses pixels sont conservés. Tous les écrans passent par ce composant, soit directement (Splash), soit via `AuthLayout`, y compris la confirmation de connexion.

## Extension professionnelle - 19 octobre 2026

TypeScript strict et 43 tests Vitest passent. Export Expo Android/iOS/web réussi. Les tests couvrent aussi les trois catégories professionnelles, les champs requis, la fréquence personnalisée, les limites PDF et le changement de compte. Contrôle visuel non effectué : accès au navigateur local refusé par sa politique de sécurité. Voir PARCOURS_PROFESSIONNELS.md pour les fichiers et limites.
