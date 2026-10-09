# Voir l’espace employé MagiquePro avec Expo Go

Ce guide te permet d’ouvrir les écrans sur ton téléphone à partir du projet sur ton ordinateur Windows. Garde les versions indiquées dans `package.json` : il n’est pas nécessaire de mettre Expo ou React Native à jour.

## 1. Installer Expo Go sur ton téléphone

Ouvre la [page officielle de téléchargement Expo Go](https://expo.dev/go) depuis ton téléphone, puis choisis iPhone ou Android. Tu peux aussi utiliser directement :

- [Expo Go sur l’App Store — iPhone](https://apps.apple.com/app/expo-go/id982107779)
- [Expo Go sur Google Play — Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

Installe l’application **Expo Go**. Le projet utilise **Expo SDK 57**, pris en charge par la version actuelle d’Expo Go. Sur iPhone, connecte-toi dans Expo Go avec ton compte Expo ; tu utiliseras ce même compte sur l’ordinateur à l’étape 3. [Compatibilité et connexion Expo Go SDK 57](https://expo.dev/changelog/expo-go-57-login)

**Il y a deux comptes différents :** le compte Expo sert à ouvrir le projet ; le compte employé MagiquePro sert ensuite à entrer dans l’application. Les identifiants MagiquePro figurent à l’étape 5.

## 2. Récupérer le bon code sur l’ordinateur

1. Ouvre le [dépôt MagiquePro sur GitHub](https://github.com/beelmaryama-netizen/projet_fin_detude).
2. Dans la liste des branches, sélectionne **feature/meryem-espace-employe**. Si elle n’apparaît pas encore, attends la confirmation de publication du code.
3. Clique sur **Code**, puis **Download ZIP**.
4. Extrais le ZIP dans un nouveau dossier, sans remplacer ton ancien projet.
5. Ouvre le dossier extrait qui contient le fichier **package.json**.

Si Node.js n’est pas installé sur ton ordinateur, télécharge la version **LTS** depuis le [site officiel Node.js](https://nodejs.org/), puis installe-la. L’environnement de développement utilisé pour ce projet dispose de Node.js **24.14.1**.

## 3. Démarrer le projet

Dans l’Explorateur Windows, ouvre le dossier qui contient `package.json`. Clique dans la barre d’adresse, tape `cmd`, puis appuie sur Entrée. Une fenêtre de terminal s’ouvre dans ce dossier.

Entre cette commande, puis attends la fin de l’installation :

```bat
npm ci
```

Sur iPhone, connecte ensuite l’ordinateur au **même compte Expo** que celui ouvert dans Expo Go :

```bat
npx expo login
```

Puis démarre le projet :

```bat
npx expo start --go
```

Un QR code apparaît dans le terminal. **Garde cette fenêtre ouverte** pendant que tu utilises l’application.

## 4. Ouvrir les écrans sur ton téléphone

1. Connecte le téléphone et l’ordinateur au **même réseau Wi-Fi**.
2. Sur **Android**, ouvre Expo Go et utilise son lecteur de QR code.
3. Sur **iPhone**, ouvre l’app Appareil photo, vise le QR code du terminal et touche le lien proposé pour l’ouvrir dans Expo Go.
4. Patiente pendant le premier chargement.

Si le téléphone ne parvient pas à joindre l’ordinateur, arrête le serveur avec **Ctrl + C**, puis essaie :

```bat
npx expo start --go --tunnel
```

Suis les instructions éventuelles du terminal, puis scanne le nouveau QR code. Le tunnel peut être plus lent. [Instructions officielles : démarrage, QR code et réseau](https://docs.expo.dev/get-started/start-developing/)

## 5. Se connecter à MagiquePro

Dans l’écran de connexion **MagiquePro**, saisis :

| Champ | Valeur |
| --- | --- |
| Adresse courriel | `employee@magicpro.demo` |
| Mot de passe | `MagicPro!2026` |
| Code de vérification, s’il est demandé | `123456` |

N’utilise pas ces identifiants dans Expo Go : ils servent uniquement à MagiquePro.

Tu arrives dans **Espace employé**. Pour présenter le parcours :

1. Complète le profil de première connexion, puis touche **Accéder à mes missions**.
2. Ouvre une mission à venir pour voir son détail.
3. Touche **Démarrer la mission**.
4. Ouvre la checklist et coche les tâches. Pour une tâche autorisée en **Non applicable**, indique une justification.
5. Reviens au suivi et touche **Terminer l’intervention**. Les tâches obligatoires doivent être réalisées ou justifiées.
6. Complète le rapport : résumé de l’intervention et description de l’incident si tu en déclares un. Tu peux enregistrer un brouillon.
7. Touche **Valider le rapport** pour afficher **Mission terminée**.

Une mission déjà en cours est aussi disponible pour accéder rapidement au suivi. Les photos sont facultatives.

## Voir rapidement les écrans dans le navigateur

Depuis le dossier du projet, tu peux lancer :

```bat
npm run web
```

Si le serveur Expo fonctionne déjà dans le terminal, appuie simplement sur **w**. Connecte-toi avec le compte employé indiqué ci-dessus.

## À savoir pour la démonstration

Les missions, les horaires, la checklist et les rapports sont des **données de démonstration** conservées en mémoire pendant la session. Revenir d’un écran à l’autre conserve tes choix. Recharger complètement l’application ou se déconnecter réinitialise cette démonstration ; le compte suivant ne récupère pas le brouillon précédent.

Le rapport n’est pas envoyé à un serveur. Le navigateur permet un aperçu immédiat ; la vérification sur des appareils iPhone et Android physiques reste à effectuer.
