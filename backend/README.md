# MagiquePro — Backend

Structure séparée pour l'API Node.js / NestJS.

## Important

Le backend ici est volontairement minimal : il fournit seulement une base propre pour le projet et un petit catalogue de services utile au mobile.

Les stories **SCRUM-22 (base de données)** et **SCRUM-23 (routes backend)** restent la responsabilité des membres qui leur sont assignés. Ce dossier évite donc de remplacer leur travail.

## Lancer

```bash
cd backend
npm install
npm run start:dev
```

Tests rapides :
- `GET http://localhost:3001/api/health`
- `GET http://localhost:3001/api/services`

La suite prévue par le dossier technique de l'équipe est NestJS + Prisma + MySQL + JWT.
