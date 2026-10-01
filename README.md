# Marche du Faucon

Podomètre gamifié sur Android, dans l'univers de Berserk : chaque pas fait avancer le Traqué sur la carte
de la Traque (1 000 km, 18 checkpoints). La Marque du Sacrifice saigne quand on ne marche pas assez.

Stack : Expo SDK 54, Expo Router, React Native 0.81, Zustand, Firebase (connexion Google + Firestore).

## Démarrer

```bash
npm install          # met aussi à jour package-lock.json : à committer
npm test             # tests de la logique (progression, séries, carte, pas du jour, formats)
npm run typecheck    # vérification TypeScript
npx expo start --dev-client --tunnel
```

L'app contient du code natif (`modules/permanent-pedometer/`) : Expo Go ne suffit pas, il faut un build de développement.

- **Build de développement** (à refaire seulement quand le code natif, `app.json` ou les dépendances natives changent) :
  `eas build --profile development --platform android`, installer l'APK, puis lancer le serveur ci-dessus.
  Les changements JS/TS se rechargent ensuite à chaud, sans nouveau build.
- **Build autonome** (sans serveur, pour l'usage quotidien) : `eas build --profile preview --platform android`.
- **Mode test web** (développement uniquement) : `npx expo start --web`, puis ouvrir
  `http://localhost:8081/?devpreview` : sans connexion Google ni Firestore, avec des données fictives.

## Règles du jeu (src/core/constants/game.ts)

- 1 pas = 0,75 m, objectif 1 000 km.
- La Marque est apaisée dès 1 500 pas dans la journée, sinon elle saigne.
- La série augmente chaque jour où le seuil est atteint et repart à 1 après un jour manqué.

## Structure

- `app/` : routes Expo Router (`(tabs)` : Marche, Carte, Quêtes, Profil ; `login`).
- `src/core/theme/` : design system « Encre & Sang » (grille de 8, tokens nommés comme les maquettes).
- `src/features/` : logique métier. Pure et testée : `progression`, `brandOfSacrifice`, `mapJourney`.
  Liée à l'appareil (non testée) : `pedometer` (capteur, service natif, notification), `runtime` (série et Marque du jour),
  `userCloud` (Firestore).
- `src/store/` : états Zustand. Les pas du jour sont stockés en local (AsyncStorage) ; la progression totale ne l'est
  que dans Firestore (`users/{uid}`).
- `src/ui/` : composants et écrans.
- `docs/` : notes de développement, jour par jour (`day1-setup.md` à `day7-stabilization.md`).
- `src/data/map/berserk-checkpoints.ts` : la seule source des checkpoints (km, texte, position sur la carte).
- `modules/permanent-pedometer/` : module Android natif : service de suivi permanent (notification fixe), activé par l'interrupteur du Profil. Demande un build natif (pas de simple rechargement).

## Design system

| Token | Valeur | Rôle |
| --- | --- | --- |
| `ink` | `#0C0A09` | fond |
| `inkRaised` | `#171311` | cartes sombres |
| `ash` | `#2E2823` | filets, pistes |
| `iron` | `#5E6472` | bordures actives |
| `bone` | `#E9E1CF` | papier, texte |
| `boneDim` | `#B8AE98` | texte secondaire |
| `umber` | `#5A5244` | texte sur papier |
| `blood` / `bloodGlow` / `bloodEmber` | `#8A0303` / `#C1121F` / `#E5484D` | actions / accent / texte rouge |

Espacements : `theme.space[4 | 8 | 16 | 24 | 32 | 48 | 64 | 96 | 128]`.
Typographie : Pirata One (titres et chiffres), Spectral (texte), Spectral SC (labels) ; échelle dans `src/core/theme/typography.ts`.
