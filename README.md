# Carte des domaines skiables (Blick)

Widget carte embarqué en `<iframe>` sur blick.ch, **centré sur les webcams des stations de ski suisses** : les stations en pastilles avec la météo **du village**, recherche, fiche avec météo sur 3 jours et bouton **« Voir les webcams »**. Trois largeurs d'embed : **964 px** (largeur max), **632 px** (colonne d'article, slot homepage / rubrique), **mobile < 400 px**. Zone de carte au format 3:2 (964 / 632 px) ou 4:3 (mobile).

| Document | Rôle |
| --- | --- |
| [`PRODUCT.md`](PRODUCT.md) | Vérité produit : pour qui, pourquoi, contraintes, ce qui n'est pas tranché |
| [`ETAT-DU-PROJET.md`](ETAT-DU-PROJET.md) | Mémoire du projet : décisions D1–D…, données, sources, points bloquants, pièges, architecture |
| [`CHANGELOG.md`](CHANGELOG.md) | Ce que chaque build a changé |
| [`LICENCES.md`](LICENCES.md) | API, données et ressources utilisées : ce que chaque licence autorise, ce qui bloque la prod, alternatives |
| [`docs/SPEC.md`](docs/SPEC.md) | Spécification visuelle et comportementale (mesures, couleurs, animations) |
| [`docs/METEO.md`](docs/METEO.md) | **Météo et enneigement : comment ça marche** (sources, choix des points, sens de chaque valeur affichée, format de `weather.json`, vérifier une valeur, évolutions) |
| [`docs/VPS.md`](docs/VPS.md) | Relevé météo sur le VPS pegasus : besoin, fichiers de `deploy/`, déploiement, pannes, vérifications (doc générale du serveur : brain) |
| [`reference/`](reference/) | Prototypes HTML du handoff design (`SkiMap4.dc.html` = référence validée). Pas du code de production |

## Démarrer

```bash
npm install
npm run dev       # météo lue sur le VPS (https://ski.citcatlab.ch/weather.json), toujours à jour
# pour tester un changement du relevé, avec une copie locale :
npm run weather   # produit public/data/weather.json (MétéoSuisse + SLF)
npm run dev:local # lit cette copie (elle ne se met pas à jour seule)
```

| Script | Effet |
| --- | --- |
| `npm run dev` | Serveur de dev Vite, météo du VPS (`.env.development`) |
| `npm run dev:local` | Serveur de dev Vite, météo de la copie locale `public/data/weather.json` (`.env.localcopy`) |
| `npm run build` | Build statique dans `dist/` (chemins relatifs), météo du VPS (`.env.production`) |
| `npm run preview` | Sert `dist/` |
| `npm run lint` | ESLint |
| `npm run weather [sortie.json]` | Relevé météo : écrit `weather.json` (défaut `public/data/weather.json`). Même script que le relevé horaire du VPS |
| `npm run skiinfo` | Recapture la liste des stations skiinfo.fr dans `data/sources/skiinfo-suisse.json` |
| `npm run resorts` | Régénère `src/data/resorts.json` (swisstopo + OpenSkiData) depuis la liste skiinfo et `data/sources/stations-mapping.json` |

## Configuration (`.env`, voir `.env.example`)

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `VITE_MAP_ENGINE` | `maplibre` | `mapbox` charge Mapbox GL JS à la place (import dynamique, même API) |
| `VITE_MAP_STYLE_LIGHT` | OpenFreeMap Positron | URL du style en thème clair (style Studio Blick en mode mapbox) |
| `VITE_MAP_STYLE_DARK` | OpenFreeMap Dark | URL du style en thème sombre (`#theme=dark`) |
| `VITE_MAPBOX_TOKEN` | — | Token Mapbox (mode mapbox uniquement) |
| `VITE_WEATHER_URL` | `data/weather.json` | Où lire la météo. `.env.development` et `.env.production` (versionnés) : `https://ski.citcatlab.ch/weather.json` ; `.env.localcopy` : la copie locale |

Le reste des réglages de carte (bornes, paddings, seuils de zoom, relief) est dans `src/config/mapConfig.js`.

## Paramètres d'URL

Même système que `bl-iframe-traffic` (mêmes noms, mêmes règles), pour intégrer la même iframe dans plusieurs contextes.
Identifiants des stations : champ `id` de `src/data/resorts.json` (`zermatt`, `verbier`, `davos-klosters`…).

| URL | Contenu |
| --- | --- |
| `/` ou `/?mode=explore` | carte + panneau liste / fiche (carte au format 3:2 de la largeur, 4:3 en mobile) |
| `/?mode=compact[&points=…][&seeAllUrl=…]` | quelques lignes sans carte ni interaction (haut de rubrique, homepage) : 6 stations au plus, triées par neige fraîche mesurée sur 3 jours (température et hauteur de neige par ligne), deux colonnes à partir de 480 px, une en dessous ; le pied compte les stations non listées et porte « Voir toute la météo » (lien vers `seeAllUrl`, page parente, sinon libellé seul). Sans `points` : les stations de niveau 1. Hauteur selon le contenu |
| `/?points=verbier,zermatt,bruson` | **stations suivies**, dans les deux modes : le widget se limite à ces stations (liste, recherche, carte, compteur). En explore, elles sont toutes visibles sur la carte quel que soit le zoom. En compact, `\|` sépare des colonnes, chacune triée (`?mode=compact&points=verbier,zermatt\|davos-klosters,laax`) ; sous 480 px, les groupes se suivent |
| `/?point=zermatt` | mode explore : fiche de la station ouverte d'emblée, carte cadrée dessus (combinable avec `points`, la station doit alors en faire partie) |
| `/?track=valais` | suffixe du nom suivi en analytics, dans les deux modes (voir Suivi d'audience) |

Valeurs inconnues (`mode`, identifiants de `points` ou `point`) : ignorées, avec un avertissement dans la console. Si
aucun identifiant de `points` n'est connu, toutes les stations sont affichées. Dans l'URL d'une iframe, `|` peut
s'écrire `%7C`.

Intégration : fondu dans l'article, dans les deux modes : ni cadre, ni arrondi, ni marge extérieure. L'en-tête a un
fond `--color-fill-weak` et un petit retrait intérieur (12 px), pour que les bords du widget se lisent dans l'article ;
les crédits, en dessous, n'ont ni fond ni retrait (10,5 px, `--color-text-weak`, liens soulignés, comme dans
`bl-iframe-traffic`). En-tête sur une ligne, à toutes les largeurs : titre à gauche, en surtitre 13 px, capitales, rouge
(mode explore : « Jette un œil sur ta station » ; mode compact : « La météo du week-end en station »),
état du relevé à droite (heure seule sous 480 px).
- **Mode explore** : la carte va d'un bord à l'autre, entre l'en-tête et les crédits ; elle suit le thème Blick
  (Positron en clair, OpenFreeMap Dark en sombre, pastilles et boutons de la carte assortis) ; panneau liste / fiche
  blanc en clair, nettement plus clair que la carte en sombre (`--color-fill-strong`).
- **Mode compact** : liste sur `--color-fill-weak` avec le même retrait que l'en-tête, pied « Voir toute la météo »
  sur `--color-fill-strong`, avec ses marges latérales.

| Largeur | Mise en page (mode explore) |
| --- | --- |
| ≥ 860 px (cible 964) | comme en 632 px : carte pleine largeur, panneau superposé replié par défaut, ouvert par « Liste » ou un clic sur la carte (carte 3:2 : 643 px de haut à 964 px) |
| 520–859 px (cible 632) | carte pleine largeur, panneau superposé replié par défaut, ouvert par « Liste » ou un clic sur la carte (carte 3:2 : 421 px à 632 px) |
| < 520 px (mobile) | en-tête, carte (4:3 : 270 px à 360 px, + 61 px) sur toute la zone, avec un panneau bas posé dessus : recherche en attente (68 px, champ + bouton liste), recherche ouverte (à la hauteur de la fiche ; compteur et liste) ou fiche station (≈ 238 px). Hauteur du widget inchangée |

Différences avec `bl-iframe-traffic` : `?points=` s'applique aussi au mode explore (le trafic ne le lit qu'en
compact), et chaque événement de suivi porte alors `points` dans les deux modes.

## Suivi d'audience

Comme `bl-iframe-traffic` (13/11/2026). `src/lib/analytics.js` pousse dans `window.blickDataLayer` (posé dans
`index.html`, relayé à la page par `iframeHeightAdjustment.js` en message `TRACK`, ou par le pont natif dans les
apps), selon la convention des widgets Blick : `event`, `iframe_name` (le widget), `iframe_id` (l'action), puis les
données de l'événement.

| `event` | `iframe_id` | Données | Quand |
| --- | --- | --- | --- |
| `iframe_impression` | `iframe_impression` | | chargement du widget, une fois |
| `iframe_click` | `iframe_resort_clicked` | `resort` (identifiant de la station, champ `id`), `source` (`list` / `map`) | choix d'une station dans la liste (panneau 964 / 632 px ou recherche mobile) ou sur la carte ; pas la présélection `?point=` |
| `iframe_click` | `iframe_list_clicked` | | ouverture de la liste : bouton « Liste · N » (964 / 632 px) ou bouton liste du panneau bas (mobile) ; pas le focus dans le champ de recherche |
| `iframe_click` | `iframe_webcams_clicked` | `resort` | bouton « Voir les webcams » (964 / 632 px) ou « Webcams » (fiche mobile) |
| `iframe_click` | `iframe_see_all_clicked` | | « Voir toute la météo » du mode compact (si `seeAllUrl`) |

`iframe_name` : `storytelling_meteo_ski_explore` ou `storytelling_meteo_ski_compact`, suivi de `_<track>` si l'URL
porte `?track=` (minuscules, chiffres, tirets ; 40 caractères au plus, sinon ignoré, avec un avertissement en console).
À utiliser pour chaque vue contextualisée, afin que ses statistiques restent séparées : par exemple
`?mode=compact&points=verbier,zermatt%7Cdavos-klosters,laax&track=grandes-stations` →
`storytelling_meteo_ski_compact_grandes-stations`. Avec `?points=`, chaque événement porte aussi `points` (la
sélection), dans les deux modes.

Pour ajouter ou modifier un événement : `trackClick('<action>', { … })` (`iframe_<action>_clicked`), puis ce tableau.
Vérifier en local : les événements partent en `postMessage` (`blick_event_type: 'TRACK'`) vers la page, ou vers la
fenêtre elle-même hors iframe ; les écouter avec `window.addEventListener('message', …)` dans la console.

## Production : relevé météo sur le VPS

Les lecteurs n'appellent jamais les sources météo (MétéoSuisse, SLF, D59) : le VPS **pegasus** (celui de `bl-iframe-traffic`) relève la météo chaque
heure et sert un fichier statique, `https://ski.citcatlab.ch/weather.json`. Décision D57. Fonctionnement, fichiers de
`deploy/`, déploiement, pannes de la source et vérifications : [`docs/VPS.md`](docs/VPS.md). Documentation générale
du serveur : brain, `homelab/machines/pegasus/`.

```bash
deploy/deploy.sh                                                 # mise en ligne / mise à jour (idempotent)
curl -s https://ski.citcatlab.ch/weather.json | jq '{generatedAt}'   # dernier relevé
```

- **Après `npm run resorts`** : relancer `deploy/deploy.sh`, la liste des stations du serveur doit rester celle du widget publié.
- **Widget** : `npm run build`, puis `dist/` sur le FTP de l'entreprise (pas sur le VPS).

## Données

- `src/data/resorts.json` : les **154 stations** du widget (liste skiinfo.fr sans doublons). Lieu, canton, commune, altitudes : swisstopo. Point en altitude (gare d'arrivée la plus haute, sert au choix de la station de neige SLF) : remontées OpenSkiData. Page webcams : `stations-mapping.json`. Généré par `npm run resorts`, versionné.
- `data/sources/skiinfo-suisse.json` : liste brute skiinfo.fr (156 stations, nom + URL).
- `data/sources/stations-mapping.json` : choix faits à la main pour chaque station (lieu swisstopo, domaine OpenSkiData, nom court, **page webcams**).
- `src/data/stations-niveau-1.json` : **sélection des stations de niveau 1** (toujours visibles), liste d'identifiants. À éditer directement, aucun script à relancer.
- `public/data/weather.json` : généré, non versionné. Schéma dans `ETAT-DU-PROJET.md` § 3.3.

## Architecture

```
src/
  App.jsx                 paramètres d'URL (mode, points, point), état (recherche, tri, sélection, survol, panneau) + layout par mode
  config/                 mapConfig.js (moteur, style, token, seuils), weatherConfig.js
  data/                   resorts.js, resorts.json (154 stations), cantons.js (26 cantons FR)
  hooks/                  useWidth (largeur → wide/mid/mobile), useWeather (lecture de weather.json)
  lib/                    placePills (placement écran), pill (rendu canvas), weather (famille de temps → picto), resortList (filtre/tri, sélection ?points=), theme (thème clair / sombre pour la carte)
  map/                    engine (MapLibre | Mapbox), basemap (labels FR, trame CH, relief, par thème), PillLayer (couche, placement, fondus)
  components/             MapView, SidePanel (964 / 632 px), MobileSheet (panneau bas mobile), SearchBox, ResortList, ResortDetail (+ MobileResortDetail), CompactView (?mode=compact), Header, Footer, ui/
scripts/                  fetch-weather.mjs (relevé MétéoSuisse + SLF), fetch-skiinfo-list.mjs, build-resorts.mjs (dataset)
deploy/                   relevé météo sur le VPS : unités systemd, site Caddy, deploy.sh
data/sources/             liste skiinfo + mapping des stations (entrées de build-resorts)
public/                   css/base.css + js/iframeHeightAdjustment.js (repli local des fichiers Blick), fonts, data/*.geojson
```

Détail du flux de données et des choix d'implémentation : `ETAT-DU-PROJET.md` § 8.
