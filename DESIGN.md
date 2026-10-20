---
name: Marche du Faucon
description: Un podomètre qui se lit comme un tome de Berserk, en cases, trame et encre.
colors:
  paper: "#F3F3F0"
  black: "#111111"
  black-soft: "#4A4A47"
  tone: "#8C8C88"
  tone-light: "#C8C8C3"
  red: "#B3121B"
  paper-soft: "#B9B9B4"
  tone-dark: "#3A3A37"
  red-on-black: "#E8414A"
typography:
  display-xl:
    fontFamily: "Shippori Mincho B1 ExtraBold, serif"
    fontSize: "96px"
    fontWeight: 800
    lineHeight: "100px"
    letterSpacing: "-2px"
  display-l:
    fontFamily: "Shippori Mincho B1 ExtraBold, serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: "48px"
  display-m:
    fontFamily: "Shippori Mincho B1 ExtraBold, serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: "36px"
  display-s:
    fontFamily: "Shippori Mincho B1 ExtraBold, serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: "28px"
  figure:
    fontFamily: "Zen Kaku Gothic New Black, sans-serif"
    fontSize: "36px"
    fontWeight: 900
    lineHeight: "40px"
  body:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-strong:
    fontFamily: "Zen Kaku Gothic New Bold, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: "24px"
  small:
    fontFamily: "Zen Kaku Gothic New, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "Zen Kaku Gothic New Bold, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: "16px"
    letterSpacing: "1px"
rounded:
  none: "0px"
spacing:
  "4": "4px"
  "8": "8px"
  "16": "16px"
  "24": "24px"
  "32": "32px"
  "48": "48px"
  "64": "64px"
  "96": "96px"
  "128": "128px"
  frame: "2px"
  gutter: "6px"
components:
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.black}"
    rounded: "{rounded.none}"
    padding: "{spacing.16}"
  panel-reversed:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "{spacing.16}"
  button-primary:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "56px"
  button-primary-pressed:
    backgroundColor: "{colors.black-soft}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.black}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "56px"
  button-secondary-pressed:
    backgroundColor: "{colors.tone-light}"
    textColor: "{colors.black}"
  button-danger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.red}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "56px"
  button-primary-on-dark:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.black}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "56px"
  button-secondary-on-dark:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "56px"
  choice-row-selected:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "48px"
  choice-row-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.black}"
    rounded: "{rounded.none}"
    height: "48px"
  tab-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.black-soft}"
    typography: "{typography.label}"
  tab-indicator-active:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    width: "56px"
    height: "32px"
  day-cell-held:
    backgroundColor: "{colors.black}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    size: "36px"
---

# Design System: Marche du Faucon

## Overview

**Creative North Star: "Le tome relié" (Trame & Encre)**

L'app se lit comme un tome de Berserk : chaque écran est une planche posée sur une page noire, découpée en cases séparées par une gouttière d'encre. La progression ne s'affiche pas dans des jauges décoratives ; elle se remplit en trame de points, comme une case qu'on encre au fil des pas. Papier blanc froid, encre noire, deux valeurs de trame et un seul rouge : rien d'autre. Les aplats sont francs, les angles vifs, la hiérarchie se fait par l'échelle des lettres et non par la couleur ou l'ombre.

Le tome alterne cases claires et cases inversées, à l'image des scènes sombres de Miura : environ la moitié de la surface d'un écran est en noir (texte papier, rouge clair), le papier étant gardé pour ce qui doit se lire dehors d'un coup d'œil (kilométrage, prochain point). La densité est assumée : les collections et les listes s'empilent en cases serrées plutôt qu'en cartes aérées. Les cases du manga (`assets/panels/`) sont montrées telles quelles, cadrées de papier ; la carte et le camp passent par des dérivés à l'encre noir et blanc, jamais en couleurs.

Le monde refuse l'arrangement par défaut du podomètre : pas d'anneau de pas, pas de cartes arrondies flottant sur un fond sombre, pas de dégradés. Les valeurs sont exprimées en px, à lire comme des dp (et des sp pour le texte) : la cible est Android, en React Native.

**Key Characteristics:**
- Planche noire, cases de papier ou inversées, gouttière de 6 px entre elles.
- Angles vifs partout ; une seule case par écran peut couper son bas en biais.
- Trame de points (motif, jamais dégradé) pour la progression et les cases verrouillées.
- Un seul rouge, réservé à la Marque, au danger et au repère « tu es ici ».
- Titres et grands chiffres en Mincho extra-gras ; toute l'interface en Gothic.
- Lignes de concentration seulement pour les grands moments.

## Colors

Une palette d'encre : papier froid, noir, deux gris de trame et un rouge unique, doublée d'un jeu de valeurs pour les cases inversées.

### Primary
- **Encre** (black): texte, cadres, gouttières, page sous les cases, remplissages des barres et des états tenus. C'est la couleur de structure de tout le système.
- **Papier froid** (paper): fond des cases claires, texte et boutons principaux sur noir, cadre des cases du manga.

### Secondary
- **Rouge de la Marque** (red): sur papier, uniquement la Marque qui saigne, les actions destructrices et le repère vertical « tu es ici » sur la barre de la Traque (contraste 6:1).
- **Rouge sur noir** (red-on-black): la même voix dans les cases inversées (contraste 4,7:1), barre de tête des écrans d'événement, jours manqués barrés, compte de pas restants quand la Marque saigne.

### Neutral
- **Encre délavée** (black-soft): texte secondaire sur papier (8:1), libellés d'onglets inactifs, état pressé du bouton principal.
- **Trame dense** (tone): points de la trame de progression sur papier. Jamais pour du texte.
- **Trame claire** (tone-light): filets secondaires, pistes vides, état pressé des boutons cadrés.
- **Papier gris** (paper-soft): texte secondaire sur noir (9:1).
- **Trame sur noir** (tone-dark): cadre des cases inversées, points de trame sur noir, lignes de concentration, filets dans les écrans noirs.

### Named Rules
**The One Red Rule.** Un seul rouge, et seulement pour la Marque, le danger et « tu es ici ». Sur noir, on prend `red-on-black` ; jamais `red` sur `black`.

**The Half-Dark Rule.** Environ la moitié de la surface d'un écran est en cases inversées. Le papier est réservé à ce qui doit se lire en plein soleil (kilométrage, prochain point, totaux).

**The Tone Is Dots Rule.** La trame est un motif de points (`Screentone`), pas un dégradé ni une transparence. `tone` et `tone-dark` ne portent jamais de texte.

## Typography

**Display Font:** Shippori Mincho B1 ExtraBold (avec serif)
**Body Font:** Zen Kaku Gothic New, en Regular, Bold et Black (avec sans-serif)

**Character:** Le Mincho donne le lettrage du tome, tranchant et littéraire, pour les titres et les grands chiffres du voyage ; le Gothic, sobre et lisible, porte toute l'interface. Les deux polices sont réduites aux caractères latins. Sur Android, chaque graisse est une famille distincte (`fontWeight` est ignoré avec les polices embarquées) : on choisit la graisse par le nom de famille.

### Hierarchy
- **Display XL** (800, 96px, 100px, -2px): le kilométrage de la Traque, une fois par écran Marche.
- **Display L** (800, 40px, 48px): titre d'écran, titre d'un écran d'événement.
- **Display M** (800, 28px, 36px): unités des grands chiffres, totaux.
- **Display S** (800, 22px, 28px): titre de case (prochain point, quête, chronique, compagnon).
- **Figure** (900 Gothic, 36px, 40px): chiffres de l'interface (pas du jour, Marque, km restants).
- **Body / Body Strong** (400 / 700, 16px, 24px): texte courant, libellés de boutons, ligne de voyage.
- **Small** (400, 14px, 20px): légendes et texte secondaire, souvent en `black-soft` ou `paper-soft`.
- **Label** (700, 12px, 16px, 1px): libellés de la barre d'onglets et lettres des jours (espacement remis à 0 dans ces deux usages).

### Named Rules
**The Mincho Speaks Story Rule.** Le Mincho est réservé aux titres et aux chiffres du voyage ; jamais pour un bouton, un libellé ou un paragraphe.

**The Fit-On-One-Line Rule.** Les grands chiffres suivent la taille de police d'Android, plafonnée à ×1,3, et se réduisent pour tenir sur une ligne sans sortir de l'écran. Toutes les hauteurs de ligne sont des multiples de 4.

## Layout

Un écran est une planche : la page est noire et ses enfants sont des cases séparées par la gouttière (`gutter`, 6px), qui sert aussi de marge extérieure. Les cases vont pleine largeur ou se partagent une rangée (deux cases côte à côte, même gouttière). La première case de l'écran Marche est la grande case du kilométrage ; viennent ensuite le prochain point et la case du manga côte à côte, puis la case du jour en noir.

L'espacement suit une grille de 8 (4, 8, 16, 24, 32, 48, 64, 96, 128). L'intérieur d'une case est à 16px. Les cibles tactiles font au moins 48px (boutons d'icône, rangées de choix) et 56px pour les boutons ; elles grandissent avec la taille du texte au lieu de le couper. La barre d'onglets fait 68px plus la zone sûre du bas.

## Elevation & Depth

Le système est plat : aucune ombre, aucune élévation. La profondeur vient de la planche elle-même : cases de papier et cases noires posées sur une page noire, séparées par la gouttière. Une case noire sur la page noire reçoit un cadre `tone-dark` de 2px pour rester lisible comme case. Les écrans d'événement (point franchi, boss) remplacent la planche par une page entièrement noire, ouverte en fondu, avec une barre `red-on-black` de 6px en tête.

### Named Rules
**The Gutter Is The Shadow Rule.** Rien ne flotte : pas d'ombre portée, pas de flou, pas de carte surélevée. Deux cases se séparent par la gouttière, jamais par une ombre.

## Shapes

Angles vifs sans exception (0px) pour les cases, boutons, barres, onglets et indicateurs. Les traits sont des cadres de 2px (`frame`) ; la barre d'onglets porte un filet haut de 3px. Une seule case par écran peut couper son bord bas en biais (24px de haut, remontant vers la droite) : c'est la case héros. Les cases du jour sont des carrés de 36px : pleins (objectif tenu), en pointillés (aujourd'hui en cours), barrés en rouge (manqué), à 40 % d'opacité (inconnu). Les seuls ronds du système sont les points de trame et les points du tracé sur la carte.

## Components

### Buttons
Encrés et carrés, lus d'un coup de pouce.
- **Shape:** angles vifs (0px), cadre de 2px, hauteur minimale de 56px, marges 8px × 16px, libellé en Body Strong centré.
- **Primary:** fond `black`, texte `paper`. Pressé : `black-soft`.
- **Secondary:** fond `paper`, cadre et texte `black`. Pressé : fond `tone-light`.
- **Danger:** fond `paper`, cadre et texte `red`.
- **Text (tertiaire):** sans fond ni cadre, libellé souligné.
- **Sur noir:** les couleurs s'inversent (principal `paper` plein, secondaire cadré de `paper`, danger en `red-on-black`, pressé `tone-light` ou `tone-dark`).
- **Désactivé / chargement:** opacité 0,4 ; un indicateur d'activité remplace le libellé.

### Chips (rangée de choix)
- **Style:** rangée cadrée de 2px en `black`, hauteur 48px, options égales, libellé Label à 14px sans espacement.
- **State:** l'option choisie est en `black` plein, texte `paper` ; les autres restent sur papier. Les onglets des Quêtes suivent la même logique dans l'en-tête noir (case `paper` pour l'onglet ouvert, cadre `tone-dark` pour les autres).

### Cards / Containers (Panel)
- **Corner Style:** angles vifs (0px).
- **Background:** `paper` (case claire) ou `black` (case inversée, cadre `tone-dark` de 2px).
- **Shadow Strategy:** aucune ; voir Elevation & Depth.
- **Border:** aucune sur papier, la gouttière suffit.
- **Internal Padding:** 16px ; désactivé pour une image pleine case.

### Navigation
- **Barre d'onglets Material à 5 onglets** (Marche, Carte, Quêtes, Bande, Profil) sur fond `paper`, filet haut `black` de 3px, libellés en Label. Inactif : icône en contour et `black-soft`. Actif : indicateur encré de 56 × 32px à angles vifs, icône pleine en `paper`, libellé `black`.

### Barre de progression
Cadre de 2px, remplissage plein sans arrondi (8px par défaut, 10px pour la Traque). Remplissage `black` quand la Marque est apaisée ou pour le trajet, `red` quand elle saigne ; sur noir, `paper` ou `red-on-black`. Sur la barre de la Traque, un trait vertical `red` de 4px marque « tu es ici ».

### Trame (Screentone)
Motif de points en SVG qui remplit sa case : sur la case de la Traque, la trame `tone` (pas 4, rayon 1,3) couvre la largeur à proportion des kilomètres ; sur une case verrouillée, trame `tone-dark` sur noir, avec une légende sur un cartouche de papier.

### Lignes de concentration (SpeedLines)
72 traits fins en `tone-dark` qui convergent vers le centre en laissant le sujet libre. Réservées aux grands moments (point franchi), jamais en décor.

### Cases du jour (DayCells)
Sept carrés de 36px espacés de 4px, avec l'initiale du jour en Label. États : plein, pointillés, barré en rouge, estompé. Version inversée sur noir.

## Do's and Don'ts

### Do:
- **Do** poser chaque écran sur une page `black` et y séparer les cases par la gouttière de 6px.
- **Do** garder environ la moitié de la surface en cases inversées, et le papier pour ce qui se lit dehors (kilométrage, prochain point).
- **Do** exprimer la progression par la trame de points ou un remplissage plein, cadré de 2px.
- **Do** réserver le rouge à la Marque, au danger et à « tu es ici », en `red-on-black` sur noir.
- **Do** écrire titres et chiffres du voyage en Mincho, tout le reste en Gothic, en choisissant la graisse par la famille.
- **Do** montrer les cases du manga intactes, cadrées de papier ; passer les autres illustrations à l'encre noir et blanc avec du rouge.
- **Do** garder des cibles de 48px au moins (56px pour les boutons) qui grandissent avec le texte.

### Don't:
- **Don't** arrondir un coin : pas de rayon sur les cases, boutons, barres ou indicateurs.
- **Don't** utiliser d'ombre, de flou ou de dégradé ; la trame est un motif de points, pas un dégradé.
- **Don't** introduire une deuxième teinte d'accent ni des illustrations en couleurs.
- **Don't** couper en biais plus d'une case par écran.
- **Don't** poser de texte en `tone` ou `tone-dark`.
- **Don't** mettre de lignes de concentration en décor : elles marquent un événement.
- **Don't** revenir à l'arrangement du podomètre générique (anneau des pas, cartes arrondies flottantes sur fond sombre).
