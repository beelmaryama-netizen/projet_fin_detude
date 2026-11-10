# Intégration mobile / API locale

Le mobile utilise désormais l’API Express / Prisma du dépôt. Le backend local utilise MariaDB sur le port 3307 et expose HTTP sur le port 3000. Le mode démo reste disponible explicitement avec EXPO_PUBLIC_DATA_MODE=demo ; une erreur API ne bascule jamais vers les mocks.

## Parcours connectés

- Inscription CLIENT, connexion des trois rôles, profil, changement de mot de passe, déconnexion et renouvellement des jetons. Le jeton de renouvellement est stocké dans SecureStore sur mobile.
- Adresses, demandes résidentielles et professionnelles, disponibilités, photos et consultation des offres.
- Administration : lecture des demandes, préparation/envoi des offres, validité en heures, calcul serveur des taxes, comptes employés, affectations, planning, paramètres et support.
- Acceptation/refus de l’offre par le client, réservation et annulation sous conditions.
- Employé : missions affectées, démarrage, checklist et notes, photos avant/après, rapport et clôture.
- Notifications dans l’application, préférences enregistrées et appliquées, tickets et réponses du support.
- Brouillons locaux séparés par compte et URL d’API ; les données métier sont enregistrées côté serveur.

Les heures affichées sont celles de Toronto. Les photos JPEG/PNG sont transférées vers le stockage local privé du backend, via des liens signés temporaires. Les documents PDF ne sont pas encore transférés.

## Configuration sur ce PC

Mobile : mobile/.env (ignoré par Git)

```env
EXPO_PUBLIC_DATA_MODE=api
EXPO_PUBLIC_API_URL=http://192.168.1.16:3000/api
```

Backend : backend/.env et backend/.env.test (ignorés par Git). PUBLIC_API_URL doit être joignable depuis le téléphone, actuellement http://192.168.1.16:3000/api. FILE_STORAGE=local active le stockage backend/storage, également ignoré.

Les bases magicpro_api_local et magicpro_api_test sont séparées. Les tests qui réinitialisent les tables refusent un nom de base ne finissant pas par _test. L’installation MariaDB 11.4.8 dédiée est dans %LOCALAPPDATA%/MagicPro ; elle ne remplace pas les données XAMPP existantes.

Identifiants administrateur locaux : backend/tmp/LOCAL_ACCESS.md. Ne pas versionner ce fichier ni les .env.

## Démarrage après redémarrage du PC

Dans PowerShell, démarrer la base dédiée si le port 3307 n’écoute pas déjà :

```powershell
& "$env:LOCALAPPDATA\MagicPro\server\mariadb-11.4.8-winx64\bin\mariadbd.exe" "--defaults-file=$env:LOCALAPPDATA\MagicPro\data-11\my.ini" --bind-address=127.0.0.1
```

Dans un autre terminal :

```powershell
Set-Location 'C:\Users\arfao\OneDrive\Bureau\projet_fin_detude\backend'
npm start
```

Vérifier http://localhost:3000/health/db. Laisser la base et le backend ouverts. Pour lancer ensuite Expo :

```powershell
Set-Location 'C:\Users\arfao\OneDrive\Bureau\projet_fin_detude\mobile'
npx expo start --lan
```

L’iPhone doit être sur le même réseau que le PC et pouvoir accéder à http://192.168.1.16:3000/health/db. Si l’IP du PC change, modifier les deux URLs et redémarrer backend et Expo. Le pare-feu Windows peut nécessiter une autorisation locale pour Node/3000. Un tunnel Expo seul ne rend pas le backend accessible en 5G.

Sur un autre PC, installer MySQL/MariaDB, créer deux bases et configurer les .env à partir des exemples. Le script setup-local-api.cjs est spécifique à l’installation dédiée de ce PC ; ne pas l’utiliser sur une base de production.

## Migrations et vérifications

Dans backend, arrêter le serveur avant prisma generate sous Windows pour éviter le verrouillage du moteur Prisma :

```text
npx prisma generate
npx prisma migrate deploy
npm run test:db
npm test
```

Si le client Prisma est déjà généré et l’API tourne, exécuter directement :
node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand

Dans mobile :
- npm run check : TypeScript et tests Vitest.
- npx expo export --platform all --output-dir dist-validation : compilation Android, iOS et web.
- Aucun script lint n’est configuré dans le dépôt.

Avec l’API locale démarrée, depuis backend :
node scripts/test-mobile-api.cjs

Ce dernier test utilise les vrais adaptateurs mobiles et crée des comptes/dossiers de test dans magicpro_api_local. Il parcourt inscription → demande/photos → offre → acceptation → affectation → changement du mot de passe employé → checklist/photos/rapport → réservation terminée → support. Les secrets restent dans les fichiers locaux et l’environnement du processus.

## Résultats de validation

- TypeScript strict : réussi.
- Mobile : 168 tests réussis ; le test API réel est ignoré dans la suite ordinaire et exécuté séparément.
- Backend : 64 tests réussis.
- Test API réel : réussi, incluant les trois catégories professionnelles, le parcours résidentiel complet et les photos.
- Export Expo Android, iOS et web : réussi.
- API locale et connexion à la base : disponibles après redémarrage du serveur.
- Vérification Git des espaces : réussie ; secrets et exports exclus du versionnement.

## Limites restantes

- L’API ne propose pas encore récupération de mot de passe par email/code, OTP/MFA ou Google/Apple. Les appels correspondants retournent une indisponibilité explicite ; aucune validation fictive en mode API.
- Les pièces jointes PDF et l’édition du catalogue de services ne disposent pas encore du contrat backend nécessaire.
- Les notifications système push nécessitent l’enregistrement natif des appareils et la configuration du fournisseur ; les rappels planifiés ne sont pas implémentés. Les notifications internes fonctionnent.
- Les statistiques actuelles sont calculées à partir des dossiers ; elles ne représentent pas des paiements encaissés.
- L’export réussi ne remplace pas un essai réel sur iPhone/Android : caméra, galerie, SecureStore, reprise après fermeture et accès réseau restent à vérifier sur appareil.
- Cette configuration HTTP est destinée aux essais sur réseau local. Une mise en production demande notamment HTTPS et un stockage de fichiers durable.
