# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Nathan et quelques proches, tous fans de Berserk. L'app est distribuée en APK (build EAS `preview`), pas sur le Play Store. Ils l'ouvrent au fil de la journée, souvent dehors et en marchant, téléphone à la main, et se retrouvent dans une même Bande.

## Product Purpose

Marche du Faucon est un podomètre gamifié : chaque pas fait avancer Guts sur la Traque, un voyage de 1 000 km à travers l'histoire de Berserk. Le moment le plus important à réussir est **la progression longue** : sentir sur des semaines et des mois le chemin parcouru, la carte qui se remplit, les chroniques qui se débloquent et les collections qui grandissent. L'app réussit si elle donne envie de marcher un peu plus pour voir le prochain chapitre.

**À mettre en avant :** le voyage et la carte d'abord, puis les collections (compagnons, ennemis, succès, skins). Les duels, la Marque et la Bande restent présents, mais au second plan.

## Positioning

Ce n'est pas un compteur de pas avec un habillage : la distance réelle marchée *est* le récit. 1 pas = 0,75 m, et chaque checkpoint, compagnon ou boss correspond à un moment précis de l'histoire de Guts, débloqué au kilomètre près.

## Operating Context

- Usage sur téléphone Android, dehors, souvent en mouvement et d'une main.
- Comptage des pas par capteur et service Android permanent (notification), hors ligne ; pas du jour remis à zéro à minuit.
- Connexion Google ; sauvegarde locale à chaque pas, copie Firestore. Mode test web `/?devpreview` (données fictives) pour vérifier les écrans sans téléphone.
- Usage social léger : une Bande d'amis partage un classement et se voit sur la carte.

## Capabilities and Constraints

Fonctionnalités en place (détail dans `docs/HANDOFF.md`) :
- **Voyage** : 1 000 km, 18 checkpoints répartis en arcs (`src/data/map/berserk-checkpoints.ts`), chroniques avec une case du manga par checkpoint, écran « Point franchi », tours de Traque après 1 000 km.
- **Carte** : chemin parcouru, Guts qui marche (skin Guts jeune avant l'Éclipse, puis Guerrier Noir), compagnons et amis de la Bande sur la carte, zoom au doigt.
- **Marque du Sacrifice et série** : apaisée dès l'objectif du jour (réglable : 1 500 / 3 000 / 5 000 / 8 000 pas), série et meilleure série.
- **Duels de boss** : Bazuso, Zodd (2 duels), l'Éclipse (5 duels enchaînés), Mozgus, Grunbeld. La vie se compte en pas, sans échec ni limite de temps.
- **Collections** : 14 compagnons, ennemis (silhouette tant que non rencontrés), 22 succès, skins de Guts.
- **Autres** : historique sur 7 jours, 30 jours ou tout ; partage en image 4:5 ; rappel du soir et vibrations (désactivés par défaut) ; remise à zéro.
- **Navigation actuelle** : 5 onglets (Marche, Carte, Quêtes, Bande, Profil), plus l'écran de connexion.

Contraintes :
- La logique de jeu (`src/features/`, `src/store/`) est testée et ne change pas avec la refonte. `npm run typecheck` et `npm test` doivent rester verts.
- Les décisions de game design de `docs/HANDOFF.md` sont à respecter. Tout nouveau choix de game design se décide avec Nathan.
- Tout changement natif (`app.json`, module ou dépendance native, nouvelle police embarquée par plugin) exige un nouveau build EAS.
- **Libre de changer :** la navigation, la présentation de la carte (y compris l'image et les positions des checkpoints), les textes des checkpoints (réécriture validée par Nathan) et les sprites.
- **Marque du Sacrifice** : Nathan a délégué la décision de la garder. Recommandation retenue : on la garde, comme rythme quotidien au service du voyage, pas comme pilier concurrent.

## Brand Commitments

- L'univers Berserk est le thème de l'app.
- Les cases du manga (`assets/panels/`, 18 images) restent la récompense des checkpoints.
- Les textes sont en français et s'adressent au joueur en « tu », avec le ton narratif et sombre des textes existants.
- Rien d'intrusif : sons, vibrations et rappels restent optionnels et désactivés par défaut.

## Evidence on Hand

- 18 cases du manga : `assets/panels/` (une par checkpoint).
- Carte : `assets/map/world-map.png`, marqueurs et planches de marche de Guts dans `assets/map/`.
- Sprites en pixel art : `assets/companions/` (14), `assets/bosses/`, `assets/camp/`. La plupart ont été générés par IA ; ceux de Mozgus et Grunbeld (Bazuso a été redessiné le 24/10/2026), ainsi que le skin Guts jeune, viennent de dessins de @CRYBAG (accord pour un usage non commercial, crédit obligatoire tant qu'ils sont utilisés). **Les sprites peuvent être refaits**, à condition de rester cohérents avec l'univers et entre eux. La façon de les produire reste à décider.
- Marque : `assets/brand_mark.svg`.
- Textes : 18 chroniques, fiches des compagnons et des ennemis, 22 succès (`src/data/`).
- Absences : pas de sprite pour Puck ; pas de sons. On n'invente pas de contenu de l'histoire sans validation.

## Product Principles

1. **Le voyage d'abord.** Chaque écran rend visible le chemin parcouru et ce qui vient ensuite.
2. **Les pas sont le récit.** Les chiffres (pas, km) sont toujours reliés à un lieu, un personnage ou un moment de l'histoire.
3. **Ce qu'on accumule se voit.** Les collections sont la mémoire du voyage et doivent donner envie d'être complétées.
4. **La récompense se mérite.** Chronique, compagnon ou ennemi ne se révèle qu'une fois débloqué, et ce moment doit compter.
5. **Lisible en marchant.** L'essentiel se lit en un coup d'œil, dehors, d'une main.

## Accessibility & Inclusion

- Utilisable dehors : lisible en plein soleil, en marchant, d'une main (cibles tactiles larges, actions principales au pouce).
- Contraste WCAG AA minimum ; texte agrandi d'Android supporté sans casser la mise en page.
- Déjà en place, à conserver : animations réduites respectées, libellés TalkBack.
