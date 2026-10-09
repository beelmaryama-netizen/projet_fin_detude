# MagicPro — Projet de fin d’études

- `mobile/` : application Expo / React Native et stories frontend.
- `backend/` : API de Mohamed Nouaoury (SCRUM-23), schéma et stories de base de données de Younes (SCRUM-22 et SCRUM-6).

Les branches Git restent au niveau du dépôt. Chaque branche conserve son propre travail ; les fichiers sont classés par composant.

## Mobile

```sh
cd mobile
npm ci
npm run check
npm start
```

## Backend

Lorsqu’une branche contient l’API Express/Prisma :

```sh
cd backend
npm ci
npm run dev
```

Consulter la configuration Prisma et les variables requises avant les migrations. Le mobile utilise encore ses services simulés ; déplacer les dossiers ne connecte pas automatiquement l’API.

Une ancienne base NestJS, si présente, est conservée dans `backend/legacy-nest/`.
