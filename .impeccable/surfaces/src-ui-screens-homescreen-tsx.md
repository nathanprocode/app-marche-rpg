---
version: 1
slug: "src-ui-screens-homescreen-tsx"
primary_target: "src/ui/screens/HomeScreen.tsx"
related_targets: ["src/ui/screens/MapScreen.tsx","src/ui/screens/QuestsScreen.tsx","src/ui/screens/BandScreen.tsx","src/ui/screens/ProfileScreen.tsx","app/login.tsx"]
---

Scope: toute l'app (5 onglets, connexion, écrans en surimpression). Mode : Operate. Plateforme : Android (Material 3 pour la structure).

## Direction contract

THESIS: L'app se lit comme un tome de Berserk : chaque écran est une planche découpée en cases, et la progression se remplit en trame comme une case qu'on encre. Refuse l'arrangement par défaut du podomètre (anneau des pas, cartes arrondies flottantes sur fond sombre).

OWN-WORLD: Papier blanc froid #F3F3F0, encre #111, deux valeurs de trame (#8C8C88, #C8C8C3) en points, un seul rouge #B3121B réservé à la Marque, au danger et au repère « tu es ici ». Gouttières noires de 6 dp entre cases, cadres à angles vifs, une case par écran peut couper son coin en biais. Titres Shippori Mincho B1 (gras), interface Zen Kaku Gothic New. Traits de vitesse pour le mouvement, jamais en décor gratuit. Retour de Nathan (20/10/2026) : une planche surtout blanche trahit le ton ; viser l'équilibre des scènes sombres de Miura : environ la moitié de la surface en cases inversées (fond noir, texte papier, rouge clair #E8414A sur noir), le papier gardé pour ce qui doit se lire dehors (kilométrage, prochain point). Les illustrations (camp, sprites) passent à l'encre noir et blanc avec du rouge, jamais en couleurs.

STORY: Le joueur voit tout de suite où il en est dans le tome (km, arc, tour), ce qui vient (prochaine case et distance restante) et ce qu'il a amassé ; il croit que chaque pas encre l'histoire, et il marche pour révéler la case suivante.

FIRST VIEWPORT: Écran Marche : grande case pleine largeur avec le kilométrage en Mincho ~104 sp, l'arc et le tour en étiquette, une barre encrée et la trame qui remplit la case à proportion des km ; dessous, deux cases : prochain point (titre, km restants) et case du manga (verrouillée en trame ou révélée) ; puis une case pleine largeur : pas du jour, Marque en rouge, 7 jours en carrés pleins, creux ou barrés. Barre de navigation Material à 5 onglets, indicateur encré.

FORM: Trame & Encre (le tome relié de Berserk), n°1 de ma liste ordonnée, présenté comme « choix d'Impeccable » et retenu par Nathan. seed:64a4087f50b50f60

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Raises tenus (des cartes écartées) : état en case fixe pleine/creuse/barrée ; densité assumée des collections ; filets nets et peu de valeurs d'encre ; hiérarchie par l'échelle ; aplats francs (la trame est un motif de points, pas un dégradé).

Décisions ouvertes : sprites pixel art à refaire dans l'esprit encre/trame (consignes à préparer pour Nathan) ; lisibilité en plein soleil à vérifier sur téléphone (fond clair favorable) ; mode sombre éventuel à décider plus tard.
