# Journal des versions

Ce que chaque build publié a changé, du plus récent au plus ancien. Les builds
de vérification, nombreux pendant le développement, ne versionnent rien.

> **Règle de tenue.** Les changements s'inscrivent sous « Non publié » au fil de
> l'eau, tant qu'ils sont frais — jamais reconstitués après coup depuis
> l'historique git. Cette section prend un numéro et une date **quand César
> demande un build** destiné à être publié ; les allers-retours de
> développement n'en ont pas besoin.
>
> Ce fichier dit *ce qui a changé*. [`ETAT-DU-PROJET.md`](ETAT-DU-PROJET.md)
> dit *où on en est* et *pourquoi les choix ont été faits*. `PRODUCT.md` dit
> *pour qui et pourquoi le produit existe*. Un changement notable mérite
> souvent une ligne dans deux d'entre eux.

Numérotation : le chiffre du milieu monte quand une fonctionnalité apparaît ou
qu'une donnée change de forme, le dernier pour des corrections et des
retouches. `package.json` porte le même numéro.

---

## Non publié

Premier prototype interactif : carte Mapbox des domaines skiables suisses,
liée à un panneau de recherche coulissant. Rien n'a encore été demandé comme
build à publier — tout est ici en attendant.

### Ajouté

- **Scaffold du projet** — React + Vite + Tailwind CSS v4, avec l'habillage
  Blick partagé (`public/css/base.css` pour les tokens clair/sombre,
  `public/js/iframeHeightAdjustment.js` pour le resize et la synchronisation
  de thème avec la page parente), repris de `bl-tool-timeline-r`.
- **Skill impeccable** installé (`.claude/`, `.cursor/`, `.gemini/`) —
  `PRODUCT.md` écrit par entretien, mode live configuré.
- **Carte Mapbox GL** des domaines skiables suisses — fond minimal (cantons
  délimités, pas de style « streets »), couleurs synchronisées avec le thème
  clair/sombre via les tokens `base.css`. Token et GeoJSON Suisse/cantons
  repris de `bl-iframe-map-feminicides`.
- **Panneau de recherche coulissant**, lié à la carte dans les deux sens : la
  recherche filtre la liste et estompe les pins non correspondants ; une
  sélection (carte ou panneau) centre la carte sur la station (fly-to) et
  déplie son détail — canton, météo en placeholder honnête, lien vers le site
  officiel.
- **Jeu de données de prototype** (`src/data/resorts.json`) — 8 stations
  suisses réelles (nom, canton, coordonnées, lien authentiques), à l'exclusion
  de la météo qui reste un placeholder explicite tant qu'aucune source n'est
  choisie.
- **Documentation de reprise** — [`ETAT-DU-PROJET.md`](ETAT-DU-PROJET.md) pour
  le point d'avancement, `PRODUCT.md` pour la vérité produit.

### Corrigé

- **La carte s'affichait vide** — Mapbox impose `position: relative` en style
  inline à son conteneur, ce qui annulait le `position: absolute` dont
  dépendait sa hauteur. Le conteneur a maintenant une taille explicite.
- **La recherche ne changeait rien visuellement sur la carte** — un `id` de
  feature GeoJSON en chaîne de caractères était silencieusement ignoré par
  Mapbox pour le `feature-state` sans `promoteId` déclaré sur la source.
- **Le token Mapbox était écrit en clair dans le code**, repéré avant le
  premier push vers le dépôt public. Il passe désormais par la variable
  d'environnement `VITE_MAPBOX_TOKEN` (voir `.env.example`).

---

*Aucune version publiée pour l'instant. La première portera le numéro
`0.1.0` quand César demandera un premier build.*
