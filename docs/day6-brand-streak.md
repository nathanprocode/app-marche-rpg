# Jour 6 — Marque du Sacrifice + streak

## Objectif
- Implémenter la logique de série journalière.
- Dériver l'état de la Marque (`idle`, `active`, `bleeding`).
- Refléter cet état dans un composant UI dédié.

## Ajouts
- `src/features/brandOfSacrifice/streakEngine.ts`
- `src/features/brandOfSacrifice/bleedingState.ts`
- `src/features/brandOfSacrifice/types.ts` (étendu)
- `src/store/useBrandStore.ts`
- `src/ui/components/BrandBadge.tsx`
- `src/ui/screens/ProfileScreen.tsx` (mise à jour)

## Notes
- La logique actuelle compte les jours sédentaires et fait saigner la marque à partir de 2 jours.
- On branchera la synchro automatique `usePedometerStore` -> `useBrandStore` dans un prochain incrément runtime.
