# Le relevé météo sur le VPS pegasus

Mémoire de **la façon dont ce projet utilise le VPS pegasus** pour mettre en cache la météo (décision D57). La
documentation générale du serveur (inventaire, accès, réseau, Caddy, surveillance, autres projets, historique) n'est
**pas ici** : elle est dans brain, `~/Documents/___www/brain/homelab/machines/pegasus/` (fiche `README.md`, détail du
projet dans `06-services.md`, pannes connues dans `troubleshooting.md`).

## Le besoin

Les lecteurs n'appellent jamais les sources. Un seul appelant relève chaque heure la prévision **MétéoSuisse** et
l'enneigement mesuré par le **SLF** pour les 154 stations (D59), et publie un fichier statique identique pour tous les
lecteurs. Rien n'est calculé par requête : Caddy sert un fichier.

```
MétéoSuisse (data.geo.admin.ch) + SLF (measurement-api.slf.ch)
   ──(timer horaire hh:15, seul appelant)──▶ /srv/bl-iframe-map-ski/data/weather.json (≈ 110 Ko, 7 jours de prévision depuis le 05/11/2026)
   ──(Caddy : cache 5 min, CORS, gzip/zstd)──▶ https://ski.citcatlab.ch/weather.json ──▶ widgets (FTP Blick)
```

Par relevé : le catalogue STAC du jour (dernier relevé complet), la liste des 5 820 points de prévision, 7 fichiers
CSV (température, vent, pictogramme sur 3 h, pictogramme du jour, max, min, précipitations du jour ; ≈ 100 Mo, dont
trois de ≈ 32 Mo couvrant toute la Suisse sur 8 jours), puis 3 appels au SLF (stations, neige des 3 derniers jours, mesures des 24 h ≈ 3 Mo).
Les CSV sont lus en flux, seules les lignes des points retenus sont gardées. Mesuré sur le VPS le 03/11/2026 : ≈ 7 s,
88 Mo de mémoire au pic, 3 s de processeur. Le choix des points (prévision et station SLF les plus proches) est refait
à chaque relevé : voir `scripts/fetch-weather.mjs` et `ETAT-DU-PROJET.md` D59.

Pourquoi un relevé ponctuel et pas un serveur comme `bl-iframe-traffic` : un fichier identique pour tous, changé une
fois par heure, n'a besoin ni de processus permanent ni de port. Le plan « mini-écosystème » de `bl-iframe-traffic`
(`PLAN-ECOSYSTEME.md`, `poller@.timer`, `/srv/feeds`) n'a jamais été déployé : on a suivi les conventions réelles du
serveur (un sous-domaine, un utilisateur, un dossier et des unités par projet).

## Ce que le projet installe

| Fichier (`deploy/`) | Sur le serveur | Rôle |
| --- | --- | --- |
| `bl-iframe-map-ski.timer` | `/etc/systemd/system/`, **activé** | chaque heure à hh:15 (+ décalage fixe ≤ 60 s), le relevé MétéoSuisse de l'heure étant listé vers hh:05–hh:10 ; `Persistent=true` : relevé manqué rattrapé au démarrage |
| `bl-iframe-map-ski.service` | `/etc/systemd/system/`, **statique** (pas de `[Install]`) | oneshot : `node scripts/fetch-weather.mjs data/weather.json`, utilisateur `skimap`, écriture limitée à `data/`, `MemoryMax=300M` ; relances en cas d'échec (plus bas) |
| `bl-iframe-map-ski.caddy` | `/etc/caddy/sites/` | `ski.citcatlab.ch` : `/weather.json` seulement (`Cache-Control: public, max-age=300, stale-while-revalidate=600, stale-if-error=86400`, `Access-Control-Allow-Origin: *`), 404 pour tout le reste (dont `weather.json.tmp`) ; journal `/var/log/caddy/ski.log` |
| `deploy.sh` | — | mise en ligne depuis le Mac (SSH, alias `vps`) |

Sur le serveur : `/srv/bl-iframe-map-ski/` (`root:root`) contient `scripts/fetch-weather.mjs` et
`src/data/resorts.json` ; `data/` (`skimap:skimap`) contient `weather.json`. Aucun secret (sources sans clé), aucune
dépendance npm.

Pourquoi le service n'est pas activé : `pegasus-monitor` surveille tout `*.service` activé et alerte s'il n'est pas
`active` ; un oneshot activé serait signalé « arrêté » entre deux relevés. Ses échecs remontent par « unité en
échec ».

## Déployer

```bash
deploy/deploy.sh            # idempotent ; envoie l'arbre de travail tel quel (commité ou non)
```

1. Envoie `scripts/fetch-weather.mjs`, `src/data/resorts.json` et `deploy/` par SSH.
2. Crée l'utilisateur `skimap` au besoin, installe les fichiers ; `data/` n'est jamais effacé.
3. Installe les unités, **lance un relevé**. Échec avec un `weather.json` déjà en place (source en panne) : on
   continue, systemd relancera ; sans fichier : arrêt.
4. Installe le site Caddy, valide sous l'utilisateur `caddy` (jamais en root : la validation créerait les journaux
   en root) ; refusé : l'ancienne version du site est remise (ou le fichier retiré), sinon il bloquerait le prochain
   rechargement de Caddy pour tous les projets.

**À relancer après `npm run resorts`** : la liste des stations du serveur doit rester celle du widget publié.

Le widget n'est pas sur le VPS : `npm run build` (`VITE_WEATHER_URL` de `.env.production` =
`https://ski.citcatlab.ch/weather.json`), puis `dist/` sur le FTP de l'entreprise. En développement,
`npm run dev` (`.env.development`) lit le même fichier (`npm run dev:vps` jusqu'au 05/11/2026).

## Quand une source répond mal

L'API gratuite d'Open-Meteo (source jusqu'au 03/11/2026) répondait régulièrement `503 overloaded` ; les mêmes
protections valent pour MétéoSuisse et le SLF.

1. **Le script réessaie** (`scripts/fetch-weather.mjs`, `request`) : 4 essais par requête, attentes de 2, 5 et
   15 s, sur 5xx, 429, erreur réseau ou délai dépassé (20 s pour le JSON, 2 min pour un CSV) ; un 4xx échoue tout de
   suite. Pas de relevé MétéoSuisse complet aujourd'hui : celui de la veille.
2. **systemd relance** : `Restart=on-failure`, `RestartSec=10min` ; l'unité attend en `activating (auto-restart)`,
   hors de `systemctl --failed`, donc sans alerte. `TimeoutStartSec=300`.
3. **Alerte** : `StartLimitBurst=5` en `StartLimitIntervalSec=55min` ; au 5e départ raté (≈ hh:45, ≈ 40 min de
   panne), l'unité passe en `failed` et `pegasus-monitor` envoie « Unité en échec » sur ntfy. Le relevé de l'heure
   suivante repart normalement.
4. Pendant tout ce temps, **l'ancien `weather.json` reste servi** (écriture atomique : `.tmp` puis renommage) et
   l'en-tête du widget affiche l'heure du dernier relevé (« Dernier relevé : 15:05 », avec la date s'il n'est pas du
   jour).

Ce que la surveillance ne voit pas : un relevé qui ne se lance plus (timer arrêté). Le « résolu » de ntfy dit
seulement que l'unité n'est plus en échec, pas que le fichier est à jour. Une sonde externe sur l'âge de
`generatedAt` (> 3 h) est notée dans la todo de brain.

## Vérifier

```bash
curl -s https://ski.citcatlab.ch/weather.json | jq '{generatedAt, forecastRun, n: (.resorts | length)}'
ssh vps systemctl list-timers bl-iframe-map-ski.timer     # prochain relevé
ssh vps journalctl -u bl-iframe-map-ski -n 20              # « weather.json : 154 stations (relevé MétéoSuisse …, enneigement SLF pour N) »
ssh vps systemctl show bl-iframe-map-ski.service -p ActiveState -p SubState -p NRestarts
```

Depuis le Mac au bureau, Zscaler intercepte le TLS sortant de Node : `npm run weather` échoue en local
(`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, contournement `node --use-system-ca`) ; tester le serveur par
`ssh vps 'curl …'`.

## Historique du projet sur pegasus

| Date | Quoi |
| --- | --- |
| 02/11/2026, 10:44 | Mise en service : utilisateur `skimap`, unités, site `ski.citcatlab.ch`, premier relevé (154 stations) ; widget en `dev:vps` vérifié |
| 02/11/2026, 16:05 | Relevé en échec : Open-Meteo en `503 overloaded` (panne de leur côté) ; ancien fichier resté servi ; alerte ntfy |
| 02/11/2026, 16:35 | Nouvelles tentatives dans le script, relances systemd toutes les 10 min, alerte après ≈ 40 min ; `deploy.sh` tolère une source en panne. Comportement de systemd 259 vérifié sur le serveur avec une unité d'essai |
| 03/11/2026, 12:13 | Source : MétéoSuisse (prévisions locales) + SLF (IMIS) au lieu de l'API publique d'Open-Meteo (D59). Unités inchangées hormis commentaires et description ; premier relevé sur le VPS en ≈ 7 s, 88 Mo au pic |
| 03/11/2026, 14:16 | Relevé déplacé de hh:05 à hh:15 (à hh:05, le relevé MétéoSuisse de l'heure n'est pas encore listé : on publiait la prévision de l'heure précédente). Garde-fou : pas de publication si plus de 10 % des stations n'ont pas de température, de ciel ou de jours complets, ou si moins de la moitié ont un enneigement (l'ancien fichier reste servi, relances puis alerte). Relevé du déploiement : prévision de 13:00 UTC |
| 03/11/2026, 14:40 | 3e appel au SLF (`/imis/measurements`, ≈ 3 Mo) pour la dernière mesure de neige au sol ; relevé ≈ 6 s, 85 Mo au pic. Fonctionnement des données : `docs/METEO.md` |
| 03/11/2026, 14:45 | Après 6 déploiements en moins d'une heure, l'unité était en `start-limit-hit` (chaque déploiement compte comme un départ ; limite de 5 en 55 min) : vue en échec par la surveillance, relevé suivant refusé. `deploy.sh` fait maintenant `systemctl reset-failed` avant son relevé |
| 05/11/2026, 11:31 | Relevé : 7 jours de prévision au lieu de 3 (mode compact « week-end »), `weather.json` ≈ 110 Ko (≈ 16 Ko compressé) ; mêmes fichiers téléchargés |

## Après un changement sur le serveur

Le serveur est partagé avec d'autres projets : un changement de ce projet sur pegasus (unités, site Caddy, chemins,
utilisateur, rythme) se reporte **aussi dans brain** (`homelab/machines/pegasus/` : `06-services.md`,
`10-historique.md`, `snapshot/refresh.sh`, éventuellement `troubleshooting.md`), puis commit et push de brain. Ici :
ce fichier, `CHANGELOG.md` et `ETAT-DU-PROJET.md` si une décision change.

Licence : les deux sources sont utilisables commercialement (open data fédéral, « Source : MétéoSuisse » ; SLF en
CC BY 4.0, lien vers slf.ch obligatoire). Détail : `LICENCES.md`.

---
*Dernière mise à jour : 03/11/2026*
