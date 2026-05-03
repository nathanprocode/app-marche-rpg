# Jour 3 — Pedomètre + permissions + simulateur

## Objectif
- Introduire une couche `pedometer` isolée du reste de l'app.
- Préparer la gestion des permissions.
- Ajouter un simulateur pour développer sans capteur natif.
- Exposer un store prêt pour les écrans (pas du jour, km du jour, dernière synchro).

## Fichiers ajoutés
- `src/features/pedometer/types.ts`
- `src/features/pedometer/permissions.ts`
- `src/features/pedometer/simulator.ts`
- `src/features/pedometer/service.ts`
- `src/store/usePedometerStore.ts`

## Notes d'intégration Expo (prochaine étape)
Dans le vrai projet Expo initialisé:
- Remplacer `getPedometerPermissionStatus()` par l'appel API natif.
- Remplacer la partie simulation de `readStepsToday()` par la lecture réelle du capteur.
- Conserver `stepsToKm()` centralisé pour garder une conversion unique.
