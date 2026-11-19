# Compléments backend MagicPro

Les ajouts prolongent l’API Express/Prisma existante et réutilisent la navigation, les formulaires et le thème du mobile.

## Fonctionnalités implémentées

| Fonction | Backend | Connexion au mobile |
| --- | --- | --- |
| Inscription avec vérification du courriel | Code aléatoire, HMAC en base, expiration 10 minutes, 5 essais, délai de renvoi 60 secondes | Écran de vérification existant |
| Récupération du mot de passe | Réponse générique, code puis jeton de réinitialisation à usage unique ; révocation des sessions | Écrans mot de passe oublié / vérification |
| Double authentification par courriel | Activation/désactivation protégée ; connexion sans jeton avant validation du code | Réglage Sécurité et écran de vérification |
| Google et Apple | Vérification cryptographique du jeton, émetteur, audience, expiration et nonce serveur ; comptes CLIENT uniquement ; aucun rapprochement automatique par courriel | Adaptateur de finalisation disponible ; démarrage de l’autorisation native à intégrer/configurer |
| Documents PDF | Signature de transfert, contrôle de propriété, 10 Mo/document, 5 documents, reprise sans doublon, lecture signée et suppression | Demandes professionnelles et galerie ; téléchargement temporaire avant partage natif |
| Catalogue | Lecture, création, modification et archivage ; écriture ADMIN uniquement | Catalogue administrateur et ajout d’un service |
| Rappels | Réservations confirmées dans les 24 prochaines heures ; préférences respectées ; clé unique par horaire et destinataire | Notifications internes existantes |
| Push | FCM par lots et Expo ; suivi persistant des reçus Expo et suppression des jetons invalides | Endpoint d’enregistrement disponible ; enregistrement natif des appareils encore à raccorder |

La double authentification implémentée utilise le courriel, pas une application TOTP.

## Configuration locale des courriels

Dans backend/.env :

```env
REQUIRE_EMAIL_VERIFICATION=true
MAIL_TRANSPORT=local
MAIL_OUTBOX_DIR=tmp/mail-outbox
```

Aucun courriel externe n’est envoyé avec ce mode. Le message et le code se trouvent dans backend/tmp/mail-outbox/<identifiant-du-challenge>.json. Ce dossier est ignoré par Git. Le mode local est refusé en production.

Pour la livraison réelle : MAIL_TRANSPORT=smtp, SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD et MAIL_FROM. Ne pas mettre les secrets dans le dépôt. Un échec SMTP retourne une erreur explicite ; il ne valide pas le compte.

Les anciens comptes gardent leur accès. Les nouvelles inscriptions nécessitent un code par défaut. REQUIRE_EMAIL_VERIFICATION=false est réservé ici aux tests de compatibilité ; les tests dédiés activent la vérification.

## Endpoints ajoutés

Préfixe /api :

- POST /auth/forgot-password : email → challenge générique.
- POST /auth/verify-code : challengeId + code → session ou resetToken.
- POST /auth/resend-code : challengeId → nouveau challenge.
- POST /auth/reset-password : resetToken + password.
- GET /auth/security.
- POST /auth/mfa/challenge : enabled + currentPassword.
- POST /auth/mfa/confirm : challengeId + code, lié à l’utilisateur connecté.
- POST /auth/social/google/challenge et /auth/social/apple/challenge : nonce serveur.
- POST /auth/social/google et /auth/social/apple : challengeId + idToken, prénom/nom facultatifs.
- GET/POST /services ; PATCH/DELETE /services/:id (DELETE archive).
- GET /requests/:id/documents ; POST /requests/:id/documents/signature ; DELETE /requests/:id/documents/:documentId.
- POST /document-files/upload et GET /document-files/read : tickets signés temporaires.

Les codes ne sont jamais retournés dans la réponse HTTP. Les JWT d’accès ont une audience dédiée et une version de session contrôlée côté serveur. Changer ou réinitialiser le mot de passe invalide les anciens JWT et jetons de renouvellement.

## Activation Google / Apple

Configurer GOOGLE_CLIENT_IDS et APPLE_CLIENT_IDS avec les audiences autorisées, séparées par des virgules. Les endpoints retournent 503 tant que la configuration est absente.

Le client commence par demander un nonce, le transmet inchangé dans la demande d’autorisation du fournisseur, puis envoie l’ID token reçu avec le challengeId. Le serveur utilise les clés publiques officielles du fournisseur et consomme le challenge une seule fois. Le SDK mobile, les identifiants d’application, les URI de retour et les capacités natives restent à configurer. Les boutons sociaux ne simulent pas une connexion réussie.

Références : [Google — vérification du jeton](https://developers.google.com/identity/sign-in/ios/backend-auth), [Apple — authentification](https://developer.apple.com/documentation/signinwithapple/authenticating-users-with-sign-in-with-apple).

## Rappels et push

Le serveur vérifie les rendez-vous chaque minute. Un redémarrage ou plusieurs exécutions ne dupliquent pas les notifications grâce à leur clé unique en base. Une replanification crée une nouvelle clé. Les rendez-vous annulés sont exclus.

- REMINDERS_ENABLED=false désactive les rappels.
- node scripts/run-reminders.js permet une exécution manuelle.
- EXPO_PUSH_ENABLED=true active l’envoi vers les jetons Expo ; EXPO_ACCESS_TOKEN si la sécurité renforcée du projet Expo est activée.
- FIREBASE_SERVICE_ACCOUNT_PATH active l’envoi direct FCM.
- POST /notifications/devices et DELETE /notifications/devices enregistrent/retirent le jeton d’un appareil.

Les reçus Expo sont conservés en base, interrogés après 15 minutes et abandonnés après 24 heures. Les jetons DeviceNotRegistered sont supprimés. Le push reste une livraison externe au mieux : une notification est conservée dans l’application même si le fournisseur échoue. Les identifiants APNs/FCM et l’enregistrement natif du téléphone restent nécessaires ; aucun push réel n’a été validé sur appareil durant ces tests.

Référence : [Expo — envoi et reçus](https://docs.expo.dev/push-notifications/sending-notifications/).

## Installation et base locale

Après npm install dans backend, appliquer les migrations avec npx prisma migrate deploy puis générer le client avec npx prisma generate (serveur arrêté sous Windows). Les migrations existantes ne sont pas réécrites : backend_completion et push_receipts complètent SCRUM-24.

L’installation MariaDB dédiée n’était plus présente à la reprise. Une nouvelle instance sur 127.0.0.1:3307 a été créée avec les configurations .env conservées, puis les migrations et les données de seed ont été appliquées. Les anciens dossiers de cette instance absente ne sont pas restaurés. Les données XAMPP n’ont pas été modifiées.

## Vérifications

Résultat final : 75 tests backend, 168 tests mobiles et TypeScript réussis. Le test réel des adaptateurs et les exports Android, iOS et web ont réussi. Aucun essai natif sur téléphone ni envoi via un fournisseur externe n’est revendiqué.

- Tests backend : authentification, expiration/rejeu des codes, droits MFA, sessions révoquées, signatures sociales, absence de liaison automatique par email, PDF, catalogue, rappels et reçus push.
- Test réel via les adaptateurs mobiles : inscription avec lecture de la boîte locale, demandes professionnelles avec PDF, parcours résidentiel complet avec photos, MFA et récupération du mot de passe.
- TypeScript strict et tests mobiles ; export Expo Android/iOS/web.
- Aucun script lint configuré dans le projet.

Les vérifications Google/Apple utilisent des clés de test locales ; les tests push utilisent un fournisseur contrôlé. Ce sont des tests du contrat et des contrôles serveur, pas une preuve de livraison externe réelle.
