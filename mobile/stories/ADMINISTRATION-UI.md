# Administration MagiquePro

Extension de l’interface SCRUM-17 réalisée pour Khalid Asseffar le 20 octobre 2026, intégrée le 4 novembre 2026 sur `feature/khalid-dashboard-administrateur`. L’application se trouve dans `mobile/` à la racine du dépôt.

## Écrans du catalogue

| Nº | Écran | Accès |
| --- | --- | --- |
| 45 | Tableau de bord administrateur | Onglet Tableau de bord |
| 46 | Demandes en cours | Onglet Demandes, recherche et filtres |
| 47 | Détail demande admin | Voir la demande |
| 48 | Créer l’estimation | Détail demande ou Offres → Nouvelle estimation |
| 49 | Prévisualiser l’offre | Formulaire d’estimation → Prévisualiser |
| 50 | Offres envoyées | Menu → Offres et estimations, filtres par statut |
| 51 | Missions à assigner | Action Planifier une mission ou menu |
| 52 | Assigner un employé | Mission → Assigner / Réassigner |
| 53 | Calendrier / dispatch | Menu ou liste des missions |
| 54 | Toutes les missions | Onglet Réservations ou menu |
| 55 | Détail mission admin | Voir la mission |
| 56 | Employés | Onglet Employés ou menu |
| 57 | Créer un compte employé | Employés → Créer un compte employé |
| 58 | Détail employé | Liste des employés → Voir la fiche |
| 59 | Clients | Menu → Clients |
| 60 | Détail client | Liste des clients ou détail demande |
| 61 | Catalogue des services | Menu |
| 62 | Rapports et statistiques | Action Voir les statistiques ou menu |
| 63 | Paramètres administratifs | Menu |

L’intégration réutilise désormais le thème partagé clair/sombre de l’application, ses composants et son logo de formulaire. Voir ../HARMONISATION_UI.md.

## Parcours vérifiable

1. Se connecter avec le compte ADMIN existant et le code de démonstration.
2. Ouvrir Offres et estimations, puis Nouvelle estimation et choisir Sophie Tremblay.
3. Renseigner durée, effectif, montant global, taxes, date, horaires, validité et conditions. Le sous-total et les taxes sont calculés en cents pour limiter les erreurs d’arrondi.
4. Prévisualiser, puis Simuler l’envoi. La demande passe à Offre envoyée dans l’administration locale.
5. Dans le suivi de l’offre, Simuler l’acceptation. Une seule mission À assigner est créée. Le refus et l’expiration permettent une nouvelle estimation.
6. Ouvrir la mission, sélectionner exactement l’effectif prévu dans l’offre et confirmer. Une équipe active sans chevauchement est requise. Les créneaux adjacents sont autorisés. La mission devient Planifiée.
7. Consulter cette mission dans le calendrier, la liste et les historiques du client et des employés.
8. Modifier le créneau ou annuler une mission future depuis son dossier. Les missions en cours et terminées restent en consultation. L’historique est conservé.
9. Créer une fiche employé, modifier ses coordonnées, suspendre ou réactiver ses affectations dans la démonstration.
10. Rechercher un client; consulter ses coordonnées, demandes et missions. Les boutons de contact ouvrent l’application choisie par l’utilisateur et n’envoient rien automatiquement.
11. Modifier un service et son activation; sauvegarder des paramètres après confirmation. Les nouveaux paramètres d’offre ne changent pas les montants des offres existantes.

## Données et limites

Les six demandes initiales sont conservées. La démonstration ajoute six fiches clients correspondantes, quatre employés, trois offres et quatre passages de mission pour illustrer différents états. Les passages historiques récurrents de la librairie sont des exemples, pas un moteur de récurrence.

Mise à jour : l’intégration utilise désormais un espace local persistant partagé entre les trois rôles. Les nouveaux comptes employés créés par l’administration permettent une connexion locale. Voir ../RAPPORT_FONCTIONNALITES.md pour le fonctionnement et les limites actuels.

L’envoi des offres et la réponse client sont explicitement simulés. Aucun courriel, invitation, changement d’accès réel, appel API, paiement ou synchronisation avec les parcours client/employé n’est effectué. La fiche employé créée reste une fiche de démonstration, avec activation réelle à connecter. La suspension bloque les affectations locales; elle ne prétend pas désactiver un compte backend.

Les disponibilités déclarées sont consultables en texte; le moteur bloque les chevauchements de missions mais n’interprète pas les horaires libres saisis dans ce texte. L’administrateur doit les vérifier. Aucun écran d’exécution employé n’est ajouté à la contribution de Khalid.

## Indicateurs

- Nouvelles demandes et En analyse : statut courant et date de réception, période jusqu’au jour courant.
- Offres envoyées : véritables événements `sentAt` de la démonstration, même après acceptation, refus ou annulation. L’ouverture de la carte affiche exactement les offres envoyées dans la période jusqu’à aujourd’hui.
- Missions planifiées : missions au statut Planifiée par date de prestation, sur la semaine ou le mois complet. Les missions à assigner, en cours, terminées ou annulées sont exclues de cette carte.
- Rapports : demandes par réception, offres par envoi et missions par prestation; les dates horodatées utilisent le calendrier local. Le total des offres acceptées ne représente pas des paiements encaissés.

## Validation du 20 octobre 2026

- TypeScript strict et 121 tests réussis : les 50 tests précédents, 63 tests du store administratif et 8 tests d’analytique administrative.
- Contrôles du store : montants, dates et horaires, édition des brouillons, expiration et remplacement d’offre, absence de double acceptation, effectifs, conflits d’affectation, suspension, préservation de l’historique, unicité des courriels, paramètres et isolation des sessions.
- Expo Web : parcours complet estimation → envoi simulé → acceptation → mission → équipe de deux personnes. Le total de 180,00 $ hors taxes donne 206,96 $ avec le taux de démonstration configuré.
- Expo Web : création et suspension d’une fiche employé, recherche/dossier client et historiques liés, validation et désactivation d’un service, confirmation de paramètres, retour au bon onglet depuis un dossier.
- Les principales sections ont été vérifiées à 390 px et 320 px : pas de débordement horizontal de la page. Les contrôles tactiles relevés ne sont pas inférieurs à 44 px, à l’arrondi de mesure près. Le calendrier peut défiler horizontalement sur les petits écrans.
- Console du navigateur : aucune erreur pendant le parcours; seul l’avertissement préexistant `props.pointerEvents` de React Native Web a été relevé.
- Captures de démonstration : `output/previews/admin/`.
- Bundles Metro iOS et Android compilés et téléchargés avec HTTP 200; tunnel Expo public également vérifié avec HTTP 200. Les captures Web aux dimensions mobiles et cette compilation ne constituent pas un test sur iPhone physique.

## Démarrage

Depuis la racine du dépôt, entrer dans `mobile/`, puis lancer les commandes :

```text
npm ci
npm run check
npx expo start --tunnel --go
```

Compte ADMIN de démonstration : `admin@magicpro.demo`, mot de passe `MagicPro!2026`, code `123456`.

## Revalidation du 4 novembre 2026

Le contrôle TypeScript strict et les 121 tests du projet réussissent dans la structure `mobile/`. Cette revalidation n’ajoute pas de test physique sur iPhone et ne connecte pas le backend.
