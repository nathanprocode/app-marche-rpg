# Démarrage propre Expo Router (SDK 54)

1. Supprimer les dépendances locales cassées:

```bash
rm -rf node_modules package-lock.json
npm install
```

2. Ajouter vos assets manuellement (non versionnés ici):

- `assets/map/world-map.png`
- `assets/map/guts-marker.png`

3. Démarrer avec cache propre:

```bash
npx expo start -c
```

4. Ouvrir en web (`w`) ou téléphone (QR code).

## Ce qui a été corrigé
- Entrypoint `expo-router/entry` via `package.json`.
- Config Expo avec `scheme` dans `app.json`.
- Config Babel pour Expo Router.
- Config TypeScript Expo.
