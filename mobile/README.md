# MagiquePro — Application mobile

Application React Native + TypeScript exécutée avec Expo.

## Partie SCRUM-16 — Maryem

Cette branche contient l'interface principale client :
- accueil client;
- choix du type de service;
- début du parcours de demande;
- consultation des réservations;
- navigation client;
- identité visuelle MagiquePro.

Le projet reste compatible avec le flux d'authentification déjà présent dans la branche.

## Lancer l'application

```bash
cd mobile
npm install
npx expo start
```

Ensuite :
- téléphone : installer Expo Go et scanner le QR code;
- Android Studio : appuyer sur `a`;
- navigateur : appuyer sur `w`.

## Vérifications

```bash
npm run typecheck
npm test
```

Le mobile utilise actuellement des données de démonstration pour permettre la présentation sans dépendre d'une API déjà déployée.
