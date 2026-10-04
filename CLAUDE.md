# Marche du Faucon

Podomètre gamifié Android (Expo SDK 54, React Native, Zustand, Firebase), univers de Berserk.

**Lire d'abord `docs/HANDOFF.md`** : état du projet, décisions de game design, ce qui reste à faire, pièges de développement.
`README.md` décrit les règles du jeu et la structure du code.

## Règles de travail

- Répondre en français, simplement : le propriétaire n'est pas à l'aise avec Git (branches, PR, CI à expliquer clairement).
- Les choix de game design (durée, difficulté, pénalités, contenu) se décident avec lui avant de coder.
- Avant de proposer un changement fini : `npm run typecheck` et `npm test` doivent passer ; vérifier l'écran dans le mode test web
  (`/?devpreview`) quand l'interface change.
- Branche de travail → PR vers `main` → CI verte → fusion. Ne créer une PR que si on le demande.
- Tout changement natif (`app.json`, module natif, dépendance native) exige un nouveau build EAS : le dire clairement.
- Ne pas affirmer qu'une fonctionnalité marche « sur téléphone » sans l'avoir testée sur téléphone.
