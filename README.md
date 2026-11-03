# Carte des domaines skiables (Blick)

Widget carte embarqué en `<iframe>` sur blick.ch, **centré sur les webcams des stations de ski suisses** : les stations en pastilles avec les conditions météo **en altitude**, recherche, fiche avec météo sur 3 jours et bouton **« Voir les webcams »**. Trois largeurs d'embed : **964 px** (largeur max), **632 px** (colonne d'article, slot homepage / rubrique), **mobile < 400 px** (hauteur fixe 520 px).

| Document | Rôle |
| --- | --- |
| [`PRODUCT.md`](PRODUCT.md) | Vérité produit : pour qui, pourquoi, contraintes, ce qui n'est pas tranché |
| [`ETAT-DU-PROJET.md`](ETAT-DU-PROJET.md) | Mémoire du projet : décisions D1–D…, données, sources, points bloquants, pièges, architecture |
| [`CHANGELOG.md`](CHANGELOG.md) | Ce que chaque build a changé |
| [`LICENCES.md`](LICENCES.md) | API, données et ressources utilisées : ce que chaque licence autorise, ce qui bloque la prod, alternatives |
| [`docs/SPEC.md`](docs/SPEC.md) | Spécification visuelle et comportementale (mesures, couleurs, animations) |
| [`docs/VPS.md`](docs/VPS.md) | Relevé météo sur le VPS pegasus : besoin, fichiers de `deploy/`, déploiement, pannes, vérifications (doc générale du serveur : brain) |
| [`reference/`](reference/) | Prototypes HTML du handoff design (`SkiMap4.dc.html` = référence validée). Pas du code de production |

## Démarrer

```bash
npm install
npm run dev:vps   # météo lue sur le VPS (https://ski.citcatlab.ch/weather.json)
# ou, sans le VPS :
npm run weather   # produit public/data/weather.json (Open-Meteo), sinon « Météo indisponible »
npm run dev
```

| Script | Effet |
| --- | --- |
| `npm run dev` | Serveur de dev Vite (météo : `public/data/weather.json`) |
| `npm run dev:vps` | Serveur de dev Vite, météo du VPS (`.env.vps`) |
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
| `VITE_MAP_STYLE_URL` | OpenFreeMap Positron | URL du style (style Studio Blick en mode mapbox) |
| `VITE_MAPBOX_TOKEN` | — | Token Mapbox (mode mapbox uniquement) |
| `VITE_WEATHER_URL` | `data/weather.json` | Où lire la météo. `.env.production` et `.env.vps` (versionnés) : `https://ski.citcatlab.ch/weather.json` |

Le reste des réglages de carte (bornes, paddings, seuils de zoom, relief) est dans `src/config/mapConfig.js`.

## Paramètres d'URL

Même système que `bl-iframe-traffic` (mêmes noms, mêmes règles), pour intégrer la même iframe dans plusieurs contextes.
Identifiants des stations : champ `id` de `src/data/resorts.json` (`zermatt`, `verbier`, `davos-klosters`…).

| URL | Contenu |
| --- | --- |
| `/` ou `/?mode=explore` | carte + panneau liste / fiche (hauteur fixe par largeur) |
| `/?mode=compact[&points=…][&seeAllUrl=…]` | quelques lignes sans carte ni interaction (haut de rubrique, homepage) : 6 stations au plus, triées par neige sur 3 jours, deux colonnes à partir de 480 px, une en dessous ; le pied compte les stations non listées et porte « Tout voir » (lien vers `seeAllUrl`, page parente, sinon libellé seul). Sans `points` : les stations de niveau 1. Hauteur selon le contenu |
| `/?points=verbier,zermatt,bruson` | **stations suivies**, dans les deux modes : le widget se limite à ces stations (liste, recherche, carte, compteur). En explore, elles sont toutes visibles sur la carte quel que soit le zoom. En compact, `\|` sépare des colonnes, chacune triée (`?mode=compact&points=verbier,zermatt\|davos-klosters,laax`) ; sous 480 px, les groupes se suivent |
| `/?point=zermatt` | mode explore : fiche de la station ouverte d'emblée, carte cadrée dessus (combinable avec `points`, la station doit alors en faire partie) |

Valeurs inconnues (`mode`, identifiants de `points` ou `point`) : ignorées, avec un avertissement dans la console. Si
aucun identifiant de `points` n'est connu, toutes les stations sont affichées. Dans l'URL d'une iframe, `|` peut
s'écrire `%7C`.

Différences avec `bl-iframe-traffic` : `?points=` s'applique aussi au mode explore (le trafic ne le lit qu'en
compact) ; pas encore de suivi d'audience, donc pas de `?track=`.

## Production : relevé météo sur le VPS

Les lecteurs n'appellent jamais Open-Meteo : le VPS **pegasus** (celui de `bl-iframe-traffic`) relève la météo chaque
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

- `src/data/resorts.json` : les **154 stations** du widget (liste skiinfo.fr sans doublons). Lieu, canton, commune, altitudes : swisstopo. Point des conditions en altitude (gare d'arrivée la plus haute) : remontées OpenSkiData. Page webcams : `stations-mapping.json`. Généré par `npm run resorts`, versionné.
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
  lib/                    placePills (placement écran), pill (rendu canvas), weather (WMO → picto), resortList (filtre/tri, sélection ?points=)
  map/                    engine (MapLibre | Mapbox), basemap (labels FR, trame CH, relief), PillLayer (couche, placement, fondus)
  components/             MapView, SidePanel, SearchBox, ResortList, ResortDetail (+ ResortDock mobile), CompactView (?mode=compact), Header, Footer, ui/
scripts/                  fetch-weather.mjs (relevé météo), fetch-skiinfo-list.mjs, build-resorts.mjs (dataset)
deploy/                   relevé météo sur le VPS : unités systemd, site Caddy, deploy.sh
data/sources/             liste skiinfo + mapping des stations (entrées de build-resorts)
public/                   css/base.css + js/iframeHeightAdjustment.js (repli local des fichiers Blick), fonts, data/*.geojson
```

Détail du flux de données et des choix d'implémentation : `ETAT-DU-PROJET.md` § 8.
