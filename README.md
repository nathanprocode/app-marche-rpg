# Marche du Faucon

Podomètre gamifié sur Android, dans l'univers de Berserk : chaque pas fait avancer le Traqué sur la carte
de la Traque (1 000 km, 18 checkpoints). La Marque du Sacrifice saigne quand on ne marche pas assez.

Stack : Expo SDK 54, Expo Router, React Native 0.81, Zustand, Firebase (connexion Google + Firestore).

## Démarrer

```bash
npm install          # met aussi à jour package-lock.json : à committer
npm test             # tests de la logique (progression, séries, carte, pas du jour, formats)
npm run typecheck    # vérification TypeScript (la CI GitHub lance ces deux commandes à chaque push)
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
- L'objectif quotidien se règle dans le Profil (1 500, 3 000, 5 000 ou 8 000 pas ; 1 500 par défaut).
- Arrivé à 1 000 km, un écran de fin propose un nouveau tour de Traque : la carte repart de zéro, mais les chroniques,
  les compagnons, les succès et les records restent acquis. Les pas en trop sont reportés sur le nouveau tour.
- 20 succès (distance, série, pas du jour, collections, tours) : onglet « Succès » des Quêtes.
- Historique du Profil sur 7 jours, 30 jours ou depuis le début (365 jours conservés sur le téléphone).
- Partage : image 4:5 « Encre & Sang » (point franchi avec sa planche, fin de Traque, succès, progression du Profil) envoyée
  par la feuille de partage du téléphone. Elle demande `react-native-view-shot` et `expo-sharing` (build natif) ;
  sur un build qui ne les contient pas, le partage retombe sur un texte.
- « Recommencer à zéro » (Profil) efface progression, série, succès, historique et sauvegarde cloud ; les réglages restent.
- Vibrations (Profil, désactivées par défaut) : un motif bref à chaque point franchi, succès, fin de Traque et objectif du jour atteint.
- Rappel du soir (Profil, désactivé par défaut) : une notification locale à l'heure choisie si l'objectif du jour n'est pas atteint.
  Les 3 prochains soirs sont programmés à chaque ouverture de l'app ; il ne demande pas de nouveau build natif.

## Structure

- `app/` : routes Expo Router (`(tabs)` : Marche, Carte, Quêtes, Profil ; `login`).
- `src/core/theme/` : design system « Encre & Sang » (grille de 8, tokens nommés comme les maquettes).
- `src/features/` : logique métier. Pure et testée : `progression`, `brandOfSacrifice`, `mapJourney`,
  `companions` (qui marche avec Guts, placement autour de lui sur la carte), `camp` (vignette jour/nuit et phrase d'ambiance),
  `history` (pas par jour, stats des 7 derniers jours du Profil), `zoom` (pincer et déplacer les planches des Chroniques).
  `achievements` (liste des succès et leur avancement), `reminders` (dates et texte du rappel du soir, programmation des notifications), `share` (cartes et textes de partage, capture de l'image), `haptics` (motifs de vibration).
  Liée à l'appareil (non testée) : `pedometer` (capteur, service natif, notification), `runtime` (série et Marque du jour),
  `userCloud` (Firestore).
- `src/store/` : états Zustand. La progression est sauvegardée en local (AsyncStorage, une clé par compte) à chaque
  pas, et dans Firestore (`users/{uid}`) au plus toutes les 30 s et au passage en arrière-plan. Au démarrage, le local
  est lu d'abord (l'app marche hors ligne), puis fusionné avec Firestore : la sauvegarde qui a le plus de pas l'emporte
  (`src/features/progression/savedProgress.ts`).
- `src/ui/` : composants et écrans.
- `docs/` : notes de développement, jour par jour (`day1-setup.md` à `day7-stabilization.md`).
- `src/data/map/berserk-checkpoints.ts` : la seule source des checkpoints (km, texte, position sur la carte).
- `src/data/companions.ts` : les 15 compagnons (texte, sprite, checkpoint de rencontre, tronçons parcourus avec Guts).
  Sprites dans `assets/companions/` (formes de boss dans `assets/bosses/`) (fond transparent, 192 px de haut), scènes de camp dans `assets/camp/`.
  15 compagnons dont 7 attendent encore leur sprite (Gambino, Judeau, Pippin, Corkus, Rickert, Godo, Flora) : en attendant,
  leur fiche montre une silhouette et ils n'apparaissent pas sur la carte.
  **Ajouter un sprite** : PNG à fond transparent, 192 px de haut, nommé `assets/companions/<id>.png` (même style que les
  autres), puis dans `companions.ts` remplacer le commentaire « Sprite à fournir » par
  `image: require("../../assets/companions/<id>.png"),`. Il apparaît alors sur la carte aux tronçons indiqués dans `travels`.
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
