# Apparence de MagicPro

Le réglage se trouve dans **Profil → Apparence** : Selon l’appareil (par défaut), Mode clair ou Mode sombre.

Le changement est immédiat et ne remonte pas le navigateur : la route courante, la session et les formulaires restent en place. Le réglage est propre à cet appareil, conservé après déconnexion et mémorisé avec SecureStore sur iOS/Android, localStorage sur web. Une erreur de stockage est affichée dans le réglage, sans empêcher l’application du thème pour la session.

Les palettes sont centralisées dans `src/theme/tokens.ts`. Les composants utilisent `useAppTheme` et des styles calculés à partir de la palette active. Le bleu des boutons pleins est distinct du bleu des liens pour conserver un texte blanc lisible. Navigation, fenêtres de confirmation, champs, messages, cartes, onglets et écrans publics/client utilisent le même thème. La barre d’état reste claire sur les en-têtes bleus foncés dans les deux modes. Le clavier iOS suit le mode choisi.

## Fichiers principaux

- `src/theme/ThemeProvider.tsx` : préférence, détection système, stockage et contexte réactif.
- `src/theme/appearance.ts` et `appearance.test.ts` : résolution du mode, validation des valeurs et tests de contraste.
- `src/components/AppearanceSettings.tsx` : choix accessible dans le profil.
- `src/theme/tokens.ts` : palette sombre et couleurs sémantiques.
- `App.tsx`, `RootNavigator.tsx`, `ClientNavigator.tsx` et composants utilisant les couleurs : intégration sans réinitialisation de la navigation.
- `app.json`, `package.json`, `package-lock.json` : apparence native automatique et module Expo System UI compatible avec la version du projet.

## Vérifications

TypeScript et 51 tests réussis. Export Expo Android, iOS et web réussi. Les tests vérifient notamment la priorité du choix explicite sur le système, une préférence stockée invalide et un contraste d’au moins 4,5:1 pour les couples de couleurs principaux dans les deux palettes. Aucun lint configuré dans ce projet.

À vérifier sur appareil : changement du thème système, redémarrage après sauvegarde du choix, clavier et sélecteurs natifs. Ces derniers restent des interfaces gérées par le système. Une nouvelle compilation native est nécessaire pour intégrer le nouveau module dans un development build existant. Aucun contrôle visuel sur appareil n’est déclaré comme réalisé.
