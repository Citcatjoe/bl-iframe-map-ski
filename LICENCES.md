# Licences : API, données et ressources utilisées

Aide-mémoire : ce que le widget utilise, ce que chaque source autorise, ce qui bloque la mise en production et les
alternatives possibles. Le détail et l'historique des décisions sont dans [`ETAT-DU-PROJET.md`](ETAT-DU-PROJET.md)
(§ 3.5, § 4, décisions D39, D44–D60). État au **2026-11-03**. La colonne « Vérifié » donne la date de la dernière
vérification à la source ; une licence change, donc il faut revérifier avant la mise en production.

Contexte qui décide de tout : le widget est publié sur **blick.ch, un site avec publicité**. Pour plusieurs
fournisseurs, c'est un **usage commercial**, même si le lecteur ne paie rien.

## En bref

| Brique | Source en place | Utilisable en production ? | Ce qui reste à faire |
|---|---|---|---|
| Météo | **MétéoSuisse**, prévisions locales (open data), relevé horaire sur le VPS (D57, D59) | Oui | — |
| Enneigement | **SLF**, stations automatiques IMIS (CC BY 4.0) | Oui, avec un lien visible vers slf.ch | — |
| Fond de carte | OpenFreeMap (style Positron) + MapLibre | Oui | Plan B si OpenFreeMap tombe : auto-héberger (D54, ouvert) |
| Relief | AWS Terrain Tiles (Mapzen) | Oui | — |
| Lieux, cantons, altitudes | swisstopo | Oui | — |
| Domaines skiables | OpenSkiData (OpenStreetMap) | Oui | Ne pas publier le jeu dérivé sans l'ODbL |
| Liste des stations | skiinfo.fr (noms et URL) | **À clarifier** | Voir § Données des stations |
| Contours de la Suisse | `mledoze/countries`, `ZHB/switzerland-geojson` | **À clarifier** pour les deux (attribution du premier, licence du second) | Remplacer par swisstopo swissBOUNDARIES3D |
| Liens webcams | sites des stations, agrégateurs | Oui (simples liens) | 36 liens d'agrégateur à remplacer. Afficher les images : accord de l'exploitant, voir § Liens vers les webcams |
| Polices, icônes, code | Blick, Inter, Font Awesome Free (icônes d'interface), pictos météo propres, bibliothèques npm | Oui | — |

## Météo

### En place (depuis le 2026-11-03, D59)

| Source | Licence | Ce qu'on en tire | Conditions | Vérifié |
|---|---|---|---|---|
| **MétéoSuisse, prévisions locales** (`ch.meteoschweiz.ogd-local-forecasting`, data.geo.admin.ch) | Open data fédéral, « may be reused without restriction », **CC BY 4.0** ([conditions](https://opendatadocs.meteoswiss.ch/general/terms-of-use)) | Température, vent, pictogramme du moment, pictogramme, max, min et précipitations des 3 jours, au point de prévision le plus proche du village de chaque station (D61) (631 points de montagne, 1 118 stations, 4 071 NPA) | Citer la source (« Source : MétéoSuisse ») sans laisser croire à un soutien de MétéoSuisse. **Les pictogrammes MétéoSuisse sont protégés** : on n'en reprend que le numéro, traduit en nos propres pictos ([doc](https://opendatadocs.meteoswiss.ch/e-forecast-data/e4-local-forecast-data)) | 2026-11-03 |
| **SLF, stations IMIS** (`measurement-api.slf.ch`, `daily-snow` et `measurements`) | **CC BY 4.0** ([SLF data service](https://www.slf.ch/en/services-and-products/slf-data-service)), gratuit | Neige au sol (dernière mesure du capteur, toutes les 30 min) et neige tombée en 3 jours (estimée par le modèle SNOWPACK aux stations), à la station la plus proche (25 km au plus) ; détail : [`docs/METEO.md`](docs/METEO.md) | Référence **clairement visible** au SLF, **avec un lien vers www.slf.ch** ; ne pas surcharger leur infrastructure (un relevé par heure) ; inscription conseillée à la liste « Live measurement and model data » (data@slf.ch) pour être prévenu des changements | 2026-11-03 |

Crédit affiché : « Météo : MétéoSuisse · Neige : SLF », dans le pied de page des deux modes
(`src/config/weatherConfig.js`, `Footer.jsx`) ; « MétéoSuisse » mène à www.meteosuisse.admin.ch, « Neige : SLF »
(souligné, référence clairement visible) à www.slf.ch. Revu le 05/11/2026 : MétéoSuisse demande de citer la source
(« Source : MétéoSuisse » ou équivalent) sans laisser croire à un soutien, ce que fait « Météo : MétéoSuisse ».

### Remplacée

| Source | Pourquoi | Vérifié |
|---|---|---|
| **Open-Meteo, API publique** (`api.open-meteo.com`), en place du 2026-10-05 au 2026-11-03 | Gratuite **non commercial seulement** : « Websites or apps that have subscriptions or display advertisements » sont de l'usage commercial ([conditions](https://open-meteo.com/en/terms)) ; blick.ch affiche de la publicité | 2026-11-02 |

### Autres possibilités gratuites (non retenues pour l'instant)

| Option | Licence | Pour | Contre | Travail |
|---|---|---|---|---|
| **Open-Meteo auto-hébergé** | Logiciel **AGPL-3.0**, données **CC BY 4.0** ; « Self-hosting is available for non-commercial and commercial use » ([doc](https://github.com/open-meteo/open-meteo/blob/main/docs/getting-started.md)) | Prévision au point exact (altitude du `weatherPoint`), **neige prévue** en cm | Un serveur de 8–16 Go de RAM et ≥ 100 Go de disque (le VPS actuel, 2 Go, ne suffit pas) ; AGPL : publier nos modifications du serveur s'il y en a | Script à réécrire vers l'API Open-Meteo (ETAT § 4.6) |
| **OpenWeather, formule gratuite** | **ODbL** : usage commercial autorisé, **attribution visible** obligatoire (« Météo : OpenWeather ») | Sans serveur, une clé API, quota large (1 000 000 appels/mois) | **Pas de visée en altitude** (contredit en partie D51) ; neige en mm ; données rafraîchies toutes les 2 h ; disponibilité 95 % | Moyen : réécrire le relevé |
| **MET Norway, Locationforecast 2.0** (`api.met.no`, ajouté le 2026-11-03) | Données **CC BY 4.0** (« freely available … including commercial use », [api.met.no](https://api.met.no/)) ; [conditions](https://api.met.no/doc/TermsOfService) : s'identifier par le `User-Agent`, mettre en cache, pas de requêtes du navigateur à fort trafic (passer par un serveur), < 20 requêtes/s, pas de SLA | Gratuit, sans clé ; paramètre `altitude` qui corrige la température à l'altitude du `weatherPoint` ; vent, nuages, symbole (dont neige), min/max, ≈ 9 jours | Modèle **ECMWF HRES (≈ 9 km)** en Suisse, moins fin que MétéoSuisse ; **pas de neige en cm** (précipitations en mm + symbole « snow ») ; un point par requête | Moyen : réécrire le relevé |

Ce qui manque aux sources en place : la **neige fraîche prévue** (MétéoSuisse ne la publie pas ; seule Open-Meteo
auto-hébergé la fournit) et les pistes ouvertes (Suisse Tourisme, plus bas).

### Fournisseurs sous contrat (payants, à négocier)

| Option | Droits | Ce qu'elle donne | Points à vérifier | Vérifié |
|---|---|---|---|---|
| **MeteoNews** (MeteoNews AG, Zurich, groupe UBIMET) | Commercial, **contrat** ; « web-service (xml, feeds, API) » sans documentation ni prix publics ([services](https://meteonews.ch/en/Cms/D15/dienstleistungen-und-produkte)). **Fournisseur météo de Blick** (blick.ch, Blick, SonntagsBlick, d'après MeteoNews et [Kleinreport](https://www.kleinreport.ch/news/meteonews-hat-auch-bei-der-ringier-gruppe-die-nase-vorne-65922/)) : un contrat Ringier existe peut-être déjà | Sur ses pages « Skigebiet » (ex. [Verbier](https://meteonews.ch/de/Wintersport/SCH680/Verbier)) : prévision heure par heure et 5 jours, **neige fraîche prévue par jour (cm)**, isotherme 0 °C, **hauteur de neige vallée / montagne**, installations et pistes ouvertes, état des pistes | Le contrat de Blick couvre-t-il une API pour ce widget ? Prévision à l'altitude du village (Verbier : 1 550 m), pas au sommet ; hauteurs de neige reprises de MySwitzerland (WISPO, ligne suivante) ; ≈ 120 domaines listés contre nos 154. **Lire le site (scraping) n'est pas une option** | 2026-11-03 |
| **Schweiz Tourismus, Wintersportbericht (WISPO)** | **Contrat** avec Suisse Tourisme, inscription comme distributeur ([STnet](https://www.stnet.ch/de/marketing/digital-marketing/daten-export/export-wintersportbericht-wispo/)) ; coût non publié | Bulletin officiel déclaré chaque jour par ≈ 200 stations (mi-novembre à fin avril) : hauteur de neige, neige fraîche, installations et pistes ouvertes, état des pistes ; API XML / JSON | Conditions et prix ; correspondance avec nos 154 stations ; données déclarées par les stations, pas mesurées | 2026-11-03 |

MeteoNews : demandé en interne le 2026-11-03, **pas d'actualité** pour ce widget. D'où le choix de MétéoSuisse + SLF.

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
| **AWS Terrain Tiles** (Terrarium, Mapzen / Tilezen), relief | Jeu de données public AWS, gratuit, sans SLA | Attribution requise : Mapzen **et** les sources des modèles de terrain ([liste officielle](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) ; pour la Suisse : EU-DEM Copernicus, SRTM / GMTED de l'USGS, ETOPO1 de la NOAA), « dans un endroit raisonnable pour le support » : « Relief Mapzen » renvoie à cette liste | 2026-11-05 |
| Mapbox GL JS (branchable, **écarté**, D39) | Propriétaire | Token, quota gratuit puis facturation par chargement de carte, logo Mapbox | 2026-10 |

Crédit affiché, mode explore seulement (pas de carte en compact) : « Carte OpenFreeMap © OpenMapTiles © OpenStreetMap ·
Relief Mapzen » (`MAP_CREDITS`, `src/config/mapConfig.js`), chaque mention liée à sa page (OpenStreetMap : sa page de
copyright, demandée pour une carte interactive). Plus rien en surimpression sur la carte depuis le 05/11/2026.

Alternative si OpenFreeMap disparaît : générer les mêmes tuiles (Planetiler, schéma OpenMapTiles) en un fichier
PMTiles et les héberger nous-mêmes ; même style, même rendu, mêmes attributions OpenStreetMap (ETAT § 4.1, D54).

## Données des stations

| Source | Licence | Ce qu'on en tire | Conditions |
|---|---|---|---|
| **swisstopo** : gazetteer swissNAMES3D, service d'altitude swissALTI3D | Open data swisstopo | Lieu, canton, commune, altitudes (`resorts.json`) | Citer la source |
| **OpenSkiData** (dérivé d'OpenStreetMap) | **ODbL** | Domaines skiables, remontées, point en altitude (D51) | Attribution ; **partage à l'identique** si on publie le jeu de données dérivé (`resorts.json` en tant que base de données). L'afficher dans le widget ne déclenche pas cette obligation |
| **Wikidata** | CC0 | Site officiel de quelques stations | Aucune |
| **skiinfo.fr** | « Tous droits réservés » | **La liste des 154 stations** (noms, URL ; `data/sources/skiinfo-suisse.json`) ; coordonnées utilisées pour vérification seulement, rien de stocké | **À clarifier** : une liste de noms de stations est un fait, mais la sélection vient d'un site non libre. Option sûre : reconstituer la liste depuis OpenSkiData ou swisstopo |

Crédit affiché, dans les deux modes : « Stations : swisstopo, OpenSkiData » (`src/components/Footer.jsx`), liés à leurs
sites. Gardé en mode compact : les noms viennent de la liste, et le point en altitude (OpenSkiData) choisit la station
de neige SLF. La liste skiinfo.fr n'est pas créditée (voir ci-dessus, à clarifier).

### Contours de la Suisse (`public/data/`)

| Fichier | Source | Licence | Statut |
|---|---|---|---|
| `ch.geojson` (filtre des localités) | `mledoze/countries` | ODbL | **À vérifier** (05/11/2026) : ce n'est pas une donnée OpenStreetMap, l'attribution OSM affichée ne la couvre pas. Le fichier n'est pas dessiné (il filtre les noms de lieux du fond de carte) ; à remplacer par swissBOUNDARIES3D, comme le second |
| `ch-precise.geojson` (trame extérieure) | [`ZHB/switzerland-geojson`](https://github.com/ZHB/switzerland-geojson) | **Pas de licence** : seulement « You are free to download and use those files » dans le README (vérifié le 2026-11-02) ; origine des données non indiquée | **À remplacer** |

Alternative prévue (ETAT § 3.4) : **swisstopo swissBOUNDARIES3D** (officiel, open data), simplifié, pour les deux
fichiers.

## Liens vers les webcams

Le widget **ne montre aucune image de webcam** : il renvoie vers la page de la station (nouvel onglet). Un lien
ne demande pas d'autorisation. 118 pages officielles, 36 pages d'agrégateur (skiinfo.fr, bergfex, prowebcam, guidle)
à remplacer quand une page officielle existe (D53, D55).

### Afficher les images dans le widget (étudié le 03/11/2026, D60 : pas pour l'instant)

Décision : **le lien « Voir les webcams » reste en place** ; aucune image n'est affichée tant que les accords
ci-dessous n'existent pas. Une image de webcam appartient à son exploitant (station, remontées, office du tourisme) :
l'afficher demande son accord, un lien non. Reprendre directement les images JPG trouvées dans les pages des
stations, sans accord, est exclu.

**Qui fournit les webcams de nos stations** (repérage des fournisseurs dans le code des 135 pages webcams, le
03/11/2026 ; ordre de grandeur, une page chargée en JavaScript peut échapper au repérage) :

| Fournisseur | Stations | Dont niveau 1 | Ce qu'il faut pour afficher les images |
|---|---|---|---|
| **Roundshot** (panoramas 360°, Seitz, Suisse) | 75 | 6 sur 10 | Seitz fournit à ses clients des codes d'intégration (vignettes animées, iframes, liens directs vers les images) ; **le client décide de les partager** ([conditions de service](https://www.roundshot.com/public/upload/assets/2713/Livecam-service-conditions.pdf?fp=4), vérifié le 2026-11-03). Donc : accord de chaque station, ou accord global avec Seitz s'il en propose un (à demander) |
| **Feratel** | 13 | 2 | Feratel commercialise ses images (télévisions notamment) : contrat probable, non vérifié |
| Caméras propres (images JPG, Skaping, Panomax, Foto-webcam.eu…) | 33 | — | Accord de chaque exploitant, conditions au cas par cas |
| Rien repéré (surtout des pages d'agrégateur) | 33 | 2 | Trouver d'abord la page officielle (D53) |

**Agrégateur Windy Webcams** (une seule interface pour beaucoup de caméras ; [tarifs](https://api.windy.com/webcams/pricing),
[conditions](https://api.windy.com/webcams/terms), vérifiés le 2026-11-03) : gratuit avec images de petite taille,
chaque image liée à windy.com, adresses d'image valables 10 min, mention « Webcams provided by windy.com » ;
formule Professional à **9 990 € par an** (images en taille réelle, adresses valables 24 h). Nombre de nos stations
couvertes : non vérifié. Le gratuit ne convient pas (petite image, lecteur renvoyé vers windy.com).

**Si on y va** : (1) écrire à Seitz (Roundshot) pour un accord média, qui couvrirait la moitié des stations et 6 des
10 stations de niveau 1 ; (2) en parallèle, demander l'accord des stations de niveau 1 ; (3) les autres gardent le
lien. Fixer une règle d'affichage claire (par exemple : image pour le niveau 1 seulement) plutôt que des fiches avec
ou sans image au hasard des accords. Côté code : une vignette dans la fiche, qui renvoie vers la page actuelle ;
avec Roundshot, leur code d'intégration, peu de développement.

## Code, polices, icônes

| Ressource | Licence | Remarque |
|---|---|---|
| React, React DOM, Vite, Tailwind CSS | MIT | — |
| MapLibre GL JS | BSD-3-Clause | — |
| Mapbox GL JS (dépendance, non utilisée par défaut) | Propriétaire (conditions Mapbox) | Chargé seulement si `VITE_MAP_ENGINE=mapbox` |
| Font Awesome Free 6 | Icônes CC BY 4.0, polices SIL OFL 1.1, code MIT | L'attribution est portée par les fichiers du paquet |
| Pictos météo (`src/assets/pictos-meteo/`, livrés le 03/11/2026) | Dessins originaux, « usage commercial libre, sans attribution » (en-tête de `meteo-icons.js`) | Remplacent les pictos Font Awesome pour la météo ; les pictos MétéoSuisse restent protégés et ne sont pas repris |
| Inter Variable (`public/fonts/`) | SIL OFL 1.1 | — |
| Blick Variable (`public/fonts/`) | **Police propriétaire de Blick** | Réservée aux produits Blick ; ne pas la réutiliser ailleurs (projets perso du VPS compris) |
| `base.css`, `iframeHeightAdjustment.js` | Ressources internes Blick | Copies locales de secours seulement |

## Le VPS pegasus

Le VPS ne change rien aux licences : il relaie les données sans les modifier et sert un fichier aux lecteurs.
Il ne fait que réduire les appels aux sources (un relevé par heure au lieu d'un appel par lecteur), ce que demandent
aussi les conditions du SLF.

## Mise à jour de ce fichier

À chaque nouvelle source ou changement de fournisseur : ajouter une ligne, avec la date de vérification et un lien
vers les conditions ; adapter les crédits affichés (`weatherConfig.js`, `mapConfig.js`, `Footer.jsx`) ; consigner la
décision dans `ETAT-DU-PROJET.md`.
