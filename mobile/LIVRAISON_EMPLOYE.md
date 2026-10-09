# Livraison de l’espace employé — contribution de Meryem

L’espace employé prolonge le projet React Native, Expo et TypeScript existant à partir de `feature/SCRUM-17-dashboard-employeur`. Le nouveau code est regroupé dans `src/features/employee`. Il utilise le rôle `EMPLOYEE` après l’authentification et la vérification existantes. L’inscription publique reste réservée aux clients.

Cette livraison est une démonstration fonctionnelle locale. Les missions, tâches, horaires et rapports partagent le même état en mémoire. Aucun rapport n’est transmis à un serveur.

## Écrans et parcours

| Écran | Comportement |
| --- | --- |
| Première connexion | Bienvenue avec le prénom, profil prérempli, prénom et nom modifiables, téléphone facultatif, présentation du parcours et accès aux missions. Courriel du compte en lecture seule. |
| Détail d’une mission | Référence, statut, prestation, client, adresse, horaire prévu, durée, consignes, matériel et tâches ; accès à la checklist, au démarrage ou à la reprise. |
| Checklist | Tâches par zone, cases à cocher, compteur et progression, tâches obligatoires, commentaires et exceptions « Non applicable » autorisées avec justification. |
| Mission en cours | Heure réelle de début, durée écoulée, progression, tâches restantes, incident et action pour terminer l’intervention. |
| Mission terminée | Confirmation, horaires réels, durée, bilan des tâches, remarques, statut du rapport, consultation et retour aux missions. Une intervention clôturée sans rapport validé affiche « Rapport à compléter ». |
| Rapport de fin | Mission et horaires préremplis, checklist, résumé, observations, incident, photos facultatives, brouillon et validation. |

La liste **Mes missions** sert de point d’entrée aux missions attribuées. La démonstration fournit trois missions : ménage résidentiel, entretien de bureaux déjà en cours et ménage après déménagement. Les dates sont relatives au chargement pour garder un aperçu utilisable.

```text
Connexion et vérification
→ Première connexion employé
→ Mes missions
→ Détail
→ Démarrage
→ Mission en cours ↔ Checklist
→ Fin de l’intervention
→ Rapport de fin
→ Mission terminée
```

## Accéder à la démonstration

Depuis la copie de travail :

```sh
npm ci
npm start
```

Ouvrir dans une version d’Expo Go compatible SDK 57, ou lancer `npm run web` pour un aperçu navigateur. `npm run android` nécessite un émulateur Android disponible ; `npm run ios` nécessite macOS et un simulateur iOS. Les versions et dépendances du projet sont conservées.

1. Ouvrir la connexion existante.
2. Saisir `employee@magicpro.demo` et `MagicPro!2026`.
3. Saisir le code `123456`.
4. Vérifier le profil de Sarah Démo, puis choisir **Accéder à mes missions**.
5. Ouvrir une mission à venir pour le parcours complet, ou reprendre la mission de bureaux en cours.

Comptes publics déjà présents dans le dépôt :

| Rôle | Courriel | Mot de passe | Vérification |
| --- | --- | --- | --- |
| Employé | `employee@magicpro.demo` | `MagicPro!2026` | `123456` |
| Employeur / ADMIN | `admin@magicpro.demo` | `MagicPro!2026` | `123456` |
| Client | `client@magicpro.demo` | `MagicPro!2026` | Aucune pour ce compte |
| Client avec vérification | `verification@magicpro.demo` | `MagicPro!2026` | `123456` |

## Règles des missions et des rapports

Les états locaux sont `UPCOMING` (À venir), `IN_PROGRESS` (En cours), `REPORT_PENDING` (Rapport à compléter) et `COMPLETED` (Terminée). Ils ne modifient pas les statuts des demandes employeur ni un contrat backend.

- Le démarrage d’une mission à venir enregistre une seule heure de début. Revenir sur un écran ou répéter l’action ne remet pas le compteur à zéro.
- La checklist est modifiable pendant l’intervention. Une tâche obligatoire doit être réalisée ou déclarée non applicable si cette exception est permise, avec une justification non vide.
- Une exception non justifiée bloque la clôture. Une tâche facultative peut rester à faire. La progression comprend les tâches réalisées et les exceptions autorisées justifiées.
- Cocher toutes les tâches ne clôture jamais automatiquement la mission.
- Terminer l’intervention contrôle tâches, exceptions et heure de début, enregistre l’heure de fin, puis passe au rapport à compléter. La durée réelle cesse alors d’augmenter.
- Le résumé du rapport nécessite au moins 10 caractères après suppression des espaces en début et fin. Un incident déclaré nécessite aussi une description d’au moins 10 caractères. Les horaires doivent être présents et cohérents.
- Le brouillon reste modifiable avant validation. L’enregistrer ajoute un horodatage local sans envoi à une API.
- Valider le rapport passe la mission à Terminée et fige les tâches et le rapport pour consultation.

Validation et progression : `services/missionRules.ts`. Données de démonstration : `services/mockEmployeeService.ts`. État Zustand : `hooks/useEmployeeStore.ts`.

## Conservation et isolation

Chaque état est lié à l’identifiant de l’employé connecté. La navigation conserve les informations de la même mission : tâches, commentaires, exceptions, incident, horaires, rapport et photos.

Un renouvellement de session pour le même employé conserve son état. Un changement d’employé, un passage à CLIENT ou ADMIN, ou une déconnexion purge les données employé. Les réponses d’un chargement devenu obsolète sont ignorées. Le brouillon client conserve sa propre isolation.

**Tout reste en mémoire.** Déconnexion, rechargement ou fermeture de l’application font perdre les modifications et réinitialisent l’accueil de première utilisation. Aucun stockage durable ou partage entre appareils n’est ajouté. La mention « Données de démonstration » accompagne l’espace.

## Photos

Le rapport peut ajouter des images de la galerie avec `expo-image-picker`, déjà installé. Aperçu et suppression sont disponibles avant validation. La limite est de cinq images sans doublons d’URI ; aucun accès caméra n’est ajouté.

Les URI restent locales : les photos ne sont ni téléversées ni archivées sur un serveur. Une sélection vérifie l’employé, la mission et le statut du rapport avant modification.

## Présentation et intégration

Aucune capture visuelle jointe n’était accessible dans les éléments reçus. La présentation suit les indications textuelles et les tokens du projet : en-tête en dégradé bleu avec logo existant et « Espace employé », fond `#F8F9FA`, cartes blanches arrondies, bleu principal `#1565C0`, textes foncés, badges pastel, Poppins et DM Sans.

La navigation racine dirige EMPLOYEE vers `EmployeeNavigator`. CLIENT conserve son navigateur et ADMIN son tableau de bord employeur. Authentification, vérification et déconnexion existantes sont réutilisées ; aucun nouveau rôle ou formulaire d’inscription employé n’est introduit.

Les écrans prévoient zones sûres, défilement, clavier, contrôles tactiles d’au moins 44 px et états de chargement, d’erreur et de liste vide.

## Vérifications déjà effectuées

Commande ciblée réussie pendant l’intégration :

```sh
npm test -- src/store/authStore.test.ts src/store/requestDraftStore.test.ts
```

Résultat : **2 fichiers et 9 tests réussis**. Couverture : renouvellement de session, changement d’employé, purge des rapports/photos/commentaires/profil, transitions CLIENT et ADMIN, déconnexion, chargement tardif ignoré et comportements du brouillon client conservés.

La lecture du domaine a contrôlé les gardes de transition, l’heure de début unique, le gel du rapport terminé et la séparation des états. Ce contrôle de code ne constitue pas une validation sur appareil.

## Résultats de vérification

- `npm run check` : TypeScript strict et **69 tests réussis**, dans 9 fichiers.
- `npx expo install --check` : dépendances compatibles, versions conservées.
- `npx expo export --platform all` : bundles Android, iOS et web générés avec succès.
- Parcours réel dans Edge avec aperçu Expo Web à 390 × 844 : connexion et code existants, accueil, liste, détail, démarrage, blocage des tâches incomplètes, checklist, exception justifiée, commentaire, incident, clôture, validation du résumé, sauvegarde du brouillon, retour et reprise, bilan provisoire, validation finale et rapport en lecture seule. Aucune erreur console.
- Petit écran de 320 × 740 : bilan sans débordement horizontal. Accueils existants CLIENT et ADMIN ouverts à 412 × 915 après authentification.
- Captures : `output/employee/captures`, avec présentation dans `output/employee`. Il s’agit de captures d’Expo Web en format téléphone, pas de captures prises sur appareils natifs.
- Expo Go sur iPhone et Android : **aucune validation sur appareil physique effectuée**. Les claviers, zones sûres et galerie native restent à vérifier sur les téléphones. Compiler un bundle ne constitue pas un essai sur appareil.

Le guide pas à pas est dans `GUIDE_EXPO_MERYEM.md`. La branche de livraison est `feature/meryem-espace-employe`, issue du commit `d26c6c33c517c17e1b4c090dbd1d2b1f7e25c5e7` de la branche employeur demandée.

## Connexions restantes

- API authentifiée des missions attribuées et autorisations côté serveur.
- Sauvegarde du profil, des tâches, des incidents, des horaires et des brouillons.
- Validation et stockage du rapport, erreurs réseau et conflits.
- Téléversement, stockage et accès autorisé aux photos.
- Politique de conservation, reprise après fermeture et fonctionnement hors connexion.
- Échanges réels avec l’employeur : affectations, rapports et notifications.

L’authentification et les données restent simulées. La confirmation indique l’état local du rapport et ne prétend pas qu’il a été envoyé.
