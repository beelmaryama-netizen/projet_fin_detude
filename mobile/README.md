# MagiquePro — Application mobile

Application React Native + TypeScript exécutée avec Expo.

## SCRUM-16 — Maryem Belouaar

La branche `feature/SCRUM-16-interface-utilisateur` contient la partie frontend client de Maryem :

- accueil client professionnel;
- demande de service;
- catégories Résidentiel, Commercial, Industriel et Médical;
- aperçu des prochaines réservations;
- navigation client;
- identité visuelle MagiquePro;
- mode clair / mode sombre activable avec l’icône lune/soleil.

## Lancer avec Expo

```bash
cd mobile
npm install
npx expo start -c
```

Sur Android :
1. Installer **Expo Go** depuis Google Play.
2. Mettre le PC et le téléphone sur le même Wi-Fi.
3. Scanner le QR code affiché par Expo.

Si le réseau local bloque le QR :

```bash
npx expo start --tunnel
```

Compte client de démonstration :

```text
client@magicpro.demo
MagicPro!2026
```

Une fois connecté, utiliser l’icône **lune/soleil** dans l’en-tête pour basculer entre mode clair et mode sombre.

## Vérifications

```bash
npm run typecheck
npm test
```
