# Parcours employé — frontend
Références : catalogue UX MagicPro, écrans 34 à 44 ; dossier technique équipe.

## Accès de démonstration
Compte : employee@magicpro.demo
Mot de passe initial : MagicPro!2026
Code de vérification : 123456
La première connexion impose un nouveau mot de passe. Aucun formulaire de création de compte employé : création réservée à l'administration.

## Écrans et routes
EmployeeTabs : EmployeeHome (Missions), EmployeeAgenda, EmployeeHistory, EmployeeProfile.
MissionDetails → BeforePhotos → MissionActive → MissionChecklist / AfterPhotos → MissionReport → MissionCompleted.
EmployeeNotifications, EmployeePreferences, EmployeeProfileEdit, EmployeePassword, EmployeeAppearance, EmployeeHelp.

Les missions sont isolées par employé, sans prix ni données commerciales. L'historique est en lecture seule. Les heures sont affichées dans America/Toronto. Les photos sont limitées à cinq par étape avec galerie, caméra, aperçu et suppression. La clôture requiert une confirmation explicite.

## Architecture
src/features/employee : types, schemas Zod, services mock, hooks Query, store Zustand des brouillons, composants et écrans.
src/navigation/EmployeeNavigator.tsx : navigation réservée au rôle EMPLOYEE.
ScreenLayout est extrait du ClientLayout existant ; ce dernier le réexporte pour préserver les écrans clients. Boutons, cartes, champs, états asynchrones, dialogues et thème clair/sombre sont réutilisés.

## Limites et raccordement API
- Service en mémoire uniquement : missions, photos, rapports, préférences et messages simulés disparaissent au redémarrage. Les brouillons sont effacés à la déconnexion ou au changement de compte.
- Aucun envoi de message, notification push ou transfert de photo réel.
- Le backend actuel accepte les photos seulement en IN_PROGRESS. L'adaptateur futur doit démarrer puis transférer les photos avant préparées localement, avec reprise sur erreur.
- Le catalogue évoque les photos obligatoires selon la mission ; aucun indicateur contractuel n'est disponible actuellement. Les photos restent facultatives.
- Le contrat backend du rapport doit définir le champ incident séparé ou sa sérialisation dans la note (limite serveur à respecter).
- Photos et coordonnées client à exposer selon les autorisations du futur DTO ; aucune donnée sensible inventée.
- Disponibilités : agenda consultable, aucune édition en l'absence de règle métier validée.
- Brancher JWT, contrôle d'affectation serveur, stockage sécurisé des photos et persistance/offline dans une étape backend dédiée.
- Valider sur appareils Android/iOS : caméra, autorisations refusées, clavier, retour arrière et accessibilité. La permission caméra modifiée nécessite une nouvelle compilation native hors Expo Go.

## Vérification manuelle
Se connecter avec le compte employé, vérifier le code, changer le mot de passe.
Ouvrir la mission du jour, ajouter une photo avant, démarrer, cocher des tâches, ajouter une photo après, saisir le rapport, confirmer.
Vérifier la présence dans l'historique et l'impossibilité de modifier une mission clôturée.
Tester Agenda, notifications, profil, apparence et déconnexion ; vérifier aussi qu'un client retrouve son parcours habituel.
