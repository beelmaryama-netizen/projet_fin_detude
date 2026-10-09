# Analyse du dossier MagicPro

Date : 7 octobre 2026. Dossier analysé : `C:\Users\arfao\OneDrive\Bureau\technique\MagicPro`.

## Conclusion

Le dossier constitue une base de conception fonctionnelle et visuelle pour une application mobile de services d'entretien ménager. La séparation des rôles et le parcours métier sont bien explicités dans le dossier équipe. Cependant, les documents ne sont pas entièrement alignés : le catalogue UX conserve un fonctionnement différent sur les réservations, les missions, le refus d'offre et les équipes de plusieurs employés.

La priorité est de consolider les règles et les écrans avant de les traduire en code. Aucun code source, schéma Prisma exécutable, migration SQL, contrat API, test ou configuration de déploiement n'est présent dans ce dossier. Cela ne préjuge pas de leur existence ailleurs.

## Périmètre de l'examen

- 14 fichiers, environ 16,09 Mo : deux PDF, un PowerPoint, dix PNG et un logo WebP.
- Lecture du texte des 97 pages PDF et des 11 diapositives du PowerPoint.
- Inspection visuelle des onze images, des diagrammes métier/UML/ERD/statuts/authentification et des pages UX concernant les offres et réservations.
- Le PowerPoint a été analysé par son contenu textuel et ses spécifications. Son rendu complet n'a pas été contrôlé dans PowerPoint.
- Aucun fichier source du dossier analysé n'a été modifié. Ce rapport est enregistré dans le dossier de travail MagicPro 2.
- Analyse documentaire uniquement : les technologies et offres d'hébergement citées sont celles des documents, sans vérification de leurs versions, tarifs ou disponibilités actuelles.

## 1. Produit décrit

Une seule application Android/iOS possède trois expériences définies par le compte :

| Rôle | Responsabilités |
|---|---|
| Client | Décrire son besoin résidentiel ou professionnel, transmettre photos et disponibilités, répondre à l'offre et suivre ses réservations. |
| Employé | Consulter ses missions assignées, suivre les consignes, renseigner les tâches et photos, démarrer et clôturer le travail. |
| Administrateur | Analyser les demandes, établir les offres, confirmer les horaires, créer les missions et assigner les employés. |

Le dossier équipe définit le parcours : demande → offre → acceptation → réservation confirmée par l'administration → mission interne → assignation → exécution → clôture. Le refus d'une offre peut conduire à une nouvelle version sans fermer la demande.

Les paiements intégrés, contrats récurrents avancés, tournées optimisées, messagerie temps réel et portail web administratif sont reportés. Recueillir une fréquence souhaitée ne signifie donc pas que le MVP génère automatiquement les interventions récurrentes.

## 2. Analyse des trois documents

### MagicPro_Dossier_Complet_Equipe.pdf — 26 pages

Document de référence fonctionnel et technique, version 1.0 du 28 septembre 2026. Il couvre les responsabilités, permissions, séquences, modèle métier, base MySQL, sécurité, architecture, environnements, organisation de cinq personnes et tests.

**Points solides :** distinction demande/offre/réservation/mission, contrôle des permissions côté serveur, propriété des ressources, offres versionnées, stockage des fichiers hors base, UTC, comptes employés administrés et scénario de test transversal.

**Points à corriger ou compléter :** diagramme des statuts trompeur, persistance de plusieurs fonctionnalités non spécifiée, modalités d'annulation et replanification incomplètes, concurrence des opérations critiques et clôture collective à formaliser. La mention « source de vérité » en page 26 donne une priorité documentaire claire à ce dossier, sans rendre chacune de ses figures automatiquement correcte.

### MagiquePro_Catalogue_Ecrans_UX.pdf — 71 pages

Le catalogue contient quatre pages introductives puis 67 fiches d'écran. Il couvre l'authentification, les demandes résidentielles et professionnelles, les espaces client/employé/admin et quelques états système. Chaque fiche associe un aperçu, un objectif, les actions, les données, les transitions et des notes UX.

**Points solides :** couverture étendue, formulaires guidés, prise en compte du réseau et des listes vides, distinction des expériences selon le rôle.

**Limites :** incohérences métier détaillées ci-dessous, plusieurs sous-écrans seulement mentionnés et non dessinés, absence d'un parcours administratif explicite de confirmation de réservation conforme au dossier équipe. L'index montre les écrans 01–16 et 35–50 ; il omet les plages 17–34 et 51–67, bien présentes ensuite. Certains glyphes d'icônes apparaissent comme des petits rectangles dans les pages rendues.

### MagiquePro_Design_System_v2.pptx — 11 diapositives

La charte spécifie le bleu `#1565C0` comme couleur principale, le turquoise `#00897B` comme accent fonctionnel, l'or `#FFB300` comme accent rare et l'encre `#1A1A2E`. Elle prévoit Poppins pour les titres, DM Sans pour le texte, une base d'espacement de 4 px, des rayons de 12–16 px et une palette sombre dédiée.

**Points solides :** direction visuelle commune aux trois rôles, hiérarchie des actions, composants réutilisables, distinction entre interfaces légères et denses.

**À préciser :** états disabled/loading/error/focus des composants, règles d'accessibilité et agrandissement du texte, unités d'implémentation mobile, variantes des composants et tokens exploitables par le code. Les exemples « Réserver maintenant » et « mission planifiée » côté client doivent être harmonisés avec le parcours officiel. Les PNG utilisent des dégradés et effets lumineux plus marqués que les exemples sobres de la charte.

## 3. Analyse des onze images

Les dix maquettes PNG mesurent 941 × 1672 pixels et contiennent un cadre de téléphone. Elles servent de références visuelles ; leurs dimensions ne constituent pas les dimensions logiques des composants de l'application.

| Fichier | Analyse |
|---|---|
| `Accueil client.png` | Action de demande bien visible et vocabulaire « réservations » conforme. Les catégories sont faciles à distinguer. Définir l'état sans réservation, l'accès aux offres et la destination de chaque catégorie. |
| `analyse de demande.png` | Regroupe détails, durée, effectif, prix et horaire proposé. Le bouton « Assigner plus tard » intervient avant l'acceptation dans cet écran d'offre : sa destination et sa disponibilité doivent être clarifiées. Taxes, validité et lignes de prix ne sont pas visibles. |
| `Connexion.png` | Connexion commune, récupération, inscription, Google et Apple présents. Définir les erreurs, l'attente réseau et le sens de « Se souvenir de moi ». Aucun sélecteur de rôle visible, ce qui correspond au dossier. |
| `Description du logement.png` | Informations concrètes, progression, photos et sélecteurs pratiques. L'unité m² diffère des pi² et du champ `area_sqft` du dossier. Le parcours en quatre étapes diffère du catalogue plus détaillé : établir la correspondance. Les limites de 500 caractères et cinq photos visibles doivent devenir des règles explicites si retenues. |
| `detail mission.png` | Consignes, checklist, progression et photos sont réunies utilement. « Terminer la mission » est affiché avec seulement 2 tâches sur 4 accomplies : prévoir soit un blocage, soit une justification et confirmation selon la règle choisie. Définir également le destinataire de l'icône d'appel. |
| `Logo.webp` | Image de seulement 160 × 200 pixels, avec fond bleu et slogan intégré. Trop petite pour servir de master destiné aux grands affichages. Prévoir un original vectoriel ou haute définition, une variante transparente et une icône d'application distincte. Le slogan mentionne le commercial alors que le produit couvre aussi le résidentiel. |
| `Mes reservation.png` | Bonne structure avec filtres et cartes. L'onglet « À venir » est sélectionné et annonce 2 éléments, mais trois cartes apparaissent, dont une terminée. Corriger les données d'exemple et les règles de filtrage. Préciser le sens du statut « En attente ». |
| `mission employe.png` | La mission du jour et son action principale ressortent bien. La barre propose Checklist, Signaler et Messages, tandis que le catalogue prévoit Agenda et Historique. Les messages demandent un arbitrage de périmètre ; ils ne doivent pas impliquer une messagerie temps réel déjà livrée. |
| `offre recu.png` | Accepter/refuser est clair. Problème majeur : les taxes sont annoncées « Calculées à la confirmation » alors que l'offre peut être acceptée immédiatement. Le catalogue exige un total et des conditions avant acceptation. L'expiration et l'effectif ne sont pas visibles. |
| `Splash.png` | Présentation de marque lisible et cohérente avec le nettoyage. Les quatre points suggèrent un onboarding à plusieurs pages dont les autres pages ne sont pas fournies. Définir s'il s'agit d'un accueil initial ou d'un véritable écran de lancement. |
| `tableau de board.png` | Compteurs et actions administratives visibles. Définir les périodes, calculs et destinations des indicateurs. Les mini-graphiques prennent de la place sans axes ni valeurs. Le mode sombre n'apparaît ici que chez l'admin : préciser si le thème dépend du choix utilisateur ou du rôle. |

Les exemples mélangent 2025 et 2026. Le tableau de bord affiche notamment « Jeudi 15 septembre 2025 », alors que cette date correspond à un lundi. Les données d'exemple doivent rester cohérentes entre écrans. L'orthographe des fichiers peut être normalisée : « tableau de bord », « offre reçue », « mes réservations », etc.

## 4. Incohérences prioritaires

### Priorité 1 — Corriger avant de figer API et navigation

1. **Missions exposées au client.** Le dossier équipe pages 3 et 26 réserve les missions aux employés/admin. Le catalogue pages 31–34 parle de mission à assigner, de « Mes missions / réservations », de « Détail mission client » et de notifications de mission. Il faut aussi corriger les objets et données présentés, pas seulement les titres.
2. **Confirmation de réservation omise.** Le dossier pages 6 et 11 prévoit une confirmation administrative après acceptation. Les transitions du catalogue pages 30–32 et 54–55 passent directement à l'assignation. Ajouter la phase et les écrans « horaire à confirmer » puis « réservation confirmée ».
3. **Refus d'offre.** Le catalogue page 30 indique une demande close/refusée, alors que le dossier pages 9 et 25 prévoit une nouvelle offre possible. Conserver une demande ouverte après refus, sauf décision de clôture distincte.
4. **Plusieurs employés.** Le dossier prévoit plusieurs assignations dès le MVP ; le catalogue page 56 repousse cette possibilité à plus tard. Les offres demandent déjà parfois deux employés. L'écran et les règles d'assignation doivent gérer l'effectif prévu.
5. **Diagramme des statuts.** En page 20 du dossier, les flèches d'offre relient `DRAFT → SENT → ACCEPTED → REJECTED → EXPIRED → SUPERSEDED`. Ce dessin confond liste d'états et transitions. Dessiner des branches depuis les états admissibles et préciser les conditions. Les chaînes réservation/mission montrent aussi `COMPLETED → CANCELLED`, qui ne doit pas devenir un comportement automatique.
6. **Montant accepté incomplet dans le PNG.** L'offre doit afficher le montant et les conditions que le client accepte. Aligner l'écran sur le calcul du sous-total, taxes, total et validité prévu dans les documents, sans différer une partie du prix après l'action.

### Priorité 2 — Compléter la spécification métier et les données

- **Checklist :** aucune table ou structure dédiée n'est décrite dans le modèle présenté. Définir les tâches, leur origine dans l'offre, leur statut, l'auteur et les dates de validation.
- **Services sélectionnés :** le formulaire permet des options détaillées mais leur stockage structuré dans la demande n'est pas explicité. Le catalogue administrable de services de la page 65 exige lui aussi un modèle ou une décision de report.
- **Disponibilités employés :** les conflits avec d'autres missions sont prévus, mais ils ne suffisent pas à représenter les horaires de travail et absences. Définir ce qui rend un employé réellement disponible.
- **Pièces jointes professionnelles :** le catalogue prévoit des PDF/documents alors que le modèle décrit `request_photos`. Définir les pièces jointes génériques, types, tailles et permissions.
- **Sessions et notifications :** la persistance des refresh tokens, révocations, codes de vérification/récupération, appareils push et préférences n'est pas spécifiée. Le champ unique `auth_provider` ne précise pas le cas d'un compte lié à plusieurs fournisseurs.
- **Audit :** `mission_logs` couvre les opérations des missions. Le stockage de l'historique des offres, demandes et modifications de comptes n'est pas défini malgré l'exigence d'audit global.
- **Proposition horaire :** les offres affichent un créneau proposé mais les champs de `quotes` ne l'indiquent pas. Distinguer les disponibilités du client, la proposition commerciale et le rendez-vous confirmé.
- **Clôture et incidents :** qui termine une mission à plusieurs employés ? Que faire des tâches incomplètes, incidents et téléversements en attente ? Le rapport de fin doit avoir une représentation persistante définie.
- **Annulation/replanification :** fixer les acteurs autorisés, conditions et effets sur réservation, mission, assignations et notifications, même sans paiement intégré.
- **Historique des adresses :** définir l'effet d'une modification/suppression d'adresse sur les anciens dossiers. Une copie figée des informations utiles au moment de la réservation est une option à examiner.
- **Accès aux photos client :** le glossaire réserve les photos de demande au client et à l'admin, mais le catalogue page 40 les prévoit chez l'employé. Définir explicitement les médias nécessaires à l'employé assigné et leur exposition autorisée.
- **Cardinalités :** l'UML page 14 indique 1..* assignations pour une mission alors que l'état `TO_ASSIGN` suppose zéro assignation possible. La relation demande/rendez-vous et le nombre de réservations autorisées au MVP doivent aussi être explicités.

Ces points décrivent des lacunes de spécification, pas des défauts d'une application exécutée.

## 5. Architecture et préparation du développement

La stack décrite est React Native/TypeScript avec Expo, React Navigation, TanStack Query, Zustand, React Hook Form/Zod, une API REST NestJS, Prisma/MySQL, JWT/refresh tokens/bcrypt, FCM et un stockage objet de photos. Elle sépare clairement interface, règles métier, données relationnelles et fichiers.

Les livrables techniques à dériver de cette base sont :

1. Une matrice des transitions par objet, avec acteur, préconditions, effets et erreurs.
2. Un modèle de données complet, puis les migrations et contraintes correspondantes.
3. Un contrat API décrivant les données visibles par chaque rôle, la pagination, les validations et les erreurs.
4. Des opérations fiables en cas de double clic, nouvelle tentative réseau ou actions simultanées : une seule offre acceptée, absence de mission dupliquée et absence de double assignation conflictuelle.
5. Une politique explicite de montants, précision, arrondis, devise et conservation des conditions acceptées ; préciser aussi si une durée représente du temps écoulé ou des heures de travail cumulées.
6. Des règles de synchronisation entre demande, offre, réservation et mission. Une clôture doit mettre à jour les objets concernés de façon cohérente.
7. Des parcours de tests ciblés : refus puis nouvelle offre, acceptation concurrente, replanification, suspension employé, accès interdit et reprise après échec d'envoi de photo.

L'organisation en cinq responsabilités est documentée. Le périmètre reste large pour un MVP, avec 67 fiches UX, deux parcours de demande et trois rôles. Les fiches ne correspondent pas forcément à 67 composants indépendants : plusieurs peuvent partager des écrans paramétrés. Commencer par un parcours résidentiel complet permet de valider les liens entre les rôles avant d'étendre la couverture.

## 6. Ordre de travail proposé

1. Choisir la graphie officielle : MagicPro ou MagiquePro, y compris dans le logo et les libellés.
2. Mettre à jour les statuts et règles du dossier équipe, puis aligner le catalogue UX et les PNG.
3. Fixer le périmètre MVP écran par écran, y compris support, messages, statistiques et disponibilité employé.
4. Compléter les données et contrats API manquants.
5. Transformer la charte en composants et tokens partagés, avec états d'erreur, attente, vide et thème sombre.
6. Développer et valider le scénario complet client → admin → employé → réservation terminée.

Le dossier fournit une vision suffisamment précise pour préparer le développement. Sa consolidation doit surtout empêcher que deux membres de l'équipe implémentent des règles différentes en suivant chacun un document différent.
