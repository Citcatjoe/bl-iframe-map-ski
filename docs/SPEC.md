# Spécification visuelle et comportementale — Carte des domaines skiables (Blick)

> Spécification de design issue du handoff (phase prototype, tour 5). Elle décrit **ce que l'implémentation doit reproduire** ; les décisions et leur historique sont dans [`ETAT-DU-PROJET.md`](../ETAT-DU-PROJET.md), l'organisation du code dans [`README.md`](../README.md).

## Overview
Widget embarqué en iframe sur blick.ch. Une carte de Suisse montre des pastilles météo pour les domaines skiables. Un panneau unique permet de chercher un domaine et d'afficher sa fiche (météo actuelle, 3 jours, lien vers le site officiel).

## About the Design Files
Les fichiers de `reference/` sont des **références de design créées en HTML** : des prototypes qui montrent l'apparence et le comportement voulus, **pas du code de production à copier**. Il faut **les recréer en React + Vite + Tailwind CSS v4** (stack du product.md), avec les tokens du Blick Design System (`base.css`). Les fichiers `.dc.html` ont besoin d'un runtime de prototypage (`support.js`, `_ds/`) qui n'est pas fourni : lis-les comme du code source.

## Fidelity
**Haute fidélité** pour la carte (pastilles, fond, animations) et pour le panneau. Les valeurs ci-dessous sont exactes.

## Vues

### En-tête (toutes largeurs)
- Padding : 12px 16px 11px (mobile : 9px 14px 8px). Bordure basse 1 px `--color-stroke-weak`.
- Ligne 1 : surtitre « WEBCAMS · STATIONS DE SKI » (Inter 700, 11 px, uppercase, letter-spacing 0.04em, `--color-text-brand`) à gauche. À droite, statut météo : pastille de 7 px (vert `--color-success` si OK, rouge si erreur, gris pendant le chargement) + « Dernier relevé : HH:MM » (« Relevé : HH:MM » sur mobile), 11,5 px, 500, `--color-text-weak`. Heure du relevé (`generatedAt`), à l'heure suisse. Relevé d'un autre jour : « Dernier relevé : 5 oct., 14:30 » (mobile : « Relevé : 5 oct. »).
- Ligne 2 : titre « Jette un œil sur ta station » en Blick Variable 700, **26 px** (632 px : 22, mobile : 18), line-height 1,1, une ligne avec ellipsis.

### Pied de page
- 10,5 px, `--color-text-weak`, padding 6px 16px. Une ligne en 964 et 632 px ; **deux lignes en mobile** plutôt que de tronquer un crédit (D49).
- Gauche : « Météo : MétéoSuisse ICON-CH via Open-Meteo (CC BY 4.0) » (632 px et mobile : « Météo : Open-Meteo / MétéoSuisse »).
- Droite (964 px) : « Carte OpenFreeMap © OpenMapTiles © OpenStreetMap · Relief Mapzen · Stations : swisstopo, OpenSkiData ». 632 px et mobile : « Stations : swisstopo, OpenSkiData » ; l'attribution de la carte passe en surimpression en bas à droite de la carte (9,5 px, fond blanc à 80 %) — D43.

### Panneau (liste ↔ fiche)
- 964 px : colonne fixe de 312 px, bordure droite. 632 px : superposé, gauche/haut/bas 12 px, largeur 300, `--radius-lg`, `--shadow-menu`, `translateX(calc(-100% - 24px))` quand il est fermé, transition de 220 ms. Mobile : voir plus bas.
- **Track** : 2 pages côte à côte (largeur 200 %), `transform: translateX(0 | -50%)`, transition `.34s cubic-bezier(.2,.7,.2,1)`.
- **Page liste** :
  - **Recherche** : input de 44 px (mobile : 40), radius pill, fond `--color-fill-weak`, bordure 1 px `--color-stroke-weak`, icône loupe à 14 px du bord, texte 16 px, placeholder « Quelle station veux-tu voir ? ». Au focus : bordure `--color-stroke-strong`, fond `--color-fill-default`.
  - **Compteur et tri** : « N STATIONS » (11 px, 700, uppercase, weak), puis les boutons de tri « Neige 3 j » / « A–Z » (12 px, 700 ; l'actif en `--color-text-default` souligné de 2 px, offset 4).
  - **Ligne** : grid `1fr auto`, padding 14px 16px, bordure basse. Nom en Blick Variable 700, 16 px (rouge brand si sélectionné). Code du canton seul (« GR »), 12 px, 700, letter-spacing 0.04em, weak ; nom complet en infobulle (`<abbr title>`). Survol : fond `--color-fill-weak`.
  - **Liste vide** : « Aucune station trouvée. Essaie un autre nom ou un canton. »
- **Page fiche** :
  - **Barre** de 52 px : bouton « ← Toutes les stations » (14 px, 700, pill, survol fill-weak). En 632 px, une croix à droite.
  - **Contenu**, padding 18px 16px, gap 18 :
    - Canton : 11 px, 700, uppercase, brand.
    - Nom : Blick Variable 700, 28 px.
    - Ligne météo : picto 28 px, température en Blick 40 px, puis description en gras 13 px, « Vent N km/h » et « à N m » (altitude des conditions, D51) en weak.
    - Grille de 3 jours : bordure 1 px, `--radius-md`. Chaque jour : label 11 px uppercase (« Aujourd'hui », « Demain », jour abrégé), picto 16 px, « max / min » en 13 px bold, neige en 12 px weak.
    - Bouton DS `Button` rouge « Voir les webcams » (sm, icône caméra `fa-video` à gauche, icône externe à droite), lien vers la page webcams de la station dans un nouvel onglet, + hôte en 11 px weak (D50).

### Mobile (cible < 400 px ; layout appliqué sous 520 px, hauteur 520 px)
- Colonne : en-tête → carte (flex 1) → zone basse → pied de page.
- **Zone basse réduite** : searchbox de 40 px + `IconButton` liste (grey, sm). Padding 10px 14px. **Pas de liste.**
- **Liste ouverte** (focus sur la recherche ou bouton liste) : panneau en `position:absolute; inset:0` par-dessus le corps, avec un en-tête « Toutes les stations » (Blick 19 px) et une croix.
- **Fiche compacte** au focus : **168 px**, padding 12px 16px, gap 10.
  - Haut : canton (10,5 px) et nom (Blick 20 px), croix à droite.
  - Milieu : picto 20 px, température en Blick 28 px, description, vent et « à N m » en 11,5 px (3 lignes) ; à droite, 3 mini-jours (label 10 px, picto 13 px, neige 11 px).
  - Bas : « Voir les webcams » + hôte.
- Contrôles de carte : seul « Afficher toute la Suisse » reste (pas de +/−).

### Carte
- **Contrôles** en haut à droite (10 px), colonne avec gap 6 : `IconButton` blancs sm, plus, moins, expand.
- **Style** : `https://tiles.openfreemap.org/styles/positron`. Couche hillshade (source Terrarium, tileSize 256, maxzoom 12) insérée sous le premier symbole :
  - shadow `#6A6262`, highlight `#FFFFFF`, accent `#A5A1A1` ;
  - exaggeration 0,3, direction 315.
- **Labels** : `text-field = ['coalesce', ['get','name:fr'], ['get','name']]`. Couches dont l'id contient « country » : masquées.
- **Couches de localités** : `label_city_capital`, `label_city`, `label_town`, `label_village`, `label_other`, `label_state`.
  - filtre `['within', CH]` ;
  - `text-color #A5A1A1`, halo blanc à 90 %, largeur 1,2 ;
  - la couche capitale reprend `text-size` et `text-font` de `label_city`, sans `icon-image`.
- **Trame extérieure** : polygone monde [[-20,30],[40,30],[40,65],[-20,65]] percé du contour CH, `fill #121010`, opacité **0,13**, sous le premier symbole.
- **Vue initiale** : fitBounds `[[5.95,45.82],[10.49,47.81]]`. Padding :
  - 964 px : 40 / 30 / 30 / 60 (haut / bas / gauche / droite) ;
  - 632 px : 56 / 24 / 24 / 56 ;
  - mobile : 24 / 16 / 16 / 50.
- maxBounds `[[4.5,45.2],[11.8,48.4]]`.

### Pastille (image canvas, pixelRatio 2)
- **Avec nom** (2 lignes) : hauteur 38, radius 19 (pill), largeur = max(largeur du nom, 17 + largeur de la température) + 28.
  - Ligne 1, à y 12,5 : nom court en `700 12.5px "Blick Variable"`, `#121010`.
  - Ligne 2, à y 27 : picto Font Awesome 11,5 px (900 solid, ou 400 pour le flocon), coloré selon la météo, puis à +17 px la température en `700 11.5px Inter`, `#504949`.
  - Padding gauche 14.
- **Compacte** (1 ligne) : hauteur 24, largeur 8 + 17 + température + 9.
- **Couleurs des pictos** :
  - soleil et peu nuageux `#E0A800` ;
  - couvert et brouillard `#6A6262` ;
  - neige `#2E7BD6` ;
  - pluie, averses et orage `#121010` ;
  - pas de données `#6A6262`.
- **Fond** : `#FFFFFF` ; survol `#F0EFEF` ; sélection `#E20000`, avec tout le texte et les pictos en blanc. **Aucune bordure.**
- **Ombres** : contact `rgba(18,16,16,.12)` blur 1,5, y 0,5 ; portée `rgba(18,16,16,.20)` blur 20, y 4. Marge du canvas : 16 px.
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
  - `flyTo` : zoom max(actuel, 9,2), ou 9,8 pour une station de niveau 3 ; speed 1,1, curve 1,5. En 632 px, offset [156, 0].
  - Le panneau passe en fiche (en 632 px, il s'ouvre).
- **Retour / fermeture** : `flyTo(cameraForBounds(CH, padding))`, mêmes speed et curve.
- **Recherche** : filtre insensible à la casse sur le nom, le nom du canton et le code exact.
- **Tri « Neige 3 j »** : snow3 décroissant, puis niveau, puis nom.
- **Gestes coopératifs** activés par défaut. Pas de rotation ni de pitch.
- **Robustesse** : init de la carte quand le conteneur a une taille > 0. Handler `webglcontextlost` qui recrée la carte. Attendre le chargement des polices avant de générer les pastilles.

## State Management
- `q`, `sort` ('snow' | 'az'), `sel` (id | null), `hover` (id | null), `panelOpen` (632 px et mobile), `wx` (météo par id), `wxStatus` ('loading' | 'ok' | 'error'), `wxTime`.
- Largeur → mode : `wide` ≥ 860, `mid` ≥ 520, sinon `mobile`.
- Garder la dernière sélection pendant l'animation de retour, pour que la fiche ne se vide pas pendant le glissement.

## Design Tokens (Blick DS)
- Brand : `#E20000` (hover `#A70000`). Texte `#121010`. Weak `#504949` / `#6A6262`. Bordures `#E1E0E0`, `#C8C6C6`. Fills `#FFFFFF`, `#F5F5F5`.
- Polices : **Blick Variable** (display), **Inter Variable** (body). Icônes : Font Awesome 6 Free.
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
