# Spécification visuelle et comportementale — Carte des domaines skiables (Blick)

> Spécification de design issue du handoff (phase prototype, tour 5). Elle décrit **ce que l'implémentation doit reproduire** ; les décisions et leur historique sont dans [`ETAT-DU-PROJET.md`](../ETAT-DU-PROJET.md), l'organisation du code dans [`README.md`](../README.md).

## Overview
Widget embarqué en iframe sur blick.ch. Une carte de Suisse montre des pastilles météo pour les domaines skiables. Un panneau unique permet de chercher un domaine et d'afficher sa fiche (météo actuelle, 3 jours, lien vers le site officiel).

## About the Design Files
Les fichiers de `reference/` sont des **références de design créées en HTML** : des prototypes qui montrent l'apparence et le comportement voulus, **pas du code de production à copier**. Il faut **les recréer en React + Vite + Tailwind CSS v4** (stack du product.md), avec les tokens du Blick Design System (`base.css`). Les fichiers `.dc.html` ont besoin d'un runtime de prototypage (`support.js`, `_ds/`) qui n'est pas fourni : lis-les comme du code source.

## Fidelity
**Haute fidélité** pour la carte (pastilles, fond, animations) et pour le panneau. Les valeurs ci-dessous sont exactes.

## Vues

### En-tête (toutes largeurs, mêmes styles que `bl-iframe-traffic`, 12/11/2026)
- Fond `--color-fill-weak`, padding 10px 12px (petit retrait intérieur : les bords du widget se lisent dans l'article). Une seule ligne, gap 12. Mode explore : filet bas 1 px `--color-stroke-weak`. Mode compact : sans filet.
- À gauche, titre (`h2`), affiché à toutes les largeurs, traité en surtitre dans les deux modes (13/11/2026 ; avant, en explore : Blick Variable 19 px, `--color-text-default`) : Inter **13 px**, 700, line-height 1, uppercase, letter-spacing 0.04em, `--color-text-brand`, tronqué si besoin.
  - mode explore : « Jette un œil sur ta station » ;
  - mode compact : « La météo du week-end en station ».
- À droite, statut météo, **12 px**, 400, `--color-text-weak` : pastille de **8 px** (vert `--color-success` si OK, jaune `--color-yellow-500` si le relevé a plus de 2 h, rouge si erreur, gris pendant le chargement) + « Dernier relevé : HH:MM ». **Étroit** = widget de moins de 480 px (`HEADER_NARROW_MAX`, `src/components/Header.jsx`) : « HH:MM » seul. Heure du relevé (`generatedAt`), à l'heure suisse. Relevé d'un autre jour : « Dernier relevé : 5 oct., 14:30 » (étroit : « 5 oct. »). Relevé de plus de 2 h : « Relevé ancien : 3 nov., 16:19 » (étroit : « Ancien : 3 nov. ») ; l'âge est recalculé chaque minute et le fichier relu tous les quarts d'heure.

### Pied de page
- Style des légendes de `bl-tool-timeline-r` (13/11/2026) : 12 px, line-height 16 px, graisse normale, `--color-text-weak` ; sans fond ni retrait latéral (texte aligné sur les bords du widget), filet haut 1 px `--color-stroke-weak`, padding 6px 0. Une ligne en 964 px ; deux en 632 px ; trois en mobile (quatre à 320 px) plutôt que de tronquer un crédit (D49). Le widget s'allonge d'autant, la carte garde son format 4:3.
- Gauche, dans les deux modes : « Météo : MétéoSuisse · Neige : SLF » ; « MétéoSuisse » lié à son site, « Neige : SLF » en lien souligné vers https://www.slf.ch (nouvel onglet), exigé par le SLF (D59).
- Droite, à toutes les largeurs (05/11/2026) : « Carte OpenFreeMap © OpenMapTiles © OpenStreetMap · Relief Mapzen · Stations : swisstopo, OpenSkiData » ; passe à la ligne sous 964 px plutôt que d'être tronqué. **Plus aucune attribution en surimpression sur la carte.** Mode compact (sans carte) : « Stations : swisstopo, OpenSkiData », sans crédits de carte. Chaque source est un lien vers sa page (OpenStreetMap : page de copyright ; Relief Mapzen : liste officielle des sources du relief) ; les liens de la droite ne sont soulignés qu'au survol (05/11/2026).

### Panneau (liste ↔ fiche)
- 964 et 632 px (12/11/2026 : plus de colonne fixe de 312 px en 964) : superposé à la carte, gauche/haut/bas 12 px, largeur 300, `--radius-lg`, `--shadow-menu`, `translateX(calc(-100% - 24px))` quand il est fermé, transition de 220 ms. Replié par défaut ; ouvert par le bouton « Liste · N » (en haut à gauche de la carte) ou par une station choisie (liste, carte, `?point=`), qui ouvre directement la fiche ; la croix le referme et désélectionne. Mobile : voir plus bas.
- **Couleurs** (`--panel-*`, `src/index.css`) : en clair, fond `--color-fill-default`, survol / ligne choisie `--color-fill-weak`, filets `--color-stroke-weak` ; en sombre, fond `--color-fill-strong` (grey-800, nettement plus clair que la carte), survol / ligne choisie / filets grey-700, pouce de défilement grey-600. Ci-dessous, « fond du survol » et « filet du panneau » désignent ces valeurs.
- **Track** : 2 pages côte à côte (largeur 200 %), `transform: translateX(0 | -50%)`, transition `.34s cubic-bezier(.2,.7,.2,1)`.
- **Page liste** :
  - **Recherche** : input de 44 px (mobile : 40), radius pill, fond du survol du panneau, bordure 1 px `--color-stroke-weak`, icône loupe à 14 px du bord, texte 16 px, placeholder « Quelle station veux-tu voir ? ». Au focus : bordure `--color-stroke-strong`, fond `--color-fill-default`.
  - **Compteur** : « N STATIONS » (11 px, 700, uppercase, weak). Pas de choix de tri (05/11/2026) : la liste est en ordre alphabétique.
  - **Ligne** (05/11/2026, comme une ligne du trafic) : grille `24px | 1fr`, gap 16, padding 16px, filet bas du panneau. À gauche, le picto du temps du moment au village (`WxIcon` à 24 px, ≈ 29 px de haut), centré sur les deux lignes, libellé en infobulle. Ligne 1 : nom en Blick Variable 700, 16 px (rouge brand si sélectionné), tronqué si besoin. Ligne 2, 8 px plus bas : « ❄ **N cm** au sol à N m » (13 px, weak ; même composant que le mode compact, `SnowNowLine`) ; « à N m » ne se coupe jamais. Lignes de 62 px (la ligne de neige tient sur une ligne à 964 et 632 px). Plus de code du canton. Survol et ligne choisie : fond du survol du panneau.
  - **Liste vide** : « Aucune station trouvée. Essaie un autre nom ou un canton. »
- **Page fiche** :
  - **Barre** de 52 px, filet bas du panneau : bouton « ← Toutes les stations » (14 px, 700, pill, survol fond du survol du panneau) ; croix « Fermer le panneau » à droite.
  - **Contenu**, padding 18px 16px, gap 18 :
    - Nom : Blick Variable 700, 28 px.
    - Ligne météo : picto 28 px, température en Blick 40 px, puis description en gras 13 px, « Vent N km/h » et « Au village, à N m » (altitude du point de prévision MétéoSuisse, D61) en weak. Une seule température par station, celle du village (D61).
    - **7 prochains jours** (maquette « Meteo 7 jours », 7b, 05/11/2026 ; remplace la grille de 3 jours) :
      - Titre : filet haut 1 px du panneau, padding 12px 0 10px ; « 7 prochains jours » (Inter 700, 15 px) à gauche, « max / min » (12 px, weak) à droite.
      - Bandeau : grille `repeat(7, minmax(0,1fr))`, sans cadre ni séparateur ni gap. Colonne : flex column centrée, gap 8, padding 10px 0, radius 6.
      - Colonne, de haut en bas : initiale du jour (« A » aujourd'hui, puis L, M, M, J, V, S, D ; Inter 700, 12 px ; nom complet en `aria-label` et `title`) ; picto 20 px ; max (Blick Variable 700, 15 px) et min (Inter 400, 13 px, weak) empilés, gap 3 ; précipitations arrondies en mm, sans unité (Inter 700, 11 px, couleur `drop` `--wx-drop`), case vide à 0 mm mais haute de 11 px.
      - Aujourd'hui : fond du survol du panneau (clair : `--color-fill-weak` ; sombre : grey-700), initiale `--color-text-brand`.
      - Note dessous, 8 px plus bas : « Météo, températures et précipitations » (12 px / 1,4, weak).
      - Largeur (requête de conteneur) : ≥ 400 px utiles, jour à 3 lettres (« Auj. », « Ven ») et « 2 mm ». Les 7 colonnes tiennent toujours dans la largeur, sans défilement : 964 et 632 px, 268 px utiles dans le panneau de 300 px (colonnes de 38 px). Sous 280 px utiles, max en 14 px et min en 12 px, pour que « −12° » tienne (05/11/2026 : le défilement prévu sous 260 px coupait la dernière colonne à 632 px).
      - Données : `days[]` à partir d'aujourd'hui (heure suisse), 7 au plus ; s'il en manque, seuls ceux qui existent, la grille garde 7 colonnes.
    - **Enneigement** : bloc fond du survol du panneau, `--radius-md`, padding 10px 12px, 13 px : titre « ENNEIGEMENT EN ALTITUDE · N M » (11 px, 700, uppercase, weak ; N = altitude de la station SLF) ; deux lignes libellé à gauche, valeur en gras à droite : « Neige au sol » (dernière mesure SLF) et « Neige tombée en 3 jours (estimation) » (« (estimation) » en weak) ; puis « Station X, mesure de HH:MM » en 11,5 px weak. Aucune mention de source dans la fiche (05/11/2026) : les crédits MétéoSuisse et SLF sont dans le pied de page. Sans station SLF à 25 km : titre « ENNEIGEMENT EN ALTITUDE » et « Pas de station de mesure à proximité ». Sens des valeurs : `docs/METEO.md`.
    - Bouton DS `Button` rouge « Voir les webcams » (sm, icône caméra `fa-video` à gauche, icône externe à droite ; fond `--color-fill-brand`, texte et icônes blancs dans les deux thèmes), lien vers la page webcams de la station dans un nouvel onglet, + hôte en 11 px weak (D50).

### Mobile (cible < 400 px ; layout appliqué sous 520 px)
- Carte au format 4:3 de la largeur (13/11/2026 : 270 px à 360 px de large, 240 à 320 ; avant, widget de 393 px de haut et carte de 249 px comme `bl-iframe-traffic`).
- Colonne : en-tête → carte → zone basse → pied de page. Carte + zone basse : hauteur fixe (carte 4:3 + 61 px) ; quand la fiche compacte (168 px) remplace la zone basse, la carte rétrécit d'autant, le widget garde sa hauteur.
- **Fond** (essai du 13/11/2026) : zone basse réduite et liste ouverte sur `--color-fill-weak`, pour les détacher des crédits en dessous (classe `panel-mobile`, `src/index.css`). Dans ce fond : champ de recherche et bouton liste sur `--color-fill-default` ; survol et ligne choisie `--color-fill-strong` ; filets `--color-stroke-weak` ; pouce de défilement grey-700 en sombre.
- **Zone basse réduite** : searchbox de 40 px + `IconButton` liste (grey, sm). Padding 10px 14px. **Pas de liste.**
- **Liste ouverte** (focus sur la recherche ou bouton liste) : panneau en `position:absolute; inset:0` par-dessus le corps. Pas de titre (13/11/2026 ; avant, « Toutes les stations » en Blick 19 px et une croix) : la barre garde sa disposition, recherche + bouton rond gris au bout à droite, la croix « Fermer la liste » à la place du bouton liste ; puis le compteur et la liste.
- **Fiche compacte** au focus : **168 px**, padding 12px 16px, gap 10.
  - Haut : canton (10,5 px) et nom (Blick 20 px), croix à droite.
  - Milieu : picto 20 px, température en Blick 28 px, description, « Village, N m » (infobulle : « Prévision au village, point X ») et « Neige N cm à N m » (altitude de la station SLF ; infobulle : nom de la station) en 11,5 px (3 lignes) ; à droite, 3 mini-jours (label 10 px, picto 13 px, température max 11 px).
  - Bas : « Voir les webcams » + hôte.
- Contrôles de carte : seul « Afficher toute la Suisse » reste (pas de +/−).

### Carte
- **Thème** (12/11/2026, comme `bl-iframe-traffic`) : la carte suit le thème Blick (`#theme=dark` dans l'URL, puis changements de la page parente via `iframeHeightAdjustment.js`, hook `useTheme`). Un changement remplace le style ; fond, relief, trame et pastilles sont reposés aux couleurs du thème. Valeurs : `MAP_THEMES` (`src/config/mapConfig.js`). Ci-dessous : clair / sombre.
- **Contrôles** en haut à droite (10 px), colonne avec gap 6 : `IconButton` sm couleur `map` (fond des pastilles : blanc / grey-800, survol grey-100 / grey-700, ombre `--shadow-control`), plus, moins, expand.
- **Fond avant les tuiles** : `#EEEDEA` / `#1E1A1A` (`--map-bg`).
- **Style** : `https://tiles.openfreemap.org/styles/positron` / `https://tiles.openfreemap.org/styles/dark`. Couche hillshade (source Terrarium, tileSize 256, maxzoom 12) insérée sous le premier symbole :
  - clair : shadow `#6A6262`, highlight `#FFFFFF`, accent `#A5A1A1`, exaggeration 0,3 ;
  - sombre : shadow `#000000`, highlight `#504949`, accent `#1E1A1A`, exaggeration 0,4 ;
  - direction 315.
- **Labels** : `text-field = ['coalesce', ['get','name:fr'], ['get','name']]`. Couches dont l'id contient « country » : masquées. Sombre : noms et sens uniques des routes masqués (`highway_name_motorway`, `highway_name_other`, `road_oneway`, `road_oneway_opposite`), absents de Positron aux zooms du widget.
- **Couches de localités** : clair `label_city_capital`, `label_city`, `label_town`, `label_village`, `label_other`, `label_state` ; sombre `place_city_large`, `place_city`, `place_town`, `place_village`, `place_suburb`, `place_other`, `place_state`.
  - filtre `['within', CH]` ;
  - `text-color` `#A5A1A1` / `#837C7C`, halo `rgba(255,255,255,.9)` / `rgba(18,16,16,.9)`, largeur 1,2 ; casse normale (le style sombre met les localités en capitales) ;
  - la couche capitale (clair) reprend `text-size` et `text-font` de `label_city`, sans `icon-image`.
- **Trame extérieure** : polygone monde [[-20,30],[40,30],[40,65],[-20,65]] percé du contour CH, `#121010` à **13 %** / `#000000` à **35 %**, sous le premier symbole.
- **Vue initiale** : fitBounds `[[5.96,45.82],[10.49,47.81]]` (emprise de `bl-iframe-traffic`). Padding :
  - 964 px : 56 / 30 / 30 / 60 (haut / bas / gauche / droite ; haut à 56 depuis le 12/11/2026, place du bouton « Liste ») ;
  - 632 px : 56 / 24 / 24 / 56 ;
  - mobile : 12 sur les quatre côtés, comme `bl-iframe-traffic` (05/11/2026 ; avant : 24 / 16 / 16 / 50).
- maxBounds `[[4.5,45.2],[11.8,48.4]]`.

### Pastille (image canvas, pixelRatio 2)
- **Espacement sur le dessin** : les marges autour du picto se mesurent sur son dessin (`ink` = début et largeur du dessin dans le carré de 24, `src/lib/weatherIcons.js`), pas sur le carré : un picto étroit (pluie, lune) ne laisse pas de vide. Ci-dessous, « dessin » = largeur du dessin à la taille affichée.
- **Avec nom** (2 lignes ; D63, 05/11/2026, ancien essai `?pill=minmax`) : hauteur 36, radius 18 (pill). Picto météo du moment (`sky`) à gauche, 22 px, centré verticalement sur les deux lignes, dessin à 11 px du bord. Texte à 6 px du dessin (assez pour que le signe moins ne colle pas ; 8,5 jugé trop large), marge droite 12 : largeur = 11 + dessin + 6 + max(nom, températures) + 12.
  - Ligne 1, à y 11,5 : nom court en `700 12.5px "Blick Variable"`, `#121010`.
  - Ligne 2, à y 25,5 : « min / max » du jour au village (`days[0]`) en `700 10.5px Inter`, `#504949`.
- **Compacte** (1 ligne) : hauteur 22 ; picto 16 px, dessin à 6 px du bord, « min / max » à 3 px du dessin (4,5 jusqu'au 05/11/2026), marge droite 9.
- Marges réduites de 2 px essayées le 03/11/2026, rejetées. Réduites de 1 à 2 px le 05/11/2026 (38 → 36 px, compacte 24 → 22, marges 12 / 14 → 11 / 12, compacte 7 / 10 → 6 / 9), température 11,5 → 10,5 px.
- **Pictos météo** (03/11/2026) : 11 dessins originaux livrés dans `src/assets/pictos-meteo/` (SVG `couleur/`, `mono/`, `sombre/` + `LISEZMOI.md`), tracés repris dans `src/lib/weatherIcons.js`. Averses et pluie partagent le picto `rain`. Rendu : SVG en HTML (`WxIcon`, 1,2 em de la taille de police), `Path2D` sur le canvas des pastilles. Couleurs par rôle (clair / sombre) :
  - soleil et éclair `#FFAA00` / `#FFC233` ; lune `#5D6FA3` / `#C7D0E6` ;
  - nuage `#8F8989` / `#C8C6C6` ; nuage chargé (pluie, neige, orage) `#504949` / `#A5A1A1` ;
  - gouttes `#1F74E8` / `#5BA0FF` ; neige `#9ED8F5` / `#D2EEFB` ; pas de données `#A5A1A1` / `#837C7C`.
  - En HTML : variables `--wx-*` (`src/index.css`), qui suivent le thème. Pastilles : palette claire (fond toujours blanc) ; sélection : tracé `mono` en blanc.
- **Pictos en HTML** (`WxIcon`) : 1,2 em de haut, recadrés en largeur sur le dessin ; l'espace avec le texte est celui du `gap` de la mise en page (fiche 12 px, fiche mobile 8 px).

### Vue compacte (`?mode=compact`, « La météo du week-end en station », 05/11/2026)
- Titre de l'en-tête : « La météo du week-end en station », traité en surtitre (13 px, capitales, rouge), à toutes les largeurs.
- Liste : fond `--color-fill-weak`, padding horizontal 12 px (noms alignés sur le titre).
- Ligne : grille `1fr | auto`, gap 16, **hauteur 62 px** en deux colonnes, **56 px** en une (mobile, sous 480 px ; boîtes des jours à 2 px de padding vertical, ≈ 40 px de haut) (`min-height`, filet compris ; padding vertical 5 px au moins), contenu centré ; une ligne de neige sur deux lignes l'agrandit (77 px à 632 px) ; filet 1 px entre les lignes. Lignes non cliquables.
- À droite, à la place du marqueur d'état du trafic : une boîte par jour du week-end (samedi et dimanche ; le dimanche, ce dimanche seul), gap 6 : ≈ 50 × 48 px, bordure 1 px `--color-stroke-weak`, **angles droits**, padding 5 px 6 px, gap 4 ; « SAM. 7 » (10 px, 700, uppercase, sans interlettrage, weak) puis le picto du jour (`WxIcon` à 18 px). Pas de température affichée : libellé du temps et « max / min » en infobulle. Jour absent du fichier : picto « pas de données », infobulle « Pas de prévision ». Plus de picto du moment (il ne répond pas à la question du week-end).
- Ligne 1 : nom de la station, Blick Variable 700, 16 px, line-height 1,2. Ligne 2, 8 px plus bas : flocon `fa-snowflake`, puis « **N cm** au sol à N m » (neige au sol mesurée et altitude de la station SLF, valeur en `--color-text-default`), 13 px, line-height 1,4, `--color-text-weak` ; sans station : « Pas de mesure de neige ». Lignes rognées au cap (`text-box: trim-both cap alphabetic`) comme le trafic. Rien à droite pour l'instant.
- Pied : « N autres stations » (N = toutes les stations du mode explore, 154 ou la sélection `?points=`, moins celles listées ; masqué à 0) et « Voir toute la météo », fond `--color-fill-strong`, padding 9px 16px, 13 px, gap 16 (12 en une colonne). Crédits dessous, comme en explore (sans fond ni retrait latéral).
- **Fond** : `#FFFFFF` / `#3B3535` (en sombre, celui du panneau liste / fiche, `--color-fill-strong` : plus sombre, la pastille se confondait avec la carte) ; survol `#F0EFEF` / `#504949` ; nom `#121010` / `#F5F5F5` ; « min / max » `#504949` / `#C8C6C6` ; pictos en palette claire / sombre (`WX_PALETTES`, mêmes valeurs que les pictos HTML). Sélection `#E20000` dans les deux thèmes, avec tout le texte et les pictos en blanc. **Aucune bordure.**
- **Ombres** : contact `rgba(18,16,16,.12)` blur 1,5, y 0,5 ; portée blur 20, y 4, `rgba(18,16,16,.20)` / `rgba(0,0,0,.55)`. Marge du canvas : 16 px.
- Couche symbol : `icon-allow-overlap` et `icon-ignore-placement` à true. `icon-size = ['get','s']`, `icon-opacity = ['get','o']`, `symbol-sort-key = z` (sélection 3, survol 2, autre 1).

## Interactions et comportement
- **Placement** (JS, à chaque `move` throttlé à 60 ms et à chaque `moveend`) :
  1. Niveau 1 visibles : relaxation en espace écran (80 itérations, poussée sur l'axe du moindre chevauchement ; boîte = taille + 6).
  2. Secondaires dont le zoom ≥ seuil (niveau 2 : 7,6 ; niveau 3 : 8,6 ; +0,6 hors 964 px ; −0,15 si déjà visible), triés par sélection, puis déjà visible, puis niveau, puis id. Chacun est posé seulement s'il ne chevauche rien et s'il est dans la vue (marge 80/40).
  3. Positions écran reconverties en lng/lat.
- **Nom affiché** si largeur 964 ou zoom ≥ 7,4 ; sinon pastille compacte.
- **Fondu** : boucle rAF. o varie de ±dt/200 ms. Ease `1-(1-o)^3`, scale 0,85 + 0,15·k. Délai de 220 ms avant la disparition. Pas de fondu au premier placement.
- **Survol carte** : `queryRenderedFeatures` (tolérance 2 px, 8 px au toucher). Curseur pointer. État hover.
- **Sélection** (clic sur une pastille ou sur une ligne) :
  - `flyTo` : zoom max(actuel, 9,2), ou 9,8 pour une station de niveau 3 ; speed 1,1, curve 1,5. En 964 et 632 px, offset [156, 0] (`PANEL_FLY_OFFSET`), pour que la station ne passe pas sous le panneau.
  - Le panneau passe en fiche (en 964 et 632 px, il s'ouvre).
- **Retour / fermeture** : `flyTo(cameraForBounds(CH, padding))`, mêmes speed et curve.
- **Recherche** : filtre insensible à la casse sur le nom, le nom du canton et le code exact.
- **Ordre de la liste** (mode explore) : alphabétique (05/11/2026). Le mode compact trie encore sur la neige tombée en 3 jours (`snow.hn3`), puis la neige au sol, le niveau et le nom.
- **Gestes coopératifs** activés par défaut. Pas de rotation ni de pitch.
- **Robustesse** : init de la carte quand le conteneur a une taille > 0. Handler `webglcontextlost` qui recrée la carte. Attendre le chargement des polices avant de générer les pastilles.

## State Management
- `q`, `sort` ('snow' | 'az'), `sel` (id | null), `hover` (id | null), `panelOpen` (632 px et mobile), `wx` (météo par id), `wxStatus` ('loading' | 'ok' | 'error'), `wxTime`.
- Largeur → mode : `wide` ≥ 860, `mid` ≥ 520, sinon `mobile`.
- Garder la dernière sélection pendant l'animation de retour, pour que la fiche ne se vide pas pendant le glissement.

## Design Tokens (Blick DS)
- Brand : `#E20000` (hover `#A70000`). Texte `#121010`. Weak `#504949` / `#6A6262`. Bordures `#E1E0E0`, `#C8C6C6`. Fills `#FFFFFF`, `#F5F5F5`.
- Polices : **Blick Variable** (display), **Inter Variable** (body). Icônes d'interface : Font Awesome 6 Free ; pictos météo : jeu propre (`src/assets/pictos-meteo/`).
- Variables CSS utilisées : `--color-text-default/weak/brand`, `--color-fill-default/weak`, `--color-stroke-weak/strong`, `--color-success`, `--radius-pill/md/lg`, `--shadow-menu`, `--font-display`, `--font-body`.
- Composants DS : `Button` (red / black, sm), `IconButton` (white / grey / transparent, sm).

## Assets
- `public/data/ch.geojson` : contour CH simplifié (filtre des localités).
- `public/data/ch-precise.geojson` : contour CH précis (trame).
- **À remplacer par swisstopo swissBOUNDARIES3D en prod.**

## Files
- `reference/SkiMap4.dc.html` : **référence**.
- `reference/SkiMap3.dc.html`, `SkiMap2.dc.html`, `SkiMap.dc.html` : itérations précédentes, pour l'historique.
- `reference/Skigebiete Karte - Recherche.dc.html` : page de synthèse (benchmark, tours, notes).
- `reference/NOTES-API.md` : notes API.
- `reference/PROMPT-CLAUDE-CODE.md` : prompt de reprise du handoff (archivé).
