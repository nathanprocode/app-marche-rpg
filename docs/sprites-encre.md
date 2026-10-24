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
**Dessins de @CRYBAG** (Mozgus, Grunbeld, Guts jeune) : prêtés avec crédit obligatoire. Ne pas les modifier sans son accord.
Décidé avec Nathan le 24/10/2026 : on les remplace par des sprites générés de zéro (Bazuso fait). Quand un dessin est remplacé, retirer son crédit.

## Le style

- **Quatre valeurs et un rouge :** encre `#111111`, papier `#F3F3F0`, trame de points dense et trame légère pour les tons moyens, rouge `#B3121B` seulement pour la Marque et le sang.
- **Aucune autre couleur, aucun dégradé, aucune ombre douce.**
- Grandes masses noires (cheveux, capes, armures sombres), reflets en papier, contour noir de 1 pixel, puis un liseré papier de 1 pixel autour de la silhouette pour qu'elle reste lisible sur la carte.
- Lumière venant d'en haut à gauche pour tous.

## Les contraintes

- PNG transparent, **192 px de haut**, personnage entier, pieds sur le bord bas.
- Vue de trois quarts, tourné vers la droite.
- Même taille de pixel et mêmes proportions pour tous (environ 7 têtes de haut, comme le Guts de référence).
- Lisible à 48–80 px à l'écran, dehors.
- Planches de marche de la carte : même nombre d'images et même hauteur que les planches actuelles.

## La consigne de génération

**Générateur retenu : ChatGPT** (comparé à Gemini et Grok le 21/10/2026 : c'est lui qui rend le mieux l'encre de Miura).
Méthode : tous les personnages dans **la même conversation**, et **l'image de Guts jointe comme référence** à chaque fois
(`docs/sprites-reference/guts.webp`, l'original généré).

Première image (Guts) : la consigne ci-dessous, en remplaçant `[PERSONNAGE]`. La consigne est en anglais : les générateurs la suivent mieux.

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

Personnages suivants, avec l'image de Guts jointe :

```
Use the attached Guts image as the style reference.
Same style, same proportions, same pixel size, same line thickness and same halftone screentone as the reference.
Same framing: full body, three-quarter view facing right, standing, feet touching the bottom edge, plain flat off-white background.

New character: [PERSONNAGE].

Strictly 1-bit: pure black (#111111) and off-white paper (#F3F3F0) only, mid-tones as halftone dot screentone, no grey shading, no gradients, no colour.
```

Personnage clair (cheveux ou armure blancs, comme Griffith) : ajouter avant la dernière ligne
`His hair and armour are white: keep them as off-white paper with crisp black outlines, and put the weight in solid black shadows (inside of the cape, armour joints, shadow side of the hair and body) so he has as much solid black as the reference.`
Grand monstre : ajouter `He fills the whole height of the image.`
Si le style dérive : relancer, ou répondre `Closer to the reference image: more solid black, same screentone.`

Pour chaque personnage, décrire sa silhouette et ses objets tels qu'ils apparaissent dans les fiches (`src/data/companions.ts`, `src/data/enemies.ts`) ; ne rien inventer de l'histoire.

### Les boss : une pose d'adversaire

Décidé avec Nathan le 24/10/2026 (validé sur Bazuso) : les boss ne se tiennent pas comme les compagnons, pour qu'on
reconnaisse un ennemi au premier coup d'œil.

| | Compagnons | Boss |
|---|---|---|
| Direction | Tournés vers la droite | Tournés vers la **gauche**, face à Guts |
| Angle | À hauteur d'yeux | **Légère** contre-plongée (trop forte, les pieds sortent et la tête devient minuscule) |
| Jambes | Debout, posé | Pieds bien écartés, ancré au sol |
| Arme | Au repos | Prête à frapper |

- **Toujours joindre une case du manga** comme référence du personnage, en plus de Guts pour le style, et décrire son
  vrai design. Sans elle, le générateur invente un chevalier noir générique (premier essai de Bazuso).
- Armure claire (Bazuso, Grunbeld…) : la garder claire et mettre le noir dans les ombres, comme pour Griffith.
- Le personnage reste entier, du casque aux pieds, pour être lisible à 80 px.

Consigne (deux images jointes : Guts puis la case du manga) :

```
Two attached images: the first (Guts) is the STYLE reference, the second (manga panel) is the CHARACTER reference.
Draw the character from the manga panel, [NOM], faithful to his design, in the exact style of the Guts image:
same pixel size, same line thickness, same halftone screentone.

His design, as in the manga panel: [DESCRIPTION DU DESIGN].

This character is a BOSS: full body, three-quarter view facing LEFT, seen from a slightly low angle so he looks massive,
feet planted wide apart, the whole body visible from head to feet, feet touching the bottom edge,
[ARME, prête à frapper]. Plain flat off-white background. He fills the whole height of the image.

Strictly 1-bit: pure black (#111111) and off-white paper (#F3F3F0) only, mid-tones as halftone dot screentone, no grey shading, no gradients, no colour.
```

Rien dans l'appli ne retourne les images : un boss généré tourné vers la droite doit être retourné avant la mise au format.

## La mise au format (avant d'ajouter une image à l'appli)

1. Garder la meilleure image ; vérifier les défauts (mains, armes déformées).
2. Si l'image est en `.webp` (ChatGPT), la convertir :
   `powershell -ExecutionPolicy Bypass -File scripts/webp-to-png.ps1 casca.webp casca.png`
3. La mettre au format : `node scripts/ink-sprite.js casca.png assets/companions/casca.png`
   Le script retire le fond, recadre, réduit à 192 px, ramène l'image à l'encre, la trame dense, la trame légère et le
   papier, puis ajoute le contour noir et le liseré papier (lisible sur la carte de nuit).
4. Comparer avec les sprites déjà faits : mêmes proportions, même épaisseur de contour, même densité de trame.

Faits : Casca et Griffith (21/10/2026), Bazuso (24/10/2026, pupilles ajoutées à la main après la mise au format). Le Guts généré servira aux planches de marche de la carte, qui demandent plusieurs
images (une par pas) : à faire à part.
