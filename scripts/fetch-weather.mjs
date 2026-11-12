#!/usr/bin/env node
// Produit weather.json pour toutes les stations (D59) :
// - prévision : MétéoSuisse, prévisions locales (open data, « Source : MétéoSuisse »), au point de prévision
//   le plus proche du lieu de chaque station (village ou gare de départ, D44), en distance et en altitude (D61) ;
// - enneigement : SLF, stations automatiques IMIS (CC BY 4.0, lien vers slf.ch obligatoire), à la station IMIS la plus
//   proche (25 km au plus) : neige au sol (dernière mesure du capteur, toutes les 30 min) et neige tombée en 3 jours
//   (estimation du modèle de manteau neigeux du SLF, pas une mesure). Les deux peuvent diverger : en début de saison,
//   la neige tombée fond ou se tasse et le capteur ne voit rien au sol. Fonctionnement complet : docs/METEO.md.
// En production : relevé horaire sur le VPS pegasus (deploy/, docs/VPS.md), servi par
// https://ski.citcatlab.ch/weather.json. Le navigateur ne lit que ce fichier.
//
// Usage : node scripts/fetch-weather.mjs [chemin/de/sortie.json]
//   Sortie par défaut : public/data/weather.json
//   Stations : src/data/resorts.json
//
// Volume : 7 fichiers CSV MétéoSuisse par relevé (≈ 100 Mo, dont trois de ≈ 32 Mo : tous les points de Suisse sur
// 8 jours), lus en flux sans les garder en mémoire ; seules les lignes des points retenus sont conservées.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, process.argv[2] || 'public/data/weather.json');
const RESORTS = resolve(ROOT, 'src/data/resorts.json');

const MCH_STAC = 'https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-local-forecasting';
const MCH_POINTS = 'https://data.geo.admin.ch/ch.meteoschweiz.ogd-local-forecasting/ogd-local-forecasting_meta_point.csv';
const SLF_API = 'https://measurement-api.slf.ch/public/api/imis';
const USER_AGENT = 'bl-iframe-map-ski (https://ski.citcatlab.ch)';
const SOURCE = 'MétéoSuisse, prévisions locales ; SLF, stations IMIS (CC BY 4.0)';

// Paramètres MétéoSuisse lus (ogd-local-forecasting_meta_parameters.csv). Heures en UTC.
const PARAMS = {
  t: 'tre200h0', // température à 2 m, moyenne horaire (°C)
  wind: 'fu3010h0', // vent, moyenne horaire (km/h)
  sym: 'jww003i0', // pictogramme MétéoSuisse sur les 3 heures précédentes
  daySym: 'jp2000d0', // pictogramme du jour (valable en journée)
  max: 'tre200px', // maximum du jour, 00–24 h heure locale (°C)
  min: 'tre200pn', // minimum du jour, 00–24 h heure locale (°C)
  precip: 'rka150p0', // précipitations du jour, 00–24 h heure locale (mm)
};
// Jours de prévision publiés : aujourd'hui + 6, assez pour atteindre le dimanche qui vient quel que soit le jour
// (lundi → dimanche = J+6), pour le mode compact « week-end » ; la fiche affiche les 7 (bandeau), la fiche mobile 3.
const FORECAST_DAYS = 7;
const SHOWN_DAYS = 3; // jours contrôlés par le garde-fou dans tous les cas (fiche mobile) ; le bandeau tolère un trou en fin
const SNOW_DAYS = 3; // neige tombée en 3 jours (SLF)
const TZ = 'Europe/Zurich';

// Choix des points : distance horizontale (km) + écart d'altitude / poids (m par km équivalent).
const MCH_ALTITUDE_WEIGHT = 100; // 100 m d'écart comptent comme 1 km
const SLF_ALTITUDE_WEIGHT = 200;
const SLF_MAX_KM = 25; // au-delà, pas de mesure d'enneigement « proche » pour la station

// Nouvelles tentatives : erreur passagère (5xx, 429, réseau, délai dépassé) ; 4xx : échec direct.
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000];
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(url, timeoutMs) {
  for (let attempt = 0; ; attempt++) {
    let error;
    let res = null;
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) return res;
      error = new Error(`${new URL(url).host} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    } catch (err) {
      error = err; // réseau, délai dépassé
    }
    if (res && !res.ok && !RETRY_STATUS.has(res.status)) throw error;
    if (attempt >= RETRY_DELAYS_MS.length) throw error;
    console.warn(`essai ${attempt + 1} échoué (${error.message.slice(0, 120)}), nouvel essai dans ${RETRY_DELAYS_MS[attempt] / 1000} s`);
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
}
const getJson = async (url) => (await request(url, 20_000)).json();
const getText = async (url, encoding = 'utf-8') => new TextDecoder(encoding).decode(await (await request(url, 60_000)).arrayBuffer());

/** Lignes d'un CSV `;` lu en flux ; `keep(cols)` décide de garder la ligne. En-tête rendu à part. */
async function readCsv(url, keep) {
  const res = await request(url, 120_000);
  const decoder = new TextDecoder('latin1');
  let header = null;
  let rest = '';
  const rows = [];
  const take = (line) => {
    if (!line) return;
    const cols = line.replace(/\r$/, '').split(';');
    if (!header) header = cols;
    else if (keep(cols)) rows.push(cols);
  };
  for await (const chunk of res.body) {
    const lines = (rest + decoder.decode(chunk, { stream: true })).split('\n');
    rest = lines.pop();
    lines.forEach(take);
  }
  take(rest + decoder.decode());
  return { header, rows };
}

const toRad = (d) => (d * Math.PI) / 180;
function km(lat1, lon1, lat2, lon2) {
  const x = toRad(lon2 - lon1) * Math.cos(toRad((lat1 + lat2) / 2));
  return 6371 * Math.hypot(x, toRad(lat2 - lat1));
}
const round1 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10) / 10);
const num = (s) => (s === '' || s == null ? null : Number(s));

/** Point de la prévision : le lieu de la station, village ou gare de départ (D44, D61). */
const villageOf = (r) => ({ lat: r.lat, lng: r.lng, elevation: r.elevation });
/** Point de l'enneigement : le haut du domaine (D51), à défaut le lieu de la station. */
const targetOf = (r) => r.weatherPoint ?? villageOf(r);

function nearest(target, candidates, weight) {
  let best = null;
  for (const c of candidates) {
    const d = km(target.lat, target.lng, c.lat, c.lng);
    const score = d + Math.abs(c.elevation - target.elevation) / weight;
    if (!best || score < best.score) best = { ...c, km: d, score };
  }
  return best;
}

/**
 * Pictogramme MétéoSuisse (1–42 le jour, 101–142 la nuit, table officielle du 14/02/2022) → famille affichée par le
 * widget (src/lib/weather.js). Les orages l'emportent, puis la neige, la pluie et la neige mêlées, les averses.
 * La nuit (code > 100), un ciel dégagé ou peu nuageux devient `clear-night` / `partly-night` (lune au lieu du soleil) ;
 * les autres familles n'ont pas de soleil dans leur picto et restent les mêmes. MétéoSuisse choisit jour ou nuit par
 * créneau de 3 h (bascule constatée au milieu du créneau : voir docs/METEO.md).
 */
const SKY = {};
for (const [sky, codes] of Object.entries({
  sun: [1],
  partly: [2, 3, 26],
  cloud: [4, 5, 35],
  fog: [27, 28],
  showers: [6, 9, 29, 32, 33],
  rain: [14, 17, 20],
  sleet: [7, 10, 15, 18, 21, 31],
  snow: [8, 11, 16, 19, 22, 30, 34],
  storm: [12, 13, 23, 24, 25, 36, 37, 38, 39, 40, 41, 42],
})) for (const c of codes) SKY[c] = sky;
const NIGHT = { sun: 'clear-night', partly: 'partly-night' };
function skyOf(code) {
  if (code == null) return null;
  const sky = SKY[code > 100 ? code - 100 : code];
  if (!sky) console.warn(`pictogramme MétéoSuisse inconnu : ${code}`);
  return (code > 100 && NIGHT[sky]) || (sky ?? null);
}

/** « 202611031000 » (UTC) → Date. */
const mchDate = (s) => new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10), +s.slice(10, 12)));
const localDay = (d) => d.toLocaleDateString('sv-SE', { timeZone: TZ }); // AAAA-MM-JJ, heure suisse

/** Dernier relevé MétéoSuisse complet : le plus récent qui contient les 7 paramètres (aujourd'hui, sinon la veille). */
async function latestRun() {
  const now = new Date();
  for (const back of [0, 1]) {
    const day = new Date(now.getTime() - back * 86_400_000).toISOString().slice(0, 10).replaceAll('-', '');
    let item;
    try {
      item = await getJson(`${MCH_STAC}/items/${day}-ch`);
    } catch (err) {
      if (back === 0) continue;
      throw err;
    }
    const runs = new Map();
    for (const [key, asset] of Object.entries(item.assets)) {
      const m = key.match(/\.(\d{12})\.(\w+)\.csv$/);
      if (!m) continue;
      if (!runs.has(m[1])) runs.set(m[1], {});
      runs.get(m[1])[m[2]] = asset.href;
    }
    const complete = [...runs].filter(([, files]) => Object.values(PARAMS).every((p) => files[p])).sort(([a], [b]) => (a < b ? 1 : -1));
    if (complete.length) return { run: complete[0][0], files: complete[0][1] };
  }
  throw new Error('MétéoSuisse : aucun relevé complet aujourd’hui ni la veille');
}

async function forecast(resorts) {
  const meta = await readCsv(MCH_POINTS, () => true);
  const col = (name) => meta.header.indexOf(name);
  const [iId, iName, iH, iLat, iLon] = ['point_id', 'point_name', 'point_height_masl', 'point_coordinates_wgs84_lat', 'point_coordinates_wgs84_lon'].map(col);
  const points = meta.rows.map((c) => ({ id: c[iId], name: c[iName], elevation: Number(c[iH]), lat: Number(c[iLat]), lng: Number(c[iLon]) }));
  const chosen = new Map(resorts.map((r) => [r.id, nearest(villageOf(r), points, MCH_ALTITUDE_WEIGHT)]));
  const ids = new Set([...chosen.values()].map((p) => p.id));

  const { run, files } = await latestRun();
  const series = {}; // paramètre → point → [[Date, valeur]]
  for (const [key, param] of Object.entries(PARAMS)) {
    const { header, rows } = await readCsv(files[param], (c) => ids.has(c[0]));
    const [iP, iD, iV] = ['point_id', 'Date', param].map((n) => header.indexOf(n));
    const byPoint = new Map();
    for (const c of rows) {
      if (!byPoint.has(c[iP])) byPoint.set(c[iP], []);
      byPoint.get(c[iP]).push([mchDate(c[iD]), num(c[iV])]);
    }
    for (const list of byPoint.values()) list.sort((a, b) => a[0] - b[0]);
    series[key] = byPoint;
  }

  const now = Date.now();
  const lastBefore = (list) => list?.filter(([d]) => d <= now).at(-1)?.[1] ?? list?.[0]?.[1] ?? null; // valeur horaire en cours
  const firstAfter = (list) => list?.find(([d]) => d >= now)?.[1] ?? null; // créneau de 3 h qui contient maintenant
  const days = [...Array(FORECAST_DAYS)].map((_, i) => localDay(new Date(now + i * 86_400_000)));
  const daily = (list) => new Map((list ?? []).map(([d, v]) => [d.toISOString().slice(0, 10), v]));

  const out = {};
  for (const r of resorts) {
    const p = chosen.get(r.id);
    const [sym, max, min, precip] = ['daySym', 'max', 'min', 'precip'].map((k) => daily(series[k].get(p.id)));
    out[r.id] = {
      t: round1(lastBefore(series.t.get(p.id))),
      sky: skyOf(firstAfter(series.sym.get(p.id))),
      wind: round1(lastBefore(series.wind.get(p.id))),
      elevation: Math.round(p.elevation), // altitude du point de prévision (m)
      point: { name: p.name, km: round1(p.km) },
      days: days.map((date) => ({ date, sky: skyOf(sym.get(date)), max: round1(max.get(date)), min: round1(min.get(date)), precip: round1(precip.get(date)) })),
    };
  }
  return { run: mchDate(run).toISOString(), out };
}

async function snow(resorts) {
  const [stations, daily, latest] = await Promise.all([
    getJson(`${SLF_API}/stations`),
    getJson(`${SLF_API}/daily-snow?period_in_days=${SNOW_DAYS}`), // valeurs journalières à 00:00 UTC : HS mesuré, HN_1D modélisé
    getJson(`${SLF_API}/measurements`), // mesures des dernières 24 h, toutes les 30 min (≈ 3 Mo)
  ]);
  const byStation = new Map();
  for (const m of daily) {
    if (!byStation.has(m.station_code)) byStation.set(m.station_code, []);
    byStation.get(m.station_code).push(m);
  }
  for (const list of byStation.values()) list.sort((a, b) => (a.measure_date < b.measure_date ? -1 : 1));
  // Dernière hauteur de neige mesurée par station (capteur, toutes les 30 min).
  const lastHs = new Map();
  for (const m of latest) {
    if (m.HS == null) continue;
    const prev = lastHs.get(m.station_code);
    if (!prev || m.measure_date > prev.measure_date) lastHs.set(m.station_code, m);
  }
  const candidates = stations
    .filter((s) => byStation.has(s.code))
    .map((s) => ({ code: s.code, name: s.label, elevation: s.elevation, lat: s.lat, lng: s.lon }));

  const out = {};
  for (const r of resorts) {
    const s = nearest(targetOf(r), candidates, SLF_ALTITUDE_WEIGHT);
    if (!s || s.km > SLF_MAX_KM) {
      out[r.id] = null;
      continue;
    }
    const last = byStation.get(s.code).slice(-SNOW_DAYS); // aujourd'hui et les 2 jours précédents
    const hn = last.map((m) => m.HN_1D).filter((v) => v != null);
    // Neige au sol : dernière mesure des 24 h ; à défaut (capteur muet), la valeur journalière de 00:00 UTC.
    const now = lastHs.get(s.code) ?? last.findLast((m) => m.HS != null) ?? null;
    out[r.id] = {
      hs: round1(now?.HS ?? null), // neige au sol, mesurée (cm)
      hsAt: now ? new Date(now.measure_date.endsWith('Z') ? now.measure_date : `${now.measure_date}Z`).toISOString() : null, // heure de cette mesure (UTC)
      hn3: hn.length ? round1(hn.reduce((a, b) => a + b, 0)) : null, // neige tombée en 3 jours, estimée par le modèle SLF (cm)
      date: last.at(-1)?.measure_date?.slice(0, 10) ?? null, // dernier jour des valeurs journalières
      station: s.name,
      elevation: Math.round(s.elevation),
      km: round1(s.km),
    };
  }
  return out;
}

async function main() {
  const resorts = JSON.parse(await readFile(RESORTS, 'utf8'));
  const [{ run, out: wx }, sn] = await Promise.all([forecast(resorts), snow(resorts)]);
  const json = {
    generatedAt: new Date().toISOString(),
    forecastRun: run, // relevé MétéoSuisse utilisé (UTC)
    source: SOURCE,
    resorts: Object.fromEntries(resorts.map((r) => [r.id, { ...wx[r.id], snow: sn[r.id] }])),
  };
  assertComplete(json.resorts);

  // Écriture atomique : un lecteur ne voit jamais un fichier à moitié écrit.
  await mkdir(dirname(OUT), { recursive: true });
  const tmp = `${OUT}.tmp`;
  await writeFile(tmp, `${JSON.stringify(json)}\n`);
  await rename(tmp, OUT);
  const withSnow = Object.values(sn).filter(Boolean).length;
  console.log(`weather.json : ${resorts.length} stations (relevé MétéoSuisse ${run}, enneigement SLF pour ${withSnow}) → ${OUT}`);
}

/**
 * Garde-fou avant publication : si une source change de format ou renvoie des trous, mieux vaut garder l'ancien
 * weather.json (échec → relances systemd, puis alerte) que publier des « – » partout. Seuils : 10 % de stations sans
 * température, ciel ou jours complets (les 3 jours de la fiche, et tous les jours jusqu'au prochain dimanche pour le
 * week-end) ; moins de la moitié avec un enneigement (aujourd'hui : 149 sur 154).
 */
function assertComplete(byId) {
  const all = Object.values(byId);
  const count = (test) => all.filter(test).length;
  const untilSunday = untilSundayCount();
  const incomplete = (d) => d.sky == null || d.max == null || d.min == null;
  const problems = [
    ['température', count((w) => w.t == null)],
    ['ciel', count((w) => w.sky == null)],
    ['jours', count((w) => w.days.length !== FORECAST_DAYS || w.days.slice(0, Math.max(SHOWN_DAYS, untilSunday)).some(incomplete))],
  ].filter(([, n]) => n > all.length * 0.1);
  const withSnow = count((w) => w.snow);
  if (withSnow < all.length / 2) problems.push(['enneigement', all.length - withSnow]);
  if (problems.length) {
    throw new Error(`données incomplètes, weather.json non publié : ${problems.map(([k, n]) => `${k} manquant pour ${n} stations`).join(', ')}`);
  }
}

/** Nombre de jours d'aujourd'hui au prochain dimanche compris, à l'heure suisse (dimanche : 1, lundi : 7). */
function untilSundayCount() {
  const wd = new Date().toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ });
  return 7 - ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(wd);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
