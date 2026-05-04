# Démarrage propre Expo Router (SDK 54)

## 1) Reset complet (obligatoire)

```bash
rm -rf node_modules package-lock.json .expo
npm cache verify
npm install
```

## 2) Ajouter vos assets manuellement (non versionnés ici)

- `assets/map/world-map.png`
- `assets/map/guts-marker.png`

## 3) Lancer Expo avec cache nettoyé

```bash
npx expo start -c
```

## 4) Si écran blanc web persiste

1. Ouvrir l’app en **navigation privée** (désactive les extensions de navigateur).
2. Tester en appuyant `w` dans le terminal Expo (nouvelle fenêtre).
3. Vérifier que l’erreur `Cannot use 'import.meta' outside a module` disparaît.

## 5) Dépendances web indispensables

- `react-dom`
- `react-native-web`

Ces dépendances doivent être installées et alignées avec Expo SDK 54.
