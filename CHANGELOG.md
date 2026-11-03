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
### Modifié
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
