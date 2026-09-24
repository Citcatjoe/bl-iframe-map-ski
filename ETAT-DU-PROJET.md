# État du projet — Carte des domaines skiables (iframe)

> **À quoi sert ce fichier.** Il répond à une seule question : *où en est-on ?*
> Il est fait pour être lu à froid, après une pause entre deux sessions, par
> César ou par un agent chargé de reprendre le projet.
>
> Il ne double pas [`PRODUCT.md`](PRODUCT.md), qui porte la **vérité produit** :
> qui sont les lecteurs, ce que l'outil doit leur apporter, les contraintes
> d'iframe, ce qui est confirmé et ce qui ne l'est pas encore. Ni
> [`CHANGELOG.md`](CHANGELOG.md), qui dit ce que chaque build publié a changé.
> Ici on trouve l'**état d'avancement**, l'**historique des décisions** et les
> **chantiers ouverts**. Quand les trois se contredisent, le code fait foi,
> puis `PRODUCT.md`, puis ce fichier.
>
> **Tenue à jour** — à la fin d'une session qui change quelque chose de
> structurant : ajouter une ligne au journal, corriger « État d'avancement » et
> « Chantiers ouverts ». Dernière mise à jour : **24 septembre 2026**.

---

## Le topo en trente secondes

Un **widget carte embarqué en iframe** sur blick.ch, montrant les domaines
skiables suisses. Au survol/à la sélection d'un domaine : nom, canton, une
info météo (pour l'instant un placeholder honnête), un lien vers le site
utilitaire du domaine. Contrainte structurante : le widget vit à 964px (pleine
largeur), 632px (format standard) ou en pleine largeur mobile.

Le projet en est au **premier prototype interactif**, validé dans un vrai
navigateur avec un jeu de 8 stations réelles mais provisoire. **Rien n'est
encore committé** : tout l'arbre de travail est non suivi par git, sur la
branche `news`. Aucune donnée réelle de production (météo, dataset final)
n'est branchée — c'est assumé, voir `PRODUCT.md`.

Le développement suit le skill **impeccable** (`/impeccable init`,
`/impeccable shape`, en cours d'installation dans ce dépôt) : `PRODUCT.md` a
été écrit par un entretien avec César, puis un brief de conception (« shape »)
a fixé la direction avant tout code.

---

## Carte du terrain

| Facette | Où | État |
| --- | --- | --- |
| App React/Vite/Tailwind v4 | racine du dépôt | **fonctionne**, non committée |
| Habillage Blick partagé | `public/css/base.css`, `public/js/iframeHeightAdjustment.js` | copiés depuis `bl-tool-timeline-r`, **en service** |
| Carte Mapbox GL | `src/components/Map/Map.jsx` | **fonctionne** — token et GeoJSON Suisse/cantons repris de `bl-iframe-map-feminicides` |
| Panneau coulissant | `src/components/Panel/Panel.jsx` | **fonctionne** — recherche, liste, détail, clavier |
| Jeu de données | `src/data/resorts.json` | 8 stations réelles (nom/canton/coordonnées/lien vrais), **météo en placeholder** |
| Produit / brief | `PRODUCT.md` | écrit via `/impeccable init` puis affiné par `/impeccable shape` |
| Skill impeccable | `.claude/`, `.cursor/`, `.gemini/`, `.impeccable/` | installé, `PRODUCT.md` et le mode live configurés |
| Tests / CI | — | **aucun** |
| Dépôt git | branche `news` | **rien de committé** |

---

## État d'avancement

### Ce qui fonctionne

- **Carte Suisse avec pins** — fond de carte minimal (pas de style « streets »),
  cantons délimités, couleurs pilotées par les tokens `base.css` (donc
  synchronisées clair/sombre).
- **Panneau coulissant lié à la carte dans les deux sens** — taper dans la
  recherche filtre la liste *et* estompe les pins qui ne correspondent pas ;
  cliquer un pin ou une ligne du panneau sélectionne la même station,
  centre la carte dessus (fly-to) et déplie le détail.
- **Détail d'une station** — canton, météo en placeholder explicite (« Météo —
  bientôt disponible », jamais un chiffre inventé), lien vers le site officiel.
- **Thème clair/sombre** — synchronisé avec le mécanisme `iframeHeightAdjustment.js`
  existant (`#theme=dark` à l'URL, message `CHANGE_THEME` du parent), carte et
  panneau basculent ensemble.
- **Accessibilité de base** — recherche et liste au clavier (vrais `<button>`,
  pas de dépendance au survol/clic seul), conformément au principe posé dans
  `PRODUCT.md`.
- **Responsive validé** à 964px, 632px et 375px (voir « Journal des
  décisions » pour la méthode de vérification).

### Ce qui ne fonctionne pas, ou pas encore

- **Météo réelle** — aucune source branchée ; en attente d'arbitrage avec la
  hiérarchie de César (open data vs API).
- **Dataset réel** — les 8 stations sont réelles mais choisies pour prototyper,
  pas la liste finale des domaines skiables suisses à publier.
- **Comportement mobile du panneau** — fonctionne mais provisoire : à 375px, le
  panneau occupe environ 85 % de la largeur (`min(320px, 88vw)`), ce qui laisse
  une bande de carte étroite. Personne n'a encore tranché entre bottom sheet,
  overlay plein écran ou ce comportement tel quel.
- **Token Mapbox** — celui de développement de `bl-iframe-map-feminicides` est
  réutilisé tel quel, passé par variable d'environnement (`VITE_MAPBOX_TOKEN`,
  voir `.env.example`) plutôt qu'en clair dans le code. Un token `pk.*` finit de
  toute façon dans le bundle JS livré au navigateur une fois le widget déployé
  — la vraie protection est la **restriction de domaine à configurer côté
  compte Mapbox**, pas le fait de ne pas l'écrire dans le code source.
- **Aucun test automatisé, aucun linter en CI, aucune CI.** Seules
  vérifications à ce jour : `npm run build`, `npm run lint`, et une session de
  test manuel dans un vrai navigateur (voir journal).

---

## Journal des décisions

**22 septembre 2026 — scaffold initial.** React + Vite + Tailwind CSS v4, en
suivant la structure de `bl-tool-timeline-r` : `public/css/base.css` (tokens de
couleur, clair/sombre) et `public/js/iframeHeightAdjustment.js` (resize +
synchronisation thème avec le parent) copiés tels quels depuis ce projet, avec
leur mécanisme de repli CDN → local dans `index.html`.

**22 septembre 2026 — installation du skill impeccable.** `npx impeccable
install` a buté sur deux problèmes d'environnement avant de réussir : un proxy
TLS d'entreprise (Zscaler) dont le certificat racine n'est pas reconnu par
Node par défaut, puis un bug du script d'installation qui ne suit qu'une seule
redirection HTTP alors que GitHub Releases en enchaîne deux. Contournés sans
toucher au cache npm (voir « Pièges connus »). `PRODUCT.md` et le mode live
(`.impeccable/live/config.json`) ont été configurés dans la foulée.

**22 septembre 2026 — `/impeccable init`.** Entretien avec César pour capturer
la vérité produit dans `PRODUCT.md` : audience (lecteurs Blick), fonction
(carte + tooltip + panneau), contrainte structurante des trois largeurs
d'iframe, absence de dataset réel à ce stade — rien n'a été inventé, tout est
marqué comme non tranché quand c'était le cas.

**22 septembre 2026 — `/impeccable shape`.** Brief de conception avant tout
code. Décisions actées : pas de nouveau monde visuel (on hérite des tokens
`base.css`) ; fond de carte Mapbox GL en réutilisant le token et les GeoJSON
Suisse/cantons de `bl-iframe-map-feminicides` ; carte et panneau **liés dans
les deux sens** (la recherche filtre les pins affichés, pas l'inverse) ; jeu de
données factice de 5 à 10 stations pour valider le comportement avant tout
vrai dataset.

**22 septembre 2026 — premier prototype construit et testé.** Carte, panneau
et dataset de 8 stations implémentés, puis vérifiés dans un vrai Chrome
headless (pas seulement relus) à 964px, 632px, 375px et en mode sombre. Deux
bugs réels trouvés et corrigés pendant cette vérification :

- Mapbox force `position: relative` en style inline sur son conteneur à
  l'initialisation, ce qui écrasait notre `absolute inset-0` et effondrait la
  carte à une hauteur de 0. Corrigé en donnant au conteneur une taille
  explicite (`h-full w-full`) plutôt qu'un positionnement absolu.
- Un `id` de feature GeoJSON en chaîne de caractères posé au niveau racine est
  silencieusement ignoré par Mapbox pour le `feature-state` tant que la source
  n'a pas de `promoteId`. Sans ce réglage, le lien recherche → carte ne
  produisait aucun effet visuel bien que l'état interne était pourtant correct.

Aucune de ces deux corrections n'aurait été trouvée par une simple relecture
de code — les deux sont sorties d'une vraie session de navigateur.

**24 septembre 2026 — premier commit, puis token Mapbox sorti du code avant
le push.** Le dépôt distant (`Citcatjoe/bl-iframe-map-ski`) s'est révélé
**public** ; le commit initial contenait le token Mapbox en clair dans
`Map.jsx`. Corrigé avant le push : le token passe désormais par
`VITE_MAPBOX_TOKEN` (`.env`, gitignoré ; `.env.example` committé comme
modèle). Décision explicite de César : pas de git-crypt — un token `pk.*`
finit de toute façon dans le bundle JS livré au navigateur une fois le widget
déployé, donc le cacher dans l'historique git n'aurait rien protégé de plus ;
seule la restriction de domaine côté compte Mapbox compte réellement (chantier
ouvert n°4).

---

## Chantiers ouverts

Par ordre d'urgence décroissante.

**1. Décider la source météo réelle**, avec la hiérarchie de César (open data
ou API). Tant que ce n'est pas tranché, le placeholder « Météo — bientôt
disponible » reste la seule vérité affichée — ne pas le remplacer par des
chiffres inventés en attendant.

**2. Construire le dataset réel des domaines skiables suisses**, pour
remplacer les 8 entrées de prototype dans `src/data/resorts.json`. Le format
actuel (`id`, `name`, `canton`, `cantonCode`, `coordinates`, `link`) tient tant
que les champs météo restent externes/dissociables, comme envisagé dans
`PRODUCT.md`.

**3. Trancher le comportement mobile du panneau.** Candidats identifiés dans
le brief : bottom sheet, overlay plein écran, ou garder le volet actuel
(`min(320px, 88vw)`) tel quel. Aucun n'est retenu à ce stade.

**4. Configurer une restriction de domaine sur le token Mapbox** (ou en créer
un dédié) avant toute mise en production — celui en place est le token de
développement de `bl-iframe-map-feminicides`, sans restriction connue pour ce
projet-ci. Le sortir du code (fait, voir journal du 24 septembre) ne suffit
pas : un token `pk.*` est visible dans le bundle livré au navigateur quel que
soit l'endroit d'où il vient.

**5. Décider quand et comment committer.** Le dépôt entier (scaffold, code,
données de prototype, docs) est aujourd'hui dans l'arbre de travail, sans
aucun commit sur `news`.

**6. Mettre en place un minimum de vérification automatisée** — aujourd'hui,
seuls `npm run build` et `npm run lint` tournent ; aucun test, aucune CI.

---

## Pièges connus

**Le conteneur passé à `new mapboxgl.Map()` ne doit pas être positionné en
`absolute`.** Mapbox lui impose `position: relative` en style inline dès
l'initialisation, ce qui a priorité sur toute classe CSS externe et annule un
`inset-0` qui dépendait de ce positionnement pour se dimensionner. Donner au
conteneur une taille explicite (`h-full w-full` ou équivalent) plutôt que de
compter sur un positionnement absolu qui sera de toute façon écrasé.

**Un `id` de feature GeoJSON en chaîne de caractères, posé au niveau racine de
la feature, ne suffit pas pour `setFeatureState`/`feature-state`.** Mapbox
l'ignore silencieusement sans `promoteId` sur la source — aucune erreur, aucun
avertissement, l'état se pose bien via l'API mais ne s'applique jamais au
rendu. Toujours vérifier `map.querySourceFeatures(...)[0].id` après ajout
d'une source si un `feature-state` ne semble pas avoir d'effet visuel.

**Chrome headless a besoin de `--enable-unsafe-swiftshader --use-gl=angle
--use-angle=swiftshader`** pour que le WebGL de Mapbox s'initialise dans cet
environnement (pas de GPU dédié). Sans ces flags, la carte échoue en silence
relatif — une seule ligne `Error: Failed to initialize WebGL` en console, et
un canevas entièrement vide sinon.

**`npx impeccable install`/`update` peut échouer sur ce réseau/cette
machine** pour deux raisons cumulées : le proxy Zscaler dont le certificat
n'est pas dans le magasin de confiance de Node (`NODE_EXTRA_CA_CERTS` requis),
et un bug du script d'installation qui ne suit qu'une seule redirection HTTP
alors que GitHub Releases en enchaîne deux vers `release-assets.githubusercontent.com`.
Le contournement utilisé (copie corrigée du script hors du cache npm, exécutée
directement) n'est pas permanent — à refaire si `impeccable update` est
relancé un jour sur cette machine.

**Aucun skill de lancement (`run`) n'existe encore pour cette app.** La
vérification visuelle de cette session s'est appuyée sur un script
`puppeteer-core` ad hoc (emprunté au cache npx d'impeccable, qui l'embarque
pour ses propres captures d'écran) plutôt que sur un outil dédié au projet. À
transformer en skill via `/run-skill-generator` si les vérifications visuelles
deviennent une routine.

---

## Protocole de reprise

Dans l'ordre, pour reprendre une session après une pause :

```bash
git status              # rien n'est committé : mesurer ce qui traîne
npm install
npm run dev
```

Puis lire, dans cet ordre : ce fichier, puis [`PRODUCT.md`](PRODUCT.md) pour la
vérité produit et ce qui reste volontairement non tranché, puis
`src/data/resorts.json` pour voir jusqu'où va le prototype actuel.

**Avant tout nouveau développement** : rien n'étant committé, un `git
checkout --`/`git clean` effacerait tout le travail existant sans filet. Passer
par un commit ou une sauvegarde hors dépôt avant toute opération destructive.
