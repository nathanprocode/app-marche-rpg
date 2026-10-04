# La Bande (onglet social)

Une bande réunit quelques amis : chacun voit où les autres en sont, dans un onglet « Bande » (classement) et sur la carte
(un point et le nom de l'ami, pas de second Guts).

## Comment ça marche pour les joueurs

- **Créer une bande** : l'app génère un code `FAUCON-XXXXXX` à envoyer aux amis (bouton « Envoyer le code »).
- **Rejoindre** : saisir le code dans l'onglet Bande. Le code accepte les minuscules et se recopie sans l'ambiguïté 0/O, 1/I.
- **Quitter** : « Quitter la bande » supprime sa ligne ; on peut en rejoindre une autre.
- Le nom affiché est celui du compte Google.
- Partagé avec la bande : nom, tour, distance du tour, série, heure de la dernière mise à jour. Rien d'autre.
- « Temps réel » veut dire : la position est publiée à chaque sauvegarde cloud (au plus toutes les 30 s, et quand l'app passe en
  arrière-plan). Un ami qui marche app fermée apparaît avec du retard ; l'onglet affiche « Vu il y a X min ».

## Données (Firestore)

- `groups/{code}` : `ownerId`, `createdAtISO`.
- `groups/{code}/members/{uid}` : `uid`, `displayName`, `lap`, `totalDistanceKm`, `streakDays`, `updatedAtISO`.
- Le code de la bande est gardé sur le téléphone (AsyncStorage, une clé par compte) ; en cas de réinstallation, on ressaisit le code.

## À FAIRE UNE FOIS : publier les règles de sécurité Firebase

Sans cette étape, créer ou rejoindre une bande échoue (« Impossible de joindre la Bande »).

1. Console Firebase → projet `marche-du-faucon` → **Firestore Database** → onglet **Règles**.
2. Regarder les règles actuelles : elles doivent déjà autoriser `users/{uid}` à son propriétaire. Le fichier `firestore.rules`
   reprend cette règle et ajoute celles des bandes : le plus simple est de **remplacer tout** par le contenu de `firestore.rules`.
3. **Publier**. Aucun nouveau build de l'app n'est nécessaire côté règles.

Ce que les règles garantissent : on ne peut ouvrir une bande que si on connaît son code (personne ne peut les lister), seuls les
membres lisent la liste, chacun n'écrit que sa propre ligne, et seuls les six champs ci-dessus sont acceptés.

## Dans le code

- `src/features/social/band.ts` : logique pure testée (code, classement, fraîcheur, lecture sécurisée des données reçues).
- `src/features/social/service.ts` : accès Firestore.
- `src/store/useSocialStore.ts` : état (code, membres), créer / rejoindre / quitter, publication. Lancé dans `app/_layout.tsx`
  une fois la progression chargée ; la publication est appelée par `saveToCloudNow` (`usePlayerStore`).
- `src/ui/screens/BandScreen.tsx`, `src/ui/components/BandMarker.tsx`, onglet `app/(tabs)/band.tsx`.
- Mode test web (`/?devpreview`) : bande fictive `FAUCON-DEVTST` avec Casca, Judeau et Pippin, sans réseau.

## Limites connues

- Pas de plafond de membres (les règles Firestore ne savent pas compter) ; le code secret fait office de barrière.
- Pas d'expulsion : quelqu'un qui a le code peut rejoindre. Si le code fuit, créer une nouvelle bande.
- Non testé sur téléphone, ni à plusieurs comptes réels : à essayer ensemble après publication des règles.
