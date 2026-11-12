# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versions : `0.x` = prototype / pré-production.

## [Non publié]
### Ajouté
- **154 stations réelles sur la carte** (`src/data/resorts.json`) : liste skiinfo.fr sans doublons, coordonnées / canton / commune / altitude issues de swisstopo, domaine skiable (km de pistes, remontées, altitudes, site officiel) issu d'OpenSkiData. Script `npm run resorts` et choix consignés dans `data/sources/stations-mapping.json`.
- Liste brute des stations suisses capturée depuis skiinfo.fr : `data/sources/skiinfo-suisse.json` (156 stations), script `npm run skiinfo`.
- Niveaux 2 et 3 calculés (domaine ≥ 50 km de pistes = niveau 2), provisoires.
- Crédit « Stations : swisstopo, OpenSkiData » dans le pied de page.
- Attribution de la carte en surimpression en bas à droite sous 964 px.
- **Bouton « Voir les webcams »** (icône caméra) dans la fiche et la fiche compacte mobile, vers la page webcams de chaque station : 154 pages trouvées et vérifiées (118 officielles, 36 d'agrégateur à remplacer ; une page peut être partagée par plusieurs stations d'un même domaine ou d'une même destination, règle D55 vérifiée par `npm run resorts`), consignées dans `data/sources/stations-mapping.json`.
- **Conditions en altitude** : chaque station a un point en haut du domaine (gare d'arrivée la plus haute de ses remontées, OpenSkiData + altitude swisstopo) ; la météo est calculée à ce point et à cette altitude, et la fiche affiche « à 3 828 m ».
- `src/data/stations-niveau-1.json` : sélection des stations de niveau 1, modifiable sans relancer de script.
- **Relevé météo en production sur le VPS pegasus** (D57) : timer systemd horaire (`deploy/bl-iframe-map-ski.timer` + `.service`), fichier servi par Caddy sur `https://ski.citcatlab.ch/weather.json` (`deploy/bl-iframe-map-ski.caddy`), mise en ligne par `deploy/deploy.sh`. En service depuis le 2026-11-02.
- `.env.production` : le widget compilé lit la météo du VPS ; `npm run dev:vps` (`.env.vps`) fait de même en développement.
- `LICENCES.md` : aide-mémoire des API, données et ressources utilisées, de ce que leurs licences autorisent (usage commercial, attributions) et des alternatives.
- **Paramètres d'URL** sur le modèle de `bl-iframe-traffic` (README § Paramètres d'URL, D58) : `?mode=compact` (vue compacte sans carte, 6 stations, « Tout voir » vers `?seeAllUrl=`), `?points=` (stations suivies, dans les deux modes ; colonnes du compact séparées par `|`), `?point=` (fiche ouverte d'emblée). Design des vues encore à faire.
- Relevé météo plus robuste face aux 503 d'Open-Meteo (« The service is overloaded », panne du 2026-11-02) : 4 essais par requête dans `scripts/fetch-weather.mjs` (5xx, 429, réseau, délai de 20 s), relance systemd toutes les 10 min, alerte seulement après ≈ 40 min de panne ; `deploy/deploy.sh` ne s'arrête plus si la source est en panne et qu'un `weather.json` est déjà servi.
- `docs/VPS.md` : mémoire du relevé météo sur le VPS pegasus (besoin, fichiers installés, déploiement, pannes de la source, vérifications, historique). La documentation générale du serveur passe dans brain (`homelab/machines/pegasus/`) ; README § Production réduit à un renvoi.
- `LICENCES.md` : MET Norway (Locationforecast 2.0, CC BY 4.0, usage commercial autorisé, correction d'altitude) ajouté aux sources météo possibles pour la production.
- **Météo de production : MétéoSuisse + SLF** (D59), à la place de l'API publique d'Open-Meteo (non commerciale). Prévision MétéoSuisse (open data) au point de prévision le plus proche du haut de chaque station, nommé dans la fiche (« Prévision MétéoSuisse, point … ») ; enneigement mesuré par le SLF (stations IMIS) : hauteur de neige et neige fraîche des 3 derniers jours. `scripts/fetch-weather.mjs` réécrit (CSV lus en flux, pictogrammes MétéoSuisse traduits en familles), nouveau format de `weather.json` (`sky`, `point`, `days[].precip`, `snow`). Fiche : bloc « Enneigement » (mesure SLF, station, altitude), précipitations par jour à la place de la neige prévue ; fiche compacte mobile : hauteur de neige ; vue compacte : hauteur de neige ; tri « Neige 3 j » sur la neige fraîche mesurée. Pied de page « Météo : MétéoSuisse · Neige : SLF » (lien vers slf.ch). En service sur le VPS depuis le 2026-11-03.
- Relevé météo à hh:15 au lieu de hh:05, pour prendre la prévision MétéoSuisse de l'heure (publiée et listée vers hh:05–hh:10) ; garde-fou dans `scripts/fetch-weather.mjs` : pas de publication de `weather.json` si les données sont incomplètes (plus de 10 % des stations sans température, ciel ou jours ; moins de la moitié avec enneigement).
- Enneigement : « Neige au sol » (dernière mesure du capteur SLF, toutes les 30 min, au lieu de la valeur de minuit ; heure de la mesure affichée) et « Neige tombée en 3 jours (estimation) » (modèle du SLF) au lieu de « de neige · de neige fraîche », qui semblaient se contredire (Moléson : 0 cm au sol, 9 cm tombés). Nouveau champ `snow.hsAt`. Fiche compacte mobile : « Neige au sol ».
- `docs/METEO.md` : comment marchent la météo et l'enneigement (sources, relevé, choix des points, sens de chaque valeur affichée, format de `weather.json`, fraîcheur, vérification, évolutions), tenu à jour à chaque changement (règle n° 6 d'`ETAT-DU-PROJET.md`).
- `deploy/deploy.sh` : `systemctl reset-failed` avant le relevé du déploiement ; plusieurs déploiements en moins d'une heure atteignaient la limite de démarrages (`start-limit-hit`) et bloquaient le relevé suivant.
- Documentation : afficher les images de webcams dans le widget, étudié (fournisseurs des 154 stations, conditions Roundshot, Feratel, Windy) et mis de côté, le lien « Voir les webcams » reste (D60, `LICENCES.md`).
- Pages webcams : Ibergeregg et Thyon passent de leur page d'été à leur page d'hiver (Thyon : plus de caméras) ; La Tzoumaz et Wiriehorn prennent leur nouvelle adresse (l'ancienne redirigeait). Les 154 liens vérifiés le 03/11/2026 : tous répondent.
- Pictos de nuit : un ciel dégagé ou peu nuageux affiche une lune (« Ciel dégagé », « Peu nuageux ») au lieu du soleil, d'après le code de nuit de MétéoSuisse ; nouvelles valeurs `clear-night` et `partly-night` de `sky`. De jour, « Peu nuageux » devient « En partie ensoleillé ».
- **Météo du village** (D61) : la prévision MétéoSuisse est prise au point le plus proche du village (ou de la gare de départ) de chaque station, plus en haut des pistes, partout dans le widget. Zermatt : 4° au village au lieu de −12° au Klein Matterhorn. L'enneigement reste mesuré à la station SLF la plus proche du haut du domaine.
- Libellés de lieu : la température dit « Au village, à 1 610 m » (fiche) / « Village, 1 610 m » (fiche mobile) ; l'enneigement devient « Enneigement en altitude · 2 953 m » (altitude exacte de la station SLF) et, en mobile, « Neige 7 cm à 2 953 m ». Vue compacte : altitude et station en infobulle.
- **Nouveaux pictos météo** : 11 dessins propres (`src/assets/pictos-meteo/`, tracés dans `src/lib/weatherIcons.js`) à la place de Font Awesome, en couleur par rôle (nuage gris, soleil jaune, gouttes bleues…), clair et sombre, blancs sur la pastille sélectionnée. SVG dans la fiche, la liste et la vue compacte ; dessinés sur le canvas des pastilles. Averses et pluie partagent le même picto.
- Pastilles plus petites : température en 10,5 px au lieu de 11,5 ; hauteur 36 px au lieu de 38 (compacte 22 au lieu de 24), marges de 1 à 2 px plus étroites ; pastille compacte (mobile) : 3 px entre le picto et la température au lieu de 4,5.
- Vue d'ensemble de la carte en mobile : mêmes réglages que `bl-iframe-traffic` (marge de 12 px sur les quatre côtés au lieu de 24 / 16 / 16 / 50 ; emprise `[[5.96,45.82],[10.49,47.81]]`).
- Mobile, mode explore : iframe de 393 px de haut au lieu de 520, pour une carte de 249 px comme celle de `bl-iframe-traffic` (142 px quand la fiche compacte est ouverte).
- Mode compact en une colonne (mobile, sous 480 px) : lignes de 56 px au lieu de 62, boîtes des jours resserrées (≈ 40 px au lieu de 46).
- Crédits du pied de page revus : chaque source est un lien vers sa page (MétéoSuisse, SLF, OpenFreeMap, OpenMapTiles, page de copyright d'OpenStreetMap, liste officielle des sources du relief Mapzen, swisstopo, OpenSkiData) ; mode compact sans crédits de carte (inchangé). `MAP_ATTRIBUTION` devient `MAP_CREDITS`.
- Stations de niveau 1 : ajout d'Airolo (Tessin) et des Bugnenets-Savagnières (Jura neuchâtelois), les plus grands domaines de ces régions dans nos données (21 et 16 km de pistes) ; 12 stations toujours visibles au lieu de 10.
- Listes (explore et compact) : « 0 cm au sol · 1 780 m » devient « 0 cm au sol à 1 780 m ». Fiche du panneau : plus de surtitre du canton (« BERNE · BE ») au-dessus du nom ; la fiche mobile le garde.
- Liste du mode explore : les jambages et les accents des noms (p de Belalp) étaient coupés par la troncature (`truncate` sur une boîte rognée au cap et à la ligne de base) ; marge interne compensée.
- Listes (mode explore et mode compact) : « au sol actuellement » devient « au sol », pour que la ligne de neige tienne sur une ligne ; sans station SLF proche, « Pas de mesure de neige » (au lieu de « … à proximité »).
- Mode explore, liste : chaque ligne montre les conditions du moment, comme une ligne du trafic : picto du temps au village à gauche, nom, puis « ❄ N cm au sol actuellement · N m » (composant `SnowNowLine`, partagé avec le mode compact).
- Mode explore, liste : ordre alphabétique, boutons de tri « Neige 3 j » / « A–Z » retirés (le compteur « N stations » reste) ; plus de code du canton en bout de ligne.
- Attribution de la carte retirée de la surimpression (632 px et mobile) : elle est dans le pied de page à toutes les largeurs, qui passe à la ligne si besoin.
- Fiche, 7 prochains jours à 632 px : plus de défilement horizontal (la 7e colonne était coupée) ; les 7 colonnes tiennent dans le panneau, températures un cran plus petites sous 280 px utiles.
- Fiche, 7 prochains jours : la note sous le bandeau devient « Météo, températures et précipitations ».
- **Fiche : 7 prochains jours** (maquette 7b) à la place de la grille de 3 jours : bandeau sans cadre, une colonne par jour (initiale, picto, max, min, mm arrondis), aujourd'hui surligné ; jours à 3 lettres au-dessus de 400 px utiles, défilement sous 260 px. `fmtPrecip` supprimé.
- **Pastilles de la carte** (D63) : picto à gauche (22 px, 16 px en pastille compacte), centré sur les deux lignes ; nom, puis « min / max » du jour au village à la place de la température du moment. Ancien essai `?pill=minmax`, devenu la pastille par défaut ; le paramètre est supprimé.
- Mode compact : le lien du pied « Tout voir » devient « Voir toute la météo ».
- Mode compact : « N autres stations » compte toutes les stations du mode explore (154, ou la sélection `?points=`) moins celles listées, et non plus les seules stations de niveau 1 non listées (« 148 autres stations » au lieu de « 4 »).
- Mode compact : jours du week-end en boîtes à angles droits (« SAM. 7 » en 10 px sans interlettrage, + picto), sans les températures (passées en infobulle) ; lignes de 62 px de haut à toutes les largeurs (au lieu de 88 à 964 px et 82 en mobile).
- **Mode compact « week-end »** (D62) : titre « La météo du week-end en station » ; par station, samedi et dimanche (picto du jour, max / min ; le dimanche, ce dimanche seul) à la place du picto du moment ; neige « au sol actuellement ». Le relevé publie 7 jours de prévision (fiche inchangée à 3 jours) ; garde-fou étendu aux jours jusqu'au prochain dimanche.
- Fiche : plus de mention de source dans le panneau (« Prévision MétéoSuisse, point … » retiré ; « Station SLF X » devient « Station X ») ; les crédits MétéoSuisse et SLF restent dans le pied de page.
- Vue compacte alignée sur `bl-iframe-traffic` : picto météo à la place de la pastille d'état, nom de la station, puis « ❄ N cm au sol · N m » (neige au sol mesurée et altitude de la station SLF) ; température et canton retirés, rien en bout de ligne pour l'instant.
- En-tête aligné sur `bl-iframe-traffic` (mêmes styles dans les deux modes et à toutes les largeurs) : surtitre 13 px, titre 28 px (line-height 1,15, équilibré), statut 12 px avec pastille de 8 px ; sous 480 px, titre masqué et heure seule ; filet bas en mode explore seulement.
- En-tête : un relevé de plus de 2 h s'affiche « Relevé ancien : 3 nov., 16:19 » avec un point jaune (le point restait vert quel que soit l'âge du fichier) ; le widget relit `weather.json` tous les quarts d'heure, et garde les données affichées si une relecture échoue.
- `npm run dev` lit la météo du VPS (`.env.development`, ancien `.env.vps`) ; `npm run dev:local` (`.env.localcopy`) lit la copie locale produite par `npm run weather`. `npm run dev:vps` supprimé. La copie locale, qui ne se met pas à jour seule, avait fait afficher des données de l'avant-veille.
### Modifié
- Bouton rouge « Voir les webcams » : texte et icônes blancs aussi en thème sombre (ils passaient en noir avec `--color-text-inverse`).
- **Carte en thème sombre** (`#theme=dark`, puis changements de thème de la page parente), comme `bl-iframe-traffic` : fond OpenFreeMap Dark, relief, localités et trame hors de Suisse retouchés, pastilles du gris du panneau liste / fiche (`#3B3535`, survol `#504949`) avec les pictos en palette sombre, boutons de la carte assortis aux pastilles. Avant, la carte et les pastilles restaient claires. Variables `VITE_MAP_STYLE_LIGHT` / `VITE_MAP_STYLE_DARK` (au lieu de `VITE_MAP_STYLE_URL`).
- **En-tête, crédits et mode compact repris de `bl-iframe-traffic`** : en-tête et crédits sur fond `--color-fill-weak` avec un retrait intérieur de 12 px (les bords du widget se lisent dans l'article) ; en-tête sur une ligne, titre à gauche et état du relevé à droite, à toutes les largeurs ; surtitre « Webcams · Stations de ski » supprimé. Titre du mode explore en Blick 19 px ; titre du mode compact traité en surtitre (13 px, capitales, rouge). Mode compact : liste sur `--color-fill-weak` avec le même retrait, pied « Voir toute la météo » sur `--color-fill-strong`.
- **Panneau liste / fiche plus clair en sombre** : fond `--color-fill-strong` (au lieu de `fill-default`, confondu avec la carte), survol, ligne choisie, recherche, bloc enneigement et jour courant en `grey-700`, filets en `grey-700`, pouce de défilement en `grey-600` (variables `--panel-*` de `src/index.css`). Rien ne change en clair. Les boutons ronds `IconButton` gris et transparents prennent ces fonds (y compris la croix de la fiche mobile, un peu plus marquée en sombre).
- **964 px comme 632 px** : plus de panneau fixe de 312 px ; carte pleine largeur, panneau superposé replié par défaut, ouvert par « Liste · N » ou par une station choisie (liste, carte, `?point=`), fermé par la croix. Le vol vers une station est décalé hors du panneau (`PANEL_FLY_OFFSET`) ; marge haute de la vue Suisse à 56 px pour le bouton « Liste ».
- Barres de défilement discrètes (liste des stations, fiche) : fines, piste transparente, pouce gris du thème Blick (clair/sombre), plus marqué au survol. `::-webkit-scrollbar` sans condition (Chrome, Edge, Safari, Opera, Samsung Internet) ; `scrollbar-width` / `scrollbar-color` seulement sous `@supports not selector(::-webkit-scrollbar)` (Firefox), car Chrome ≥ 121 et Safari ≥ 18.2 ignorent les pseudo-éléments dès que `scrollbar-width` est posé (`src/index.css`).
- **Fondu dans l'article** (D62) : ni cadre, ni marge en haut ou sur les côtés pour l'en-tête, la liste compacte et les crédits ; le pied grisé et le contenu du panneau gardent leurs marges. Hauteurs fixes inchangées, la place gagnée sur l'en-tête revient à la carte.
- En-tête : « Dernier relevé : HH:MM » (mobile « Relevé : HH:MM ») au lieu de « Météo en direct · HH:MM ». L'heure est celle du relevé (`generatedAt`) et non plus l'heure de validité d'Open-Meteo (`observedAt`) ; un relevé d'un autre jour affiche sa date (« 5 oct., 14:30 », mobile « 5 oct. »).
- Widget plafonné à 964 px de large et centré au-delà (largeur max de l'embed).
- « Stations de niveau 1 » : le champ `tier` devient `level` ; 10 stations de niveau 1 validées (Zermatt, Verbier, Villars - Gryon, Gstaad, Grindelwald - Wengen, Engelberg, Laax, Davos Klosters, St. Moritz, Flumserberg - Heidiland).
- Attributions complètes : « OpenFreeMap © OpenMapTiles © OpenStreetMap · Relief Mapzen » (au lieu de « © OpenStreetMap »). Crédit météo court : « Météo : Open-Meteo / MétéoSuisse ».
- Le bouton « Site officiel » est remplacé par « Voir les webcams » ; le site officiel reste dans les données (champ `url` renommé `website`).
- `level` dans `resorts.json` ne vaut plus que 2 ou 3 ; le niveau 1 vient de `stations-niveau-1.json`.
- Pied de page sur deux lignes en mobile au lieu de tronquer les crédits.
- Pages webcams partagées : règle documentée (D55), champ `webcamsGroup` (12 groupes, 31 stations) et contrôle de cohérence dans `npm run resorts`. Corrections en appliquant la règle : Corvatsch, Saanenmöser, Mürren - Schilthorn, Gurnigelbad, Schwarzenbühl - Selital, Mythenregion.
- **Textes recentrés sur les webcams** : surtitre « Webcams · Stations de ski » (au lieu de « Hiver · Domaines skiables »), titre « Jette un œil sur ta station » (au lieu de « Où trouver le plus de neige fraîche ? »), recherche « Quelle station veux-tu voir ? », titre de page « Blick · Webcams des stations de ski ». L'interface dit « station » partout au lieu de « domaine » (compteur, « Toutes les stations », liste vide).
- Liste des stations : le canton n'affiche plus que son code (« GR » au lieu de « Grisons · GR ») ; le nom complet reste en infobulle.
- Documentation : projet recentré sur les webcams (D50–D55) ; trois largeurs d'embed précisées ; fournisseur de carte retenu (D39), auto-hébergement des tuiles laissé ouvert ; solutions météo gratuites et avis (§ 4.4), charge en production (§ 4.5), fonctionnement d'Open-Meteo auto-hébergé (§ 4.6) ; décisions D44–D49 sur le dataset. Règle D55 validée ; Open-Meteo auto-hébergé utilisable par Blick (D56) ; candidats météo restants (§ 4.7).
- Documentation : OpenWeather revérifié (licence ODbL, usage commercial autorisé avec attribution visible, formule gratuite à 1 000 000 appels/mois) et remis parmi les candidats météo de production (§ 4.2, 4.3, 4.4, 4.7).
### Corrigé
- Mobile, mode explore : fermer la fiche d'une station ramène la carte au cadrage de départ (le zoom tombait à 5,2 au lieu de 5,7, centre décalé) ; le cadrage se calculait sur la hauteur de carte d'avant la fermeture (142 px au lieu de 249). À l'ouverture, la station est aussi centrée dans la carte réduite et n'est plus à moitié cachée par la fiche.
### Supprimé
- Doublons « Gstaad - Saanen - Rougemont » et « Engadin St. Moritz ».
- Échantillon de 16 domaines (`resorts.sample.json`), mode `?density=stress` et mention « Données d'exemple ».

## [0.6.0] — 2026-10-05 · Implémentation React + Vite + Tailwind v4
### Ajouté
- Widget complet d'après la référence `SkiMap4.dc.html` : en-tête avec statut météo, carte, panneau liste ↔ fiche, pied de page, aux trois largeurs (964 / 632 / mobile 520 px de haut).
- Carte MapLibre GL 5 (Positron, relief ombré, labels FR, pays et localités étrangères masqués, trame hors Suisse) ; pastilles canvas avec placement JS (relaxation des tier 1, révélation des secondaires au zoom), fondus et hystérésis.
- Moteur configurable : `VITE_MAP_ENGINE=mapbox` charge Mapbox GL 3 (style et token via `.env`), sinon MapLibre. Le moteur inutilisé n'est pas téléchargé.
- Script `npm run weather` (`scripts/fetch-weather.mjs`) qui produit `public/data/weather.json` depuis Open-Meteo, prévu pour un cron horaire. Point météo surchargeable par domaine (`weatherPoint`).
- `src/data/resorts.sample.json` : les 16 domaines d'exemple, marqués `"placeholder": true` ; un futur `resorts.json` les remplace automatiquement.
- Mode `?density=stress` (224 points test) pour éprouver le placement.
- Table des 26 cantons en français ; recherche par nom, canton ou code.
- Textes des gestes coopératifs en français.
- `README.md` (démarrage, configuration, architecture) et `docs/SPEC.md` (spécification visuelle du handoff).
### Modifié
- Météo lue depuis `weather.json` uniquement : plus d'appel Open-Meteo par lecteur.
- Carte créée à l'approche de l'écran et conservée ensuite (le prototype la détruisait hors champ).
- « Site officiel » est un lien ; « 1 domaine » au singulier.
- Documentation réorganisée : spécification du handoff déplacée dans `docs/SPEC.md`, prompt de reprise archivé dans `reference/`, contours CH déplacés dans `public/data/`, historique de septembre fusionné dans `ETAT-DU-PROJET.md` (§ 9).
### Supprimé
- Code du premier prototype Mapbox de septembre (`src/components/Map`, `src/components/Panel`, 8 stations, `public/switzerland-*.json`, configuration PostCSS).

## [0.5.0] — 2026-10-05 · Prototype tour 5 (référence validée)
### Ajouté
- Pastilles sur 2 lignes (nom court + picto/température), pill complète, sans bordure, ombre diffuse (blur 20, offset y 4, 20 %).
- Révélation des domaines secondaires selon le zoom uniquement (tier 2 ≥ 7,6, tier 3 ≥ 8,6, +0,6 hors 964 px), sous réserve de place.
- Fondu d'apparition/disparition (~200 ms, scale 0,85→1), délai de disparition de 220 ms, hystérésis de 0,15 de zoom.
- Champ `short` (nom court sur la carte).
- Trame sombre hors de Suisse (13 %) sur un contour précis (`data/ch-precise.geojson`).
### Modifié
- Survol de pastille : fond gris clair (`#F0EFEF`) au lieu d'une bordure.
- Mobile : le panneau réduit ne montre plus que la searchbox et le bouton liste.
- Survol et sélection ne font plus apparaître de pastille ; un domaine secondaire sélectionné apparaît grâce au zoom du vol de carte.
### Supprimé
- Badge « +N ».
- Trait de frontière ajouté et voile blanc extérieur (testés, rejetés).

## [0.4.0] — 2026-10-05 · Prototype tour 4
### Ajouté
- Panneau unique liste ↔ fiche avec glissement horizontal (340 ms) et bouton « ← Tous les domaines ».
- Retour à la vue Suisse animé à la fermeture ou au retour.
- Recherche par nom de canton et par code (remplace les chips).
- Labels du fond de carte en français, pays masqués, localités étrangères masquées, Berne harmonisée, localités atténuées.
- Mobile en hauteur fixe de 520 px (au lieu de 680).
### Modifié
- Lignes de liste : nom à gauche, canton à droite, sans météo ; padding vertical de 14 px.
- Vol de carte animé rétabli à la sélection.
### Essayé puis abandonné
- Points sobres pour tous les domaines + pin rouge au focus (lisibilité de la carte jugée insuffisante).

## [0.3.0] — 2026-10-05 · Prototype tour 3
### Ajouté
- Révélation progressive par importance (tiers 1/2/3) ; les domaines phares s'écartent au lieu de se masquer.

## [0.2.0] — 2026-10-05 · Prototype tour 2
### Ajouté
- Quatre stratégies de densité comparées : priorité + « +N », grappes météo, régions, top neige.
- Rendu des marqueurs en couches WebGL (images canvas).
- Densité simulée (224 points test).
### Corrigé
- Perte du fond de carte avec trop de cartes actives : chargement/déchargement à la visibilité + recréation sur `webglcontextlost`.

## [0.1.0] — 2026-10-05 · Prototype tour 1
### Ajouté
- Benchmark (bergfex, skiresort.info, OpenSnow, Apple/Google Maps, cartes de rédactions, MySwitzerland).
- Widget en 3 largeurs (964 / 632 / mobile), recherche, tri, fiche avec météo sur 3 jours (Open-Meteo), gestes coopératifs.
- Interface entièrement en français.

## [0.0.1] — 2026-09-22 → 24 · Premier prototype (avant le handoff design)
### Ajouté
- Scaffold React + Vite + Tailwind v4 avec l'habillage Blick partagé (`base.css`, `iframeHeightAdjustment.js`) repris de `bl-tool-timeline-r`.
- Skill impeccable ; `PRODUCT.md` écrit par entretien.
- Carte Mapbox GL avec 8 stations, panneau de recherche coulissant lié à la carte, météo en placeholder.
### Corrigé
- Carte vide : Mapbox force `position: relative` sur son conteneur.
- `feature-state` sans effet : `id` de feature en chaîne ignoré sans `promoteId`.
- Token Mapbox sorti du code avant le premier push (`VITE_MAPBOX_TOKEN`).
