# Jour 5 — Carte 2D + déplacement de Guts

## Objectif
- Poser le moteur de positionnement de l'avatar sur la carte.
- Interpoler la position entre checkpoints selon la progression d'étape.
- Exposer un rendu minimal dans `MapScreen`.

## Ajouts
- `src/data/map/checkpoints.json`: coordonnées normalisées des étapes.
- `src/features/mapJourney/types.ts`: types de points et checkpoints.
- `src/features/mapJourney/interpolation.ts`: fonctions `lerp` et `interpolatePoint`.
- `src/features/mapJourney/mapEngine.ts`: `resolveAvatarPosition`.
- `src/ui/components/GutsMarker.tsx`: marqueur visuel de l'avatar.
- `src/ui/screens/MapScreen.tsx`: affichage de la carte + position.

## Notes
- Les coordonnées sont en pourcentage (0..1) pour rester indépendantes de la taille écran.
- Au prochain incrément, on remplacera le fond uni par la carte dessinée finale (asset).
