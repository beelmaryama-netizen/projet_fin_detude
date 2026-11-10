# Harmonisation des trois espaces
Branche locale : feature/integration-administration.

- La source des couleurs est src/theme/tokens.ts, via ThemeProvider. Le module administrateur utilise un adaptateur de noms, sans palette indépendante.
- Boutons, cartes et champs administrateur réutilisent les composants partagés du client.
- En-têtes bleus, surfaces clair/sombre, titres Poppins, texte DM Sans, cartes à rayon 16 et contrôles à rayon 12.
- Grand logo complet uniquement au splash.
- Logo compact de 128 × 108, centré et sans déformation, partagé par AuthLayout, ScreenLayout et les formulaires administrateur. Aucun logo dans les listes et tableaux de bord.
- Menu administrateur : bouton Apparence ouvrant le choix système/clair/sombre, même préférence persistée que client/employé.
- Navigation administrateur : Accueil, Demandes, Missions, Employés. Le vocabulaire client reste inchangé.
- Actions rapides administrateur sur deux colonnes, champs réutilisables, dialogues avec gestion du clavier.
- Correction FormField : secureTextEntry est respecté, avec bouton afficher/masquer.

Validation actualisée : voir RAPPORT_FONCTIONNALITES.md pour les tests et exports de la version complète.
Validation visuelle sur appareil restant à faire : clair/sombre, taille de texte agrandie, claviers et formulaires sur iPhone et Android. Aucune capture native ne constitue encore une validation visuelle de cette version.
