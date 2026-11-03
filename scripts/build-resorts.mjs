#!/usr/bin/env node
// Construit src/data/resorts.json (dataset du widget) à partir de :
//   - data/sources/skiinfo-suisse.json   liste des stations retenue (skiinfo.fr)
//   - data/sources/stations-mapping.json  correspondances choisies à la main (lieu swisstopo, domaine OpenSkiData,
//                                         nom court, page webcams)
// et des sources ouvertes :
//   - swisstopo, gazetteer swissNAMES3D (SearchServer)  → lieu de la station : coordonnées, canton, commune (© swisstopo)
//   - swisstopo, service d'altitude (swissALTI3D)        → altitude des points
//   - OpenSkiData (dérivé d'OpenStreetMap, ODbL)         → domaine skiable (site, km de pistes, remontées, altitudes)
//                                                          et remontées (gare d'arrivée la plus haute = point en altitude)
//   - Wikidata (CC0)                                     → site officiel (P856) si OpenSkiData n'en a pas
//
// Deux points par station :
//   - lat/lng/elevation : le lieu de la station (village ou gare de départ), pour la carte ;
//   - weatherPoint      : le haut du domaine accessible depuis la station (gare d'arrivée la plus haute), pour les
//                         conditions en altitude (ETAT-DU-PROJET.md D51).
// Le niveau 1 n'est pas décidé ici : src/data/stations-niveau-1.json (D52).
// Usage : node scripts/build-resorts.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKIINFO = resolve(ROOT, 'data/sources/skiinfo-suisse.json');
const MAPPING = resolve(ROOT, 'data/sources/stations-mapping.json');
const OUT = resolve(ROOT, 'src/data/resorts.json');

const OSD_AREAS = 'https://tiles.openskimap.org/geojson/ski_areas.geojson';
const OSD_LIFTS = 'https://tiles.openskimap.org/geojson/lifts.geojson';
const SEARCH = 'https://api3.geo.admin.ch/rest/services/api/SearchServer';
const HEIGHT = 'https://api3.geo.admin.ch/rest/services/height';

/** Niveau 2 si le domaine relié compte au moins ce nombre de km de pistes de ski alpin (provisoire, D46). */
const LEVEL_2_MIN_RUNS_KM = 50;
/** Remontées du domaine prises en compte pour le point en altitude : à moins de ce rayon du lieu de la station. */
const AREA_LIFT_RADIUS_KM = 7;
/** Sans domaine (ou domaine sans remontée connue) : n'importe quelle remontée à moins de ce rayon. */
const NEARBY_LIFT_RADIUS_KM = 3;

/** « Nom (CANTON) - Commune » : libellé swisstopo sans le type d'objet (traduit selon la langue de la requête). */
const placeLabel = (label) => label.replace(/<i>.*?<\/i>\s*/, '').replace(/<[^>]+>/g, '');
const round5 = (n) => Math.round(n * 1e5) / 1e5;

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': 'bl-iframe-map-ski (Blick)' } });
    if (res.ok) return res.json();
    if (attempt === 3) throw new Error(`${res.status} ${url}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

/** Exécute `fn` sur chaque élément avec au plus `n` appels simultanés, en conservant l'ordre. */
async function mapLimit(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

function distKm(lat1, lng1, lat2, lng2) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** WGS84 → LV95, formules approchées de swisstopo (précision ~1 m). */
function toLv95(lat, lng) {
  const p = (lat * 3600 - 169028.66) / 10000;
  const l = (lng * 3600 - 26782.5) / 10000;
  return {
    easting: 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p ** 2 - 44.54 * l ** 3,
    northing: 1200147.07 + 308807.95 * p + 3745.25 * l ** 2 + 76.63 * p ** 2 - 194.56 * l ** 2 * p + 119.79 * p ** 3,
  };
}

/** Lieu swisstopo dont le libellé correspond exactement à celui retenu dans le mapping. */
async function findPlace(query, label) {
  const params = new URLSearchParams({ searchText: query, type: 'locations', origins: 'gazetteer', sr: '2056', limit: '50' });
  const { results } = await getJson(`${SEARCH}?${params}`);
  const hit = results.find((r) => placeLabel(r.attrs.label) === label);
  if (!hit) throw new Error(`Lieu introuvable dans le gazetteer : « ${label} » (recherche « ${query} »)`);
  const a = hit.attrs;
  const m = label.match(/\(([A-Z]{2})\) - (.+)$/);
  if (!m) throw new Error(`Canton/commune illisibles : « ${label} »`);
  // sr=2056 : x/y en LV95 (x = nord, y = est) ; lat/lon toujours en WGS84.
  return { lat: a.lat, lng: a.lon, easting: a.y, northing: a.x, canton: m[1], commune: m[2] };
}

async function heightOf({ easting, northing }) {
  const { height } = await getJson(`${HEIGHT}?easting=${easting.toFixed(1)}&northing=${northing.toFixed(1)}&sr=2056`);
  return Math.round(Number(height));
}

function downhillKm(stats) {
  const byDiff = stats?.runs?.byActivity?.downhill?.byDifficulty ?? {};
  return Object.values(byDiff).reduce((sum, d) => sum + (d.lengthInKm || 0), 0);
}

function liftCount(stats) {
  return Object.values(stats?.lifts?.byType ?? {}).reduce((sum, t) => sum + (t.count || 0), 0);
}

async function wikidataWebsite(qid) {
  const data = await getJson(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  return data.entities?.[qid]?.claims?.P856?.[0]?.mainsnak?.datavalue?.value ?? null;
}

/** Remontées en service, avec leurs sommets [lng, lat, altitude] et les domaines auxquels elles appartiennent. */
function prepareLifts(features) {
  const lifts = [];
  for (const f of features) {
    const { status, skiAreas, name } = f.properties;
    if (status && status !== 'operating') continue;
    const g = f.geometry;
    const lines = g?.type === 'LineString' ? [g.coordinates] : g?.type === 'MultiLineString' ? g.coordinates : [];
    const points = lines.flat().filter((c) => c.length > 2);
    if (!points.length) continue;
    lifts.push({ name, areaIds: new Set((skiAreas ?? []).map((a) => a.properties.id)), points });
  }
  return lifts;
}

/** Point le plus haut des remontées liées à la station (gare d'arrivée la plus haute), ou null. */
function highestLiftPoint(lifts, lat, lng, areaId) {
  const near = (lift, radius) => lift.points.some(([x, y]) => distKm(lat, lng, y, x) <= radius);
  const pick = (filter) => {
    let best = null;
    for (const lift of lifts) {
      if (!filter(lift)) continue;
      const top = lift.points.reduce((a, b) => (b[2] > a[2] ? b : a));
      if (!best || top[2] > best.top[2]) best = { top, name: lift.name };
    }
    return best;
  };
  return (
    (areaId && pick((l) => l.areaIds.has(areaId) && near(l, AREA_LIFT_RADIUS_KM))) ||
    pick((l) => near(l, NEARBY_LIFT_RADIUS_KM))
  );
}

/**
 * Règle des pages webcams partagées (D55) : une même URL pour plusieurs stations n'est permise que si
 * ces stations portent toutes le même `webcamsGroup` (domaine, remontées ou destination) ; une URL propre
 * à une seule station n'a pas de groupe. Échoue sinon, pour qu'un lien en double ne passe pas inaperçu.
 */
function checkWebcamGroups(entries) {
  const byUrl = new Map();
  for (const [id, m] of entries) {
    if (!m.webcams) continue;
    byUrl.set(m.webcams, [...(byUrl.get(m.webcams) ?? []), [id, m.webcamsGroup ?? null]]);
  }
  const errors = [];
  for (const [url, list] of byUrl) {
    const groups = new Set(list.map(([, g]) => g));
    if (list.length > 1 && (groups.size > 1 || groups.has(null))) {
      errors.push(`${url} est partagée par ${list.map(([id, g]) => `${id} (${g ?? 'sans groupe'})`).join(', ')}`);
    }
    if (list.length === 1 && list[0][1]) errors.push(`${list[0][0]} a un groupe (« ${list[0][1]} ») mais une page qui n'est pas partagée`);
  }
  if (errors.length) throw new Error(`Pages webcams incohérentes (D55) :\n- ${errors.join('\n- ')}`);
}

async function main() {
  const { stations } = JSON.parse(await readFile(SKIINFO, 'utf8'));
  const mapping = JSON.parse(await readFile(MAPPING, 'utf8'));

  console.log('OpenSkiData : téléchargement des domaines et des remontées…');
  const [osdAreas, osdLifts] = await Promise.all([getJson(OSD_AREAS), getJson(OSD_LIFTS)]);
  const areas = new Map(osdAreas.features.map((f) => [f.properties.id, f.properties]));
  const lifts = prepareLifts(osdLifts.features);

  const kept = stations.filter((s) => !(s.slug in mapping.dropped));
  const missing = kept.filter((s) => !mapping.stations[s.slug]);
  if (missing.length) throw new Error(`Stations sans correspondance : ${missing.map((s) => s.slug).join(', ')}`);
  checkWebcamGroups(kept.map((s) => [s.slug, mapping.stations[s.slug]]));

  const resorts = await mapLimit(kept, 6, async (s) => {
    const m = mapping.stations[s.slug];
    const place = await findPlace(m.query, m.place);
    const elevation = await heightOf(place);

    let area = null;
    let website = null;
    if (m.osdArea) {
      const p = areas.get(m.osdArea);
      if (!p) throw new Error(`Domaine OpenSkiData absent : ${m.osdArea} (${s.slug})`);
      const km = downhillKm(p.statistics);
      area = {
        name: p.name,
        osdId: p.id,
        runsKm: km ? Math.round(km) : null,
        lifts: liftCount(p.statistics) || null,
        minElevation: p.statistics?.minElevation != null ? Math.round(p.statistics.minElevation) : null,
        maxElevation: p.statistics?.maxElevation != null ? Math.round(p.statistics.maxElevation) : null,
        wikidata: p.wikidataID || null,
      };
      website = p.websites?.[0] ?? (p.wikidataID ? await wikidataWebsite(p.wikidataID) : null);
    }

    const top = highestLiftPoint(lifts, place.lat, place.lng, m.osdArea);
    let weatherPoint = null;
    if (top) {
      const [lng, lat] = top.top;
      const topElevation = await heightOf(toLv95(lat, lng));
      // Une remontée voisine plus basse que la station n'est pas « le haut » : on garde alors le lieu de la station.
      if (topElevation > elevation) weatherPoint = { lat: round5(lat), lng: round5(lng), elevation: topElevation, lift: top.name || null };
    }

    return {
      id: s.slug,
      name: s.name,
      short: m.short,
      canton: place.canton,
      commune: place.commune,
      lat: round5(place.lat),
      lng: round5(place.lng),
      elevation,
      weatherPoint,
      level: (area?.runsKm ?? 0) >= LEVEL_2_MIN_RUNS_KM ? 2 : 3,
      webcams: m.webcams ?? null,
      webcamsSource: m.webcamsSource ?? null,
      webcamsGroup: m.webcamsGroup ?? null,
      website,
      place: m.place,
      area,
      skiinfo: s.url,
    };
  });

  await writeFile(OUT, `[\n${resorts.map((r) => `  ${JSON.stringify(r)}`).join(',\n')}\n]\n`);
  const count = (fn) => resorts.filter(fn).length;
  console.log(`${resorts.length} stations → ${OUT}`);
  console.log(
    `Niveau 2 : ${count((r) => r.level === 2)} · point en altitude : ${count((r) => r.weatherPoint)} · ` +
      `webcams : ${count((r) => r.webcams)} · sans domaine OSD : ${count((r) => !r.area)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
