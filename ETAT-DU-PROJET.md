# État du projet — Carte interactive des domaines skiables (Blick)

> Document mémoire. À mettre à jour à chaque build (voir § « Règles de mise à jour »).
> Dernière mise à jour : 2026-11-03 (session 7) — météo de production : **MétéoSuisse + SLF** (D59), relevé horaire sur le VPS pegasus, `https://ski.citcatlab.ch/weather.json` (D57) ; paramètres d'URL `mode`, `points`, `point` (D58) ; `LICENCES.md` ; widget fondu dans l'article (D62).

---

## 1. Résumé

Widget cartographique embarqué en `<iframe>` sur blick.ch. **C'est avant tout un accès aux webcams des stations de ski suisses** (D50) : la carte montre les stations avec la météo **du village** (actuelle et sur 3 jours, D61), et la fiche de chaque station renvoie vers **sa page webcams**. La démarche du lecteur : voir la météo de la station, puis aller voir les webcams.

- **Stack cible** (product.md) : React + Vite + Tailwind CSS v4. Réutilise `public/css/base.css` (tokens, clair/sombre) et `public/js/iframeHeightAdjustment.js` (auto-resize + sync du thème), chargés depuis `https://utils.blick.ch` / `https://www.blick.ch` avec fallback local dans `index.html`.
- **Largeurs d'iframe à supporter** (embed) : **964 px** (largeur max du widget), **632 px** (largeur classique d'une colonne d'article ou d'un slot en homepage / page de rubrique), **mobile < 400 px**.
- **Langue de l'UI** : français. Ton Blick : tutoiement (« Essaie un autre nom », « Zoome… »).
- **Design system** : Blick Design System (couleurs, typo Blick Variable + Inter Variable, composants Button / IconButton / Tag).
- **Référence de design** : `reference/SkiMap4.dc.html` (tour 5 du prototype). C'est la version validée. Spécification détaillée : [`docs/SPEC.md`](docs/SPEC.md).
- **État** : widget implémenté, fidèle à la référence aux trois largeurs. **154 stations réelles** (D44), chacune avec sa page webcams (D53) et sa météo au village (D61). Prévision **MétéoSuisse** (open data) et enneigement mesuré par le **SLF**, utilisables commercialement (D59), relevés chaque heure sur le VPS pegasus et servis en fichier (D57). Restent ouverts : hébergement des tuiles (D54), deux licences à clarifier (liste skiinfo, contour `ZHB`, `LICENCES.md`), design des vues compacte et « stations suivies » (D58), publication du widget sur le FTP, images de webcams dans la fiche (D60, pas pour l'instant).

---

## 2. Décisions prises (validées par le product owner)

### 2.1 Représentation sur la carte
| # | Décision | Pourquoi |
|---|---|---|
| D1 | **Pastilles** (« nom » + « picto météo · température »), pas de simples points. | Un point par domaine, même exhaustif, parasite la lecture. La carte doit donner une **tendance**, l'exhaustivité est dans la liste. |
| D2 | **Domaines principaux toujours visibles** (≈ 8–10, « stations de niveau 1 », `level: 1`). | Ancre la lecture à l'échelle Suisse. |
| D3 | **Domaines secondaires révélés uniquement par le zoom** : niveau 2 dès z 7,6, niveau 3 dès z 8,6 ; **+0,6** en 632 px et mobile. Ils n'apparaissent que s'il reste de la place (pas de chevauchement avec une pastille déjà posée). | Révélation progressive, sans casser la lecture. |
| D4 | **Pas de badge « +N »** pour indiquer des domaines masqués. | Refusé : il suggère des éléments non affichés. |
| D5 | **Survol et sélection ne font JAMAIS apparaître une pastille.** Un domaine secondaire sélectionné depuis la liste apparaît grâce au **vol de carte** (zoom ≥ 9,2 ; 9,8 pour une station de niveau 3), et passe alors en priorité de placement. | L'affichage ne doit pas « sauter » au survol. |
| D6 | **Pas de mélange de formes selon le zoom** (pas de points → pastilles). Une seule forme. | Refusé en tour 1 : effet peu qualitatif. |
| D7 | Les **domaines principaux ne disparaissent jamais** : s'ils se touchent, ils **s'écartent** (relaxation en espace écran), ils ne se masquent pas. | Stabilité. |
| D8 | **Pastille sur 2 lignes**, entièrement arrondie (pill), **sans bordure**, avec une **ombre portée diffuse**. **Survol** = fond gris très clair. **Sélection** = fond rouge Blick, texte blanc. | Prend moins de place en largeur, look premium. |
| D9 | **Nom court sur la carte** (`short`) : « Davos » au lieu de « Davos Klosters », etc. La liste et la fiche gardent le nom complet. | Encombrement horizontal. |
| D10 | En 632 px et mobile à l'échelle Suisse (z < 7,4) : pastille **compacte une ligne** (picto · température, sans nom). En 964 px : toujours avec le nom. | Densité. |
| D11 | **Fondu d'apparition/disparition** : opacité 0→1 et scale 0,85→1 en ~200 ms (ease-out cubique). Délai de 220 ms avant disparition. **Hystérésis** de 0,15 de zoom. Les pastilles déjà visibles sont prioritaires. Pas de fondu au premier affichage. | Plus fluide, sans clignotement près des seuils. |

### 2.2 Fond de carte
| # | Décision |
|---|---|
| D12 | Fond **clair et neutre** (style « Positron ») + **relief ombré** discret (exaggeration 0,3). |
| D13 | **Labels en français** : `coalesce(name:fr, name)` sur toutes les couches de symboles. |
| D14 | **Noms de pays masqués**. **Localités hors de Suisse masquées** (filtre `within` le polygone CH). |
| D15 | **Berne** a la même typo que les autres villes (pas de style « capitale », pas d'étoile). |
| D16 | Localités suisses **atténuées** (`#A5A1A1`, halo blanc 1,2 px) pour ne pas concurrencer les données. |
| D17 | **Trame sombre à l'extérieur de la Suisse** : noir `#121010` à **13 %**, sous les labels. Contour précis exigé (voir § 4.3). |
| D18 | **Pas de trait de frontière ajouté** (testé puis rejeté : trop visible). **Pas de voile blanc** (testé, rejeté : ajoute de la confusion). |
| D19 | **Gestes coopératifs** (Ctrl/⌘ + molette, 2 doigts sur mobile) activés par défaut, désactivables. La carte ne doit pas capturer le scroll de l'article. |
| D20 | Pas de rotation ni d'inclinaison (`dragRotate`, `pitchWithRotate`, `touchPitch` = false). `maxBounds` ≈ Suisse élargie. |

### 2.3 Panneau latéral (liste + fiche)
| # | Décision |
|---|---|
| D21 | **Un seul panneau** pour la recherche et le focus. Au focus, le contenu **glisse vers la gauche** et la fiche entre par la droite (track 200 %, `translateX(-50%)`, 340 ms `cubic-bezier(.2,.7,.2,1)`). Le bouton « ← Tous les domaines » fait le mouvement inverse. **Plus de panneau flottant sur la carte.** |
| D22 | **Pas de chips de filtre par canton.** La recherche porte sur le nom, le nom du canton (« vaud ») et le code (« VD »). |
| D23 | **Ligne de liste** : nom du domaine à gauche, « Canton · XX » à droite. **Pas de météo dans la liste** (trop tôt). Padding vertical de 14 px (12 px dans la zone mobile réduite). |
| D24 | ~~Tri : « Neige 3 j » (défaut) / « A–Z ».~~ **Remplacée le 05/11/2026** : liste du mode explore en ordre alphabétique, sans boutons de tri ; plus de code du canton en bout de ligne. |
| D25 | **Survol d'une ligne** = met en évidence la pastille si elle est déjà visible (fond gris). Sans plus. |
| D26 | **Retour / fermeture** (« Tous les domaines », croix, fermeture de la fiche mobile) : la carte **revient à la vue initiale** (fit Suisse) par un vol animé. |
| D27 | **Sélection** : `flyTo` animé (speed 1,1, curve 1,5) vers le domaine, zoom ≥ 9,2. En 632 px, offset `[156, 0]` pour ne pas passer sous le panneau. |

### 2.4 Layouts par largeur
| Largeur | Layout |
|---|---|
| ≥ 860 px (« wide », cible 964 = largeur max) | Comme « mid » depuis le 12/11/2026 (avant : panneau fixe de 312 px à gauche) : carte pleine largeur, panneau superposé replié par défaut, ouvert par « Liste · N » ou une station choisie. Carte 3:2 (643 px de haut à 964 px ; 4:3 un moment le 13/11/2026). Au-delà de 964 px, le widget reste à 964 px, centré (D38). |
| 520–859 px (« mid », cible 632 : colonne d'article, slot homepage / rubrique) | Carte pleine largeur. Bouton noir « Liste · N » en haut à gauche. Panneau **superposé** de 300 px (radius lg, ombre menu), qui glisse depuis la gauche. Choisir une pastille ouvre le panneau directement sur la fiche. Croix = ferme + désélectionne + recadre. Carte 3:2 (421 px à 632 px). |
| < 520 px (« mobile », cible < 400) | Carte 4:3 (270 px à 360 px) + 61 px ; jusqu'au 13/11/2026, hauteur fixe de 393 px et carte de 249 px comme `bl-iframe-traffic`. **La carte occupe toute la zone** ; un **panneau bas** unique se pose dessus (maquettes 8a, 8c, 8d, 13/11/2026) : recherche en attente (68 px : champ + bouton liste), recherche ouverte (à la hauteur de la fiche ; compteur et liste ; toucher la carte au-dessus referme), fiche station (≈ 238 px). La hauteur du panneau s'anime d'un contenu à l'autre ; celle du widget ne bouge pas. Boutons +/− masqués (le pincement suffit), « Afficher toute la Suisse » conservé, y compris recherche ouverte. |

> La largeur est mesurée par un ResizeObserver sur la racine de l'app (`useWidth`), qui occupe toute la largeur de l'iframe : c'est donc la largeur de l'iframe. Depuis le 13/11/2026, la zone de carte fait 2/3 de cette largeur en 964 / 632 px et 3/4 en mobile (`mapHeight`, + 61 px en mobile, `MOBILE_EXTRA_HEIGHT`) ; le widget prend la hauteur de son contenu, transmise au parent par `iframeHeightAdjustment.js` (avant : hauteur fixée par mode, 600 / 540 / 393).

### 2.5 Décisions d'implémentation (v0.6.0, prises par Claude Code — à valider)
| # | Décision | Pourquoi |
|---|---|---|
| D28 | **Stack** : React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), MapLibre GL 5, Font Awesome 6 Free (npm). JavaScript, pas TypeScript (comme le scaffold d'origine). | Conforme au product.md ; versions courantes. |
| D29 | **Moteur de carte configurable** : `VITE_MAP_ENGINE=maplibre` (défaut) ou `mapbox`. Le moteur est chargé en import dynamique, celui qui n'est pas utilisé n'est jamais téléchargé. Style, token, attribution, seuils centralisés dans `src/config/mapConfig.js`. | Fournisseur non tranché (§ 4.3) : bascule sans toucher au code. |
| D30 | **La carte est créée quand elle approche de l'écran** (IntersectionObserver, marge 200 px) **et n'est plus détruite** quand elle en sort (contrairement au prototype). | Une seule carte en prod ; la recréer à chaque passage multiplierait les chargements facturés. |
| D31 | **Météo lue uniquement depuis `weather.json`**, aucun appel Open-Meteo depuis le navigateur, même en repli. Fichier absent ou invalide → « Météo indisponible » (pastille rouge dans l'en-tête), pastilles « – ». | Respecte § 3.3 ; pas d'appel par lecteur. |
| D32 | ~~**Dataset** : `resorts.sample.json` (placeholders marqués) ; `resorts.json` le remplace automatiquement dès qu'il existe.~~ **Remplacée par D44 et D48.** | Données réelles séparées des exemples, sans changement de code. |
| D33 | ~~**Mode densité** derrière `?density=stress`.~~ **Remplacée par D48** (supprimé : 154 stations réelles suffisent à éprouver le placement). | Outil de vérification du placement ; ne doit jamais apparaître par défaut. |
| D34 | **Composants DS reproduits localement** (`components/ui/Button`, `IconButton`) et tokens `--radius-*`, `--shadow-menu` **approximés** (pill, 8 px, 12 px, ombre douce). | Le bundle du Blick Design System (`_ds/`) n'était pas accessible (MCP claude_design non disponible dans cette session). À aligner sur les vraies valeurs DS. |
| D35 | **Palette Tailwind désactivée** (`--color-*: initial`) ; les utilitaires pointent vers les variables sémantiques de `base.css` (`text-ink`, `bg-surface`, `border-line`…). | Les `--color-red-500`… de Tailwind auraient écrasé les primitives Blick du même nom. |
| D36 | **Textes des gestes coopératifs en français** (« Utilise Ctrl + molette pour zoomer »…), clés MapLibre et Mapbox. | UI entièrement en français. |
| D37 | « Site officiel » est un **lien** (`<a target="_blank" rel="noopener">`), pas un bouton qui appelle `window.open`. Accord du compteur au singulier (« 1 domaine »). | Accessibilité, clic milieu, typographie. |
| D38 | **Largeur max 964 px** : la racine est plafonnée et centrée (`max-width: 964px`). **Seuils à mi-chemin entre les cibles** (860 et 520) plutôt qu'aux cibles elles-mêmes : une iframe un peu plus étroite que sa colonne reste en layout 632, et les grands téléphones (412–440 px) restent en mobile. | Trois largeurs d'embed : 964 (max), 632, < 400. Un seuil à 400 aurait fait basculer un téléphone de 412 px dans le layout 632. |

### 2.6 Décisions du 2026-10-05 (session 2)
| # | Décision | Pourquoi |
|---|---|---|
| D39 | **Fournisseur de carte : MapLibre + OpenFreeMap (Positron) + relief AWS Terrarium**, c'est-à-dire ce qui est en place. Retenu avec le product owner. Mapbox reste branchable (`VITE_MAP_ENGINE`) mais n'est plus une cible. | Gratuit, sans clé, sans limite de vues, usage commercial autorisé (OpenFreeMap, licence MIT). Risque : **pas de SLA** (service tenu par une personne, financé par dons) → plan B sans changer de moteur : auto-héberger les tuiles OpenFreeMap / PMTiles. |
| D40 | **« Stations de niveau 1 »** (nouveau nom du `tier: 1`) : une **dizaine de stations principales** affichées dès l'état de base pour que la carte ne paraisse jamais vide, avec leurs conditions. Critère : notoriété et taille, **réparties sur les grandes régions de ski** (Valais, Alpes vaudoises, Oberland bernois, Suisse centrale, Grisons, Suisse orientale). **Sélection validée par le product owner (session 3)** : Zermatt, Verbier, Villars - Gryon, Gstaad, Grindelwald - Wengen, Engelberg, Laax, Davos Klosters, St. Moritz (au lieu d'« Engadin St. Moritz », supprimé comme doublon, D45), Flumserberg - Heidiland. Le Tessin n'a pas de station de niveau 1. | Demande du product owner. Niveaux 2 et 3 : D46. |
| D41 | **Vocabulaire et schéma** : le champ `tier` devient `level` (code, JSON, docs) ; on parle de « stations de niveau 1 / 2 / 3 ». | Aligné sur le vocabulaire du projet. |
| D42 | **Liste réelle des stations : skiinfo.fr** (`/suisse/stations-de-ski`), capturée dans `data/sources/skiinfo-suisse.json` (156 stations, nom + URL skiinfo) par `scripts/fetch-skiinfo-list.mjs`. C'est la base du dataset du widget (D44). | Choix du product owner. |
| D43 | **Attributions complètes** (mise à jour du 05/11/2026 : toujours dans le pied de page, plus de surimpression sur la carte, à toutes les largeurs) : « OpenFreeMap © OpenMapTiles © OpenStreetMap · Relief Mapzen ». En 964 px dans le pied de page ; **sous 964 px, en surimpression en bas à droite de la carte** (le pied de page n'avait pas la place). Crédit météo court : « Météo : Open-Meteo / MétéoSuisse ». | Exigé par OpenFreeMap / OpenMapTiles et par les tuiles de relief (Mapzen) ; « © OpenStreetMap » seul était insuffisant et était tronqué en 632 px. |

### 2.7 Décisions du 2026-10-05 (session 3)
| # | Décision | Pourquoi |
|---|---|---|
| D44 | **154 stations réelles sur la carte** (`src/data/resorts.json`, généré par `npm run resorts`). **Coordonnées = lieu de la station** (village, ou gare de départ quand la station porte le nom d'un domaine : Glacier 3000 → Col du Pillon, Aletsch Arena → Riederalp…), pris dans le **gazetteer officiel swisstopo (swissNAMES3D)** ; canton et commune lus sur le même objet ; altitude du point par le service d'altitude swisstopo. Les choix de lieu sont consignés dans `data/sources/stations-mapping.json`. Ces coordonnées sont figées. | Demande du product owner (« source la plus fiable »). OpenSkiData seul ne convient pas pour les coordonnées : il **fusionne les domaines reliés** (4 Vallées, Portes du Soleil, Zermatt-Cervinia…) et donnerait le même point à Verbier, Nendaz, Veysonnaz… L'emplacement skiinfo n'a servi qu'à **vérifier** chaque lieu retenu (pas stocké). |
| D45 | **Doublons supprimés, aucun regroupement** : on retire « Gstaad - Saanen - Rougemont » (on garde « Gstaad ») et « Engadin St. Moritz » (on garde « St. Moritz »). Toutes les autres entrées skiinfo restent des stations distinctes, même si leurs domaines sont reliés (Verbier, Nendaz, Veysonnaz, Thyon, La Tzoumaz ; Champéry, Morgins, Les Crosets ; Saas Fee, Saas-Grund, Saas Almagell, Saas Balen ; Glacier 3000 / Les Diablerets…). « Mythenregion » (Rotenflue) est distinct de « Brunni - Alpthal » et d'« Ibergeregg ». | Consigne du product owner. |
| D46 | **Niveaux 2 et 3 (provisoire)** : niveau 2 si le domaine OpenSkiData associé compte **≥ 50 km de pistes de ski alpin**, sinon niveau 3. Résultat : 10 / 19 / 125. Les stations d'un grand domaine relié héritent de ses km (ex. Veysonnaz = 4 Vallées → niveau 2). Seuil dans `scripts/build-resorts.mjs`. | Critère mesurable et ouvert, en attendant un éventuel choix éditorial. |
| D47 | ~~**« Site officiel » = site du domaine dans OpenSkiData** (tag `website` d'OpenStreetMap), ou à défaut Wikidata (P856) ; bouton masqué sans site.~~ **Remplacée par D50** : le site reste dans les données (`website`) mais le bouton mène aux webcams. | Source ouverte et traçable ; on n'invente pas d'URL. |
| D48 | **Échantillon et mode densité supprimés** (`resorts.sample.json`, `?density=stress`, drapeau `placeholder`, mention « Données d'exemple »). | Le dataset réel les rend obsolètes. |
| D49 | **Crédit des données des stations** : « Stations : swisstopo, OpenSkiData » dans le pied de page. Le pied de page **passe sur deux lignes en mobile** plutôt que de tronquer un crédit. | Attribution exigée par swisstopo (open data, source à citer) et par l'ODbL (OpenSkiData / OpenStreetMap). |

### 2.8 Décisions du 2026-10-05 (session 4)
| # | Décision | Pourquoi |
|---|---|---|
| D50 | **Le projet est un projet webcams.** Le bouton de la fiche (964 / 632 px et fiche compacte mobile) devient **« Voir les webcams »** (icône caméra `fa-video`, flèche de lien externe), et ouvre **la page webcams de la station** dans un nouvel onglet ; l'hôte de la page est affiché à côté. Le site officiel (`website`) reste dans les données, sans bouton. | Demande du product owner : l'idée de départ (conditions pour aller skier) est en fait un projet autour des webcams de ces stations. D'autres changements en découleront. |
| D51 | ~~**Conditions en altitude, pas au village.**~~ **Remplacée par D61 pour la météo (03/11/2026)** ; le `weatherPoint` sert encore à choisir la station SLF de l'enneigement. Chaque station a un `weatherPoint` = **gare d'arrivée la plus haute des remontées de la station** (remontées OpenSkiData du domaine associé à moins de 7 km du lieu de la station ; à défaut, toute remontée à moins de 3 km ; ignorée si plus basse que la station). Altitude du point par swisstopo. La météo est demandée à ce point et à cette altitude (paramètre `elevation`). La fiche affiche « à 3 828 m ». 151 stations sur 154 ; Bulle - La Chia, Château d'Oex et Riffenmatt restent au lieu de la station (pas de remontée exploitable). Gain médian : +830 m par rapport au lieu de la station. | « La démarche d'un utilisateur sera d'aller voir les conditions / webcams en haut, pas au village. » Les webcams sont en général en haut des remontées. |
| D52 | **Stations de niveau 1 dans `src/data/stations-niveau-1.json`** : une simple liste d'identifiants (champ `id` de `resorts.json`), lue au chargement. Pour changer la sélection, on édite ce fichier, **sans relancer de script**. Un identifiant inconnu est signalé dans la console en développement. `level` dans `resorts.json` ne vaut plus que 2 ou 3 (D46). | Demande du product owner : sélection modifiable facilement dans la donnée. |
| D53 | **Pages webcams des 154 stations**, consignées dans `data/sources/stations-mapping.json` (`webcams`, `webcamsSource`, `webcamsGroup`). Recherche : crawl du site de chaque station (liens « webcam », « livecam »… et chemins courants `/fr/webcams`, `/webcams`…), puis sites officiels connus pour les autres ; chaque page retenue est vérifiée (HTTP 200, HTML, mentions de webcams, nom de la station quand on a dû deviner le site) ; version française quand elle existe. Après la session 5 : **118 pages officielles** et **36 pages d'agrégateur** (surtout skiinfo.fr, aussi bergfex, prowebcam, guidle) faute de page officielle trouvée. Choix entre page propre et page partagée : D55. | Couverture complète tout de suite, avec une source traçable par station ; les pages d'agrégateur sont à remplacer au fil de l'eau (liste au § 3.5). |
| D54 | **Hébergement des tuiles : question laissée ouverte**, on garde OpenFreeMap (D39). | Décision du product owner (session 4). |
| D55 | **Règle des pages webcams partagées (validée par le product owner, session 6).** Pour chaque station, dans cet ordre : **(1)** la page webcams **propre à la station** (site de la station, de ses remontées ou de son office du tourisme local) ; **(2)** sinon, la page webcams **officielle partagée** du domaine relié, de la société de remontées ou de la destination touristique dont la station fait partie, **à condition qu'elle montre les webcams de la station** (vérifié en cherchant le nom de la station ou de ses secteurs dans la page) ; **(3)** sinon, la page de la station sur un agrégateur. Conséquences : plusieurs stations peuvent avoir **le même lien** ; elles portent alors le même `webcamsGroup` (nom du domaine ou de la destination) ; une station qui a sa propre page la garde même si son domaine est relié (Verbier, Nendaz, Veysonnaz, Thyon et La Tzoumaz ont chacune la leur ; Torgon a la sienne alors que Champéry, Morgins et Les Crosets partagent celle de la Région Dents du Midi). `npm run resorts` **échoue** si une URL est partagée sans groupe commun, ou si une station a un groupe sans partager sa page. Les 12 groupes : § 3.5. | Demande du product owner : un lien identique pour plusieurs entrées est logique quand une page regroupe les webcams de plusieurs stations, à condition que la logique soit claire et documentée. |
| D56 | **Open-Meteo : le service public et le logiciel n'ont pas la même licence.** La restriction « non commercial » (et donc l'exclusion des sites avec publicité) s'applique **uniquement à l'API gratuite hébergée par Open-Meteo** (open-meteo.com), parce que ce sont **leurs serveurs** : ce sont les conditions d'utilisation de leur service. En **auto-hébergement**, on n'utilise pas leur service mais (a) leur **logiciel**, sous licence **AGPL-3.0**, qui n'interdit aucun usage commercial, et (b) leurs **données**, sous licence **CC BY 4.0** (vérifié dans le dépôt `open-meteo/open-data`), qui autorise l'usage commercial avec attribution ; les données d'origine de MétéoSuisse sont elles-mêmes en open data. Leur documentation le dit explicitement : « Self-hosting is available for non-commercial and commercial use ». **Blick peut donc utiliser Open-Meteo auto-hébergé pour ce projet, publicité comprise.** Obligations : citer Open-Meteo et MétéoSuisse (déjà fait dans le pied de page) ; si on modifie le code et qu'on le sert à des utilisateurs sur le réseau, publier nos modifications (sans modification : rien à publier). | Question du product owner (session 6) sur l'apparente contradiction entre § 4.4 et § 4.6. |

### 2.9 Décisions du 2026-11-02 (session 7)
| # | Décision | Pourquoi |
|---|---|---|
| D57 | **Relevé météo sur le VPS pegasus** (celui de `bl-iframe-traffic` ; usage par ce projet : [`docs/VPS.md`](docs/VPS.md) ; doc générale du serveur : brain, `homelab/machines/pegasus/`). Un timer systemd lance `scripts/fetch-weather.mjs` **chaque heure à hh:15** (hh:05 jusqu'au 03/11/2026 : trop tôt pour le relevé MétéoSuisse de l'heure ; décalage fixe ≤ 60 s, relevé manqué rattrapé au démarrage) ; le script écrit `/srv/bl-iframe-map-ski/data/weather.json` (atomique) ; Caddy le sert sur **`https://ski.citcatlab.ch/weather.json`** (cache 5 min + `stale-while-revalidate` 10 min + `stale-if-error` 24 h, CORS ouvert, gzip/zstd, 404 pour tout autre chemin). Pas de processus permanent ni de port : service oneshot sous l'utilisateur `skimap`, écriture limitée à `data/`. Le widget compilé lit cette adresse (`.env.production`) ; `npm run dev:vps` aussi (`.env.vps`). Fichiers : `deploy/` ; mise en ligne : `deploy/deploy.sh`. | Un seul appelant d'Open-Meteo (≈ 154 appels par heure, quel que soit le trafic) ; fichier identique pour tous les lecteurs, donc rien à calculer par requête. Conventions du VPS en service (sous-domaine par projet, `sites/<projet>.caddy`, journal d'accès, déploiement par SSH depuis le Mac) plutôt que le plan `PLAN-ECOSYSTEME.md` du projet trafic, jamais déployé. |
| D58 | **Paramètres d'URL calqués sur `bl-iframe-traffic`** : `?mode=compact` (quelques lignes sans carte ni interaction, hauteur selon le contenu, 6 stations au plus triées par neige 3 j, deux colonnes dès 480 px, pied « N autres stations » + « Tout voir » vers `?seeAllUrl=`, crédits sans la carte ; par défaut : stations de niveau 1) ; `?points=a,b\|c,d` (**stations suivies** : dans les deux modes, le widget se limite à ces stations ; en explore, elles passent au niveau 1, donc toujours visibles sur la carte ; `\|` = colonnes du compact) ; `?point=id` (fiche ouverte d'emblée en explore, carte cadrée dessus dès son chargement). Valeurs inconnues ignorées avec un avertissement en console. `?track=` (suffixe du nom suivi en analytics) depuis le 13/11/2026, avec le suivi d'audience (README § Suivi d'audience). **Design des vues à faire** : la vue compacte reprend pour l'instant les éléments existants (nom, canton, picto, température, neige 3 j). | Demande du product owner (session 7) : même système que le widget trafic, pour intégrer l'iframe en haut de rubrique ou sur une sélection de stations. `?points=` étendu au mode explore : « vue compacte et/ou stations limitées », deux réglages indépendants. |
| D59 | **Météo de production : MétéoSuisse + SLF** (remplace l'API publique d'Open-Meteo, non commerciale). **Prévision** : MétéoSuisse, prévisions locales (open data, CC BY 4.0, « Source : MétéoSuisse ») ; pour chaque station, **un seul** point de prévision (pas de village + sommet, jugé confus par le product owner le 03/11/2026), le plus proche de son `weatherPoint` (**remplacé par le lieu de la station, D61**) en distance + écart d'altitude (100 m comptent comme 1 km), parmi les 5 820 points (631 points de montagne, 1 118 stations, 4 071 NPA) : médiane 2,3 km et 124 m d'écart, 90 % sous 6,9 km et 506 m (03/11/2026) ; 116 stations ont ainsi une prévision plus proche du haut que du village, 35 plus proche du village (pas de point MétéoSuisse en haut), 3 sans point en haut. Le nom du point est affiché dans la fiche. Données : température et vent de l'heure, pictogramme du créneau de 3 h en cours, pictogramme, max, min et précipitations des 3 jours (heure suisse). Les pictogrammes MétéoSuisse étant protégés, leur numéro est traduit en nos familles (`sky`). **Enneigement** : SLF, stations IMIS (`daily-snow`, CC BY 4.0, lien vers slf.ch obligatoire), réseau de mesure des avalanches, terrain plat, en général 2 000–3 000 m, souvent hors des domaines ; station la plus proche (distance + écart d'altitude, 200 m = 1 km), à 25 km au plus (médiane 5,9 km), sinon pas de donnée (5 stations du Jura et de l'Appenzell) ; hauteur de neige et **neige fraîche des 3 derniers jours** (mesure et modèle SNOWPACK du SLF, pas prévision ; neige naturelle, pas l'état des pistes). **Plus de neige prévue par jour** : MétéoSuisse ne la publie pas et on ne l'estime pas (données réelles seulement) ; les jours affichent les précipitations. Le tri « Neige 3 j » suit la neige fraîche mesurée, puis la hauteur de neige. Choix des points refait à chaque relevé. MeteoNews (fournisseur de Blick) : pas d'actualité (réponse du 03/11/2026). | Demande du product owner (session 7) : passer à une source utilisable commercialement, sans budget. Seules sources gratuites et commerciales qui couvrent à la fois la prévision en montagne et la neige réellement au sol. |
| D60 | **Webcams : le lien reste, pas d'images dans le widget pour l'instant** (product owner, 03/11/2026). Afficher les images demande l'accord de chaque exploitant. Repérage du 03/11/2026 : **Roundshot** pour 75 stations (6 des 10 de niveau 1), **Feratel** 13, caméras propres 33, rien repéré 33. Piste si on y revient : accord média avec Seitz (Roundshot), accord des stations de niveau 1, règle d'affichage claire ; Windy Webcams écarté (gratuit trop limité, Pro 9 990 €/an). Détail : `LICENCES.md`, § Liens vers les webcams. | Un lien ne demande aucune autorisation ; les accords prennent du temps et la couverture serait inégale. |
| D63 | **Pastilles : picto à gauche, nom et « min / max » du jour** (product owner, 05/11/2026). L'essai `?pill=minmax` devient la pastille par défaut et le paramètre disparaît : picto du moment 22 px à gauche, centré sur les deux lignes, nom puis « min / max » du jour au village (`days[0]`) ; pastille compacte : picto 16 px et « min / max ». Mesures : `docs/SPEC.md`. | Picto plus lisible ; min / max du jour comparable à ce que montre MétéoSuisse. |
| D62 | **Mode compact = la météo du week-end** (product owner, 05/11/2026). Titre « La météo du week-end en station » ; par station, deux pictos, un par jour (samedi, dimanche) avec max / min, plutôt qu'un picto de synthèse qui mentirait sur l'un des deux jours ; le dimanche, ce dimanche seul, le week-end suivant à partir de minuit dans la nuit du dimanche au lundi. Neige : la neige au sol mesurée, « au sol » (« au sol actuellement » jusqu'au 05/11/2026, trop long) (pas de neige prévue : MétéoSuisse ne la publie pas, on ne l'estime pas). Le relevé publie 7 jours. Tri et réglages d'affichage : à voir plus tard. | Le mode compact répond à « quel temps ce week-end dans ces stations ? », pas à « quel temps maintenant ». |
| D61 | **Météo du village, plus aucune température en altitude** (product owner, 03/11/2026). La prévision MétéoSuisse (température, ciel, vent, 3 jours) est prise au point le plus proche du **lieu de la station** (village ou gare de départ, D44 ; distance + écart d'altitude / 100 m) : médiane 0,2 km et 12 m d'écart. Partout : pastilles, fiche, liste, vue compacte. Remplace D51 pour la météo ; le `weatherPoint` ne sert plus qu'à choisir la station SLF de l'enneigement (stations IMIS en altitude, proches du domaine). | Zermatt affichait −12° (point du Klein Matterhorn, 3 826 m) quand MétéoSuisse donne « −2 / 7 » pour le village : le lecteur compare avec ce qu'il connaît. Il devine seul qu'il fait plus froid en haut. |
| D62 | **Fondu dans l'article** (réglages repris de `bl-iframe-traffic`) : ni cadre, ni marge en haut ou sur les côtés pour l'en-tête, la liste compacte et les crédits ; le pied grisé et le contenu du panneau gardent leurs marges. Racine sans bordure ni arrondi dans les deux modes ; hauteurs fixes inchangées, la place gagnée sur l'en-tête revient à la carte. Barres de défilement : `::-webkit-scrollbar` sans condition (Chrome, Edge, Safari, Opera, Samsung Internet), `scrollbar-width` / `scrollbar-color` sous `@supports not selector(::-webkit-scrollbar)` (Firefox seul). | Intégration invisible dans les articles Blick. Chrome ≥ 121 et Safari ≥ 18.2 ignorent `::-webkit-scrollbar` dès que `scrollbar-width` est posé : Safari affichait une barre native non colorée, Chrome sous Windows sa barre native. |

---

## 3. Données — structure

### 3.1 Statut actuel : **154 stations réelles en place**
- Le product.md impose : **ne jamais inventer** de faits (noms, cantons, météo, liens).
- `src/data/resorts.json` : **154 stations** (156 de la liste skiinfo − 2 doublons, D45). Coordonnées, canton, commune et altitude du lieu : swisstopo (D44). Point en altitude (`weatherPoint`, sert au choix de la station SLF depuis D61) : remontées OpenSkiData + altitude swisstopo (D51). Page webcams : D53. Domaine skiable, km de pistes, remontées, altitudes min/max, site officiel : OpenSkiData. Niveaux : D52 (niveau 1), D46 (2 et 3) ; à l'affichage : 10 / 19 / 125.
- Pipeline : `data/sources/skiinfo-suisse.json` (liste) + `data/sources/stations-mapping.json` (choix à la main) → `npm run resorts` → `src/data/resorts.json` (versionné, figé).
- Noms affichés = noms skiinfo tels quels (« Saas Fee », « Crans Montana », « St Cergue » : orthographe skiinfo, pas l'officielle). À corriger dans le mapping si la rédaction le souhaite.

### 3.2 Schéma — `src/data/resorts.json` (statique, généré par `npm run resorts`)
```jsonc
[
  {
    "id": "verbier",                 // slug skiinfo, stable et unique
    "name": "Verbier",               // nom skiinfo (liste, fiche)
    "short": "Verbier",              // nom court pour la carte
    "canton": "VS",                  // code canton (swisstopo)
    "commune": "Val de Bagnes",      // commune (swisstopo)
    "lat": 46.09986, "lng": 7.2263,  // lieu de la station (swisstopo swissNAMES3D)
    "elevation": 1510,               // altitude du lieu, m (swisstopo)
    "weatherPoint": {                // haut du domaine (D51), sert à l'enneigement (D61) : gare d'arrivée la plus haute, ou null (3 stations)
      "lat": 46.08008, "lng": 7.31826, "elevation": 3300, "lift": "Mont-Fort"
    },
    "level": 2,                      // 2 ou 3 calculé (D46) ; le niveau 1 vient de stations-niveau-1.json (D52)
    "webcams": "https://www.verbier.ch/pratique/live/webcams/", // page webcams (D53), cible du bouton
    "webcamsSource": "officiel",     // officiel | agregateur
    "webcamsGroup": null,            // nom du groupe quand la page est partagée (D55), sinon null
    "website": "http://www.4vallees.ch/", // site du domaine (OpenSkiData / Wikidata) ou null ; pas affiché
    "place": "Verbier (VS) - Val de Bagnes", // objet swisstopo retenu
    "area": {                        // domaine OpenSkiData associé, ou null (5 stations)
      "name": "4 Vallées – Verbier/La Tzoumaz/Nendaz/Veysonnaz/Thyon", "osdId": "…",
      "runsKm": 175, "lifts": 77, "minElevation": 905, "maxElevation": 3301, "wikidata": null
    },
    "skiinfo": "https://www.skiinfo.fr/valais/verbier/station-de-ski"
  }
]
```
- **Champs confirmés** (product.md) : nom, canton, météo, lien — le lien est désormais la **page webcams** (D50).
- **Champs ajoutés par nos décisions** : `id`, `short`, `lat/lng`, `elevation`, `weatherPoint`, `level`, `commune`, `webcams`, `webcamsSource`, `webcamsGroup`, `website`, `area`, `skiinfo`.
- **Non définis, ne pas inventer** : prix, remontées ouvertes, enneigement déclaré.
- **Niveau 1** : D40, D52 (`src/data/stations-niveau-1.json`). **Niveaux 2 et 3** : D46 (provisoire).
- Table des 26 cantons (libellés FR) : `src/data/cantons.js`.
- Inspiration de format : `data_police.json` du projet frère `bl-tool-timeline-r`.

### 3.3 Météo — `weather.json` (dynamique, **séparé** des données statiques)
**Fonctionnement complet, format du fichier et sens de chaque valeur affichée : [`docs/METEO.md`](docs/METEO.md)** (source de vérité, tenue à jour à chaque changement ; règle n° 6 ci-dessous). En résumé :
- Produit chaque heure (hh:15) sur le VPS pegasus par `scripts/fetch-weather.mjs` (D57), servi sur `https://ski.citcatlab.ch/weather.json` ; le navigateur ne lit que ce fichier (le prototype appelait Open-Meteo depuis le navigateur : non reproduit).
- Prévision MétéoSuisse au point de prévision le plus proche du lieu de la station, le village (D59, D61) ; enneigement SLF à la station IMIS la plus proche : **neige au sol mesurée** (dernière mesure, toutes les 30 min) et **neige tombée en 3 jours estimée** par le modèle du SLF.
- Par station : `t`, `sky`, `wind`, `elevation`, `point`, `days[]` (`sky`, `max`, `min`, `precip`), `snow` (`hs`, `hsAt`, `hn3`, `date`, `station`, `elevation`, `km`) ou `null`.

### 3.4 Géodonnées
- `public/data/ch.geojson` : contour CH simplifié (533 points, source : `mledoze/countries`, ODbL). Sert au filtre `within` des localités.
- `public/data/ch-precise.geojson` : contour CH plus précis (~2 400 points, source : `ZHB/switzerland-geojson`). Sert à la trame extérieure.
- **Production** : remplacer par **swisstopo swissBOUNDARIES3D** (officiel, exact, open data), simplifié à la bonne tolérance, et dériver les deux usages du même fichier.

### 3.5 De la liste skiinfo au dataset — enrichissement (fait, D44–D47)

| Source | Ce qu'elle donne | Licence | Usage |
|---|---|---|---|
| **swisstopo, gazetteer swissNAMES3D** (SearchServer geo.admin.ch) | Lieu officiel (village, gare de départ), canton, commune | Open data swisstopo, source à citer | **Coordonnées**, canton, commune |
| **swisstopo, service d'altitude** (swissALTI3D) | Altitude d'un point | Open data swisstopo | `elevation` |
| **OpenSkiData** (tiles.openskimap.org, dérivé d'OpenStreetMap, mis à jour chaque jour) | Domaines skiables : site, ID Wikidata, km de pistes, remontées, altitudes min/max | **ODbL** : attribution, partage à l'identique du jeu dérivé s'il est publié | `area`, `url`, niveaux 2/3 |
| **Wikidata** | Site officiel (P856) | CC0 | `url` si OpenSkiData n'en a pas |
| Pages station skiinfo | Coordonnées (JSON-LD `geo`) | « Tous droits réservés » | **Vérification seulement** : chaque lieu swisstopo retenu est à moins de 6,5 km du point skiinfo (150 sur 154 à moins de 4 km ; écarts plus grands : Saanenmöser, Fideris, St Cergue, Gurnigelbad, skiinfo pointant probablement le domaine plutôt que le village), rien n'est stocké |

Limites connues :
- **Statistiques des domaines reliés** : les km et altitudes d'une station du 4 Vallées ou des Portes du Soleil sont ceux du domaine entier. Davos Klosters est rattaché à Parsenn (son plus grand secteur) ; Gstaad à Wispile.
- **5 stations sans domaine OpenSkiData fiable** : Bruson, Jakobsbad - Kronberg, Samedan, Schönengrund, Riffenmatt (`area: null`, niveau 3).
- **Point en altitude d'un domaine relié** : on prend la plus haute remontée du domaine à moins de 7 km de la station. Verbier pointe donc le Mont-Fort (3 300 m), Zermatt le Klein Matterhorn (3 828 m), Veysonnaz le Greppon Blanc (2 648 m). À ajuster à la main si la rédaction préfère le sommet de la webcam principale (prochaine étape possible : le point de la webcam elle-même).
- **36 pages webcams d'agrégateur** à remplacer quand une page officielle est trouvée : Arolla, Beatenberg, Boltigen, Bosco Gurin, Braunwald, Bruson et Val de Bagnes, Bulle - La Chia, Bumbach Schangnau, Bürchen - Törbel, Cari, Château d'Oex, Dallenwil - Wirzweli, Degersheim, Diemtigtal - Grimmialp, Disentis 3000, Ebnat - Kappel, Eriz, Fideris, Frutigen, Habkern, Jaun, Les Avants, Les Prés d'Orvin, Leysin - Les Mosses - La Lécherette, Melchsee - Frutt, Nax/Mont-Noble, Riffenmatt, Rossberg Oberwil, Rothenthurm, Sattel - Hochstuckli, Schönengrund - Appenzellerland, St. Peter - Pagig, Ste-Croix - Les Rasses, Stoos, Tschiertschen, Val Mustair.
- **Pages webcams partagées (D55)**, 12 groupes, 31 stations — chaque page a été vérifiée pour contenir les webcams de chacune de ses stations :
  - **Région Dents du Midi** (regiondentsdumidi.ch) : Champéry, Les Crosets, Morgins.
  - **Pays du Saint-Bernard** (saint-bernard.ch) : Champex-Lac, La Fouly, Vichères - Liddes.
  - **Vallée de Saas** (saas-fee.ch) : Saas Fee, Saas-Grund, Saas Almagell, Saas Balen.
  - **Val d'Anniviers** (valdanniviers.ch) : Grimentz-Zinal, St-Luc Chandolin.
  - **Villars-Gryon-Les Diablerets** (tvgd.ch) : Villars - Gryon, Les Diablerets.
  - **Gstaad Mountain Rides** (bergbahnen-gstaad.ch) : Gstaad, Saanenmöser (secteur Rinderberg).
  - **Région de la Jungfrau** (jungfrau.ch) : Grindelwald - Wengen, Mürren - Schilthorn.
  - **Parc naturel Gantrisch** (gantrisch.ch) : Gurnigelbad, Ottenleue, Rüschegg - Eywald, Schwarzenbühl - Selital.
  - **Corvatsch Diavolezza Lagalb** (corvatsch-diavolezza.ch, société de remontées) : Corvatsch, Diavolezza.
  - **Engadin** (engadin.ch, destination) : La Punt, Samedan, Zuoz.
  - **Val Surses** (valsurses.ch) : Bivio, Savognin.
  - **Viamala** (viamala.ch) : Avers, Sarn - Heinzenberg.
  - Corrections faites en appliquant la règle : Corvatsch passe de la page régionale Engadin à celle de sa société de remontées ; Saanenmöser passe de gstaad.ch (tourisme) à la page des remontées partagée avec Gstaad ; Mürren, Gurnigelbad et Schwarzenbühl quittent l'agrégateur pour la page officielle de leur région ; Mythenregion (Rotenflue), absente de la page de Brunni, reçoit la page de la destination Mythenregion.
- **URL saisonnières** : certaines pages contiennent la saison (`/winter/`, `/hiver/`) ; à revérifier à chaque changement de saison. Plus aucune URL d'été depuis le 03/11/2026.
- **Vérification des liens du 03/11/2026** : 154 stations sur 154 ont un lien (135 pages distinctes), toutes répondent (HTTP 200) et contiennent le nom de leur station ou de ses remontées (Gurnigel, Selital, Saanersloch…). Répartition : 87 pages propres à la station, 31 pages officielles partagées (12 groupes ci-dessus), 36 pages d'agrégateur. Corrigé le même jour, dans `stations-mapping.json` et `resorts.json` (même valeur, sans relancer `npm run resorts`, qui retélécharge OpenSkiData) : Ibergeregg passe de la page d'été (`/sommer/info/webcam/`) à `ibergeregg.ch/winter/infos/webcam/` (mêmes caméras) ; Thyon passe de `/ete/en-live/webcam/` à `thyon.ch/hiver/en-live-2/webcam/` (page d'hiver, plus de caméras : Roundshot Matze, Trabanta, snowpark, Les Collons, Hérémence) ; La Tzoumaz (`latzoumaz.ch/fr/webcams/`) et Wiriehorn (`wiriehorn.ch/fr/infos-pratiques/meteo-et-webcams/`) prennent l'adresse vers laquelle leur ancienne page redirigeait. Limite : contrôle par le code des pages, l'affichage réel des images n'a pas été regardé.
- Château d'Oex est rangé par skiinfo dans « Oberland bernois » : le canton vient de swisstopo (VD), pas de skiinfo.

---

## 4. Sources et API (open data / coûts) — **à arbitrer avec la chefferie**

Résumé tenu à jour, source par source (ce que la licence autorise, ce qui bloque la prod, alternatives) : [`LICENCES.md`](LICENCES.md).

### 4.1 Cartographie
| Brique | Statut | Licence / limites | Usage |
|---|---|---|---|
| **MapLibre GL JS** 5.x (proto : 4.7.1) | open source (BSD-3) | aucune limite (rendu navigateur) | **moteur retenu** (D39) |
| **OpenFreeMap** (style `positron`) | gratuit, sans clé ni limite de vues, usage commercial autorisé ; service tenu par une personne, financé par dons, **sans SLA** | données OSM **ODbL** + schéma OpenMapTiles : attribution « OpenFreeMap © OpenMapTiles © OpenStreetMap » | **tuiles retenues** (D39) |
| **AWS Terrarium** (elevation-tiles-prod, « Terrain Tiles » Mapzen/Tilezen) | dataset public AWS gratuit, sans SLA | **attribution requise** (Mapzen ; sources SRTM, USGS 3DEP/GMTED2010, NOAA ETOPO1) | relief ombré |
| **Mapbox GL JS** 3.x (demandé initialement) | **propriétaire**, quota gratuit puis facturation au chargement de carte | token requis ; logo/attribution Mapbox à afficher | branchable mais **écarté** (D39) |

- **Plan B si OpenFreeMap tombe ou ralentit** : auto-héberger les tuiles et changer `VITE_MAP_STYLE_LIGHT` / `VITE_MAP_STYLE_DARK`. Moteur, couches et pastilles inchangés.
- **Auto-hébergement (question du product owner, session 3)** : faisable **sans changer le design**. Il faut générer des tuiles au **même schéma OpenMapTiles** que celles d'OpenFreeMap (outil Planetiler, profil `planetiler-openmaptiles`, extrait OpenStreetMap couvrant `MAX_BOUNDS`, donc la Suisse et ses bords), les servir en un fichier **PMTiles** (lecture par requêtes HTTP Range, plugin `pmtiles` de MapLibre), et héberger aussi les **polices (glyphes) et sprites** du style Positron, aujourd'hui chargés chez OpenFreeMap. Le style Positron reste le même ; seules ses URLs changent. Avec un autre schéma (Protomaps), il faudrait un autre style, donc un autre rendu. Prérequis non disponibles à ce jour : **un hébergement statique avec HTTP Range** côté Blick (taille du fichier à mesurer, de l'ordre de quelques centaines de Mo à quelques Go selon l'emprise et le zoom max) et Docker ou Java 21 pour la génération (absents de la machine de développement). Mise à jour : régénérer de temps en temps (OSM évolue), pas besoin de cron.
- **Retour à Mapbox** (si un jour décidé) : `VITE_MAP_ENGINE=mapbox`, styles Studio (clair et sombre), token. Les ajustements du fond (`map/basemap.js`) ciblent les couches Positron et Dark d'OpenFreeMap et sont ignorés ailleurs.
- **Initialisation au scroll** (IntersectionObserver) : en place (D30).
- Token Mapbox : un `pk.*` finit dans le bundle livré au navigateur ; sa vraie protection est la **restriction de domaine côté compte Mapbox** (à configurer avant la prod). Il passe par `.env` (non versionné), jamais en clair dans le code (le dépôt distant est public).

### 4.2 Météo
| Source | Licence | Limites | Remarque |
|---|---|---|---|
| **Open-Meteo** (modèles MeteoSwiss ICON-CH1/CH2, 1–2 km) | code AGPLv3, données **CC BY 4.0** | API gratuite **non commerciale** : < 10 000 appels/jour, 5 000/h, 600/min, 300 000/mois ; un site ou une app **avec publicité ou abonnement est commercial** au sens de leurs conditions ; usage commercial : abonnement « Standard » **29 $/mois** ; auto-hébergement libre (commercial compris) | **en place** (`npm run weather`) ; paramètre `elevation` pour viser une altitude ; neige (`snowfall_sum`) incluse |
| **OpenWeather** (revérifié le 13.10.2026) | **ODbL** pour toutes les formules en libre-service, gratuite comprise : **usage commercial autorisé**, avec une **attribution visible** à OpenWeather là où les données s'affichent. Le partage à l'identique ne s'applique que si l'on redistribue hors de l'entreprise une base de données tirée d'OpenWeather (l'ancienne formule à l'appel en CC BY-SA n'existe plus) | **Formule gratuite** : Current Weather + prévision 5 jours au pas de 3 h, 60 appels/min, 1 000 000/mois, données mises à jour toutes les 2 h, disponibilité 95 %. **One Call 4.0** (la 3.0 est dépréciée) : 1 000 appels/jour gratuits, puis 0,0012 £ l'appel (≈ 230 £/mois pour 154 stations à l'heure). Abonnements dès 30 £/mois | Modèle mondial propriétaire ; **pas de paramètre d'altitude** (la valeur est celle du modèle aux coordonnées) ; neige en mm sur 3 h (`snow.3h`), pas en cm. **Formule gratuite possible** (§ 4.4, § 4.7) |
| **MétéoSuisse OGD — prévisions locales** (`ch.meteoschweiz.ogd-local-forecasting`, STAC) | open data, usage libre, citer « Source: MeteoSwiss » | ~5 600 points fixes : 4 071 NPA, 912 stations, **631 points de montagne** (sommets, cols, cabanes) ; run horaire, 9 jours ; CSV par paramètre (≤ 33 Mo en horaire) ; température, précipitations, vent, soleil, isotherme 0 °C, n° de symbole météo. **Pas de paramètre « neige fraîche »** (à déduire des précipitations et de la température / isotherme). Pictogrammes MétéoSuisse non réutilisables (seuls leurs numéros) | Prévision officielle, gratuite, sans appel par lecteur ; il faut rattacher chaque station au point le plus proche |
| **MétéoSuisse OGD — modèle ICON-CH1/CH2-EPS** (STAC) | open data, citer la source | GRIB2 brut, grille 1–2 km, tous paramètres dont la neige → **backend de décodage requis** | Point exact (village ou altitude), neige modélisée |
| **MétéoSuisse OGD — SwissMetNet** (`ch.meteoschweiz.ogd-smn`) | open data, citer la source | ~160 stations automatiques, mesures 10 min, dont **hauteur de neige** sur une partie | Mesure réelle, mais rarement dans les domaines |
| **SLF — stations IMIS** (`measurement-api.slf.ch`) | **CC BY 4.0**, lien vers slf.ch obligatoire | ~180 stations automatiques **en altitude** (réseau avalanche, typiquement 2 000–3 000 m ; proximité avec chaque domaine à vérifier) ; hauteur de neige, neige fraîche, température, vent, toutes les 30 min ; 7 derniers jours sans authentification | **Mesure de la neige réellement tombée**, complément possible aux prévisions |
| **swisstopo swissALTI3D** | open data | Modèle de terrain précis | Altitude exacte d'un point (pour le paramètre `elevation`) |

### 4.3 À confirmer (bloquant pour la mise en prod)
- [x] Source météo de production (D59, 03/11/2026) : MétéoSuisse (prévision) + SLF (enneigement), gratuites et utilisables commercialement.
- [x] Fournisseur de carte : MapLibre + OpenFreeMap (D39). Auto-hébergement des tuiles : laissé ouvert (D54).
- [x] Dataset réel des domaines (D44–D46), pages webcams (D53). Reste : 36 pages d'agrégateur à remplacer, orthographe des noms skiinfo.
- [x] Stations de niveau 1 (D40), validées, modifiables dans `src/data/stations-niveau-1.json` (D52). Niveaux 2/3 provisoires (D46).
- [x] Point météo : **au village** (D61, 03/11/2026 ; en altitude jusque-là, D51).

### 4.4 Météo sans budget : solutions gratuites (session 4, avis à valider)
Contexte : projet webcams (D50), conditions en altitude (D51), **pas de budget pour l'instant**. Le média romand est gratuit pour le lecteur (« purement serviciel »), mais il affiche de la publicité : pour Open-Meteo, c'est un usage **commercial** (§ 4.2).

| Solution | Gratuit pour Blick ? | Altitude | Neige | Travail |
|---|---|---|---|---|
| **Open-Meteo, API publique** (en place) | **Non** : leurs conditions classent « sites qui affichent de la publicité » en commercial ; la charge, elle, passerait (§ 4.5) | Oui (`elevation`) | Prévue | Aucun. **OK pour le prototype, pas pour la prod.** |
| **Open-Meteo auto-hébergé** | **Oui, sans ambiguïté** (D56) : la restriction non commerciale ne vise que leur API hébergée ; logiciel AGPL-3.0 et données CC BY 4.0 autorisent l'usage commercial | Oui | Prévue | Un serveur à faire tourner (§ 4.6) ; `scripts/fetch-weather.mjs` reste identique, seule l'URL de l'API change |
| **MétéoSuisse OGD, prévisions locales** | **Oui** (open data, « Source: MeteoSwiss ») | Points fixes : 631 points de montagne (sommets, cols, cabanes) + 912 stations, chacun avec son altitude | **Pas de neige fraîche** (à déduire : précipitations + température / isotherme 0 °C) | Rattacher chaque station au point le plus proche de son `weatherPoint` ; lire quelques CSV par heure dans le cron |
| **SLF, stations IMIS** | **Oui** (CC BY 4.0, lien vers slf.ch) | ~180 stations automatiques en altitude (typiquement 2 000–3 000 m) | **Mesurée** : hauteur de neige, neige fraîche, toutes les 30 min | Rattacher chaque station à la station IMIS la plus proche (à vérifier station par station) ; API sans clé pour les 7 derniers jours |
| **OpenWeather, formule gratuite** (Current Weather + prévision 5 jours / 3 h) | **Oui** depuis le passage à l'ODbL : usage commercial autorisé, attribution visible obligatoire (« Météo : OpenWeather ») | **Non** : pas de paramètre `elevation` ; la valeur au `weatherPoint` est celle du modèle à cet endroit, sans correction d'altitude documentée (contredit D51 en partie) | Prévue, en mm sur 3 h (équivalent en eau probable, à convertir en cm : à vérifier) | Une clé API ; 2 appels par station (actuel + prévision), un point par appel : 308 appels par passage, ≥ 6 min à 60 appels/min ; toutes les 2 h (fréquence de mise à jour de la formule) ≈ 3 700 appels/jour, ≈ 111 000/mois, sous le plafond de 1 000 000. `fetch-weather.mjs` à réécrire (pas de 3 h agrégés en 3 jours, codes OpenWeather vers pictos) |

**Avis** :
- Pour un projet webcams, ce que le lecteur veut savoir, c'est **ce qu'il va voir maintenant en haut** : une **mesure** colle mieux qu'une prévision. Proposition gratuite pour la production : **SLF IMIS pour la neige mesurée en altitude** (neige fraîche, hauteur de neige, température, vent) + **MétéoSuisse OGD (prévisions locales, points de montagne)** pour le ciel, la température et les 3 jours. Les deux sont gratuits pour un usage commercial, avec citation de la source.
- Coût : du travail (rattachement des 154 stations aux points MétéoSuisse et IMIS, adaptation du cron, nouveau mapping des pictogrammes MétéoSuisse par leur numéro), pas de licence. Le format de `weather.json` et le widget changent peu.
- Alternative la plus simple si un serveur est disponible : **Open-Meteo auto-hébergé** (même code qu'aujourd'hui, § 4.6).
- En attendant : **Open-Meteo public reste en place pour le développement**, à remplacer avant la mise en prod.

### 4.5 Charge en production : est-ce que la source tient le choc ?
- **Le nombre de lecteurs ne touche pas la source météo.** Les lecteurs ne lisent que `weather.json` (≈ 40 Ko, fichier statique servi avec le widget, mis en cache par l'hébergement / le CDN de Blick). Seul le **cron** appelle la source : une fois par heure, quel que soit le trafic. Un pic d'audience charge l'hébergement de Blick, pas l'API.
- **Open-Meteo public, en chiffres** : un appel ≈ un lieu (≤ 10 variables, ≤ 2 semaines de données ; le décompte par lieu est déduit de leur calculateur de prix, à confirmer) ; nous demandons 7 variables sur 3 jours pour 154 lieux, soit **≈ 154 appels par heure** (2 requêtes groupées), **≈ 3 700 par jour**, **≈ 111 000 par mois**, sous les plafonds gratuits (10 000/jour, 5 000/h, 600/min, 300 000/mois). Techniquement ça passerait ; **c'est la licence qui bloque**, pas la charge.
- **MétéoSuisse OGD** : quelques fichiers CSV par heure sur `data.geo.admin.ch` (infrastructure fédérale de diffusion, conçue pour ces téléchargements). **SLF IMIS** : un appel par heure à leur API de mesures. Charge négligeable dans les deux cas, pour la même raison.
- **Si la source tombe** : `weather.json` n'est pas réécrit (écriture atomique, l'ancien fichier reste servi) ; l'en-tête affiche l'heure du dernier relevé, avec la date s'il n'est pas du jour. Alerte côté serveur : `pegasus-monitor` signale un relevé en échec ; sonde externe sur l'âge du fichier à mettre en place (`vps/12-a-faire.md`).

### 4.6 Open-Meteo auto-hébergé : comment ça marche
- **Trois briques** (documentation officielle, `docs/getting-started.md` du dépôt open-meteo) : un **serveur d'API** (un seul binaire, même API que open-meteo.com), une **base de fichiers** de données météo (format ouvert « OM », compressé), et des **routines de téléchargement** des modèles.
- **Les données n'ont pas à être fabriquées** : Open-Meteo publie ses données déjà converties sur **AWS S3 (Open-Meteo open data)**, dont les modèles **MétéoSuisse ICON-CH1** (1 km, 33 h, mis à jour toutes les 3 h) et **ICON-CH2** (2 km, 120 h, toutes les 6 h). En mode distant, le serveur lit ces fichiers à la demande, garde un cache local et vérifie les mises à jour toutes les ~2 minutes. On peut aussi télécharger les modèles directement chez les services météo nationaux.
- **Installation** : une image Docker (`ghcr.io/open-meteo/open-meteo`, variable `REMOTE_DATA_DIRECTORY` vers le S3) ou un paquet Ubuntu 22.04 ; l'API répond alors sur `http://…:8080/v1/forecast` avec les mêmes paramètres qu'aujourd'hui (on ajouterait `models=meteoswiss_icon_ch2` pour couvrir 3 jours, ICON-CH1 ne couvrant que 33 h).
- **Matériel recommandé** : CPU récent (AVX2, x86-64 ou ARM), **8 Go de RAM minimum, 16 Go conseillés**, **≥ 100 Go de stockage** (SSD NVMe idéalement, il sert aussi de cache).
- **« Open bar » ?** Oui pour les appels : **aucun quota**, la seule limite est la machine, et l'usage commercial est autorisé. Mais ce n'est pas gratuit à 100 % : il faut **un serveur allumé en permanence** (et quelqu'un pour le maintenir et le mettre à jour), avec le coût d'infrastructure correspondant. Pour notre besoin (154 points par heure), c'est très surdimensionné : la machine servirait surtout à garder le cache chaud.
- **Performances** : selon la doc, une instance auto-hébergée est plus lente que l'API publique (quelques secondes par requête à cache froid) ; c'est sans importance pour un cron horaire. Les lectures sont plus rapides si le serveur tourne dans la même région AWS que les données (`us-west-2`).
- **Licences** : code **AGPL-3.0** (si on modifie le code et qu'on le sert sur le réseau, il faut publier nos modifications ; sans modification, rien à publier) ; données **CC BY 4.0** (citer Open-Meteo et MétéoSuisse, déjà fait dans le pied de page).
- **Piste à tester, non vérifiée** : faire tourner le conteneur **seulement pendant le cron** (le lancer, demander les 154 points, l'arrêter) au lieu d'un serveur permanent, par exemple dans une tâche planifiée. Coût quasi nul, mais chaque run partirait d'un cache vide : durée et volume téléchargé à mesurer.

### 4.7 Candidats restants pour la météo de production (session 6)
**Tranché le 03/11/2026 (D59)** : option 2 + 4 (MétéoSuisse + SLF). Liste gardée pour mémoire.
**Retenus** (gratuits, utilisables par Blick, publicité comprise) :
1. **Open-Meteo auto-hébergé** : prévision MétéoSuisse ICON-CH à l'altitude exacte de chaque `weatherPoint`, neige prévue, **aucun changement de code** (seule l'URL de l'API change). Coût : un serveur permanent (8–16 Go de RAM, ≥ 100 Go de disque) et sa maintenance ; piste à mesurer : le lancer seulement pendant le cron.
2. **MétéoSuisse OGD, prévisions locales** : prévision officielle aux points fixes (dont 631 points de montagne), sans serveur à nous. **Pas de neige fraîche** (à estimer), stations à rattacher au point le plus proche, pictogrammes à remapper.
3. **OpenWeather, formule gratuite** (remis dans la liste le 13.10.2026 : licence passée en ODbL, usage commercial autorisé avec attribution visible) : sans serveur, une clé API, quota largement suffisant (≈ 111 000 appels/mois sur 1 000 000). **Pas de visée en altitude** (modèle mondial aux coordonnées du `weatherPoint`), neige en mm, données rafraîchies toutes les 2 h, disponibilité 95 %. Réécriture de `fetch-weather.mjs`.
4. **SLF, stations IMIS** : **neige mesurée** en altitude (hauteur, neige fraîche), température, vent. Pas une prévision : **complément** de 1, 2 ou 3, pas une alternative. Stations à rattacher, proximité à vérifier.

Combinaisons possibles : **1 + 4** (prévision au point exact + mesure de neige, le plus complet), **2 + 4** (tout en open data fédéral, sans serveur à faire tourner, plus de travail d'intégration) ou **3 + 4** (sans serveur, intégration la plus légère, mais prévision sans altitude : la mesure SLF compense pour la neige).

**Écartés** : Open-Meteo API publique gratuite (non commercial, or site avec publicité) ; Open-Meteo abonnement (29 $/mois : pas de budget) ; OpenWeather One Call 4.0 et abonnements (payants au-delà de 1 000 appels/jour, ≈ 230 £/mois pour notre besoin) ; MétéoSuisse ICON-CH brut en GRIB (exige un décodeur maison, c'est ce que fait déjà Open-Meteo auto-hébergé) ; MétéoSuisse SwissMetNet (stations rarement dans les domaines, au mieux un complément).

---

## 5. Problèmes connus et pièges
- **Perte de contexte WebGL** : au-delà d'environ 8–16 cartes actives sur une même page, le navigateur efface les plus anciennes (fond de carte disparu). Le prototype gère ça avec un chargement/déchargement par IntersectionObserver + recréation sur `webglcontextlost`. **Pas de souci en prod (une seule carte)**, mais garder le handler `webglcontextlost`.
- **Pastilles = images canvas** générées à la volée (`styleimagemissing` → `addImage`, pixelRatio 2). Il faut **attendre le chargement des polices** (`document.fonts.load` pour Blick Variable, Inter Variable et Font Awesome 6 Free 400/900) avant le premier rendu, sinon les glyphes sont faux.
- **Placement fait en JS** (pas avec la collision native) : relaxation des stations de niveau 1 + placement glouton des secondaires, recalculé sur `move` (throttle 60 ms) et `moveend`. Les positions relaxées sont reconverties en lng/lat.
- Petite pastille sélectionnée : si la place manque même au zoom cible, elle peut ne pas avoir de pastille (le focus reste dans le panneau).
- Le contour CH (non officiel) peut être légèrement décalé à fort zoom.
- **Conteneur de carte** : la CSS du moteur force `position: relative` sur le conteneur ; un `absolute inset-0` s'effondre à 0 px de haut (carte blanche). Donner une taille explicite (`size-full`) dans un parent positionné.
- **Piste du panneau** : la zone qui masque la page cachée est en `overflow: clip`, pas `hidden`. Avec `hidden`, un focus dans la page hors champ fait défiler la piste (contenu décalé de ~120 px en mobile). Les pages hors champ sont aussi `inert`.
- **StrictMode (dev)** : les effets tournent deux fois ; la première requête `weather.json` apparaît « aborted » dans la console. Normal.
- **`npm run weather` sur le Mac de l'entreprise** (02.11.2026) : `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, le certificat d'Open-Meteo vu par Node n'est pas reconnu (inspection TLS du réseau de l'entreprise *[hypothèse : Zscaler]*). Contournement : `node --use-system-ca scripts/fetch-weather.mjs`, ou `npm run dev`, qui lit la météo du VPS depuis le 05/11/2026 (rien à relever en local). Le VPS n'est pas concerné.
- **Mode sombre** (12/11/2026, comme `bl-iframe-traffic`) : l'UI suit le thème Blick par les variables de `base.css` ; la carte, que le moteur et le canvas dessinent sans lire `var()`, reçoit le thème en JS (`useTheme`, `src/lib/theme.js`) et change de style (OpenFreeMap Dark), de relief, de trame et de pastilles (`MAP_THEMES`). Un changement de thème remplace le style : les couches ajoutées (relief, trame, pastilles) sont reposées sur `style.load`.
- **Polices** : `base.css` déclare `BlickVariable` / `InterVariable` (sans espace) ; le canvas des pastilles utilise ces noms. Le DS du prototype les appelait « Blick Variable » / « Inter Variable ».
- **Vérification visuelle en headless** : WebGL fonctionne avec le navigateur headless de l'outil de vérification de cette session. Avec un Chrome headless sans GPU, il faut `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`, sinon `Failed to initialize WebGL` et canevas vide.
- **Gazetteer swisstopo** : le type d'objet dans le libellé (« Ort », « Populated Place »…) dépend de la langue de la requête. Le mapping stocke donc « Nom (CANTON) - Commune » sans le type. Demander `sr=2056` pour avoir les coordonnées LV95 (x = nord, y = est) nécessaires au service d'altitude ; `lat`/`lon` restent en WGS84.
- **OpenSkiData** fusionne les domaines reliés et découpe certains autres (Davos : Parsenn, Jakobshorn, Rinerhorn… séparés) : ne pas l'utiliser pour placer une station.

---

## 6. Pistes ouvertes (non décidées)
- Couleur des pastilles ou des points selon un critère (neige 3 j, ouvert/fermé, altitude…).
- Pin rouge vs pastille rouge pour la sélection (actuel : pastille rouge).
- Mobile : hauteur de la carte avec la fiche ouverte (≈ 93 px de carte visible à 360 px de large ; la maquette 8a en prévoit ≈ 170).
- Images de webcams dans la fiche, avec l'accord des exploitants (D60 ; démarches et chiffres : `LICENCES.md`).

---

## 7. Fichiers de référence (prototype, dossier `reference/`)
- `SkiMap4.dc.html` — **référence validée** (tour 5).
- `SkiMap3.dc.html` — tour 4 (points sobres + pin). Rejeté pour la carte, mais le panneau en vient.
- `SkiMap2.dc.html` — tours 2–3 (stratégies de densité, révélation par importance).
- `SkiMap.dc.html` — tour 1.
- `Skigebiete Karte - Recherche.dc.html` — page de présentation : benchmark, tours, notes. Source : projet claude.ai/design `40bdc79a-94ac-4938-b360-cc646aeebfef`.
- `NOTES-API.md` — notes API d'origine (reprises et complétées au § 4).
- `PROMPT-CLAUDE-CODE.md` — prompt de reprise du handoff (archivé ; ses règles de tenue sont dans « Règles de mise à jour » ci-dessous).

Ces fichiers sont des **références de design en HTML** (format interne de prototypage, qui a besoin de `support.js` et du dossier `_ds/`, **non fournis**). **Ce n'est pas du code de production.**

---

## 8. Architecture du code

```
src/
  main.jsx, App.jsx, index.css
  config/   mapConfig.js · weatherConfig.js
  data/     resorts.js · resorts.json (généré, 154 stations) · stations-niveau-1.json (sélection, éditable) · cantons.js
  hooks/    useWidth.js · useWeather.js
  lib/      placePills.js · pill.js · weather.js · resortList.js (filtre, tri, sélection `?points=`) · theme.js (thème de la carte)
  map/      engine.js · basemap.js · PillLayer.js
  components/ MapView · SidePanel (964 / 632 px) · MobileSheet (panneau bas mobile) · SearchBox · ResortList · ResortDetail (+ MobileResortDetail, WxIcon) · CompactView (?mode=compact) · Header · Footer · ui/Button · ui/IconButton
scripts/  fetch-weather.mjs (relevé météo) · fetch-skiinfo-list.mjs (capture skiinfo) · build-resorts.mjs (dataset)
deploy/   relevé météo sur le VPS pegasus (D57) : bl-iframe-map-ski.service + .timer · bl-iframe-map-ski.caddy · deploy.sh
data/sources/  skiinfo-suisse.json (liste) · stations-mapping.json (choix à la main : lieu, domaine, nom court, page webcams)
public/   css/base.css · js/iframeHeightAdjustment.js · fonts/ · data/ch*.geojson · data/weather.json (généré)
```

**Flux de données**
1. `App` tient l'état : `query`, `sort`, `sel`, `shownId` (dernier domaine affiché, pour que la fiche reste remplie pendant le glissement de retour), `hover`, `panelOpen`. `useWidth` → mode `wide | mid | mobile` ; `useWeather` → `{ wx, status, time }`.
2. `filterResorts(RESORTS, query, sort, wx)` donne la liste, partagée par le panneau et la carte (la recherche filtre aussi les pastilles).
3. `MapView` crée la carte (D30), applique `customizeBasemap`, instancie `PillLayer` et lui passe `{ resorts, wx, sel, hover, mode }` à chaque changement. Il vole vers `sel` quand il change et revient à la vue Suisse quand `sel` redevient `null` (D26, D27).
4. `PillLayer` : à chaque `move` (throttle 60 ms) / `moveend` / changement d'entrée → filtre par zoom (seuils + hystérésis) → `placePills` (relaxation des stations de niveau 1, glouton pour les secondaires) → reconversion en lng/lat → boucle rAF des fondus → `setData`. Les images de pastilles sont dessinées à la demande (`styleimagemissing` → `drawPill`), l'id de l'image encode picto, couleur, température, nom, sélection, survol.
5. Clic / survol carte → `pick()` (`queryRenderedFeatures`, tolérance 2–8 px) → `onSelect` / `onHover` d'`App`.

**Météo** : `scripts/fetch-weather.mjs` lit `resorts.json`, télécharge la liste des points et le dernier relevé complet MétéoSuisse (7 CSV lus en flux, ≈ 100 Mo), puis l'enneigement SLF, choisit pour chaque station le point de prévision et la station SLF les plus proches, traduit les pictogrammes en familles et écrit `weather.json` de façon atomique (`public/data/weather.json` en local) (D59). En prod (D57) : `bl-iframe-map-ski.timer` le lance chaque heure sur le VPS avec `data/weather.json` pour sortie (≈ 7 s, 88 Mo au pic), Caddy sert ce fichier sur `https://ski.citcatlab.ch/weather.json`, et le widget compilé le lit (`VITE_WEATHER_URL` de `.env.production`). `src/data/resorts.json` du serveur doit rester celui du widget publié : relancer `deploy/deploy.sh` après `npm run resorts`.

**Dataset** : `npm run resorts` (`scripts/build-resorts.mjs`) relit la liste skiinfo et le mapping, interroge le gazetteer et le service d'altitude swisstopo, télécharge les domaines et les remontées OpenSkiData (~20 Mo + ~115 Mo) et Wikidata si besoin, calcule le point en altitude (D51), puis écrit `src/data/resorts.json`. À ne relancer que si la liste ou le mapping changent (les coordonnées sont figées). Échoue explicitement si un lieu ou un domaine du mapping a disparu. Le niveau 1 n'en dépend pas (D52).

**Vérifié (v0.6.0)** : `npm run lint`, `npm run build`, et session navigateur réelle à 964, 632 et 375 × 520 : pastilles et relaxation, compactes en 632/mobile, sélection liste et carte (vol, fiche, offset 632), retour, recherche « vaud », dock mobile, mode `?density=stress` (placement sans chevauchement à z ≈ 8,9). Aucun test automatisé.

**Vérifié (session 3)** : `npm run resorts` (154 stations : niveaux 10 / 19 / 125), `npm run weather` (154 stations), lint, build, navigateur à 964 / 632 / 375 / 320 : 10 stations de niveau 1 à l'état initial, niveaux 2 puis 3 révélés au zoom sans chevauchement, recherche « saas » (4 résultats), fiche sans site officiel (bouton masqué), pied de page sur deux lignes en mobile sans troncature.

**Vérifié (session 4)** : `npm run resorts` (151 points en altitude, 154 pages webcams), `npm run weather` (altitude renvoyée par Open-Meteo = altitude demandée, ex. Zermatt 3 828 m), lint, build ; navigateur à 964 px (fiche Zermatt : « à 3 828 m », bouton « Voir les webcams » vers matterhornparadise.ch/fr, nouvel onglet) et 320 × 520 (fiche compacte Verbier sans débordement, 3 lignes de conditions dans les 168 px).

**Vérifié (session 7)** : relevé exécuté comme sous systemd (154 stations) ; site Caddy validé dans l'organisation réelle du VPS (Caddyfile pegasus + tous les sites, Caddy 2.11.7) et testé en local (200, gzip, ETag / 304, CORS, cache, 404 pour `.tmp` et tout autre chemin) ; `deploy/deploy.sh` lancé : premier relevé sur le VPS, timer actif (hh:05), aucune unité en échec, certificat `ski.citcatlab.ch` obtenu, `https://ski.citcatlab.ch/weather.json` en 200 depuis le serveur et depuis le Mac ; widget en `npm run dev:vps` à 964 px : météo lue sur le VPS, pastilles et « Météo en direct » affichés.

**Vérifié (session 7, D59)** : relevé MétéoSuisse + SLF en local (154 stations, 149 avec enneigement, aucune température ni pictogramme manquant ; Zermatt −11,8 °C à 3 826 m, Lodge Matterhorn Glacier Paradise à 0,1 km ; neige SLF à Gornergratsee) puis sur le VPS (`deploy/deploy.sh` : 7 s, 88 Mo au pic, unité en succès, fichier servi) ; lint ; navigateur à 964 px (fiche Zermatt, fiche Ste-Croix sans station SLF : « Pas de station de mesure à proximité »), 632 px (fiche qui défile), 375 × 520 (dock Verbier : « à 3 329 m », « Neige 6 cm », max des 3 jours) et compact 632 px (hauteur de neige) ; pied de page « Météo : MétéoSuisse · Neige : SLF » avec lien vers slf.ch.

**Vérifié (session 7, D62)** : Vite, compact et explore à 964, 632 et 360 px, clair et sombre : racine à bordure et arrondi 0, en-tête à y = 0 et texte de x = 0 au bord droit, lignes compactes et crédits d'un bord à l'autre, pied grisé à 16 px de marge, carte pleine largeur. CDP (`CSS.getMatchedStylesForNode` sur la liste du panneau) : règles `::-webkit-scrollbar`, `-thumb`, `-button`, `-track`, `-corner` appliquées, `scrollbar-width` calculé `auto`. Pas de preuve visuelle des barres (le navigateur de test les masque). Build : `dist/` contient `@supports not selector(::-webkit-scrollbar)` et `::-webkit-scrollbar-button{display:none}` ; lint. Firefox et Safari non testés.

---

## 9. Historique avant le handoff design (22–24 sept. 2026)
Résumé de l'ancien `ETAT-DU-PROJET.md` (version du 24 septembre), dont le code a été remplacé par la v0.6.0.
- **22 sept. — scaffold** React + Vite + Tailwind v4 sur le modèle de `bl-tool-timeline-r` (`base.css`, `iframeHeightAdjustment.js` et leur repli CDN → local dans `index.html`, toujours en place).
- **22 sept. — skill impeccable** installé (`.claude/`, `.cursor/`, `.gemini/`, `.impeccable/`) ; `PRODUCT.md` écrit par `/impeccable init` (entretien avec César), puis brief `/impeccable shape`.
- **22 sept. — premier prototype** Mapbox GL (token et GeoJSON Suisse/cantons de `bl-iframe-map-feminicides`), panneau coulissant lié à la carte, 8 stations, météo en placeholder. Remplacé par la phase de prototypage design (tours 1–5) puis par cette implémentation.
- **24 sept. — premier commit** (`d580e83`) ; le token Mapbox, écrit en clair, a été sorti du code avant le push vers le dépôt public `Citcatjoe/bl-iframe-map-ski` (variable `VITE_MAPBOX_TOKEN`). Décision de César : pas de git-crypt (un `pk.*` est de toute façon visible dans le bundle).
- **Piège d'outillage** : `npx impeccable install` / `update` échoue sur ce réseau (proxy Zscaler non reconnu par Node → `NODE_EXTRA_CA_CERTS` ; script d'installation qui ne suit qu'une redirection alors que GitHub Releases en enchaîne deux). Contournement non permanent : à refaire si `impeccable update` est relancé.

---

## Règles de mise à jour
À chaque build ou session :
1. Ajouter une entrée datée dans `CHANGELOG.md` (format Keep a Changelog).
2. Mettre à jour ici : la date en tête, les décisions (nouvelle ligne `D#`, ne jamais supprimer : marquer « remplacée par D# »), l'état des données (§ 3.1), les cases du § 4.3, les problèmes connus (§ 5) et l'architecture réelle du code (§ 8).
3. Ne jamais remplacer une donnée placeholder par une donnée « plausible » non sourcée.
4. En fin de session, résumer en 3–5 lignes ce qui a changé et ce qui bloque.
5. **VPS pegasus** (décision du 03/11/2026) : ce dépôt ne garde que **la façon dont le projet utilise pegasus** pour mettre la météo en cache, dans [`docs/VPS.md`](docs/VPS.md) (et `deploy/`). La documentation générale du serveur (inventaire, contenu, structure, accès, surveillance, historique) vit dans **brain**, `~/Documents/___www/brain/homelab/machines/pegasus/`, jamais ici. Un changement de ce projet sur le serveur se reporte dans les deux (`docs/VPS.md` ici ; `06-services.md`, `10-historique.md` et `snapshot/refresh.sh` dans brain, puis commit et push de brain, selon `brain/AGENTS.md`).
6. **Météo** (demande du 03/11/2026 : « qu'on puisse revenir et savoir tout de suite comment ça marche ») : tout changement des sources, du choix des points, des champs de `weather.json`, de leur sens ou de leur affichage se consigne **dans la même session** dans [`docs/METEO.md`](docs/METEO.md) : la section concernée, plus une ligne datée dans « Évolutions ».

Rôle des fichiers : `PRODUCT.md` = pour qui et pourquoi ; ce fichier = où on en est et pourquoi les choix ont été faits ; `CHANGELOG.md` = ce que chaque build a changé ; `docs/SPEC.md` = mesures et comportements à reproduire ; `docs/METEO.md` = comment marchent la météo et l'enneigement (sources, choix des points, sens de chaque valeur) ; `docs/VPS.md` = le relevé météo sur le VPS pegasus ; `LICENCES.md` = API et données, ce que leurs licences autorisent ; `README.md` = démarrer et s'orienter dans le code. En cas de contradiction : le code fait foi, puis `PRODUCT.md`, puis ce fichier.
