# Notes API — à régler après l'UI

## Carte
- **MapLibre GL JS** — open source (BSD-3), rendu côté navigateur, aucune limite. API compatible Mapbox GL JS.
- **OpenStreetMap / OpenFreeMap** — données ODbL (attribution « © OpenStreetMap » obligatoire). OpenFreeMap gratuit mais bénévole, sans SLA → auto-héberger les tuiles (PMTiles) pour le trafic Blick.
- **Relief AWS Terrarium** — dataset public gratuit, sans SLA.
- **Mapbox** — propriétaire ; quota gratuit mensuel puis facturation au chargement de carte (grille à vérifier). Migration : remplacer MapLibre par Mapbox GL JS + URL de style Studio + token. Couches/marqueurs inchangés.

## Météo
- **Open-Meteo** (modèle MeteoSwiss ICON-CH1/CH2, 1–2 km) — code AGPLv3, données CC BY 4.0. API gratuite en non-commercial jusqu'à 10 000 appels/jour ; commercial = abonnement, ou auto-hébergement illimité.
- **MétéoSuisse OGD** — gratuit, sans restriction, source à citer. Formats bruts (GRIB/STAC) → backend requis.

## Architecture recommandée
- `resorts.json` statique (domaines validés) séparé de `weather.json`.
- Cron horaire côté serveur → `weather.json` en cache (~24 appels/jour, pas un par lecteur).
- Init de la carte au scroll (IntersectionObserver) pour limiter les chargements facturés.

## À confirmer par la chefferie
- Source météo (Open-Meteo payant vs MétéoSuisse OGD + backend).
- Fournisseur carte (Mapbox vs tuiles auto-hébergées).
