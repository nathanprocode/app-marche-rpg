# Sprites à l'encre : cahier des charges

Décidé avec Nathan le 21/10/2026 : les sprites passent en **pixel art à l'encre**, produits par **images générées puis retouchées**.
Pourquoi les redessiner : la conversion automatique des sprites en couleurs ne marche pas (Griffith, en armure argentée, disparaît presque en blanc ; Casca devient une tache noire). Elle ne convient qu'aux grandes scènes (`scripts/ink-image.js`, utilisé pour le camp).

## Ce qu'il faut refaire

| Lot | Fichiers | Utilisation à l'écran |
|---|---|---|
| Compagnons (14) | `assets/companions/*.png` | Collection (case de ~80 px), carte (petits marqueurs) |
| Ennemis (11, formes d'apôtre comprises) | `assets/bosses/*.png` | Collection (80 px), fiche (120–180 px), duels |
| Guts sur la carte | `assets/map/guts-walk.png`, `guts-jeune-walk.png` (planches de marche), `guts-marker.png` | Marqueur animé (~48 px) |

Les silhouettes « Inconnu » des collections se déduisent des nouveaux sprites : rien à dessiner.
**Dessins de @CRYBAG** (Bazuso, Mozgus, Grunbeld, Guts jeune) : prêtés avec crédit obligatoire. Ne pas les redessiner ni les modifier sans son accord ; les garder tels quels en attendant.

## Le style

- **Quatre valeurs et un rouge :** encre `#111111`, papier `#F3F3F0`, trame de points dense et trame légère pour les tons moyens, rouge `#B3121B` seulement pour la Marque et le sang.
- **Aucune autre couleur, aucun dégradé, aucune ombre douce.**
- Grandes masses noires (cheveux, capes, armures sombres), reflets en papier, contour noir de 1 pixel, puis un liseré papier de 1 pixel autour de la silhouette pour qu'elle reste lisible sur la carte.
- Lumière venant d'en haut à gauche pour tous.

## Les contraintes

- PNG transparent, **192 px de haut**, personnage entier, pieds sur le bord bas.
- Vue de trois quarts, tourné vers la droite.
- Même taille de pixel et mêmes proportions pour tous (environ 5 têtes de haut, comme les sprites actuels).
- Lisible à 48–80 px à l'écran, dehors.
- Planches de marche de la carte : même nombre d'images et même hauteur que les planches actuelles.

## La consigne de génération

À coller dans le générateur d'images en remplaçant `[PERSONNAGE]`. La consigne est en anglais : les générateurs la suivent mieux.

```
Pixel art game sprite, full body, three-quarter view facing right, standing, [PERSONNAGE].
Black and white manga ink style, dark fantasy, heavy solid blacks.
Strictly 1-bit: pure black (#111111) and off-white paper (#F3F3F0) only,
mid-tones drawn as halftone dot screentone, no grey shading, no gradients, no colour.
Clean 1-pixel black outline. Light from the top left.
Plain flat off-white background, character centered, feet touching the bottom edge.
Low resolution pixel grid, about 64 by 96 pixels, crisp pixels, no anti-aliasing.
```

Exemples pour `[PERSONNAGE]` :
- `a tall swordsman with short spiky black hair, black cloak, iron prosthetic left arm, a huge slab-like greatsword on his back`
- `a slender knight with long wavy white hair, ornate plate armour, a long cape, a sabre at his hip`

Pour chaque personnage, décrire sa silhouette et ses objets tels qu'ils apparaissent dans les fiches (`src/data/companions.ts`, `src/data/enemies.ts`) ; ne rien inventer de l'histoire.

## La retouche (avant d'ajouter une image à l'appli)

1. Garder la meilleure image ; effacer les défauts (mains, armes déformées, pixels isolés).
2. Remplacer le fond par de la transparence.
3. Ramener l'image aux valeurs du style (encre, papier, trame, rouge) et à 192 px de haut ; ajouter le liseré papier.
4. Comparer avec les sprites déjà faits : mêmes proportions, même épaisseur de contour, même densité de trame.

Les étapes 2 et 3 seront automatisées par un script dès qu'une première image générée sera disponible pour le régler.
