# Jour 7 — Stabilisation, branchements et tests de base

## Objectif
- Brancher les stores entre eux via une routine de synchronisation.
- Exposer une action manuelle de sync dans l'écran d'accueil.
- Ajouter des tests de base sur les moteurs métier critiques.

## Ajouts
- `src/features/runtime/dailySync.ts` : orchestration `pedometer -> player -> brand`.
- `src/ui/screens/HomeScreen.tsx` : bouton `Synchroniser la journée` + métriques live.
- `src/features/progression/__tests__/engine.spec.ts` : assertions de base progression.
- `src/features/brandOfSacrifice/__tests__/streakEngine.spec.ts` : assertions de base streak.

## Notes
- Les tests sont volontairement minimalistes (sans runner intégré) pour garder la structure prête à être branchée à Vitest/Jest.
- La prochaine étape est d'ajouter un runner + CI et d'exécuter ces tests automatiquement.
