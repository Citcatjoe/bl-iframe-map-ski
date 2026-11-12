# Météo et enneigement : comment ça marche

Référence du fonctionnement des données météo du widget, à tenir à jour à **chaque** changement (règle n° 6 de
`ETAT-DU-PROJET.md`). Décisions et raisons : D51, D57, D59, D61 dans `ETAT-DU-PROJET.md`. Licences : `LICENCES.md`.
Hébergement du relevé sur le VPS : `docs/VPS.md`.

## En bref

Une fois par heure, un script sur le VPS lit deux sources officielles suisses, choisit pour chacune des 154 stations
le point de prévision et la station de mesure de neige les plus proches, et publie un seul fichier,
`https://ski.citcatlab.ch/weather.json` (≈ 110 Ko, ≈ 16 Ko compressé). Le widget ne lit que ce fichier ; aucun lecteur
n'appelle les sources.

```
MétéoSuisse (prévision)  ─┐
                          ├─▶ scripts/fetch-weather.mjs (VPS, hh:15) ─▶ weather.json ─▶ widget
SLF (neige mesurée)      ─┘
```

## Sources

| Source | Adresse | Ce qu'on y prend | Mise à jour | Licence |
|---|---|---|---|---|
| **MétéoSuisse**, prévisions locales | catalogue STAC `data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-local-forecasting` ; liste des points `…/ogd-local-forecasting_meta_point.csv` | 7 fichiers CSV du dernier relevé complet : `tre200h0` (température, moyenne horaire), `fu3010h0` (vent, moyenne horaire), `jww003i0` (pictogramme sur 3 h), `jp2000d0` (pictogramme du jour), `tre200px` / `tre200pn` (max / min du jour, heure locale), `rka150p0` (précipitations du jour, heure locale) | relevé horaire, publié vers hh:02–hh:04, listé vers hh:05–hh:10 | open data, CC BY 4.0, « Source : MétéoSuisse » |
| **SLF**, stations automatiques IMIS | `measurement-api.slf.ch/public/api/imis/` : `stations`, `daily-snow?period_in_days=3`, `measurements` | liste des stations ; valeurs journalières (`HS`, `HN_1D`) ; mesures des dernières 24 h toutes les 30 min (`HS`) | journalier à 00:00 UTC ; capteur toutes les 30 min | CC BY 4.0, lien visible vers www.slf.ch |

Chaque fichier MétéoSuisse couvre les 5 820 points de Suisse sur 8 jours (trois font ≈ 32 Mo) : ≈ 100 Mo par relevé,
lus en flux, seules nos lignes sont gardées. Le SLF : ≈ 3,5 Mo par relevé.

## Le relevé, étape par étape (`scripts/fetch-weather.mjs`)

1. Lit `src/data/resorts.json` : pour chaque station, son lieu (village ou gare de départ, D44) pour la prévision,
   et son `weatherPoint` (gare d'arrivée la plus haute des remontées, D51 ; à défaut le lieu) pour la neige.
2. **Prévision.** Télécharge la liste des points MétéoSuisse, choisit le plus proche du lieu de chaque station
   (règle ci-dessous), trouve le dernier relevé MétéoSuisse qui contient les 7 fichiers (aujourd'hui, sinon la
   veille), lit les 7 CSV et garde les lignes de nos points.
3. **Enneigement.** Appelle les 3 adresses du SLF, choisit la station IMIS la plus proche (règle ci-dessous).
4. **Garde-fou.** Refuse de publier si plus de 10 % des stations n'ont pas de température, de ciel ou de jours
   complets, ou si moins de la moitié ont un enneigement : l'ancien fichier reste en ligne.
5. Écrit `weather.json` (fichier temporaire puis renommage : jamais de fichier à moitié écrit).

Chaque requête est réessayée 4 fois (2, 5, 15 s) en cas d'erreur passagère ; si le relevé échoue quand même, systemd
le relance toutes les 10 min et n'alerte qu'après ≈ 40 min (`docs/VPS.md`).

## Choix des points (refait à chaque relevé)

| | Prévision MétéoSuisse | Mesure de neige SLF |
|---|---|---|
| Candidats | les 5 820 points : 631 points de montagne (sommets, cols, cabanes), 1 118 stations météo, 4 071 NPA (centre des localités) | les stations IMIS qui ont des valeurs journalières de neige (132) |
| Règle | le plus proche du **lieu de la station** (village ou gare de départ) en **distance (km) + écart d'altitude / 100 m** | le plus proche du `weatherPoint` (haut du domaine) en **distance (km) + écart d'altitude / 200 m**, à **25 km au plus** |
| Combien de points | **un seul par station, au village** (D61, 03/11/2026 : le lecteur compare avec MétéoSuisse, qui donne le village ; village + sommet jugé confus) | un seul |
| Résultat (03/11/2026) | médiane 0,2 km et 12 m d'écart ; 90 % sous 1,3 km et 81 m ; Zermatt → point Zermatt (1 610 m, 0,3 km) | médiane 5,9 km, 24,3 km au plus ; 5 stations sans mesure (Ste-Croix - Les Rasses, La Robella, Le Brassus, St Cergue, Heiden - Bischofsberg) |
| Affiché | son altitude dans la fiche (« Au village, à 1 610 m ») ; son nom en infobulle de la fiche mobile | l'altitude de la station dans le titre (« Enneigement en altitude · 2 953 m »), son nom et l'heure de la mesure |

Plus grands écarts entre le point de prévision et le lieu (03/11/2026), quand le « lieu » est une gare ou un col
isolé sans point MétéoSuisse tout près : Diavolezza → Chamanna da Boval CAS (474 m plus haut, 3,1 km), Chur
(Brambrüesch) → Malix (374 m plus bas), Gurnigelbad → Rüti b. Riggisberg (300 m plus bas). Toutes les autres sont à
moins de 270 m.

## Ce que veut dire chaque valeur affichée

| Affiché | Où | Champ (`weather.json`) | Ce que c'est |
|---|---|---|---|
| Température « 4° » | fiche, fiche mobile | `t` | MétéoSuisse, température à 2 m, **moyenne de l'heure en cours**, au point de prévision du **village** (D61 ; plus froid en haut des pistes, environ 0,6° de moins tous les 100 m). C'est une prévision du dernier relevé, pas une mesure |
| Picto et « En partie ensoleillé » | pastille, liste, fiche, fiche mobile (picto seul en liste, libellé en infobulle) | `sky` | pictogramme MétéoSuisse du **créneau de 3 h qui contient maintenant**, traduit en notre famille de temps (les pictos MétéoSuisse sont protégés : on ne reprend que leur numéro). **La nuit**, ciel dégagé et peu nuageux deviennent une lune (« Ciel dégagé », « Peu nuageux ») : voir « Jour et nuit » plus bas |
| « Vent 26 km/h » | fiche | `wind` | MétéoSuisse, vent moyen de l'heure en cours |
| « Au village, à 1 610 m » (fiche) ; « Village, 1 610 m » (fiche mobile) | fiche, fiche mobile | `elevation` | altitude du point de prévision MétéoSuisse retenu, au village ou tout près. **Une seule température par station : celle du village** (D61) |
| Infobulle « Prévision au village, point … » | fiche mobile | `point.name` | nom du point de prévision retenu (plus affiché dans la fiche depuis le 05/11/2026 : les sources sont créditées dans le pied de page) |
| « −2° / 7° » (min / max du jour) | pastilles de la carte | `days[0]` | MétéoSuisse, min et max d'aujourd'hui au village (D63) ; le picto de la pastille reste celui du moment (`sky`) |
| 7 prochains jours : picto, max, min, mm (fiche) ; 3 mini-jours picto + max (fiche mobile) | fiche, fiche mobile | `days[]` (7 dans la fiche, 3 en mobile) | MétéoSuisse, à partir d'aujourd'hui (journées en heure suisse) ; précipitations arrondies au mm, rien sous 0,5 mm : pictogramme du jour, max, min, précipitations totales. **Pas de neige prévue** : MétéoSuisse ne la publie pas et on ne l'estime pas |
| « Neige au sol 0 cm » (fiche) ; « Neige 0 cm à 1 708 m » (fiche mobile) ; « ❄ 0 cm au sol à 1 708 m » (liste du mode explore et vue compacte, station en infobulle) | fiche, fiche mobile, vue compacte | `snow.hs`, `snow.hsAt`, `snow.elevation` | SLF, **hauteur de neige mesurée par le capteur** de la station IMIS, **en altitude** (station la plus proche du haut du domaine), **dernière mesure** des 24 h (toutes les 30 min) ; à défaut, valeur journalière de 00:00 UTC. Neige naturelle sur terrain plat, souvent hors du domaine : **pas l'état des pistes** |
| « Neige tombée en 3 jours 9 cm (estimation) » | fiche | `snow.hn3` | SLF, somme des 3 dernières valeurs journalières `HN_1D` (neige tombée en 24 h), **calculées par le modèle de manteau neigeux du SLF**, pas mesurées. Dit combien de neige serait tombée, pas combien il en reste |
| « Enneigement en altitude · 2 953 m », « Station X, mesure de 14:00 » | fiche | `snow.elevation`, `snow.station`, `snow.hsAt` | altitude et nom de la station de mesure retenue, heure de la mesure de neige au sol |
| « SAM. 7 » et picto (et « DIM. 8 ») ; libellé et « 6° / 2° » en infobulle | vue compacte | `days[]` du samedi et du dimanche | MétéoSuisse, picto du jour, max et min de chaque jour du week-end, au village. Du lundi au samedi : le samedi et le dimanche qui viennent ; le dimanche : ce dimanche seul ; le week-end suivant apparaît à minuit, dans la nuit du dimanche au lundi (`weekendDates`, `src/lib/weather.js`). Un lundi, samedi est à J+5 : prévision indicative, mise à jour à chaque relevé. Aucune neige prévue : le picto MétéoSuisse dit seul s'il neigera |
| Ordre de la vue compacte (le mode explore est alphabétique depuis le 05/11/2026) | vue compacte | `snow.hn3`, puis `snow.hs` | neige tombée estimée décroissante, puis neige au sol ; stations sans donnée en fin de liste |
| « Dernier relevé : 14:16 », point vert | en-tête | `generatedAt` | heure à laquelle le VPS a produit le fichier. **Plus de 2 h** (au moins un relevé horaire manqué) : point jaune et « Relevé ancien : 3 nov., 16:19 » (`WEATHER_STALE_AFTER_MS`, `src/config/weatherConfig.js`). Le widget relit le fichier tous les quarts d'heure (`WEATHER_REFRESH_MS`) : un onglet resté ouvert suit les relevés |

**Neige au sol et neige tombée peuvent se contredire en apparence.** Exemple réel, Moléson - Gruyères (station SLF
Chenau, 1 708 m), 03/11/2026 : neige au sol 0 cm, neige tombée en 3 jours 8,7 cm (0 + 2,4 + 6,3). En début de
saison, la neige qui tombe sur un sol encore chaud fond ou se tasse aussitôt : le modèle compte la neige tombée, le
capteur ne voit rien au sol. C'est pourquoi les deux valeurs portent des libellés distincts (« au sol », « tombée … en
3 jours (estimation) »).

Valeurs manquantes : « – » (ex. Gstaad le 03/11/2026 : pas de `HN_1D` pour sa station). Pas de station SLF à 25 km :
« Pas de station de mesure à proximité ».

## Format de `weather.json`

```jsonc
{
  "generatedAt": "2026-11-03T13:16:53.000Z", // heure du relevé (UTC), en-tête « Dernier relevé »
  "forecastRun": "2026-11-03T13:00:00.000Z", // relevé MétéoSuisse utilisé (UTC)
  "source": "MétéoSuisse, prévisions locales ; SLF, stations IMIS (CC BY 4.0)",
  "resorts": {
    "moleson-gruyeres": {
      "t": 5,                // °C, heure en cours
      "sky": "partly",       // sun, partly, clear-night, partly-night, cloud, fog, showers, rain, sleet, snow, storm ; null si inconnu
      "wind": 6,             // km/h, heure en cours
      "elevation": 1119,     // altitude du point de prévision (m)
      "point": { "name": "Moléson-sur-Gruyères", "km": 0.4 },
      "days": [ { "date": "2026-11-03", "sky": "cloud", "max": 5, "min": -6, "precip": 0 }, … ×7 ], // aujourd'hui + 6 jours (heure suisse) : la fiche les montre tous, la fiche mobile 3, le mode compact le week-end
      "snow": {              // null : pas de station SLF à 25 km
        "hs": 0,             // neige au sol, mesurée (cm)
        "hsAt": "2026-11-03T13:00:00.000Z", // heure de cette mesure (UTC)
        "hn3": 8.7,          // neige tombée en 3 jours, estimée par le modèle SLF (cm)
        "date": "2026-11-03",// dernier jour des valeurs journalières SLF
        "station": "Chenau", "elevation": 1708, "km": 6.8
      }
    }
  }
}
```

Correspondance pictogramme MétéoSuisse → famille : table `SKY` de `scripts/fetch-weather.mjs` (codes 1–42, la nuit
101–142 ; [table officielle des symboles du 14/02/2022](https://www.meteoswiss.admin.ch/weather/weather-and-climate-from-a-to-z/weather-symbols.html),
vérifiée code par code le 03/11/2026). Famille → picto et libellé : `src/lib/weather.js`.

**Les dessins** : un jeu de 11 pictos propre au widget (livraison du 03/11/2026, dessins originaux, usage commercial
libre sans attribution), rangé dans `src/assets/pictos-meteo/` (SVG couleur, mono, sombre ; `LISEZMOI.md`). Le code
lit les tracés dans `src/lib/weatherIcons.js` : SVG dans la fiche, la liste et la vue compacte (`WxIcon`), `Path2D`
sur le canvas des pastilles (`src/lib/pill.js`). Famille → picto : `src/lib/weather.js` ; averses et pluie partagent
le picto `rain`. Couleurs : `docs/SPEC.md`. Jusqu'au 03/11/2026 : icônes Font Awesome 6 Free.

**Jour et nuit** : c'est MétéoSuisse qui dit si un créneau est de jour (1–42) ou de nuit (101–142). Le script
n'en tient compte que pour le soleil : `sun` → `clear-night` (lune), `partly` → `partly-night` (lune et nuage) ; les
autres familles n'ont pas de soleil dans leur picto. Mesuré le 03/11/2026 : MétéoSuisse code « nuit » les créneaux
finissant de 18:00 à 07:00 UTC, donc dont le milieu tombe après le coucher (≈ 17:10 à Berne) ou avant le lever
(≈ 07:15) ; même heure pour toute la Suisse. Comme on prend le créneau qui finit juste après le relevé (hh:15), la
lune apparaît au relevé de **18:15** et le soleil revient à celui de **08:15**, heure suisse (≈ 1 h après le coucher
et le lever). Ces heures suivent la saison. Les pictos des 3 jours restent de jour (picto « de la journée »).

## Rythme et fraîcheur

| Étape | Quand | Âge de la donnée affichée |
|---|---|---|
| MétéoSuisse publie | chaque heure, listé vers hh:05–hh:10 | — |
| Notre relevé | hh:15 (+ décalage fixe ≤ 60 s) | prévision de l'heure (relevé de hh:00) |
| Neige au sol | dernière mesure SLF au moment du relevé (toutes les 30 min) | ≤ 1 h 30 environ |
| Neige tombée | valeurs journalières SLF de 00:00 UTC | jusqu'à ≈ 1 jour |
| Cache du fichier | 5 min chez le lecteur | + 5 min |

## Vérifier une valeur

```bash
# Ce que le widget affiche pour une station
curl -s https://ski.citcatlab.ch/weather.json | jq '.resorts["moleson-gruyeres"]'
# La station SLF : valeurs journalières et mesures des 24 h (code dans /stations, ex. ALI2 = Chenau)
curl -s "https://measurement-api.slf.ch/public/api/imis/daily-snow?period_in_days=7" | jq '[.[] | select(.station_code=="ALI2")]'
curl -s https://measurement-api.slf.ch/public/api/imis/station/ALI2/measurements | jq '[.[] | {measure_date, HS}] | .[-4:]'
# Le dernier relevé sur le VPS
ssh vps journalctl -u bl-iframe-map-ski -n 5 --no-pager
```

En local : `npm run dev` lit le fichier du VPS (`.env.development`). Pour tester un changement du relevé :
`npm run weather` (sur le réseau de l'entreprise : `node --use-system-ca scripts/fetch-weather.mjs`) écrit la copie
locale `public/data/weather.json`, puis `npm run dev:local` la lit ; elle ne se met pas à jour seule. Jusqu'au
05/11/2026, `npm run dev` lisait cette copie : Zermatt restait à −12° le 03/11, « Dernier relevé : 3 nov., 16:19 »
s'affichait le 05/11, alors que le fichier en ligne était à jour.

## Mesures étudiées, non retenues (03/11/2026)

Compté depuis le lieu de chaque station (village ou gare de départ) ; « proche » = 5 km et 200 m d'écart au plus.

| Mesure | Source | Couverture de nos 154 stations | Pourquoi pas |
|---|---|---|---|
| Neige au village | SLF, champs d'observation (`/public/api/study-plot/`, relevé manuel quotidien vers 07:00 : `HS`, `HN_1D`) ; 67 actifs | **29 proches** ; 52 à 10 km et 300 m ; médiane 10,2 km et 242 m (Zermatt et Saas-Fee oui, Verbier, Moléson, Champéry non) | Couverture partielle ; la neige en haut du domaine (IMIS) est celle qui compte (product owner) |
| Température mesurée au village | MétéoSuisse SwissMetNet (`ch.meteoschweiz.ogd-smn`), 158 stations | **29 proches** ; 68 à 10 km et 300 m ; médiane 7,9 km et 189 m | Couverture partielle : la plupart des stations n'auraient qu'une mesure lointaine ou à une autre altitude. La prévision MétéoSuisse au village existe pour les 154 |

## Évolutions

| Date | Changement |
|---|---|
| 05/10/2026 | Open-Meteo (API publique), au `weatherPoint` et à son altitude exacte (D51) ; neige prévue par jour |
| 02/11/2026 | Relevé horaire sur le VPS pegasus (D57) ; nouvelles tentatives et relances après la panne d'Open-Meteo |
| 03/11/2026 | **MétéoSuisse + SLF** (D59) à la place d'Open-Meteo (non commercial) ; neige prévue remplacée par les précipitations ; enneigement mesuré SLF ; nom du point de prévision affiché ; un seul point par station |
| 03/11/2026 | Relevé à hh:15 (à hh:05, prévision de l'heure précédente) ; garde-fou de publication |
| 03/11/2026 | Neige au sol = dernière mesure du capteur (toutes les 30 min) au lieu de la valeur de minuit ; libellés « Neige au sol » et « Neige tombée en 3 jours (estimation) » ; heure de la mesure affichée (cas Moléson) |
| 03/11/2026 | Nuit : lune au lieu du soleil (`clear-night`, `partly-night`) ; « Peu nuageux » de jour devient « En partie ensoleillé » (sens du code 3, le plus fréquent) ; table des codes revérifiée |
| 03/11/2026 | **Prévision au village** (D61) au lieu du haut des pistes, partout (pastilles, fiche, liste, vue compacte, 3 jours) : Zermatt affichait −12° (point à 3 826 m) contre « −2 / 7 » chez MétéoSuisse (village, 1 610 m). L'enneigement reste choisi depuis le haut du domaine |
| 05/11/2026 | Fiche : bandeau des 7 prochains jours à la place des 3 jours (précipitations arrondies au mm) |
| 05/11/2026 | Pastilles : « min / max » du jour (`days[0]`) à la place de la température du moment (D63, ancien essai `?pill=minmax`) |
| 05/11/2026 | **Week-end** : le relevé publie 7 jours (aujourd'hui + 6, assez pour le dimanche qui vient ; fiche inchangée à 3 jours) ; le mode compact montre le samedi et le dimanche (dimanche : ce dimanche seul), et la neige « au sol ». Garde-fou : jours complets jusqu'au prochain dimanche |
| 05/11/2026 | Fiche sans mention de source (« Prévision MétéoSuisse, point … » retiré, « Station SLF X » devient « Station X ») : crédits dans le pied de page |
| 05/11/2026 | Vue compacte sur le modèle de `bl-iframe-traffic` : picto météo à la place de la pastille d'état, puis le nom et « ❄ N cm au sol à N m » ; plus de température ni de canton |
| 03/11/2026 | Libellés : « Au village, à N m » pour la température, « Enneigement en altitude · N m » pour la neige (altitude exacte de la station SLF) ; fiche mobile « Village, N m » et « Neige N cm à N m » |

---
*Dernière mise à jour : 03/11/2026*
