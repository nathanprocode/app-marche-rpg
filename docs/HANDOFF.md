# Passation : où en est le projet

Document écrit pour reprendre le projet dans une nouvelle conversation (avec Claude ou avec quelqu'un d'autre) sans rien
perdre. Il complète le `README.md` (règles du jeu et structure) et `docs/day*.md` (journal des premiers jours).
Dernière mise à jour : 4 octobre 2026.

## En deux phrases

Marche du Faucon est une app Android de podomètre gamifié dans l'univers de Berserk : chaque pas fait avancer Guts sur une
carte de 1 000 km (18 checkpoints), la Marque du Sacrifice saigne quand on ne marche pas assez, et on collectionne
chroniques, compagnons, succès et victoires de boss. Le propriétaire (Nathan) n'est pas à l'aise avec Git : on lui explique
les branches, la CI et les PR simplement, et on décide avec lui de tout ce qui touche au game design.

## État actuel (tout est dans `main`)

Tests : 25 suites, 208 tests, tous verts. CI GitHub (`.github/workflows/ci.yml`) : typecheck + tests à chaque push et PR.

### Fonctionnalités déjà livrées

| Domaine | Ce qui existe | Où |
| --- | --- | --- |
| Marche | Suivi des pas (capteur + service Android permanent), hors ligne, pas du jour remis à zéro à minuit | `src/features/pedometer`, `modules/permanent-pedometer` |
| Marque et série | Marque apaisée dès l'objectif du jour, série, meilleure série | `src/features/brandOfSacrifice`, `src/features/runtime/dailySync.ts` |
| Objectif quotidien | Réglable : 1 500 / 3 000 / 5 000 / 8 000 pas (Profil) | `src/store/useSettingsStore.ts` |
| Rappel du soir | Notification locale (désactivée par défaut), 3 prochains soirs reprogrammés à chaque ouverture | `src/features/reminders` |
| Succès | 22 succès (distance, série, pas du jour, collections, tours, boss), bandeau de déblocage, onglet « Succès » | `src/features/achievements`, `AchievementList`, `AchievementToast` |
| Tours de Traque | Écran de fin à 1 000 km, nouveau tour (carte à zéro, chroniques/compagnons/succès/records conservés) | `usePlayerStore.startNextLap`, `TraqueCompleteModal` |
| Duels de boss | Zodd : 2 duels (« Nosferatu Zodd » 115 km, « La Colline aux Épées » 590 km), 2 formes chacun ; **l'Éclipse (315 km) : 5 duels enchaînés** (Void 6 000, Ubik 7 000, Conrad 8 000, Slan 9 000, Femto 12 000 pas), vie en pas, sans limite de temps | `src/data/bosses.ts`, `src/features/bosses`, `DuelCard`, `BossEventModal` |
| Ennemis | Onglet « Ennemis » des Quêtes : Zodd + les 5 de la Main de Dieu, silhouette tant que le checkpoint n'est pas franchi, fiche, « Vaincu / À vaincre » | `src/data/enemies.ts`, `EnemyCollection` |
| Compagnons | 15 (dont 8 nouveaux), fiches, présence sur la carte selon `travels` | `src/data/companions.ts`, `CompanionCollection` |
| Carte | Chemin parcouru en piste de points, pincement pour zoomer/dézoomer, glissement, boutons, pas de recentrage forcé quand on explore | `MapScreen`, `src/features/mapZoom` |
| Historique | 7 jours / 30 jours / tout (365 jours gardés sur le téléphone) | `ProfileScreen`, `src/features/history` |
| Partage | Image 4:5 (point franchi, fin de Traque, succès, progression) + texte en repli | `src/features/share`, `ShareCard`, `ShareImageHost` |
| Vibrations | Option du Profil, désactivée par défaut : point franchi, succès, fin de Traque, boss, objectif du jour | `src/features/haptics` |
| Remise à zéro | « Recommencer à zéro » (local + cloud), réglages conservés | `src/features/runtime/eraseProgress.ts` |
| Bande (social) | Onglet « Bande » : créer/rejoindre avec un code `FAUCON-XXXXXX`, classement, amis sur la carte (point + nom), temps quasi réel via Firestore. **Demande de publier `firestore.rules`** | `docs/social.md`, `src/features/social`, `useSocialStore`, `BandScreen` |
| Accessibilité | Grandes polices, animations réduites, libellés TalkBack | partout |

### Ce qui n'est PAS fait

- **Sprites manquants** : Gambino, Judeau, Pippin, Corkus, Rickert, Godo, Flora. Sans sprite, la fiche montre une silhouette
  et le compagnon n'apparaît pas sur la carte. Pour en ajouter un : PNG à fond transparent, 192 px de haut,
  `assets/companions/<id>.png`, puis remplacer le commentaire « Sprite à fournir » de `src/data/companions.ts` par
  `image: require("../../assets/companions/<id>.png")`. Les formes de boss vont dans `assets/bosses/`.
- **Puck** : voulu par Nathan, pas d'image (il ne trouve rien et ne sait pas le dessiner). À ajouter quand un sprite existe
  (rencontre suggérée vers « Le Comte », `cp-008-5`).
- **Isma et Ivalera** : proposés puis écartés, car leur place dans l'histoire n'était pas sûre. À vérifier avant de les ajouter.
- **Compagnon préféré** (un compagnon rencontré « parle » dans le rappel du soir) : Nathan veut y réfléchir, ne pas le faire
  sans son accord.
- **Sons et ambiance** : pas implémentés. Idée retenue : rien de continu ; au plus un son bref (< 2 s) aux grands moments
  (point franchi, succès, fin de Traque), désactivé par défaut et coupé en mode silencieux. Demande un module audio natif
  (donc un build) et des fichiers audio libres de droits. Les vibrations sont la version déjà faite.
- **Autres boss** : la mécanique est générique (une entrée dans `src/data/bosses.ts`, et `afterEncounterId` pour enchaîner des duels). Candidats évoqués : Mozgus, Grunbeld (Griffith/Femto est fait). Il faut leurs sprites, leurs points de vie et un checkpoint d'apparition.
- **Supprimer le compte Google** : écarté (Firebase demande une reconnexion récente) ; « Recommencer à zéro » efface déjà les données.

## Décisions de game design (à respecter)

- **Duels** : barre de vie sans échec ni limite de temps (choix de Nathan). Chaque pas fait depuis le checkpoint du duel
  retire un point de vie. Un duel se rejoue à chaque tour de Traque ; les victoires déjà obtenues restent acquises.
- **Joueurs déjà avancés** : si on est déjà au-delà du checkpoint d'un duel au chargement, il est compté gagné sans écran
  de victoire (rattrapage silencieux, comme les succès).
- **Tours** : au deuxième tour, toutes les chroniques sont déjà lues, donc l'écran « Point franchi » ne réapparaît pas.
- **Rappel du soir** : texte sans compteur de pas (il serait faux quand on marche app fermée).
- **Vibrations et rappel** : désactivés par défaut. Rien d'intrusif.
- **Partage** : en image, avec repli sur du texte quand les modules natifs manquent.

## Architecture en bref

- **Données de progression** : `PlayerProgress` (`src/features/progression/types.ts`). `totalSteps` est le total depuis le premier
  jour ; `lapSteps` = `totalSteps - lapStartSteps` est le tour en cours ; `totalDistanceKm` est la distance **du tour**
  (c'est elle qui place Guts et ouvre les checkpoints et les duels).
- **Stores Zustand** (`src/store`) : `usePlayerStore` (progression, tour, records `bestStreak`/`bestDaySteps`, `achievements`,
  `bossVictories`, files `newAchievementIds` et `newBossEvents` vidées par l'interface), `usePedometerStore` (pas du jour et
  historique), `useBrandStore`, `useSettingsStore` (objectif, rappel, vibrations ; réglages de l'appareil, pas de compte),
  `useShareStore`, `useUIStore` (`isCheckpointModalOpen` : la fin de Traque et les événements de boss attendent la fermeture de
  l'écran « Point franchi »), `useAuthStore`.
- **Sauvegarde** : local (AsyncStorage, une clé par compte) à chaque pas ; Firestore `users/{uid}` au plus toutes les 30 s et
  en passant en arrière-plan. Champs : `progression`, `unlockedCheckpoints`, `brandIntensity`, `extras`
  (`bestStreak`, `bestDaySteps`, `achievements`, `bossVictories`). Fusion au démarrage (`savedProgress.ts`) : gagne la sauvegarde
  avec le plus de pas ; checkpoints, succès, victoires et records sont réunis (on ne perd jamais rien, la date la plus ancienne gagne).
- **Duels** : rien n'est stocké sauf les victoires (`"tour/id du duel"` → date). La vie restante se calcule à chaque rendu depuis
  `lapSteps` (`src/features/bosses/duel.ts`) ; changements de forme et victoires sont détectés en comparant l'état avant/après
  chaque mise à jour de pas (`diffDuels`).
- **Logique pure et testée** vs **code lié à l'appareil** : toute la logique de jeu est dans `src/features/*` avec des tests ;
  seuls `pedometer`, `runtime`, `userCloud`, `share/shareImage`, `reminders/reminderScheduler` et `haptics` touchent l'appareil.

## Pour travailler (pièges rencontrés)

- **Branches** : on développe sur une branche, on ouvre une PR vers `main`, la CI doit être verte, puis on fusionne. Après une
  fusion, repartir de `main` à jour (`git fetch origin main && git checkout -B <branche> origin/main`).
- **Build** : le build EAS part du code présent sur la machine : faire `git checkout main && git pull` avant. Profils :
  `preview` (APK autonome, usage quotidien) et `development` (demande le serveur `npx expo start --dev-client --tunnel`).
  Un nouveau build n'est nécessaire que si le natif change (`app.json`, modules natifs, dépendances natives). Dernier
  changement natif : `react-native-view-shot`, `expo-sharing` et la permission `VIBRATE`.
- **Vérifier un écran sans téléphone** : `npx expo start --web`, puis `http://localhost:8081/?devpreview` (données fictives, départ à
  68 km). Les boutons « Outils de développement » de l'Accueil (+500 pas, « Aller à : … ») permettent d'avancer. Chromium est
  installé (`/opt/pw-browsers`) ; Playwright global (`npm root -g`/playwright) avec `executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`.
- **Serveur web de test** : lancer avec `CI=1 EXPO_NO_DEPENDENCY_VALIDATION=1`. En mode CI, Metro **ne recharge pas** : après chaque
  modification, tuer le serveur et le relancer (`--clear`), sinon l'ancien code est servi. Ne jamais utiliser `pkill -f` ni
  `kill $(pgrep -f …)` avec un motif présent dans la commande elle-même (cela tue la session) : filtrer avec
  `ps -eo pid,args | grep "[.]bin/expo"`.
- **Jest** : pas de `import()` dynamique (utiliser `require` dans un `try`) ; les mocks de modules ES ont besoin de `__esModule: true`.
- **Textes** : tout est en français, avec le ton « Berserk » des textes existants. Jours de la semaine et mois écrits en dur (l'Intl de
  Hermes ne garantit pas le français).
- **Non testé sur téléphone** (à confirmer par Nathan) : la Bande à plusieurs comptes réels (après publication des règles Firestore, voir `docs/social.md`), notifications du rappel, vibrations, partage d'image réel, service Android
  avec les tours (la notification affiche la distance du tour), pincement sur la carte (testé avec de vrais événements tactiles
  dans le navigateur, pas sur Android).

## Suite possible

1. Sprites manquants (voir plus haut) ; Puck.
2. Compagnon préféré qui « parle » dans le rappel du soir (après décision de Nathan).
3. Autres boss et d'autres duels de l'histoire.
4. Sons discrets aux grands moments (nouveau build).
5. Rejouabilité : au tour 2, un événement équivalent à « Point franchi » ; difficulté croissante des duels par tour.
