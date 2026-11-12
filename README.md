# Carte des domaines skiables (Blick)

Widget carte embarqué en `<iframe>` sur blick.ch, **centré sur les webcams des stations de ski suisses** : les stations en pastilles avec la météo **du village**, recherche, fiche avec météo sur 3 jours et bouton **« Voir les webcams »**. Trois largeurs d'embed : **964 px** (largeur max), **632 px** (colonne d'article, slot homepage / rubrique), **mobile < 400 px** (hauteur fixe 393 px).

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
| `/` ou `/?mode=explore` | carte + panneau liste / fiche (hauteur fixe par largeur) |
| `/?mode=compact[&points=…][&seeAllUrl=…]` | quelques lignes sans carte ni interaction (haut de rubrique, homepage) : 6 stations au plus, triées par neige fraîche mesurée sur 3 jours (température et hauteur de neige par ligne), deux colonnes à partir de 480 px, une en dessous ; le pied compte les stations non listées et porte « Voir toute la météo » (lien vers `seeAllUrl`, page parente, sinon libellé seul). Sans `points` : les stations de niveau 1. Hauteur selon le contenu |
| `/?points=verbier,zermatt,bruson` | **stations suivies**, dans les deux modes : le widget se limite à ces stations (liste, recherche, carte, compteur). En explore, elles sont toutes visibles sur la carte quel que soit le zoom. En compact, `\|` sépare des colonnes, chacune triée (`?mode=compact&points=verbier,zermatt\|davos-klosters,laax`) ; sous 480 px, les groupes se suivent |
| `/?point=zermatt` | mode explore : fiche de la station ouverte d'emblée, carte cadrée dessus (combinable avec `points`, la station doit alors en faire partie) |

Valeurs inconnues (`mode`, identifiants de `points` ou `point`) : ignorées, avec un avertissement dans la console. Si
aucun identifiant de `points` n'est connu, toutes les stations sont affichées. Dans l'URL d'une iframe, `|` peut
s'écrire `%7C`.

Intégration : fondu dans l'article, dans les deux modes : ni cadre, ni arrondi, ni marge extérieure. L'en-tête et les
crédits ont un fond `--color-fill-weak` et un petit retrait intérieur (12 px), pour que les bords du widget se lisent
dans l'article. En-tête sur une ligne, à toutes les largeurs : titre à gauche (mode explore : « Jette un œil sur ta
station », Blick 19 px ; mode compact : « La météo du week-end en station », en surtitre 13 px, capitales, rouge),
état du relevé à droite (heure seule sous 480 px).
- **Mode explore** : la carte va d'un bord à l'autre, entre l'en-tête et les crédits ; elle suit le thème Blick
  (Positron en clair, OpenFreeMap Dark en sombre, pastilles et boutons de la carte assortis) ; panneau liste / fiche
  blanc en clair, nettement plus clair que la carte en sombre (`--color-fill-strong`).
- **Mode compact** : liste sur `--color-fill-weak` avec le même retrait que l'en-tête, pied « Voir toute la météo »
  sur `--color-fill-strong`, avec ses marges latérales.

| Largeur | Mise en page (mode explore) |
| --- | --- |
| ≥ 860 px (cible 964) | comme en 632 px : carte pleine largeur, panneau superposé replié par défaut, ouvert par « Liste » ou un clic sur la carte (600 px) |
| 520–859 px (cible 632) | carte pleine largeur, panneau superposé replié par défaut, ouvert par « Liste » ou un clic sur la carte (540 px) |
| < 520 px (mobile) | en-tête, carte, barre de recherche + bouton liste ; liste plein cadre, fiche compacte de 168 px sous la carte (393 px) |

Différences avec `bl-iframe-traffic` : `?points=` s'applique aussi au mode explore (le trafic ne le lit qu'en
compact) ; pas encore de suivi d'audience, donc pas de `?track=`.

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
  components/             MapView, SidePanel, SearchBox, ResortList, ResortDetail (+ ResortDock mobile), CompactView (?mode=compact), Header, Footer, ui/
scripts/                  fetch-weather.mjs (relevé MétéoSuisse + SLF), fetch-skiinfo-list.mjs, build-resorts.mjs (dataset)
deploy/                   relevé météo sur le VPS : unités systemd, site Caddy, deploy.sh
data/sources/             liste skiinfo + mapping des stations (entrées de build-resorts)
public/                   css/base.css + js/iframeHeightAdjustment.js (repli local des fichiers Blick), fonts, data/*.geojson
```

Détail du flux de données et des choix d'implémentation : `ETAT-DU-PROJET.md` § 8.
