# Marche du Faucon

App Android personnelle (pas de Play Store, pas d'iOS) : un podomètre sur le thème de Berserk. Chaque pas
fait avancer le Traqué sur une carte de 1 000 km (18 checkpoints). La Marque du Sacrifice saigne si on ne
marche pas assez. Projet de Nathan (designer UI/UX, développeur front-end) : réponds en français, simplement,
et explique les commandes à taper (il travaille sous Windows, PowerShell).

Stack : Expo SDK 54, Expo Router v6, React Native 0.81 (nouvelle architecture), TypeScript strict, Zustand,
Firebase (connexion Google + Firestore `users/{uid}`), Jest (`jest-expo`).

## Commandes

```
npm run typecheck        # tsc --noEmit : à lancer avant de dire qu'un changement est bon
npm test                 # Jest : logique pure (src/**/__tests__/*.spec.ts)
npx expo start --web     # aperçu navigateur : http://localhost:8081/?devpreview (sans Google, données fictives)
npx expo start --dev-client --tunnel   # test sur le téléphone (build de développement)
eas build --profile development --platform android   # build natif : répondre NON à la question sur l'émulateur
```

## À ne jamais faire

- Ne tape jamais `y` si `npx` propose d'installer `expo@57` (ou une autre version d'Expo) : ça réécrit le
  `package.json` et casse tout. Ajoute les paquets avec `npx expo install <paquet>` depuis le dossier
  du projet, une fois `npm install` fait.
- Pas de `--force` ni `--legacy-peer-deps` pour contourner une erreur de dépendances : trouve la cause.
- EAS lance `npm ci` : `package.json` et `package-lock.json` doivent toujours être committés ensemble.
- Ne committe pas les clés ou identifiants. N'écris pas dans Firestore sans que Nathan le demande.

## Organisation

- `app/` : routes Expo Router. `(tabs)` = Marche, Carte, Quêtes, Profil ; `login`.
- `src/core/theme/` : design system « Encre & Sang » (couleurs, espacements sur grille de 8, typographie).
  Utilise `theme.colors`, `theme.space`, `theme.text` : pas de valeurs en dur. Polices : Pirata One
  (titres, chiffres), Spectral / Spectral SC (texte, labels).
- `src/features/` : logique métier **pure et testée** (`progression`, `brandOfSacrifice`, `mapJourney`,
  `pedometer`, `runtime`, `userCloud`). Toute règle de jeu va ici, avec un test.
- `src/store/` : états Zustand. `src/ui/` : composants et écrans.
- `src/data/map/berserk-checkpoints.ts` : **seule source** des checkpoints (km, texte, position sur la carte).
- `src/core/format.ts` : formats français (espace insécable, virgule décimale). À utiliser pour tout nombre affiché.
- `modules/permanent-pedometer/` : module Android natif (Kotlin) du suivi permanent, plus `plugins/withPermanentPedometer.js`.
  Toute modification du Kotlin, de `app.json` ou d'un paquet natif demande un nouveau build EAS.

## Règles du jeu (`src/core/constants/game.ts`)

1 pas = 0,75 m. Objectif 1 000 km. La Marque est apaisée dès 1 500 pas dans la journée. La série (streak)
augmente chaque jour où le seuil est atteint et repart à 1 après un jour manqué. Le calcul est basé sur
les jours calendaires locaux (`toLocalDayNumber`) et il est idempotent : appelable souvent sans dériver.

## Mode test web

`isDevPreview` (`src/core/devPreview.ts`) : actif seulement sur le web et en développement, avec `?devpreview`
dans l'adresse. Il saute la connexion Google et n'utilise ni Firestore ni vrais pas. Ne jamais l'activer
dans un build.

## Branches

- `main` : version stable d'origine. `refonte-design` : nouveau design et corrections. `suivi-permanent` :
  service Android de suivi en arrière-plan (non testé tant qu'un build n'a pas réussi).
- Fais `git pull` avant de commencer : Nathan alterne entre cet outil et d'autres sessions, qui poussent
  sur les mêmes branches.

## Points connus

- Les pas du jour sont stockés seulement sur le téléphone (AsyncStorage) : ils sont perdus à la
  désinstallation. Le total, la série et la progression sont dans Firestore.
- Les planches des chroniques n'existent que pour 6 checkpoints (`BERSERK_PANEL_IMAGES`).
- La connexion Google utilise un client OAuth Android : le SHA-1 de la clé de build EAS doit être déclaré
  dans Google Cloud (identifiants OAuth Android), sinon la connexion échoue.
- Sur Samsung, l'optimisation de batterie peut tuer le service de suivi : mettre l'app en « Non restreinte ».
- Les anciens `docs/day*.md` décrivent l'ancienne version : ne pas s'y fier.
