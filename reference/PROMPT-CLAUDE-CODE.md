# Prompt à donner à Claude Code

Copier tout ce qui suit dans Claude Code, avec le dossier `design_handoff_carte_domaines_skiables/` placé dans le repo.

---

Tu reprends le projet **« Carte interactive des domaines skiables »**, un widget Blick embarqué en iframe sur blick.ch. Une phase de prototypage design est terminée. Ta mission : **implémenter la version de production** en restant fidèle aux décisions prises, **sans perdre la mémoire du projet**.

## À lire avant toute action (dans cet ordre)
1. `design_handoff_carte_domaines_skiables/ETAT-DU-PROJET.md` : **source de vérité**. Décisions D1–D27, schéma de données, sources, points bloquants, pièges connus.
2. `design_handoff_carte_domaines_skiables/README.md` : spécification visuelle et comportementale (mesures, couleurs, typo, animations).
3. `design_handoff_carte_domaines_skiables/CHANGELOG.md` : historique.
4. Le `product.md` du repo, s'il existe.
5. `design_handoff_carte_domaines_skiables/reference/SkiMap4.dc.html` : **prototype de référence**. C'est du HTML de prototypage, **pas du code de production**. Lis-le pour extraire la logique exacte : `place()` (placement et relaxation), `drawPill()` (rendu canvas des pastilles), `startAnim()` (fondus), `wmo()` (mapping météo), les layouts par largeur. Ne le copie pas tel quel.

## Contraintes non négociables
- **Stack** : React + Vite + Tailwind CSS v4. Réutiliser `public/css/base.css` et `public/js/iframeHeightAdjustment.js` (chargés depuis `https://utils.blick.ch` / `https://www.blick.ch` avec fallback local dans `index.html`).
- **Trois largeurs** : 964 px, 632 px, mobile. Mobile en **hauteur fixe d'environ 520 px** : l'iframe ne doit pas ressembler à une app plein écran.
- **UI en français**, ton Blick (tutoiement).
- **Données réelles uniquement** : ne jamais inventer de nom, coordonnée, URL, chiffre météo. Les données d'exemple du prototype sont **approximatives et non vérifiées**. Si tu les reprends, marque-les clairement comme placeholders (`"placeholder": true` ou fichier `resorts.sample.json`) et ne les présente jamais comme réelles.
- **Données statiques** (`resorts.json`) **séparées** de la **météo** (`weather.json`, produite côté serveur par un cron horaire). Pas d'appel météo par lecteur en production.
- **Moteur de carte** : MapLibre GL JS, avec une API compatible pour basculer vers Mapbox GL JS + style Studio Blick quand le token sera disponible. Centraliser l'URL du style et le token dans la config.
- **Une seule forme de marqueur** (pastille). Pas de badge « +N ». Survol et sélection ne font jamais apparaître une pastille. Les domaines principaux ne disparaissent jamais.
- Ne pas réintroduire ce qui a été rejeté : trait de frontière, voile blanc extérieur, chips de canton, météo dans les lignes de liste, panneau de fiche flottant sur la carte, points sobres pour tous les domaines.

## Ce qui reste ouvert : ne pas trancher seul, demander
Le § 4.3 de `ETAT-DU-PROJET.md` liste ces points : source météo, fournisseur de carte, dataset réel, critère du `tier`, point météo (village ou altitude). Implémente de façon **configurable** et signale-les plutôt que de choisir à leur place.

## Mémoire du projet : obligatoire à chaque build/session
Maintiens **deux fichiers à la racine du repo**. Déplace-les depuis le dossier de handoff s'ils n'y sont pas encore.
- **`CHANGELOG.md`** (format Keep a Changelog, en français) : à chaque build, une entrée datée avec les sections Ajouté / Modifié / Corrigé / Supprimé. Garde l'historique des versions 0.1–0.5 (phase prototype).
- **`ETAT-DU-PROJET.md`** : documentation vivante, qui sert de mémoire. À chaque session :
  - mets à jour la date en tête ;
  - ajoute toute nouvelle décision dans la table (nouvel identifiant `D28`, `D29`…). Ne supprime jamais une décision : marque-la « remplacée par D# » ;
  - mets à jour l'état des données (réelles / placeholder), les cases à cocher du § 4.3, les problèmes connus et l'arborescence réelle du code ;
  - ajoute une section « Architecture du code » dès qu'elle existe (composants, hooks, flux de données, scripts de build et de cron).
- En fin de session, résume en 3–5 lignes ce qui a changé et ce qui bloque.

## Première tâche proposée
1. Lire les documents ci-dessus et me poser tes questions éventuelles.
2. Proposer une architecture : composants (`MapView`, `ResortPills`, `SidePanel` avec `ResortList` / `ResortDetail`, `SearchBox`), hooks (`useWidth`, `useWeather`), utilitaires (`placePills`, `drawPill`, `wmo`), config (`mapConfig.ts`), et le script cron météo.
3. Après validation, implémenter, puis mettre à jour `CHANGELOG.md` et `ETAT-DU-PROJET.md`.
