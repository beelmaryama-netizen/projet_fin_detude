# MagicPro Mobile — Authentification et espace client

Module Expo / React Native / TypeScript strict. Cinq écrans publics et premiers écrans client, services entièrement simulés. Aucun backend, envoi de courriel ou fournisseur OAuth réel n'est appelé. Voir `LIVRAISON_CLIENT.md` pour le détail du module client et ses limites, et [LIVRAISON_EMPLOYE.md](LIVRAISON_EMPLOYE.md) pour l’espace employé de Meryem, son accès et ses règles de démonstration.

## Démarrer

```sh
npm ci
npm start
```

Scanner le QR avec une version d'Expo Go compatible SDK 57 ou utiliser un build de développement. `npm run android` ouvre un émulateur Android disponible. `npm run ios` nécessite macOS et un simulateur iOS. `npm run web` sert à prévisualiser les écrans dans un navigateur.

```sh
npm run check
npx expo install --check
npx expo export --platform all
```

Le projet utilise les versions React/React Native du modèle TypeScript officiel Expo SDK 57. Le fichier de verrouillage fixe les dépendances installées.

## Parcours

- Splash → Connexion.
- Connexion → Inscription client / Mot de passe oublié / Vérification si requise.
- Inscription → Vérification du courriel → confirmation de connexion.
- Mot de passe oublié → Vérification du code → nouveaux mots de passe sur le même écran → Connexion.
- La connexion CLIENT ouvre l’accueil client avec les onglets Accueil, Mes demandes, Réservations et Profil. EMPLOYEE ouvre l’espace employé après la vérification existante : accueil de première utilisation, missions, checklist et rapport. ADMIN ouvre le tableau de bord employeur ; chaque espace conserve la déconnexion existante.
- Accueil client → Type de service → Détails du logement pour Résidentiel. Les autres catégories ouvrent un placeholder explicite. La date et les préférences disposent d’une route préparée, sans envoi de demande.

## Essayer les mocks

Mot de passe des comptes de démonstration : `MagicPro!2026`. Code de vérification : `123456`.

| Courriel | Rôle | Vérification à la connexion |
|---|---|---|
| client@magicpro.demo | CLIENT | Non |
| verification@magicpro.demo | CLIENT | Oui |
| employee@magicpro.demo | EMPLOYEE | Oui |
| admin@magicpro.demo | ADMIN | Oui |

Les inscriptions créent toujours un CLIENT. Aucun choix de rôle ni création publique d'employé/admin. Même un champ `role` ajouté à l'exécution est ignoré par le service. Les deux boutons Google/Apple reproduisent uniquement le résultat d'une connexion CLIENT de démonstration.

Les comptes créés, mots de passe de test et sessions restent en mémoire et disparaissent au rechargement. Ne pas utiliser de véritables identifiants dans cette simulation. Aucun faux token n'est écrit dans le stockage sécurisé.

Le code expire après 5 minutes, devient inutilisable après validation et autorise 5 tentatives. Le renvoi est disponible après 30 secondes et invalide l'ancien challenge. Le code de démonstration reste identique, mais l'identifiant du challenge change. Le jeton de récupération dure 5 minutes, permet uniquement la modification du mot de passe et ne connecte pas l'utilisateur. La demande de récupération répond de manière identique pour un courriel connu ou inconnu.

## Organisation

```text
src/
  features/auth/
    screens/       Splash, Login, Register, ForgotPassword, Verification
    components/    AuthLayout, SocialButtons…
    schemas/       Validation Zod et types des formulaires
    hooks/         Formulaires, mutations, parcours et temporisation
    services/      Contrat injecté et simulateur en mémoire
    types/         Contrats d'authentification et erreurs
  features/client/ Écrans client, réservation mock et composants associés
  features/requests/ Formulaire, types, schémas Zod, photos et hooks du brouillon
  navigation/      Pile racine, pile client et onglets typés
  theme/           Couleurs, espacements, rayons, polices
  components/      Brand, ControlledField, boutons, textes, sélections et champs partagés
  services/        Axios, QueryClient, adaptateur SecureStore
  store/           Session et brouillon de demande Zustand en mémoire
  types/           UserRole, User, Session
```

Les écrans assemblent des composants. Les hooks orchestrent les formulaires et mutations. Le service porte le comportement d'authentification simulé. React Hook Form/Zod valide les saisies ; TanStack Query gère les actions asynchrones sans réessai automatique des mutations. Les mots de passe ne sont jamais placés dans les paramètres de navigation.

## Sources et décisions

Références fournies dans `C:\Users\arfao\OneDrive\Bureau\technique\MagicPro` : dossier équipe (26 pages), catalogue UX (71 pages), design system v2 (11 diapositives), maquettes PNG et `Logo.webp`. Voir également `ANALYSE_MAGICPRO.md`.

- Bleu #1565C0, turquoise #00897B, or #FFB300, encre #1A1A2E.
- Poppins pour les titres, DM Sans pour le corps, polices embarquées localement via les paquets Expo Google Fonts.
- Espacements 4/8/16/24/32 et rayons 12/16.
- Le nouveau logo PNG fourni par l'utilisateur est copié sans modification dans `assets/magicpro-logo.png`. Le composant `Brand` l'utilise sur tous les écrans, avec ses proportions 3:2 et sans mot-symbole ajouté en double. Le projet et ses contrats utilisent MagicPro.
- Pas de sélecteur de rôle. Les noms techniques restent CLIENT / EMPLOYEE / ADMIN selon la demande.
- La politique de nouveaux mots de passe (12 caractères, diversité, maximum 72 octets) est un choix d'implémentation à valider avec le futur backend ; les documents ne la fixent pas précisément.
- La présence d'une étape MFA à la connexion est simulée par les comptes de test. La vérification de courriel à l'inscription est distinguée de la MFA dans les types et les textes.
- Le renouvellement du mot de passe est un état du cinquième écran pour terminer le parcours demandé sans sixième route.
- Google et Apple reprennent les maquettes, sans implémentation OAuth réelle. Le choix de persistance « Se souvenir de moi » est omis puisque cette version mock n'offre pas de session persistante.

## Future API NestJS JWT

Remplacer uniquement l'instance dans `features/auth/services/authService.ts` par un adaptateur respectant `AuthService`. `createHttpClient` prépare les requêtes Axios et l'en-tête Bearer, sans URL arbitraire ni appel actuel. `tokenStorage` fournit un adaptateur SecureStore natif pour un refresh token ; le web reste volontairement non persistant.

Avant connexion réelle : définir les routes/DTO, valider les réponses API, conserver l'access token en mémoire, brancher la rotation/révocation du refresh token, sa suppression à la déconnexion et la restauration via l'API. Le serveur doit imposer CLIENT à l'inscription, vérifier OAuth et les codes, et autoriser chaque ressource. Les restrictions d'interface ne remplacent jamais ces contrôles. Le service mock ne doit pas être inclus comme authentification de production.

Documentation technique consultée : [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) et [React Navigation](https://reactnavigation.org/docs/getting-started/).

## Accessibilité et affichage

SafeAreaProvider/SafeAreaView, formulaires scrollables et KeyboardAvoidingView, largeur de lecture limitée sur tablette/web, boutons et bascules de visibilité tactiles, labels explicites, erreurs annoncées, clavier adapté et autocomplétion. Le code utilise un seul champ pour permettre collage, lecteur d'écran et autofill. L'agrandissement natif des textes est conservé. Une validation sur appareils iOS/Android reste nécessaire, notamment pour clavier, autofill, lecteur d'écran et zones sûres.
