# Jour 4 — Progression 1000 km + micro-étapes

## Objectif
- Construire le moteur de progression global (0 → 1000 km).
- Découper la progression en micro-étapes via des stages JSON.
- Identifier automatiquement l'étape courante et son pourcentage local.
- Préparer l'état pour la carte 2D de Jour 5.

## Ajouts
- `src/data/map/stages.json`: premières étapes de la route.
- `src/features/progression/engine.ts`: calcul progression globale + stage courant.
- `src/features/progression/selectors.ts`: helpers (`kmRemaining`, `isGoalReached`).
- `src/features/progression/types.ts`: ajout du type `JourneyStage`.

## Notes
- Les stages actuels sont un échantillon narratif; on étendra jusqu'à couvrir les 1000 km.
- `deriveBrandState` est provisoire et sera enrichi au Jour 6 avec la logique complète de streak.
