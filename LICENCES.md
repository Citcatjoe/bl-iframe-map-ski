# Licences : API, données et ressources utilisées

Aide-mémoire : ce que le widget utilise, ce que chaque source autorise, ce qui bloque la mise en production et les
alternatives possibles. Le détail et l'historique des décisions sont dans [`ETAT-DU-PROJET.md`](ETAT-DU-PROJET.md)
(§ 3.5, § 4, décisions D39, D44–D57). État au **2026-11-02**. La colonne « Vérifié » donne la date de la dernière
vérification à la source ; une licence change, donc il faut revérifier avant la mise en production.

Contexte qui décide de tout : le widget est publié sur **blick.ch, un site avec publicité**. Pour plusieurs
fournisseurs, c'est un **usage commercial**, même si le lecteur ne paie rien.

## En bref

| Brique | Source en place | Utilisable en production ? | Ce qui reste à faire |
|---|---|---|---|
| Météo | Open-Meteo, **API publique gratuite** (relevé horaire sur le VPS, D57) | **Non** : API gratuite réservée au non commercial | Choisir une source (§ Météo, alternatives) |
| Fond de carte | OpenFreeMap (style Positron) + MapLibre | Oui | Plan B si OpenFreeMap tombe : auto-héberger (D54, ouvert) |
| Relief | AWS Terrain Tiles (Mapzen) | Oui | — |
| Lieux, cantons, altitudes | swisstopo | Oui | — |
| Domaines skiables | OpenSkiData (OpenStreetMap) | Oui | Ne pas publier le jeu dérivé sans l'ODbL |
| Liste des stations | skiinfo.fr (noms et URL) | **À clarifier** | Voir § Données des stations |
| Contours de la Suisse | `mledoze/countries`, `ZHB/switzerland-geojson` | **À clarifier** pour le second | Remplacer par swisstopo swissBOUNDARIES3D |
| Liens webcams | sites des stations, agrégateurs | Oui (simples liens) | 36 liens d'agrégateur à remplacer |
| Polices, icônes, code | Blick, Inter, Font Awesome Free, bibliothèques npm | Oui | — |

## Météo

### En place

| Source | Licence | Ce qu'elle autorise | Limites | Vérifié |
|---|---|---|---|---|
| **Open-Meteo, API publique** (`api.open-meteo.com`, modèles MétéoSuisse ICON-CH1/CH2) | Conditions du service : gratuit **non commercial seulement** ; données **CC BY 4.0** | Prototype, développement. **Pas blick.ch** : « Websites or apps that have subscriptions or display advertisements » sont de l'usage commercial ([conditions](https://open-meteo.com/en/terms)) | < 10 000 appels/jour, 5 000/h, 600/min, 300 000/mois. Nous : ≈ 154/h, ≈ 3 700/jour | 2026-11-02 |

Crédit affiché aujourd'hui : « Météo : MétéoSuisse ICON-CH via Open-Meteo (CC BY 4.0) » (court : « Météo :
Open-Meteo / MétéoSuisse »), dans `src/config/weatherConfig.js`.

### Alternatives utilisables par Blick (gratuites, publicité comprise)

| Option | Licence | Pour | Contre | Travail |
|---|---|---|---|---|
| **1. Open-Meteo auto-hébergé** | Logiciel **AGPL-3.0**, données **CC BY 4.0** ; « Self-hosting is available for non-commercial and commercial use » ([doc](https://github.com/open-meteo/open-meteo/blob/main/docs/getting-started.md)) | Même prévision qu'aujourd'hui, à l'altitude exacte, neige prévue ; **seule l'URL change** dans `scripts/fetch-weather.mjs` | Un serveur de 8–16 Go de RAM et ≥ 100 Go de disque (le VPS actuel, 2 Go, ne suffit pas) ; AGPL : publier nos modifications du serveur s'il y en a | Faible côté code, réel côté serveur (ETAT § 4.6) |
| **2. MétéoSuisse OGD, prévisions locales** | Open data fédéral, usage libre, citer « Source: MeteoSwiss » | Prévision officielle, 631 points de montagne, sans serveur à nous | Points fixes (rattacher chaque station au plus proche) ; **pas de neige fraîche** (à estimer) ; pictogrammes MétéoSuisse non réutilisables (seulement leurs numéros) | Moyen : réécrire le relevé, mapper les symboles |
| **3. OpenWeather, formule gratuite** | **ODbL** : usage commercial autorisé, **attribution visible** obligatoire (« Météo : OpenWeather ») | Sans serveur, une clé API, quota large (1 000 000 appels/mois) | **Pas de visée en altitude** (contredit en partie D51) ; neige en mm ; données rafraîchies toutes les 2 h ; disponibilité 95 % | Moyen : réécrire le relevé |
| **4. SLF, stations IMIS** (complément) | **CC BY 4.0**, lien vers slf.ch obligatoire | **Neige mesurée** en altitude (hauteur, neige fraîche), toutes les 30 min | Pas une prévision ; ~180 stations, proximité à vérifier station par station | Moyen : rattacher les stations |

Combinaisons envisagées (ETAT § 4.7) : **1 + 4** (le plus complet), **2 + 4** (tout en open data fédéral, sans
serveur), **3 + 4** (le plus léger, prévision sans altitude).

### Écartées

| Option | Pourquoi |
|---|---|
| Open-Meteo, abonnement (29 $/mois) | Pas de budget |
| OpenWeather One Call 4.0 et abonnements | Payants au-delà de 1 000 appels/jour (≈ 230 £/mois pour notre besoin) |
| MétéoSuisse ICON-CH brut (GRIB) | Décodeur à écrire : c'est ce que fait déjà Open-Meteo auto-hébergé |
| MétéoSuisse SwissMetNet | Stations rarement dans les domaines ; au mieux un complément |

## Carte

| Brique | Licence | Conditions | Vérifié |
|---|---|---|---|
| **MapLibre GL JS** 5 (moteur retenu) | BSD-3-Clause | Aucune limite (rendu dans le navigateur) | 2026-10 (ETAT § 4.1) |
| **OpenFreeMap**, style Positron (tuiles, glyphes, sprites) | Service gratuit, sans clé ni limite de vues, usage commercial autorisé ; données OpenStreetMap **ODbL**, schéma OpenMapTiles | Attribution « OpenFreeMap © OpenMapTiles © OpenStreetMap ». **Sans SLA** (service tenu par une personne, financé par dons) | 2026-10 (ETAT § 4.1, D39) |
| **AWS Terrain Tiles** (Terrarium, Mapzen / Tilezen), relief | Jeu de données public AWS, gratuit, sans SLA | Attribution requise : « Relief Mapzen » (sources SRTM, USGS, NOAA) | 2026-10 (ETAT § 4.1) |
| Mapbox GL JS (branchable, **écarté**, D39) | Propriétaire | Token, quota gratuit puis facturation par chargement de carte, logo Mapbox | 2026-10 |

Crédit affiché : « Carte OpenFreeMap © OpenMapTiles © OpenStreetMap · Relief Mapzen » (`src/config/mapConfig.js`).

Alternative si OpenFreeMap disparaît : générer les mêmes tuiles (Planetiler, schéma OpenMapTiles) en un fichier
PMTiles et les héberger nous-mêmes ; même style, même rendu, mêmes attributions OpenStreetMap (ETAT § 4.1, D54).

## Données des stations

| Source | Licence | Ce qu'on en tire | Conditions |
|---|---|---|---|
| **swisstopo** : gazetteer swissNAMES3D, service d'altitude swissALTI3D | Open data swisstopo | Lieu, canton, commune, altitudes (`resorts.json`) | Citer la source |
| **OpenSkiData** (dérivé d'OpenStreetMap) | **ODbL** | Domaines skiables, remontées, point en altitude (D51) | Attribution ; **partage à l'identique** si on publie le jeu de données dérivé (`resorts.json` en tant que base de données). L'afficher dans le widget ne déclenche pas cette obligation |
| **Wikidata** | CC0 | Site officiel de quelques stations | Aucune |
| **skiinfo.fr** | « Tous droits réservés » | **La liste des 154 stations** (noms, URL ; `data/sources/skiinfo-suisse.json`) ; coordonnées utilisées pour vérification seulement, rien de stocké | **À clarifier** : une liste de noms de stations est un fait, mais la sélection vient d'un site non libre. Option sûre : reconstituer la liste depuis OpenSkiData ou swisstopo |

Crédit affiché : « Stations : swisstopo, OpenSkiData » (`src/components/Footer.jsx`).

### Contours de la Suisse (`public/data/`)

| Fichier | Source | Licence | Statut |
|---|---|---|---|
| `ch.geojson` (filtre des localités) | `mledoze/countries` | ODbL | OK, attribution OpenStreetMap déjà affichée |
| `ch-precise.geojson` (trame extérieure) | [`ZHB/switzerland-geojson`](https://github.com/ZHB/switzerland-geojson) | **Pas de licence** : seulement « You are free to download and use those files » dans le README (vérifié le 2026-11-02) ; origine des données non indiquée | **À remplacer** |

Alternative prévue (ETAT § 3.4) : **swisstopo swissBOUNDARIES3D** (officiel, open data), simplifié, pour les deux
fichiers.

## Liens vers les webcams

Le widget **ne montre aucune image de webcam** : il renvoie vers la page de la station (nouvel onglet). Un lien
ne demande pas d'autorisation. 118 pages officielles, 36 pages d'agrégateur (skiinfo.fr, bergfex, prowebcam, guidle)
à remplacer quand une page officielle existe (D53, D55).

À savoir si l'idée change : **afficher** des images de webcams dans le widget demanderait l'accord de chaque
exploitant (images protégées, conditions propres à chaque fournisseur : Roundshot, Feratel, Panomax…).

## Code, polices, icônes

| Ressource | Licence | Remarque |
|---|---|---|
| React, React DOM, Vite, Tailwind CSS | MIT | — |
| MapLibre GL JS | BSD-3-Clause | — |
| Mapbox GL JS (dépendance, non utilisée par défaut) | Propriétaire (conditions Mapbox) | Chargé seulement si `VITE_MAP_ENGINE=mapbox` |
| Font Awesome Free 6 | Icônes CC BY 4.0, polices SIL OFL 1.1, code MIT | L'attribution est portée par les fichiers du paquet |
| Inter Variable (`public/fonts/`) | SIL OFL 1.1 | — |
| Blick Variable (`public/fonts/`) | **Police propriétaire de Blick** | Réservée aux produits Blick ; ne pas la réutiliser ailleurs (projets perso du VPS compris) |
| `base.css`, `iframeHeightAdjustment.js` | Ressources internes Blick | Copies locales de secours seulement |

## Le VPS pegasus

Le VPS ne change rien aux licences : il relaie les données sans les modifier et sert un fichier aux lecteurs.
Il ne fait que réduire les appels à la source (un relevé par heure au lieu d'un appel par lecteur). La question de
l'usage commercial d'Open-Meteo reste donc entière tant que l'API publique est appelée.

## Mise à jour de ce fichier

À chaque nouvelle source ou changement de fournisseur : ajouter une ligne, avec la date de vérification et un lien
vers les conditions ; adapter les crédits affichés (`weatherConfig.js`, `mapConfig.js`, `Footer.jsx`) ; consigner la
décision dans `ETAT-DU-PROJET.md`.
